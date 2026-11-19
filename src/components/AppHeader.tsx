import { formatDayLong, nowInIstanbul } from '@/lib/date'

type AppHeaderProps = {
  /** Bugün kalan plan sayısı. Veri katmanı eklenene kadar 0. */
  remainingToday?: number
}

export function AppHeader({ remainingToday = 0 }: AppHeaderProps) {
  const today = formatDayLong(nowInIstanbul())

  return (
    <header className="shrink-0 border-b bg-background/90 pt-safe-top backdrop-blur">
      <div className="flex min-h-14 items-center justify-between gap-3 px-4 pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))]">
        <h1 className="text-lg font-semibold tracking-tight">{today}</h1>
        <p className="text-sm text-muted-foreground">
          {remainingToday === 0
            ? 'Kalan plan yok'
            : `${remainingToday} plan kaldı`}
        </p>
      </div>
    </header>
  )
}
