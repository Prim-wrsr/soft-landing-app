import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      user_data: {
        Row: {
          id: string
          user_id: string
          business_type: string
          file_name: string
          data: any
          mapped_columns: any
          health_score: number
          is_clean: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          business_type: string
          file_name: string
          data: any
          mapped_columns: any
          health_score?: number
          is_clean?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          business_type?: string
          file_name?: string
          data?: any
          mapped_columns?: any
          health_score?: number
          is_clean?: boolean
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}