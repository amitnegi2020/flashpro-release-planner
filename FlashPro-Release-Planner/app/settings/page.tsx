'use client'
import { useState, useEffect } from 'react'

// Option C — Pastel Soft palette (shared with page.tsx T object)
const T = {
  bg: '#FAFAFA', surface: '#FFFFFF', border: '#E4E4E7', borderLight: '#F4F4F5',
  text: '#18181B', textSecondary: '#52525B', textMuted: '#A1A1AA',
  primary: '#5B8DEF', primaryLight: '#EEF4FE', primaryDark: '#3B6FD4',
  success: '#166534', successBg: '#DCFCE7',
  danger: '#E05E5E', dangerBg: '#FFF0F0',
  warning: '#C2742A', warningBg: '#FEF0E0',
  secondary: '#18181B',
  font: "'Inter', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', monospace",
}

type Config = {
  sprintCapacity: Record<string, number>
  streamCount: number
  sprintCount: number
  aggregates: string[]
  authMode: 'open' | 'password' | 'okta'
  passwordHash: string
  sprintStartDate?: string      // ISO date string for Sprint 1 start (YYYY-MM-DD)
  sprintDurationWeeks?: number  // Length of each sprint in weeks (default 2)
}

const DEFAULT_STREAMS = [
  { key: 's1', name: 'Stream 1', description: '', color: '#2563EB' },
  { key: 's2', name: 'Stream 2', description: '', color: '#16A34A' },
  { key: 's3', name: 'Stream 3', description: '', color: '#7C3AED' },
  { key: 's4', name: 'Stream 4', description: '', color: '#D97706' },
  { key: 's5', name: 'Stream 5', description: '', color: '#0891B2' },
]

const ALL_SPRINTS = ['sprint1','sprint2','sprint3','sprint4','sprint5','sprint6','sprint7','sprint8','sprint9','sprint10','sprint11','sprint12']
const SPRINT_LABELS: Record<string,string> = { sprint1:'Sprint 1',sprint2:'Sprint 2',sprint3:'Sprint 3',sprint4:'Sprint 4',sprint5:'Sprint 5',sprint6:'Sprint 6',sprint7:'Sprint 7',sprint8:'Sprint 8',sprint9:'Sprint 9',sprint10:'Sprint 10',sprint11:'Sprint 11',sprint12:'Sprint 12' }

const EXCLUDED_COLS = new Set(['Story ID','Headline','Points','Story Estimate','Story Estimate (weeks)','BA Review Comments','Notification','STORY SEQ','Change Log','Last Update Date','Comments','System Integration','Tech Service','Legacy Scope IDs','Status','Size Guesstimate','size'])

const NAV = [
  { id: 'board', label: 'Board Setup', icon: '⊞' },
  { id: 'capacity', label: 'Sprint Capacity', icon: '◈' },
  { id: 'dates', label: 'Sprint Dates', icon: '📅' },
  { id: 'views', label: 'Views & Aggregates', icon: '⊕' },
]

export default function SettingsPage() {
  const [section, setSection] = useState('board')
  const [config, setConfig] = useState<Config>({
    sprintCapacity: {}, streamCount: 4, sprintCount: 8,
    aggregates: ['Action', 'Goal'], authMode: 'open', passwordHash: '',
    sprintStartDate: '', sprintDurationWeeks: 2
  })
  const [streams, setStreams] = useState(DEFAULT_STREAMS.slice(0, 4))
  const [lastImportColumns, setLastImportColumns] = useState<string[]>([])
  const [stories, setStories] = useState<any[]>([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [bulkAll, setBulkAll] = useState('')

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(c => { if (c) setConfig(prev => ({ ...prev, ...c })) })
    fetch('/api/state').then(r => r.json()).then(s => {
      if (s?.streams?.length) setStreams(s.streams)
      if (s?.stories?.length) {
        setStories(s.stories)
        // Derive columns from story keys if lastImportColumns is empty
        if (s?.lastImportColumns?.length) {
          setLastImportColumns(s.lastImportColumns)
        } else if (s.stories.length > 0) {
          const keyToLabel: Record<string,string> = {
            persona: 'User Persona', goal: 'Goal', action: 'Action',
            capability: 'Platform Capability', integration: 'System Integration',
            workflow: 'Workflow', headline: 'Headline', id: 'Story ID',
          }
          const derived = Object.entries(keyToLabel)
            .filter(([key]) => s.stories.some((st: any) => st[key]))
            .map(([, label]) => label)
          setLastImportColumns(derived)
        }
      }
    })
  }, [])

  const save = async () => {
    setSaving(true)
    const toSave = { ...config, adminPassword: newPassword || '' }
    await fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(toSave) })
    await fetch('/api/state', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ streams }) })
    setSaving(false); setSaved(true); setNewPassword('')
    setTimeout(() => setSaved(false), 2000)
  }

  const getCapacity = (sk: string, sp: string) => (config.sprintCapacity as any)[`${sk}_${sp}`] ?? (config.sprintCapacity as any)[sp] ?? 20
  const setCapacity = (sk: string, sp: string, v: number) => setConfig(prev => ({ ...prev, sprintCapacity: { ...prev.sprintCapacity, [`${sk}_${sp}`]: v } }))
  const setAllCapacity = (v: number) => {
    const newCap = { ...config.sprintCapacity }
    for (const s of streams) for (const sp of ALL_SPRINTS.slice(0, config.sprintCount ?? 8)) newCap[`${s.key}_${sp}`] = v
    setConfig(prev => ({ ...prev, sprintCapacity: newCap }))
  }

  // Map column label → story object key (handles mismatched names)
  const COL_FIELD_MAP: Record<string,string> = {
    'User Persona': 'persona', 'Goal': 'goal', 'Action': 'action',
    'Platform Capability': 'capability', 'Workflow': 'workflow',
    'System Integration': 'integration', 'Headline': 'headline',
    'Story ID': 'id',
  }

  const resolveField = (col: string): string => {
    if (COL_FIELD_MAP[col]) return COL_FIELD_MAP[col]
    // Try direct key match, then camelCase, then lowercase-no-spaces
    const lower = col.toLowerCase().replace(/\s+/g, '')
    return lower
  }

  const getStoryValues = (col: string): string[] => {
    const field = resolveField(col)
    return stories
      .map((s: any) => s[field] || s[col] || s[col.toLowerCase()] || '')
      .filter(Boolean) as string[]
  }

  const getSmartColumns = () => {
    if (!stories.length) return []
    // Use either lastImportColumns or derive from story keys
    const candidates = lastImportColumns.length > 0 
      ? lastImportColumns 
      : Object.values(COL_FIELD_MAP).map(k => {
          const entry = Object.entries(COL_FIELD_MAP).find(([,v]) => v === k)
          return entry ? entry[0] : k
        })
    
    return candidates.filter(col => {
      if (EXCLUDED_COLS.has(col) || config.aggregates.includes(col)) return false
      const vals = new Set(getStoryValues(col))
      if (vals.size === 0) return false
      const avgPer = stories.length / Math.max(vals.size, 1)
      const avgWords = Array.from(vals).reduce((sum, v) => sum + String(v).split(/\s+/).length, 0) / Math.max(vals.size, 1)
      return avgPer >= 2 && avgWords <= 5 && vals.size > 1 && vals.size < stories.length * 0.9
    }).map(col => {
      const vals = new Set(getStoryValues(col))
      return { name: col, count: vals.size }
    }).slice(0, 12)
  }

  const addAggregate = (name: string) => {
    if (!name.trim() || config.aggregates.includes(name.trim())) return
    const updated = [...config.aggregates, name.trim()]
    setConfig(prev => ({ ...prev, aggregates: updated }))
    fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...config, aggregates: updated }) })
  }

  const removeAggregate = (name: string) => {
    const updated = config.aggregates.filter(a => a !== name)
    setConfig(prev => ({ ...prev, aggregates: updated }))
    fetch('/api/config', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...config, aggregates: updated }) })
  }

  const activeSprints = ALL_SPRINTS.slice(0, config.sprintCount ?? 8)
  const streamColors = ['#2563EB','#16A34A','#7C3AED','#D97706','#0891B2','#DC2626','#059669','#9333EA']

  const input = (value: string | number, onChange: (v: string) => void, type = 'text', placeholder = '') => (
    <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      style={{ padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, fontFamily: T.font, color: T.text, background: T.surface, outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
  )

  const sectionTitle = (title: string, sub?: string) => (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ margin: 0, fontSize: 18, fontWeight: 600, color: T.text, fontFamily: T.font }}>{title}</h2>
      {sub && <p style={{ margin: '4px 0 0', fontSize: 13, color: T.textMuted, fontFamily: T.font }}>{sub}</p>}
    </div>
  )

  const label = (text: string, sub?: string) => (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: 13, fontWeight: 500, color: T.text, fontFamily: T.font }}>{text}</div>
      {sub && <div style={{ fontSize: 11, color: T.textMuted, marginTop: 2 }}>{sub}</div>}
    </div>
  )

  const fieldGroup = (children: React.ReactNode) => (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '16px 20px', marginBottom: 16 }}>
      {children}
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: T.bg, fontFamily: T.font }}>
      {/* Top nav */}
      <div style={{ background: T.secondary, padding: '12px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
        <a href="/" style={{ color: '#94A3B8', fontSize: 13, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Board
        </a>
        <div style={{ width: 1, height: 16, background: '#334155' }} />
        <span style={{ color: '#F1F5F9', fontSize: 14, fontWeight: 600 }}>Settings</span>
      </div>

      <div style={{ display: 'flex', maxWidth: 1100, margin: '0 auto', padding: '32px 24px', gap: 32 }}>
        {/* Left nav */}
        <div style={{ width: 200, flexShrink: 0 }}>
          <nav style={{ position: 'sticky', top: 24 }}>
            {NAV.map(n => (
              <button key={n.id} onClick={() => setSection(n.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 12px', borderRadius: 7, border: 'none', cursor: 'pointer', textAlign: 'left', marginBottom: 2, fontFamily: T.font, fontSize: 13, fontWeight: section === n.id ? 600 : 400, background: section === n.id ? T.primaryLight : 'transparent', color: section === n.id ? T.primary : T.textSecondary, transition: 'all 0.1s' }}>
                <span style={{ fontSize: 15, opacity: 0.7 }}>{n.icon}</span>
                {n.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Board Setup — sprints + streams combined */}
          {section === 'board' && (
            <div>
              {sectionTitle('Board Setup', 'Configure the structure of your release plan — sprint columns and parallel workstreams.')}
              
              {/* Sprints + Streams counts side by side */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
                {fieldGroup(<>
                  {label('Number of Sprints', 'Sprint columns on the board (1–12)')}
                  <input type="number" min={1} max={12} value={config.sprintCount ?? 8}
                    onChange={e => setConfig(prev => ({ ...prev, sprintCount: parseInt(e.target.value) || 8 }))}
                    style={{ padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, width: 80, fontFamily: T.font }} />
                </>)}
                {fieldGroup(<>
                  {label('Number of Streams', 'Parallel workstream rows (2–8)')}
                  <input type="number" min={2} max={8} value={config.streamCount ?? 4}
                    onChange={e => {
                      const n = Math.min(8, Math.max(2, parseInt(e.target.value) || 4))
                      setConfig(prev => ({ ...prev, streamCount: n }))
                      if (n > streams.length) {
                        const more = Array.from({ length: n - streams.length }, (_, i) => ({
                          key: `s${streams.length + i + 1}`,
                          name: `Stream ${streams.length + i + 1}`,
                          description: '',
                          color: streamColors[(streams.length + i) % streamColors.length]
                        }))
                        setStreams(prev => [...prev, ...more])
                      } else {
                        setStreams(prev => prev.slice(0, n))
                      }
                    }}
                    style={{ padding: '7px 10px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, width: 80, fontFamily: T.font }} />
                </>)}
              </div>

              {/* Stream colour configuration — name set via ✏ Edit on board */}
              <div style={{ marginBottom: 8 }}>
                {label('Stream Colours', 'Set the colour for each stream. To rename a stream or add a description, use the ✏ Edit button on the board directly.')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {streams.map((s, i) => (
                  <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 16px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                    <div style={{ width: 4, height: 32, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>{s.name || `Stream ${i + 1}`}</div>
                      <input value={(s as any).description || ''} onChange={e => setStreams(prev => prev.map((st, j) => j === i ? { ...st, description: e.target.value } : st))}
                        placeholder="Description — e.g. integrations, team focus, tech stack…"
                        style={{ padding: '4px 8px', border: `1px solid ${T.border}`, borderRadius: 5, fontSize: 11, fontFamily: T.font, color: T.textSecondary, background: T.bg, outline: 'none', width: '100%', boxSizing: 'border-box' as const }} />
                    </div>
                    <input type="color" value={s.color} onChange={e => setStreams(prev => prev.map((st, j) => j === i ? { ...st, color: e.target.value } : st))}
                      title="Change colour"
                      style={{ width: 32, height: 32, border: `1px solid ${T.border}`, borderRadius: 6, cursor: 'pointer', padding: 2, background: T.surface, flexShrink: 0 }} />
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: T.textMuted, marginTop: 8 }}>
                Stream names and descriptions are edited directly on the board via the ✏ button on each stream header.
              </p>
            </div>
          )}

          {/* Capacity */}
          {section === 'capacity' && (
            <div>
              {sectionTitle('Sprint Capacity', 'Set the maximum story points each stream can take per sprint. Cells that exceed capacity show a warning.')}
              {/* Bulk fill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20, padding: '12px 16px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8 }}>
                <span style={{ fontSize: 13, color: T.textSecondary }}>Set all cells to:</span>
                <input type="number" min={0} max={999} value={bulkAll} onChange={e => setBulkAll(e.target.value)} placeholder="pts"
                  style={{ width: 70, padding: '6px 8px', border: `1px solid ${T.border}`, borderRadius: 6, fontSize: 13, fontFamily: T.font }} />
                <button onClick={() => { if (bulkAll) { setAllCapacity(parseInt(bulkAll)); setBulkAll('') } }}
                  style={{ padding: '6px 14px', background: T.primary, color: '#fff', border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: T.font }}>
                  Apply to all
                </button>
                {/* Totals — capacity + consumed from board */}
                {(() => {
                  const totalCap = streams.reduce((a, s) => a + activeSprints.reduce((b, sp) => b + getCapacity(s.key, sp), 0), 0)
                  const totalConsumed = stories.filter(s => s.sprint !== 'backlog' || s.stream !== 'backlog').reduce((a, s) => a + (s.pts || 0), 0)
                  const totalBacklog = stories.reduce((a, s) => a + (s.pts || 0), 0) - totalConsumed
                  const over = totalConsumed > totalCap
                  const fmtR = (n: number) => { const r = Math.round(n * 10) / 10; return r % 1 === 0 ? String(r) : r.toFixed(1) }
                  return (
                    <div style={{ display: 'flex', gap: 16, marginLeft: 12, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Capacity: <strong style={{ color: T.text }}>{fmtR(totalCap)} pts</strong></span>
                      <span style={{ fontSize: 12, color: T.textMuted }}>Consumed: <strong style={{ color: over ? T.danger : T.success }}>{fmtR(totalConsumed)} pts</strong></span>
                      {totalBacklog > 0 && <span style={{ fontSize: 12, color: T.textMuted }}>Backlog: <strong style={{ color: T.warning }}>{fmtR(totalBacklog)} pts</strong></span>}
                      {over && <span style={{ fontSize: 11, color: T.danger, fontWeight: 600 }}>⚠ Over capacity by {fmtR(totalConsumed - totalCap)} pts</span>}
                    </div>
                  )
                })()}
              </div>
              {/* Table */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'collapse', width: '100%', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: T.bg }}>
                      <th style={{ padding: '8px 12px', textAlign: 'left', border: `1px solid ${T.border}`, fontWeight: 600, color: T.textSecondary, minWidth: 140 }}>Stream</th>
                      {activeSprints.map(sp => (
                        <th key={sp} style={{ padding: '8px 10px', textAlign: 'center', border: `1px solid ${T.border}`, fontWeight: 600, color: T.textSecondary, minWidth: 70 }}>{SPRINT_LABELS[sp]}</th>
                      ))}
                      <th style={{ padding: '8px 10px', textAlign: 'center', border: `1px solid ${T.border}`, fontWeight: 600, color: T.textSecondary, background: T.borderLight }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streams.map((s, si) => {
                      const rowTotal = activeSprints.reduce((a, sp) => a + getCapacity(s.key, sp), 0)
                      return (
                        <tr key={s.key}>
                          <td style={{ padding: '6px 12px', border: `1px solid ${T.border}`, background: `${s.color}08` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                              <div style={{ width: 3, height: 18, borderRadius: 2, background: s.color, flexShrink: 0 }} />
                              <span style={{ fontWeight: 500, color: T.text, fontSize: 12 }}>Stream {si + 1}{s.name !== `Stream ${si + 1}` ? ` — ${s.name}` : ''}</span>
                            </div>
                          </td>
                          {activeSprints.map(sp => {
                            const cap = getCapacity(s.key, sp)
                            return (
                              <td key={sp} style={{ padding: '4px 6px', border: `1px solid ${T.border}`, textAlign: 'center', background: T.surface }}>
                                <input type="number" min={0} max={999} value={cap}
                                  onChange={e => setCapacity(s.key, sp, parseInt(e.target.value) || 0)}
                                  style={{ width: 52, padding: '3px 4px', border: `1px solid ${T.border}`, borderRadius: 4, textAlign: 'center', fontSize: 12, fontFamily: T.font, background: T.bg, outline: 'none' }} />
                              </td>
                            )
                          })}
                          <td style={{ padding: '4px 10px', border: `1px solid ${T.border}`, textAlign: 'center', background: T.borderLight, fontWeight: 600, color: T.text }}>{rowTotal}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                  <tfoot>
                    <tr style={{ background: T.borderLight }}>
                      <td style={{ padding: '6px 12px', border: `1px solid ${T.border}`, fontWeight: 600, color: T.textSecondary, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 }}>Sprint Total</td>
                      {activeSprints.map(sp => {
                        const colTotal = streams.reduce((a, s) => a + getCapacity(s.key, sp), 0)
                        return <td key={sp} style={{ padding: '6px 10px', border: `1px solid ${T.border}`, textAlign: 'center', fontWeight: 600, color: T.text }}>{colTotal}</td>
                      })}
                      <td style={{ padding: '6px 10px', border: `1px solid ${T.border}`, textAlign: 'center', fontWeight: 700, color: T.primary }}>
                        {streams.reduce((a, s) => a + activeSprints.reduce((b, sp) => b + getCapacity(s.key, sp), 0), 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Sprint Dates */}
          {section === 'dates' && (
            <div>
              {sectionTitle('Sprint Dates', 'Set Sprint 1 start date and duration. Sprint headers on the board will show the date range for each sprint. Used for the Gantt chart timeline.')}
              <div style={{ display:'flex', flexDirection:'column', gap:20, maxWidth:420 }}>
                <div>
                  <label style={{ fontSize:13, fontWeight:500, color:T.text, display:'block', marginBottom:6 }}>
                    Sprint 1 Start Date
                  </label>
                  <input type="date"
                    value={config.sprintStartDate || ''}
                    onChange={e => setConfig(prev => ({ ...prev, sprintStartDate: e.target.value }))}
                    style={{ width:'100%', padding:'8px 10px', border:`1px solid ${T.border}`, borderRadius:7, fontSize:13, color:T.text, background:T.bg, fontFamily:T.font, boxSizing:'border-box' as const }} />
                  <div style={{ fontSize:11, color:T.textMuted, marginTop:4 }}>Leave blank to show only sprint numbers (no dates).</div>
                </div>
                <div>
                  <label style={{ fontSize:13, fontWeight:500, color:T.text, display:'block', marginBottom:6 }}>
                    Sprint Duration (weeks)
                  </label>
                  <input type="number" min={1} max={8}
                    value={config.sprintDurationWeeks ?? 2}
                    onChange={e => { const v = Math.min(8, Math.max(1, parseInt(e.target.value) || 2)); setConfig(prev => ({ ...prev, sprintDurationWeeks: v })) }}
                    style={{ width:120, padding:'8px 10px', border:`1px solid ${T.border}`, borderRadius:7, fontSize:13, color:T.text, background:T.bg, fontFamily:T.font }} />
                  <span style={{ fontSize:12, color:T.textMuted, marginLeft:10 }}>weeks per sprint (default: 2)</span>
                </div>
                {config.sprintStartDate && (
                  <div style={{ background:T.primaryLight, border:`1px solid ${T.primary}30`, borderRadius:8, padding:'10px 14px' }}>
                    <div style={{ fontSize:12, fontWeight:600, color:T.primary, marginBottom:6 }}>Sprint date preview</div>
                    {Array.from({ length: config.sprintCount || 8 }, (_, i) => {
                      const start = new Date(config.sprintStartDate!)
                      start.setDate(start.getDate() + i * (config.sprintDurationWeeks || 2) * 7)
                      const end = new Date(start)
                      end.setDate(end.getDate() + (config.sprintDurationWeeks || 2) * 7 - 1)
                      const fmt = (d: Date) => d.toLocaleDateString(undefined, { month:'short', day:'numeric' })
                      return (
                        <div key={i} style={{ fontSize:12, color:T.textSecondary, lineHeight:'22px', display:'flex', gap:8 }}>
                          <span style={{ fontWeight:600, minWidth:64 }}>Sprint {i+1}</span>
                          <span>{fmt(start)} – {fmt(end)}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Views & Aggregates */}
          {section === 'views' && (
            <div>
              {sectionTitle('Views & Aggregates', 'Configure which column groupings appear as view tabs on the board. Aggregates let you plan at the Action, Goal, or any other level from your story map.')}
              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 8 }}>Active view tabs</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, padding: '12px 16px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, minHeight: 52 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', background: T.borderLight, borderRadius: 20, fontSize: 12, color: T.textSecondary }}>Story</span>
                  {config.aggregates.map(agg => (
                    <div key={agg} style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px 4px 12px', background: T.primaryLight, border: `1px solid #BFDBFE`, borderRadius: 20, fontSize: 12, color: T.primary }}>
                      {agg}
                      <button onClick={() => removeAggregate(agg)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#93C5FD', fontSize: 12, padding: '0 0 0 4px', lineHeight: 1, fontWeight: 600 }}>×</button>
                    </div>
                  ))}
                  <span style={{ display: 'inline-flex', alignItems: 'center', padding: '4px 12px', background: T.borderLight, borderRadius: 20, fontSize: 12, color: T.textSecondary }}>⛓ Dependencies</span>
                </div>
              </div>

              {!lastImportColumns.length ? (
                <div style={{ padding: '16px', background: T.warningBg, border: `1px solid #FDE68A`, borderRadius: 8, fontSize: 13, color: '#92400E' }}>
                  Import a story map first to see available columns as aggregate options.
                </div>
              ) : (
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.text, marginBottom: 10 }}>Available columns from your story map</div>
                  <p style={{ fontSize: 12, color: T.textMuted, marginBottom: 16, marginTop: 0 }}>
                    Only columns with 2+ stories per value are shown — these make useful groupings. Click to add as a view tab.
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {getSmartColumns().map(col => (
                      <button key={col.name} onClick={() => addAggregate(col.name)}
                        style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 20, cursor: 'pointer', fontSize: 13, color: T.text, fontFamily: T.font, transition: 'all 0.15s' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = T.primary; (e.currentTarget as HTMLElement).style.color = T.primary }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = T.border; (e.currentTarget as HTMLElement).style.color = T.text }}>
                        <span style={{ fontWeight: 500 }}>{col.name}</span>
                        <span style={{ fontSize: 11, color: T.textMuted, background: T.bg, padding: '1px 6px', borderRadius: 10 }}>{col.count} values</span>
                      </button>
                    ))}
                  </div>
                  {getSmartColumns().length === 0 && (
                    <div style={{ padding: '12px 16px', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.textMuted }}>
                      No additional columns found that work well as aggregates with your current data.
                    </div>
                  )}
                </div>
              )}
            </div>
          )}


          {/* Save button */}
          <div style={{ display: 'flex', gap: 10, marginTop: 32, paddingTop: 20, borderTop: `1px solid ${T.border}` }}>
            <button onClick={save} disabled={saving}
              style={{ padding: '10px 24px', background: T.primary, color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: saving ? 'default' : 'pointer', fontFamily: T.font, opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving…' : saved ? '✓ Saved' : 'Save Changes'}
            </button>
            <a href="/" style={{ padding: '10px 20px', background: T.bg, color: T.textSecondary, border: `1px solid ${T.border}`, borderRadius: 7, fontSize: 13, textDecoration: 'none', display: 'inline-flex', alignItems: 'center', fontFamily: T.font }}>
              Back to Board
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
