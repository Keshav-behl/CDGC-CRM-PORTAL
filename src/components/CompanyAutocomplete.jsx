import React, { useState, useEffect, useRef } from 'react'
import { db } from '../firebase'
import { collection, getDocs } from 'firebase/firestore'

export default function CompanyAutocomplete({ value, onChange, placeholder, style }) {
  const [allCompanies, setAllCompanies] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const containerRef = useRef(null)

  useEffect(() => {
    getDocs(collection(db, 'companyDatabase')).then(snap => {
      const names = snap.docs.map(d => d.data().name).filter(Boolean).sort((a, b) => a.localeCompare(b))
      setAllCompanies(names)
    }).catch(() => {})
  }, [])

  function handleChange(e) {
    const val = e.target.value
    onChange(val)
    setActive(-1)
    if (val.trim().length > 0) {
      const q = val.toLowerCase()
      const matches = allCompanies.filter(c => c.toLowerCase().includes(q)).slice(0, 10)
      setSuggestions(matches)
      setOpen(matches.length > 0)
    } else {
      setSuggestions([])
      setOpen(false)
    }
  }

  function pick(name) {
    onChange(name)
    setSuggestions([])
    setOpen(false)
  }

  function handleKeyDown(e) {
    if (!open) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive(a => Math.min(a + 1, suggestions.length - 1)) }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setActive(a => Math.max(a - 1, 0)) }
    if (e.key === 'Enter' && active >= 0) { e.preventDefault(); pick(suggestions[active]) }
    if (e.key === 'Escape') setOpen(false)
  }

  // Close on outside click
  useEffect(() => {
    function onDown(e) { if (containerRef.current && !containerRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  function highlight(text) {
    if (!value.trim()) return text
    const idx = text.toLowerCase().indexOf(value.toLowerCase())
    if (idx === -1) return text
    return (
      <>
        {text.slice(0, idx)}
        <strong style={{ color: 'var(--ink)', fontWeight: 600 }}>{text.slice(idx, idx + value.length)}</strong>
        {text.slice(idx + value.length)}
      </>
    )
  }

  return (
    <div ref={containerRef} style={{ position: 'relative', ...style }}>
      <input
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setOpen(true)
        }}
        placeholder={placeholder || 'e.g. Jane Street'}
        style={{ width: '100%' }}
      />
      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0,
          background: 'var(--bg3)', border: '0.5px solid var(--bdr2)',
          borderRadius: 8, zIndex: 999, maxHeight: 220, overflowY: 'auto',
          boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          {suggestions.map((s, i) => (
            <div
              key={s}
              onMouseDown={() => pick(s)}
              style={{
                padding: '9px 12px', fontSize: 13, cursor: 'pointer',
                color: 'var(--ink2)',
                background: i === active ? 'var(--bg4)' : 'transparent',
                borderBottom: i < suggestions.length - 1 ? '0.5px solid var(--bdr)' : 'none',
              }}
              onMouseEnter={() => setActive(i)}
            >
              {highlight(s)}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
