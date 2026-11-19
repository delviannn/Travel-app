(() => {
  const backend = window.njBackend;
  const configured = Boolean(window.NJ_SUPABASE_CONFIG?.url &&
    !window.NJ_SUPABASE_CONFIG.url.includes('YOUR_PROJECT_REF') &&
    window.NJ_SUPABASE_CONFIG.anonKey && !window.NJ_SUPABASE_CONFIG.anonKey.includes('YOUR_SUPABASE'));
  const $ = selector => document.querySelector(selector);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[char]));
  const money = value => new Intl.NumberFormat('id-ID').format(value);
  let packages = [];
  let reviews = [];
  let adminEmail = '';

  function showMessage(message, kind = '') {
    const node = $('#adminNotice');
    node.textContent = message;
    node.className = `admin-notice ${kind}`.trim();
  }

  function notifyCatalogChanged() {
    localStorage.setItem('nj-package-catalog-updated', String(Date.now()));
  }

  function renderList() {
    $('#adminList').innerHTML = packages.map(item => `
      <article class="admin-list-item">
        <div class="admin-list-copy"><strong>${esc(item.name)}</strong><small>${esc(item.destination)} · ${esc(item.category)} · ${item.visible === false ? 'Disembunyikan' : item.price ? `Rp ${money(item.price)}` : 'Hubungi kami'}</small></div>
        <div class="admin-actions"><button type="button" data-edit="${esc(item.id)}">Edit</button><button type="button" data-toggle="${esc(item.id)}">${item.visible === false ? 'Tampilkan' : 'Sembunyikan'}</button><button type="button" class="delete" data-delete="${esc(item.id)}">Hapus</button></div>
      </article>`).join('') || '<p class="admin-empty">Belum ada paket. Tambahkan paket menggunakan formulir.</p>';
  }

  function showDashboard(user) {
    adminEmail = user?.email || '';
    $('#loginPanel').classList.add('hidden');
    $('#dashboardPanel').classList.remove('hidden');
    $('#adminWelcome').textContent = adminEmail ? `Masuk sebagai ${adminEmail}. Perubahan katalog langsung tersimpan.` : 'Masuk sebagai admin.';
    loadPackages();
    loadReviews();
  }

  async function loadPackages() {
    $('#adminList').innerHTML = '<p class="admin-empty">Memuat paket…</p>';
    try {
      if (backend?.ready) packages = await backend.loadPackages(true);
      else packages = JSON.parse(localStorage.getItem('nj-packages') || 'null') || [];
      renderList();
      showMessage(`${packages.length} paket berhasil dimuat.`, 'success');
    } catch (error) {
      renderList();
      showMessage(error.message || 'Paket belum dapat dimuat. Coba muat ulang.', 'error');
    }
  }

  async function loadReviews() {
    const list = $('#reviewAdminList');
    if (!backend?.ready) { list.innerHTML = '<p class="admin-empty">Hubungkan Supabase untuk mengelola ulasan bersama.</p>'; return; }
    list.innerHTML = '<p class="admin-empty">Memuat ulasan...</p>';
    try { reviews = await backend.loadReviews(true); renderReviews(); }
    catch (error) { list.innerHTML = '<p class="error">' + esc(error.message || 'Gagal memuat ulasan.') + '</p>'; }
  }

  function renderReviews() {
    $('#reviewAdminList').innerHTML = reviews.map(item => '<article class="admin-list-item review-admin-item"><div class="admin-list-copy"><strong>' + esc(item.author) + ' &middot; ' + '&#9733;'.repeat(item.rating) + '</strong><small>' + esc(item.package_name || 'Tanpa nama paket') + ' &middot; ' + (item.visible ? 'Tampil' : 'Disembunyikan') + '<br>' + esc(item.quote) + '</small></div><div class="admin-actions"><button type="button" data-review-toggle="' + esc(item.id) + '">' + (item.visible ? 'Sembunyikan' : 'Tampilkan') + '</button><button type="button" class="delete" data-review-delete="' + esc(item.id) + '">Hapus</button></div></article>').join('') || '<p class="admin-empty">Belum ada ulasan pelanggan.</p>';
  }

  $('#reviewAdminList').addEventListener('click', async event => {
    const button = event.target.closest('[data-review-toggle],[data-review-delete]'); if (!button) return;
    const item = reviews.find(review => review.id === (button.dataset.reviewToggle || button.dataset.reviewDelete)); if (!item) return;
    button.disabled = true;
    try { if (button.dataset.reviewToggle) await backend.setReviewVisible(item.id, !item.visible); else if (confirm('Hapus ulasan ini?')) await backend.removeReview(item.id); else return; await loadReviews(); }
    catch (error) { showMessage(error.message || 'Perubahan ulasan gagal.', 'error'); }
    finally { button.disabled = false; }
  });
  $('#reloadReviews').addEventListener('click', loadReviews);

  function resetForm() {
    $('#packageForm').reset();
    $('#editId').value = '';
    $('#formHeading').textContent = 'Tambah paket';
    $('#cancelEdit').classList.add('hidden');
    $('#packageMessage').textContent = '';
  }

  function editPackage(item) {
    $('#editId').value = item.id;
    $('#pName').value = item.name || '';
    $('#pDestination').value = item.destination || '';
    $('#pCategory').value = item.category || 'Domestik';
    $('#pPrice').value = item.price || '';
    $('#pVideoUrl').value = item.videoUrl || '';
    $('#pDuration').value = item.duration || '';
    $('#pDescription').value = item.description || '';
    $('#pItinerary').value = (item.itinerary || []).join('\n');
    $('#pIncluded').value = (item.included || []).join('\n');
    $('#pExcluded').value = (item.excluded || []).join('\n');
    $('#formHeading').textContent = 'Edit paket';
    $('#cancelEdit').classList.remove('hidden');
    $('#packageMessage').textContent = '';
    $('#pName').focus();
    document.querySelector('.package-editor').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function lines(value) {
    return value.split('\n').map(line => line.trim()).filter(Boolean);
  }

  $('#loginForm').addEventListener('submit', async event => {
    event.preventDefault();
    const email = $('#loginEmail').value.trim();
    const password = $('#loginPassword').value;
    $('#loginError').textContent = '';
    try {
      let user;
      if (backend?.ready) user = await backend.signIn(email, password);
      else throw new Error(configured ? 'Supabase belum termuat. Periksa koneksi lalu muat ulang halaman.' : 'Panel admin belum dikonfigurasi. Hubungkan Supabase untuk mengaktifkan login admin.');
      showDashboard(user);
    } catch (error) {
      $('#loginError').textContent = error.message || 'Tidak dapat masuk. Periksa email dan kata sandi.';
    }
  });

  $('#packageForm').addEventListener('submit', async event => {
    event.preventDefault();
    const button = event.submitter || $('#packageForm button[type="submit"]');
    const existingId = $('#editId').value;
    const oldItem = packages.find(item => item.id === existingId);
    const file = $('#pImage').files[0];
    const videoFile = $('#pVideoFile').files[0];
    const item = {
      id: existingId || crypto.randomUUID(),
      name: $('#pName').value.trim(),
      destination: $('#pDestination').value.trim(),
      category: $('#pCategory').value,
      price: Number($('#pPrice').value) || null,
      videoUrl: videoFile ? '' : $('#pVideoUrl').value.trim(),
      duration: $('#pDuration').value.trim() || 'Belum dikonfirmasi',
      description: $('#pDescription').value.trim(),
      itinerary: lines($('#pItinerary').value),
      included: lines($('#pIncluded').value),
      excluded: lines($('#pExcluded').value),
      image: oldItem?.image || './assets/batam-bintan.jpg',
      imagePath: oldItem?.imagePath || null,
      imageAlt: oldItem?.imageAlt || '',
      visible: oldItem?.visible !== false
    };
    if (videoFile && (videoFile.type !== 'video/mp4' || videoFile.size > 30 * 1024 * 1024)) {
      $('#packageMessage').textContent = 'Video harus MP4 dengan ukuran maksimal 30 MB.';
      return;
    }
    if (item.videoUrl) {
      let video;
      try { video = new URL(item.videoUrl); } catch { video = null; }
      const supabaseOrigin = window.NJ_SUPABASE_CONFIG?.url ? new URL(window.NJ_SUPABASE_CONFIG.url).origin : '';
      const allowedHosts = ['cdn.coverr.co', 'videos.pexels.com', 'cdn.pixabay.com'];
      if (!video || video.protocol !== 'https:' || !video.pathname.toLowerCase().endsWith('.mp4') || (!allowedHosts.includes(video.hostname) && video.origin !== location.origin && video.origin !== supabaseOrigin)) {
        $('#packageMessage').textContent = 'Masukkan URL file MP4 langsung dari Coverr, Pexels, Pixabay, atau situs ini.';
        return;
      }
    }
    if (file && file.size > 5 * 1024 * 1024) {
      $('#packageMessage').textContent = 'Ukuran foto maksimal 5 MB.';
      return;
    }
    button.disabled = true;
    $('#packageMessage').textContent = 'Menyimpan perubahan…';
    try {
      if (backend?.ready) {
        const savedItem = await backend.savePackage(item, file, oldItem, videoFile);
        if (savedItem) item.id = savedItem.id;
        packages = oldItem ? packages.map(existing => existing.id === oldItem.id ? (savedItem || item) : existing) : [savedItem || item, ...packages];
      } else {
        if (file) {
          if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) throw new Error('Foto harus JPG, PNG, atau WebP.');
          item.image = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
        }
        packages = oldItem ? packages.map(existing => existing.id === oldItem.id ? item : existing) : [item, ...packages];
        localStorage.setItem('nj-packages', JSON.stringify(packages));
      }
      renderList();
      resetForm();
      notifyCatalogChanged();
      showMessage(oldItem ? 'Paket berhasil diperbarui dan katalog disegarkan.' : 'Paket berhasil ditambahkan dan katalog disegarkan.', 'success');
    } catch (error) {
      $('#packageMessage').textContent = error.message || 'Paket gagal disimpan. Periksa koneksi lalu coba lagi.';
    } finally {
      button.disabled = false;
    }
  });

  $('#adminList').addEventListener('click', async event => {
    const button = event.target.closest('button[data-edit],button[data-toggle],button[data-delete]');
    if (!button) return;
    const id = button.dataset.edit || button.dataset.toggle || button.dataset.delete;
    const item = packages.find(entry => entry.id === id);
    if (!item) return;
    if (button.dataset.edit) { editPackage(item); return; }
    if (button.dataset.delete && !confirm(`Hapus paket “${item.name}”? Tindakan ini tidak dapat dibatalkan.`)) return;
    button.disabled = true;
    try {
      if (button.dataset.delete) {
        if (backend?.ready) await backend.removePackage(item);
        packages = packages.filter(entry => entry.id !== id);
        if (!backend?.ready) localStorage.setItem('nj-packages', JSON.stringify(packages));
        renderList();
        notifyCatalogChanged();
        showMessage(`Paket “${item.name}” sudah dihapus dari katalog.`, 'success');
      } else if (button.dataset.toggle) {
        const visible = item.visible === false;
        if (backend?.ready) await backend.setVisible(item, visible);
        item.visible = visible;
        if (!backend?.ready) localStorage.setItem('nj-packages', JSON.stringify(packages));
        renderList();
        notifyCatalogChanged();
        showMessage(visible ? 'Paket sekarang tampil di katalog.' : 'Paket disembunyikan dari katalog.', 'success');
      }
    } catch (error) {
      showMessage(error.message || 'Perubahan gagal disimpan. Coba lagi.', 'error');
    } finally {
      button.disabled = false;
    }
  });

  $('#generateDescription').addEventListener('click', async event => {
    const button = event.currentTarget;
    const name = $('#pName').value.trim();
    const destination = $('#pDestination').value.trim();
    if (!name || !destination) {
      $('#packageMessage').textContent = 'Isi nama paket dan destinasi terlebih dahulu.';
      return;
    }
    button.disabled = true;
    $('#packageMessage').textContent = 'AI sedang menyusun draf…';
    try {
      if (!backend?.ready) throw new Error('Hubungkan Supabase untuk memakai AI.');
      $('#pDescription').value = await backend.generateDescription({
        name, destination, category: $('#pCategory').value,
        duration: $('#pDuration').value.trim(), itinerary: lines($('#pItinerary').value)
      });
      $('#packageMessage').textContent = 'Draf selesai. Periksa dan sesuaikan sebelum menyimpan.';
    } catch (error) {
      $('#packageMessage').textContent = error.message || 'AI gagal membuat deskripsi.';
    } finally {
      button.disabled = false;
    }
  });

  $('#cancelEdit').addEventListener('click', resetForm);
  $('#reloadPackages').addEventListener('click', loadPackages);
  $('#logout').addEventListener('click', async () => {
    if (backend?.ready) {
      try { await backend.signOut(); } catch (error) { showMessage(error.message || 'Tidak dapat keluar.', 'error'); return; }
    }
    packages = [];
    $('#dashboardPanel').classList.add('hidden');
    $('#loginPanel').classList.remove('hidden');
    $('#loginPassword').value = '';
    $('#loginError').textContent = '';
    showMessage('Kamu sudah keluar dari dashboard.', 'success');
  });

  $('#changePass').addEventListener('click', async () => {
    const message = $('#passMessage');
    const oldPassword = $('#oldPass').value;
    const newPassword = $('#newPass').value;
    const confirmation = $('#confirmPass').value;
    if (newPassword.length < 8) { message.textContent = 'Kata sandi baru minimal 8 karakter.'; return; }
    if (newPassword !== confirmation) { message.textContent = 'Konfirmasi kata sandi belum cocok.'; return; }
    try {
      if (backend?.ready) await backend.changePassword(adminEmail, oldPassword, newPassword);
      else throw new Error('Hubungkan Supabase untuk mengubah kata sandi admin.');
      message.textContent = 'Kata sandi berhasil diperbarui.';
      $('#oldPass').value = $('#newPass').value = $('#confirmPass').value = '';
    } catch (error) {
      message.textContent = error.message || 'Kata sandi gagal diperbarui.';
    }
  });

  async function restoreSession() {
    if (!backend?.ready) {
      $('#loginHelp').textContent = configured
        ? 'Supabase belum termuat. Periksa koneksi lalu muat ulang halaman.'
        : 'Panel admin belum dikonfigurasi. Hubungkan Supabase untuk mengaktifkan akses admin.';
      return;
    }
    try {
      const user = await backend.currentAdmin();
      if (user) showDashboard(user);
    } catch (error) {
      $('#loginError').textContent = error.message || 'Sesi admin tidak dapat diperiksa. Silakan masuk kembali.';
    }
  }

  restoreSession();
})();
