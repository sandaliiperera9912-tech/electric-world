import { createClient } from '@supabase/supabase-js'

const rawUrl = import.meta.env.VITE_SUPABASE_URL as string
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Only use credentials if they look like real values (start with https:// and look like a key)
const isValidUrl = rawUrl && rawUrl.startsWith('https://') && rawUrl.includes('supabase')
const isValidKey = rawKey && rawKey.length > 20 && !rawKey.includes(' ')

const supabaseUrl = isValidUrl ? rawUrl : 'https://placeholder.supabase.co'
const supabaseAnonKey = isValidKey ? rawKey : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder'

export const isSupabaseConfigured = isValidUrl && isValidKey

if (!isSupabaseConfigured) {
  console.warn(
    '⚡ Electric World: Supabase not configured. Add real VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local to enable auth and database features.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
