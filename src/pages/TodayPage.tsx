import { ChevronDown } from 'lucide-react'
import { Fragment, useMemo, useState, type ReactNode } from 'react'
import { useSearchParams } from 'react-router'

import { CategoryFilterChips } from '@/components/CategoryFilterChips'
import { DayStrip } from '@/components/DayStrip'
import { PlanCard } from '@/components/PlanCard'
import { CardListSkeleton, EmptyState, ErrorState } from '@/components/QueryStates'
import { Button } from '@/components/ui/button'
import { useCategoryFilter } from '@/lib/category-filter'
import {
  formatDayLongISO,
  formatTime,
  isValidISODate,
  minutesToTime,
  relativeDayLabel,
  toMinutes,
} from '@/lib/date'
import { carriedLabel, groupDayPlans, usePlans, type Plan } from '@/lib/plans'
import { useNow } from '@/lib/use-now'
import { cn } from '@/lib/utils'

export function TodayPage() {
  const [params, setParams] = useSearchParams()
  const now = useNow()
  const filter = useCategoryFilter()

  const gunParam = params.get('gun')
  const day = isValidISODate(gunParam) ? gunParam : now.today
  const isToday = day === now.today

  const { data, isPending, isError, refetch } = usePlans(day, day)
  const { matches } = filter
  const groups = useMemo(
    () => (data ? groupDayPlans(data.filter((p) => matches(p.category))) : undefined),
    [data, matches],
  )

  function selectDay(iso: string) {
    setParams(iso === now.today ? {} : { gun: iso }, { replace: true })
  }

  const total = groups
    ? groups.carried.length +
      groups.important.length +
      groups.allDay.length +
      groups.timed.length +
      groups.deferrable.length +
      groups.finished.length
    : 0

  return (
    <div className="pb-28">
      <div className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur">
        <DayStrip selected={day} today={now.today} onSelect={selectDay} />
        <CategoryFilterChips
          selected={filter.selected}
          onToggle={filter.toggle}
          onClear={filter.clear}
        />
      </div>

      {!isToday && (
        <div className="flex min-h-12 items-center justify-between gap-3 px-4 pt-3">
          <h2 className="text-base font-semibold">
            {formatDayLongISO(day)}
            {relativeDayLabel(day, now.today) && (
              <span className="ml-2 text-sm font-normal text-muted-foreground">
                {relativeDayLabel(day, now.today)}
              </span>
            )}
          </h2>
          <Button
            type="button"
            variant="secondary"
            className="min-h-11"
            onClick={() => selectDay(now.today)}
          >
            Bugüne dön
          </Button>
        </div>
      )}

      {isPending && (
        <div className="pt-4">
          <CardListSkeleton />
        </div>
      )}
      {isError && <ErrorState onRetry={() => void refetch()} />}

      {groups && total === 0 && (
        <EmptyState>
          {data && data.length > 0
            ? 'Seçili filtrelere uyan plan yok.'
            : isToday
              ? 'Bugün için plan yok.'
              : 'Bu gün için plan yok.'}
        </EmptyState>
      )}

      {groups && total > 0 && (
        <>
          <Section title="Dünden kalanlar" count={groups.carried.length}>
            {groups.carried.map((plan) => (
              <PlanCard key={plan.id} plan={plan} badge={carriedLabel(plan)} />
            ))}
          </Section>

          <Section title="Önemli planlar" count={groups.important.length}>
            {groups.important.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </Section>

          <Timeline
            allDay={groups.allDay}
            timed={groups.timed}
            nowMinutes={isToday ? now.minutes : null}
          />

          <Section title="Ertelenebilir planlar" count={groups.deferrable.length}>
            {groups.deferrable.map((plan) => (
              <PlanCard key={plan.id} plan={plan} />
            ))}
          </Section>

          <Finished plans={groups.finished} />
        </>
      )}
    </div>
  )
}

function Section({
  title,
  count,
  children,
}: {
  title: string
  count: number
  children: ReactNode
}) {
  if (count === 0) return null
  return (
    <section className="pt-5">
      <h2 className="px-4 pb-2 text-sm font-semibold text-muted-foreground">{title}</h2>
      <div className="space-y-2 px-4">{children}</div>
    </section>
  )
}

/** Saatli planların zaman çizgisi; bugünse şu anki saat çizgisi araya girer. */
function Timeline({
  allDay,
  timed,
  nowMinutes,
}: {
  allDay: Plan[]
  timed: Plan[]
  nowMinutes: number | null
}) {
  if (allDay.length === 0 && timed.length === 0) return null

  const rows: ReactNode[] = []
  let nowPlaced = nowMinutes === null || timed.length === 0
  for (const plan of timed) {
    const start = toMinutes(plan.start_time!)
    if (!nowPlaced && nowMinutes !== null && start > nowMinutes) {
      rows.push(<NowLine key="now" minutes={nowMinutes} />)
      nowPlaced = true
    }
    rows.push(
      <div key={plan.id} className="flex items-start gap-2">
        <span className="w-12 shrink-0 pt-4 text-right text-sm font-medium text-muted-foreground tabular-nums">
          {formatTime(plan.start_time!)}
        </span>
        <PlanCard plan={plan} hideTime={!plan.end_time} className="flex-1" />
      </div>,
    )
  }
  if (!nowPlaced && nowMinutes !== null) rows.push(<NowLine key="now" minutes={nowMinutes} />)

  return (
    <section className="pt-5">
      <h2 className="px-4 pb-2 text-sm font-semibold text-muted-foreground">Zaman çizgisi</h2>
      <div className="space-y-2 px-4">
        {allDay.length > 0 && (
          <div className="space-y-2 pb-1">
            <p className="text-xs font-medium text-muted-foreground">Tüm gün</p>
            {allDay.map((plan) => (
              <PlanCard key={plan.id} plan={plan} hideTime />
            ))}
          </div>
        )}
        {rows.map((row, i) => (
          <Fragment key={i}>{row}</Fragment>
        ))}
      </div>
    </section>
  )
}

function NowLine({ minutes }: { minutes: number }) {
  return (
    <div
      role="separator"
      aria-label={`Şu an ${minutesToTime(minutes)}`}
      className="flex items-center gap-2 text-xs font-semibold text-primary"
    >
      <span className="w-12 shrink-0 text-right tabular-nums">{minutesToTime(minutes)}</span>
      <span className="size-2 shrink-0 rounded-full bg-primary" aria-hidden />
      <span className="h-px flex-1 bg-primary" aria-hidden />
    </div>
  )
}

/** Katlanır "Tamamlananlar" bölümü. */
function Finished({ plans }: { plans: Plan[] }) {
  const [open, setOpen] = useState(false)
  if (plans.length === 0) return null
  return (
    <section className="pt-5">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-11 w-full items-center justify-between px-4 text-sm font-semibold text-muted-foreground"
      >
        <span>Tamamlananlar ({plans.length})</span>
        <ChevronDown className={cn('size-5 transition-transform', open && 'rotate-180')} aria-hidden />
      </button>
      {open && (
        <div className="space-y-2 px-4 pt-1">
          {plans.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </div>
      )}
    </section>
  )
}
