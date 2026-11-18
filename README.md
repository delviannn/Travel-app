# Nusantara Journey Tour & Travel

Website katalog berbahasa Indonesia berdasarkan `PRD Website Nusantara Journey Tour & Travel.docx`. Frontend menggunakan HTML/CSS/JavaScript dan backend Supabase.

## Menjalankan

Buka `index.html` langsung untuk melihat katalog. Untuk mencoba PWA dan service worker, jalankan lewat server lokal, misalnya `npx serve .`, lalu buka alamat localhost yang ditampilkan.

## Isi prototipe

- Profil singkat, layanan, alasan memilih Nusantara Journey, paket domestik dan internasional, detail paket, alamat, peta, serta tombol WhatsApp.
- Paket awal dan harga adalah contoh estimasi, bukan penawaran resmi. Itinerary dan fasilitas juga rencana contoh yang perlu disetujui pemilik.
- Foto katalog lokal memakai gambar ilustrasi dari Unsplash. Logo NJ adalah rancangan monogram sementara, bukan logo resmi.
- Supabase menangani katalog, autentikasi admin, RLS, dan foto. Konfigurasi masih placeholder.
- Fungsi AI deskripsi menggunakan Supabase Edge Function; API key disimpan sebagai secret server.
- Setup database, pembuatan admin, konfigurasi proyek, dan deployment fungsi ada di [`supabase/README.md`](supabase/README.md).

## Sebelum rilis

Sebelum backend aktif, isi `.env.local` sebagai catatan lokal, lalu salin Project URL dan publishable/anon key ke `supabase-config.js` untuk situs HTML statis. Buat akun admin di Supabase Auth, daftarkan di `admin_profiles`, lalu tambahkan OpenAI API key sebagai Supabase secret untuk fitur AI. Harga/itinerary masih estimasi dan materi usaha perlu disetujui pemilik. Nomor WhatsApp mengikuti nomor yang diberikan pengguna: `0821 2920 7154`.
