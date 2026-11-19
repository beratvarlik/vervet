import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { CategoryFilterChips } from '@/components/CategoryFilterChips'
import { PlanCard } from '@/components/PlanCard'
import { ErrorState } from '@/components/QueryStates'
import { Button } from '@/components/ui/button'
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer'
import { Skeleton } from '@/components/ui/skeleton'
import { CATEGORIES, CATEGORY_ORDER } from '@/lib/categories'
import { useCategoryFilter } from '@/lib/category-filter'
import {
  addMonthsISO,
  formatDayLongISO,
  formatDayNumber,
  formatMonthYear,
  isValidISOMonth,
  monthGridDays,
  monthOf,
} from '@/lib/date'
import { carriedLabel, comparePlans, usePlans, type Plan } from '@/lib/plans'
import { useNow } from '@/lib/use-now'
import { cn } from '@/lib/utils'

const MAX_DOTS = 4
const WEEKDAYS = ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cts', 'Paz']
const categoryRank = new Map(CATEGORY_ORDER.map((c, i) => [c, i]))

export function CalendarPage() {
  const [params, setParams] = useSearchParams()
  const now = useNow()
  const filter = useCategoryFilter()
  const [openDay, setOpenDay] = useState<string | null>(null)

  const ayParam = params.get('ay')
  const currentMonth = monthOf(now.today)
  const month = isValidISOMonth(ayParam) ? ayParam : currentMonth
  const days = useMemo(() => monthGridDays(month), [month])

  const { data, isPending, isError, refetch } = usePlans(days[0], days[days.length - 1])
  const { matches } = filter

  const plansByDay = useMemo(() => {
    const map = new Map<string, Plan[]>()
    for (const plan of data ?? []) {
      if (!matches(plan.category)) continue
      const list = map.get(plan.date)
      if (list) list.push(plan)
      else map.set(plan.date, [plan])
    }
    return map
  }, [data, matches])

  function goTo(nextMonth: string) {
    setParams(nextMonth === currentMonth ? {} : { ay: nextMonth }, { replace: true })
  }

  const openPlans = openDay ? [...(plansByDay.get(openDay) ?? [])].sort(comparePlans) : []

  return (
    <div className="pb-28">
      <div className="flex min-h-14 items-center justify-between gap-2 px-2">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label="Önceki ay"
          onClick={() => goTo(addMonthsISO(month, -1))}
        >
          <ChevronLeft className="size-6" aria-hidden />
        </Button>
        <h2 className="flex-1 text-center text-base font-semibold capitalize">
          {formatMonthYear(month)}
        </h2>
        <Button
          type="button"
          variant="secondary"
          className="min-h-11"
          disabled={month === currentMonth}
          onClick={() => goTo(currentMonth)}
        >
          Bu ay
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="size-11"
          aria-label="Sonraki ay"
          onClick={() => goTo(addMonthsISO(month, 1))}
        >
          <ChevronRight className="size-6" aria-hidden />
        </Button>
      </div>

      <CategoryFilterChips
        selected={filter.selected}
        onToggle={filter.toggle}
        onClear={filter.clear}
      />

      {isError ? (
        <ErrorState onRetry={() => void refetch()} />
      ) : (
        <div className="px-2 pt-2" aria-busy={isPending}>
          <div className="grid grid-cols-7 pb-1 text-center text-xs text-muted-foreground">
            {WEEKDAYS.map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border bg-border">
            {days.map((iso) => (
              <DayCell
                key={iso}
                iso={iso}
                inMonth={monthOf(iso) === month}
                isToday={iso === now.today}
                plans={plansByDay.get(iso) ?? []}
                loading={isPending}
                onOpen={() => setOpenDay(iso)}
              />
            ))}
          </div>
        </div>
      )}

      <Drawer open={openDay !== null} onOpenChange={(open) => !open && setOpenDay(null)}>
        <DrawerContent>
          <DrawerHeader className="text-left">
            <DrawerTitle>{openDay ? formatDayLongISO(openDay) : ''}</DrawerTitle>
            <DrawerDescription className="sr-only">Seçili günün planları</DrawerDescription>
          </DrawerHeader>
          <div className="max-h-[60dvh] space-y-2 overflow-y-auto px-4 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
            {openPlans.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {data && data.some((p) => p.date === openDay)
                  ? 'Seçili filtrelere uyan plan yok.'
                  : 'Bu gün için plan yok.'}
              </p>
            ) : (
              openPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  plan={plan}
                  badge={plan.status === 'pending' && plan.carry_count > 0 ? carriedLabel(plan) : undefined}
                />
              ))
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  )
}

type DayCellProps = {
  iso: string
  inMonth: boolean
  isToday: boolean
  plans: Plan[]
  loading: boolean
  onOpen: () => void
}

function DayCell({ iso, inMonth, isToday, plans, loading, onOpen }: DayCellProps) {
  const sorted = [...plans].sort(
    (a, b) => (categoryRank.get(a.category) ?? 0) - (categoryRank.get(b.category) ?? 0),
  )
  const dots = sorted.slice(0, MAX_DOTS)
  const hasPayment = plans.some((p) => CATEGORIES[p.category].hasAmount)

  return (
    <button
      type="button"
      onClick={onOpen}
      aria-label={`${formatDayLongISO(iso)}, ${plans.length} plan${hasPayment ? ', ödeme var' : ''}`}
      className={cn(
        'relative flex min-h-16 flex-col items-center gap-1 bg-background px-0.5 pt-1.5 pb-1.5 text-sm transition-colors active:bg-accent',
        !inMonth && 'text-muted-foreground opacity-45',
      )}
    >
      <span
        className={cn(
          'flex size-7 items-center justify-center rounded-full font-medium tabular-nums',
          isToday && 'bg-primary text-primary-foreground',
        )}
      >
        {formatDayNumber(iso)}
      </span>

      {hasPayment && (
        <span
          className="absolute top-1 right-1 text-xs leading-none font-bold"
          style={{ color: CATEGORIES.odeme.color }}
          aria-hidden
        >
          ₺
        </span>
      )}

      {loading ? (
        <Skeleton className="h-2 w-8 rounded-full" />
      ) : (
        <span className="flex h-2 items-center gap-0.5" aria-hidden>
          {dots.map((plan) => (
            <span
              key={plan.id}
              className={cn('size-1.5 rounded-full', plan.status !== 'pending' && 'opacity-40')}
              style={{ backgroundColor: CATEGORIES[plan.category].color }}
            />
          ))}
        </span>
      )}
    </button>
  )
}
