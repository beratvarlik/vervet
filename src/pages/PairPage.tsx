import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router'

import { LogoScreen } from '@/components/LogoScreen'
import { extractSecret, pairWithSecret } from '@/lib/pairing'

/**
 * /p#<secret> — eşleme rotası. Secret'ı hash'ten alır, hemen adres çubuğundan siler,
 * pair fonksiyonuna gönderir ve her durumda / sayfasına yönlendirir.
 * Başarısızlıkta hiçbir mesaj gösterilmez: oturumsuz kullanıcı yalnızca logolu boş ekran görür.
 */
export function PairPage() {
  const navigate = useNavigate()
  const started = useRef(false)

  useEffect(() => {
    // StrictMode efekti iki kez çalıştırır; hash ilk çalışmada silindiği için tek sefer işle.
    if (started.current) return
    started.current = true

    const secret = extractSecret(window.location.hash)
    window.history.replaceState(null, '', window.location.pathname + window.location.search)

    async function run() {
      if (secret) {
        const ok = await pairWithSecret(secret)
        if (!ok) console.warn('Eşleme başarısız.')
      }
      navigate('/', { replace: true })
    }
    void run()
  }, [navigate])

  return <LogoScreen />
}
