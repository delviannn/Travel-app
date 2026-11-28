# Supabase setup

Dokumen ini menjelaskan konfigurasi environment yang sedang digunakan serta cara menyiapkan atau memperbarui proyek Supabase. Frontend memakai publishable key (atau legacy anon key), yang boleh berada di browser. Jangan pernah menaruh `service_role` key, Turnstile secret, atau Gemini API key di frontend atau Git.

## Status deployment saat ini

- Situs sudah menggunakan URL proyek Supabase dan publishable/anon key di `supabase-config.js`.
- Turnstile untuk autentikasi admin sudah dikonfigurasi dan berhasil berfungsi. Sitekey berada di konfigurasi browser; secret pasangannya disimpan di Supabase Auth.
- Migrasi `harden-ai-abuse.sql` sudah diterapkan pada proyek yang ada. Migrasi ini menambah kuota lima permintaan AI per admin per menit.
- Edge Function `generate-package-description` sudah dideploy dan memakai Gemini melalui secret server `GEMINI_API_KEY`.
- Kode rate limit ulasan publik sudah tersedia: maksimal tiga kiriman per IP per jam. Pada proyek produksi, fitur aktif setelah migrasi `enable-public-review-submissions.sql`, Edge Function `submit-public-review`, dan frontend terbaru diterapkan.

## Menyiapkan proyek baru

### 1. Database dan admin

1. Buat proyek Supabase.
2. Jalankan [`schema.sql`](schema.sql) lewat SQL Editor.
3. Buat pengguna admin di **Authentication → Users**.
4. Salin UUID pengguna, lalu daftarkan profil admin aktif:

```sql
insert into public.admin_profiles (id, display_name)
values ('00000000-0000-0000-0000-000000000000', 'Admin Nusantara Journey');
```

Hanya admin dengan profil aktif yang dapat mengubah katalog, mengunggah media, serta menyetujui, menyembunyikan, atau menghapus ulasan. Pengunjung dapat membaca paket dan ulasan yang tampil; ulasan baru menunggu persetujuan admin.

Untuk project yang sudah memiliki skema lama, tinjau dan jalankan migrasi yang diperlukan:

- [`enable-public-review-submissions.sql`](enable-public-review-submissions.sql): menyiapkan kuota ulasan tiga kiriman per IP per jam, mencabut insert langsung dari browser, dan mempertahankan batas panjang serta status visibilitas yang sudah ada.
- [`add-package-videos.sql`](add-package-videos.sql): kolom dan bucket video opsional, dengan upload hanya untuk admin aktif.
- [`harden-ai-abuse.sql`](harden-ai-abuse.sql): kuota penggunaan fungsi AI. Terapkan sebelum deploy fungsi versi yang memakai RPC kuota.

### 2. Konfigurasi website

Salin Project URL dan publishable key (atau legacy anon key) dari **Project Settings → API** ke `supabase-config.js`. Nilai ini untuk akses browser dan harus dilindungi oleh RLS. Jangan masukkan `service_role` key.

Untuk mengaktifkan CAPTCHA, buat widget Cloudflare Turnstile dengan hostname situs, isi sitekey publik sebagai `captchaSiteKey` di `supabase-config.js`, lalu aktifkan CAPTCHA pada **Authentication → Bot and Abuse Protection** menggunakan secret widget yang cocok. Simpan secret hanya di dashboard Supabase.

### 3. Edge Functions

Kiriman ulasan publik harus melewati Edge Function agar rate limit tidak dapat dilewati dengan insert langsung ke REST API.

Untuk proyek yang sudah berjalan, aktifkan bertahap:

1. Deploy fungsi `submit-public-review` dengan `supabase functions deploy submit-public-review`.
2. Jalankan [`enable-public-review-submissions.sql`](enable-public-review-submissions.sql) di SQL Editor. Ini mencabut insert langsung dan mengaktifkan kuota database.
3. Deploy frontend terbaru agar formulir menggunakan fungsi tersebut.

Jika ada jeda saat tahap 2 dan 3, formulir ulasan belum dapat digunakan sampai frontend terbaru terpasang.

Fungsi memeriksa `apikey` terhadap public key yang diinjeksi Edge Runtime. Fungsi memakai secret key server Supabase untuk menyimpan HMAC alamat IP dan membuat baris ulasan tersembunyi; secret itu tidak pernah masuk ke frontend.

### 4. Fungsi AI

Fungsi `generate-package-description` memerlukan secret server `GEMINI_API_KEY`. Secara opsional, atur `GEMINI_MODEL` ke model yang tersedia untuk akun Gemini.

```sh
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase secrets set GEMINI_API_KEY=YOUR_GEMINI_API_KEY GEMINI_MODEL=gemini-3.5-flash-lite
supabase functions deploy generate-package-description
```

Fungsi `generate-package-description` membatasi body permintaan hingga 8 KB, memeriksa sesi dan profil admin aktif, membatasi kuota melalui RPC database, dan mengizinkan origin yang tercantum. Jika memakai domain lain, atur secret `ALLOWED_ORIGINS` sebagai daftar origin persis yang dipisahkan koma, lalu deploy ulang fungsi.

Jangan commit key sungguhan. `.gitignore` mengecualikan file `.env`; `.env.example` hanya untuk nama variabel contoh.

### 5. Data katalog dan media

Buka `/admin.html` dan masuk memakai akun admin. Foto paket menerima JPG, PNG, atau WebP sampai 5 MB. Video MP4 opsional dapat diunggah sampai 30 MB atau ditautkan sebagai URL MP4 langsung.

[`seed-estimate-packages.sql`](seed-estimate-packages.sql) mengisi paket contoh dengan harga dan itinerary estimasi. Jangan tampilkan contoh tersebut sebagai penawaran resmi sebelum dikonfirmasi pemilik.

## Catatan keamanan dan operasional

- Terapkan rate limit login yang lebih ketat melalui **Authentication → Rate Limits**, dan aktifkan MFA untuk akun admin.
- Ulasan anonim disimpan tersembunyi sampai disetujui. Edge Function membatasi kiriman hingga tiga per IP per jam, dan database menolak insert langsung dari browser. CAPTCHA tambahan dapat membantu jika spam terdistribusi masih terjadi.
- Bucket gambar/video publik memang dapat dibaca pengunjung; kebijakan tulis tetap membatasi operasi ke admin aktif.
- Pemesanan dan pembayaran online belum tersedia. Pengunjung menghubungi tim melalui WhatsApp.
