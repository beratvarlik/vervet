import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'

/** Kart listesi iskeleti. */
export function CardListSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-3 px-4" aria-busy="true" aria-label="Yükleniyor">
      {Array.from({ length: rows }, (_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  )
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">Planlar yüklenemedi.</p>
      <Button type="button" variant="secondary" className="min-h-11" onClick={onRetry}>
        Tekrar dene
      </Button>
    </div>
  )
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <p className="px-6 py-12 text-center text-sm text-muted-foreground">{children}</p>
  )
}
