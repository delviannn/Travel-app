import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.119.0';

const allowedOrigins = new Set((Deno.env.get('ALLOWED_ORIGINS') ||
  'https://nusantarajourney.vercel.app,https://delviannn.github.io,http://localhost:3000').split(',').map(origin => origin.trim()).filter(Boolean));
const baseCorsHeaders = {
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Vary': 'Origin',
};
const encoder = new TextEncoder();

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('Origin');
  const originAllowed = !origin || allowedOrigins.has(origin);
  const respondToRequest = (body: Record<string, unknown>, status = 200, extraHeaders: Record<string, string> = {}) =>
    respond(body, status, origin && originAllowed ? origin : null, extraHeaders);

  if (!originAllowed) return respondToRequest({ error: 'Origin tidak diizinkan.' }, 403);
  if (request.method === 'OPTIONS') return new Response('ok', { headers: responseHeaders(origin) });
  if (request.method !== 'POST') return respondToRequest({ error: 'Method tidak diizinkan.' }, 405);

  const contentLength = Number(request.headers.get('Content-Length') || 0);
  if (contentLength > 8192) return respondToRequest({ error: 'Permintaan terlalu besar.' }, 413);
  if (!isPublicApiKey(request.headers.get('apikey') || '')) {
    return respondToRequest({ error: 'Kunci API tidak valid.' }, 401);
  }

  const ip = clientIp(request);
  if (!ip) return respondToRequest({ error: 'Alamat jaringan tidak dapat diverifikasi. Coba lagi nanti.' }, 503);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const serviceRoleKey = secretApiKey();
  if (!supabaseUrl || !serviceRoleKey) return respondToRequest({ error: 'Layanan ulasan belum dikonfigurasi.' }, 503);

  let input: Record<string, unknown>;
  try {
    const rawBody = await readBoundedBody(request, 8192);
    if (rawBody === null) return respondToRequest({ error: 'Permintaan terlalu besar.' }, 413);
    const parsed: unknown = JSON.parse(rawBody);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return respondToRequest({ error: 'Isi ulasan tidak valid.' }, 400);
    }
    input = parsed as Record<string, unknown>;
  } catch { return respondToRequest({ error: 'Isi ulasan tidak valid.' }, 400); }

  const author = text(input.author, 100);
  const packageName = text(input.package_name, 120);
  const quote = text(input.quote, 1200);
  const rating = Number(input.rating);
  if (!author || !quote || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return respondToRequest({ error: 'Nama, ulasan, dan rating 1–5 wajib diisi.' }, 400);
  }
  if (text(input.author, 101).length > 100 || text(input.package_name, 121).length > 120 || text(input.quote, 1201).length > 1200) {
    return respondToRequest({ error: 'Nama, paket, atau ulasan terlalu panjang.' }, 400);
  }

  const admin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false, detectSessionInUrl: false },
  });
  const ipHash = await hmacHex(ip, serviceRoleKey);
  const { data: withinLimit, error: quotaError } = await admin.rpc('consume_public_review_quota', { p_ip_hash: ipHash });
  if (quotaError) return respondToRequest({ error: 'Pembatasan ulasan belum siap. Hubungi admin situs.' }, 503);
  if (!withinLimit) {
    return respondToRequest({ error: 'Batas pengiriman ulasan tercapai. Coba lagi satu jam lagi.' }, 429, { 'Retry-After': '3600' });
  }

  const { error: insertError } = await admin.from('customer_reviews').insert({
    author, package_name: packageName, quote, rating, visible: false,
  });
  if (insertError) return respondToRequest({ error: 'Ulasan gagal disimpan. Coba lagi sebentar.' }, 500);
  return respondToRequest({ success: true });
});

function clientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  const ip = request.headers.get('cf-connecting-ip')?.trim() || request.headers.get('x-real-ip')?.trim() || forwarded;
  return ip && ip.length <= 64 ? ip : '';
}

function isPublicApiKey(candidate: string) {
  return publicApiKeys().includes(candidate);
}

function publicApiKeys() {
  const keys = [Deno.env.get('SUPABASE_ANON_KEY'), Deno.env.get('SUPABASE_PUBLISHABLE_KEY')].filter(Boolean) as string[];
  try {
    const configured = JSON.parse(Deno.env.get('SUPABASE_PUBLISHABLE_KEYS') || '{}');
    if (configured && typeof configured === 'object' && !Array.isArray(configured)) {
      keys.push(...Object.values(configured).filter((value): value is string => typeof value === 'string'));
    }
  } catch { /* Older projects may not expose the publishable-key map. */ }
  return keys;
}

function secretApiKey() {
  const legacy = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (legacy) return legacy;
  try {
    const configured = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') || '{}');
    if (configured && typeof configured === 'object' && !Array.isArray(configured)) {
      const secret = Object.values(configured).find((value): value is string => typeof value === 'string');
      if (secret) return secret;
    }
  } catch { /* Older projects may not expose the secret-key map. */ }
  return '';
}

async function hmacHex(value: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = new Uint8Array(await crypto.subtle.sign('HMAC', key, encoder.encode(value)));
  return Array.from(signature, byte => byte.toString(16).padStart(2, '0')).join('');
}

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

function responseHeaders(origin: string | null, extra: Record<string, string> = {}) {
  return {
    ...baseCorsHeaders,
    ...(origin ? { 'Access-Control-Allow-Origin': origin } : {}),
    ...extra,
  };
}

function respond(body: Record<string, unknown>, status = 200, origin: string | null = null, extra: Record<string, string> = {}) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...responseHeaders(origin, extra), 'Content-Type': 'application/json' },
  });
}
