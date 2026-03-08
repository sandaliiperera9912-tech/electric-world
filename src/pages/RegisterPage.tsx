import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Zap, Mail, Lock, User, Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/store/authContext'
import { supabase } from '@/lib/supabase'

function ValidationItem({ valid, text }: { valid: boolean; text: string }) {
  return (
    <div className={`flex items-center gap-1.5 text-xs transition-colors ${valid ? 'text-green-600' : 'text-text-muted'}`}>
      <CheckCircle className="w-3.5 h-3.5" />
      {text}
    </div>
  )
}

export default function RegisterPage() {
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { signUp } = useAuth()
  const navigate = useNavigate()

  const usernameValid = username.length >= 3 && !username.includes(' ')
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  const passwordValid = password.length >= 6
  const formValid = usernameValid && emailValid && passwordValid

  const checkUsernameAvailable = async (name: string): Promise<boolean> => {
    const { data } = await supabase.from('profiles').select('id').eq('username', name).maybeSingle()
    return !data
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formValid) return
    setError('')
    setLoading(true)

    try {
      const available = await checkUsernameAvailable(username.toLowerCase())
      if (!available) {
        setError('That username is already taken. Please choose another.')
        setLoading(false)
        return
      }

      await signUp(email, password, username.toLowerCase())
      navigate('/', { replace: true })
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Registration failed. Please try again.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#F6F8FA' }}>
      <div className="w-full max-w-md relative">

        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 bg-brand-red rounded-xl flex items-center justify-center shadow-md">
              <Zap className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-heading font-bold text-xl text-text-primary">
              Electric <span className="text-brand-red">World</span>
            </span>
          </Link>
          <h1 className="font-heading font-bold text-3xl text-text-primary mb-2">Create account</h1>
          <p className="text-text-muted">Join thousands of happy customers</p>
        </div>

        {/* Form card */}
        <div className="bg-white border rounded-2xl p-8 shadow-card" style={{ borderColor: '#D9E1EB' }}>
          <form onSubmit={handleSubmit} className="space-y-5">

            {error && (
              <div className="flex items-center gap-2.5 bg-red-50 border border-brand-red/20 text-brand-red text-sm px-4 py-3 rounded-xl">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            {/* Username */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="yourname"
                  required
                  className="input-dark pl-10"
                />
              </div>
              {username && (
                <div className="flex gap-3 flex-wrap">
                  <ValidationItem valid={username.length >= 3} text="At least 3 characters" />
                  <ValidationItem valid={!username.includes(' ')} text="No spaces" />
                </div>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="input-dark pl-10"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-text-secondary">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Minimum 6 characters"
                  required
                  className="input-dark pl-10 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(prev => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-secondary transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {password && (
                <ValidationItem valid={passwordValid} text="At least 6 characters" />
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !formValid}
              className="btn-primary w-full flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <p className="text-center text-text-muted text-sm mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-brand-red hover:text-brand-red-dark font-medium transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
