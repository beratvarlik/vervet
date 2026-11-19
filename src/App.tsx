import { BrowserRouter, Navigate, Route, Routes } from 'react-router'

import { AppShell } from '@/components/AppShell'
import { CalendarPage } from '@/pages/CalendarPage'
import { PairPage } from '@/pages/PairPage'
import { PlanPage } from '@/pages/PlanPage'
import { SettingsPage } from '@/pages/SettingsPage'
import { TodayPage } from '@/pages/TodayPage'
import { WeekPage } from '@/pages/WeekPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/p" element={<PairPage />} />
        <Route element={<AppShell />}>
          <Route index element={<TodayPage />} />
          <Route path="hafta" element={<WeekPage />} />
          <Route path="takvim" element={<CalendarPage />} />
          <Route path="plan/:id" element={<PlanPage />} />
          <Route path="ayarlar" element={<SettingsPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
