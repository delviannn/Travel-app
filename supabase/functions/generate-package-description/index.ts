import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.0';

const allowedOrigins = new Set((Deno.env.get('ALLOWED_ORIGINS') ||
  'https://nusantarajourney.vercel.app,https://delviannn.github.io,http://localhost:3000').split(',').map(origin => origin.trim()).filter(Boolean));
const baseCorsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('Origin');
  const originAllowed = !origin || allowedOrigins.has(origin);
  const respondToRequest = (body: Record<string, string>, status = 200) => respond(body, status, origin && originAllowed ? origin : null);
  if (!originAllowed) return respondToRequest({ error: 'Origin tidak diizinkan.' }, 403);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders(origin) });
  if (request.method !== 'POST') return respondToRequest({ error: 'Method tidak diizinkan.' }, 405);

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 8192) return respondToRequest({ error: 'Permintaan terlalu besar.' }, 413);

  const authorization = request.headers.get('Authorization');
  if (!authorization) return respondToRequest({ error: 'Silakan masuk sebagai admin.' }, 401);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!supabaseUrl || !anonKey || !geminiKey) return respondToRequest({ error: 'Fungsi AI belum dikonfigurasi.' }, 503);

  const supabase = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authorization } } });
  const { data: userData, error: authError } = await supabase.auth.getUser();
  if (authError || !userData.user) return respondToRequest({ error: 'Sesi admin tidak valid.' }, 401);

  const { data: profile, error: profileError } = await supabase.from('admin_profiles')
    .select('is_active').eq('id', userData.user.id).maybeSingle();
  if (profileError || !profile?.is_active) return respondToRequest({ error: 'Akses admin diperlukan.' }, 403);

  let input: Record<string, unknown>;
  let rawBody: string;
  try {
    const boundedBody = await readBoundedBody(request, 8192);
    if (boundedBody === null) return respondToRequest({ error: 'Permintaan terlalu besar.' }, 413);
    rawBody = boundedBody;
  } catch { return respondToRequest({ error: 'Isi permintaan tidak valid.' }, 400); }
  try { input = JSON.parse(rawBody); } catch { return respondToRequest({ error: 'Isi permintaan tidak valid.' }, 400); }
  const name = text(input.name, 120), destination = text(input.destination, 160);
  const category = text(input.category, 30), duration = text(input.duration, 80);
  const itinerary = Array.isArray(input.itinerary) ? input.itinerary.slice(0, 12).map(x => text(x, 180)) : [];
  if (!name || !destination || !['Domestik', 'Internasional'].includes(category)) {
    return respondToRequest({ error: 'Nama, destinasi, dan kategori paket wajib diisi.' }, 400);
  }

  const { data: withinLimit, error: quotaError } = await supabase.rpc('consume_admin_ai_generation_quota');
  if (quotaError) return respondToRequest({ error: 'Pembatasan penggunaan belum siap. Jalankan supabase/harden-ai-abuse.sql.' }, 503);
  if (!withinLimit) return respondToRequest({ error: 'Batas AI tercapai. Coba lagi satu menit lagi.' }, 429);

  const model = Deno.env.get('GEMINI_MODEL') || 'gemini-3.5-flash-lite';
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
    return respondToRequest({ error: 'Tidak dapat terhubung ke layanan Gemini. Coba lagi sebentar.' }, 502);
  }
  if (!aiResponse.ok) {
    if (aiResponse.status === 400 || aiResponse.status === 404) {
      return respondToRequest({ error: `Model Gemini "${model}" tidak tersedia atau permintaannya ditolak. Periksa secret GEMINI_MODEL di Supabase.` }, 502);
    }
    if (aiResponse.status === 401 || aiResponse.status === 403) {
      return respondToRequest({ error: 'Key Gemini tidak valid atau belum memiliki akses. Periksa GEMINI_API_KEY di Supabase.' }, 502);
    }
    if (aiResponse.status === 429) {
      return respondToRequest({ error: 'Kuota Gemini sedang habis atau mencapai batas. Periksa kuota dan penagihan di Google AI Studio.' }, 502);
    }
    return respondToRequest({ error: 'Layanan Gemini sedang bermasalah. Coba lagi nanti.' }, 502);
  }
  const result = await aiResponse.json();
  const description = (result.candidates || []).flatMap((candidate: { content?: { parts?: Array<{ text?: string }> } }) =>
    candidate.content?.parts || []).map((part: { text?: string }) => part.text || '').join('').trim();
  if (!description) return respondToRequest({ error: 'AI tidak menghasilkan deskripsi.' }, 502);
  return respondToRequest({ description });
});

function text(value: unknown, max: number) {
  return typeof value === 'string' ? value.trim().slice(0, max) : '';
}

async function readBoundedBody(request: Request, maxBytes: number): Promise<string | null> {
  if (!request.body) return '';
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    totalBytes += value.byteLength;
    if (totalBytes > maxBytes) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  const body = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder().decode(body);
}

function responseHeaders(origin: string | null) {
  return {
    ...baseCorsHeaders,
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
  };
}

function respond(body: Record<string, string>, status = 200, origin: string | null = null) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...responseHeaders(origin), 'Content-Type': 'application/json' },
  });
}
