import { useState } from 'react'
import type { Page, User } from '../../App'


interface Props {
  navigate: (p: Page) => void
  setUser: (u: User | null) => void
  onAuthSuccess: (u: User) => void
}

export default function Auth({ navigate, setUser, onAuthSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    confirm: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)


  const authenticateWithServer = async (payload: { email: string; password: string; name?: string; role?: 'guest' | 'admin' }) => {
    const response = await fetch('https://projecthotel-production.up.railway.app/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return response
  }

  const validate = () => {
    const e: Record<string, string> = {}
    if (mode === 'register' && !form.name.trim()) e.name = 'Full name is required'
    if (!form.email.includes('@')) e.email = 'Enter a valid email address'
    if (form.password.length < 6) e.password = 'Password must be at least 6 characters'
    if (mode === 'register' && form.password !== form.confirm) e.confirm = 'Passwords do not match'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const normalizedEmail = form.email.trim().toLowerCase()

    if (mode === 'register') {
      setLoading(true)
      try {
        const response = await fetch('https://projecthotel-production.up.railway.app/api/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: form.name.trim(),
            email: normalizedEmail,
            password: form.password,
            role: normalizedEmail.includes('admin') ? 'admin' : 'guest',
          }),
        })

        if (!response.ok) {
          const data = await response.json().catch(() => ({}))
          setErrors({ email: data.message || 'This account already exists. Please sign in instead.' })
          setLoading(false)
          return
        }

        const data = await response.json()
        const authenticatedUser = {
          name: data.name,
          email: data.email,
          role: data.role,
        } as User
        
        setUser(authenticatedUser)
        setLoading(false)
        onAuthSuccess(authenticatedUser)
      } catch {
        setErrors({ email: 'Unable to register right now. Please try again.' })
        setLoading(false)
      }
      return
    }

    setLoading(true)
    try {
      const response = await authenticateWithServer({ email: normalizedEmail, password: form.password })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setErrors({ password: data.message || 'Incorrect password. Please try again.' })
        setLoading(false)
        return
      }

      const data = await response.json()
      const authenticatedUser = {
        name: data.name,
        email: data.email,
        role: data.role,
      } as User
      setUser(authenticatedUser)
      setLoading(false)
      onAuthSuccess(authenticatedUser)
    } catch {
      setErrors({ email: 'Unable to sign in right now. Please try again.' })
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-[calc(100vh-64px)] grid grid-cols-1 lg:grid-cols-2"
    >
      {/* Left: image panel */}
      <div
        className="hidden lg:block relative overflow-hidden"
        style={{ backgroundColor: 'var(--primary)' }}
      >
        <img
          src="https://images.unsplash.com/photo-1590490360182-c33d57733427?w=800&h=900&fit=crop&auto=format"
          alt="Elegant hotel lobby"
          className="absolute inset-0 w-full h-full object-cover opacity-50"
        />
        <div className="absolute inset-0 flex flex-col justify-end p-12">
          <p
            className="text-xs tracking-[0.35em] uppercase mb-3"
            style={{ color: 'var(--accent)' }}
          >
            Vernay Hotels
          </p>
          <h2
            className="font-display text-4xl italic mb-4"
            style={{ color: 'var(--primary-foreground)', fontWeight: 300 }}
          >
            A world of privilege<br />
            <em style={{ fontWeight: 600, fontStyle: 'normal' }}>
              awaits you.
            </em>
          </h2>
          <p style={{ color: 'rgba(246,241,233,0.5)', fontSize: '14px' }}>
            Create an account to manage bookings, access exclusive rates, and enjoy member benefits.
          </p>
        </div>
      </div>

      {/* Right: form */}
      <div className="flex items-center justify-center px-6 py-16">
        <div className="w-full max-w-sm">
          {/* Mode toggle */}
          <div
            className="flex border mb-8"
            style={{ borderColor: 'var(--border)' }}
          >
            {(['login', 'register'] as const).map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setErrors({}) }}
                className="flex-1 py-2.5 text-sm tracking-widests uppercase transition-colors"
                style={{
                  backgroundColor: mode === m ? 'var(--primary)' : 'transparent',
                  color: mode === m ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <h1
            className="font-display text-3xl italic mb-2"
            style={{ fontWeight: 300 }}
          >
            {mode === 'login' ? 'Welcome back.' : 'Create account.'}
          </h1>
          <p
            className="text-sm mb-8"
            style={{ color: 'var(--muted-foreground)' }}
          >
            {mode === 'login'
              ? 'Sign in to manage your reservations.'
              : 'Join Vernay to unlock exclusive member benefits.'}
          </p>

          {/* Demo hint */}
          <div
            className="text-xs p-3 mb-6 border"
            style={{
              borderColor: 'rgba(176,125,58,0.25)',
              backgroundColor: 'rgba(176,125,58,0.06)',
              color: 'var(--muted-foreground)',
            }}
          >
            Tip: Use any email containing "admin" to access the admin dashboard.
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  Full Name
                </label>
                <input
                  type="text"
                  placeholder="Sophie Marceau"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border rounded"
                  style={{ borderColor: errors.name ? '#dc2626' : 'var(--border)', outline: 'none', backgroundColor: 'transparent' }}
                />
                {errors.name && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.name}</p>}
              </div>
            )}
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Email Address
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border rounded"
                style={{ borderColor: errors.email ? '#dc2626' : 'var(--border)', outline: 'none', backgroundColor: 'transparent' }}
              />
              {errors.email && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.email}</p>}
            </div>
            <div>
              <label className="block text-xs mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                Password
              </label>
              <input
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-3 py-2.5 text-sm border rounded"
                style={{ borderColor: errors.password ? '#dc2626' : 'var(--border)', outline: 'none', backgroundColor: 'transparent' }}
              />
              {errors.password && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.password}</p>}
            </div>
            {mode === 'register' && (
              <div>
                <label className="block text-xs mb-1.5" style={{ color: 'var(--muted-foreground)' }}>
                  Confirm Password
                </label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.confirm}
                  onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                  className="w-full px-3 py-2.5 text-sm border rounded"
                  style={{ borderColor: errors.confirm ? '#dc2626' : 'var(--border)', outline: 'none', backgroundColor: 'transparent' }}
                />
                {errors.confirm && <p className="text-xs mt-1" style={{ color: '#dc2626' }}>{errors.confirm}</p>}
              </div>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm tracking-widests uppercase font-medium mt-2 transition-opacity hover:opacity-85 disabled:opacity-50"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {loading ? 'Please wait...' : mode === 'login' ? 'Sign In' : 'Create Account'}
            </button>
          </form>

          {mode === 'login' && (
            <p
              className="text-center text-xs mt-6"
              style={{ color: 'var(--muted-foreground)' }}
            >
              Don't have an account?{' '}
              <button
                onClick={() => setMode('register')}
                className="underline"
                style={{ color: 'var(--accent)' }}
              >
                Register
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
