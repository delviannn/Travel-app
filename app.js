const WHATSAPP = '6282129207154';
const backend = window.njBackend;
const backendConfigured = Boolean(window.NJ_SUPABASE_CONFIG?.url &&
  !window.NJ_SUPABASE_CONFIG.url.includes('YOUR_PROJECT_REF') &&
  window.NJ_SUPABASE_CONFIG.anonKey && !window.NJ_SUPABASE_CONFIG.anonKey.includes('YOUR_SUPABASE'));
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const money = value => new Intl.NumberFormat('id-ID').format(value);
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
}[char]));
const waLink = (message = 'Halo Nusantara Journey, saya ingin bertanya tentang paket perjalanan.') =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(message)}`;

const startingPackages = [
  { id: 'batam-bintan', name: 'Batam–Bintan Escape', destination: 'Batam · Bintan', category: 'Domestik', duration: '3 hari 2 malam · estimasi', price: 1850000, description: 'Jelajahi suasana kota Batam dan pesona pulau Bintan dalam satu perjalanan. Rute dan fasilitas final dikonfirmasi saat konsultasi.', itinerary: ['Hari 1 — Tiba di Batam, penjemputan dan city tour (rencana)', 'Hari 2 — Perjalanan menuju Bintan dan waktu bebas (rencana)', 'Hari 3 — Sarapan, persiapan kembali (rencana)'], included: ['Transportasi lokal (rencana)', 'Akomodasi 2 malam (rencana)'], excluded: ['Tiket perjalanan menuju Batam', 'Pengeluaran pribadi'], image: './assets/batam-bintan.jpg', visible: true },
  { id: 'batam-city', name: 'Batam City Discovery', destination: 'Batam', category: 'Domestik', duration: '1 hari · estimasi', price: 450000, description: 'Kenali sudut kota Batam dan tempat menariknya bersama perjalanan city tour. Rute dan tiket masuk perlu dikonfirmasi.', itinerary: ['Hari 1 — City tour Batam (rencana)'], included: ['Transportasi lokal (rencana)'], excluded: ['Makan dan tiket masuk', 'Pengeluaran pribadi'], image: './assets/batam-city.jpg', visible: true },
  { id: 'bali-lombok', name: 'Bali & Lombok Highlights', destination: 'Bali · Lombok', category: 'Domestik', duration: '5 hari 4 malam · estimasi', price: 6850000, description: 'Inspirasi perjalanan untuk menikmati dua destinasi favorit Indonesia. Jadwal, transportasi antarpulau, dan fasilitas akan disesuaikan.', itinerary: ['Hari 1 — Tiba di Bali (rencana)', 'Hari 2 — Jelajah Bali (rencana)', 'Hari 3 — Perjalanan menuju Lombok (rencana)', 'Hari 4 — Jelajah Lombok (rencana)', 'Hari 5 — Persiapan kembali (rencana)'], included: ['Akomodasi (rencana)', 'Transportasi lokal (rencana)'], excluded: ['Tiket pesawat', 'Makan di luar program'], image: './assets/bali.jpg', visible: true },
  { id: 'labuan-bajo', name: 'Labuan Bajo Getaway', destination: 'Labuan Bajo', category: 'Domestik', duration: '4 hari 3 malam · estimasi', price: 7950000, description: 'Mulai petualangan dari Labuan Bajo untuk menikmati alam Nusa Tenggara. Rute laut dan kunjungan destinasi bergantung cuaca serta konfirmasi operator.', itinerary: ['Hari 1 — Tiba di Labuan Bajo (rencana)', 'Hari 2 — Perjalanan laut (rencana)', 'Hari 3 — Eksplorasi sekitar Labuan Bajo (rencana)', 'Hari 4 — Persiapan kembali (rencana)'], included: ['Akomodasi (rencana)', 'Transportasi lokal (rencana)'], excluded: ['Tiket pesawat', 'Biaya taman nasional'], image: './assets/labuan-bajo.jpg', visible: true },
  { id: 'singapore', name: 'Singapore City Break', destination: 'Singapura', category: 'Internasional', duration: '3 hari 2 malam · estimasi', price: 4250000, description: 'Nikmati liburan singkat ke Singapura. Ketentuan perjalanan lintas negara, transportasi, dan tiket atraksi dikonfirmasi sebelum pemesanan.', itinerary: ['Hari 1 — Tiba dan check-in (rencana)', 'Hari 2 — Jelajah kota (rencana)', 'Hari 3 — Persiapan kembali (rencana)'], included: ['Akomodasi (rencana)'], excluded: ['Dokumen perjalanan', 'Tiket atraksi dan makan'], image: './assets/singapore.jpg', visible: true },
  { id: 'japan', name: 'Japan Seasonal Journey', destination: 'Jepang', category: 'Internasional', duration: '7 hari 6 malam · estimasi', price: 24800000, description: 'Inspirasi perjalanan untuk menikmati kota dan budaya Jepang. Musim, tanggal keberangkatan, tiket, dan fasilitas sangat memengaruhi harga.', itinerary: ['Hari 1 — Keberangkatan (rencana)', 'Hari 2–6 — Rute Jepang dibahas sesuai musim (rencana)', 'Hari 7 — Persiapan kembali (rencana)'], included: ['Akomodasi (rencana)', 'Transportasi lokal (rencana)'], excluded: ['Visa dan asuransi perjalanan', 'Pengeluaran pribadi'], image: './assets/japan.jpg', visible: true }
];

function readStoredPackages(key) {
  try { return JSON.parse(localStorage.getItem(key) || 'null'); } catch { return null; }
}
let packages = backend?.ready ? (readStoredPackages('nj-public-packages') || []) : (readStoredPackages('nj-packages') || startingPackages);
let catalogLoaded = packages.length > 0;
let catalogRequest = null;
let catalogRefreshPending = false;
let lastCatalogRefresh = 0;

function render() {
  const query = $('#searchInput').value.trim().toLocaleLowerCase('id');
  const category = $('#categoryFilter').value;
  const list = packages.filter(item => item.visible !== false &&
    (category === 'Semua' || item.category === category) &&
    `${item.name} ${item.destination} ${item.description}`.toLocaleLowerCase('id').includes(query));

  $('#packageGrid').innerHTML = list.map(item => `
    <a class="card-link" href="./detail.html?id=${encodeURIComponent(item.id)}" aria-label="Lihat detail ${esc(item.name)}"><article class="card">
      <div class="card-image"><img src="${esc(item.image || startingPackages[0].image)}" data-fallback="${esc(item.imageFallback || item.image || startingPackages[0].image)}" alt="Pemandangan destinasi ${esc(item.destination)}" loading="lazy"><span class="card-category">${esc(item.category.toUpperCase())}</span></div>
      <div class="card-body"><div class="card-meta"><span>⌖ ${esc(item.destination)}</span><span>◷ ${esc(item.duration || 'Durasi belum dikonfirmasi')}</span></div>
        <h3>${esc(item.name)}</h3><p>${esc(item.description)}</p>
        <div class="card-bottom"><div><div class="price-label">HARGA MULAI &middot; PER ORANG</div><div class="price">${item.price ? `Mulai Rp ${money(item.price)}` : 'Hubungi kami'}</div></div>
          <span class="detail-link">Lihat detail &rarr;</span></div>
      </div>
    </article></a>`).join('');
  $('#emptyState').classList.toggle('hidden', list.length > 0 || (backend?.ready && !catalogLoaded));
  const totalVisible = packages.filter(item => item.visible !== false).length;
  $('#resultCount').textContent = `Menampilkan ${list.length} dari ${totalVisible} paket`;
  $('#clearFilters').classList.toggle('hidden', !query && category === 'Semua');
  document.querySelectorAll('[data-destination]').forEach(button => {
    const selected = query === button.dataset.destination.toLocaleLowerCase('id');
    button.classList.toggle('is-selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  observeReveals($('#packageGrid'));
}

async function loadCatalog({ quiet = false } = {}) {
  if (catalogRequest) {
    catalogRefreshPending = true;
    return catalogRequest;
  }
  lastCatalogRefresh = Date.now();
  if (!backend?.ready) {
    if (backendConfigured) {
      $('#catalogStatus').textContent = 'Supabase belum termuat. Periksa koneksi lalu muat ulang halaman.';
      $('#retryCatalog').classList.remove('hidden');
    }
    render();
    return;
  }
  if (!quiet && !catalogLoaded) $('#catalogStatus').textContent = 'Memuat paket wisata…';
  $('#retryCatalog').classList.add('hidden');
  catalogRequest = (async () => {
    try {
      packages = await backend.loadPackages();
      catalogLoaded = true;
      try { localStorage.setItem('nj-public-packages', JSON.stringify(packages)); } catch { /* Storage may be unavailable in private browsing. */ }
      $('#catalogStatus').textContent = '';
      render();
    } catch (error) {
      $('#catalogStatus').textContent = 'Katalog belum dapat dimuat. Paket yang sudah tampil tetap dipertahankan; coba muat ulang.';
      $('#retryCatalog').classList.remove('hidden');
      if (!catalogLoaded) packages = [];
      render();
      console.error('Gagal memuat katalog:', error);
    }
  })();
  try {
    await catalogRequest;
  } finally {
    catalogRequest = null;
    if (catalogRefreshPending) {
      catalogRefreshPending = false;
      return loadCatalog({ quiet: true });
    }
  }
}

async function loadTestimonials() {
  try { const reviews = await backend.loadReviews(); const box = $('#testimonialList'); if (!reviews.length) return; box.innerHTML = reviews.map(review => `<article class="testimonial-card"><div class="testimonial-stars" aria-label="${review.rating} dari 5 bintang">${'&#9733;'.repeat(review.rating)}${'&#9734;'.repeat(5-review.rating)}</div><blockquote>&ldquo;${esc(review.quote)}&rdquo;</blockquote><p>${esc(review.author)}${review.package_name ? ` &middot; ${esc(review.package_name)}` : ''}</p></article>`).join(''); } catch (error) { console.warn('Ulasan belum dapat dimuat:', error); }
}

function refreshWhenReturning() {
  if (document.visibilityState === 'hidden' || Date.now() - lastCatalogRefresh < 1200) return;
  loadCatalog({ quiet: true });
}

function useFallbackImage(event) {
  const image = event.target.closest('img[data-fallback]');
  if (!image || image.dataset.fallbackUsed) return;
  image.dataset.fallbackUsed = 'true';
  image.src = image.dataset.fallback;
}
$('#packageGrid').addEventListener('error', useFallbackImage, true);
$('#searchInput').addEventListener('input', render);
$('#categoryFilter').addEventListener('change', render);
$('#retryCatalog').addEventListener('click', () => loadCatalog());
function clearFilters() {
  $('#searchInput').value = '';
  $('#categoryFilter').value = 'Semua';
  render();
}
$('#clearFilters').addEventListener('click', clearFilters);
$('#emptyReset').addEventListener('click', clearFilters);
document.querySelector('.popular-destinations').addEventListener('click', event => {
  const button = event.target.closest('[data-destination]');
  if (!button) return;
  $('#searchInput').value = button.dataset.destination;
  $('#categoryFilter').value = 'Semua';
  render();
  $('#paket').scrollIntoView({ behavior: 'smooth' });
});

const menuToggle = $('#menuToggle');
const mainNav = $('#mainNav');
function closeMenu() {
  mainNav.classList.remove('is-open');
  menuToggle.setAttribute('aria-expanded', 'false');
  menuToggle.setAttribute('aria-label', 'Buka menu');
}
menuToggle.addEventListener('click', () => {
  const open = menuToggle.getAttribute('aria-expanded') !== 'true';
  menuToggle.setAttribute('aria-expanded', String(open));
  menuToggle.setAttribute('aria-label', open ? 'Tutup menu' : 'Buka menu');
  mainNav.classList.toggle('is-open', open);
});
mainNav.addEventListener('click', event => { if (event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if (event.key === 'Escape') closeMenu(); });
document.addEventListener('click', event => {
  if (mainNav.classList.contains('is-open') && !event.target.closest('.topbar')) closeMenu();
});

const revealObserver = 'IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ? new IntersectionObserver(entries => entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      revealObserver.unobserve(entry.target);
    }
  }), { threshold: 0.12, rootMargin: '0px 0px -24px 0px' }) : null;
function observeReveals(root = document) {
  if (!revealObserver) return;
  root.querySelectorAll('.section, .card, .service-grid article, .why-list article, .contact-card').forEach(element => {
    if (!element.classList.contains('reveal-on-scroll')) {
      element.classList.add('reveal-on-scroll');
      revealObserver.observe(element);
    }
  });
}
observeReveals();

const sectionObserver = 'IntersectionObserver' in window ? new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (!entry.isIntersecting || !entry.target.id) return;
    $$('.nav-link').forEach(link => {
      if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
      else link.removeAttribute('aria-current');
    });
  });
}, { threshold: 0, rootMargin: '-22% 0px -68% 0px' }) : null;
if (sectionObserver) ['paket', 'layanan', 'tentang'].forEach(id => sectionObserver.observe(document.getElementById(id)));

const scrollProgress = $('#scrollProgress');
const backToTop = $('#backToTop');
let scrollFrame = 0;
window.addEventListener('scroll', () => {
  if (scrollFrame) return;
  scrollFrame = requestAnimationFrame(() => {
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    scrollProgress.style.transform = `scaleX(${maxScroll > 0 ? window.scrollY / maxScroll : 0})`;
    backToTop.classList.toggle('is-visible', window.scrollY > 500);
    scrollFrame = 0;
  });
}, { passive: true });
backToTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

$('#year').textContent = new Date().getFullYear();
$$('.wa-link').forEach(link => { link.href = waLink('Halo Nusantara Journey, saya ingin bertanya tentang layanan dan paket perjalanan.'); link.target = '_blank'; link.rel = 'noopener'; });
window.addEventListener('focus', refreshWhenReturning);
window.addEventListener('pageshow', event => { if (event.persisted) refreshWhenReturning(); });
document.addEventListener('visibilitychange', refreshWhenReturning);
window.addEventListener('storage', event => {
  if (event.key === 'nj-package-catalog-updated') loadCatalog({ quiet: true });
});

let installPrompt = null;
const installButton = $('#installApp');
const installMessage = $('#installMessage');
function showInstallMessage(message) {
  installMessage.textContent = message;
  installMessage.classList.remove('hidden');
  window.clearTimeout(showInstallMessage.timer);
  showInstallMessage.timer = window.setTimeout(() => installMessage.classList.add('hidden'), 7000);
}
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault();
  installPrompt = event;
});
installButton.addEventListener('click', async () => {
  if (window.matchMedia('(display-mode: standalone)').matches || navigator.standalone) {
    showInstallMessage('Nusantara Journey sudah terpasang di perangkat ini.');
    return;
  }
  if (!installPrompt) {
    showInstallMessage('Pilih menu browser: “Install app” di Android/Edge, atau Bagikan → Tambahkan ke Layar Utama di iPhone.');
    return;
  }
  installPrompt.prompt();
  const choice = await installPrompt.userChoice;
  showInstallMessage(choice.outcome === 'accepted' ? 'Nusantara Journey sedang dipasang.' : 'Pemasangan dibatalkan. Kamu bisa mencobanya lagi kapan saja.');
  installPrompt = null;
});
window.addEventListener('appinstalled', () => {
  installPrompt = null;
  showInstallMessage('Nusantara Journey berhasil dipasang.');
});

if ('serviceWorker' in navigator) window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));

render();
if (backendConfigured) loadCatalog();
if (backend?.ready) loadTestimonials();
