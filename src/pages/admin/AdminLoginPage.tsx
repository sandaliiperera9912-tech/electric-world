import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, Eye, EyeOff, ShieldCheck, AlertCircle } from 'lucide-react'
import { useAuth } from '@/store/authContext'
import { supabase } from '@/lib/supabase'

export default function AdminLoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signIn, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()

  // Redirect if already logged in as admin
  useEffect(() => {
    if (authLoading || !user) return
    supabase
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data?.is_admin) navigate('/admin/dashboard', { replace: true })
      })
  }, [user, authLoading, navigate])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
      // Check admin status after sign in
      const { data: { user: signedInUser } } = await supabase.auth.getUser()
      if (!signedInUser) throw new Error('Login failed')

      const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', signedInUser.id)
        .single()

      if (!profile?.is_admin) {
        await supabase.auth.signOut()
        setError('Access denied. This account does not have admin privileges.')
        setLoading(false)
        return
      }

      navigate('/admin/dashboard', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Login failed'
      setError(msg.includes('admin') ? msg : 'Invalid email or password.')
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
          <div className="inline-flex items-center justify-center w-16 h-16 bg-brand-red rounded-2xl shadow-lg mb-4"
            style={{ boxShadow: '0 8px 24px rgba(227,26,45,0.4)' }}
          >
            <ShieldCheck className="w-8 h-8 text-white" />
          </div>
          <h1 className="font-heading font-bold text-3xl text-white mb-1">Admin Portal</h1>
          <p className="text-blue-200 text-sm opacity-80">Sign in to manage Electric World</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-7"
          style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-start gap-2.5 bg-red-500/15 border border-red-500/30 text-red-300 text-sm px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-white/60">Admin Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@electricworld.com"
                  required
                  className="w-full rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(227,26,45,0.5)' }}
                  onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.15)' }}
                />
              </div>
            </div>

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
                  className="w-full rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-white/30 focus:outline-none transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
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
                  Sign In to Admin
                </>
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-white/30 text-xs mt-5">
          Electric World Admin Panel · For authorized personnel only
        </p>
      </div>
    </div>
  )
}
