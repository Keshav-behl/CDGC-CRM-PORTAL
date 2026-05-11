import React, { useState, useEffect } from 'react'
import { db } from '../firebase'
import {
  collection, onSnapshot, query, orderBy, addDoc, doc, setDoc, deleteDoc, getDocs, where, serverTimestamp,
} from 'firebase/firestore'
import { useAuth } from '../context/AuthContext'
import { hashPassword } from '../auth'
import CompanyTable from '../components/CompanyTable'
import StatsBar from '../components/StatsBar'
import CompanyDatabase from './CompanyDatabase'

const ACTION_COLORS = {
  ADD:    { bg: 'var(--green-bg)', bdr: 'var(--green-bdr)', ink: 'var(--green)' },
  EDIT:   { bg: 'var(--blue-bg)',  bdr: 'var(--blue-bdr)',  ink: 'var(--blue)'  },
  DELETE: { bg: 'var(--red-bg)',   bdr: 'var(--red-bdr)',   ink: 'var(--red)'   },
}

function ActionBadge({ action }) {
  const c = ACTION_COLORS[action] || ACTION_COLORS.EDIT
  return (
    <span style={{
      fontFamily: 'var(--fm)', fontSize: 10, fontWeight: 500,
      padding: '2px 9px', borderRadius: 20, whiteSpace: 'nowrap',
      background: c.bg, border: `0.5px solid ${c.bdr}`, color: c.ink,
    }}>{action}</span>
  )
}

function fmtTimestamp(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: true,
  })
}

const thStyle = {
  fontFamily: 'var(--fm)', fontSize: 10, fontWeight: 500,
  letterSpacing: '0.7px', textTransform: 'uppercase',
  color: 'var(--ink3)', padding: '8px 14px',
  borderBottom: '0.5px solid var(--bdr)',
  textAlign: 'left', background: 'var(--bg2)',
  whiteSpace: 'nowrap',
}
const tdStyle = { padding: '10px 14px', fontSize: 13, verticalAlign: 'middle' }

function generatePassword(displayName) {
  const prefix = displayName.replace(/\s+/g, '').slice(0, 3).toUpperCase()
  const nums = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}${nums}`
}

function UserManager() {
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [newUsername, setNewUsername] = useState('')
  const [newDisplayName, setNewDisplayName] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [newRole, setNewRole] = useState('user')
  const [saving, setSaving] = useState(false)
  const [resetUser, setResetUser] = useState(null)
  const [resetPassword, setResetPassword] = useState('')

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'users'), snap => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => a.username.localeCompare(b.username)))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  function prefillPassword() {
    if (newDisplayName) setNewPassword(generatePassword(newDisplayName))
  }

  async function handleAddUser(e) {
    e.preventDefault()
    if (!newUsername.trim() || !newPassword.trim()) return
    setSaving(true)
    try {
      const passwordHash = await hashPassword(newPassword.trim())
      await setDoc(doc(db, 'users', newUsername.trim()), {
        username: newUsername.trim(),
        displayName: newDisplayName.trim() || newUsername.trim(),
        passwordHash,
        role: newRole,
      })
      setShowAdd(false)
      setNewUsername('')
      setNewDisplayName('')
      setNewPassword('')
      setNewRole('user')
    } catch (err) {
      console.error(err)
      alert('Failed to add user.')
    }
    setSaving(false)
  }

  async function handleResetPassword(e) {
    e.preventDefault()
    if (!resetPassword.trim() || !resetUser) return
    setSaving(true)
    try {
      const passwordHash = await hashPassword(resetPassword.trim())
      await setDoc(doc(db, 'users', resetUser.username), { ...resetUser, passwordHash }, { merge: true })
      setResetUser(null)
      setResetPassword('')
    } catch (err) {
      console.error(err)
      alert('Failed to reset password.')
    }
    setSaving(false)
  }

  async function handleDeleteUser(user) {
    if (!window.confirm(`Delete user "${user.username}"? This cannot be undone.`)) return
    await deleteDoc(doc(db, 'users', user.username))
  }

  if (loading) return <div style={{ padding: 32, color: 'var(--ink3)', fontFamily: 'var(--fm)', fontSize: 12 }}>Loading users…</div>

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--ink3)' }}>
          {users.length} users
        </div>
        <button
          onClick={() => setShowAdd(v => !v)}
          style={{
            fontFamily: 'var(--fm)', fontSize: 11, padding: '6px 14px',
            border: '0.5px solid var(--bdr2)', borderRadius: 6,
            background: showAdd ? 'var(--bg4)' : 'var(--bg3)', color: 'var(--ink)',
          }}
        >
          {showAdd ? 'Cancel' : '+ Add user'}
        </button>
      </div>

      {showAdd && (
        <form onSubmit={handleAddUser} style={{
          background: 'var(--bg3)', border: '0.5px solid var(--bdr2)',
          borderRadius: 10, padding: '18px 20px', marginBottom: 20,
          display: 'grid', gridTemplateColumns: '1fr 1fr 1fr auto auto',
          gap: 10, alignItems: 'end',
        }}>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--fm)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink3)', marginBottom: 4 }}>Username</label>
            <input value={newUsername} onChange={e => setNewUsername(e.target.value)} placeholder="e.g. RAHUL" required style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--fm)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink3)', marginBottom: 4 }}>Display name</label>
            <input value={newDisplayName} onChange={e => setNewDisplayName(e.target.value)} onBlur={prefillPassword} placeholder="e.g. Rahul" style={{ width: '100%' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--fm)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink3)', marginBottom: 4 }}>
              Password <span style={{ color: 'var(--ink3)', fontWeight: 400 }}>(auto-generated or custom)</span>
            </label>
            <input value={newPassword} onChange={e => setNewPassword(e.target.value)} placeholder="auto-fill on blur" required style={{ width: '100%', fontFamily: 'var(--fm)' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontFamily: 'var(--fm)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink3)', marginBottom: 4 }}>Role</label>
            <select value={newRole} onChange={e => setNewRole(e.target.value)} style={{ width: '100%' }}>
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </div>
          <button type="submit" disabled={saving} style={{
            padding: '8px 18px', background: 'var(--ink)', color: 'var(--bg)',
            border: 'none', borderRadius: 6, fontFamily: 'var(--fm)', fontSize: 12, fontWeight: 500,
          }}>Save</button>
        </form>
      )}

      {resetUser && (
        <form onSubmit={handleResetPassword} style={{
          background: 'var(--amber-bg)', border: '0.5px solid var(--amber-bdr)',
          borderRadius: 10, padding: '14px 18px', marginBottom: 16,
          display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap',
        }}>
          <span style={{ fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--amber)' }}>
            Reset password for <strong>{resetUser.username}</strong>
          </span>
          <input
            value={resetPassword} onChange={e => setResetPassword(e.target.value)}
            placeholder="New password" required style={{ width: 200, fontFamily: 'var(--fm)' }}
          />
          <button type="submit" disabled={saving} style={{
            padding: '7px 14px', background: 'var(--amber)', color: '#1a1000',
            border: 'none', borderRadius: 6, fontFamily: 'var(--fm)', fontSize: 12, fontWeight: 500,
          }}>Set password</button>
          <button type="button" onClick={() => { setResetUser(null); setResetPassword('') }} style={{
            padding: '7px 14px', background: 'none', border: '0.5px solid var(--bdr2)', color: 'var(--ink2)', borderRadius: 6, fontSize: 12,
          }}>Cancel</button>
        </form>
      )}

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={thStyle}>Username</th>
              <th style={thStyle}>Display name</th>
              <th style={thStyle}>Role</th>
              <th style={thStyle}></th>
            </tr>
          </thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} style={{ borderBottom: '0.5px solid var(--bdr)' }}>
                <td style={{ ...tdStyle, fontFamily: 'var(--fm)', fontSize: 12 }}>{u.username}</td>
                <td style={tdStyle}>{u.displayName}</td>
                <td style={tdStyle}>
                  <span style={{
                    fontFamily: 'var(--fm)', fontSize: 10, fontWeight: 500,
                    padding: '2px 9px', borderRadius: 20,
                    background: u.role === 'admin' ? 'var(--purple-bg)' : 'var(--gray-bg)',
                    border: `0.5px solid ${u.role === 'admin' ? 'var(--purple-bdr)' : 'var(--gray-bdr)'}`,
                    color: u.role === 'admin' ? 'var(--purple)' : 'var(--gray-ink)',
                  }}>{u.role}</span>
                </td>
                <td style={{ ...tdStyle, whiteSpace: 'nowrap' }}>
                  <button onClick={() => { setResetUser(u); setResetPassword('') }} style={{
                    background: 'none', border: '0.5px solid var(--bdr2)',
                    color: 'var(--ink2)', padding: '4px 10px', borderRadius: 5, fontSize: 12, marginRight: 6,
                  }}>Reset pwd</button>
                  <button onClick={() => handleDeleteUser(u)} style={{
                    background: 'none', border: 'none', color: 'var(--red)', padding: '4px 7px', borderRadius: 5, fontSize: 14,
                  }}><i className="ti ti-trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function CrmView() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const q = query(collection(db, 'companies'), orderBy('updatedAt', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  return (
    <div>
      <StatsBar entries={entries} />
      <CompanyTable entries={entries} loading={loading} onEdit={null} onDelete={null} />
    </div>
  )
}

function AuditLog() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [filterUser, setFilterUser] = useState('')
  const [filterAction, setFilterAction] = useState('')

  useEffect(() => {
    const q = query(collection(db, 'auditLogs'), orderBy('timestamp', 'desc'))
    const unsub = onSnapshot(q, snap => {
      setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  const users = [...new Set(logs.map(l => l.user).filter(Boolean))].sort()
  const filtered = logs.filter(l => {
    if (filterUser && l.user !== filterUser) return false
    if (filterAction && l.action !== filterAction) return false
    return true
  })

  if (loading) return <div style={{ padding: 32, color: 'var(--ink3)', fontFamily: 'var(--fm)', fontSize: 12 }}>Loading audit log…</div>

  return (
    <div>
      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--ink3)', marginRight: 4 }}>
          {filtered.length} entries
        </div>
        <select value={filterUser} onChange={e => setFilterUser(e.target.value)} style={{ width: 140 }}>
          <option value="">All users</option>
          {users.map(u => <option key={u} value={u}>{u}</option>)}
        </select>
        <select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ width: 130 }}>
          <option value="">All actions</option>
          <option value="ADD">ADD</option>
          <option value="EDIT">EDIT</option>
          <option value="DELETE">DELETE</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
          No audit entries yet. Actions will appear here as users add, edit, or delete companies.
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 700 }}>
            <thead>
              <tr>
                <th style={thStyle}>Timestamp</th>
                <th style={thStyle}>User</th>
                <th style={thStyle}>Action</th>
                <th style={thStyle}>Company</th>
                <th style={thStyle}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(log => (
                <tr key={log.id} style={{ borderBottom: '0.5px solid var(--bdr)' }}>
                  <td style={{ ...tdStyle, fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--ink2)', whiteSpace: 'nowrap' }}>
                    {fmtTimestamp(log.timestamp)}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--fm)', fontSize: 12 }}>{log.user}</td>
                  <td style={tdStyle}><ActionBadge action={log.action} /></td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{log.companyName || '—'}</td>
                  <td style={{ ...tdStyle, fontSize: 12, color: 'var(--ink2)', maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={log.details}>
                    {log.details || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default function AdminDashboard() {
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('companies')

  const tabs = [
    { id: 'companies', label: 'Companies' },
    { id: 'companydb', label: 'Company DB' },
    { id: 'audit',     label: 'Audit Log' },
    { id: 'users',     label: 'Users' },
  ]

  const subtitles = {
    companies: 'Live view of all CRM entries',
    companydb: 'Company name database — used for autocomplete in the CRM',
    audit:     'All activity across the CRM',
    users:     'Manage team members',
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{
        borderBottom: '0.5px solid var(--bdr)',
        background: 'var(--bg2)',
        padding: '0 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        height: 52,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
            CDGC Admin
          </div>
          <div style={{ display: 'flex', gap: 2 }}>
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  fontFamily: 'var(--fm)', fontSize: 12, padding: '6px 14px',
                  border: 'none', borderRadius: 6,
                  background: tab === t.id ? 'var(--bg4)' : 'none',
                  color: tab === t.id ? 'var(--ink)' : 'var(--ink3)',
                }}
              >{t.label}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--purple)', background: 'var(--purple-bg)', border: '0.5px solid var(--purple-bdr)', padding: '3px 10px', borderRadius: 20 }}>
            {user.displayName}
          </span>
          <button onClick={logout} style={{
            fontFamily: 'var(--fm)', fontSize: 11, padding: '5px 13px',
            border: '0.5px solid var(--bdr2)', borderRadius: 6,
            background: 'none', color: 'var(--ink2)',
          }}>Sign out</button>
        </div>
      </div>

      {/* Content */}
      <div style={{ flex: 1, width: '100%' }}>
        {tab === 'companies' && <CrmView />}
        {tab !== 'companies' && (
          <div style={{ padding: '28px 24px', maxWidth: 1100, margin: '0 auto' }}>
            <div style={{
              fontFamily: 'var(--fm)', fontSize: 10, textTransform: 'uppercase',
              letterSpacing: '0.7px', color: 'var(--ink3)', marginBottom: 20,
            }}>
              {subtitles[tab]}
            </div>
            {tab === 'companydb' && <CompanyDatabase />}
            {tab === 'audit'     && <AuditLog />}
            {tab === 'users'     && <UserManager />}
          </div>
        )}
      </div>
    </div>
  )
}
