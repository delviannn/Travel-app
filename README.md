# Nusantara Journey Tour & Travel

Website katalog perjalanan berbahasa Indonesia untuk Nusantara Journey Tour & Travel di Batam. Situs menggunakan HTML, CSS, dan JavaScript statis dengan Supabase untuk data katalog, autentikasi admin, ulasan, penyimpanan media, serta fungsi AI.

## Menjalankan secara lokal

Buka `index.html` untuk melihat halaman katalog. Untuk mencoba service worker/PWA, jalankan server lokal, misalnya:

```sh
npx serve .
```

Lalu buka alamat localhost yang ditampilkan. Detail konfigurasi Supabase dan Edge Function ada di [`supabase/README.md`](supabase/README.md).

## Fitur

- Landing page, carousel hero, pencarian dan filter paket, halaman detail, layanan, testimoni, alamat, peta, dan tautan WhatsApp.
- Dashboard admin untuk mengelola paket dan moderasi ulasan.
- Cloudflare Turnstile pada autentikasi admin melalui Supabase Auth.
- Edge Function untuk membuat draf deskripsi paket dengan Gemini.
- Tema terang/gelap, layout responsif, dan dukungan instalasi PWA.

Pemesanan dan konfirmasi saat ini dilakukan dengan tim melalui WhatsApp; situs belum menyediakan checkout atau pembayaran online.

## Konfigurasi yang sedang digunakan

Frontend sudah dikonfigurasi memakai URL Supabase dan publishable/anon key di `supabase-config.js`. Nilai tersebut memang digunakan di browser dan bukan secret; keamanan data tetap bergantung pada kebijakan RLS. Sitekey Turnstile juga bersifat publik. Jangan pernah menaruh `service_role` key, Turnstile secret, atau Gemini API key di frontend, Git, maupun dokumen.

Secret Turnstile dan `GEMINI_API_KEY` disimpan di pengaturan server Supabase. Migrasi pembatasan AI sudah diterapkan dan Edge Function `generate-package-description` sudah dideploy. Untuk membuat environment/proyek Supabase baru atau menjalankan ulang migrasi, ikuti [`supabase/README.md`](supabase/README.md).

## Sebelum rilis untuk pelanggan

- Minta persetujuan pemilik atas harga, itinerary, fasilitas, ketersediaan paket, profil bisnis, alamat, kontak, logo, serta materi foto. Data katalog awal adalah estimasi/contoh dan tidak boleh dianggap sebagai penawaran resmi sebelum diverifikasi.
- Terapkan rate limit login yang lebih ketat pada Supabase Auth dan aktifkan MFA untuk akun admin.
- Pertimbangkan CAPTCHA atau rate limit server-side untuk formulir ulasan publik sebelum trafik tinggi. Ulasan memang menunggu moderasi, tetapi belum memiliki pembatasan per IP.
- Lakukan smoke test akhir pada ukuran mobile dan desktop di domain produksi, termasuk katalog, detail, login admin, unggah media, moderasi ulasan, dan tautan WhatsApp.

Nomor WhatsApp yang digunakan saat ini: `0821 2920 7154`.
