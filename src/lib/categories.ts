import {
  GraduationCap,
  Hourglass,
  Repeat,
  Star,
  Wallet,
  type LucideIcon,
} from 'lucide-react'

import type { Enums } from '@/types/db'

export type PlanCategory = Enums<'plan_category'>

export type CategoryMeta = {
  /** Arayüzde gösterilen Türkçe ad. */
  label: string
  /** CSS değişkeni (src/index.css, açık/koyu temaya göre değişir). */
  color: string
  icon: LucideIcon
  /** false ise yapılmayan plan ertesi güne taşınmaz (Ders). SQL: category_carries_over(). */
  carryOver: boolean
  /** Tutar alanı yalnızca bu kategorilerde olur. SQL: category_has_amount(). */
  hasAmount: boolean
  /** Plan saatinden kaç dk önce hatırlatılır; null = varsayılan hatırlatma yok. */
  defaultRemindBeforeMin: number | null
}

// SQL tarafındaki settings.remind_defaults varsayılanıyla aynı değerler.
export const CATEGORIES = {
  ders: {
    label: 'Ders',
    color: 'var(--cat-ders)',
    icon: GraduationCap,
    carryOver: false,
    hasAmount: false,
    defaultRemindBeforeMin: 30,
  },
  duzenli_odeme: {
    label: 'Düzenli Ödemeler',
    color: 'var(--cat-duzenli-odeme)',
    icon: Repeat,
    carryOver: true,
    hasAmount: true,
    defaultRemindBeforeMin: 60,
  },
  odeme: {
    label: 'Ödemeler',
    color: 'var(--cat-odeme)',
    icon: Wallet,
    carryOver: true,
    hasAmount: true,
    defaultRemindBeforeMin: 60,
  },
  onemli: {
    label: 'Önemli Plan',
    color: 'var(--cat-onemli)',
    icon: Star,
    carryOver: true,
    hasAmount: false,
    defaultRemindBeforeMin: 60,
  },
  ertelenebilir: {
    label: 'Ertelenebilir Plan',
    color: 'var(--cat-ertelenebilir)',
    icon: Hourglass,
    carryOver: true,
    hasAmount: false,
    defaultRemindBeforeMin: 15,
  },
} as const satisfies Record<PlanCategory, CategoryMeta>

/** Arayüzde gösterim sırası. */
export const CATEGORY_ORDER: readonly PlanCategory[] = [
  'onemli',
  'ders',
  'odeme',
  'duzenli_odeme',
  'ertelenebilir',
]
