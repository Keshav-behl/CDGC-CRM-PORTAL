import React from 'react'

const s = {
  bar: {
    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
    padding: '14px 24px 12px',
    borderBottom: '0.5px solid var(--bdr)',
    background: 'var(--bg)',
  },
  left: { display: 'flex', alignItems: 'center', gap: 12 },
  title: {
    fontFamily: 'var(--fm)', fontSize: 17, fontWeight: 500,
    letterSpacing: '-0.3px', color: 'var(--ink)',
  },
  badge: {
    fontFamily: 'var(--fm)', fontSize: 10,
    background: 'var(--bg3)', color: 'var(--ink2)',
    padding: '2px 9px', borderRadius: 20,
    border: '0.5px solid var(--bdr2)',
  },
  live: {
    fontFamily: 'var(--fm)', fontSize: 10, color: 'var(--ink3)',
    display: 'flex', alignItems: 'center', gap: 5,
  },
  dot: {
    width: 6, height: 6, borderRadius: '50%', background: 'var(--green)',
    boxShadow: '0 0 6px var(--green)',
  },
}

export default function TopBar({ count }) {
  return (
    <div style={s.bar}>
      <div style={s.left}>
        <span style={s.title}>placement.crm</span>
        <span style={s.badge}>{count} compan{count === 1 ? 'y' : 'ies'}</span>
      </div>
      <div style={s.live}>
        <span style={s.dot} />
        live · shared
      </div>
    </div>
  )
}
