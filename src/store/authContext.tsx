import { createContext, useContext, useState, useEffect, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'
import { signIn as authSignIn, signOut as authSignOut, signUp as authSignUp } from '@/lib/auth'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  signUp: (email: string, password: string, username: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data.session)
        setUser(data.session?.user ?? null)
      })
      .catch(() => {
        // Supabase not configured yet — that's fine
      })
      .finally(() => {
        setLoading(false)
      })

    let subscription: { unsubscribe: () => void } | null = null
    try {
      const { data } = supabase.auth.onAuthStateChange((_event, session) => {
        setSession(session)
        setUser(session?.user ?? null)
        setLoading(false)
      })
      subscription = data.subscription
    } catch {
      setLoading(false)
    }

    return () => subscription?.unsubscribe()
  }, [])

  const signIn = async (email: string, password: string) => {
    const data = await authSignIn(email, password)
    setSession(data.session)
    setUser(data.user)
  }

  const signOut = async () => {
    await authSignOut()
    setSession(null)
    setUser(null)
  }

  const signUp = async (email: string, password: string, username: string) => {
    await authSignUp(email, password, username)
  }

  return (
    <AuthContext.Provider value={{ user, session, loading, signIn, signOut, signUp }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
