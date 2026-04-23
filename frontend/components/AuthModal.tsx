'use client'
import { useState } from 'react'
import { useAuth } from '@/lib/AuthContext'
import { X, Mail, Lock, User, ShieldCheck, Loader2 } from 'lucide-react'

export function AuthModal() {
  const { showAuthModal, setShowAuthModal, signIn, signUp } = useAuth()
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!showAuthModal) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      if (mode === 'login') {
        await signIn(email, password)
      } else {
        if (!name.trim()) { setError('Name is required'); setLoading(false); return }
        await signUp(email, password, name)
      }
    } catch (err: any) {
      const msg = err?.code === 'auth/wrong-password' ? 'Invalid password.'
        : err?.code === 'auth/user-not-found' ? 'No account found. Sign up instead.'
        : err?.code === 'auth/email-already-in-use' ? 'Email already in use.'
        : err?.code === 'auth/weak-password' ? 'Password must be at least 6 characters.'
        : err?.message || 'Something went wrong.'
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  const handleDemo = async () => {
    setLoading(true)
    await signIn() // No credentials → triggers demo mode
    setLoading(false)
  }

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) setShowAuthModal(false) }}
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        background: 'rgba(15,23,42,0.6)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, animation: 'fade-up 0.2s ease'
      }}
    >
      <div style={{
        background: '#ffffff', borderRadius: 24, padding: '48px 40px',
        width: '100%', maxWidth: 440, boxShadow: '0 24px 64px -12px rgba(0,0,0,0.25)',
        border: '1px solid var(--border)', position: 'relative'
      }}>
        {/* Close */}
        <button onClick={() => setShowAuthModal(false)} style={{
          position: 'absolute', top: 20, right: 20, background: 'transparent',
          border: 'none', cursor: 'pointer', color: 'var(--slate)', padding: 4, borderRadius: 8
        }}>
          <X size={20} />
        </button>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--teal-light), var(--teal))',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <ShieldCheck size={28} color="white" />
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--navy)', margin: '0 0 8px', fontFamily: 'Space Grotesk, sans-serif' }}>
            {mode === 'login' ? 'Welcome back' : 'Create account'}
          </h2>
          <p style={{ fontSize: 14, color: 'var(--slate)', margin: 0 }}>
            {mode === 'login' ? 'Sign in to access your audit reports' : 'Start your free AI bias diagnostics'}
          </p>
        </div>

        {/* Toggle */}
        <div style={{
          display: 'flex', background: '#f1f5f9', borderRadius: 12, padding: 4,
          marginBottom: 28, gap: 4
        }}>
          {(['login', 'signup'] as const).map(m => (
            <button key={m} onClick={() => { setMode(m); setError('') }} style={{
              flex: 1, padding: '10px 0', borderRadius: 9, border: 'none', cursor: 'pointer',
              fontWeight: 700, fontSize: 14, transition: 'all 0.2s',
              background: mode === m ? '#ffffff' : 'transparent',
              color: mode === m ? 'var(--navy)' : 'var(--slate)',
              boxShadow: mode === m ? '0 2px 8px rgba(0,0,0,0.08)' : 'none'
            }}>
              {m === 'login' ? 'Sign In' : 'Sign Up'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {mode === 'signup' && (
            <div style={{ position: 'relative' }}>
              <User size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate)' }} />
              <input
                type="text" placeholder="Full name" value={name}
                onChange={e => setName(e.target.value)} required
                style={{ width: '100%', paddingLeft: 42, paddingRight: 14, paddingTop: 12, paddingBottom: 12, borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 15, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={e => e.target.style.borderColor = 'var(--teal)'}
                onBlur={e => e.target.style.borderColor = 'var(--border)'}
              />
            </div>
          )}
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate)' }} />
            <input
              type="email" placeholder="Email address" value={email}
              onChange={e => setEmail(e.target.value)} required
              style={{ width: '100%', paddingLeft: 42, paddingRight: 14, paddingTop: 12, paddingBottom: 12, borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 15, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--teal)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--slate)' }} />
            <input
              type="password" placeholder="Password" value={password}
              onChange={e => setPassword(e.target.value)} required minLength={6}
              style={{ width: '100%', paddingLeft: 42, paddingRight: 14, paddingTop: 12, paddingBottom: 12, borderRadius: 10, border: '1.5px solid var(--border)', fontSize: 15, outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
              onFocus={e => e.target.style.borderColor = 'var(--teal)'}
              onBlur={e => e.target.style.borderColor = 'var(--border)'}
            />
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid rgba(239,68,68,0.3)', color: '#dc2626', padding: '10px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500 }}>
              {error}
            </div>
          )}

          <button type="submit" disabled={loading} className="btn btn-teal" style={{ width: '100%', justifyContent: 'center', padding: '14px', fontSize: 15, marginTop: 4 }}>
            {loading ? <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} /> : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Divider */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '20px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
          <span style={{ fontSize: 12, color: 'var(--slate)', fontWeight: 600 }}>OR</span>
          <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
        </div>

        {/* Demo */}
        <button onClick={handleDemo} disabled={loading} className="btn btn-outline" style={{ width: '100%', justifyContent: 'center', padding: '13px' }}>
          Continue as Demo Executive
        </button>

        <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--slate)', marginTop: 20, lineHeight: 1.5 }}>
          Demo mode gives full access to all features with sample data.
        </p>
      </div>
    </div>
  )
}
