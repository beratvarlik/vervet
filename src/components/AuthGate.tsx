import { Outlet } from 'react-router'

import { LogoScreen } from '@/components/LogoScreen'
import { useAuth } from '@/lib/auth-context'

/** Oturum yoksa yalnızca logolu boş ekran; varsa uygulama. */
export function AuthGate() {
  const { session, loading } = useAuth()

  if (loading) return <LogoScreen />
  if (!session) return <LogoScreen interactive />
  return <Outlet />
}
