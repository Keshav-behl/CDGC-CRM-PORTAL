import React, { useState, useEffect, useRef } from 'react'
import { db, addAuditLog } from '../firebase'
import {
  collection, onSnapshot, query, orderBy, doc, setDoc, deleteDoc, writeBatch,
} from 'firebase/firestore'
import * as XLSX from 'xlsx'
import { useAuth } from '../context/AuthContext'

const thStyle = {
  fontFamily: 'var(--fm)', fontSize: 10, fontWeight: 500,
  letterSpacing: '0.7px', textTransform: 'uppercase',
  color: 'var(--ink3)', padding: '8px 14px',
  borderBottom: '0.5px solid var(--bdr)',
  textAlign: 'left', background: 'var(--bg2)', whiteSpace: 'nowrap',
}
const tdStyle = { padding: '10px 14px', fontSize: 13, verticalAlign: 'middle' }

function slugify(name) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export default function CompanyDatabase() {
  const { user: adminUser } = useAuth()
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)

  // Excel import state
  const [importPreview, setImportPreview] = useState(null) // { rows, columns, selectedCol }
  const [importing, setImporting] = useState(false)
  const [importResult, setImportResult] = useState(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    const q = query(collection(db, 'companyDatabase'), orderBy('name'))
    const unsub = onSnapshot(q, snap => {
      setCompanies(snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setLoading(false)
    })
    return () => unsub()
  }, [])

  async function handleAdd(e) {
    e.preventDefault()
    const name = newName.trim()
    if (!name) return
    setAdding(true)
    const id = slugify(name) || Date.now().toString()
    await setDoc(doc(db, 'companyDatabase', id), { name, addedAt: new Date().toISOString() }, { merge: true })
    addAuditLog({ action: 'DB_ADD', user: adminUser.username, companyName: name, details: 'Added to company database' })
    setNewName('')
    setAdding(false)
  }

  async function handleDelete(id) {
    const target = companies.find(c => c.id === id)
    if (!window.confirm('Remove this company from the database?')) return
    await deleteDoc(doc(db, 'companyDatabase', id))
    addAuditLog({ action: 'DB_DELETE', user: adminUser.username, companyName: target?.name || id, details: 'Removed from company database' })
  }

  // ── Excel / CSV import ──────────────────────────────────────────────────────
  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setImportResult(null)
    const reader = new FileReader()
    reader.onload = evt => {
      const wb = XLSX.read(evt.target.result, { type: 'array' })
      const ws = wb.Sheets[wb.SheetNames[0]]
      const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
      if (!rows.length) return
      const columns = rows[0].map((_, i) => ({
        index: i,
        label: `Column ${String.fromCharCode(65 + i)}`,
        sample: rows.slice(0, 4).map(r => r[i]).filter(Boolean).join(', '),
      }))
      setImportPreview({ rows, columns, selectedCol: 0 })
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  async function handleImport() {
    if (!importPreview) return
    setImporting(true)
    const { rows, selectedCol } = importPreview

    // Gather unique, non-empty names (skip header row if it looks like a header)
    const firstCell = String(rows[0]?.[selectedCol] || '').trim()
    const startRow = /company|name|firm/i.test(firstCell) ? 1 : 0
    const names = [...new Set(
      rows.slice(startRow)
        .map(r => String(r[selectedCol] || '').trim())
        .filter(n => n.length > 0)
    )]

    // Batch write in groups of 500 (Firestore limit)
    let added = 0
    let skipped = 0
    const existingNames = new Set(companies.map(c => c.name.toLowerCase()))

    for (let i = 0; i < names.length; i += 400) {
      const batch = writeBatch(db)
      const chunk = names.slice(i, i + 400)
      for (const name of chunk) {
        if (existingNames.has(name.toLowerCase())) { skipped++; continue }
        const id = slugify(name) || `company-${Date.now()}-${added}`
        batch.set(doc(db, 'companyDatabase', id), { name, addedAt: new Date().toISOString() }, { merge: true })
        added++
      }
      await batch.commit()
    }

    setImporting(false)
    setImportPreview(null)
    setImportResult({ added, skipped, total: names.length })
    if (added > 0) addAuditLog({ action: 'DB_ADD', user: adminUser.username, companyName: null, details: `Bulk imported ${added} companies from Excel (${skipped} skipped)` })
  }

  const filtered = companies.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      {/* Add + search bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <form onSubmit={handleAdd} style={{ display: 'flex', gap: 8, flex: 1, minWidth: 240 }}>
          <input
            value={newName} onChange={e => setNewName(e.target.value)}
            placeholder="Add company name…" style={{ flex: 1 }}
          />
          <button type="submit" disabled={adding || !newName.trim()} style={{
            fontFamily: 'var(--fm)', fontSize: 12, padding: '7px 16px',
            background: 'var(--ink)', color: 'var(--bg)', border: 'none',
            borderRadius: 6, fontWeight: 500, opacity: adding ? 0.6 : 1,
          }}>Add</button>
        </form>

        <input
          value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search…" style={{ width: 200 }}
        />

        <button
          onClick={() => fileInputRef.current?.click()}
          style={{
            fontFamily: 'var(--fm)', fontSize: 12, padding: '7px 16px',
            border: '0.5px solid var(--bdr2)', borderRadius: 6,
            background: 'var(--bg3)', color: 'var(--ink2)',
            display: 'flex', alignItems: 'center', gap: 6,
          }}
        >
          <i className="ti ti-file-spreadsheet" /> Import Excel / CSV
        </button>
        <input ref={fileInputRef} type="file" accept=".xlsx,.xls,.csv" onChange={handleFile} style={{ display: 'none' }} />

        <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--ink3)' }}>
          {companies.length} companies
        </span>
      </div>

      {/* Import result banner */}
      {importResult && (
        <div style={{
          background: 'var(--green-bg)', border: '0.5px solid var(--green-bdr)',
          borderRadius: 8, padding: '10px 16px', marginBottom: 16,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <span style={{ fontSize: 13, color: 'var(--green)' }}>
            ✓ Imported {importResult.added} companies
            {importResult.skipped > 0 && ` · ${importResult.skipped} skipped (already existed)`}
          </span>
          <button onClick={() => setImportResult(null)} style={{ background: 'none', border: 'none', color: 'var(--green)', fontSize: 16 }}>×</button>
        </div>
      )}

      {/* Import preview */}
      {importPreview && (
        <div style={{
          background: 'var(--bg3)', border: '0.5px solid var(--bdr2)',
          borderRadius: 10, padding: '18px 20px', marginBottom: 20,
        }}>
          <div style={{ fontFamily: 'var(--fm)', fontSize: 12, fontWeight: 500, marginBottom: 14 }}>
            Import preview — {importPreview.rows.length} rows detected
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontFamily: 'var(--fm)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink3)', display: 'block', marginBottom: 6 }}>
              Select the column containing company names
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {importPreview.columns.map(col => (
                <button
                  key={col.index}
                  onClick={() => setImportPreview(p => ({ ...p, selectedCol: col.index }))}
                  style={{
                    fontFamily: 'var(--fm)', fontSize: 11, padding: '6px 14px',
                    border: `0.5px solid ${importPreview.selectedCol === col.index ? 'var(--blue-bdr)' : 'var(--bdr2)'}`,
                    borderRadius: 6,
                    background: importPreview.selectedCol === col.index ? 'var(--blue-bg)' : 'var(--bg4)',
                    color: importPreview.selectedCol === col.index ? 'var(--blue)' : 'var(--ink2)',
                  }}
                >
                  {col.label}
                  {col.sample && <span style={{ color: 'var(--ink3)', marginLeft: 6 }}>({col.sample.slice(0, 30)}{col.sample.length > 30 ? '…' : ''})</span>}
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: 'var(--fm)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--ink3)', marginBottom: 6 }}>
              Preview (first 5)
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {importPreview.rows.slice(0, 6).map((row, i) => {
                const val = String(row[importPreview.selectedCol] || '').trim()
                return val ? (
                  <div key={i} style={{ fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--ink2)', padding: '4px 10px', background: 'var(--bg4)', borderRadius: 4, display: 'inline-block' }}>
                    {val}
                  </div>
                ) : null
              })}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={handleImport} disabled={importing}
              style={{
                fontFamily: 'var(--fm)', fontSize: 12, padding: '8px 20px',
                background: 'var(--ink)', color: 'var(--bg)', border: 'none',
                borderRadius: 6, fontWeight: 500, opacity: importing ? 0.6 : 1,
              }}
            >
              {importing ? 'Importing…' : `Import all`}
            </button>
            <button onClick={() => setImportPreview(null)} style={{
              fontFamily: 'var(--fm)', fontSize: 12, padding: '8px 16px',
              border: '0.5px solid var(--bdr2)', borderRadius: 6,
              background: 'none', color: 'var(--ink2)',
            }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div style={{ padding: 32, color: 'var(--ink3)', fontFamily: 'var(--fm)', fontSize: 12 }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: 48, textAlign: 'center', color: 'var(--ink3)', fontSize: 13 }}>
          {search ? 'No companies match your search.' : 'No companies yet. Add one above or import from Excel.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={thStyle}>#</th>
                <th style={thStyle}>Company name</th>
                <th style={thStyle}>Added</th>
                <th style={thStyle}></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '0.5px solid var(--bdr)' }}>
                  <td style={{ ...tdStyle, fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--ink3)', width: 40 }}>{i + 1}</td>
                  <td style={{ ...tdStyle, fontWeight: 500 }}>{c.name}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--ink3)' }}>
                    {c.addedAt ? new Date(c.addedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}
                  </td>
                  <td style={{ ...tdStyle, width: 40 }}>
                    <button onClick={() => handleDelete(c.id)} style={{
                      background: 'none', border: 'none', color: 'var(--red)',
                      padding: '4px 7px', borderRadius: 5, fontSize: 14,
                    }}><i className="ti ti-trash" /></button>
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
