import { CalendarDays, CalendarRange, Settings, Sun } from 'lucide-react'
import { NavLink } from 'react-router'

import { cn } from '@/lib/utils'

const tabs = [
  { to: '/', label: 'Bugün', icon: Sun, end: true },
  { to: '/hafta', label: 'Hafta', icon: CalendarRange, end: false },
  { to: '/takvim', label: 'Takvim', icon: CalendarDays, end: false },
  { to: '/ayarlar', label: 'Ayarlar', icon: Settings, end: false },
] as const

export function TabBar() {
  return (
    <nav
      aria-label="Ana gezinme"
      className="shrink-0 border-t bg-background/95 pb-safe-bottom backdrop-blur"
    >
      <ul className="grid grid-cols-4 pl-safe-left pr-safe-right">
        {tabs.map(({ to, label, icon: Icon, end }) => (
          <li key={to}>
            <NavLink
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs font-medium transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )
              }
            >
              <Icon className="size-6" aria-hidden />
              {label}
            </NavLink>
          </li>
        ))}
      </ul>
    </nav>
  )
}
