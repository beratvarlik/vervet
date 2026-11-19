import { useLayoutEffect, useRef } from 'react'

import { addDaysISO, formatDayNumber, formatWeekdayShort } from '@/lib/date'
import { cn } from '@/lib/utils'

const RADIUS = 14

type DayStripProps = {
  selected: string
  today: string
  onSelect: (iso: string) => void
}

/** Yatay kaydırılabilir gün şeridi: seçili günün ±14 günü. Seçili gün ortalanır. */
export function DayStrip({ selected, today, onSelect }: DayStripProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const days = Array.from({ length: RADIUS * 2 + 1 }, (_, i) =>
    addDaysISO(selected, i - RADIUS),
  )

  useLayoutEffect(() => {
    const container = containerRef.current
    const el = container?.querySelector<HTMLElement>('[aria-current="date"]')
    if (!container || !el) return
    container.scrollLeft = el.offsetLeft - (container.clientWidth - el.offsetWidth) / 2
  }, [selected])

  return (
    <div
      ref={containerRef}
      role="listbox"
      aria-label="Gün seç"
      className="relative flex gap-1.5 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {days.map((iso) => {
        const isSelected = iso === selected
        const isToday = iso === today
        return (
          <button
            key={iso}
            type="button"
            role="option"
            aria-selected={isSelected}
            aria-current={isSelected ? 'date' : undefined}
            onClick={() => onSelect(iso)}
            className={cn(
              'flex min-h-14 w-12 shrink-0 flex-col items-center justify-center rounded-xl text-sm transition-colors',
              isSelected
                ? 'bg-primary text-primary-foreground'
                : isToday
                  ? 'border border-primary text-primary'
                  : 'text-foreground',
            )}
          >
            <span className="text-xs opacity-80">{formatWeekdayShort(iso)}</span>
            <span className="text-base font-semibold tabular-nums">{formatDayNumber(iso)}</span>
          </button>
        )
      })}
    </div>
  )
}
