import { Plus } from 'lucide-react'
import { Outlet } from 'react-router'

import { AppHeader } from '@/components/AppHeader'
import { TabBar } from '@/components/TabBar'
import { Button } from '@/components/ui/button'

export function AppShell() {
  return (
    <div className="relative flex h-dvh flex-col bg-background">
      <AppHeader />

      <main className="flex-1 overflow-y-auto overscroll-contain pl-safe-left pr-safe-right">
        <Outlet />
      </main>

      {/* Sağ altta + butonu: tab bar'ın (56px + safe-area) hemen üstünde. */}
      <Button
        type="button"
        size="icon"
        aria-label="Plan ekle"
        className="absolute right-[max(1rem,env(safe-area-inset-right))] bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] size-14 rounded-full shadow-lg"
      >
        <Plus className="size-7" aria-hidden />
      </Button>

      <TabBar />
    </div>
  )
}
