// DİKKAT: Bu dosya `supabase gen types` çıktısının biçimiyle elle yazıldı (Docker/uzak proje
// olmadığı için). Docker çalışınca veya proje bağlanınca `pnpm gen:types` ile yeniden üret.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      notification_log: {
        Row: {
          dedupe_key: string
          id: string
          kind: string
          owner_id: string
          payload: Json | null
          plan_id: string | null
          sent_at: string
        }
        Insert: {
          dedupe_key: string
          id?: string
          kind: string
          owner_id?: string
          payload?: Json | null
          plan_id?: string | null
          sent_at?: string
        }
        Update: {
          dedupe_key?: string
          id?: string
          kind?: string
          owner_id?: string
          payload?: Json | null
          plan_id?: string | null
          sent_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'notification_log_plan_id_fkey'
            columns: ['plan_id']
            isOneToOne: false
            referencedRelation: 'plans'
            referencedColumns: ['id']
          },
        ]
      }
      plans: {
        Row: {
          amount: number | null
          carry_count: number
          category: Database['public']['Enums']['plan_category']
          created_at: string
          date: string
          details: string | null
          done_at: string | null
          end_time: string | null
          id: string
          location: string | null
          original_date: string | null
          owner_id: string
          remind_before_min: number | null
          series_id: string | null
          snooze_count: number
          start_time: string | null
          status: Database['public']['Enums']['plan_status']
          title: string
          updated_at: string
          url: string | null
        }
        Insert: {
          amount?: number | null
          carry_count?: number
          category: Database['public']['Enums']['plan_category']
          created_at?: string
          date: string
          details?: string | null
          done_at?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          original_date?: string | null
          owner_id?: string
          remind_before_min?: number | null
          series_id?: string | null
          snooze_count?: number
          start_time?: string | null
          status?: Database['public']['Enums']['plan_status']
          title: string
          updated_at?: string
          url?: string | null
        }
        Update: {
          amount?: number | null
          carry_count?: number
          category?: Database['public']['Enums']['plan_category']
          created_at?: string
          date?: string
          details?: string | null
          done_at?: string | null
          end_time?: string | null
          id?: string
          location?: string | null
          original_date?: string | null
          owner_id?: string
          remind_before_min?: number | null
          series_id?: string | null
          snooze_count?: number
          start_time?: string | null
          status?: Database['public']['Enums']['plan_status']
          title?: string
          updated_at?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: 'plans_series_id_fkey'
            columns: ['series_id']
            isOneToOne: false
            referencedRelation: 'series'
            referencedColumns: ['id']
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          endpoint: string
          id: string
          last_seen_at: string
          owner_id: string
          p256dh: string
          user_agent: string | null
        }
        Insert: {
          auth: string
          created_at?: string
          endpoint: string
          id?: string
          last_seen_at?: string
          owner_id?: string
          p256dh: string
          user_agent?: string | null
        }
        Update: {
          auth?: string
          created_at?: string
          endpoint?: string
          id?: string
          last_seen_at?: string
          owner_id?: string
          p256dh?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      series: {
        Row: {
          amount: number | null
          category: Database['public']['Enums']['plan_category']
          created_at: string
          day_of_month: number | null
          details: string | null
          end_time: string | null
          ends_on: string | null
          frequency: string
          id: string
          interval_n: number
          location: string | null
          owner_id: string
          remind_before_min: number | null
          start_time: string | null
          starts_on: string
          title: string
          updated_at: string
          url: string | null
          weekdays: number[] | null
        }
        Insert: {
          amount?: number | null
          category: Database['public']['Enums']['plan_category']
          created_at?: string
          day_of_month?: number | null
          details?: string | null
          end_time?: string | null
          ends_on?: string | null
          frequency: string
          id?: string
          interval_n?: number
          location?: string | null
          owner_id?: string
          remind_before_min?: number | null
          start_time?: string | null
          starts_on: string
          title: string
          updated_at?: string
          url?: string | null
          weekdays?: number[] | null
        }
        Update: {
          amount?: number | null
          category?: Database['public']['Enums']['plan_category']
          created_at?: string
          day_of_month?: number | null
          details?: string | null
          end_time?: string | null
          ends_on?: string | null
          frequency?: string
          id?: string
          interval_n?: number
          location?: string | null
          owner_id?: string
          remind_before_min?: number | null
          start_time?: string | null
          starts_on?: string
          title?: string
          updated_at?: string
          url?: string | null
          weekdays?: number[] | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          created_at: string
          digest_times: Json
          id: string
          last_rollover_date: string | null
          owner_id: string
          payment_remind_days_before: number
          quiet_end: string
          quiet_start: string
          remind_defaults: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          digest_times?: Json
          id?: string
          last_rollover_date?: string | null
          owner_id?: string
          payment_remind_days_before?: number
          quiet_end?: string
          quiet_start?: string
          remind_defaults?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          digest_times?: Json
          id?: string
          last_rollover_date?: string | null
          owner_id?: string
          payment_remind_days_before?: number
          quiet_end?: string
          quiet_start?: string
          remind_defaults?: Json
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: { [_ in never]: never }
    Functions: {
      category_carries_over: {
        Args: { c: Database['public']['Enums']['plan_category'] }
        Returns: boolean
      }
      category_has_amount: {
        Args: { c: Database['public']['Enums']['plan_category'] }
        Returns: boolean
      }
    }
    Enums: {
      plan_category: 'ders' | 'duzenli_odeme' | 'odeme' | 'onemli' | 'ertelenebilir'
      plan_status: 'pending' | 'done' | 'skipped'
    }
    CompositeTypes: { [_ in never]: never }
  }
}

type DefaultSchema = Database['public']

export type Tables<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Row']
export type TablesInsert<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof DefaultSchema['Tables']> =
  DefaultSchema['Tables'][T]['Update']
export type Enums<T extends keyof DefaultSchema['Enums']> = DefaultSchema['Enums'][T]

export const Constants = {
  public: {
    Enums: {
      plan_category: ['ders', 'duzenli_odeme', 'odeme', 'onemli', 'ertelenebilir'],
      plan_status: ['pending', 'done', 'skipped'],
    },
  },
} as const
