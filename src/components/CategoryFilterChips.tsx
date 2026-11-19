import { CATEGORIES, CATEGORY_ORDER, type PlanCategory } from '@/lib/categories'
import { cn } from '@/lib/utils'

type CategoryFilterChipsProps = {
  selected: PlanCategory[]
  onToggle: (category: PlanCategory) => void
  onClear: () => void
}

/** Çoklu seçilebilen kategori filtresi. Hiçbiri seçili değilse "Tümü" etkindir. */
export function CategoryFilterChips({ selected, onToggle, onClear }: CategoryFilterChipsProps) {
  return (
    <div
      role="group"
      aria-label="Kategori filtresi"
      className="flex gap-2 overflow-x-auto px-4 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      <Chip active={selected.length === 0} onClick={onClear}>
        Tümü
      </Chip>
      {CATEGORY_ORDER.map((category) => {
        const meta = CATEGORIES[category]
        const Icon = meta.icon
        return (
          <Chip
            key={category}
            active={selected.includes(category)}
            onClick={() => onToggle(category)}
            color={meta.color}
          >
            <Icon className="size-4" style={{ color: meta.color }} aria-hidden />
            {meta.label}
          </Chip>
        )
      })}
    </div>
  )
}

type ChipProps = {
  active: boolean
  onClick: () => void
  color?: string
  children: React.ReactNode
}

function Chip({ active, onClick, color, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-full border px-4 text-sm font-medium whitespace-nowrap transition-colors',
        active ? 'border-transparent bg-primary text-primary-foreground' : 'bg-card text-foreground',
      )}
      style={
        active && color
          ? { backgroundColor: `color-mix(in oklab, ${color} 22%, var(--background))`, borderColor: color, color: 'var(--foreground)' }
          : undefined
      }
    >
      {children}
    </button>
  )
}
