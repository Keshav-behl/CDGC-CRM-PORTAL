import React, { useState, useEffect } from 'react'
import { db, addAuditLog } from './firebase'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy, getDoc,
} from 'firebase/firestore'
import { useAuth } from './context/AuthContext'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import TopBar from './components/TopBar'
import StatsBar from './components/StatsBar'
import Toolbar from './components/Toolbar'
import CompanyTable from './components/CompanyTable'
import CompanyModal from './components/CompanyModal'

export default function App() {
  const { user, logout } = useAuth()
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [search, setSearch] = useState('')
  const [filterConv, setFilterConv] = useState('')
  const [filterPerson, setFilterPerson] = useState('')

  if (!user) return <Login />
  if (user.role === 'admin') return <AdminDashboard />

  // Real-time Firestore listener
  useEffect(() => {
    const q = query(collection(db, 'companies'), orderBy('updatedAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setEntries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    }, (err) => {
      console.error('Firestore error:', err)
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function handleSave(data) {
    if (editEntry) {
      await updateDoc(doc(db, 'companies', editEntry.id), {
        ...data,
        updatedAt: serverTimestamp(),
        lastEditedBy: user.username,
      })
      addAuditLog({
        action: 'EDIT',
        user: user.username,
        companyId: editEntry.id,
        companyName: data.company,
        details: `Role: ${data.role || '—'} | Outcome: ${data.conversion}`,
      })
    } else {
      const ref = await addDoc(collection(db, 'companies'), {
        ...data,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        createdBy: user.username,
        lastEditedBy: user.username,
      })
      addAuditLog({
        action: 'ADD',
        user: user.username,
        companyId: ref.id,
        companyName: data.company,
        details: `Role: ${data.role || '—'} | Outcome: ${data.conversion}`,
      })
    }
    setModalOpen(false)
    setEditEntry(null)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this entry?')) return
    const snap = await getDoc(doc(db, 'companies', id))
    const companyName = snap.exists() ? snap.data().company : '—'
    await deleteDoc(doc(db, 'companies', id))
    addAuditLog({
      action: 'DELETE',
      user: user.username,
      companyId: id,
      companyName,
      details: null,
    })
  }

  function openAdd() { setEditEntry(null); setModalOpen(true) }
  function openEdit(entry) { setEditEntry(entry); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditEntry(null) }

  const filtered = entries.filter(e => {
    if (filterConv && e.conversion !== filterConv) return false
    if (filterPerson && e.person !== filterPerson) return false
    if (search) {
      const q = search.toLowerCase()
      if (!`${e.person} ${e.company} ${e.role} ${e.notes}`.toLowerCase().includes(q)) return false
    }
    return true
  })

  const people = [...new Set(entries.map(e => e.person).filter(Boolean))].sort()

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <TopBar count={entries.length} user={user} onLogout={logout} />
      <StatsBar entries={entries} />
      <Toolbar
        search={search} setSearch={setSearch}
        filterConv={filterConv} setFilterConv={setFilterConv}
        filterPerson={filterPerson} setFilterPerson={setFilterPerson}
        people={people}
        onAdd={openAdd}
      />
      <CompanyTable
        entries={filtered}
        loading={loading}
        onEdit={openEdit}
        onDelete={handleDelete}
      />
      {modalOpen && (
        <CompanyModal
          entry={editEntry}
          currentUser={user}
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
