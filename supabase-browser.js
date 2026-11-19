(() => {
  const config = window.NJ_SUPABASE_CONFIG || {};
  const ready = Boolean(window.supabase?.createClient && config.url?.startsWith('https://') &&
    !config.url.includes('YOUR_PROJECT_REF') && config.anonKey && !config.anonKey.includes('YOUR_SUPABASE'));
  const client = ready ? window.supabase.createClient(config.url, config.anonKey) : null;
  const bucket = 'package-photos';
  const videoBucket = 'package-videos';
  const fallbackImages = {
    'batam-bintan-escape': './assets/batam-bintan.jpg',
    'batam-city-discovery': './assets/batam-city.jpg',
    'bali-lombok-highlights': './assets/bali.jpg',
    'labuan-bajo-getaway': './assets/labuan-bajo.jpg',
    'singapore-city-break': './assets/singapore.jpg',
    'japan-seasonal-journey': './assets/japan.jpg'
  };
  const slugify = value => value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || crypto.randomUUID();

  function mapPackage(row) {
    const image = row.cover_photo_path
      ? client.storage.from(bucket).getPublicUrl(row.cover_photo_path).data.publicUrl
      : fallbackImages[row.slug] || './assets/batam-bintan.jpg';
    const videoUrl = row.video_path
      ? client.storage.from(videoBucket).getPublicUrl(row.video_path).data.publicUrl
      : row.video_url || '';
    return {
      id: row.id, name: row.name, destination: row.destination, category: row.category,
      duration: row.duration, price: row.price_start, videoUrl, videoPath: row.video_path, description: row.description,
      itinerary: row.itinerary || [], included: row.inclusions || [], excluded: row.exclusions || [],
      image, imageFallback: fallbackImages[row.slug] || './assets/batam-bintan.jpg',
      imagePath: row.cover_photo_path, imageAlt: row.cover_photo_alt, visible: row.visible
    };
  }

  async function loadPackages(includeHidden = false) {
    let query = client.from('tour_packages').select('*').order('sort_order').order('created_at', { ascending: false });
    if (!includeHidden) query = query.eq('visible', true);
    const { data, error } = await query;
    if (error) throw error;
    return data.map(mapPackage);
  }

  async function loadReviews(includeHidden = false) {
    let query = client.from('customer_reviews').select('*').order('created_at', { ascending: false });
    if (!includeHidden) query = query.eq('visible', true);
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  async function saveReview(review) {
    const { error } = await client.from('customer_reviews').insert({
      author: review.author, package_name: review.package_name || '', quote: review.quote,
      rating: review.rating, visible: review.visible !== false
    });
    if (error) throw error;
  }

  async function setReviewVisible(id, visible) {
    const { error } = await client.from('customer_reviews').update({ visible }).eq('id', id);
    if (error) throw error;
  }

  async function removeReview(id) {
    const { error } = await client.from('customer_reviews').delete().eq('id', id);
    if (error) throw error;
  }

  async function savePackage(item, file, oldItem, videoFile) {
    const { data: authData } = await client.auth.getUser();
    if (!authData.user) throw new Error('Sesi admin berakhir. Silakan masuk kembali.');
    if (videoFile && (videoFile.type !== 'video/mp4' || videoFile.size > 30 * 1024 * 1024)) throw new Error('Video harus MP4 dengan ukuran maksimal 30 MB.');
    let photoPath = oldItem?.imagePath || null;
    let uploadedPhotoPath = null;
    let uploadedVideoPath = null;
    let videoPath = !videoFile && oldItem?.videoPath && item.videoUrl === oldItem.videoUrl ? oldItem.videoPath : null;
    if (file) {
      if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Foto harus JPG, PNG, atau WebP.');
      if (file.size > 5 * 1024 * 1024) throw new Error('Ukuran foto maksimal 5 MB.');
      const ext = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
      photoPath = `${authData.user.id}/${item.id}-${Date.now()}.${ext}`;
      uploadedPhotoPath = photoPath;
      const { error: uploadError } = await client.storage.from(bucket).upload(photoPath, file, {
        contentType: file.type, cacheControl: '3600', upsert: false
      });
      if (uploadError) throw uploadError;
    }
    if (videoFile) {
      videoPath = `${authData.user.id}/${item.id}-${Date.now()}.mp4`;
      uploadedVideoPath = videoPath;
      const { error: videoUploadError } = await client.storage.from(videoBucket).upload(videoPath, videoFile, {
        contentType: 'video/mp4', cacheControl: '3600', upsert: false
      });
      if (videoUploadError) {
        if (uploadedPhotoPath) await client.storage.from(bucket).remove([uploadedPhotoPath]);
        throw videoUploadError;
      }
    }
    const row = {
      ...(oldItem?.id ? { id: item.id } : {}), name: item.name, slug: slugify(item.name),
      destination: item.destination, category: item.category, duration: item.duration,
      price_start: item.price, video_url: videoPath ? null : (item.videoUrl || null), video_path: videoPath, description: item.description, itinerary: item.itinerary,
      inclusions: item.included, exclusions: item.excluded, cover_photo_path: photoPath,
      cover_photo_alt: item.imageAlt || `Pemandangan ${item.destination}`,
      visible: item.visible, updated_at: new Date().toISOString()
    };
    const { data: savedRow, error } = await client.from('tour_packages').upsert(row).select().single();
    if (error) {
      if (uploadedPhotoPath) await client.storage.from(bucket).remove([uploadedPhotoPath]);
      if (uploadedVideoPath) await client.storage.from(videoBucket).remove([uploadedVideoPath]);
      throw error;
    }
    if (file && oldItem?.imagePath && oldItem.imagePath !== photoPath) {
      const { error: oldPhotoError } = await client.storage.from(bucket).remove([oldItem.imagePath]);
      if (oldPhotoError) console.warn('Foto baru tersimpan, tetapi foto lama perlu dibersihkan dari Storage.', oldPhotoError);
    }
    if (oldItem?.videoPath && oldItem.videoPath !== videoPath) {
      const { error: oldVideoError } = await client.storage.from(videoBucket).remove([oldItem.videoPath]);
      if (oldVideoError) console.warn('Video baru tersimpan, tetapi video lama perlu dibersihkan dari Storage.', oldVideoError);
    }
    return mapPackage(savedRow);
  }

  async function removePackage(item) {
    const { error } = await client.from('tour_packages').delete().eq('id', item.id);
    if (error) throw error;
    if (item.imagePath) {
      const { error: photoError } = await client.storage.from(bucket).remove([item.imagePath]);
      if (photoError) console.warn('Paket terhapus, tetapi foto perlu dibersihkan dari Storage.', photoError);
    }
    if (item.videoPath) {
      const { error: videoError } = await client.storage.from(videoBucket).remove([item.videoPath]);
      if (videoError) console.warn('Paket terhapus, tetapi video perlu dibersihkan dari Storage.', videoError);
    }
  }

  async function setVisible(item, visible) {
    const { error } = await client.from('tour_packages').update({ visible, updated_at: new Date().toISOString() }).eq('id', item.id);
    if (error) throw error;
  }

  async function signIn(email, password) {
    const { data, error } = await client.auth.signInWithPassword({ email, password });
    if (error) throw error;
    try {
      await requireAdmin(data.user);
    } catch (error) {
      await client.auth.signOut();
      throw error;
    }
    return data.user;
  }

  async function requireAdmin(user) {
    const { data: profile, error } = await client.from('admin_profiles')
      .select('id,is_active').eq('id', user.id).maybeSingle();
    if (error) throw error;
    if (!profile?.is_active) throw new Error('Akun ini belum diberi akses admin. Minta pemilik proyek mengaktifkannya.');
    return user;
  }

  async function currentAdmin() {
    const { data, error } = await client.auth.getUser();
    if (error) throw error;
    return data.user ? requireAdmin(data.user) : null;
  }

  async function signOut() {
    const { error } = await client.auth.signOut();
    if (error) throw error;
  }

  async function changePassword(email, currentPassword, newPassword) {
    const { error: verifyError } = await client.auth.signInWithPassword({ email, password: currentPassword });
    if (verifyError) throw new Error('Kata sandi saat ini tidak sesuai.');
    const { error } = await client.auth.updateUser({ password: newPassword });
    if (error) throw error;
  }

  async function generateDescription(details) {
    const { data, error } = await client.functions.invoke('generate-package-description', { body: details });
    if (error) {
      let message = error.message || 'AI gagal membuat deskripsi.';
      try {
        const response = error.context;
        if (response && typeof response.json === 'function') {
          const body = await response.json();
          if (typeof body?.error === 'string') message = body.error;
        }
      } catch { /* Keep the SDK error when the response has no JSON body. */ }
      throw new Error(message);
    }
    if (!data?.description) throw new Error('AI belum mengembalikan deskripsi.');
    return data.description;
  }

  window.njBackend = {
    ready, client, loadPackages, loadReviews, saveReview, setReviewVisible, removeReview, savePackage, removePackage, setVisible,
    signIn, currentAdmin, signOut, changePassword, generateDescription
  };
})();
