import { TZDate } from '@date-fns/tz'
import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from 'date-fns'
import { tr } from 'date-fns/locale'

export const TIME_ZONE = 'Europe/Istanbul'

/**
 * Tarihler uygulama içinde 'YYYY-MM-DD' metni olarak taşınır (DB'deki date sütunuyla aynı).
 * Gün aritmetiği yerel Date ile yapılıp aynı biçimde geri yazılır, yani saat diliminden etkilenmez.
 * "Şu an" ise her zaman Europe/Istanbul'dur.
 */

/** Europe/Istanbul saat diliminde şu an. */
export function nowInIstanbul(): TZDate {
  return TZDate.tz(TIME_ZONE)
}

export function toISODate(date: Date): string {
  return format(date, 'yyyy-MM-dd')
}

/** Istanbul'a göre bugün, 'YYYY-MM-DD'. */
export function todayISO(): string {
  return toISODate(nowInIstanbul())
}

/** Istanbul'a göre günün başından bu yana geçen dakika. */
export function nowMinutesIstanbul(): number {
  const now = nowInIstanbul()
  return now.getHours() * 60 + now.getMinutes()
}

export function isValidISODate(value: string | null | undefined): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const parsed = parseISO(value)
  return isValid(parsed) && toISODate(parsed) === value
}

export function isValidISOMonth(value: string | null | undefined): value is string {
  return !!value && /^\d{4}-\d{2}$/.test(value) && isValidISODate(`${value}-01`)
}

export function addDaysISO(iso: string, amount: number): string {
  return toISODate(addDays(parseISO(iso), amount))
}

export function addMonthsISO(monthISO: string, amount: number): string {
  return format(addMonths(parseISO(`${monthISO}-01`), amount), 'yyyy-MM')
}

/** Haftanın Pazartesi'si. */
export function mondayOf(iso: string): string {
  return toISODate(startOfWeek(parseISO(iso), { weekStartsOn: 1 }))
}

export function weekDays(mondayISO: string): string[] {
  return Array.from({ length: 7 }, (_, i) => addDaysISO(mondayISO, i))
}

/** Ay görünümü ızgarası: Pazartesi'den başlayan, ayı kapsayan tam haftalar. */
export function monthGridDays(monthISO: string): string[] {
  const first = parseISO(`${monthISO}-01`)
  const start = startOfWeek(startOfMonth(first), { weekStartsOn: 1 })
  const end = endOfWeek(endOfMonth(first), { weekStartsOn: 1 })
  const days: string[] = []
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(toISODate(d))
  return days
}

export function monthOf(iso: string): string {
  return iso.slice(0, 7)
}

/** "19 Kasım Çarşamba" */
export function formatDayLong(date: Date): string {
  return format(date, 'd MMMM EEEE', { locale: tr })
}

export function formatDayLongISO(iso: string): string {
  return formatDayLong(parseISO(iso))
}

/** "Per" */
export function formatWeekdayShort(iso: string): string {
  return format(parseISO(iso), 'EEE', { locale: tr })
}

export function formatDayNumber(iso: string): number {
  return parseISO(iso).getDate()
}

/** "Kasım 2026" */
export function formatMonthYear(monthISO: string): string {
  return format(parseISO(`${monthISO}-01`), 'LLLL yyyy', { locale: tr })
}

/** "16 – 22 Kasım" veya "30 Kasım – 6 Aralık" */
export function formatWeekRange(mondayISO: string): string {
  const start = parseISO(mondayISO)
  const end = addDays(start, 6)
  if (start.getMonth() === end.getMonth()) {
    return `${start.getDate()} – ${format(end, 'd MMMM', { locale: tr })}`
  }
  return `${format(start, 'd MMMM', { locale: tr })} – ${format(end, 'd MMMM', { locale: tr })}`
}

/** 'HH:MM:SS' -> 'HH:MM' (24 saatlik). */
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

/** 'HH:MM[:SS]' -> günün başından dakika. */
export function toMinutes(time: string): number {
  const [h, m] = time.split(':')
  return Number(h) * 60 + Number(m)
}

/** Dakika -> 'HH:MM'. */
export function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

/** Seçili günün bugüne göre etiketi; yoksa null. */
export function relativeDayLabel(iso: string, today: string): string | null {
  if (iso === today) return 'Bugün'
  if (iso === addDaysISO(today, 1)) return 'Yarın'
  if (iso === addDaysISO(today, -1)) return 'Dün'
  return null
}
