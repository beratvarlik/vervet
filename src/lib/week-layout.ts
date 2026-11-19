import { toMinutes } from '@/lib/date'
import type { Plan } from '@/lib/plans'

/** Hafta ızgarası 07:00-24:00 arasını gösterir. */
export const GRID_START_MIN = 7 * 60
export const GRID_END_MIN = 24 * 60
/** Süresi olmayan (bitiş saati girilmemiş) planlar bu kadar dakika gösterilir. */
export const DEFAULT_DURATION_MIN = 60
/** Okunabilirlik için bir bloğun en az yüksekliği (dakika). */
export const MIN_BLOCK_MIN = 30

export type PositionedPlan = {
  plan: Plan
  /** Izgaraya göre kırpılmış başlangıç/bitiş (dakika). */
  start: number
  end: number
  /** Çakışan bloklar yan yana dizilir: sütun sırası ve kümedeki sütun sayısı. */
  column: number
  columns: number
}

/** Bir günün saatli planlarını ızgaraya yerleştirir; çakışanları yan yana böler. */
export function layoutDayBlocks(plans: Plan[]): PositionedPlan[] {
  const items = plans
    .filter((p) => p.start_time)
    .map((plan) => {
      const rawStart = toMinutes(plan.start_time!)
      const rawEnd = plan.end_time ? toMinutes(plan.end_time) : rawStart + DEFAULT_DURATION_MIN
      const start = Math.min(Math.max(rawStart, GRID_START_MIN), GRID_END_MIN - MIN_BLOCK_MIN)
      const end = Math.min(Math.max(rawEnd, start + MIN_BLOCK_MIN), GRID_END_MIN)
      return { plan, start, end, column: 0, columns: 1 }
    })
    .sort((a, b) => a.start - b.start || b.end - a.end)

  let cluster: typeof items = []
  let columnEnds: number[] = []
  let clusterEnd = -1

  const finishCluster = () => {
    for (const item of cluster) item.columns = columnEnds.length
    cluster = []
    columnEnds = []
  }

  for (const item of items) {
    if (cluster.length > 0 && item.start >= clusterEnd) finishCluster()

    let column = columnEnds.findIndex((end) => end <= item.start)
    if (column === -1) {
      column = columnEnds.length
      columnEnds.push(item.end)
    } else {
      columnEnds[column] = item.end
    }
    item.column = column
    cluster.push(item)
    clusterEnd = cluster.length === 1 ? item.end : Math.max(clusterEnd, item.end)
  }
  finishCluster()

  return items
}

/** Dakika -> ızgara içindeki piksel konumu. */
export function minutesToPx(minutes: number, hourHeight: number): number {
  return ((minutes - GRID_START_MIN) / 60) * hourHeight
}
