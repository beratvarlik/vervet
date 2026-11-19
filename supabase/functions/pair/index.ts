// Vervet eşleme fonksiyonu.
// POST { secret } -> PAIRING_SECRET ile sabit zamanlı karşılaştırır; doğruysa sahip kullanıcı için
// magic link üretir ve YALNIZCA hashed_token döndürür. İstemci bunu auth.verifyOtp ile oturuma çevirir.
//
// Gerekli ortam değişkenleri (supabase secrets set ...):
//   PAIRING_SECRET   eşleme sırrı
//   OWNER_EMAIL      sahip kullanıcının e-postası
//   ALLOWED_ORIGINS  izin verilen origin'ler, virgülle ayrılmış (örn. https://vervet.vercel.app)
// SUPABASE_URL ve SUPABASE_SERVICE_ROLE_KEY Supabase tarafından otomatik verilir.
import { createClient } from 'npm:@supabase/supabase-js@2'

const WRONG_SECRET_DELAY_MS = 1000
const MAX_BODY_BYTES = 2048

const encoder = new TextEncoder()

/** İki metni sabit zamanlı karşılaştırır: önce SHA-256 ile eşit uzunluğa getirir. */
async function safeEqual(a: string, b: string): Promise<boolean> {
  const [ha, hb] = await Promise.all([
    crypto.subtle.digest('SHA-256', encoder.encode(a)),
    crypto.subtle.digest('SHA-256', encoder.encode(b)),
  ])
  const va = new Uint8Array(ha)
  const vb = new Uint8Array(hb)
  let diff = 0
  for (let i = 0; i < va.length; i++) diff |= va[i] ^ vb[i]
  return diff === 0
}

function allowedOrigins(): string[] {
  return (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter(Boolean)
}

/** CORS başlıkları yalnızca izin verilen origin için eklenir; diğerlerine hiç eklenmez. */
function corsHeaders(origin: string | null): Record<string, string> {
  if (!origin || !allowedOrigins().includes(origin)) return {}
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type, apikey, authorization, x-client-info',
    'Access-Control-Max-Age': '600',
    Vary: 'Origin',
  }
}

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...cors },
  })
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

Deno.serve(async (req) => {
  const cors = corsHeaders(req.headers.get('Origin'))

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: cors['Access-Control-Allow-Origin'] ? 204 : 404, headers: cors })
  }

  // Tarayıcıdan gelen istek, izin verilmeyen bir origin'den geliyorsa hiç işleme.
  const origin = req.headers.get('Origin')
  if (origin && !cors['Access-Control-Allow-Origin']) {
    await sleep(WRONG_SECRET_DELAY_MS)
    return json({ error: 'not_found' }, 404, {})
  }

  const pairingSecret = Deno.env.get('PAIRING_SECRET')
  const ownerEmail = Deno.env.get('OWNER_EMAIL')
  const supabaseUrl = Deno.env.get('SUPABASE_URL')
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!pairingSecret || !ownerEmail || !supabaseUrl || !serviceKey) {
    console.error('pair: eksik ortam değişkeni (PAIRING_SECRET / OWNER_EMAIL)')
    return json({ error: 'not_found' }, 404, cors)
  }

  // Yöntem, gövde ve secret hatalarının hepsi aynı cevabı verir: 1 sn bekle + 404.
  const reject = async () => {
    await sleep(WRONG_SECRET_DELAY_MS)
    return json({ error: 'not_found' }, 404, cors)
  }

  if (req.method !== 'POST') return reject()

  let secret: unknown
  try {
    const raw = await req.text()
    if (raw.length > MAX_BODY_BYTES) return reject()
    secret = (JSON.parse(raw) as { secret?: unknown }).secret
  } catch {
    return reject()
  }
  if (typeof secret !== 'string' || secret.length === 0) return reject()

  if (!(await safeEqual(secret, pairingSecret))) return reject()

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data, error } = await admin.auth.admin.generateLink({
    type: 'magiclink',
    email: ownerEmail,
  })
  const hashedToken = data?.properties?.hashed_token
  if (error || !hashedToken) {
    console.error('pair: generateLink başarısız', error?.message)
    return json({ error: 'not_found' }, 404, cors)
  }

  return json({ token_hash: hashedToken }, 200, cors)
})
