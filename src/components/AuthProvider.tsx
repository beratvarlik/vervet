import type { Session } from '@supabase/supabase-js'
import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useState, type ReactNode } from 'react'

import { AuthContext } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const queryClient = useQueryClient()

  useEffect(() => {
    let active = true

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return
      setSession(data.session)
      setLoading(false)
    })

    // Oturum düşerse (çıkış, iptal, yenileme hatası) session null olur ve AuthGate boş ekrana döner.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, next) => {
      // Oturum düşünce önbellekteki planlar da silinsin.
      if (event === 'SIGNED_OUT') queryClient.clear()
      setSession(next)
      setLoading(false)
    })

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [queryClient])

  return <AuthContext value={{ session, loading }}>{children}</AuthContext>
}
