import { supabase } from '@/lib/supabase'

const PAIR_TIMEOUT_MS = 15_000

/**
 * Eşleme linkinden ya da düz metinden secret'ı çıkarır.
 * Kabul edilenler: "https://site/p#<secret>", "#<secret>", "<secret>".
 * Secret bulunamazsa null.
 */
export function extractSecret(input: string): string | null {
  const text = input.trim()
  if (!text) return null

  let candidate: string
  const hashIndex = text.indexOf('#')
  if (hashIndex !== -1) {
    candidate = text.slice(hashIndex + 1)
  } else if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) {
    // Hash'siz bir link: secret yok.
    return null
  } else {
    candidate = text
  }

  try {
    candidate = decodeURIComponent(candidate)
  } catch {
    // Geçersiz % dizisi: olduğu gibi kullan.
  }
  candidate = candidate.trim()
  return candidate.length > 0 ? candidate : null
}

/**
 * Secret'ı pair fonksiyonuna gönderir, dönen token ile oturum açar.
 * Başarılıysa true. Başarısızlık nedeni bilerek ayrıştırılmaz (bilgi sızdırmamak için).
 */
export async function pairWithSecret(secret: string): Promise<boolean> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), PAIR_TIMEOUT_MS)

  try {
    const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pair`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ secret }),
      signal: controller.signal,
    })
    if (!res.ok) return false

    const body = (await res.json()) as { token_hash?: unknown }
    if (typeof body.token_hash !== 'string' || !body.token_hash) return false

    const { error } = await supabase.auth.verifyOtp({
      token_hash: body.token_hash,
      type: 'magiclink',
    })
    return !error
  } catch {
    return false
  } finally {
    clearTimeout(timer)
  }
}
