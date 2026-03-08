import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/store/authContext'
import { supabase } from '@/lib/supabase'

export default function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    if (!user) { setIsAdmin(false); return }

    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data }) => setIsAdmin(data?.is_admin === true))
      .catch(() => setIsAdmin(false))
  }, [user])

  if (loading || isAdmin === null) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#F6F8FA' }}>
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#E31A2D', borderTopColor: 'transparent' }} />
      </div>
    )
  }

  if (!user || !isAdmin) return <Navigate to="/admin/login" replace />

  return <>{children}</>
}
