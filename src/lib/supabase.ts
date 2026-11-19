import { createClient } from '@supabase/supabase-js'

import type { Database } from '@/types/db'

const url = import.meta.env.VITE_SUPABASE_URL
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!url || !anonKey) {
  throw new Error(
    'VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY tanımlı olmalı (.env.example dosyasına bak).',
  )
}

// Yalnızca anon anahtarı istemciye girer; service role anahtarı asla.
export const supabase = createClient<Database>(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    // /p#<secret> eşleme linkinin hash'ini kendimiz işliyoruz; supabase-js URL'den oturum aramasın.
    detectSessionInUrl: false,
  },
})
