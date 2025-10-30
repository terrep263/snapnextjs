import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
})

// Type definitions
export interface Customer {
  id: string
  email: string
  name: string | null
  created_at: string
}

export interface Event {
  id: string
  customer_email: string
  event_name: string
  event_slug: string
  event_date: string | null
  package_type: 'basic' | 'premium'
  qr_code_url: string | null
  password: string | null
  stripe_payment_id: string
  amount_paid: number
  expires_at: string
  created_at: string
}

export interface Upload {
  id: string
  event_id: string
  file_url: string
  file_type: 'image' | 'video'
  guest_name: string | null
  uploaded_at: string
}
