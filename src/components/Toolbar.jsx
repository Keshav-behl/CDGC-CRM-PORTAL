import React from 'react'

const s = {
  bar: {
    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 24px',
    borderBottom: '0.5px solid var(--bdr)', flexWrap: 'wrap',
    background: 'var(--bg)',
  },
  input: { width: 200, background: 'var(--bg3)' },
  select: { background: 'var(--bg3)' },
  addBtn: {
    fontFamily: 'var(--fm)', fontSize: 12, fontWeight: 500,
    background: 'var(--ink)', color: 'var(--bg)',
    border: 'none', padding: '7px 16px', borderRadius: 6,
    display: 'flex', alignItems: 'center', gap: 6,
    marginLeft: 'auto', cursor: 'pointer',
  },
}

export default function Toolbar({
  search, setSearch,
  filterConv, setFilterConv,
  filterPerson, setFilterPerson,
  people, onAdd,
}) {
  return (
    <div style={s.bar}>
      <input
        type="text"
        placeholder="Search company, person, role…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={s.input}
      />
      <select value={filterConv} onChange={e => setFilterConv(e.target.value)} style={s.select}>
        <option value="">All outcomes</option>
        <option value="Not Approached">Not Approached</option>
        <option value="Pending">Pending</option>
        <option value="Converted">Converted</option>
        <option value="Rejected">Rejected</option>
      </select>
      <select value={filterPerson} onChange={e => setFilterPerson(e.target.value)} style={s.select}>
        <option value="">All people</option>
        {people.map(p => <option key={p} value={p}>{p}</option>)}
      </select>
      <button style={s.addBtn} onClick={onAdd}>
        <i className="ti ti-plus" />
        Add company
      </button>
    </div>
  )
}
