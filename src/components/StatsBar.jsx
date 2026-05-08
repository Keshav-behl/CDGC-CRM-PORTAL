import React from 'react'

const s = {
  bar: { display: 'flex', borderBottom: '0.5px solid var(--bdr)' },
  stat: {
    flex: 1, padding: '10px 14px', textAlign: 'center',
    borderRight: '0.5px solid var(--bdr)',
  },
  num: { fontFamily: 'var(--fm)', fontSize: 22, fontWeight: 500, lineHeight: 1 },
  lbl: { fontSize: 10, color: 'var(--ink3)', marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.5px' },
}

function Stat({ num, label, color }) {
  return (
    <div style={{ ...s.stat, borderRight: '0.5px solid var(--bdr)' }}>
      <div style={{ ...s.num, color }}>{num}</div>
      <div style={s.lbl}>{label}</div>
    </div>
  )
}

export default function StatsBar({ entries }) {
  const notApproached = entries.filter(e => e.conversion === 'Not Approached').length
  const pending = entries.filter(e => e.conversion === 'Pending').length
  const converted = entries.filter(e => e.conversion === 'Converted').length
  const rejected = entries.filter(e => e.conversion === 'Rejected').length
  const totalTouches = entries.reduce((acc, e) => acc + (e.contacts?.length || 0), 0)

  return (
    <div style={s.bar}>
      <Stat num={notApproached} label="To Approach" color="var(--ink2)" />
      <Stat num={pending} label="In Pipeline" color="var(--blue)" />
      <Stat num={converted} label="Converted" color="var(--green)" />
      <Stat num={rejected} label="Rejected" color="var(--red)" />
      <div style={{ ...s.stat, borderRight: 'none' }}>
        <div style={{ ...s.num, color: 'var(--amber)' }}>{totalTouches}</div>
        <div style={s.lbl}>Total Touches</div>
      </div>
    </div>
  )
}
