import React, { useState } from 'react'
import { db } from '../firebase'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { hashPassword } from '../auth'
import { useAuth } from '../context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const hashed = await hashPassword(password)
      const q = query(collection(db, 'users'), where('username', '==', username.trim()))
      const snap = await getDocs(q)
      if (snap.empty || snap.docs[0].data().passwordHash !== hashed) {
        setError('Invalid username or password.')
        setLoading(false)
        return
      }
      const d = snap.docs[0].data()
      login({ username: d.username, displayName: d.displayName, role: d.role })
    } catch (err) {
      console.error(err)
      setError('Login failed. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
    }}>
      <div style={{
        width: 360, background: 'var(--bg2)',
        border: '0.5px solid var(--bdr2)', borderRadius: 14,
        padding: '36px 32px',
      }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{
            fontFamily: 'var(--fm)', fontSize: 11, letterSpacing: '2px',
            textTransform: 'uppercase', color: 'var(--ink3)', marginBottom: 6,
          }}>CDGC</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--ink)' }}>CRM Portal</div>
          <div style={{ fontSize: 13, color: 'var(--ink2)', marginTop: 4 }}>Sign in to continue</div>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{
              display: 'block', fontFamily: 'var(--fm)', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.6px',
              color: 'var(--ink3)', marginBottom: 5,
            }}>Username</label>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="e.g. KESHAV"
              autoComplete="username"
              required
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{
              display: 'block', fontFamily: 'var(--fm)', fontSize: 10,
              textTransform: 'uppercase', letterSpacing: '0.6px',
              color: 'var(--ink3)', marginBottom: 5,
            }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              style={{ width: '100%' }}
            />
          </div>

          {error && (
            <div style={{
              fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--red)',
              background: 'var(--red-bg)', border: '0.5px solid var(--red-bdr)',
              borderRadius: 6, padding: '8px 12px',
            }}>{error}</div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: 6, padding: '10px 0', background: 'var(--ink)',
              color: 'var(--bg)', border: 'none', borderRadius: 7,
              fontFamily: 'var(--fm)', fontSize: 13, fontWeight: 500,
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <div style={{
          marginTop: 24, paddingTop: 20, borderTop: '0.5px solid var(--bdr)',
          fontSize: 11, color: 'var(--ink3)', textAlign: 'center',
        }}>
          Contact admin to reset your password
        </div>
      </div>
    </div>
  )
}
