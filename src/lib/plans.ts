import { useQuery } from '@tanstack/react-query'

import { CATEGORIES, CATEGORY_ORDER, type PlanCategory } from '@/lib/categories'
import { formatTime, todayISO, toMinutes } from '@/lib/date'
import { supabase } from '@/lib/supabase'
import type { Tables } from '@/types/db'

export type Plan = Tables<'plans'>

/** [from, to] (iki uç dahil) aralığındaki planlar. Tarihler 'YYYY-MM-DD'. */
export function usePlans(from: string, to: string) {
  return useQuery({
    queryKey: ['plans', from, to],
    queryFn: async (): Promise<Plan[]> => {
      const { data, error } = await supabase
        .from('plans')
        .select('*')
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true })
        .order('start_time', { ascending: true, nullsFirst: true })
      if (error) throw error
      return data
    },
  })
}

/** Bugün hâlâ bekleyen plan sayısı (başlıktaki "kalan plan"). */
export function useTodayRemaining(): number | undefined {
  const today = todayISO()
  const { data } = usePlans(today, today)
  return data?.filter((p) => p.status === 'pending').length
}

const categoryRank = new Map(CATEGORY_ORDER.map((c, i) => [c, i]))

/** Saatli planlar saate göre, saatsizler sonda; eşitlikte kategori sırası, sonra başlık. */
export function comparePlans(a: Plan, b: Plan): number {
  const sa = a.start_time ? toMinutes(a.start_time) : Number.POSITIVE_INFINITY
  const sb = b.start_time ? toMinutes(b.start_time) : Number.POSITIVE_INFINITY
  if (sa !== sb) return sa - sb
  const ca = categoryRank.get(a.category) ?? 0
  const cb = categoryRank.get(b.category) ?? 0
  if (ca !== cb) return ca - cb
  return a.title.localeCompare(b.title, 'tr')
}

export type DayGroups = {
  /** Önceki günlerden taşınıp hâlâ bekleyenler (carry_count > 0). */
  carried: Plan[]
  /** Önemli Plan kategorisi (bekleyen). */
  important: Plan[]
  /** Zaman çizgisi: saatsiz ("tüm gün") ve saatli planlar (Önemli ve Ertelenebilir hariç). */
  allDay: Plan[]
  timed: Plan[]
  /** Ertelenebilir Plan kategorisi (bekleyen). */
  deferrable: Plan[]
  /** Yapıldı ya da atlandı. */
  finished: Plan[]
}

/** Tek bir günün planlarını Bugün görünümündeki bölümlere ayırır. */
export function groupDayPlans(plans: Plan[]): DayGroups {
  const groups: DayGroups = {
    carried: [],
    important: [],
    allDay: [],
    timed: [],
    deferrable: [],
    finished: [],
  }

  for (const plan of [...plans].sort(comparePlans)) {
    if (plan.status !== 'pending') groups.finished.push(plan)
    else if (plan.carry_count > 0) groups.carried.push(plan)
    else if (plan.category === 'onemli') groups.important.push(plan)
    else if (plan.category === 'ertelenebilir') groups.deferrable.push(plan)
    else if (plan.start_time) groups.timed.push(plan)
    else groups.allDay.push(plan)
  }

  // En çok taşınan en üstte.
  groups.carried.sort((a, b) => b.carry_count - a.carry_count || comparePlans(a, b))
  return groups
}

export function carriedLabel(plan: Plan): string {
  return plan.carry_count <= 1 ? 'Dünden kaldı' : `${plan.carry_count} gündür taşınıyor`
}

const tryWhole = new Intl.NumberFormat('tr-TR', {
  style: 'currency',
  currency: 'TRY',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})
const tryFraction = new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' })

/** "₺9.500" (tam sayıysa kuruş yok) / "₺349,90" */
export function formatAmount(amount: number): string {
  return (Number.isInteger(amount) ? tryWhole : tryFraction).format(amount)
}

export function isPaymentCategory(category: PlanCategory): boolean {
  return CATEGORIES[category].hasAmount
}

/** "09:00–10:30", "09:00" veya saat yoksa "Tüm gün". */
export function timeLabel(plan: Pick<Plan, 'start_time' | 'end_time'>): string {
  if (!plan.start_time) return 'Tüm gün'
  const start = formatTime(plan.start_time)
  return plan.end_time ? `${start}–${formatTime(plan.end_time)}` : start
}
