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
    <article class="card">
      <div class="card-image"><img src="${esc(item.image || startingPackages[0].image)}" data-fallback="${esc(item.imageFallback || item.image || startingPackages[0].image)}" alt="Pemandangan destinasi ${esc(item.destination)}" loading="lazy"><span class="card-category">${esc(item.category.toUpperCase())}</span></div>
      <div class="card-body"><div class="card-meta"><span>⌖ ${esc(item.destination)}</span><span>◷ ${esc(item.duration || 'Durasi belum dikonfirmasi')}</span></div>
        <h3>${esc(item.name)}</h3><p>${esc(item.description)}</p>
        <div class="card-bottom"><div><div class="price-label">HARGA ESTIMASI · PER ORANG</div><div class="price">${item.price ? `Mulai Rp ${money(item.price)}` : 'Hubungi kami'}</div></div>
          <button class="detail-link" data-detail="${esc(item.id)}">Lihat detail ↗</button></div>
      </div>
    </article>`).join('');
  $('#emptyState').classList.toggle('hidden', list.length > 0);
}

function detail(id) {
  const item = packages.find(entry => entry.id === id && entry.visible !== false);
  if (!item) {
    $('#detailContent').innerHTML = '<h2>Paket tidak tersedia</h2><p class="muted">Paket ini mungkin sudah tidak ditampilkan. Kembali ke katalog untuk melihat pilihan lain.</p><a class="button navy" href="#paket" data-close="detailDialog">Kembali ke katalog</a>';
    $('#detailDialog').showModal();
    return;
  }
  const message = `Halo Nusantara Journey, saya ingin bertanya tentang paket ${item.name} (${item.destination}). Mohon info jadwal, harga terbaru, dan fasilitasnya.`;
  $('#detailContent').innerHTML = `
    <img class="detail-img" src="${esc(item.image || startingPackages[0].image)}" data-fallback="${esc(item.imageFallback || item.image || startingPackages[0].image)}" alt="${esc(item.destination)}">
    <div class="eyebrow dark">${esc(item.category.toUpperCase())} · ${esc(item.destination)}</div><h2>${esc(item.name)}</h2>
    <div class="detail-meta">⌖ ${esc(item.destination)} &nbsp; · &nbsp; ◷ ${esc(item.duration || 'Durasi belum dikonfirmasi')}</div>
    <p class="muted">${esc(item.description)}</p><div class="detail-columns">
      <div><h3>Rencana itinerary</h3><ul>${(item.itinerary || []).map(entry => `<li>${esc(entry)}</li>`).join('') || '<li>Itinerary menunggu konfirmasi.</li>'}</ul></div>
      <div><h3>Fasilitas</h3><b>Termasuk</b><ul>${(item.included || []).map(entry => `<li>${esc(entry)}</li>`).join('') || '<li>Menunggu konfirmasi</li>'}</ul><b>Tidak termasuk</b><ul>${(item.excluded || []).map(entry => `<li>${esc(entry)}</li>`).join('') || '<li>Menunggu konfirmasi</li>'}</ul></div>
    </div><div class="price detail-price">${item.price ? `Estimasi mulai Rp ${money(item.price)} / orang` : 'Hubungi kami untuk informasi harga'}</div>
    <p class="estimate-warning">Harga dan rencana perjalanan di atas adalah estimasi untuk prototipe. Konfirmasi detail dan ketersediaan kepada tim.</p>
    <a class="button navy" target="_blank" rel="noopener" href="${waLink(message)}">Tanyakan paket via WhatsApp ↗</a>`;
  $('#detailDialog').showModal();
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
      $('#catalogStatus').textContent = 'Harga paket adalah estimasi. Tanyakan ketersediaan dan detail terbaru kepada tim.';
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

function refreshWhenReturning() {
  if (document.visibilityState === 'hidden' || Date.now() - lastCatalogRefresh < 1200) return;
  loadCatalog({ quiet: true });
}

$$('[data-close]').forEach(button => button.addEventListener('click', () => $('#' + button.dataset.close).close()));
$('#detailBack').addEventListener('click', () => $('#detailDialog').close());
$('#packageGrid').addEventListener('click', event => {
  const button = event.target.closest('[data-detail]');
  if (button) detail(button.dataset.detail);
});
function useFallbackImage(event) {
  const image = event.target.closest('img[data-fallback]');
  if (!image || image.dataset.fallbackUsed) return;
  image.dataset.fallbackUsed = 'true';
  image.src = image.dataset.fallback;
}
$('#packageGrid').addEventListener('error', useFallbackImage, true);
$('#detailContent').addEventListener('error', useFallbackImage, true);
$('#detailContent').addEventListener('click', event => {
  const closeLink = event.target.closest('[data-close="detailDialog"]');
  if (closeLink) { event.preventDefault(); $('#detailDialog').close(); document.querySelector('#paket').scrollIntoView(); }
});
$('#searchInput').addEventListener('input', render);
$('#categoryFilter').addEventListener('change', render);
$('#retryCatalog').addEventListener('click', () => loadCatalog());
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
