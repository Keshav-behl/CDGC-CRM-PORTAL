import React, { useState, useEffect } from 'react'
import { db } from './firebase'
import {
  collection, onSnapshot, addDoc, updateDoc, deleteDoc,
  doc, serverTimestamp, query, orderBy
} from 'firebase/firestore'
import TopBar from './components/TopBar'
import StatsBar from './components/StatsBar'
import Toolbar from './components/Toolbar'
import CompanyTable from './components/CompanyTable'
import CompanyModal from './components/CompanyModal'

export default function App() {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [editEntry, setEditEntry] = useState(null)
  const [search, setSearch] = useState('')
  const [filterConv, setFilterConv] = useState('')
  const [filterPerson, setFilterPerson] = useState('')

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
      })
    } else {
      await addDoc(collection(db, 'companies'), {
        ...data,
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      })
    }
    setModalOpen(false)
    setEditEntry(null)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this entry?')) return
    await deleteDoc(doc(db, 'companies', id))
  }

  function openAdd() { setEditEntry(null); setModalOpen(true) }
  function openEdit(entry) { setEditEntry(entry); setModalOpen(true) }
  function closeModal() { setModalOpen(false); setEditEntry(null) }

  // Filtering
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
      <TopBar count={entries.length} />
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
          onSave={handleSave}
          onClose={closeModal}
        />
      )}
    </div>
  )
}
