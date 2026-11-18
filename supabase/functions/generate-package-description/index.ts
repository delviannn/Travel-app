import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'Method tidak diizinkan.' }, 405);

  const authorization = request.headers.get('Authorization');
  if (!authorization) return respond({ error: 'Silakan masuk sebagai admin.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!supabaseUrl || !anonKey || !geminiKey) return respond({ error: 'Fungsi AI belum dikonfigurasi.' }, 503);

  const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return respond({ error: 'Sesi admin tidak valid.' }, 401);

  const { data: profile, error: profileError } = await supabase.from('admin_profiles')
    .select('is_active').eq('id', userData.user.id).maybeSingle();
  if (profileError || !profile?.is_active) return respond({ error: 'Akses admin diperlukan.' }, 403);

  let input: Record<string, unknown>;
  try { input = await request.json(); } catch { return respond({ error: 'Isi permintaan tidak valid.' }, 400); }
  const name = text(input.name, 120), destination = text(input.destination, 160);
  const category = text(input.category, 30), duration = text(input.duration, 80);
  const itinerary = Array.isArray(input.itinerary) ? input.itinerary.slice(0, 12).map(x => text(x, 180)) : [];
  if (!name || !destination || !['Domestik', 'Internasional'].includes(category)) {
    return respond({ error: 'Nama, destinasi, dan kategori paket wajib diisi.' }, 400);
  }

  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.8-flash';
  let aiResponse: Response;
  try {
    aiResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
      method: 'POST',
      headers: { 'x-goog-api-key': geminiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: 'Tulis deskripsi singkat paket tur berbahasa Indonesia, hangat dan tepercaya, maksimal 70 kata. Gunakan hanya informasi yang diberikan. Jangan mengarang harga, fasilitas, jadwal, klaim keselamatan, atau detail destinasi. Jika data belum lengkap, arahkan pembaca untuk mengonfirmasi kepada Nusantara Journey.' }] },
        contents: [{ parts: [{ text: JSON.stringify({ name, destination, category, duration, itinerary }) }] }],
        generationConfig: { maxOutputTokens: 180 },
      }),
    });
  } catch {
    return respond({ error: 'Tidak dapat terhubung ke layanan Gemini. Coba lagi sebentar.' }, 502);
  }
  if (!aiResponse.ok) {
    if (aiResponse.status === 400 || aiResponse.status === 404) {
      return respond({ error: `Model Gemini "${model}" tidak tersedia atau permintaannya ditolak. Periksa secret GEMINI_MODEL di Supabase.` }, 502);
    }
    if (aiResponse.status === 401 || aiResponse.status === 403) {
      return respond({ error: 'Key Gemini tidak valid atau belum memiliki akses. Periksa GEMINI_API_KEY di Supabase.' }, 502);
    }
    if (aiResponse.status === 429) {
      return respond({ error: 'Kuota Gemini sedang habis atau mencapai batas. Periksa kuota dan penagihan di Google AI Studio.' }, 502);
    }
    return respond({ error: 'Layanan Gemini sedang bermasalah. Coba lagi nanti.' }, 502);
  }
  const result = await aiResponse.json();
  const description = (result.candidates || []).flatMap((candidate: { content?: { parts?: Array<{ text?: string }> } }) =>
    candidate.content?.parts || []).map((part: { text?: string }) => part.text || '').join('').trim();
  if (!description) return respond({ error: 'AI tidak menghasilkan deskripsi.' }, 502);
  return respond({ description });
});

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

function respond(body: Record<string, string>, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
