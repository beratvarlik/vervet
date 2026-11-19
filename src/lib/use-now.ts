import { useEffect, useState } from 'react'

import { nowMinutesIstanbul, todayISO } from '@/lib/date'

/** Istanbul saatine göre şu an (dakika) ve bugün; her dakika yenilenir. */
export function useNow() {
  const [now, setNow] = useState(() => ({ minutes: nowMinutesIstanbul(), today: todayISO() }))

  useEffect(() => {
    const id = setInterval(
      () => setNow({ minutes: nowMinutesIstanbul(), today: todayISO() }),
      30_000,
    )
    return () => clearInterval(id)
  }, [])

  return now
}
