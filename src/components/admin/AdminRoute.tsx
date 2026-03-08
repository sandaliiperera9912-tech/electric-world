import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'

interface Props {
  children: React.ReactNode
}

export default function AdminRoute({ children }: Props) {
  const [checking, setChecking] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const session = localStorage.getItem('ew_admin_session')
    setIsAdmin(!!session)
    setChecking(false)
  }, [])

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#001C3F' }}>
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAdmin) {
    return <Navigate to="/admin/login" replace />
  }

  return <>{children}</>
}
