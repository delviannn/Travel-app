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
  const openAiKey = Deno.env.get('OPENAI_API_KEY');
  if (!supabaseUrl || !anonKey || !openAiKey) return respond({ error: 'Fungsi AI belum dikonfigurasi.' }, 503);

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

  const model = Deno.env.get('OPENAI_MODEL') || 'gpt-4.1-mini';
  const aiResponse = await fetch('https://api.openai.com/v1/responses', {
    method: 'POST',
    headers: { Authorization: `Bearer ${openAiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      instructions: 'Tulis deskripsi singkat paket tur berbahasa Indonesia, hangat dan tepercaya, maksimal 70 kata. Gunakan hanya informasi yang diberikan. Jangan mengarang harga, fasilitas, jadwal, klaim keselamatan, atau detail destinasi. Jika data belum lengkap, arahkan pembaca untuk mengonfirmasi kepada Nusantara Journey.',
      input: JSON.stringify({ name, destination, category, duration, itinerary }),
      max_output_tokens: 180,
    }),
  });
  if (!aiResponse.ok) return respond({ error: 'Layanan AI gagal membuat deskripsi. Coba lagi nanti.' }, 502);
  const result = await aiResponse.json();
  const description = (result.output || []).flatMap((item: { type?: string; content?: Array<{ type?: string; text?: string }> }) =>
    item.type === 'message' ? item.content || [] : []).filter((part: { type?: string }) => part.type === 'output_text')
    .map((part: { text?: string }) => part.text || '').join('').trim();
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
