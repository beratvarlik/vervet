import { Check, MapPin } from 'lucide-react'
import { Link } from 'react-router'

import { CATEGORIES } from '@/lib/categories'
import { formatAmount, timeLabel, type Plan } from '@/lib/plans'
import { cn } from '@/lib/utils'

type PlanCardProps = {
  plan: Plan
  /** Başlığın altında gösterilen kısa etiket (örn. "3 gündür taşınıyor"). */
  badge?: string
  /** Saat başka yerde gösteriliyorsa (zaman çizgisi) kartta tekrar etme. */
  hideTime?: boolean
  className?: string
}

export function PlanCard({ plan, badge, hideTime, className }: PlanCardProps) {
  const meta = CATEGORIES[plan.category]
  const Icon = meta.icon
  const finished = plan.status !== 'pending'

  return (
    <Link
      to={`/plan/${plan.id}`}
      className={cn(
        'flex min-h-14 items-stretch gap-3 rounded-xl border bg-card p-3 text-card-foreground transition-colors active:bg-accent',
        finished && 'opacity-60',
        className,
      )}
    >
      <span
        className="w-1 shrink-0 rounded-full"
        style={{ backgroundColor: meta.color }}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <Icon className="size-4 shrink-0" style={{ color: meta.color }} aria-label={meta.label} />
          <span className={cn('truncate font-medium', finished && 'line-through')}>{plan.title}</span>
        </div>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-sm text-muted-foreground">
          {!hideTime && <span className="tabular-nums">{timeLabel(plan)}</span>}
          {plan.location && (
            <span className="inline-flex min-w-0 items-center gap-1">
              <MapPin className="size-3.5 shrink-0" aria-hidden />
              <span className="truncate">{plan.location}</span>
            </span>
          )}
          {plan.amount !== null && meta.hasAmount && (
            <span className="font-medium text-foreground tabular-nums">
              {formatAmount(plan.amount)}
            </span>
          )}
        </div>
        {badge && (
          <span className="mt-1.5 inline-block rounded-full bg-accent px-2 py-0.5 text-xs font-medium text-accent-foreground">
            {badge}
          </span>
        )}
      </div>
      {plan.status === 'done' && (
        <Check className="size-5 shrink-0 self-center text-muted-foreground" aria-label="Yapıldı" />
      )}
    </Link>
  )
}
