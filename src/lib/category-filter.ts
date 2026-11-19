import { useCallback, useState } from 'react'

import { CATEGORY_ORDER, type PlanCategory } from '@/lib/categories'

const STORAGE_KEY = 'vervet.categoryFilter'

function isCategory(value: unknown): value is PlanCategory {
  return typeof value === 'string' && (CATEGORY_ORDER as readonly string[]).includes(value)
}

function read(): PlanCategory[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? parsed.filter(isCategory) : []
  } catch {
    return []
  }
}

function write(value: PlanCategory[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(value))
  } catch {
    // Depolama kapalı olabilir (özel pencere vb.); filtre yalnızca bu oturumda geçerli olur.
  }
}

/**
 * Çoklu kategori filtresi. Hiçbiri seçili değilse tüm kategoriler gösterilir.
 * Seçim localStorage'da saklanır (erişilemezse sessizce yok sayılır).
 */
export function useCategoryFilter() {
  const [selected, setSelected] = useState<PlanCategory[]>(read)

  const toggle = useCallback((category: PlanCategory) => {
    setSelected((prev) => {
      const next = prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category]
      write(next)
      return next
    })
  }, [])

  const clear = useCallback(() => {
    write([])
    setSelected([])
  }, [])

  const matches = useCallback(
    (category: PlanCategory) => selected.length === 0 || selected.includes(category),
    [selected],
  )

  return { selected, toggle, clear, matches }
}
