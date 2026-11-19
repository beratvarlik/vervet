import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import { Link, useSearchParams } from 'react-router'

import { CategoryFilterChips } from '@/components/CategoryFilterChips'
import { ErrorState } from '@/components/QueryStates'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { CATEGORIES } from '@/lib/categories'
import { useCategoryFilter } from '@/lib/category-filter'
import {
  addDaysISO,
  formatDayNumber,
  formatWeekdayShort,
  formatWeekRange,
  isValidISODate,
  mondayOf,
  weekDays,
} from '@/lib/date'
import { timeLabel, usePlans, type Plan } from '@/lib/plans'
import { useNow } from '@/lib/use-now'
import {
  GRID_END_MIN,
  GRID_START_MIN,
  layoutDayBlocks,
  minutesToPx,
} from '@/lib/week-layout'
import { cn } from '@/lib/utils'

const HOUR_HEIGHT = 56
const GUTTER_PX = 44
const COLUMN_MIN_PX = 112
const HOURS = (GRID_END_MIN - GRID_START_MIN) / 60 // 17
const BODY_HEIGHT = HOURS * HOUR_HEIGHT
const GRID_COLUMNS = `${GUTTER_PX}px repeat(7, minmax(${COLUMN_MIN_PX}px, 1fr))`
const HOUR_LINES = `repeating-linear-gradient(to bottom, transparent 0, transparent ${HOUR_HEIGHT - 1}px, var(--border) ${HOUR_HEIGHT - 1}px, var(--border) ${HOUR_HEIGHT}px)`

export function WeekPage() {
  const [params, setParams] = useSearchParams()
  const now = useNow()
  const filter = useCategoryFilter()

  const haftaParam = params.get('hafta')
  const currentMonday = mondayOf(now.today)
  const monday = isValidISODate(haftaParam) ? mondayOf(haftaParam) : currentMonday
  const days = useMemo(() => weekDays(monday), [monday])
  const isCurrentWeek = monday === currentMonday

  const { data, isPending, isError, refetch } = usePlans(days[0], days[6])
  const { matches } = filter

  const plansByDay = useMemo(() => {
    const map = new Map<string, Plan[]>(days.map((d) => [d, []]))
    for (const plan of data ?? []) {
      if (matches(plan.category)) map.get(plan.date)?.push(plan)
    }
    return map
  }, [data, days, matches])

  function goTo(iso: string) {
    setParams(iso === currentMonday ? {} : { hafta: iso }, { replace: true })
  }

  // Efekt yalnızca hafta değişince çalışır; o anki dakikayı ref'ten okur.
  const nowMinutesRef = useRef(now.minutes)
  useEffect(() => {
    nowMinutesRef.current = now.minutes
  }, [now.minutes])

  const scrollRef = useRef<HTMLDivElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const todayColRef = useRef<HTMLDivElement>(null)

  // Hafta değişince: bugünün sütununa (ve şu anki saate) kaydır; başka haftada başa dön.
  useLayoutEffect(() => {
    const scroller = scrollRef.current
    if (!scroller) return
    const column = todayColRef.current
    const body = bodyRef.current
    if (column && body) {
      scroller.scrollLeft =
        column.offsetLeft - GUTTER_PX - (scroller.clientWidth - GUTTER_PX - column.offsetWidth) / 2
      scroller.scrollTop = Math.max(
        0,
        body.offsetTop + minutesToPx(nowMinutesRef.current, HOUR_HEIGHT) - scroller.clientHeight / 3,
      )
    } else {
      scroller.scrollLeft = 0
      scroller.scrollTop = 0
    }
    // Yalnızca hafta değişiminde; dakikalık saat güncellemesi kaydırmayı bozmamalı.
  }, [monday])

  const isEmpty = !isPending && !isError && [...plansByDay.values()].every((p) => p.length === 0)

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b bg-background">
        <div className="flex min-h-14 items-center justify-between gap-2 px-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Önceki hafta"
            onClick={() => goTo(addDaysISO(monday, -7))}
          >
            <ChevronLeft className="size-6" aria-hidden />
          </Button>
          <h2 className="flex-1 text-center text-base font-semibold">{formatWeekRange(monday)}</h2>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            disabled={isCurrentWeek}
            onClick={() => goTo(currentMonday)}
          >
            Bu hafta
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            aria-label="Sonraki hafta"
            onClick={() => goTo(addDaysISO(monday, 7))}
          >
            <ChevronRight className="size-6" aria-hidden />
          </Button>
        </div>
        <CategoryFilterChips
          selected={filter.selected}
          onToggle={filter.toggle}
          onClear={filter.clear}
        />
        {isEmpty && (
          <p className="px-4 pb-2 text-center text-sm text-muted-foreground">
            {data && data.length > 0 ? 'Seçili filtrelere uyan plan yok.' : 'Bu hafta için plan yok.'}
          </p>
        )}
      </div>

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <div ref={scrollRef} className="min-h-0 flex-1 overflow-auto overscroll-contain">
          <div className="relative pb-24" style={{ minWidth: GUTTER_PX + 7 * COLUMN_MIN_PX }}>
            {/* Gün başlıkları + tüm gün satırı: dikeyde sabit */}
            <div className="sticky top-0 z-20 border-b bg-background">
              <div className="grid" style={{ gridTemplateColumns: GRID_COLUMNS }}>
                <div className="sticky left-0 z-10 bg-background" />
                {days.map((iso) => {
                  const isToday = iso === now.today
                  return (
                    <div
                      key={iso}
                      className={cn(
                        'flex flex-col items-center border-l py-1.5 text-xs',
                        isToday ? 'text-primary' : 'text-muted-foreground',
                      )}
                    >
                      <span>{formatWeekdayShort(iso)}</span>
                      <span
                        className={cn(
                          'flex size-8 items-center justify-center rounded-full text-base font-semibold tabular-nums',
                          isToday ? 'bg-primary text-primary-foreground' : 'text-foreground',
                        )}
                      >
                        {formatDayNumber(iso)}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="grid border-t" style={{ gridTemplateColumns: GRID_COLUMNS }}>
                <div className="sticky left-0 z-10 flex items-center justify-center bg-background px-0.5 text-center text-[10px] leading-tight text-muted-foreground">
                  Tüm gün
                </div>
                {days.map((iso) => {
                  const allDay = (plansByDay.get(iso) ?? []).filter((p) => !p.start_time)
                  return (
                    <div key={iso} className="flex min-h-9 flex-col gap-0.5 border-l p-0.5">
                      {isPending ? (
                        <Skeleton className="h-6 w-full" />
                      ) : (
                        allDay.map((plan) => <AllDayPill key={plan.id} plan={plan} />)
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Saat ızgarası */}
            <div ref={bodyRef} className="grid" style={{ gridTemplateColumns: GRID_COLUMNS }}>
              <div
                className="sticky left-0 z-10 border-r bg-background"
                style={{ height: BODY_HEIGHT }}
              >
                {Array.from({ length: HOURS + 1 }, (_, i) => (
                  <span
                    key={i}
                    className="absolute right-1 text-[11px] text-muted-foreground tabular-nums"
                    style={{
                      top: i * HOUR_HEIGHT,
                      transform: i === 0 ? undefined : i === HOURS ? 'translateY(-100%)' : 'translateY(-50%)',
                    }}
                  >
                    {String(GRID_START_MIN / 60 + i).padStart(2, '0')}:00
                  </span>
                ))}
              </div>

              {days.map((iso) => {
                const isToday = iso === now.today
                const blocks = layoutDayBlocks(plansByDay.get(iso) ?? [])
                return (
                  <div
                    key={iso}
                    ref={isToday ? todayColRef : undefined}
                    className={cn('relative border-l', isToday && 'bg-primary/5')}
                    style={{ height: BODY_HEIGHT, backgroundImage: HOUR_LINES }}
                  >
                    {isPending && <ColumnSkeleton seed={iso} />}
                    {blocks.map((block) => (
                      <PlanBlock key={block.plan.id} block={block} />
                    ))}
                    {isToday && now.minutes >= GRID_START_MIN && now.minutes <= GRID_END_MIN && (
                      <div
                        className="pointer-events-none absolute right-0 left-0 z-10 flex items-center"
                        style={{ top: minutesToPx(now.minutes, HOUR_HEIGHT) }}
                        aria-hidden
                      >
                        <span className="-ml-1 size-2 rounded-full bg-primary" />
                        <span className="h-px flex-1 bg-primary" />
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function blockStyle(color: string) {
  return {
    backgroundColor: `color-mix(in oklab, ${color} 22%, var(--card))`,
    borderLeft: `3px solid ${color}`,
  }
}

function PlanBlock({ block }: { block: ReturnType<typeof layoutDayBlocks>[number] }) {
  const { plan, start, end, column, columns } = block
  const meta = CATEGORIES[plan.category]
  const finished = plan.status !== 'pending'
  return (
    <Link
      to={`/plan/${plan.id}`}
      aria-label={`${plan.title}, ${timeLabel(plan)}`}
      className={cn(
        'absolute overflow-hidden rounded-md px-1.5 py-1 text-foreground shadow-sm',
        finished && 'opacity-55',
      )}
      style={{
        top: minutesToPx(start, HOUR_HEIGHT) + 1,
        height: ((end - start) / 60) * HOUR_HEIGHT - 2,
        left: `calc(${(column / columns) * 100}% + 1px)`,
        width: `calc(${100 / columns}% - 2px)`,
        ...blockStyle(meta.color),
      }}
    >
      <span
        className={cn('line-clamp-2 text-xs leading-tight font-semibold break-words', finished && 'line-through')}
      >
        {plan.title}
      </span>
      <span className="block truncate text-[11px] leading-tight text-muted-foreground tabular-nums">
        {timeLabel(plan)}
      </span>
    </Link>
  )
}

function AllDayPill({ plan }: { plan: Plan }) {
  const meta = CATEGORIES[plan.category]
  const finished = plan.status !== 'pending'
  return (
    <Link
      to={`/plan/${plan.id}`}
      className={cn(
        'flex min-h-7 items-center truncate rounded px-1.5 text-xs font-medium text-foreground',
        finished && 'line-through opacity-55',
      )}
      style={blockStyle(meta.color)}
    >
      <span className="truncate">{plan.title}</span>
    </Link>
  )
}

/** Yükleme sırasında sütunlarda sahte bloklar (gün adına göre sabit konumlar). */
function ColumnSkeleton({ seed }: { seed: string }) {
  const n = Number(seed.slice(-2))
  const tops = [(n * 37) % 300, 320 + ((n * 53) % 400)]
  return (
    <>
      {tops.map((top, i) => (
        <Skeleton
          key={i}
          className="absolute right-1 left-1 rounded-md"
          style={{ top, height: HOUR_HEIGHT }}
        />
      ))}
    </>
  )
}
