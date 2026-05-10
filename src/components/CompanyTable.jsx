import React, { useState } from 'react'

const AVATARS = ['#9FE1CB','#B5D4F4','#CECBF6','#F4C0D1','#FAC775','#C0DD97','#F5C4B3']
function avatarColor(n) { let h=0; for(let c of (n||'?')) h=(h*31+c.charCodeAt(0))&0xffff; return AVATARS[h%AVATARS.length] }
function initials(n) { return (n||'?').trim().split(/\s+/).map(w=>w[0]?.toUpperCase()||'').slice(0,2).join('') }
function fmtDate(d) {
  if (!d) return '—'
  const [y, m, dd] = d.split('-')
  const mo = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(dd)} ${mo[parseInt(m)-1]} ${y.slice(2)}`
}

function stagePill(stage) {
  if (!stage) return null
  const map = {
    'Approach': { bg: 'var(--gray-bg)', border: 'var(--gray-bdr)', color: 'var(--gray-ink)' },
    'First Contact': { bg: 'var(--blue-bg)', border: 'var(--blue-bdr)', color: 'var(--blue)' },
    'Second Contact': { bg: 'var(--purple-bg)', border: 'var(--purple-bdr)', color: 'var(--purple)' },
    'Third Contact': { bg: 'var(--amber-bg)', border: 'var(--amber-bdr)', color: 'var(--amber)' },
  }
  const style = map[stage] || { bg: 'var(--green-bg)', border: 'var(--green-bdr)', color: 'var(--green)' }
  return (
    <span style={{
      fontFamily: 'var(--fm)', fontSize: 10, fontWeight: 500,
      padding: '2px 8px', borderRadius: 4, display: 'inline-block',
      letterSpacing: '0.2px', whiteSpace: 'nowrap',
      background: style.bg, border: `0.5px solid ${style.border}`, color: style.color,
    }}>{stage}</span>
  )
}

function ConvBadge({ conv }) {
  const map = {
    'Converted': { bg: 'var(--green-bg)', border: 'var(--green-bdr)', color: 'var(--green)', icon: 'ti-check' },
    'Rejected': { bg: 'var(--red-bg)', border: 'var(--red-bdr)', color: 'var(--red)', icon: 'ti-x' },
    'Pending': { bg: 'var(--blue-bg)', border: 'var(--blue-bdr)', color: 'var(--blue)', icon: 'ti-clock' },
    'Not Approached': { bg: 'var(--gray-bg)', border: 'var(--gray-bdr)', color: 'var(--gray-ink)', icon: 'ti-minus' },
  }
  const st = map[conv] || map['Not Approached']
  return (
    <span style={{
      fontFamily: 'var(--fm)', fontSize: 10, fontWeight: 500,
      padding: '2px 9px', borderRadius: 20, whiteSpace: 'nowrap',
      display: 'inline-flex', alignItems: 'center', gap: 4,
      background: st.bg, border: `0.5px solid ${st.border}`, color: st.color,
    }}>
      <i className={`ti ${st.icon}`} style={{ fontSize: 11 }} />
      {conv}
    </span>
  )
}

function DetailPanel({ contacts }) {
  if (!contacts || contacts.length === 0) {
    return (
      <tr><td colSpan={8} style={{ padding: 0 }}>
        <div style={{ padding: '12px 24px', fontSize: 12, color: 'var(--ink3)', background: 'var(--bg2)', borderBottom: '0.5px solid var(--bdr)' }}>
          No touchpoints logged yet.
        </div>
      </td></tr>
    )
  }
  return (
    <tr><td colSpan={8} style={{ padding: 0 }}>
      <div style={{ padding: '12px 24px 14px', background: 'var(--bg2)', borderBottom: '0.5px solid var(--bdr)' }}>
        <div style={{ fontFamily: 'var(--fm)', fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.7px', color: 'var(--ink3)', marginBottom: 10 }}>
          Contact timeline
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {contacts.map((c, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--ink3)', minWidth: 16 }}>{String(i+1).padStart(2,'0')}</span>
              {stagePill(c.stage)}
              <span style={{ fontSize: 11, color: 'var(--ink2)', background: 'var(--bg3)', border: '0.5px solid var(--bdr2)', padding: '1px 7px', borderRadius: 4 }}>
                {c.channel}
              </span>
              <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--ink3)' }}>{fmtDate(c.date)}</span>
              {c.poc && <span style={{ fontSize: 11, color: 'var(--ink2)' }}>via {c.poc}</span>}
              {c.phone && <span style={{ fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--ink2)', background: 'var(--bg4)', border: '0.5px solid var(--bdr)', padding: '1px 7px', borderRadius: 4 }}>{c.phone}</span>}
              {c.note && <span style={{ fontSize: 11, color: 'var(--ink2)', borderLeft: '1px solid var(--bdr2)', paddingLeft: 8 }}>{c.note}</span>}
            </div>
          ))}
        </div>
      </div>
    </td></tr>
  )
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

export default function CompanyTable({ entries, loading, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState(null)

  function toggle(id) { setExpanded(prev => prev === id ? null : id) }

  if (loading) {
    return <div style={{ padding: 48, textAlign: 'center', fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--ink3)' }}>Loading…</div>
  }

  if (entries.length === 0) {
    return (
      <div style={{ padding: 64, textAlign: 'center', color: 'var(--ink3)' }}>
        <i className="ti ti-buildings" style={{ fontSize: 32, display: 'block', marginBottom: 10 }} />
        <p style={{ fontSize: 13 }}>No entries yet. Add your first company above.</p>
      </div>
    )
  }

  return (
    <div style={{ overflowX: 'auto', flex: 1 }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: 760 }}>
        <thead>
          <tr>
            <th style={thStyle}>Person</th>
            <th style={thStyle}>Company / Role</th>
            <th style={thStyle}>Latest stage</th>
            <th style={thStyle}>Touches</th>
            <th style={thStyle}>Last activity</th>
            <th style={thStyle}>Outcome</th>
            <th style={thStyle}>Notes</th>
            <th style={thStyle}></th>
          </tr>
        </thead>
        <tbody>
          {entries.map(e => {
            const contacts = e.contacts || []
            const ls = contacts.length > 0 ? contacts[contacts.length - 1].stage : null
            const latestDate = contacts.filter(c => c.date).sort((a,b) => b.date.localeCompare(a.date))[0]?.date
            const isOpen = expanded === e.id

            return (
              <React.Fragment key={e.id}>
                <tr
                  onClick={() => toggle(e.id)}
                  style={{ borderBottom: '0.5px solid var(--bdr)', cursor: 'pointer', transition: 'background 0.1s', background: isOpen ? 'var(--bg2)' : 'transparent' }}
                  onMouseEnter={ev => { if (!isOpen) ev.currentTarget.style.background = 'var(--bg2)' }}
                  onMouseLeave={ev => { if (!isOpen) ev.currentTarget.style.background = 'transparent' }}
                >
                  <td style={tdStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: avatarColor(e.person), display: 'flex',
                        alignItems: 'center', justifyContent: 'center',
                        fontFamily: 'var(--fm)', fontSize: 9, fontWeight: 500, color: '#1a1a1a',
                        flexShrink: 0,
                      }}>{initials(e.person)}</div>
                      <span>{e.person || '—'}</span>
                    </div>
                  </td>
                  <td style={tdStyle}>
                    <div style={{ fontWeight: 500 }}>{e.company || '—'}</div>
                    {e.role && <div style={{ fontSize: 11, color: 'var(--ink2)', marginTop: 1 }}>{e.role}</div>}
                    {e.scheduledDate && (
                      <div style={{ fontSize: 10, color: 'var(--amber)', marginTop: 3, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <i className="ti ti-calendar-event" style={{ fontSize: 11 }} />
                        {fmtDate(e.scheduledDate)}
                      </div>
                    )}
                  </td>
                  <td style={tdStyle}>{stagePill(ls) || <span style={{ color: 'var(--ink3)', fontSize: 12 }}>—</span>}</td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--fm)', fontSize: 12, color: 'var(--ink2)' }}>
                    {contacts.length} touch{contacts.length !== 1 ? 'es' : ''}
                  </td>
                  <td style={{ ...tdStyle, fontFamily: 'var(--fm)', fontSize: 11, color: 'var(--ink2)', whiteSpace: 'nowrap' }}>
                    {fmtDate(latestDate)}
                  </td>
                  <td style={tdStyle}><ConvBadge conv={e.conversion} /></td>
                  <td style={{ ...tdStyle, fontSize: 12, color: 'var(--ink2)', maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={e.notes}>
                    {e.notes || '—'}
                  </td>
                  <td style={{ ...tdStyle, whiteSpace: 'nowrap' }} onClick={ev => ev.stopPropagation()}>
                    {onEdit && (
                      <button onClick={() => onEdit(e)} style={{ background: 'none', border: '0.5px solid var(--bdr2)', color: 'var(--ink2)', padding: '4px 7px', borderRadius: 5, fontSize: 14, display: 'inline-flex', marginRight: 4 }}>
                        <i className="ti ti-edit" />
                      </button>
                    )}
                    {onDelete && (
                      <button onClick={() => onDelete(e.id)} style={{ background: 'none', border: 'none', color: 'var(--red)', padding: '4px 7px', borderRadius: 5, fontSize: 14, display: 'inline-flex' }}>
                        <i className="ti ti-trash" />
                      </button>
                    )}
                  </td>
                </tr>
                {isOpen && <DetailPanel contacts={contacts} />}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
