import React, { useState, useEffect } from 'react'

const STAGE_LABELS = [
  'Approach', 'First Contact', 'Second Contact', 'Third Contact',
  'Fourth Contact', 'Fifth Contact', 'Sixth Contact', 'Seventh Contact',
  'Eighth Contact', 'Ninth Contact', 'Tenth Contact',
]
const CHANNELS = ['Call', 'Email', 'LinkedIn', 'WhatsApp', 'In-Person', 'Referral', 'Portal', 'Other']

const overlay = {
  position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
  display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
}
const box = {
  background: 'var(--bg2)', border: '0.5px solid var(--bdr2)',
  borderRadius: 12, padding: '22px 24px', width: 520,
  maxWidth: '96vw', maxHeight: '90vh', overflowY: 'auto',
}

const labelStyle = {
  display: 'block', fontSize: 10, fontWeight: 500,
  color: 'var(--ink2)', textTransform: 'uppercase',
  letterSpacing: '0.6px', marginBottom: 4,
}
const rowStyle = { marginBottom: 12 }

function FormRow({ label, children }) {
  return <div style={rowStyle}><label style={labelStyle}>{label}</label>{children}</div>
}

function ContactRow({ contact, index, onChange, onRemove, suggestedStage }) {
  return (
    <div style={{ marginBottom: 12, background: 'var(--bg3)', border: '0.5px solid var(--bdr)', borderRadius: 8, padding: '10px 12px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--ink3)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Touch #{index + 1}
        </span>
        <button onClick={() => onRemove(index)} style={{ background: 'none', border: 'none', color: 'var(--red)', cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center' }}>
          <i className="ti ti-x" />
        </button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 8 }}>
        <select value={contact.stage} onChange={e => onChange(index, 'stage', e.target.value)}>
          {STAGE_LABELS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select value={contact.channel} onChange={e => onChange(index, 'channel', e.target.value)}>
          {CHANNELS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input type="date" value={contact.date} onChange={e => onChange(index, 'date', e.target.value)} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <input type="text" placeholder="POC / contact name" value={contact.poc} onChange={e => onChange(index, 'poc', e.target.value)} />
        <input type="text" placeholder="Note for this touchpoint" value={contact.note} onChange={e => onChange(index, 'note', e.target.value)} />
      </div>
    </div>
  )
}

export default function CompanyModal({ entry, currentUser, onSave, onClose }) {
  const [person, setPerson] = useState('')
  const [company, setCompany] = useState('')
  const [role, setRole] = useState('')
  const [conversion, setConversion] = useState('Not Approached')
  const [notes, setNotes] = useState('')
  const [contacts, setContacts] = useState([])

  useEffect(() => {
    if (entry) {
      setPerson(entry.person || '')
      setCompany(entry.company || '')
      setRole(entry.role || '')
      setConversion(entry.conversion || 'Not Approached')
      setNotes(entry.notes || '')
      setContacts(entry.contacts ? JSON.parse(JSON.stringify(entry.contacts)) : [])
    } else if (currentUser) {
      setPerson(currentUser.displayName || '')
    }
  }, [entry, currentUser])

  function addContact() {
    const nextStage = STAGE_LABELS[Math.min(contacts.length, STAGE_LABELS.length - 1)]
    setContacts(prev => [...prev, {
      stage: nextStage,
      channel: 'Email',
      date: new Date().toISOString().slice(0, 10),
      poc: '',
      note: '',
    }])
  }

  function updateContact(idx, field, val) {
    setContacts(prev => prev.map((c, i) => i === idx ? { ...c, [field]: val } : c))
  }

  function removeContact(idx) {
    setContacts(prev => prev.filter((_, i) => i !== idx))
  }

  function handleSave() {
    if (!person.trim() || !company.trim()) {
      alert('Person and company are required.')
      return
    }
    onSave({ person: person.trim(), company: company.trim(), role: role.trim(), conversion, notes: notes.trim(), contacts })
  }

  return (
    <div style={overlay} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={box}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 14, fontWeight: 500, marginBottom: 18 }}>
          {entry ? 'Edit company' : 'Add company'}
        </div>

        {/* Company info */}
        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--ink3)', marginBottom: 10, paddingBottom: 6, borderBottom: '0.5px solid var(--bdr)' }}>
          Company info
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormRow label="Your name">
            <input type="text" value={person} onChange={e => setPerson(e.target.value)} placeholder="e.g. Keshav" style={{ width: '100%' }} />
          </FormRow>
          <FormRow label="Company">
            <input type="text" value={company} onChange={e => setCompany(e.target.value)} placeholder="e.g. Jane Street" style={{ width: '100%' }} />
          </FormRow>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <FormRow label="Role / JD">
            <input type="text" value={role} onChange={e => setRole(e.target.value)} placeholder="e.g. Quant Trader Intern" style={{ width: '100%' }} />
          </FormRow>
          <FormRow label="Outcome">
            <select value={conversion} onChange={e => setConversion(e.target.value)} style={{ width: '100%' }}>
              <option value="Not Approached">Not Approached</option>
              <option value="Pending">Pending</option>
              <option value="Converted">Converted ✓</option>
              <option value="Rejected">Rejected ✗</option>
            </select>
          </FormRow>
        </div>
        <FormRow label="Notes">
          <textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="JD link, referral source, deadline, reminders…" style={{ width: '100%' }} />
        </FormRow>

        {/* Contact log */}
        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--ink3)', margin: '16px 0 6px', paddingBottom: 6, borderBottom: '0.5px solid var(--bdr)' }}>
          Contact log
        </div>
        <div style={{ fontSize: 11, color: 'var(--ink3)', marginBottom: 10 }}>
          Each row is a touchpoint — approach, first contact, second contact, etc.
        </div>

        {contacts.map((c, i) => (
          <ContactRow key={i} contact={c} index={i} onChange={updateContact} onRemove={removeContact} />
        ))}

        <button
          onClick={addContact}
          style={{ fontFamily: 'var(--fm)', fontSize: 11, padding: '6px 14px', border: '0.5px dashed var(--bdr2)', borderRadius: 6, background: 'none', color: 'var(--ink2)', cursor: 'pointer', marginBottom: 18 }}
        >
          <i className="ti ti-plus" /> Add touchpoint
        </button>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', paddingTop: 12, borderTop: '0.5px solid var(--bdr)' }}>
          <button onClick={onClose} style={{ fontSize: 13, padding: '7px 16px', border: '0.5px solid var(--bdr2)', borderRadius: 6, background: 'var(--bg3)', color: 'var(--ink)' }}>
            Cancel
          </button>
          <button onClick={handleSave} style={{ fontFamily: 'var(--fm)', fontSize: 12, padding: '7px 18px', border: 'none', borderRadius: 6, background: 'var(--ink)', color: 'var(--bg)', fontWeight: 500 }}>
            Save
          </button>
        </div>
      </div>
    </div>
  )
}
