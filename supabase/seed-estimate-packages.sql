-- Optional starter catalog. Prices and itineraries below are estimates for the prototype.
-- Run in Supabase SQL Editor after schema.sql. Re-running will not duplicate these slugs.
insert into public.tour_packages
  (name, slug, destination, category, duration, price_start, description, itinerary, inclusions, exclusions, visible, sort_order)
values
  (
    'Batam–Bintan Escape', 'batam-bintan-escape', 'Batam · Bintan', 'Domestik',
    '3 hari 2 malam · estimasi', 1850000,
    'Jelajahi suasana kota Batam dan pesona pulau Bintan dalam satu perjalanan. Rute dan fasilitas final dikonfirmasi saat konsultasi.',
    '["Hari 1 — Tiba di Batam, penjemputan dan city tour (rencana)", "Hari 2 — Perjalanan menuju Bintan dan waktu bebas (rencana)", "Hari 3 — Sarapan dan persiapan kembali (rencana)"]'::jsonb,
    '["Transportasi lokal (rencana)", "Akomodasi 2 malam (rencana)"]'::jsonb,
    '["Tiket perjalanan menuju Batam", "Pengeluaran pribadi"]'::jsonb, true, 1
  ),
  (
    'Batam City Discovery', 'batam-city-discovery', 'Batam', 'Domestik',
    '1 hari · estimasi', 450000,
    'Kenali sudut kota Batam dan tempat menariknya bersama perjalanan city tour. Rute dan tiket masuk perlu dikonfirmasi.',
    '["Hari 1 — City tour Batam (rencana)"]'::jsonb,
    '["Transportasi lokal (rencana)"]'::jsonb,
    '["Makan dan tiket masuk", "Pengeluaran pribadi"]'::jsonb, true, 2
  ),
  (
    'Bali & Lombok Highlights', 'bali-lombok-highlights', 'Bali · Lombok', 'Domestik',
    '5 hari 4 malam · estimasi', 6850000,
    'Inspirasi perjalanan untuk menikmati dua destinasi favorit Indonesia. Jadwal, transportasi antarpulau, dan fasilitas akan disesuaikan.',
    '["Hari 1 — Tiba di Bali (rencana)", "Hari 2 — Jelajah Bali (rencana)", "Hari 3 — Perjalanan menuju Lombok (rencana)", "Hari 4 — Jelajah Lombok (rencana)", "Hari 5 — Persiapan kembali (rencana)"]'::jsonb,
    '["Akomodasi (rencana)", "Transportasi lokal (rencana)"]'::jsonb,
    '["Tiket pesawat", "Makan di luar program"]'::jsonb, true, 3
  ),
  (
    'Labuan Bajo Getaway', 'labuan-bajo-getaway', 'Labuan Bajo', 'Domestik',
    '4 hari 3 malam · estimasi', 7950000,
    'Mulai petualangan dari Labuan Bajo untuk menikmati alam Nusa Tenggara. Rute laut dan kunjungan destinasi bergantung cuaca serta konfirmasi operator.',
    '["Hari 1 — Tiba di Labuan Bajo (rencana)", "Hari 2 — Perjalanan laut (rencana)", "Hari 3 — Eksplorasi sekitar Labuan Bajo (rencana)", "Hari 4 — Persiapan kembali (rencana)"]'::jsonb,
    '["Akomodasi (rencana)", "Transportasi lokal (rencana)"]'::jsonb,
    '["Tiket pesawat", "Biaya taman nasional"]'::jsonb, true, 4
  ),
  (
    'Singapore City Break', 'singapore-city-break', 'Singapura', 'Internasional',
    '3 hari 2 malam · estimasi', 4250000,
    'Nikmati liburan singkat ke Singapura. Ketentuan perjalanan lintas negara, transportasi, dan tiket atraksi dikonfirmasi sebelum pemesanan.',
    '["Hari 1 — Tiba dan check-in (rencana)", "Hari 2 — Jelajah kota (rencana)", "Hari 3 — Persiapan kembali (rencana)"]'::jsonb,
    '["Akomodasi (rencana)"]'::jsonb,
    '["Dokumen perjalanan", "Tiket atraksi dan makan"]'::jsonb, true, 5
  ),
  (
    'Japan Seasonal Journey', 'japan-seasonal-journey', 'Jepang', 'Internasional',
    '7 hari 6 malam · estimasi', 24800000,
    'Inspirasi perjalanan untuk menikmati kota dan budaya Jepang. Musim, tanggal keberangkatan, tiket, dan fasilitas sangat memengaruhi harga.',
    '["Hari 1 — Keberangkatan (rencana)", "Hari 2–6 — Rute Jepang dibahas sesuai musim (rencana)", "Hari 7 — Persiapan kembali (rencana)"]'::jsonb,
    '["Akomodasi (rencana)", "Transportasi lokal (rencana)"]'::jsonb,
    '["Visa dan asuransi perjalanan", "Pengeluaran pribadi"]'::jsonb, true, 6
  )
on conflict (slug) do nothing;
