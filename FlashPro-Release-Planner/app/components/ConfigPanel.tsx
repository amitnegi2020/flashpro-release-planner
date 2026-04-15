'use client'
import { useState, useEffect } from 'react'

type Stream = { key: string; name: string; description: string; color: string }
type Config = {
  sprintCapacity: Record<string, number>
  streamCount: number
  sprintCount: number
  aggregates: string[]
  authMode: 'open' | 'password' | 'okta'
  adminPassword: string
  passwordHash: string
}

const ALL_SPRINTS = ['sprint1','sprint2','sprint3','sprint4','sprint5','sprint6','sprint7','sprint8','sprint9','sprint10','sprint11','sprint12']
const SPRINT_LABELS: Record<string, string> = {
  sprint1:'Sprint 1', sprint2:'Sprint 2', sprint3:'Sprint 3', sprint4:'Sprint 4',
  sprint5:'Sprint 5', sprint6:'Sprint 6', sprint7:'Sprint 7', sprint8:'Sprint 8',
  sprint9:'Sprint 9', sprint10:'Sprint 10', sprint11:'Sprint 11', sprint12:'Sprint 12',
}

const DEFAULT_STREAM_COLORS = ['#1d4ed8','#16A34A','#7e22ce','#b45309','#0891b2','#DC2626','#059669','#d97706']

const DEFAULT_CONFIG: Config = {
  sprintCapacity: { sprint1:20, sprint2:20, sprint3:20, sprint4:20, sprint5:20, sprint6:20, sprint7:20, sprint8:20 },
  streamCount: 4,
  sprintCount: 8,
  aggregates: ['Action','Goal'],
  authMode: 'open',
  adminPassword: '',
  passwordHash: ''
}

interface Props {
  onClose: () => void
  streams: Stream[]
  onStreamsChange: (streams: Stream[]) => void
  stories: any[]
  lastImportColumns?: string[]
  onAggregatesChange?: (aggs: string[]) => void
  sprintActualPts?: Record<string, Record<string, number>> // streamKey -> sprintKey -> pts
}

export default function ConfigPanel({ onClose, streams, onStreamsChange, stories, lastImportColumns, onAggregatesChange, sprintActualPts }: Props) {
  const [config, setConfig] = useState<Config>(DEFAULT_CONFIG)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [newAggregate, setNewAggregate] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [aggregateError, setAggregateError] = useState('')
  const [bulkAllValue, setBulkAllValue] = useState('')
  const [bulkStreamValues, setBulkStreamValues] = useState<Record<string,string>>({})

  useEffect(() => {
    fetch('/api/config').then(r => r.json()).then(c => {
      if (c) setConfig(prev => ({ ...prev, ...c }))
    })
  }, [])

  const saveConfig = async (updatedConfig?: Config) => {
    const toSave = { ...(updatedConfig || config), adminPassword: newPassword || '' }
    setSaving(true)
    await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toSave)
    })
    setSaving(false)
    setSaved(true)
    setNewPassword('')
    if (onAggregatesChange) onAggregatesChange(toSave.aggregates)
    setTimeout(() => setSaved(false), 2000)
  }

  const setCapacity = (streamKey: string, sprintKey: string, val: number) => {
    const key = `${streamKey}_${sprintKey}`
    setConfig(prev => ({
      ...prev,
      sprintCapacity: { ...prev.sprintCapacity, [key]: val }
    }))
  }

  const getCapacity = (streamKey: string, sprintKey: string): number => {
    const key = `${streamKey}_${sprintKey}`
    return (config.sprintCapacity as any)[key] ?? (config.sprintCapacity as any)[sprintKey] ?? 20
  }

  const getActualPts = (streamKey: string, sprintKey: string): number => {
    return sprintActualPts?.[streamKey]?.[sprintKey] ?? 0
  }

  const setBulkAllCapacity = (val: string) => {
    const n = parseInt(val)
    if (isNaN(n) || n < 0) return
    const activeSprints = ALL_SPRINTS.slice(0, config.sprintCount ?? 8)
    const newCap = { ...config.sprintCapacity }
    for (const stream of streams) {
      for (const sp of activeSprints) {
        newCap[`${stream.key}_${sp}`] = n
      }
    }
    setConfig(prev => ({ ...prev, sprintCapacity: newCap }))
  }

  const setBulkStreamCapacity = (streamKey: string, val: string) => {
    const n = parseInt(val)
    if (isNaN(n) || n < 0) return
    const activeSprints = ALL_SPRINTS.slice(0, config.sprintCount ?? 8)
    const newCap = { ...config.sprintCapacity }
    for (const sp of activeSprints) {
      newCap[`${streamKey}_${sp}`] = n
    }
    setConfig(prev => ({ ...prev, sprintCapacity: newCap }))
  }

  // Compute available aggregate columns from import data
  const EXCLUDED_COLUMNS = new Set(['Story ID','Headline','Points','Story Estimate','BA Review Comments','Notification','STORY SEQ','Change Log','Last Update Date','Comments','System Integration','Tech Service','Legacy Scope IDs','Status','User Persona'])

  const getAvailableAggregateColumns = (): Array<{name: string; uniqueCount: number}> => {
    if (!lastImportColumns || lastImportColumns.length === 0 || !stories || stories.length === 0) return []
    return lastImportColumns
      .filter(col => !EXCLUDED_COLUMNS.has(col) && !config.aggregates.includes(col))
      .map(col => {
        const field = col.toLowerCase().replace(/\s+/g, '')
        const values = new Set(stories.map((s: any) => s[field] || s[col] || '').filter(Boolean))
        // Check 1-to-many: at least 2 stories per value on average
        const avgStoriesPerValue = stories.length / Math.max(values.size, 1)
        // Check avg word count <= 3
        const avgWordCount = Array.from(values).reduce((sum, v) => sum + String(v).split(/\s+/).length, 0) / Math.max(values.size, 1)
        if (avgStoriesPerValue >= 2 && avgWordCount <= 3 && values.size > 1) {
          return { name: col, uniqueCount: values.size }
        }
        return null
      })
      .filter(Boolean) as Array<{name: string; uniqueCount: number}>
  }

  const handleStreamCountChange = (newCount: number) => {
    const clamped = Math.min(8, Math.max(2, newCount))
    setConfig(prev => ({ ...prev, streamCount: clamped }))

    // Add or remove streams
    if (clamped > streams.length) {
      const toAdd = clamped - streams.length
      const newStreams = [...streams]
      for (let i = 0; i < toAdd; i++) {
        const n = streams.length + i + 1
        newStreams.push({
          key: `s${n}`,
          name: `Stream ${n}`,
          description: '',
          color: DEFAULT_STREAM_COLORS[(n - 1) % DEFAULT_STREAM_COLORS.length]
        })
      }
      onStreamsChange(newStreams)
    } else if (clamped < streams.length) {
      onStreamsChange(streams.slice(0, clamped))
    }
  }

  const addAggregate = (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (config.aggregates.includes(trimmed)) {
      setAggregateError(`"${trimmed}" is already added.`)
      return
    }
    // Validate against imported column names if available
    if (lastImportColumns && lastImportColumns.length > 0) {
      const match = lastImportColumns.find(c => c.toLowerCase() === trimmed.toLowerCase())
      if (!match) {
        setAggregateError(`"${trimmed}" is not a column in your imported file. Available: ${lastImportColumns.join(', ')}`)
        return
      }
    }
    setAggregateError('')
    const updated = [...config.aggregates, trimmed]
    const newConfig = { ...config, aggregates: updated }
    setConfig(newConfig)
    setNewAggregate('')
    if (onAggregatesChange) onAggregatesChange(updated)
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newConfig, adminPassword: '' })
    })
  }

  const removeAggregate = (name: string) => {
    const updated = config.aggregates.filter(a => a !== name)
    const newConfig = { ...config, aggregates: updated }
    setConfig(newConfig)
    if (onAggregatesChange) onAggregatesChange(updated)
    fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...newConfig, adminPassword: '' })
    })
  }

  const availableColumns = lastImportColumns?.filter(c => !config.aggregates.includes(c)) || []

  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:2000, display:'flex', justifyContent:'flex-end' }} onClick={onClose}>
      <div style={{ width:680, background:'#FFFFFF', height:'100vh', display:'flex', flexDirection:'column', boxShadow:'-4px 0 32px rgba(0,0,0,0.15)' }} onClick={e => e.stopPropagation()}>
      {/* Sticky header */}
      <div style={{ padding:'16px 24px', borderBottom:'1px solid #e2e8f0', flexShrink:0, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#0F172A' }}>⚙ Configuration</h2>
        <button onClick={onClose} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color:'#475569' }}>✕</button>
      </div>
      {/* Scrollable content */}
      <div style={{ flex:1, overflow:'auto', padding:'20px 24px' }}>

        {/* Streams + Sprints */}
        <section style={{ marginBottom:28 }}>
          <h3 style={{ margin:'0 0 12px', fontSize:14, fontWeight:700, color:'#0F172A', borderBottom:'1px solid #e2e8f0', paddingBottom:8 }}>Streams & Sprints</h3>
          <div style={{ display:'flex', gap:32, flexWrap:'wrap' }}>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <label style={{ fontSize:13, color:'#475569', whiteSpace:'nowrap' }}>Number of streams:</label>
              <input type="number" min={2} max={8}
                value={config.streamCount}
                onChange={e => handleStreamCountChange(parseInt(e.target.value) || 4)}
                style={{ width:60, padding:'4px 8px', border:'1px solid #e2e8f0', borderRadius:6, fontSize:13 }}
              />
              <span style={{ fontSize:11, color:'#94A3B8' }}>2–8</span>
            </div>
            <div style={{ display:'flex', alignItems:'center', gap:10 }}>
              <label style={{ fontSize:13, color:'#475569', whiteSpace:'nowrap' }}>Number of sprints:</label>
              <input type="number" min={1} max={12}
                value={config.sprintCount ?? 8}
                onChange={e => {
                  const n = Math.min(12, Math.max(1, parseInt(e.target.value) || 8))
                  setConfig(prev => ({ ...prev, sprintCount: n }))
                }}
                style={{ width:60, padding:'4px 8px', border:'1px solid #e2e8f0', borderRadius:6, fontSize:13 }}
              />
              <span style={{ fontSize:11, color:'#94A3B8' }}>1–12</span>
            </div>
          </div>
        </section>

        {/* Sprint Capacity Table */}
        <section style={{ marginBottom:28 }}>
          <h3 style={{ margin:'0 0 4px', fontSize:14, fontWeight:700, color:'#0F172A', borderBottom:'1px solid #e2e8f0', paddingBottom:8 }}>Sprint Capacity (points per stream per sprint)</h3>
          <p style={{ margin:'4px 0 12px', fontSize:11, color:'#94A3B8' }}>Orange = capacity exceeded. Totals row shows points consumed vs total capacity per sprint.</p>

          {/* Bulk fill controls */}
          <div style={{ background:'#F8FAFC', border:'1px solid #e2e8f0', borderRadius:8, padding:'10px 12px', marginBottom:12 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#475569', marginBottom:8 }}>Bulk Fill</div>
            <div style={{ display:'flex', alignItems:'center', gap:8, flexWrap:'wrap' }}>
              <span style={{ fontSize:11, color:'#475569' }}>Set all sprints to:</span>
              <input type="number" min={0} max={999} value={bulkAllValue}
                onChange={e => setBulkAllValue(e.target.value)}
                placeholder="pts"
                style={{ width:60, padding:'3px 6px', border:'1px solid #e2e8f0', borderRadius:5, fontSize:12 }} />
              <button onClick={() => { setBulkAllCapacity(bulkAllValue); setBulkAllValue('') }}
                style={{ padding:'3px 10px', background:'#2563EB', color:'#FFFFFF', border:'none', borderRadius:5, fontSize:11, cursor:'pointer', fontWeight:600 }}>Apply All</button>
            </div>
            <div style={{ marginTop:8, display:'flex', flexDirection:'column', gap:6 }}>
              {streams.map(stream => (
                <div key={stream.key} style={{ display:'flex', alignItems:'center', gap:8 }}>
                  <span style={{ fontSize:11, color:stream.color, fontWeight:600, minWidth:100 }}>{stream.name}:</span>
                  <input type="number" min={0} max={999} value={bulkStreamValues[stream.key] || ''}
                    onChange={e => setBulkStreamValues(prev => ({ ...prev, [stream.key]: e.target.value }))}
                    placeholder="pts"
                    style={{ width:60, padding:'3px 6px', border:'1px solid #e2e8f0', borderRadius:5, fontSize:12 }} />
                  <button onClick={() => {
                    setBulkStreamCapacity(stream.key, bulkStreamValues[stream.key] || '')
                    setBulkStreamValues(prev => ({ ...prev, [stream.key]: '' }))
                  }}
                    style={{ padding:'3px 10px', background:`${stream.color}22`, color:stream.color, border:`1px solid ${stream.color}44`, borderRadius:5, fontSize:11, cursor:'pointer', fontWeight:600 }}>Apply</button>
                </div>
              ))}
            </div>
          </div>

          {(() => {
            const activeSprints = ALL_SPRINTS.slice(0, config.sprintCount ?? 8)

            // Compute totals
            const sprintTotalActual: Record<string,number> = {}
            const sprintTotalCap: Record<string,number> = {}
            activeSprints.forEach(sp => {
              sprintTotalActual[sp] = streams.reduce((a, s) => a + getActualPts(s.key, sp), 0)
              sprintTotalCap[sp] = streams.reduce((a, s) => a + getCapacity(s.key, sp), 0)
            })
            const grandActual = Object.values(sprintTotalActual).reduce((a,b)=>a+b,0)
            const grandCap = Object.values(sprintTotalCap).reduce((a,b)=>a+b,0)

            const remaining = grandCap - grandActual
            return (
              <div>
                {/* Summary bar */}
                <div style={{ display:'flex', gap:8, alignItems:'center', marginBottom:10, padding:'8px 12px', background:'#f1f5f9', borderRadius:8, border:'1px solid #e2e8f0', flexWrap:'wrap' }}>
                  <span style={{ fontSize:12, fontWeight:700, color:'#475569' }}>Total capacity: <strong>{grandCap} pts</strong></span>
                  <span style={{ color:'#cbd5e0' }}>|</span>
                  <span style={{ fontSize:12, color: grandActual > grandCap ? '#D97706' : '#475569' }}>Total consumed: <strong>{grandActual} pts</strong></span>
                  <span style={{ color:'#cbd5e0' }}>|</span>
                  <span style={{ fontSize:12, fontWeight:700, color: remaining < 0 ? '#D97706' : '#16A34A' }}>
                    {remaining < 0 ? `⚠ Over by ${Math.abs(remaining)} pts` : `Remaining: ${remaining} pts`}
                  </span>
                </div>
              <div style={{ overflowX:'auto' }}>
                <table style={{ borderCollapse:'collapse', fontSize:12, width:'100%' }}>
                  <thead>
                    <tr>
                      <th style={{ padding:'6px 8px', textAlign:'left', background:'#F8FAFC', border:'1px solid #e2e8f0', color:'#475569', minWidth:120 }}>Stream</th>
                      {activeSprints.map(sp => (
                        <th key={sp} style={{ padding:'6px 8px', textAlign:'center', background:'#F8FAFC', border:'1px solid #e2e8f0', color:'#475569', minWidth:72 }}>{SPRINT_LABELS[sp]}</th>
                      ))}
                      <th style={{ padding:'6px 8px', textAlign:'center', background:'#f1f5f9', border:'1px solid #e2e8f0', color:'#475569', minWidth:80, fontWeight:700 }}>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {streams.map(stream => {
                      const rowActual = activeSprints.reduce((a,sp)=>a+getActualPts(stream.key,sp),0)
                      const rowCap = activeSprints.reduce((a,sp)=>a+getCapacity(stream.key,sp),0)
                      const rowOver = rowActual > rowCap
                      return (
                        <tr key={stream.key}>
                          <td style={{ padding:'4px 8px', border:'1px solid #e2e8f0', fontWeight:600, color:'#0F172A', background:`${stream.color}10` }}>
                            <span style={{ display:'inline-block', width:10, height:10, borderRadius:2, background:stream.color, marginRight:6 }}/>
                            {stream.name}
                          </td>
                          {activeSprints.map(sp => {
                            const cap = getCapacity(stream.key, sp)
                            const actual = getActualPts(stream.key, sp)
                            const over = actual > cap
                            return (
                              <td key={sp} style={{ padding:'4px 6px', border:'1px solid #e2e8f0', textAlign:'center', background: over ? '#FFFBEB' : '#FFFFFF' }}>
                                <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:2 }}>
                                  <input type="number" min={0} max={999}
                                    value={cap}
                                    onChange={e => setCapacity(stream.key, sp, parseInt(e.target.value) || 0)}
                                    style={{ width:52, padding:'2px 4px', border:`1px solid ${over?'#D97706':'#E2E8F0'}`, borderRadius:4, textAlign:'center', fontSize:11 }}
                                  />
                                  {actual > 0 && (
                                    <span style={{ fontSize:9, color: over ? '#D97706' : '#475569', fontWeight: over ? 700 : 400 }}>
                                      {over ? `⚠ ${actual}/${cap}` : `${actual}/${cap}`}
                                    </span>
                                  )}
                                </div>
                              </td>
                            )
                          })}
                          {/* Row total */}
                          <td style={{ padding:'4px 8px', border:'1px solid #e2e8f0', textAlign:'center', background: rowOver ? '#FFFBEB' : '#F8FAFC', fontWeight:700, fontSize:12 }}>
                            <div style={{ color: rowOver ? '#D97706' : '#475569' }}>
                              {rowActual > 0 ? `${rowActual}/` : ''}{rowCap}
                            </div>
                            {rowActual > 0 && <div style={{ fontSize:9, color:'#94A3B8' }}>consumed</div>}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                  {/* Totals row */}
                  <tfoot>
                    <tr style={{ background:'#f1f5f9' }}>
                      <td style={{ padding:'6px 8px', border:'1px solid #e2e8f0', fontWeight:700, color:'#475569', fontSize:11 }}>Sprint Total</td>
                      {activeSprints.map(sp => {
                        const a = sprintTotalActual[sp]
                        const c = sprintTotalCap[sp]
                        const over = a > c
                        return (
                          <td key={sp} style={{ padding:'5px 6px', border:'1px solid #e2e8f0', textAlign:'center', background: over ? '#FFFBEB' : '#f1f5f9' }}>
                            <div style={{ fontWeight:700, fontSize:12, color: over ? '#D97706' : '#475569' }}>
                              {a > 0 ? `${a}/` : ''}{c}
                            </div>
                            {a > 0 && <div style={{ fontSize:9, color: over?'#D97706':'#94A3B8' }}>{over?'⚠ over':'ok'}</div>}
                          </td>
                        )
                      })}
                      {/* Grand total */}
                      <td style={{ padding:'5px 8px', border:'1px solid #e2e8f0', textAlign:'center', background: grandActual > grandCap ? '#FFFBEB' : '#E2E8F0', fontWeight:800 }}>
                        <div style={{ color: grandActual > grandCap ? '#D97706' : '#0F172A', fontSize:13 }}>
                          {grandActual > 0 ? `${grandActual}/` : ''}{grandCap}
                        </div>
                        <div style={{ fontSize:9, color:'#475569' }}>grand total</div>
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
              </div>
            )
          })()}
        </section>

        {/* Aggregates */}
        <section style={{ marginBottom:28 }}>
          <h3 style={{ margin:'0 0 8px', fontSize:14, fontWeight:700, color:'#0F172A', borderBottom:'1px solid #e2e8f0', paddingBottom:8 }}>View Aggregates</h3>
          <p style={{ margin:'0 0 12px', fontSize:11, color:'#94A3B8' }}>These become tabs in the board view (in addition to Story view).</p>
          <div style={{ display:'flex', flexWrap:'wrap', gap:6, marginBottom:12 }}>
            {config.aggregates.map(agg => (
              <div key={agg} style={{ display:'flex', alignItems:'center', gap:4, background:'#EFF6FF', border:'1px solid #bfdbfe', borderRadius:20, padding:'3px 10px 3px 12px', fontSize:12, color:'#1d4ed8' }}>
                {agg}
                <button onClick={() => removeAggregate(agg)} style={{ background:'none', border:'none', cursor:'pointer', color:'#93c5fd', fontSize:12, padding:0, lineHeight:1 }}>✕</button>
              </div>
            ))}
          </div>

          {(!lastImportColumns || lastImportColumns.length === 0) ? (
            <div style={{ padding:'10px 14px', background:'#FFFBEB', border:'1px solid #fed7aa', borderRadius:8, fontSize:12, color:'#92400e' }}>
              ℹ Import a story map first to configure aggregates.
            </div>
          ) : (
            <>
              {(() => {
                const smartColumns = getAvailableAggregateColumns()
                const allUnused = (lastImportColumns || []).filter(c => !config.aggregates.includes(c) && !EXCLUDED_COLUMNS.has(c))
                return (
                  <div>
                    {smartColumns.length > 0 && (
                      <div style={{ marginBottom:10 }}>
                        <div style={{ fontSize:11, fontWeight:600, color:'#475569', marginBottom:6 }}>Recommended columns (smart grouping):</div>
                        <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                          {smartColumns.map(col => (
                            <button key={col.name} onClick={() => addAggregate(col.name)}
                              style={{ padding:'3px 10px', fontSize:11, background:'#EFF6FF', border:'1px solid #bfdbfe', borderRadius:10, cursor:'pointer', color:'#1d4ed8', fontWeight:500 }}>
                              + {col.name} <span style={{ fontSize:9, color:'#475569' }}>({col.uniqueCount} values)</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                    <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                      <select
                        value={newAggregate}
                        onChange={e => { setNewAggregate(e.target.value); setAggregateError('') }}
                        style={{ padding:'5px 8px', fontSize:12, border:`1px solid ${aggregateError ? '#ef4444' : '#E2E8F0'}`, borderRadius:6, flex:1, outline:'none', background:'#FFFFFF', color:'#0F172A' }}>
                        <option value="">— Select a column —</option>
                        {allUnused.map(col => {
                          const smart = smartColumns.find(s => s.name === col)
                          return (
                            <option key={col} value={col}>
                              {col}{smart ? ` (${smart.uniqueCount} values)` : ''}
                            </option>
                          )
                        })}
                      </select>
                      <button onClick={() => addAggregate(newAggregate)} disabled={!newAggregate}
                        style={{ padding:'5px 12px', background: newAggregate ? '#2563EB' : '#E2E8F0', color: newAggregate ? '#FFFFFF' : '#94A3B8', border:'none', borderRadius:6, fontSize:12, cursor: newAggregate ? 'pointer' : 'default' }}>+ Add</button>
                    </div>
                  </div>
                )
              })()}
            </>
          )}

          {aggregateError && (
            <div style={{ marginTop:6, fontSize:11, color:'#DC2626', background:'#FEF2F2', border:'1px solid #fda4af', borderRadius:6, padding:'6px 10px', lineHeight:1.4 }}>
              ⚠ {aggregateError}
            </div>
          )}
        </section>

        {/* Auth Mode */}
        <section style={{ marginBottom:28 }}>
          <h3 style={{ margin:'0 0 4px', fontSize:14, fontWeight:700, color:'#0F172A', borderBottom:'1px solid #e2e8f0', paddingBottom:8 }}>Access Control</h3>
          <p style={{ margin:'0 0 12px', fontSize:11, color:'#94A3B8' }}>Local mode = no login. Password = simple shared password. Google/SSO = OAuth with per-user roles and invite flow.</p>
          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:12 }}>
            {[
              { value:'open', label:'🌐 Local / Open', sub:'No login required. Anyone with the URL can edit. Best for local use on a single machine.' },
              { value:'password', label:'🔒 Password Protected', sub:'Single shared password. Simple protection for small teams on the same network.' },
              { value:'okta', label:'🏢 ThoughtWorks SSO (Okta)', sub:'Sign in with your ThoughtWorks Okta account. Supports roles: Admin, Collaborator, Viewer.' },
            ].map(opt => (
              <label key={opt.value} style={{ display:'flex', alignItems:'flex-start', gap:10, cursor:'pointer', padding:'10px 12px', borderRadius:8, border:`1px solid ${config.authMode===opt.value?'#2563EB':'#E2E8F0'}`, background:config.authMode===opt.value?'#EFF6FF':'#FFFFFF' }}>
                <input type="radio" checked={config.authMode === opt.value} onChange={()=>setConfig(prev=>({...prev, authMode:opt.value as any}))} style={{ marginTop:2 }} />
                <div>
                  <div style={{ fontSize:13, fontWeight:600, color:'#0F172A' }}>{opt.label}</div>
                  <div style={{ fontSize:11, color:'#94A3B8', marginTop:2 }}>{opt.sub}</div>
                </div>
              </label>
            ))}
          </div>
          {config.authMode === 'password' && (
            <div style={{ background:'#F8FAFC', border:'1px solid #e2e8f0', borderRadius:8, padding:12 }}>
              <label style={{ fontSize:12, color:'#475569', display:'block', marginBottom:4 }}>
                Admin password {config.passwordHash ? '(set — enter new to change)' : '(not set)'}
              </label>
              <input type="password" value={newPassword} onChange={e=>setNewPassword(e.target.value)}
                placeholder="Enter new password…"
                style={{ width:'100%', padding:'7px 10px', border:'1px solid #e2e8f0', borderRadius:6, fontSize:13, boxSizing:'border-box' }} />
            </div>
          )}
          {(config.authMode === 'okta' || config.authMode === 'password') && (
            <div style={{ marginTop:12 }}>
              <a href="/admin" style={{ fontSize:12, color:'#2563EB', textDecoration:'none', fontWeight:600 }}>👥 Manage users & invites →</a>
            </div>
          )}
        </section>

      </div>{/* end scrollable content */}

      {/* Sticky Save button — always visible at bottom */}
      <div style={{ padding:'14px 24px', borderTop:'2px solid #e2e8f0', background:'#FFFFFF', flexShrink:0, display:'flex', gap:8 }}>
        <button
          onClick={() => saveConfig()}
          style={{ flex:1, padding:'11px', background:'#2563EB', color:'#FFFFFF', border:'none', borderRadius:8, fontSize:14, fontWeight:700, cursor:'pointer' }}
        >
          {saving ? 'Saving…' : saved ? '✓ Saved!' : 'Save Configuration'}
        </button>
        <button onClick={onClose} style={{ padding:'11px 24px', background:'#f1f5f9', color:'#475569', border:'1px solid #e2e8f0', borderRadius:8, fontSize:14, cursor:'pointer', fontWeight:600 }}>Close</button>
      </div>

      </div>
    </div>
  )
}
