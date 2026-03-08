import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, User, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  // Already logged in?
  useEffect(() => {
    const session = localStorage.getItem('ew_admin_session')
    if (session) navigate('/admin/dashboard', { replace: true })
  }, [navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const { data, error: dbError } = await supabase
        .from('admins')
        .select('id, username, full_name')
        .eq('username', username.trim().toLowerCase())
        .eq('password', password)
        .single()

      if (dbError || !data) {
        setError('Invalid username or password.')
        setLoading(false)
        return
      }

      // Save admin session to localStorage
      localStorage.setItem('ew_admin_session', JSON.stringify({
        id: data.id,
        username: data.username,
        fullName: data.full_name,
        loginAt: new Date().toISOString(),
      }))

      navigate('/admin/dashboard', { replace: true })
    } catch {
      setError('Could not connect to the server. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #001C3F 0%, #00295F 60%, #102E5A 100%)' }}
    >
      {/* Decorative glow */}
      <div className="absolute top-1/4 right-1/3 w-80 h-80 rounded-full pointer-events-none opacity-10"
        style={{ background: 'radial-gradient(circle, #E31A2D, transparent)' }} />

      <div className="w-full max-w-sm relative">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="inline-flex items-center justify-center w-16 h-16 bg-brand-red rounded-2xl shadow-lg mb-4"
            style={{ boxShadow: '0 8px 24px rgba(227,26,45,0.4)' }}
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading font-bold text-3xl text-white mb-1">Admin Portal</h1>
          <p className="text-blue-200 text-sm opacity-80">Electric World Management Panel</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{
            background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">

            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/15 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="admin"
                  required
                  autoComplete="username"
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(227,26,45,0.5)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)' }}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  className="w-full rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none transition-all"
                  style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(227,26,45,0.5)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 font-semibold text-sm py-3 rounded-xl transition-all mt-2 active:scale-95 disabled:opacity-60"
              style={{ background: '#E31A2D', color: '#fff', boxShadow: '0 4px 16px rgba(227,26,45,0.4)' }}
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" strokeWidth={2.5} />
                  Sign In
                </>
              )}
            </button>
          </form>

          {/* Hint */}
          <div className="mt-5 p-3 rounded-xl text-center" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <p className="text-white/40 text-xs">Default credentials</p>
            <p className="text-white/70 text-xs font-mono mt-1">admin / 123</p>
          </div>
        </div>

        <p className="text-center text-white/30 text-xs mt-5">
          Electric World Admin · Authorized personnel only
        </p>
      </div>
    </div>
  )
}
