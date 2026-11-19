import { TZDate } from '@date-fns/tz'
import { format } from 'date-fns'
import { tr } from 'date-fns/locale'

export const TIME_ZONE = 'Europe/Istanbul'

/** Europe/Istanbul saat diliminde şu an. */
export function nowInIstanbul(): TZDate {
  return TZDate.tz(TIME_ZONE)
}

/** "19 Kasım Çarşamba" */
export function formatDayLong(date: Date): string {
  return format(date, 'd MMMM EEEE', { locale: tr })
}
