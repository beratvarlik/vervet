import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { extractSecret, pairWithSecret } from '@/lib/pairing'

const TAP_COUNT = 5
const TAP_WINDOW_MS = 3000
const FAILED_RESET_MS = 2000

type LogoScreenProps = {
  /** true ise logoya 5 kez dokunmak gizli "Panodan eşleştir" butonunu açar. */
  interactive?: boolean
}

/**
 * Oturumsuz görünüm: ortada yalnızca Vervet logosu. Form, yazı, buton yok.
 * Tek istisna: logoya 3 sn içinde 5 kez dokunulunca çıkan gizli buton
 * (iOS'ta ana ekran uygulaması Safari ile depolamayı paylaşmaz; link panodan okunur).
 */
export function LogoScreen({ interactive = false }: LogoScreenProps) {
  const taps = useRef<number[]>([])
  const [revealed, setRevealed] = useState(false)
  const [status, setStatus] = useState<'idle' | 'busy' | 'failed'>('idle')

  function onLogoTap() {
    if (!interactive || revealed) return
    const now = Date.now()
    taps.current = [...taps.current, now].filter((t) => now - t <= TAP_WINDOW_MS)
    if (taps.current.length >= TAP_COUNT) {
      taps.current = []
      setRevealed(true)
    }
  }

  function fail() {
    setStatus('failed')
    setTimeout(() => setStatus('idle'), FAILED_RESET_MS)
  }

  async function pairFromClipboard() {
    setStatus('busy')
    let text: string
    try {
      text = await navigator.clipboard.readText()
    } catch {
      return fail()
    }
    const secret = extractSecret(text)
    if (!secret) return fail()

    // Başarılıysa onAuthStateChange oturumu getirir ve AuthGate uygulamayı gösterir.
    const ok = await pairWithSecret(secret)
    if (!ok) fail()
  }

  const label =
    status === 'busy' ? 'Eşleştiriliyor…' : status === 'failed' ? 'Eşleşmedi' : 'Panodan eşleştir'

  return (
    <div className="flex h-dvh flex-col items-center justify-center gap-8 bg-background pt-safe-top pb-safe-bottom">
      <div
        onClick={onLogoTap}
        className="touch-manipulation select-none"
        style={{ WebkitTouchCallout: 'none' }}
      >
        <img
          src="/icon.svg"
          alt="Vervet"
          draggable={false}
          className="pointer-events-none size-24 rounded-3xl"
        />
      </div>

      {revealed && (
        <Button
          type="button"
          variant="secondary"
          className="min-h-11 px-6"
          disabled={status === 'busy'}
          onClick={pairFromClipboard}
        >
          {label}
        </Button>
      )}
    </div>
  )
}
