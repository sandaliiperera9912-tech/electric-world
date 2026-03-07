import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { User, Mail, Edit3, Save, X, LogOut, Package, Zap, Camera } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import ChatWidget from '@/components/ai/ChatWidget'
import { useAuth } from '@/store/authContext'
import { supabase } from '@/lib/supabase'
import type { Profile } from '@/types'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [editing, setEditing] = useState(false)
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!user) return
    supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setProfile(data as Profile)
          setFullName(data.full_name || '')
        }
      })
  }, [user])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName })
      .eq('id', user.id)

    if (!error) {
      setProfile(prev => prev ? { ...prev, full_name: fullName } : prev)
      setEditing(false)
      setMessage('Profile updated successfully!')
      setTimeout(() => setMessage(''), 3000)
    }
    setSaving(false)
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  if (!user) return null

  return (
    <div className="min-h-screen bg-dark-bg">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="max-w-2xl mx-auto">

          <h1 className="font-heading font-bold text-3xl text-text-primary mb-8">My Profile</h1>

          {message && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-400 text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-2">
              <Save className="w-4 h-4" />
              {message}
            </div>
          )}

          {/* Avatar + info card */}
          <div className="bg-dark-card border border-dark-border rounded-2xl p-6 mb-6">
            <div className="flex items-start gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-heading font-bold">
                  {(profile?.username || user.email || 'U')[0].toUpperCase()}
                </div>
                <button className="absolute -bottom-1 -right-1 w-7 h-7 bg-dark-muted border border-dark-border rounded-full flex items-center justify-center text-text-muted hover:text-text-primary transition-colors">
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="flex-1">
                <h2 className="font-heading font-bold text-xl text-text-primary">
                  {profile?.username || 'Loading...'}
                </h2>
                <p className="text-text-muted text-sm mt-0.5">{user.email}</p>
                <p className="text-text-muted text-xs mt-1">
                  Member since {new Date(user.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}
                </p>
              </div>
            </div>

            <div className="border-t border-dark-border mt-5 pt-5 space-y-4">

              {/* Username (read-only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" />
                  Username
                </label>
                <div className="input-dark text-text-muted cursor-not-allowed opacity-70">
                  @{profile?.username}
                </div>
              </div>

              {/* Email (read-only) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                  <Mail className="w-3.5 h-3.5" />
                  Email
                </label>
                <div className="input-dark text-text-muted cursor-not-allowed opacity-70">
                  {user.email}
                </div>
              </div>

              {/* Full name (editable) */}
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-text-muted flex items-center gap-1.5">
                  <Edit3 className="w-3.5 h-3.5" />
                  Full Name
                </label>
                {editing ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder="Your full name"
                      className="input-dark flex-1"
                    />
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="btn-primary px-4 py-2.5 flex items-center gap-1.5 text-sm"
                    >
                      {saving ? (
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      Save
                    </button>
                    <button
                      onClick={() => { setEditing(false); setFullName(profile?.full_name || '') }}
                      className="btn-ghost px-3 py-2.5"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div
                    onClick={() => setEditing(true)}
                    className="input-dark cursor-pointer hover:border-blue-500/40 transition-all flex items-center justify-between group"
                  >
                    <span className={fullName ? 'text-text-primary' : 'text-text-muted'}>
                      {fullName || 'Add your full name'}
                    </span>
                    <Edit3 className="w-4 h-4 text-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Quick links */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
            <Link
              to="/orders"
              className="bg-dark-card border border-dark-border rounded-xl p-5 flex items-center gap-4 hover:border-blue-500/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="font-heading font-semibold text-text-primary group-hover:text-blue-400 transition-colors">Order History</p>
                <p className="text-text-muted text-sm">View all past orders</p>
              </div>
            </Link>

            <Link
              to="/wishlist"
              className="bg-dark-card border border-dark-border rounded-xl p-5 flex items-center gap-4 hover:border-purple-500/30 transition-all group"
            >
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                <Zap className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="font-heading font-semibold text-text-primary group-hover:text-purple-400 transition-colors">My Wishlist</p>
                <p className="text-text-muted text-sm">Saved products</p>
              </div>
            </Link>
          </div>

          {/* Sign out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-red-500/20 text-red-400 hover:bg-red-500/5 hover:border-red-500/40 transition-all font-medium"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>
      <ChatWidget />
    </div>
  )
}
