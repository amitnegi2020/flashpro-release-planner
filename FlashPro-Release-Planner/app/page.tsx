'use client'
import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { SEED_STORIES } from '../lib/seedData'
import { checkDependencies, STORY_DEPS } from '../lib/dependencies'
import ConfigPanel from './components/ConfigPanel'
import type { Story, Stream, ViewMode, DepWarning, VersionMeta, MergeConflict, ImportFeedback, RPConfirmData } from '../lib/types'
import { SPRINT_NUM as SPRINT_NUM_CONST, ALL_SPRINTS as ALL_SPRINTS_CONST, DEFAULT_STREAMS as DEFAULT_STREAMS_CONST } from '../lib/constants'

const T = {
  // ── Option C: Pastel Soft ───────────────────────────────────
  // Backgrounds — warm zinc base, not cold slate
  bg:            '#FAFAFA',   // Zinc 50 — page background
  surface:       '#FFFFFF',   // Cards, panels
  surfaceHover:  '#F4F4F5',   // Zinc 100 — card hover
  // Borders — slightly warmer than slate
  border:        '#E4E4E7',   // Zinc 200
  borderLight:   '#F4F4F5',   // Zinc 100 — subtle divider
  // Text
  text:          '#18181B',   // Zinc 900 — primary text
  textSecondary: '#52525B',   // Zinc 600 — labels
  textMuted:     '#A1A1AA',   // Zinc 400 — placeholders
  // Primary brand — cornflower blue (slightly softer than #2563EB)
  primary:       '#5B8DEF',   // Cornflower — pastel primary
  primaryDark:   '#3B6FD4',   // Deeper cornflower for hover
  primaryLight:  '#EEF4FE',   // Very light cornflower tint
  // Semantic — pastel versions, carefully paired with Option C palette
  success:       '#166534',   // Dark sage text
  successBg:     '#DCFCE7',   // Pastel mint bg
  // Orange — warm amber, complements terracotta + sage
  warning:       '#C2742A',   // Burnt amber text
  warningBg:     '#FEF0E0',   // Warm peach bg
  // Red — warm coral, complements dusty rose + terracotta
  danger:        '#E05E5E',   // Coral red text
  dangerBg:      '#FFF0F0',   // Blush bg
  info:          '#0369A1',   // Dark sky text
  infoBg:        '#E0F2FE',   // Pastel sky bg
  // Accent — pastel lilac for split cards
  accent:        '#7E22CE',   // Violet text
  accentBg:      '#F3E8FF',   // Pastel lilac bg
  // Nav bar — keep dark for contrast
  secondary:     '#18181B',   // Zinc 900 nav
  // Persona colours — pastel pills
  seller:        '#166534',   // Dark sage text
  sellerBg:      '#DCFCE7',   // Pastel mint bg
  operator:      '#1D4ED8',   // Cornflower text (slightly richer)
  operatorBg:    '#DBEAFE',   // Pastel sky bg
  // ── Typography ──────────────────────────────────────────────
  fontFamily:    "'Inter', system-ui, -apple-system, sans-serif",
  fontMono:      "'JetBrains Mono', 'SF Mono', monospace",
  // Font sizes — strict 6-step scale
  fs: { xs: 10, sm: 12, base: 13, md: 14, lg: 16, xl: 20 },
  // Spacing
  sp: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },
  // Border radius
  radius: { sm: 4, md: 6, lg: 8, xl: 12, full: 9999 },
  // Shadows — lighter and warmer
  shadow: {
    sm: '0 1px 3px rgba(0,0,0,0.06)',
    md: '0 2px 8px rgba(0,0,0,0.07)',
    lg: '0 8px 24px rgba(0,0,0,0.09)',
  }
}

// Use shared constants (backlog=999 for ordering, 0 in lib/constants — keep local for dep checking ordering)
const SPRINT_NUM: Record<string,number> = { backlog:999, sprint1:1, sprint2:2, sprint3:3, sprint4:4, sprint5:5, sprint6:6, sprint7:7, sprint8:8, sprint9:9, sprint10:10, sprint11:11, sprint12:12 }

// Key story dependencies for the dependency view
const STORY_DEPS_VIEW: Record<string,string[]> = {
  'O02':['S01'],'O03':['S01'],'O04':['S01','S02','S03'],'O05':['S01'],'O06':['S01'],
  'O07':['S01','S02','S03'],'O08':['O07'],'O09':['O08'],'O10':['O09'],
  'O11':['S01'],'O12':['O07'],
  'S05':['O10'],'S06':['O10'],'S07':['O10'],'S08':['O10'],
  'S09':['O10'],'S10':['O10'],'S11':['O10'],'S12':['O10'],
  'O60':['S11'],
  'O13':['O10'],'O14':['O10'],'O15':['O10'],
  'S51':['O10','O60'],'S52':['O40','O41','S51'],
  'S49':['O40','O41'],'S50':['O40','O41'],
  'O42':['O40'],
  'S13':['O37','O39','O10'],'S14':['O37','O39','O10'],'S15':['O37','O39','O10'],
  'S16':['S13'],'S17':['S13'],'S18':['S13'],'S19':['S13'],
  'S20':['S13'],'S21':['S13'],'S22':['S13'],'S23':['S13'],'S24':['S13'],'S25':['S13'],'S26':['S13'],
  'O16':['S13'],'O17':['S13'],'O18':['S13'],'O19':['S13'],
  'S39':['S13','O17'],'S40':['S39'],'S41':['S40'],
  'S42':['S13','O17'],'S43':['S13','O17'],'S44':['S43'],
  'S45':['S39'],'S46':['S39'],
  'S47':['S39'],'S48':['S47'],
  'O46':['S39'],'O47':['S40'],'O49':['S39'],
  'O48':['S39'],'O50':['S41'],'O65':['S39'],
  'O43':['S47'],'O44':['S47'],'O45':['S47'],
  'S27':['S13'],'S28':['S13'],'S29':['S13'],'S30':['S13'],'S31':['S13'],'S32':['S13'],
  'O22':['S13'],'O23':['S13'],'O24':['O23'],'O25':['O23'],
  'O26':['S13'],'O27':['S13'],'O28':['S13'],
  'S33':['O22','O23'],'S34':['O27'],'S36':['O28'],'S35':['O26'],
  'S56':['O10','S11'],'S57':['O10'],'S58':['O10'],
  'S37':['O10'],'S38':['O10'],'O36':['S37'],
  'O61':['O31'],'O62':['O31'],'O63':['O31'],
  'S53':['S39'],'S55':['O31','S39'],'S54':['S27'],
  'O59':['S39'],'O58':['O22'],
}

// CRITICAL_PATH is now dynamic — loaded from server state (state.criticalPath).
// This placeholder is overridden in the component by the useMemo below.
// Kept for STORY_DEPS_VIEW references only; CP badge logic uses the dynamic set.
const CRITICAL_PATH_STATIC = new Set(['O37','O39','O40','O31','O41','O45','S01','S02','S03','S05','S06','S11','O04','O08','O09','O07','S08','S09','S10','S12','O10','S51','S52','S49','S50','S13','O17','O60','S29','S30','S27','S32','S28','S39','S40','S41','S45','S47','S43','S44','S60'])

// Types imported from lib/types.ts
// ViewMode, Story, Stream — re-export for local use
const DEFAULT_STREAMS: Stream[] = DEFAULT_STREAMS_CONST
const ALL_SPRINTS = ALL_SPRINTS_CONST

const PERSONA_COLOR: Record<string,string> = { Seller: T.seller, Operator: T.operator, '': T.textMuted }
const PERSONA_BG: Record<string,string> = { Seller: T.sellerBg, Operator: T.operatorBg, '': T.borderLight }
const SIZE_COLOR: Record<string,string> = { XS:T.textMuted, S:'#60a5fa', M:'#a78bfa', L:T.accent, XL:T.danger }

// ── Shared icon paths (24×24, fill="none", stroke, round caps) ─────────────
const IC = {
  // Document with horizontal lines — story list
  storyMap: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="12" y2="17"/></>,
  // Document with a small + badge — merge / add
  mergeBacklog: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="13" x2="12" y2="19"/><line x1="9" y1="16" x2="15" y2="16"/></>,
  // Two nodes joined by a line — dependencies
  depMap: <><circle cx="5" cy="12" r="3"/><circle cx="19" cy="12" r="3"/><path d="M8 12h8"/><path d="M5 9V5a2 2 0 0 1 2-2h2"/><path d="M19 9V5a2 2 0 0 0-2-2h-2"/></>,
  // Diamond shape — critical path / milestones
  criticalPath: <><path d="M12 2l4 7H8l4-7z"/><path d="M8 9l4 13 4-13"/><line x1="5" y1="9" x2="19" y2="9"/></>,
  // 2×2 table grid — release plan / spreadsheet
  releasePlan: <><rect x="3" y="3" width="18" height="18" rx="2"/><line x1="3" y1="10" x2="21" y2="10"/><line x1="3" y1="17" x2="21" y2="17"/><line x1="10" y1="3" x2="10" y2="21"/></>,
  // Box / package — project file archive
  projectFile: <><path d="M21 8V21H3V8"/><rect x="1" y="3" width="22" height="5" rx="1"/><line x1="10" y1="12" x2="14" y2="12"/></>,
  // Download arrow into tray
  download: <><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>,
}

function ModalIcon({ icon, color }: { icon: React.ReactNode; color: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>
      {icon}
    </svg>
  )
}

function VersionRow({ v, onPreview, onStar, formatDate, triggerLabel, T: Tk }: {
  v: any; onPreview:(id:string)=>void; onStar:(id:string, starred:boolean)=>void;
  formatDate:(iso:string)=>string; triggerLabel:(t:string, v?:any)=>string; T: any
}) {
  // Split "Mon Apr 14, 2:23 PM · Sprint 3 · 45 planned" into date and description
  const fullName = v.name || triggerLabel(v.trigger, v)
  const dotIdx = fullName.indexOf(' · ')
  // Detect if name starts with a date pattern (has comma + AM/PM or time-like structure)
  const hasDatePrefix = /^[A-Z][a-z]{2}\s[A-Z][a-z]{2}\s\d+,\s\d+:\d+\s[AP]M/.test(fullName)
  const datePart = hasDatePrefix && dotIdx > 0 ? fullName.slice(0, dotIdx) : ''
  const descPart = hasDatePrefix && dotIdx > 0 ? fullName.slice(dotIdx + 3) : fullName

  return (
    <div style={{ padding:'9px 14px', borderBottom:`1px solid ${Tk.borderLight}`, cursor:'pointer' }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLDivElement).style.background = Tk.bg }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLDivElement).style.background = '' }}>

      {/* Row 1: star + description + relative time */}
      <div style={{ display:'flex', alignItems:'flex-start', gap: 7 }}>
        <button onClick={e=>{ e.stopPropagation(); onStar(v.id, !v.starred) }}
          style={{ background:'none', border:'none', cursor:'pointer', padding:'1px 0 0', color: v.starred ? '#F59E0B' : Tk.textMuted, flexShrink:0, lineHeight:1, fontSize:13 }}>
          {v.starred ? '★' : '☆'}
        </button>
        <div style={{ flex:1, minWidth:0 }} onClick={()=>onPreview(v.id)}>
          <div style={{ fontSize: Tk.fs.sm, fontWeight: v.starred ? 600 : 500, color: Tk.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const, lineHeight:'18px' }}>
            {descPart}
          </div>
        </div>
        <span style={{ fontSize:10, color: Tk.textMuted, flexShrink:0, whiteSpace:'nowrap' as const, paddingTop:2 }}>{formatDate(v.savedAt)}</span>
      </div>

      {/* Row 2: date stamp + stats + preview */}
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginTop:3, paddingLeft:20 }}>
        <div style={{ fontSize:10, color: Tk.textMuted, display:'flex', gap:6, flexWrap:'wrap' as const }}>
          {datePart && <span style={{ color: Tk.textSecondary }}>{datePart}</span>}
          {datePart && <span>·</span>}
          <span>{v.storyCount} stories · {v.plannedCount} planned</span>
          {v.projectName && <><span>·</span><span>{v.projectName}</span></>}
        </div>
        <button onClick={()=>onPreview(v.id)}
          style={{ fontSize:10, color: Tk.primary, background:'none', border:'none', cursor:'pointer', padding:'2px 6px', fontWeight:600, flexShrink:0, borderRadius: Tk.radius.sm }}
          onMouseEnter={e=>{ (e.currentTarget as HTMLButtonElement).style.background = Tk.primaryLight }}
          onMouseLeave={e=>{ (e.currentTarget as HTMLButtonElement).style.background = 'none' }}>
          Preview →
        </button>
      </div>
    </div>
  )
}

function ExportRow({ label, ext, desc, onDownload, T: Tk, icon }: { label:string; ext:string; desc:string; onDownload:()=>void; T:any; icon:React.ReactNode }) {
  return (
    <div onClick={onDownload} style={{ display:'flex', alignItems:'center', gap: Tk.sp.md, padding:`${Tk.sp.sm}px ${Tk.sp.md}px`, marginBottom: Tk.sp.xs, borderRadius: Tk.radius.md, border:`1px solid ${Tk.border}`, cursor:'pointer', background: Tk.bg }}
      onMouseEnter={e=>{ (e.currentTarget as HTMLDivElement).style.borderColor=Tk.primary; (e.currentTarget as HTMLDivElement).style.background=Tk.primaryLight }}
      onMouseLeave={e=>{ (e.currentTarget as HTMLDivElement).style.borderColor=Tk.border; (e.currentTarget as HTMLDivElement).style.background=Tk.bg }}>
      <ModalIcon icon={icon} color={Tk.textSecondary} />
      <div style={{ flex:1 }}>
        <div style={{ fontSize: Tk.fs.sm, fontWeight:600, color: Tk.text }}>{label} <span style={{ fontSize: Tk.fs.xs, fontWeight:400, color: Tk.textMuted }}>{ext}</span></div>
        <div style={{ fontSize: Tk.fs.xs, color: Tk.textSecondary, marginTop:2, lineHeight:1.4 }}>{desc}</div>
      </div>
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={Tk.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink:0 }}>{IC.download}</svg>
    </div>
  )
}

export default function ReleasePlanner() {
  const [stories, setStories] = useState<Story[]>((SEED_STORIES as any[]).map(s => ({ ...s, stream: 'backlog' })))
  const [streams, setStreams] = useState<Stream[]>(DEFAULT_STREAMS)
  const [view, setView] = useState<ViewMode>('story')
  const [aggregates, setAggregates] = useState<string[]>(['Action', 'Goal'])
  const [sprintCount, setSprintCount] = useState(8)
  const [sprintCapacity, setSprintCapacity] = useState<Record<string,number>>({})
  const [criticalPathIds, setCriticalPathIds] = useState<string[]>([])  // dynamic CP list from server
  const [sprintStartDate, setSprintStartDate] = useState<string>('')   // ISO date for Sprint 1
  const [sprintDurationWeeks, setSprintDurationWeeks] = useState(2)    // weeks per sprint
  const [ganttGroupBy, setGanttGroupBy] = useState<string>('stream')   // Gantt row grouping
  const [showBacklog, setShowBacklog] = useState(true)
  const [showLegend, setShowLegend] = useState(false)
  const [activeUsers, setActiveUsers] = useState<{name:string;email:string;color:string;view?:string}[]>([])
  const [zoom, setZoom] = useState(1)
  const [showConfig, setShowConfig] = useState(false)
  const [search, setSearch] = useState('')
  const [filterPersonas, setFilterPersonas] = useState<string[]>([])
  const [filterAggregates, setFilterAggregates] = useState<Record<string,string[]>>({})
  // Keep legacy filterPersona/filterGoal as computed for filtering logic
  const filterPersona = filterPersonas.length === 1 ? filterPersonas[0] : ''
  const filterGoal = (filterAggregates['goal'] || []).length === 1 ? (filterAggregates['goal'] || [])[0] : ''
  const [dragging, setDragging] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState<string | null>(null)
  const [dragOverCard, setDragOverCard] = useState<string | null>(null)
  const [currentProject, setCurrentProject] = useState<string>('')
  const [projects, setProjects] = useState<{key:string;name:string;savedAt:string;storyCount:number;plannedCount:number}[]>([])
  const [showProjects, setShowProjects] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [saving, setSaving] = useState(false)

  const loadProjects = async () => {
    const res = await fetch('/api/projects')
    const data = await res.json()
    setProjects(data.projects || [])
  }

  // useEffect(() => { loadProjects() }, [])

  const saveProject = async (name: string) => {
    if (!name.trim()) return
    setSaving(true)
    await fetch('/api/projects', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: name.trim(), state: { stories, streams } })
    })
    setCurrentProject(name.trim())
    setNewProjectName('')
    await loadProjects()
    setSaving(false)
  }

  const loadProject = async (name: string) => {
    const res = await fetch('/api/projects', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    const data = await res.json()
    if (data.ok && data.state?.stories) {
      setStories(data.state.stories)
      if (data.state.streams) setStreams(data.state.streams)
      setCurrentProject(name)
      setShowProjects(false)
    }
  }

  const deleteProject = async (name: string) => {
    if (!confirm(`Delete project "${name}"?`)) return
    await fetch('/api/projects', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name })
    })
    if (currentProject === name) setCurrentProject('')
    await loadProjects()
  }
  const [lastImportColumns, setLastImportColumns] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const depsFileRef = useRef<HTMLInputElement>(null)

  // Version history state
  type VersionMeta = { id:string; name:string; starred:boolean; trigger:string; savedAt:string; storyCount:number; plannedCount:number; projectName:string }
  const [versions, setVersions] = useState<VersionMeta[]>([])
  const [showVersionDropdown, setShowVersionDropdown] = useState(false)
  const [previewingVersion, setPreviewingVersion] = useState<{id:string; name:string; trigger:string; savedAt:string} | null>(null)
  // Ref for SSE closure to read preview state without going stale (QA-C-03)
  const previewingVersionRef = useRef<{id:string; name:string; trigger:string; savedAt:string} | null>(null)
  const [snapshotName, setSnapshotName] = useState('')
  const [showSnapshotInput, setShowSnapshotInput] = useState(false)
  const [savingSnapshot, setSavingSnapshot] = useState(false)
  const liveStateRef = useRef<{stories:Story[]; streams:Stream[]} | null>(null)
  const versionDropdownRef = useRef<HTMLDivElement>(null)

  const loadVersions = async () => {
    const res = await fetch('/api/versions')
    const data = await res.json()
    setVersions(data.versions || [])
  }

  // Load versions on mount so History shows existing versions immediately
  useEffect(() => { loadVersions() }, [])

  // Close version dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (versionDropdownRef.current && !versionDropdownRef.current.contains(e.target as Node)) {
        setShowVersionDropdown(false)
        setShowSnapshotInput(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const createVersion = async (trigger: string, s: Story[], st: Stream[], name?: string, starred?: boolean) => {
    try {
      const stateRes = await fetch('/api/state')
      const stateData = await stateRes.json()
      await fetch('/api/versions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trigger, name: name || '', starred: starred || false,
          projectName: currentProject,
          state: { stories: s, streams: st, customDeps: stateData.customDeps || {}, criticalPath: stateData.criticalPath || [] }
        })
      })
      loadVersions()
    } catch {}
  }

  const previewVersion = async (id: string) => {
    // Stash current live state before overwriting
    liveStateRef.current = { stories, streams }
    const res = await fetch(`/api/versions/${id}`)
    const data = await res.json()
    if (data.version) {
      setStories(data.version.state.stories || [])
      if (data.version.state.streams?.length) setStreams(data.version.state.streams)
      const pvData = { id, name: data.version.name, trigger: data.version.trigger, savedAt: data.version.savedAt }; setPreviewingVersion(pvData); previewingVersionRef.current = pvData
      setShowVersionDropdown(false)
    }
  }

  const restoreVersion = async () => {
    if (!previewingVersion) return
    // Current board already shows the version state — save it as the live state
    await fetch('/api/state', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stories, streams, projectName: currentProject })
    })
    // Create a new auto-version so the restored point is in history
    await createVersion('restore', stories, streams, `Restored: ${previewingVersion.name || formatVersionDate(previewingVersion.savedAt)}`)
    liveStateRef.current = null
    setPreviewingVersion(null); previewingVersionRef.current = null
    loadVersions()
  }

  const backToCurrent = () => {
    if (liveStateRef.current) {
      setStories(liveStateRef.current.stories)
      setStreams(liveStateRef.current.streams)
    }
    liveStateRef.current = null
    setPreviewingVersion(null); previewingVersionRef.current = null
  }

  const generateSnapshotName = (): string => {
    const now = new Date()
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
    const dayAbbr = days[now.getDay()]
    const dateStr = `${dayAbbr} ${months[now.getMonth()]} ${now.getDate()}`
    const h = now.getHours(), m = now.getMinutes()
    const ampm = h < 12 ? 'AM' : 'PM'
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
    const timeStr = `${h12}:${String(m).padStart(2,'0')} ${ampm}`

    const planned = stories.filter(s => s.sprint && s.sprint !== 'backlog').length
    const total = stories.length
    const sprints = new Set(stories.filter(s => s.sprint && s.sprint !== 'backlog').map(s => s.sprint))
    const sprintList = Array.from(sprints).sort()
    const lastSprint = sprintList.length > 0 ? sprintList[sprintList.length - 1].replace('sprint', 'Sprint ') : null
    const pct = total > 0 ? Math.floor((planned / total) * 100) : 0

    // Always lead with date + time, then planning context
    const prefix = `${dateStr}, ${timeStr}`
    if (planned === 0) return `${prefix} · ${total} stories in backlog`
    if (planned === total) return `${prefix} · All ${total} stories planned`
    if (lastSprint && pct >= 80) return `${prefix} · ${lastSprint} near complete · ${planned}/${total}`
    if (lastSprint && sprintList.length === 1) return `${prefix} · ${lastSprint} · ${planned} planned`
    if (lastSprint) return `${prefix} · Up to ${lastSprint} · ${planned}/${total}`
    return `${prefix} · ${planned} of ${total} planned`
  }

  const saveSnapshot = async (name: string) => {
    if (!name.trim()) return
    setSavingSnapshot(true)
    await createVersion('manual', stories, streams, name.trim(), true)
    setSnapshotName('')
    setShowSnapshotInput(false)
    setSavingSnapshot(false)
  }

  const formatVersionDate = (iso: string) => {
    const d = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - d.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)
    if (diffMins < 2) return 'just now'
    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays === 1) return 'yesterday'
    if (diffDays < 7) return `${diffDays}d ago`
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }

  const triggerLabel = (trigger: string, v?: any) => {
    const count = v?.storyCount ?? ''
    const planned = v?.plannedCount ?? ''
    const map: Record<string,string> = {
      'manual': 'Snapshot',
      'import-story-map': count ? `Story Map · ${count} stories` : 'Story Map imported',
      'import-release-plan': planned ? `Release Plan · ${planned} planned` : 'Release Plan imported',
      'import-backlog': count ? `Backlog merged · ${count} total` : 'Backlog merged',
      'import-deps': 'Dependency Map imported',
      'import-cp': 'Critical Path imported',
      'restore': 'Restored from version',
    }
    return map[trigger] || trigger
  }

  // Filter state
  const [openFilterField, setOpenFilterField] = useState<string|null>(null)
  const [filterSearch, setFilterSearch] = useState<Record<string,string>>({})
  const filterBarRef = useRef<HTMLDivElement>(null)

  // Close filter dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (filterBarRef.current && !filterBarRef.current.contains(e.target as Node)) {
        setOpenFilterField(null)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Clean up stale filterAggregates keys when aggregates list changes
  useEffect(() => {
    const validFieldKeys = new Set(aggregates.map(a => getFilterField(a.toLowerCase())))
    setFilterAggregates(prev => {
      const next: Record<string,string[]> = {}
      for (const [k, v] of Object.entries(prev)) {
        if (validFieldKeys.has(k)) next[k] = v
      }
      return Object.keys(next).length === Object.keys(prev).length ? prev : next
    })
    // Also close any open dropdown whose field no longer exists
    setOpenFilterField(prev => {
      if (!prev) return null
      const validIds = new Set(['__persona__', ...aggregates.map(a => a)])
      return validIds.has(prev) ? prev : null
    })
  }, [aggregates])

  // Import/Export modal state
  const [showImportModal, setShowImportModal] = useState(false)
  const [showExportModal, setShowExportModal] = useState(false)
  const [rpConfirmData, setRpConfirmData] = useState<RPConfirmData | null>(null)
  const [mergeConflictData, setMergeConflictData] = useState<{file: File; conflicts: MergeConflict[]; newCount: number} | null>(null)
  const [importFeedback, setImportFeedback] = useState<ImportFeedback | null>(null)

  // Core import logic — accepts a File directly
  const processImport = async (file: File, importType: string) => {
    setImportFeedback(null)

    // ── RP File: peek metadata then show confirmation ──────────────────────
    if (importType === 'rp' || file.name.endsWith('.rp')) {
      const fd = new FormData(); fd.append('file', file); fd.append('peek', '1')
      const res = await fetch('/api/import-rp', { method: 'POST', body: fd })
      const data = await res.json()
      if (!data.ok) {
        setImportFeedback({ type: 'error', message: data.error || 'This does not appear to be a valid FlashPro project file (.rp).' })
        return
      }
      setRpConfirmData({ file, projectName: data.projectName || 'Imported Project', storyCount: data.storyCount || 0, streamCount: data.streamCount || 0, savedAt: data.savedAt || '' })
      return
    }

    // ── Additional Backlog: validate for conflicts first ───────────────────
    if (importType === 'merge') {
      const fd = new FormData()
      fd.append('file', file); fd.append('importType', 'merge'); fd.append('validate', '1')
      fd.append('existingStories', JSON.stringify(stories))
      // F8G.01 fix: send required columns so server can check compatibility
      fd.append('requiredColumns', JSON.stringify(lastImportColumns))
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) {
        setImportFeedback({ type: 'error', message: data.error })
        return
      }
      if (data.conflicts?.length > 0) {
        setMergeConflictData({ file, conflicts: data.conflicts, newCount: data.newCount || 0 })
        return
      }
      // No conflicts — proceed directly
      await executeMerge(file)
      return
    }

    // ── Dependency Map / Critical Path ────────────────────────────────────
    if (importType === 'deps-xlsx' || importType === 'cp') {
      const fd = new FormData(); fd.append('file', file); fd.append('importType', importType)
      const res = await fetch('/api/import', { method: 'POST', body: fd })
      const data = await res.json()
      if (data.ok) {
        const parts = [
          data.deps_count > 0 ? `${data.deps_count} dependency rules` : '',
          data.cp_count > 0 ? `${data.cp_count} critical path stories` : '',
        ].filter(Boolean)
        setImportFeedback({ type: 'success', message: `Loaded: ${parts.join(', ')}` })
        // Auto-save version
        const trigger = importType === 'cp' ? 'import-cp' : 'import-deps'
        await createVersion(trigger, stories, streams)
      } else {
        setImportFeedback({ type: 'error', message: data.error || 'Import failed.' })
      }
      return
    }

    // ── Story Map / Release Plan ──────────────────────────────────────────
    const fd = new FormData(); fd.append('file', file); fd.append('importType', importType || 'story')
    const res = await fetch('/api/import', { method: 'POST', body: fd })
    const data = await res.json()

    if (data.error) { setImportFeedback({ type: 'error', message: data.error }); return }
    if (data.columns?.length) setLastImportColumns(data.columns)

    if (data.stories?.length) {
      let merged: Story[]
      if (data.is_export) {
        merged = data.stories.map((s: any) => ({
          ...s, pts: s.pts ?? 0, sprint: s.sprint || 'backlog', stream: s.stream || 'backlog',
        }))
      } else {
        const existingMap: Record<string, Story> = {}
        stories.forEach((s: Story) => { existingMap[s.id] = s })
        const splitParentIds = new Set(data.stories.filter((s:any) => s.isSplitChild && s.originalStoryId).map((s:any) => s.originalStoryId))
        merged = data.stories.map((s: any) => {
          if (s.isSplitChild && s.originalStoryId && existingMap[s.originalStoryId]) {
            const parent = existingMap[s.originalStoryId]
            return { ...s, pts: s.pts ?? 0, sprint: parent.sprint, stream: parent.stream }
          }
          if (existingMap[s.id]) {
            return { ...existingMap[s.id], ...s, pts: s.pts ?? 0, sprint: existingMap[s.id].sprint, stream: existingMap[s.id].stream }
          }
          return { ...s, pts: s.pts ?? 0, sprint: 'backlog', stream: 'backlog' }
        }).filter((s:any) => !splitParentIds.has(s.id))
      }
      updateStories(merged, streams, !data.is_export)
      setImportFeedback({ type: 'success', message: `Imported ${merged.length} stories.` })

      // F5.17/U4.10 fix: clear stale filter selections whose values no longer exist in the new story set
      if (!data.is_export) {
        const newFieldValues: Record<string, Set<string>> = {}
        merged.forEach((s: any) => {
          Object.entries(s).forEach(([k, v]) => {
            if (typeof v === 'string' && v) {
              if (!newFieldValues[k]) newFieldValues[k] = new Set()
              newFieldValues[k].add(v)
            }
          })
        })
        setFilterAggregates(prev => {
          const next: Record<string, string[]> = {}
          for (const [field, selected] of Object.entries(prev)) {
            const valid = selected.filter(val => newFieldValues[field]?.has(val))
            if (valid.length > 0) next[field] = valid
          }
          return next
        })
        setFilterPersonas(prev => prev.filter(p => newFieldValues['persona']?.has(p)))
      }

      // Auto-save version after import
      const trigger = data.is_export ? 'import-release-plan' : 'import-story-map'
      await createVersion(trigger, merged, streams)
    } else {
      setImportFeedback({ type: 'warning', message: 'No stories found in file. Check it has a Story ID column.' })
    }
  }

  // Execute the actual RP restore (called after user confirms)
  const executeRPImport = async (file: File) => {
    const fd = new FormData(); fd.append('file', file)
    const res = await fetch('/api/import-rp', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.ok && data.state?.stories) {
      const restoredStreams = data.state.streams?.length ? data.state.streams : streams
      setStories(data.state.stories)
      setStreams(restoredStreams)
      if (data.projectName) setCurrentProject(data.projectName)
      // Restore dynamic CP list from .rp state
      if (data.state.criticalPath?.length) setCriticalPathIds(data.state.criticalPath)

      // Restore config — sprint capacity, sprint count, stream count, aggregates
      if (data.state.config) {
        const cfg = data.state.config
        if (cfg.sprintCapacity) setSprintCapacity(cfg.sprintCapacity)
        if (cfg.sprintCount) setSprintCount(cfg.sprintCount)
        if (cfg.sprintStartDate !== undefined) setSprintStartDate(cfg.sprintStartDate || "")
        if (cfg.sprintDurationWeeks) setSprintDurationWeeks(cfg.sprintDurationWeeks)
        if (cfg.aggregates?.length) setAggregates(cfg.aggregates)
        await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(cfg)
        })
      }

      await saveToServer(data.state.stories, restoredStreams)
      setRpConfirmData(null)
      setShowImportModal(false)
      setImportFeedback({ type: 'success', message: `Project "${data.projectName}" restored with ${data.state.stories.length} stories.` })
      // BUG-07 fix: single version entry "Restored from version"
      await createVersion('restore', data.state.stories, restoredStreams, `Restored: ${data.projectName}`)
    } else {
      setRpConfirmData(null)
      setImportFeedback({ type: 'error', message: data.error || 'Restore failed.' })
    }
  }

  // Execute merge after validation confirms no blockers
  const executeMerge = async (file: File) => {
    const fd = new FormData(); fd.append('file', file); fd.append('importType', 'merge')
    const res = await fetch('/api/import', { method: 'POST', body: fd })
    const data = await res.json()
    if (data.error) { setImportFeedback({ type: 'error', message: data.error }); return }
    if (data.columns?.length) setLastImportColumns(data.columns)
    if (data.stories?.length) {
      const existingIds = new Set(stories.map(s => s.id))
      const existingMap: Record<string, Story> = {}
      stories.forEach(s => { existingMap[s.id] = s })
      const newStories: Story[] = data.stories
        .filter((s: any) => !existingIds.has(s.id))
        .map((s: any) => {
          if (s.isSplitChild && s.originalStoryId && existingMap[s.originalStoryId]) {
            const parent = existingMap[s.originalStoryId]
            return { ...s, pts: s.pts ?? 0, sprint: parent.sprint, stream: parent.stream }
          }
          return { ...s, pts: s.pts ?? 0, sprint: 'backlog', stream: 'backlog' }
        })
      const splitParentIds = new Set(data.stories.filter((s:any) => s.isSplitChild && s.originalStoryId).map((s:any) => s.originalStoryId))
      const kept = stories.filter(s => !splitParentIds.has(s.id))
      const merged = [...kept, ...newStories]
      updateStories(merged, streams, !data.is_export)
      setMergeConflictData(null)
      setShowImportModal(false)
      setImportFeedback({ type: 'success', message: `Added ${newStories.length} new stories to your backlog.` })
      await createVersion('import-backlog', merged, streams)
    }
  }

  // Event handler wrapper for file inputs
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>, importType?: string) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    await processImport(file, importType || 'story')
  }

  const [depWarning, setDepWarning] = useState<DepWarning|null>(null)
  const [editingStream, setEditingStream] = useState<string|null>(null)
  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const saveTimeout = useRef<NodeJS.Timeout>()
  const fmtPts = (n: number) => { const r = Math.round(n * 10) / 10; return r % 1 === 0 ? String(r) : r.toFixed(1) }

  /** Converts a hex colour to a pastel variant (72% white mix). Returns bg, dark text, and border. */
  const toPastel = useCallback((hex: string): { bg: string; text: string; border: string } => {
    const h = hex.replace('#', '')
    const r = parseInt(h.slice(0,2),16), g = parseInt(h.slice(2,4),16), b = parseInt(h.slice(4,6),16)
    const mix  = (c: number, pct: number) => Math.round(c + (255 - c) * pct)
    const dark = (c: number) => Math.round(c * 0.55)
    const hex2 = (c: number) => c.toString(16).padStart(2,'0')
    return {
      bg:     `#${hex2(mix(r,.72))}${hex2(mix(g,.72))}${hex2(mix(b,.72))}`,
      text:   `#${hex2(dark(r))}${hex2(dark(g))}${hex2(dark(b))}`,
      border: `#${hex2(mix(r,.40))}${hex2(mix(g,.40))}${hex2(mix(b,.40))}`,
    }
  }, [])

  /** Returns date range label for sprint index (0-based); null when no start date configured */
  const getSprintDateLabel = useCallback((idx: number): string | null => {
    if (!sprintStartDate) return null
    const start = new Date(sprintStartDate)
    start.setDate(start.getDate() + idx * sprintDurationWeeks * 7)
    const end = new Date(start)
    end.setDate(end.getDate() + sprintDurationWeeks * 7 - 1)
    const fmt = (d: Date) => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
    return `${fmt(start)} – ${fmt(end)}`
  }, [sprintStartDate, sprintDurationWeeks])

  const ganttRef = useRef<HTMLDivElement>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef<string | null>(null)

  // Non-passive wheel listener for Mac trackpad pinch-to-zoom
  useEffect(() => {
    const el = boardRef.current
    if (!el) return
    const handler = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault()
        setZoom(z => Math.min(2.5, Math.max(0.3, z * (1 - e.deltaY * 0.003))))
      }
    }
    el.addEventListener('wheel', handler, { passive: false })
    return () => el.removeEventListener('wheel', handler)
  }, [])

  // Restore view from localStorage after mount (avoids hydration mismatch)
  useEffect(() => {
    const saved = localStorage.getItem('flashpro_view')
    if (saved) setView(saved as ViewMode)
  }, [])

  // Presence — poll active users every 10s
  useEffect(() => {
    const fetchPresence = () => {
      fetch('/api/presence').then(r=>r.json()).then(d=>setActiveUsers(d.users||[])).catch(()=>{})
    }
    fetchPresence()
    const poll = setInterval(fetchPresence, 10000)
    return () => clearInterval(poll)
  }, [])

  useEffect(() => {
    fetch('/api/state').then(r=>r.json()).then(state => {
      if (state?.stories?.length) setStories(state.stories.filter((s:any) => !['delete','deleted'].includes(String(s.status||'').toLowerCase().trim())))
      if (state?.streams?.length) setStreams(state.streams)
      if (state?.config?.aggregates?.length) setAggregates(state.config.aggregates)
      if (state?.config?.sprintCount) setSprintCount(state.config.sprintCount)
      if (state?.config?.sprintStartDate !== undefined) setSprintStartDate(state.config.sprintStartDate || "")
      if (state?.config?.sprintDurationWeeks) setSprintDurationWeeks(state.config.sprintDurationWeeks)
      if (state?.config?.sprintCapacity) setSprintCapacity(state.config.sprintCapacity)
      // Load dynamic CP list — drives board badges, status strip "at risk" count, and Gantt colouring
      if (state?.criticalPath?.length) setCriticalPathIds(state.criticalPath)
      if (state?.lastImportColumns?.length) {
        setLastImportColumns(state.lastImportColumns)
      } else if (state?.stories?.length) {
        // Derive columns from story keys if lastImportColumns was never set
        const keyToLabel: Record<string,string> = {
          persona: 'User Persona', goal: 'Goal', action: 'Action',
          capability: 'Platform Capability', integration: 'System Integration',
          workflow: 'Workflow',
        }
        const derived = Object.entries(keyToLabel)
          .filter(([key]) => state.stories.some((s: any) => s[key]))
          .map(([, label]) => label)
        if (derived.length) setLastImportColumns(derived)
      }
      if (state?.projectName) setCurrentProject(state.projectName)
    })
  }, [])

  // QA-C-07: SSE with auto-reconnect + QA-C-03: skip broadcasts during preview
  useEffect(() => {
    let es: EventSource
    let retryDelay = 1000
    let retryTimer: ReturnType<typeof setTimeout>

    const connect = () => {
      es = new EventSource('/api/events')
      es.onmessage = (e) => {
        try {
          const state = JSON.parse(e.data)
          // QA-C-03 fix: skip SSE updates while user is previewing a version
          // (previewingVersion is read from the ref to avoid stale closure)
          if (previewingVersionRef.current) return
          if (state?.stories?.length) setStories(state.stories.filter((s:any) => !['delete','deleted'].includes(String(s.status||'').toLowerCase().trim())))
          if (state?.streams?.length) setStreams(state.streams)
          if (state?.config?.aggregates?.length) setAggregates(state.config.aggregates)
          if (state?.config?.sprintCount) setSprintCount(state.config.sprintCount)
      if (state?.config?.sprintStartDate !== undefined) setSprintStartDate(state.config.sprintStartDate || "")
      if (state?.config?.sprintDurationWeeks) setSprintDurationWeeks(state.config.sprintDurationWeeks)
          if (state?.config?.sprintCapacity) setSprintCapacity(state.config.sprintCapacity)
          if (state?.projectName) setCurrentProject(state.projectName)
          if (state?.criticalPath?.length) setCriticalPathIds(state.criticalPath)
          // QA-C-06 fix: apply filter cleanup on ALL clients when broadcast includes valid field values
          if (state?.filterValidValues && state.stories?.length) {
            const validValues: Record<string, Set<string>> = {}
            state.stories.forEach((s: any) => {
              Object.entries(s).forEach(([k, v]) => {
                if (typeof v === 'string' && v) {
                  if (!validValues[k]) validValues[k] = new Set()
                  validValues[k].add(v as string)
                }
              })
            })
            setFilterAggregates((prev: Record<string,string[]>) => {
              const next: Record<string,string[]> = {}
              for (const [field, selected] of Object.entries(prev)) {
                const valid = selected.filter((val: string) => validValues[field]?.has(val))
                if (valid.length > 0) next[field] = valid
              }
              return next
            })
            setFilterPersonas((prev: string[]) => prev.filter((p: string) => validValues['persona']?.has(p)))
          }
          retryDelay = 1000 // reset backoff on successful message
        } catch {}
      }
      es.onerror = () => {
        es.close()
        // QA-C-07: exponential backoff reconnection (max 30s)
        retryDelay = Math.min(retryDelay * 2, 30000)
        retryTimer = setTimeout(connect, retryDelay)
      }
    }
    connect()
    return () => { es?.close(); clearTimeout(retryTimer) }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const saveToServer = useCallback((s: Story[], st: Stream[], filterCleanup?: boolean) => {
    clearTimeout(saveTimeout.current)
    saveTimeout.current = setTimeout(() => {
      // QA-C-06: include filterValidValues flag to trigger filter cleanup on all clients
      const body: any = { stories: s, streams: st, projectName: currentProject }
      if (filterCleanup) body.filterValidValues = true
      fetch('/api/state', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify(body) })
    }, 500)
  }, [currentProject])

  const updateStories = (updated: Story[], updatedStreams?: Stream[], filterCleanup?: boolean) => {
    setStories(updated)
    const st = updatedStreams || streams
    if (updatedStreams) setStreams(updatedStreams)
    saveToServer(updated, st, filterCleanup)
  }

  const onDragStart = (e: React.DragEvent, id: string) => {
    setDragging(id)
    draggingRef.current = id
    e.dataTransfer.effectAllowed = 'move'
    try { e.dataTransfer.setData('text/plain', id) } catch(_) {}
    try { e.dataTransfer.setData('Text', id) } catch(_) {}
  }

  // Move a group of story IDs to a sprint+stream — place at BOTTOM of target cell
  const moveIds = (ids: string[], sprintKey: string, streamKey: string) => {
    // Compute max order in the target cell (excluding cards being moved)
    const targetOrders = stories.filter(s => s.sprint === sprintKey && s.stream === streamKey && !ids.includes(s.id))
    const maxOrder = targetOrders.reduce((m, s) => Math.max(m, s.order ?? 0), 0)
    const updated = stories.map((s, i) => ids.includes(s.id) ? { ...s, sprint: sprintKey, stream: streamKey, order: maxOrder + 1 + ids.indexOf(s.id) } : s)
    updateStories(updated)
  }

  // Reorder: move draggedId before targetId within the same cell
  const reorderCard = (draggedId: string, targetId: string) => {
    if (draggedId === targetId) return
    const cellStories = stories
      .filter(s => {
        const dragged = stories.find(st => st.id === draggedId)
        return dragged && s.sprint === dragged.sprint && s.stream === dragged.stream
      })
      .sort((a,b) => (a.order??999) - (b.order??999))

    const withoutDragged = cellStories.filter(s => s.id !== draggedId)
    const targetIdx = withoutDragged.findIndex(s => s.id === targetId)
    const insertAt = targetIdx === -1 ? withoutDragged.length : targetIdx
    withoutDragged.splice(insertAt, 0, cellStories.find(s => s.id === draggedId)!)

    // Assign new order values
    const orderMap: Record<string,number> = {}
    withoutDragged.forEach((s, i) => { orderMap[s.id] = i })

    const updated = stories.map(s => orderMap[s.id] !== undefined ? { ...s, order: orderMap[s.id] } : s)
    updateStories(updated)
  }

  // check deps at action level
  const checkActionDeps = (actionIds: string[], targetSprint: string): string[] => {
    const brokenBlockers: string[] = []
    const sprintOrder: Record<string,number> = { backlog:999, sprint1:1, sprint2:2, sprint3:3, sprint4:4, sprint5:5, sprint6:6, sprint7:7, sprint8:8 }
    const targetOrder = sprintOrder[targetSprint] || 999
    const storyMap = Object.fromEntries(stories.map(s => [s.id, s.sprint]))
    for (const sid of actionIds) {
      const deps = STORY_DEPS[sid] || []
      for (const depId of deps) {
        const depSprint = storyMap[depId]
        if (!depSprint) continue
        const depOrder = sprintOrder[depSprint] || 999
        if (depOrder > targetOrder) {
          if (!brokenBlockers.includes(`${depId} (needed by ${sid})`)) {
            brokenBlockers.push(`${depId} (needed by ${sid})`)
          }
        }
      }
    }
    return brokenBlockers
  }

  const onDrop = (e: React.DragEvent, sprintKey: string, streamKey: string) => {
    e.preventDefault()
    e.stopPropagation()
    setDragOver(null)
    const id = (e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('Text') || draggingRef.current || dragging)
    if (!id) return
    setDragging(null)

    // Action view — check if dropping onto cell that has another part of same action
    if (view === 'action' && id.includes('__')) {
      const [action, persona] = id.split('__')
      const allActionIds = stories.filter(s => s.action === action && s.persona === persona).map(s => s.id)

      // check action-level deps
      const blockers = checkActionDeps(allActionIds, sprintKey)
      if (blockers.length > 0) {
        setDepWarning({ broken: blockers, warnings: [], storyId: id, targetSprint: sprintKey, targetStream: streamKey, isAction: true, actionName: action })
      }

      // Move all stories of this action to target
      if (allActionIds.length > 0) moveIds(allActionIds, sprintKey, streamKey)
      return
    }

    // Goal view: move ALL stories in that goal — Feature 2: check goal-level deps
    if ((view === 'goal' || aggregates.some(a => a.toLowerCase() === 'goal'))) {
      if (view === 'goal' || (!id.includes('__') && stories.some(s => s.goal === id))) {
        const goalStories = stories.filter(s => s.goal === id)
        if (goalStories.length > 0) {
          const allGoalIds = goalStories.map(s => s.id)
          const blockers = checkActionDeps(allGoalIds, sprintKey)
          if (blockers.length > 0) {
            setDepWarning({ broken: blockers, warnings: [], storyId: id, targetSprint: sprintKey, targetStream: streamKey, isGoal: true, goalName: id })
          }
          moveIds(allGoalIds, sprintKey, streamKey)
          return
        }
      }
    }

    // Aggregate view (non-action, non-goal): handle as goal if key matches a goal
    if (view !== 'story' && view !== 'deps' && view !== 'gantt' && !id.includes('__')) {
      const goalMatch = stories.filter(s => s.goal === id)
      if (goalMatch.length > 0) {
        const blockers = checkActionDeps(goalMatch.map(s => s.id), sprintKey)
        if (blockers.length > 0) {
          setDepWarning({ broken: blockers, warnings: [], storyId: id, targetSprint: sprintKey, targetStream: streamKey, isGoal: true, goalName: id })
        }
        moveIds(goalMatch.map(s => s.id), sprintKey, streamKey)
        return
      }
    }

    // Story view: move immediately, show dependency warning as non-blocking toast
    const originalStory = stories.find(s => s.id === id)
    const originalSprint = originalStory?.sprint || 'backlog'
    const originalStream = originalStory?.stream || 'backlog'
    const updated = stories.map(s => s.id === id ? { ...s, sprint: sprintKey, stream: streamKey } : s)
    updateStories(updated)
    // Show warning after move (non-blocking) with original location for undo
    const { broken } = checkDependencies(id, sprintKey, stories)
    if (broken.length > 0) {
      setDepWarning({ broken, warnings: [], storyId: id, targetSprint: sprintKey, targetStream: streamKey, originalSprint, originalStream })
    }
  }

  // Stream editing
  const startEditStream = (stream: Stream) => {
    setEditingStream(stream.key)
    setEditName(stream.name)
    setEditDesc(stream.description)
  }
  const saveStream = () => {
    if (!editingStream) return
    const updated = streams.map(s => s.key === editingStream ? { ...s, name: editName, description: editDesc } : s)
    setStreams(updated)
    saveToServer(stories, updated)
    setEditingStream(null)
  }



  // ── Shared download helper ───────────────────────────────────────────────
  const downloadBlob = (blob: Blob, filename: string) => {
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = filename
    a.click()
  }
  const filePrefix = currentProject ? `${currentProject} - ` : ''

  // ── Export functions (all use shared pattern) ────────────────────────────
  const exportXlsx = async () => {
    const res = await fetch('/api/export', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ stories, streams, projectName: currentProject }) })
    if (res.ok) downloadBlob(await res.blob(), `${filePrefix}Release Plan.xlsx`)
  }

  const exportRP = async () => {
    const state = await fetch('/api/state').then(r => r.json())
    const res = await fetch('/api/export-rp', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ stories, streams, customDeps: state.customDeps || {},
        criticalPath: state.criticalPath || [], config: state.config || {},
        projectName: currentProject || 'Release Plan', savedAt: new Date().toISOString() }) })
    if (!res.ok) { alert('Export failed'); return }
    downloadBlob(await res.blob(), `${filePrefix}Project File.rp`)
  }

  const exportStoryMap = async () => {
    const res = await fetch('/api/export', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ stories, exportType: 'story-map', projectName: currentProject }) })
    if (res.ok) downloadBlob(await res.blob(), `${filePrefix}Story Map.xlsx`)
  }

  const exportDepMap = async () => {
    const state = await fetch('/api/state').then(r => r.json())
    const res = await fetch('/api/export', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ exportType: 'dep-map', customDeps: state.customDeps || {}, criticalPath: [], projectName: currentProject }) })
    if (res.ok) downloadBlob(await res.blob(), `${filePrefix}Dependency Map.xlsx`)
  }

  const exportCriticalPath = async () => {
    const state = await fetch('/api/state').then(r => r.json())
    const res = await fetch('/api/export', { method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify({ exportType: 'dep-map', customDeps: {}, criticalPath: state.criticalPath || [], projectName: currentProject }) })
    if (res.ok) downloadBlob(await res.blob(), `${filePrefix}Critical Path.xlsx`)
  }

  // Filtering — memoized so O(n) filter doesn't re-run on every render
  const filtered = useMemo(() => stories.filter(s => {
    if (search && ![s.id,s.headline,s.action,s.goal].some(v=>v.toLowerCase().includes(search.toLowerCase()))) return false
    if (filterPersonas.length > 0 && !filterPersonas.includes(s.persona)) return false
    // Multi-select aggregate filters
    for (const [aggKey, values] of Object.entries(filterAggregates)) {
      if (values.length === 0) continue
      const field = aggKey === 'goal' ? 'goal' : aggKey === 'action' ? 'action' : aggKey
      const storyVal = (s as any)[field] || ''
      if (!values.includes(storyVal)) return false
    }
    return true
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [stories, search, filterPersonas, filterAggregates])

  const goals = useMemo(() => Array.from(new Set(stories.map(s => s.goal))).sort(), [stories])

  // Helper to get part number for split action/goal cards
  const getActionParts = (action: string, persona: string): Map<string, number[]> => {
    // Returns a map of "sprint__stream" -> story indices for this action
    const allStories = stories.filter(s => s.action === action && s.persona === persona)
    const byCell = new Map<string, typeof allStories>()
    for (const s of allStories) {
      const cellKey = `${s.sprint}__${s.stream}`
      if (!byCell.has(cellKey)) byCell.set(cellKey, [])
      byCell.get(cellKey)!.push(s)
    }
    return new Map(Array.from(byCell.entries()).map(([k, v]) => [k, v.map(s => 0)]))
  }

  // Build action cards with part numbering
  const buildActionCards = (sprintStories: Story[], sprintKey: string, streamKey: string) => {
    const groups: Record<string, any> = {}
    sprintStories.forEach(s => {
      const k = `${s.action}__${s.persona}`
      if (!groups[k]) groups[k] = { key:k, label:s.action, sub:s.goal, action:s.action, goal:s.goal, persona:s.persona, size:s.size, count:0, ids:[] }
      groups[k].count++; groups[k].ids.push(s.id)
    })

    // add part numbering if the action spans multiple cells
    return Object.values(groups).map((card: any) => {
      const allActionStories = stories.filter(s => s.action === card.action && s.persona === card.persona)
      const uniqueCells = new Set(allActionStories.map(s => `${s.sprint}__${s.stream}`))
      if (uniqueCells.size > 1) {
        const sortedCells = Array.from(uniqueCells).sort()
        const thisCellKey = `${sprintKey}__${streamKey}`
        const partNum = sortedCells.indexOf(thisCellKey) + 1
        const totalParts = uniqueCells.size
        return { ...card, partLabel: `${card.label} (${partNum} of ${totalParts})`, totalParts }
      }
      return { ...card, partLabel: card.label, totalParts: 1 }
    })
  }

  // Build goal cards with part numbering
  const buildGoalCards = (sprintStories: Story[], sprintKey: string, streamKey: string) => {
    const groups: Record<string, any> = {}
    sprintStories.forEach(s => {
      if (!groups[s.goal]) groups[s.goal] = { key:s.goal, label:s.goal, sub:s.capability, action:'', goal:s.goal, persona:s.persona, size:'', count:0, ids:[] }
      groups[s.goal].count++; groups[s.goal].ids.push(s.id)
    })

    return Object.values(groups).map((card: any) => {
      const allGoalStories = stories.filter(s => s.goal === card.goal)
      const uniqueCells = new Set(allGoalStories.map(s => `${s.sprint}__${s.stream}`))
      if (uniqueCells.size > 1) {
        const sortedCells = Array.from(uniqueCells).sort()
        const thisCellKey = `${sprintKey}__${streamKey}`
        const partNum = sortedCells.indexOf(thisCellKey) + 1
        const totalParts = uniqueCells.size
        return { ...card, partLabel: `${card.label} (${partNum} of ${totalParts})`, totalParts }
      }
      return { ...card, partLabel: card.label, totalParts: 1 }
    })
  }

  // Get cards for a cell (sprint x stream)
  // Map view name to story field key
  // Maps aggregate display names → story field key for BOARD VIEW grouping
  const viewFieldMap: Record<string,string> = {
    'action': 'action', 'goal': 'goal',
    'platform capability': 'capability', 'capability': 'capability',
    'persona': 'persona', 'workflow': 'workflow',
  }
  const getFieldForView = (v: string) => {
    const lower = v.toLowerCase()
    return viewFieldMap[lower] || lower.replace(/\s+/g, '')
  }

  // Maps aggregate display names → story field key for FILTERING
  // Different from viewFieldMap: each aggregate filters its own real field
  const getFilterField = (aggName: string): string => {
    const lower = aggName.toLowerCase()
    const filterFieldMap: Record<string,string> = {
      'action': 'action', 'goal': 'goal',
      'workflow': 'workflow',
      'platform capability': 'capability', 'capability': 'capability',
      'persona': 'persona',
    }
    return filterFieldMap[lower] || lower.replace(/\s+/g, '')
  }

  const buildGenericCards = (storyList: Story[], field: string) => {
    const groups: Record<string,any> = {}
    storyList.forEach(s => {
      const val = (s as any)[field] || (s as any).goal || 'Other'
      // sub shows the "parent" field: if viewing workflow → show capability; if viewing capability → show goal
      const subField = field === 'action' ? 'goal' : field === 'goal' ? 'capability' : field === 'capability' ? 'goal' : 'capability'
      const subVal = (s as any)[subField] || s.capability || s.goal || ''
      if (!groups[val]) groups[val] = { key: val, label: val, sub: subVal, persona: s.persona, goal: s.goal, action: s.action, size: '', count: 0, ids: [], pts: 0 }
      groups[val].count++; groups[val].ids.push(s.id); groups[val].pts += s.pts||0
    })
    return Object.values(groups).sort((a:any,b:any) => b.pts - a.pts)
  }

  const getCellCards = (sprintKey: string, streamKey: string) => {
    const sprintStories = filtered.filter(s => s.sprint === sprintKey && s.stream === streamKey).sort((a,b) => (a.order??999) - (b.order??999))
    if (view === 'story') return sprintStories.map(s => ({
      key: s.id, label: s.id, partLabel: s.id, sub: s.headline, action: s.action, pts: s.pts,
      goal: s.goal, persona: s.persona, size: s.size, count: 1, ids: [s.id], totalParts: 1
    }))
    if (view === 'action') return buildActionCards(sprintStories, sprintKey, streamKey)
    if (view === 'goal') return buildGoalCards(sprintStories, sprintKey, streamKey)
    // Any other aggregate — group by mapped field
    return buildGenericCards(sprintStories, getFieldForView(view))
  }

  const getCellPts = (sprintKey: string, streamKey: string) =>
    filtered.filter(s => s.sprint === sprintKey && s.stream === streamKey).reduce((acc,s) => acc + (s.pts||0), 0)

  // Unassigned = sprint:backlog AND stream:backlog (memoized)
  const unassigned = useMemo(() =>
    filtered.filter(s => (!s.sprint || s.sprint === 'backlog') && (!s.stream || s.stream === 'backlog'))
  , [filtered])

  // Backlog cards grouped by view mode
  const getBacklogCards = () => {
    if (view === 'story') return unassigned.map(s => ({
      key: s.id, label: s.id, sub: s.headline, persona: s.persona,
      goal: s.goal, action: s.action, size: s.size, count: 1,
      pts: s.pts || 0
    }))
    if (view === 'action') {
      const groups: Record<string,any> = {}
      unassigned.forEach(s => {
        const k = `${s.action}__${s.persona}`
        if (!groups[k]) groups[k] = { key:k, label:s.action, sub:s.goal, persona:s.persona, goal:s.goal, action:s.action, size:s.size, count:0, ids:[], pts:0 }
        groups[k].count++; groups[k].ids.push(s.id); groups[k].pts += s.pts||0
      })
      return Object.values(groups).sort((a:any,b:any) => b.pts - a.pts)
    }
    // goal view or any other aggregate
    if (view === 'goal') {
      const groups: Record<string,any> = {}
      unassigned.forEach(s => {
        if (!groups[s.goal]) groups[s.goal] = { key:s.goal, label:s.goal, sub:s.capability||s.action, persona:s.persona, goal:s.goal, action:'', size:'', count:0, ids:[], pts:0 }
        groups[s.goal].count++; groups[s.goal].ids.push(s.id); groups[s.goal].pts += s.pts||0
      })
      return Object.values(groups).sort((a:any,b:any) => b.pts - a.pts)
    }
    // Generic aggregate
    return buildGenericCards(unassigned, getFieldForView(view))
  }

  // Dynamic CP set — built from server-loaded criticalPathIds.
  // Falls back to CRITICAL_PATH_STATIC if none loaded yet.
  const CRITICAL_PATH = useMemo(() =>
    criticalPathIds.length > 0 ? new Set(criticalPathIds) : CRITICAL_PATH_STATIC
  , [criticalPathIds])

  const localIP = typeof window !== 'undefined' ? window.location.host : 'localhost:3003'
  const cpLate = useMemo(() =>
    stories.filter(s => CRITICAL_PATH.has(s.id) && (s.sprint === 'backlog' || (parseInt(s.sprint.replace('sprint',''))||0) > 4))
  , [stories, CRITICAL_PATH])

  // Precompute story sprint map for dep checking — memoized
  const storySprintMap = useMemo(() => {
    const m: Record<string,string> = {}
    stories.forEach(s => { m[s.id] = s.sprint })
    return m
  }, [stories])

  const getBrokenDeps = useCallback((storyId: string): string[] => {
    const deps = STORY_DEPS_VIEW[storyId] || []
    const myOrder = SPRINT_NUM[storySprintMap[storyId]] ?? 999
    return deps.filter(depId => (SPRINT_NUM[storySprintMap[depId]] ?? 999) > myOrder)
  }, [storySprintMap])
  const brokenDepIds = useMemo(() =>
    new Set(stories.filter(s => getBrokenDeps(s.id).length > 0).map(s => s.id))
  , [stories, getBrokenDeps])


  // Active sprints based on config
  const SPRINTS = ALL_SPRINTS.slice(0, sprintCount)

  // Sprint column totals
  const getSprintTotals = (sprintKey: string) => {
    const ss = filtered.filter(s => s.sprint === sprintKey && s.stream !== 'backlog')
    return { count: ss.length, pts: ss.reduce((a,s)=>a+(s.pts||0),0) }
  }

  // Get configured capacity for a stream+sprint
  const getCapacity = (streamKey: string, sprintKey: string): number => {
    const k1 = `${streamKey}_${sprintKey}`
    const k2 = sprintKey
    return sprintCapacity[k1] ?? sprintCapacity[k2] ?? 20
  }

  // Actual pts in a cell
  const getCellActualPts = (sprintKey: string, streamKey: string) =>
    stories.filter(s => s.sprint === sprintKey && s.stream === streamKey).reduce((a,s) => a + (s.pts||0), 0)

  // Is cell over capacity?
  const isCellOver = (sprintKey: string, streamKey: string) => {
    const actual = getCellActualPts(sprintKey, streamKey)
    const cap = getCapacity(streamKey, sprintKey)
    return actual > cap && cap > 0
  }

  // Sprint capacity per stream - compute actual pts
  const getStreamSprintActualPts = (): Record<string, Record<string, number>> => {
    const result: Record<string, Record<string, number>> = {}
    for (const stream of streams) {
      result[stream.key] = {}
      for (const sp of SPRINTS) {
        result[stream.key][sp.key] = stories.filter(s => s.sprint === sp.key && s.stream === stream.key).reduce((a,s) => a + (s.pts||0), 0)
      }
    }
    return result
  }

  // View tabs — Feature 6: use config.aggregates to build tabs
  const viewTabs = ['story', ...aggregates.map(a => a.toLowerCase()), 'gantt', 'deps']

  const getViewLabel = (v: string) => {
    if (v === 'deps') return 'Dependencies'
    if (v === 'gantt') return 'Gantt'
    return v.charAt(0).toUpperCase() + v.slice(1)
  }

  // Normalize view for display
  const activeView = view

  return (
    <div style={{ display:'flex', flexDirection:'column', height:'100vh', overflow:'hidden', background: T.bg, color: T.text, fontFamily: T.fontFamily }}>

      {/* Config Panel */}
      {showConfig && (
        <ConfigPanel
          onClose={() => setShowConfig(false)}
          streams={streams}
          onStreamsChange={(newStreams) => { setStreams(newStreams); saveToServer(stories, newStreams) }}
          stories={stories}
          lastImportColumns={lastImportColumns}
          onAggregatesChange={(aggs) => setAggregates(aggs)}
          sprintActualPts={getStreamSprintActualPts()}
        />
      )}

      {/* ── Legend Modal ── */}
      {showLegend && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center' }} onClick={()=>setShowLegend(false)}>
          <div style={{ background: T.surface, borderRadius: T.radius.xl, padding: T.sp.xxl, width:480, boxShadow: T.shadow.lg, border:`1px solid ${T.border}` }} onClick={e=>e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom: T.sp.xl }}>
              <h2 style={{ margin:0, fontSize: T.fs.lg, fontWeight:600, color: T.text }}>Legend</h2>
              <button onClick={()=>setShowLegend(false)} style={{ background:'none', border:'none', fontSize:18, cursor:'pointer', color: T.textMuted }}>&times;</button>
            </div>

            <div style={{ display:'flex', flexDirection:'column', gap: T.sp.xl }}>

              {/* Card types */}
              <div>
                <div style={{ fontSize: T.fs.sm, fontWeight:600, color: T.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom: T.sp.sm }}>Card Indicators</div>
                <div style={{ display:'flex', flexDirection:'column', gap: T.sp.sm }}>
                  {[
                    { sample: <div style={{ display:'flex', gap:6, alignItems:'center' }}><div style={{ width:40, height:24, borderRadius: T.radius.sm, borderLeft:`3px solid ${T.danger}`, border:`1px solid ${T.border}`, background: T.surface, display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}><span style={{ fontSize:9, fontFamily: T.fontMono, fontWeight:600 }}>S01</span><span style={{ fontSize:7, background: T.danger, color: T.surface, padding:'1px 3px', borderRadius:2, fontWeight:600 }}>CP</span></div></div>, label:'Critical Path story — 3px red left border' },
                    { sample: <div style={{ display:'flex', gap:6, alignItems:'center' }}><div style={{ width:40, height:24, borderRadius: T.radius.sm, borderLeft:`3px solid ${T.warning}`, border:`1px solid ${T.border}`, background: T.surface, display:'flex', alignItems:'center', justifyContent:'center', gap:3 }}><span style={{ fontSize:9, fontFamily: T.fontMono, fontWeight:600 }}>S05</span><span style={{ fontSize:7, background: T.warning, color: T.surface, padding:'1px 3px', borderRadius:2, fontWeight:600 }}>dep</span></div></div>, label:'Broken dependency — orange left border' },
                    { sample: <div style={{ display:'flex', gap:6, alignItems:'center' }}><div style={{ width:44, height:26, borderRadius: T.radius.sm, borderLeft:`3px solid ${T.accent}`, border:`1px solid ${T.border}`, background: T.surface, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:9, fontWeight:600 }}>Goal</span></div></div>, label:'Split action/goal — yellow left border' },
                    { sample: <div style={{ display:'flex', gap:6, alignItems:'center' }}><div style={{ width:40, height:24, borderRadius: T.radius.sm, border:`1px solid ${T.border}`, background: T.surface, display:'flex', alignItems:'center', justifyContent:'center' }}><span style={{ fontSize:9, fontFamily: T.fontMono, fontWeight:600 }}>S13</span></div></div>, label:'Normal story — no issues' },
                  ].map((row, i) => (
                    <div key={i} style={{ display:'flex', gap: T.sp.md, alignItems:'center' }}>
                      <div style={{ width:60, flexShrink:0, display:'flex', justifyContent:'center' }}>{row.sample}</div>
                      <span style={{ fontSize: T.fs.sm, color: T.textSecondary }}>{row.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Persona badges */}
              <div>
                <div style={{ fontSize: T.fs.sm, fontWeight:600, color: T.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom: T.sp.sm }}>Persona</div>
                <div style={{ display:'flex', gap: T.sp.lg }}>
                  <div style={{ display:'flex', alignItems:'center', gap: T.sp.sm }}><div style={{ width:8, height:8, borderRadius: T.radius.full, background: T.seller }} /><span style={{ fontSize: T.fs.sm, color: T.textSecondary }}>Seller</span></div>
                  <div style={{ display:'flex', alignItems:'center', gap: T.sp.sm }}><div style={{ width:8, height:8, borderRadius: T.radius.full, background: T.operator }} /><span style={{ fontSize: T.fs.sm, color: T.textSecondary }}>Operator</span></div>
                </div>
              </div>

            </div>

            <button onClick={()=>setShowLegend(false)} style={{ marginTop: T.sp.xl, width:'100%', padding:'9px', background: T.primary, color: T.surface, border:'none', borderRadius: T.radius.lg, fontSize: T.fs.base, fontWeight:600, cursor:'pointer' }}>Got it</button>
          </div>
        </div>
      )}

      {/* ── Dependency Warning Modal ── */}
      {depWarning && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.6)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background: T.surface, borderRadius: T.radius.xl, padding: T.sp.xl, maxWidth:500, width:'90%', border:`2px solid ${T.danger}`, boxShadow: T.shadow.lg }}>
            {depWarning.isAction && (
              <h3 style={{ margin:`0 0 ${T.sp.md}px`, color: T.danger, fontSize: T.fs.lg }}>Dependency conflict: {depWarning.actionName}</h3>
            )}
            {depWarning.isGoal && (
              <h3 style={{ margin:`0 0 ${T.sp.md}px`, color: T.danger, fontSize: T.fs.lg }}>Dependency conflict: {depWarning.goalName}</h3>
            )}
            {!depWarning.isAction && !depWarning.isGoal && (
              <h3 style={{ margin:`0 0 ${T.sp.md}px`, color: T.danger, fontSize: T.fs.lg }}>Dependency conflict: {depWarning.storyId} moved to {depWarning.targetSprint.replace('sprint','Sprint ')}</h3>
            )}
            {depWarning.broken.length > 0 && <>
              <div style={{ fontSize: T.fs.sm, color: T.danger, fontWeight:600, marginBottom: T.sp.xs }}>Hard blockers:</div>
              {depWarning.broken.map((b,i)=><div key={i} style={{ fontSize: T.fs.sm, color: T.danger, padding:'2px 0' }}>&bull; {b}</div>)}
            </>}
            {depWarning.warnings.length > 0 && <>
              <div style={{ fontSize: T.fs.sm, color: T.accent, fontWeight:600, margin:`${T.sp.sm}px 0 ${T.sp.xs}px` }}>Downstream issues:</div>
              {depWarning.warnings.map((w,i)=><div key={i} style={{ fontSize: T.fs.sm, color: T.accent, padding:'2px 0' }}>&bull; {w}</div>)}
            </>}
            <div style={{ display:'flex', gap: T.sp.sm, marginTop: T.sp.lg }}>
              <button onClick={()=>setDepWarning(null)} style={{ flex:1, padding: T.sp.sm, background: T.successBg, color: T.success, border:`1px solid ${T.success}`, borderRadius: T.radius.md, cursor:'pointer', fontWeight:600, fontFamily: T.fontFamily, fontSize: T.fs.sm }}>Continue with move</button>
              <button onClick={()=>{
                const orig = depWarning!.originalSprint || 'backlog'
                const origStream = depWarning!.originalStream || 'backlog'
                const sid = depWarning!.storyId
                const reverted = stories.map(s => s.id === sid ? { ...s, sprint: orig, stream: origStream } : s)
                updateStories(reverted)
                setDepWarning(null)
              }} style={{ flex:1, padding: T.sp.sm, background: T.dangerBg, color: T.danger, border:`1px solid ${T.danger}`, borderRadius: T.radius.md, cursor:'pointer', fontFamily: T.fontFamily, fontSize: T.fs.sm }}>
                Undo &mdash; Return to {depWarning?.originalSprint ? depWarning.originalSprint.replace('sprint','Sprint ') : 'backlog'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Stream Edit Modal ── */}
      {editingStream && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.5)', zIndex:1000, display:'flex', alignItems:'center', justifyContent:'center' }}>
          <div style={{ background: T.surface, borderRadius: T.radius.xl, padding: T.sp.xl, width:460, border:`1px solid ${T.border}`, boxShadow: T.shadow.lg }}>
            <h3 style={{ margin:`0 0 ${T.sp.lg}px`, color: T.text, fontSize: T.fs.lg }}>Edit Stream</h3>
            <div style={{ marginBottom: T.sp.md }}>
              <label style={{ fontSize: T.fs.sm, color: T.textSecondary, display:'block', marginBottom: T.sp.xs }}>Stream Name</label>
              <input value={editName} onChange={e=>setEditName(e.target.value)}
                style={{ width:'100%', padding:'8px 10px', background: T.bg, border:`1px solid ${T.border}`, borderRadius: T.radius.md, color: T.text, fontSize: T.fs.base, boxSizing:'border-box' as 'border-box', fontFamily: T.fontFamily }} />
            </div>
            <div style={{ marginBottom: T.sp.lg }}>
              <label style={{ fontSize: T.fs.sm, color: T.textSecondary, display:'block', marginBottom: T.sp.xs }}>Description / Integrations</label>
              <textarea value={editDesc} onChange={e=>setEditDesc(e.target.value)} rows={3}
                style={{ width:'100%', padding:'8px 10px', background: T.bg, border:`1px solid ${T.border}`, borderRadius: T.radius.md, color: T.text, fontSize: T.fs.sm, resize:'vertical', boxSizing:'border-box' as 'border-box', fontFamily: T.fontFamily }} />
            </div>
            <div style={{ display:'flex', gap: T.sp.sm }}>
              <button onClick={saveStream} style={{ flex:1, padding: T.sp.sm, background: T.primary, color: T.surface, border:'none', borderRadius: T.radius.md, cursor:'pointer', fontWeight:600, fontFamily: T.fontFamily }}>Save</button>
              <button onClick={()=>setEditingStream(null)} style={{ flex:1, padding: T.sp.sm, background: T.bg, color: T.text, border:`1px solid ${T.border}`, borderRadius: T.radius.md, cursor:'pointer', fontFamily: T.fontFamily }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Version Preview Banner ── */}
      {previewingVersion && (
        <div style={{ position:'fixed', top:0, left:0, right:0, zIndex:3000, background:'#78350F', borderBottom:'2px solid #F59E0B', display:'flex', alignItems:'center', justifyContent:'space-between', padding:'8px 20px', fontFamily: T.fontFamily }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FCD34D" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            <span style={{ fontSize: T.fs.sm, color:'#FEF3C7', fontWeight:600 }}>
              Viewing past version:
            </span>
            <span style={{ fontSize: T.fs.sm, color:'#FCD34D', fontWeight:700 }}>
              {previewingVersion.name || triggerLabel(previewingVersion.trigger)}
            </span>
            <span style={{ fontSize: T.fs.xs, color:'#D97706' }}>
              · {formatVersionDate(previewingVersion.savedAt)}
            </span>
            <span style={{ fontSize: T.fs.xs, color:'#92400E', background:'#FEF3C7', padding:'1px 8px', borderRadius:99, fontWeight:600 }}>
              Read-only preview
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap: T.sp.sm }}>
            <button onClick={restoreVersion}
              style={{ padding:'5px 14px', background:'#F59E0B', color:'#78350F', border:'none', borderRadius: T.radius.sm, fontSize: T.fs.sm, fontWeight:700, cursor:'pointer' }}>
              Restore this version
            </button>
            <button onClick={backToCurrent}
              style={{ padding:'5px 14px', background:'transparent', color:'#FEF3C7', border:'1px solid #D97706', borderRadius: T.radius.sm, fontSize: T.fs.sm, cursor:'pointer' }}>
              Back to Current
            </button>
          </div>
        </div>
      )}

      {/* ── Import Modal ── */}
      {showImportModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={e=>{ if(e.target===e.currentTarget) setShowImportModal(false) }}>
          <div style={{ background: T.surface, borderRadius: T.radius.xl, width:'100%', maxWidth:540, maxHeight:'90vh', overflow:'auto', boxShadow: T.shadow.lg, border:`1px solid ${T.border}`, fontFamily: T.fontFamily }}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:`${T.sp.lg}px ${T.sp.xl}px`, borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: T.fs.lg, fontWeight:600, color: T.text }}>Import Data</div>
                <div style={{ fontSize: T.fs.xs, color: T.textSecondary, marginTop:2 }}>Choose what to bring into your project</div>
              </div>
              <button onClick={()=>setShowImportModal(false)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color: T.textMuted, lineHeight:1 }}>&times;</button>
            </div>

            <div style={{ padding:`${T.sp.lg}px ${T.sp.xl}px` }}>
              {/* Feedback */}
              {importFeedback && (
                <div style={{ marginBottom: T.sp.md, padding:'10px 14px', borderRadius: T.radius.md, fontSize: T.fs.sm, fontWeight:500,
                  background: importFeedback.type==='success' ? T.successBg : importFeedback.type==='error' ? T.dangerBg : '#FEF9C3',
                  color: importFeedback.type==='success' ? T.success : importFeedback.type==='error' ? T.danger : '#854D0E',
                  border: `1px solid ${importFeedback.type==='success' ? T.success+'40' : importFeedback.type==='error' ? T.danger+'40' : '#FDE047'}` }}>
                  {importFeedback.type === 'success' ? '✓ ' : importFeedback.type === 'error' ? '✗ ' : '⚠ '}{importFeedback.message}
                </div>
              )}

              {/* Section: Project Setup */}
              <div style={{ fontSize: T.fs.xs, fontWeight:600, color: T.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom: T.sp.sm }}>Project Setup</div>
              {([
                { icon: IC.storyMap,      label:'Story Map',          tag:'.xlsx', desc:'The main story list from your BA team. Replaces all backlog stories — sprint assignments already on the board are preserved.', type:'story',     accept:'.xlsx,.xls' },
                { icon: IC.mergeBacklog,  label:'Additional Backlog', tag:'.xlsx', desc:'Merge new stories into an existing project. Conflicts (IDs already placed in a sprint, or with a different headline) are flagged before anything changes.', type:'merge',     accept:'.xlsx,.xls' },
                { icon: IC.depMap,        label:'Dependency Map',     tag:'.xlsx', desc:'Story dependency rules. Adds to existing rules — does not overwrite sprint assignments. Exported from this tool or built manually.',          type:'deps-xlsx', accept:'.xlsx,.xls' },
                { icon: IC.criticalPath,  label:'Critical Path',      tag:'.xlsx', desc:'Critical path story list. CP stories are highlighted with a red border on the board.',                                                         type:'cp',        accept:'.xlsx,.xls' },
              ] as {icon:React.ReactNode;label:string;tag:string;desc:string;type:string;accept:string}[]).map(opt => (
                <label key={opt.type} style={{ display:'flex', alignItems:'center', gap: T.sp.md, padding:`${T.sp.sm}px ${T.sp.md}px`, marginBottom: T.sp.xs, borderRadius: T.radius.md, border:`1px solid ${T.border}`, cursor:'pointer', background: T.bg }}
                  onMouseEnter={e=>(e.currentTarget.style.borderColor=T.primary)}
                  onMouseLeave={e=>(e.currentTarget.style.borderColor=T.border)}>
                  <ModalIcon icon={opt.icon} color={T.textSecondary} />
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize: T.fs.sm, fontWeight:600, color: T.text }}>{opt.label} <span style={{ fontSize: T.fs.xs, fontWeight:400, color: T.textMuted }}>{opt.tag}</span></div>
                    <div style={{ fontSize: T.fs.xs, color: T.textSecondary, marginTop:2, lineHeight:1.4 }}>{opt.desc}</div>
                  </div>
                  <div style={{ fontSize: T.fs.xs, color: T.primary, fontWeight:600, flexShrink:0, whiteSpace:'nowrap' }}>Choose file</div>
                  <input type="file" accept={opt.accept} style={{ display:'none' }}
                    onChange={async e=>{ const f=e.target.files?.[0]; e.target.value=''; if(f) await processImport(f, opt.type) }} />
                </label>
              ))}

              {/* Section: Restore Sprint Plan */}
              <div style={{ fontSize: T.fs.xs, fontWeight:600, color: T.textMuted, textTransform:'uppercase', letterSpacing:1, marginTop: T.sp.lg, marginBottom: T.sp.sm }}>Restore Sprint Plan</div>
              <label style={{ display:'flex', alignItems:'center', gap: T.sp.md, padding:`${T.sp.sm}px ${T.sp.md}px`, marginBottom: T.sp.xs, borderRadius: T.radius.md, border:`1px solid ${T.border}`, cursor:'pointer', background: T.bg }}
                onMouseEnter={e=>(e.currentTarget.style.borderColor=T.primary)}
                onMouseLeave={e=>(e.currentTarget.style.borderColor=T.border)}>
                <ModalIcon icon={IC.releasePlan} color={T.textSecondary} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize: T.fs.sm, fontWeight:600, color: T.text }}>Release Plan <span style={{ fontSize: T.fs.xs, fontWeight:400, color: T.textMuted }}>.xlsx</span></div>
                  <div style={{ fontSize: T.fs.xs, color: T.textSecondary, marginTop:2, lineHeight:1.4 }}>Import a Release Plan previously exported from this tool. Restores sprint and stream assignments so the board reflects the saved plan exactly.</div>
                </div>
                <div style={{ fontSize: T.fs.xs, color: T.primary, fontWeight:600, flexShrink:0, whiteSpace:'nowrap' }}>Choose file</div>
                <input type="file" accept=".xlsx,.xls" style={{ display:'none' }}
                  onChange={async e=>{ const f=e.target.files?.[0]; e.target.value=''; if(f) await processImport(f, 'story') }} />
              </label>

              {/* Section: Open Saved Project */}
              <div style={{ fontSize: T.fs.xs, fontWeight:600, color: T.textMuted, textTransform:'uppercase', letterSpacing:1, marginTop: T.sp.lg, marginBottom: T.sp.sm }}>Open Saved Project</div>
              <label style={{ display:'flex', alignItems:'center', gap: T.sp.md, padding:`${T.sp.sm}px ${T.sp.md}px`, borderRadius: T.radius.md, border:`1px solid ${T.warning}60`, cursor:'pointer', background:'#FFFBEB' }}
                onMouseEnter={e=>(e.currentTarget.style.borderColor=T.warning)}
                onMouseLeave={e=>(e.currentTarget.style.borderColor=T.warning+'60')}>
                <ModalIcon icon={IC.projectFile} color={'#92400E'} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize: T.fs.sm, fontWeight:600, color: T.text }}>Project File <span style={{ fontSize: T.fs.xs, fontWeight:400, color: T.textMuted }}>.rp</span></div>
                  <div style={{ fontSize: T.fs.xs, color: T.textSecondary, marginTop:2, lineHeight:1.4 }}>Open a complete project backup — stories, streams, sprint assignments, dependencies, and critical path. Use this when moving to a new machine. <strong style={{ color: '#92400E' }}>Replaces your entire current project.</strong> You&apos;ll see a preview before confirming.</div>
                </div>
                <div style={{ fontSize: T.fs.xs, color: T.primary, fontWeight:600, flexShrink:0, whiteSpace:'nowrap' }}>Choose file</div>
                <input type="file" accept=".rp,.zip" style={{ display:'none' }}
                  onChange={async e=>{ const f=e.target.files?.[0]; e.target.value=''; if(f) await processImport(f, 'rp') }} />
              </label>

              <div style={{ marginTop: T.sp.lg, paddingTop: T.sp.md, borderTop:`1px solid ${T.border}`, fontSize: T.fs.xs, color: T.textMuted, lineHeight:1.5 }}>
                <strong>Project Setup</strong> — for building a plan from scratch.<br/>
                <strong>Restore Sprint Plan</strong> — to reload a shared Release Plan Excel.<br/>
                <strong>Open Saved Project</strong> — to move between machines or restore a full backup.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── RP Confirm Modal ── */}
      {rpConfirmData && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:2100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background: T.surface, borderRadius: T.radius.xl, width:'100%', maxWidth:460, boxShadow: T.shadow.lg, border:`2px solid ${T.warning}`, fontFamily: T.fontFamily }}>
            <div style={{ padding:`${T.sp.lg}px ${T.sp.xl}px`, borderBottom:`1px solid ${T.border}` }}>
              <div style={{ fontSize: T.fs.lg, fontWeight:600, color: T.text }}>⚠ Replace entire project?</div>
            </div>
            <div style={{ padding:`${T.sp.lg}px ${T.sp.xl}px` }}>
              <div style={{ fontSize: T.fs.sm, color: T.textSecondary, marginBottom: T.sp.md, lineHeight:1.5 }}>
                You&apos;re about to restore a saved project file. This will replace <strong style={{ color: T.text }}>all current data</strong>:
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap: T.sp.xs, marginBottom: T.sp.lg }}>
                {['All stories and sprint assignments','Stream configuration','Sprint capacity settings','Dependency rules','Critical path'].map(item => (
                  <div key={item} style={{ fontSize: T.fs.sm, color: T.textSecondary, display:'flex', gap: T.sp.xs }}>
                    <span style={{ color: T.danger }}>•</span> {item}
                  </div>
                ))}
              </div>
              <div style={{ padding:`${T.sp.md}px ${T.sp.md}px`, background: T.bg, borderRadius: T.radius.md, border:`1px solid ${T.border}`, marginBottom: T.sp.md }}>
                <div style={{ fontSize: T.fs.sm, color: T.text, fontWeight:600 }}>{rpConfirmData.projectName}</div>
                <div style={{ fontSize: T.fs.xs, color: T.textSecondary, marginTop:3 }}>
                  {rpConfirmData.storyCount} stories · {rpConfirmData.streamCount} streams
                  {rpConfirmData.savedAt ? ` · Saved ${new Date(rpConfirmData.savedAt).toLocaleDateString()}` : ''}
                </div>
              </div>
              <div style={{ fontSize: T.fs.xs, color: T.warning, fontWeight:500, marginBottom: T.sp.lg }}>This cannot be undone.</div>
              <div style={{ display:'flex', gap: T.sp.sm }}>
                <button onClick={()=>setRpConfirmData(null)} style={{ flex:1, padding:'9px', background: T.bg, color: T.text, border:`1px solid ${T.border}`, borderRadius: T.radius.md, cursor:'pointer', fontWeight:600, fontFamily: T.fontFamily }}>Cancel</button>
                <button onClick={()=>executeRPImport(rpConfirmData.file)} style={{ flex:1, padding:'9px', background: T.danger, color: T.surface, border:'none', borderRadius: T.radius.md, cursor:'pointer', fontWeight:600, fontFamily: T.fontFamily }}>Replace Project</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Merge Conflict Modal ── */}
      {mergeConflictData && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.65)', zIndex:2100, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
          <div style={{ background: T.surface, borderRadius: T.radius.xl, width:'100%', maxWidth:520, maxHeight:'80vh', overflow:'auto', boxShadow: T.shadow.lg, border:`2px solid ${T.danger}`, fontFamily: T.fontFamily }}>
            <div style={{ padding:`${T.sp.lg}px ${T.sp.xl}px`, borderBottom:`1px solid ${T.border}` }}>
              <div style={{ fontSize: T.fs.lg, fontWeight:600, color: T.danger }}>✗ Conflicts found in Additional Backlog</div>
            </div>
            <div style={{ padding:`${T.sp.lg}px ${T.sp.xl}px` }}>
              <div style={{ fontSize: T.fs.sm, color: T.textSecondary, marginBottom: T.sp.md, lineHeight:1.5 }}>
                {mergeConflictData.conflicts.length} {mergeConflictData.conflicts.length === 1 ? 'story conflicts' : 'stories conflict'} with your existing project. Please fix these in your Excel file and re-import.
                {mergeConflictData.newCount > 0 && <> <strong style={{ color: T.text }}>{mergeConflictData.newCount} new {mergeConflictData.newCount === 1 ? 'story is' : 'stories are'} ready</strong> and will be added once conflicts are resolved.</>}
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap: T.sp.sm, marginBottom: T.sp.lg }}>
                {mergeConflictData.conflicts.map((c,i) => (
                  <div key={i} style={{ padding:`${T.sp.sm}px ${T.sp.md}px`, background: T.dangerBg, borderRadius: T.radius.md, border:`1px solid ${T.danger}30` }}>
                    <div style={{ fontSize: T.fs.sm, fontWeight:600, color: T.danger, marginBottom:3 }}>{c.id}</div>
                    {c.issues.includes('already_planned') && (
                      <div style={{ fontSize: T.fs.xs, color: T.textSecondary }}>Already placed in <strong>{c.existingSprint.replace('sprint','Sprint ')}</strong> — cannot merge a planned story.</div>
                    )}
                    {c.issues.includes('headline_mismatch') && (
                      <div style={{ fontSize: T.fs.xs, color: T.textSecondary, marginTop:2 }}>
                        Headline mismatch: <span style={{ color: T.text }}>&ldquo;{c.existingHeadline}&rdquo;</span> → <span style={{ color: T.text }}>&ldquo;{c.incomingHeadline}&rdquo;</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <button onClick={()=>setMergeConflictData(null)} style={{ width:'100%', padding:'9px', background: T.bg, color: T.text, border:`1px solid ${T.border}`, borderRadius: T.radius.md, cursor:'pointer', fontWeight:600, fontFamily: T.fontFamily }}>Close — I&apos;ll fix the file</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Export Modal ── */}
      {showExportModal && (
        <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.55)', zIndex:2000, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
          onClick={e=>{ if(e.target===e.currentTarget) setShowExportModal(false) }}>
          <div style={{ background: T.surface, borderRadius: T.radius.xl, width:'100%', maxWidth:520, maxHeight:'90vh', overflow:'auto', boxShadow: T.shadow.lg, border:`1px solid ${T.border}`, fontFamily: T.fontFamily }}>
            {/* Header */}
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:`${T.sp.lg}px ${T.sp.xl}px`, borderBottom:`1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: T.fs.lg, fontWeight:600, color: T.text }}>Export</div>
                <div style={{ fontSize: T.fs.xs, color: T.textSecondary, marginTop:2 }}>Download your data in different formats</div>
              </div>
              <button onClick={()=>setShowExportModal(false)} style={{ background:'none', border:'none', fontSize:20, cursor:'pointer', color: T.textMuted, lineHeight:1 }}>&times;</button>
            </div>

            <div style={{ padding:`${T.sp.lg}px ${T.sp.xl}px` }}>

              {/* Backup & Archive */}
              <div style={{ fontSize: T.fs.xs, fontWeight:600, color: T.textMuted, textTransform:'uppercase', letterSpacing:1, marginBottom: T.sp.sm }}>Backup & Archive</div>
              <ExportRow icon={IC.projectFile} label="Project File" ext=".rp" desc="Complete backup — stories, streams, sprint assignments, dependencies, critical path. Use this to move to a new machine or archive the full project." onDownload={()=>{ exportRP(); setShowExportModal(false) }} T={T} />

              {/* Planning Reports */}
              <div style={{ fontSize: T.fs.xs, fontWeight:600, color: T.textMuted, textTransform:'uppercase', letterSpacing:1, marginTop: T.sp.lg, marginBottom: T.sp.sm }}>Planning Reports</div>
              <ExportRow icon={IC.releasePlan} label="Release Plan" ext=".xlsx" desc="The sprint board as a 5-sheet Excel workbook — Release Plan, Board by Stories, Actions, Goals, and Stream Config. Share with stakeholders or PMs." onDownload={()=>{ exportXlsx(); setShowExportModal(false) }} T={T} />

              {/* Source Data */}
              <div style={{ fontSize: T.fs.xs, fontWeight:600, color: T.textMuted, textTransform:'uppercase', letterSpacing:1, marginTop: T.sp.lg, marginBottom: T.sp.sm }}>Source Data</div>
              <ExportRow icon={IC.storyMap}     label="Story Map"      ext=".xlsx" desc="All stories with their current metadata — IDs, headlines, personas, goals, actions, workflow, estimates. Re-import into any new project to rebuild the backlog." onDownload={()=>{ exportStoryMap(); setShowExportModal(false) }} T={T} />
              <ExportRow icon={IC.depMap}       label="Dependency Map"  ext=".xlsx" desc="Story-to-story dependency rules. Import this back using Dependency Map import to restore blocking relationships." onDownload={()=>{ exportDepMap(); setShowExportModal(false) }} T={T} />
              <ExportRow icon={IC.criticalPath} label="Critical Path"   ext=".xlsx" desc="The critical path story list. Import this back using Critical Path import to restore CP highlighting on the board." onDownload={()=>{ exportCriticalPath(); setShowExportModal(false) }} T={T} />

            </div>
          </div>
        </div>
      )}

      {/* ── TIER 1: Top Nav Bar (44px, dark) ── */}
      <div style={{ background: T.secondary, height: 44, display:'flex', alignItems:'center', padding:'0 16px', gap: T.sp.md, flexShrink:0, fontFamily: T.fontFamily }}>
        {/* Left: Logo + Project Name */}
        <div style={{ display:'flex', alignItems:'center', gap: T.sp.sm, flexShrink:0 }}>
          <span style={{ fontSize: T.fs.lg, lineHeight:1 }}>&#9889;</span>
          <span style={{ fontSize: T.fs.md, fontWeight:600, color: T.surface, letterSpacing:'-0.3px' }}>FlashPro</span>
          <div style={{ position:'relative' }}>
            <button onClick={()=>setShowProjects(p=>!p)}
              style={{ background:'none', border:'none', cursor:'pointer', display:'flex', alignItems:'center', gap: T.sp.xs, padding:'2px 6px', borderRadius: T.radius.sm }}>
              <span style={{ fontSize: T.fs.md, fontWeight:400, color: T.textMuted, margin:'0 2px' }}>&middot;</span>
              <span style={{ fontSize: T.fs.base, fontWeight:600, color:'#CBD5E1', maxWidth:200, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                {currentProject || 'Release Planner'}
              </span>
              <span style={{ fontSize: T.fs.xs, color: T.textMuted }}>&#9662;</span>
            </button>
            {showProjects && (
              <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, background: T.surface, border:`1px solid ${T.border}`, borderRadius: T.radius.lg, boxShadow: T.shadow.lg, zIndex:200, width:320, padding: T.sp.md }}>
                <div style={{ fontSize: T.fs.md, fontWeight:600, color: T.text, marginBottom: T.sp.sm }}>Projects</div>
                {projects.length === 0 && <div style={{ fontSize: T.fs.sm, color: T.textSecondary, marginBottom: T.sp.sm }}>No saved projects yet.</div>}
                {projects.map(p => (
                  <div key={p.key} style={{ display:'flex', alignItems:'center', gap: T.sp.sm, padding:'6px 8px', borderRadius: T.radius.md, background: currentProject===p.name ? T.primaryLight : T.bg, marginBottom: T.sp.xs, border: `1px solid ${currentProject===p.name ? T.primary : T.border}` }}>
                    <div style={{ flex:1, cursor:'pointer' }} onClick={()=>loadProject(p.name)}>
                      <div style={{ fontSize: T.fs.sm, fontWeight:600, color: T.text }}>{p.name}</div>
                      <div style={{ fontSize: T.fs.xs, color: T.textSecondary }}>{p.storyCount} stories &middot; {p.plannedCount} planned</div>
                    </div>
                    <button onClick={()=>saveProject(p.name)} title="Overwrite save" style={{ fontSize: T.fs.xs, padding:'2px 6px', background: T.successBg, color: T.success, border:'1px solid #bbf7d0', borderRadius: T.radius.sm, cursor:'pointer' }}>Save</button>
                    <button onClick={()=>deleteProject(p.name)} title="Delete" style={{ fontSize: T.fs.xs, padding:'2px 6px', background: T.dangerBg, color: T.danger, border:'1px solid #fda4af', borderRadius: T.radius.sm, cursor:'pointer' }}>&times;</button>
                  </div>
                ))}
                <div style={{ marginTop: T.sp.sm, paddingTop: T.sp.sm, borderTop:`1px solid ${T.border}` }}>
                  <div style={{ fontSize: T.fs.sm, fontWeight:600, color: T.textSecondary, marginBottom: T.sp.sm }}>New project</div>
                  <div style={{ display:'flex', gap: T.sp.xs }}>
                    <input value={newProjectName} onChange={e=>setNewProjectName(e.target.value)}
                      onKeyDown={e=>e.key==='Enter'&&saveProject(newProjectName)}
                      placeholder="Project name..."
                      style={{ flex:1, padding:'5px 8px', fontSize: T.fs.sm, border:`1px solid ${T.border}`, borderRadius: T.radius.md, outline:'none', fontFamily: T.fontFamily }} />
                    <button onClick={()=>saveProject(newProjectName)} disabled={saving||!newProjectName.trim()}
                      style={{ padding:'5px 10px', fontSize: T.fs.sm, fontWeight:600, background: newProjectName.trim() ? T.primary : T.border, color: newProjectName.trim() ? T.surface : T.textMuted, border:'none', borderRadius: T.radius.md, cursor: newProjectName.trim()?'pointer':'default' }}>
                      {saving ? '...' : 'Save'}
                    </button>
                  </div>
                  {currentProject && (
                    <button onClick={()=>saveProject(currentProject)}
                      style={{ marginTop: T.sp.sm, width:'100%', padding:'5px', fontSize: T.fs.sm, background: T.bg, color: T.textSecondary, border:`1px solid ${T.border}`, borderRadius: T.radius.md, cursor:'pointer' }}>
                      Save to &ldquo;{currentProject}&rdquo;
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex:1 }} />

        {/* Right: Import, Export, Settings, User */}
        <div style={{ display:'flex', alignItems:'center', gap: T.sp.sm, flexShrink:0 }}>

          {/* ── Version chip ── */}
          <div ref={versionDropdownRef} style={{ position:'relative' }}>
            <button onClick={()=>{ setShowVersionDropdown(v => { if (!v) loadVersions(); return !v }); setShowSnapshotInput(false) }}
              style={{ display:'flex', alignItems:'center', gap: T.sp.xs, padding:'4px 10px', fontSize: T.fs.sm, fontFamily: T.fontFamily, cursor:'pointer', borderRadius: T.radius.sm,
                background: previewingVersion ? '#78350F22' : 'rgba(255,255,255,0.08)',
                color: previewingVersion ? '#FCD34D' : '#94A3B8',
                border: `1px solid ${previewingVersion ? '#FCD34D40' : 'rgba(255,255,255,0.12)'}`,
                fontWeight: previewingVersion ? 600 : 400 }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {previewingVersion ? `Viewing: ${previewingVersion.name || formatVersionDate(previewingVersion.savedAt)}` : 'History'}
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>

            {showVersionDropdown && (
              <div style={{ position:'absolute', top:'calc(100% + 6px)', right:0, background: T.surface, border:`1px solid ${T.border}`, borderRadius: T.radius.lg, boxShadow: T.shadow.lg, zIndex:300, width:380, overflow:'hidden', fontFamily: T.fontFamily }}>
                {/* Header */}
                <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderBottom:`1px solid ${T.borderLight}` }}>
                  <span style={{ fontSize: T.fs.sm, fontWeight:600, color: T.text }}>Version History</span>
                  <button onClick={()=>setShowVersionDropdown(false)} style={{ background:'none', border:'none', fontSize:16, cursor:'pointer', color: T.textMuted, lineHeight:1 }}>&times;</button>
                </div>

                {/* Save snapshot input */}
                <div style={{ padding:'8px 14px', borderBottom:`1px solid ${T.borderLight}` }}>
                  {showSnapshotInput ? (
                    <div style={{ display:'flex', flexDirection:'column', gap: T.sp.xs }}>
                      <div style={{ fontSize:10, color: T.textMuted, marginBottom:1 }}>Version name — edit or keep the suggested name</div>
                      <div style={{ display:'flex', gap: T.sp.xs }}>
                        <input autoFocus value={snapshotName} onChange={e=>setSnapshotName(e.target.value)}
                          onFocus={e=>e.target.select()}
                          onKeyDown={e=>{ if(e.key==='Enter') saveSnapshot(snapshotName); if(e.key==='Escape') setShowSnapshotInput(false) }}
                          style={{ flex:1, padding:'6px 8px', border:`1px solid ${T.primary}`, borderRadius: T.radius.sm, fontSize: T.fs.xs, color: T.text, background: T.bg, fontFamily: T.fontFamily, outline:'none', boxShadow:`0 0 0 2px ${T.primaryLight}` }} />
                        <button onClick={()=>saveSnapshot(snapshotName)} disabled={!snapshotName.trim() || savingSnapshot}
                          style={{ padding:'5px 12px', background: T.primary, color: T.surface, border:'none', borderRadius: T.radius.sm, fontSize: T.fs.xs, fontWeight:600, cursor: snapshotName.trim() ? 'pointer' : 'default', opacity: snapshotName.trim() ? 1 : 0.5 }}>
                          {savingSnapshot ? '…' : 'Save'}
                        </button>
                        <button onClick={()=>setShowSnapshotInput(false)}
                          style={{ padding:'5px 8px', background:'none', color: T.textMuted, border:`1px solid ${T.border}`, borderRadius: T.radius.sm, fontSize: T.fs.xs, cursor:'pointer' }}>
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={()=>{ setSnapshotName(generateSnapshotName()); setShowSnapshotInput(true) }}
                      style={{ width:'100%', padding:'6px 0', background:'none', border:`1px dashed ${T.border}`, borderRadius: T.radius.sm, fontSize: T.fs.xs, color: T.textSecondary, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap: T.sp.xs }}
                      onMouseEnter={e=>{ e.currentTarget.style.borderColor=T.primary; e.currentTarget.style.color=T.primary }}
                      onMouseLeave={e=>{ e.currentTarget.style.borderColor=T.border; e.currentTarget.style.color=T.textSecondary }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                      Save snapshot
                    </button>
                  )}
                </div>

                {/* Version list */}
                <div style={{ maxHeight:340, overflowY:'auto' }}>
                  {versions.length === 0 && (
                    <div style={{ padding:'20px 14px', textAlign:'center', fontSize: T.fs.xs, color: T.textMuted }}>
                      No versions yet. Versions are saved automatically on imports.
                    </div>
                  )}

                  {/* Starred snapshots */}
                  {versions.filter(v=>v.starred).length > 0 && (
                    <div>
                      <div style={{ padding:'6px 14px 3px', fontSize:10, fontWeight:600, color: T.textMuted, textTransform:'uppercase', letterSpacing:1 }}>Saved Snapshots</div>
                      {versions.filter(v=>v.starred).map(v => (
                        <VersionRow key={v.id} v={v} onPreview={previewVersion} onStar={async(id,s)=>{ await fetch(`/api/versions/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({starred:s})}); loadVersions() }} formatDate={formatVersionDate} triggerLabel={triggerLabel} T={T} />
                      ))}
                    </div>
                  )}

                  {/* Auto-saves */}
                  {versions.filter(v=>!v.starred).length > 0 && (
                    <div>
                      <div style={{ padding:'6px 14px 3px', fontSize:10, fontWeight:600, color: T.textMuted, textTransform:'uppercase', letterSpacing:1 }}>Auto Saves</div>
                      {versions.filter(v=>!v.starred).slice(0,20).map(v => (
                        <VersionRow key={v.id} v={v} onPreview={previewVersion} onStar={async(id,s)=>{ await fetch(`/api/versions/${id}`,{method:'PATCH',headers:{'Content-Type':'application/json'},body:JSON.stringify({starred:s})}); loadVersions() }} formatDate={formatVersionDate} triggerLabel={triggerLabel} T={T} />
                      ))}
                      {versions.filter(v=>!v.starred).length > 20 && (
                        <div style={{ padding:'6px 14px', fontSize: T.fs.xs, color: T.textMuted, textAlign:'center' }}>
                          + {versions.filter(v=>!v.starred).length - 20} more older saves
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Import button */}
          <button onClick={()=>{ setShowImportModal(true); setImportFeedback(null) }}
            style={{ padding:'5px 10px', fontSize: T.fs.sm, background:'rgba(255,255,255,0.1)', color:'#CBD5E1', border:'1px solid rgba(255,255,255,0.15)', borderRadius: T.radius.sm, cursor:'pointer', display:'flex', alignItems:'center', gap: T.sp.xs, fontFamily: T.fontFamily }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg> Import
          </button>

          {/* Export button */}
          <button onClick={()=>setShowExportModal(true)}
            style={{ padding:'5px 10px', fontSize: T.fs.sm, background:'rgba(255,255,255,0.1)', color:'#CBD5E1', border:'1px solid rgba(255,255,255,0.15)', borderRadius: T.radius.sm, cursor:'pointer', display:'flex', alignItems:'center', gap: T.sp.xs, fontFamily: T.fontFamily }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg> Export
          </button>

          {/* Settings */}
          <a href="/settings" style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius: T.radius.sm, cursor:'pointer', textDecoration:'none', color:'#CBD5E1' }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </a>

          {/* Help dropdown */}
          <div style={{ position:'relative', display:'inline-block' }} onMouseLeave={e=>{const m=e.currentTarget.querySelector('[data-helpmenu]') as HTMLElement;if(m)m.style.display='none'}}>
            <button onMouseEnter={e=>{const m=e.currentTarget.nextElementSibling as HTMLElement;if(m)m.style.display='block'}}
              style={{ width:32, height:32, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.08)', border:'1px solid rgba(255,255,255,0.12)', borderRadius: T.radius.sm, cursor:'pointer', fontSize: T.fs.md, fontWeight:600, color:'#CBD5E1' }}>
              ?
            </button>
            <div data-helpmenu style={{ display:'none', position:'absolute', top:'100%', right:0, background: T.surface, border:`1px solid ${T.border}`, borderRadius: T.radius.lg, boxShadow: T.shadow.lg, zIndex:100, minWidth:160, padding: T.sp.xs }}>
              <div onClick={()=>setShowLegend(true)} style={{ padding:`${T.sp.sm}px ${T.sp.md}px`, cursor:'pointer', borderRadius: T.radius.md, fontSize: T.fs.sm, color: T.text }}
                onMouseEnter={e=>(e.currentTarget.style.background=T.bg)} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                Legend
              </div>
              <a href="/intro" style={{ display:'block', padding:`${T.sp.sm}px ${T.sp.md}px`, cursor:'pointer', borderRadius: T.radius.md, fontSize: T.fs.sm, color: T.text, textDecoration:'none' }}
                onMouseEnter={e=>(e.currentTarget.style.background=T.bg)} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                Setup Guide
              </a>
            </div>
          </div>

          {/* User menu */}
          <div style={{ position:'relative', display:'inline-block' }} onMouseLeave={e=>{const m=e.currentTarget.querySelector('[data-usermenu]') as HTMLElement;if(m)m.style.display='none'}}>
            <button onMouseEnter={e=>{const m=e.currentTarget.nextElementSibling as HTMLElement;if(m)m.style.display='block'}}
              style={{ width:32, height:32, borderRadius: T.radius.full, background: T.primary, display:'flex', alignItems:'center', justifyContent:'center', fontSize: T.fs.sm, fontWeight:600, color: T.surface, cursor:'pointer', border:'2px solid rgba(255,255,255,0.2)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            </button>
            <div data-usermenu style={{ display:'none', position:'absolute', top:'100%', right:0, background: T.surface, border:`1px solid ${T.border}`, borderRadius: T.radius.lg, boxShadow: T.shadow.lg, zIndex:200, minWidth:200, padding: T.sp.xs }}>
              {/* Personal section */}
              <div style={{ padding:`${T.sp.xs}px ${T.sp.md}px`, fontSize: T.fs.xs, fontWeight:600, color: T.textMuted, textTransform:'uppercase', letterSpacing:'0.5px' }}>Account</div>
              <a href="/profile" style={{ display:'flex', alignItems:'center', gap: T.sp.sm, padding:`${T.sp.sm}px ${T.sp.md}px`, borderRadius: T.radius.md, fontSize: T.fs.sm, fontWeight:500, color: T.text, textDecoration:'none' }}
                onMouseEnter={e=>(e.currentTarget.style.background=T.bg)} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                My Profile
              </a>
              <a href="/profile" style={{ display:'flex', alignItems:'center', gap: T.sp.sm, padding:`${T.sp.sm}px ${T.sp.md}px`, borderRadius: T.radius.md, fontSize: T.fs.sm, color: T.textSecondary, textDecoration:'none' }}
                onMouseEnter={e=>(e.currentTarget.style.background=T.bg)} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                Language & Preferences
              </a>
              {/* Admin section */}
              <div style={{ height:1, background: T.borderLight, margin:`${T.sp.xs}px 0` }} />
              <div style={{ padding:`${T.sp.xs}px ${T.sp.md}px`, fontSize: T.fs.xs, fontWeight:600, color: T.textMuted, textTransform:'uppercase', letterSpacing:'0.5px' }}>Administration</div>
              <a href="/profile#access" style={{ display:'flex', alignItems:'center', gap: T.sp.sm, padding:`${T.sp.sm}px ${T.sp.md}px`, borderRadius: T.radius.md, fontSize: T.fs.sm, color: T.textSecondary, textDecoration:'none' }}
                onMouseEnter={e=>(e.currentTarget.style.background=T.bg)} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                Access Control
              </a>
              <a href="/admin" style={{ display:'flex', alignItems:'center', gap: T.sp.sm, padding:`${T.sp.sm}px ${T.sp.md}px`, borderRadius: T.radius.md, fontSize: T.fs.sm, color: T.textSecondary, textDecoration:'none' }}
                onMouseEnter={e=>(e.currentTarget.style.background=T.bg)} onMouseLeave={e=>(e.currentTarget.style.background='')}>
                Manage Users
              </a>
              {/* Status */}
              <div style={{ height:1, background: T.borderLight, margin:`${T.sp.xs}px 0` }} />
              <div style={{ padding:`${T.sp.xs}px ${T.sp.md}px`, fontSize: T.fs.xs, color: T.textMuted }}>
                {activeUsers.length > 0 ? `${activeUsers.length} people online` : 'Local mode — no auth'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── TIER 2: Tool Bar (36px, white) ── */}
      <div style={{ background: T.surface, height: 36, display:'flex', alignItems:'center', padding:'0 16px', gap: T.sp.md, borderBottom:`1px solid ${T.border}`, flexShrink:0, fontFamily: T.fontFamily }}>
        {/* View tabs — board views + separator + dependencies */}
        <div style={{ display:'flex', alignItems:'center', gap: T.sp.xs }}>
          {/* Board views group */}
          <div style={{ display:'flex', background: T.borderLight, borderRadius: T.radius.md, padding:2, gap:1 }}>
            {viewTabs.filter(v => v !== 'deps' && v !== 'gantt').map(v => (
              <button key={v} onClick={()=>{ setView(v as ViewMode); if(typeof window!=='undefined') localStorage.setItem('flashpro_view', v) }}
                style={{ padding:'4px 11px', fontSize: T.fs.sm, fontWeight: view===v ? 600 : 400, background: view===v ? T.primary : 'transparent', color: view===v ? T.surface : T.textSecondary, border:'none', borderRadius: T.radius.sm, cursor:'pointer', whiteSpace:'nowrap' as const, transition:'all 0.15s', fontFamily: T.fontFamily }}>
                {getViewLabel(v)}
              </button>
            ))}
          </div>
          {/* Subtle divider */}
          <div style={{ width:1, height:16, background: T.border, flexShrink:0 }} />
          {/* Gantt chart tab */}
          <button onClick={()=>{ setView('gantt' as ViewMode); if(typeof window!=='undefined') localStorage.setItem('flashpro_view','gantt') }}
            title="Timeline Gantt chart"
            style={{ padding:'4px 11px', fontSize: T.fs.sm, fontWeight: view==='gantt' ? 600 : 400,
              background: view==='gantt' ? '#EFF6FF' : 'transparent',
              color: view==='gantt' ? T.primary : T.textMuted,
              border: `1px solid ${view==='gantt' ? T.primary+'50' : 'transparent'}`,
              borderRadius: T.radius.sm, cursor:'pointer', whiteSpace:'nowrap' as const, transition:'all 0.15s', fontFamily: T.fontFamily,
              display:'flex', alignItems:'center', gap: T.sp.xs }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="3" rx="1"/><rect x="3" y="10.5" width="12" height="3" rx="1"/><rect x="3" y="17" width="16" height="3" rx="1"/></svg>
            Gantt
          </button>
          {/* Subtle divider */}
          <div style={{ width:1, height:16, background: T.border, flexShrink:0 }} />
          {/* Dependencies */}
          <button onClick={()=>{ setView('deps' as ViewMode); if(typeof window!=='undefined') localStorage.setItem('flashpro_view','deps') }}
            title="View dependency map and broken dependencies"
            style={{ padding:'4px 11px', fontSize: T.fs.sm, fontWeight: view==='deps' ? 600 : 400,
              background: view==='deps' ? T.dangerBg : 'transparent',
              color: view==='deps' ? T.danger : T.textMuted,
              border: `1px solid ${view==='deps' ? T.danger+'50' : 'transparent'}`,
              borderRadius: T.radius.sm, cursor:'pointer', whiteSpace:'nowrap' as const, transition:'all 0.15s', fontFamily: T.fontFamily,
              display:'flex', alignItems:'center', gap: T.sp.xs }}>
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
            Dependencies
            {brokenDepIds.size > 0 && <span style={{ background: T.danger, color: T.surface, borderRadius:99, fontSize:9, fontWeight:700, padding:'0 4px', lineHeight:'14px', minWidth:14, textAlign:'center' }}>{brokenDepIds.size}</span>}
          </button>
        </div>

        <div style={{ width:1, height:18, background: T.border, flexShrink:0 }} />

        {/* Search */}
        <div style={{ position:'relative', display:'flex', alignItems:'center' }}>
          <span style={{ position:'absolute', left:8, fontSize: T.fs.sm, color: T.textMuted, pointerEvents:'none' }}><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg></span>
          <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..."
            style={{ padding:'4px 8px 4px 26px', fontSize: T.fs.sm, background: T.bg, border:`1px solid ${T.border}`, borderRadius: T.radius.sm, color: T.text, width: search ? 180 : 120, transition:'width 0.2s', outline:'none', fontFamily: T.fontFamily }}
            onFocus={e=>{e.currentTarget.style.width='180px';e.currentTarget.style.borderColor=T.primary}}
            onBlur={e=>{if(!search)e.currentTarget.style.width='120px';e.currentTarget.style.borderColor=T.border}} />
        </div>

        {/* ── Option A: Per-field filter buttons ── */}
        {(() => {
          // Build filterable fields — only show if they have data
          // id = unique button identity (aggregate label); fieldKey = actual story field for filtering
          const filterFields = [
            { id: '__persona__', label: 'Persona', fieldKey: 'persona', isPersona: true,
              values: Array.from(new Set(stories.map(s=>s.persona).filter(Boolean))).sort() as string[] },
            ...aggregates.map(agg => {
              const fk = getFilterField(agg.toLowerCase())
              return {
                id: agg,   // unique per aggregate — never collides even if two aggregates share a field
                label: agg,
                fieldKey: fk,
                isPersona: false,
                values: Array.from(new Set(stories.map(s=>(s as any)[fk]||'').filter(Boolean))).sort() as string[]
              }
            })
          ].filter(f => f.values.length > 0)

          const totalFilterCount = filterPersonas.length + Object.values(filterAggregates).reduce((a,v)=>a+v.length,0)

          return (
            <div ref={filterBarRef} style={{ display:'flex', alignItems:'center', gap: T.sp.xs, flexWrap:'nowrap' }}>
              {filterFields.map(f => {
                const selected: string[] = f.isPersona ? filterPersonas : (filterAggregates[f.fieldKey] || [])
                const isOpen = openFilterField === f.id   // ← use id, never fieldKey
                const term = (filterSearch[f.id] || '').toLowerCase()
                const visible = term ? f.values.filter(v => v.toLowerCase().includes(term)) : f.values

                // Count per value across all stories
                const valueCounts: Record<string,number> = {}
                f.values.forEach(v => {
                  valueCounts[v] = stories.filter(s => f.isPersona ? s.persona === v : (s as any)[f.fieldKey] === v).length
                })

                return (
                  <div key={f.id} style={{ position:'relative' }}>
                    <button
                      onClick={() => { setOpenFilterField(isOpen ? null : f.id); setFilterSearch(prev=>({...prev,[f.id]:''})) }}
                      style={{ display:'flex', alignItems:'center', gap: 4, padding:'4px 9px', fontSize: T.fs.sm, fontFamily: T.fontFamily, cursor:'pointer', borderRadius: T.radius.sm, transition:'all 0.1s',
                        background: selected.length > 0 ? T.primaryLight : T.bg,
                        color: selected.length > 0 ? T.primary : T.textSecondary,
                        border: `1px solid ${selected.length > 0 ? T.primary : T.border}`,
                        fontWeight: selected.length > 0 ? 600 : 400 }}>
                      {f.label}
                      {selected.length > 0
                        ? <span style={{ background: T.primary, color: T.surface, borderRadius: T.radius.full, padding:'0 5px', fontSize: T.fs.xs, fontWeight:700, lineHeight:'16px', minWidth:16, textAlign:'center' }}>{selected.length}</span>
                        : <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                      }
                    </button>

                    {isOpen && (
                      <div style={{ position:'absolute', top:'calc(100% + 4px)', left:0, background: T.surface, border:`1px solid ${T.border}`, borderRadius: T.radius.lg, boxShadow: T.shadow.lg, zIndex:200, width:240, overflow:'hidden' }}>
                        {/* Search */}
                        <div style={{ padding:'8px 10px', borderBottom:`1px solid ${T.borderLight}` }}>
                          <div style={{ position:'relative' }}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={T.textMuted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ position:'absolute', left:8, top:'50%', transform:'translateY(-50%)', pointerEvents:'none' }}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                            <input autoFocus placeholder={`Search ${f.label}…`} value={filterSearch[f.id]||''}
                              onChange={e=>setFilterSearch(prev=>({...prev,[f.id]:e.target.value}))}
                              style={{ width:'100%', padding:'5px 8px 5px 26px', border:`1px solid ${T.border}`, borderRadius: T.radius.sm, fontSize: T.fs.xs, color: T.text, background: T.bg, boxSizing:'border-box' as const, fontFamily: T.fontFamily, outline:'none' }} />
                          </div>
                        </div>

                        {/* Value list */}
                        <div style={{ maxHeight:240, overflowY:'auto' }}>
                          {visible.length === 0 && (
                            <div style={{ padding:'12px 12px', fontSize: T.fs.xs, color: T.textMuted, textAlign:'center' }}>No matches</div>
                          )}
                          {visible.map(v => {
                            const active = selected.includes(v)
                            const cnt = valueCounts[v] || 0
                            return (
                              <label key={v} style={{ display:'flex', alignItems:'center', gap: 8, padding:'7px 12px', cursor:'pointer', borderBottom:`1px solid ${T.borderLight}` }}
                                onMouseEnter={e=>(e.currentTarget.style.background=T.bg)}
                                onMouseLeave={e=>(e.currentTarget.style.background='')}>
                                <input type="checkbox" checked={active} readOnly
                                  style={{ width:13, height:13, accentColor: T.primary, cursor:'pointer', flexShrink:0 }}
                                  onClick={()=>{
                                    if (f.isPersona) setFilterPersonas(prev => active ? prev.filter(x=>x!==v) : [...prev, v])
                                    else setFilterAggregates(prev => ({ ...prev, [f.fieldKey]: active ? (prev[f.fieldKey]||[]).filter(x=>x!==v) : [...(prev[f.fieldKey]||[]), v] }))
                                  }} />
                                <span style={{ flex:1, fontSize: T.fs.sm, color: active ? T.primary : T.text, fontWeight: active ? 600 : 400, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' as const }}>{v}</span>
                                <span style={{ fontSize: T.fs.xs, color: T.textMuted, flexShrink:0 }}>{cnt}</span>
                              </label>
                            )
                          })}
                        </div>

                        {/* Footer */}
                        {selected.length > 0 && (
                          <div style={{ padding:'6px 10px', borderTop:`1px solid ${T.borderLight}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                            <span style={{ fontSize: T.fs.xs, color: T.textMuted }}>{selected.length} selected</span>
                            <button onClick={()=>{ if(f.isPersona) setFilterPersonas([]); else setFilterAggregates(prev=>({...prev,[f.fieldKey]:[]})) }}
                              style={{ fontSize: T.fs.xs, color: T.danger, background:'none', border:'none', cursor:'pointer', fontWeight:600, padding:0 }}>Clear</button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}

              {/* Clear all */}
              {totalFilterCount > 0 && (
                <button onClick={()=>{setFilterPersonas([]);setFilterAggregates({});setOpenFilterField(null)}}
                  style={{ fontSize: T.fs.xs, color: T.textMuted, background:'none', border:'none', cursor:'pointer', padding:'4px 6px', fontFamily: T.fontFamily }}>
                  Clear all
                </button>
              )}
            </div>
          )
        })()}

        <div style={{ width:1, height:18, background: T.border, flexShrink:0 }} />

        {/* Reset */}
        <button onClick={() => {
          if (confirm('Reset plan? All story cards will be moved to the backlog. Stories keep their data but lose their sprint and stream assignments. This cannot be undone.')) {
            const reset = stories.map(s => ({ ...s, sprint: 'backlog', stream: 'backlog' }))
            updateStories(reset, streams)
          }
        }} style={{ padding:'4px 10px', fontSize: T.fs.sm, background:'none', color: T.danger, border:'none', cursor:'pointer', fontWeight:600, fontFamily: T.fontFamily }}>&#8634; Reset</button>

        <div style={{ flex:1 }} />
        <span style={{ fontSize: T.fs.xs, color: T.textMuted }}>Ctrl+scroll to zoom</span>
      </div>

      {/* ── TIER 3: Status Strip ── */}
      <div style={{ background: T.bg, display:'flex', alignItems:'center', padding:'5px 16px', gap: 0, borderBottom:`1px solid ${T.border}`, flexShrink:0, fontFamily: T.fontFamily }}>
        {(() => {
          const totalPts = stories.reduce((a,s)=>a+(s.pts||0),0)
          const plannedPts = stories.filter(s=>s.sprint!=='backlog'&&s.stream!=='backlog').reduce((a,s)=>a+(s.pts||0),0)
          const backlogPts = totalPts - plannedPts
          const plannedCount = stories.filter(s=>s.sprint!=='backlog'&&s.stream!=='backlog').length
          const backlogCount = stories.length - plannedCount
          const hasCPIssues = cpLate.length > 0
          const hasDepIssues = brokenDepIds.size > 0
          // Total board capacity from sprintCapacity config
          const boardCapacity = SPRINTS.reduce((total, sp) => {
            return total + streams.reduce((s2, stream) => {
              const key = `${stream.key}_${sp.key}`
              const cap = (sprintCapacity as any)[key] ?? (sprintCapacity as any)[sp.key] ?? 20
              return s2 + cap
            }, 0)
          }, 0)
          const overCapacity = plannedPts > boardCapacity && boardCapacity > 0

          const seg = (label: string, value: string, isAlert?: boolean, onClick?: ()=>void, title?: string) => (
            <div onClick={onClick} title={title} style={{ display:'flex', alignItems:'baseline', gap:5, padding:'0 14px', borderRight:`1px solid ${T.border}`, cursor: onClick?'pointer':'default', lineHeight:'22px', flexShrink:0 }}>
              <span style={{ fontSize: T.fs.xs, color: isAlert ? T.danger : T.textMuted, fontWeight:500, letterSpacing:'0.2px' }}>{label}</span>
              <span style={{ fontSize: T.fs.sm, color: isAlert ? T.danger : T.text, fontWeight:600 }}>{value}</span>
            </div>
          )
          return (
            <div style={{ display:'flex', alignItems:'center', flexWrap:'nowrap', overflow:'auto' }}>
              {seg('Stories', String(stories.length))}
              {/* ── Combined Story Points progress ── */}
              {(() => {
                const pct = totalPts > 0 ? Math.floor((plannedPts / totalPts) * 100) : 0
                return (
                  <div style={{ display:'flex', flexDirection:'column', justifyContent:'center', padding:'0 14px', borderRight:`1px solid ${T.border}`, gap:3, flexShrink:0 }}>
                    <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                      <span style={{ fontSize: T.fs.xs, color: T.textMuted, fontWeight:500, letterSpacing:'0.2px', whiteSpace:'nowrap' as const }}>Story Points</span>
                      <span style={{ fontSize: T.fs.xs, color: pct === 100 ? T.success : T.primary, fontWeight:600 }}>{pct}%</span>
                    </div>
                    <div style={{ height:3, borderRadius:99, background: T.borderLight, overflow:'hidden', minWidth:100 }}>
                      <div style={{ height:'100%', width:`${pct}%`, background: pct === 100 ? T.success : T.primary, borderRadius:99, transition:'width 0.4s ease' }} />
                    </div>
                    <div style={{ display:'flex', alignItems:'baseline', gap:4, whiteSpace:'nowrap' as const }}>
                      <span style={{ fontSize: T.fs.sm, color: T.text, fontWeight:600 }}>{fmtPts(plannedPts)}</span>
                      <span style={{ fontSize: T.fs.xs, color: T.textMuted }}>/ {fmtPts(totalPts)} pts planned</span>
                    </div>
                  </div>
                )
              })()}
              {backlogCount > 0 && seg('Backlog', `${fmtPts(backlogPts)} pts`)}
              {boardCapacity > 0 && seg('Board Capacity', `${fmtPts(boardCapacity)} pts`, overCapacity, ()=>window.open('/settings#capacity','_blank'), `Total capacity set in Settings → Sprint Capacity`)}
              {seg('Critical Path', hasCPIssues ? `${cpLate.length} at risk` : 'On Track', hasCPIssues, ()=>{setView('deps' as ViewMode);localStorage.setItem('flashpro_view','deps')}, hasCPIssues ? cpLate.map(s=>s.id).join(', ') : undefined)}
              {seg('Dependencies', hasDepIssues ? `${brokenDepIds.size} broken` : 'All Clear', hasDepIssues, ()=>{setView('deps' as ViewMode);localStorage.setItem('flashpro_view','deps')}, hasDepIssues ? Array.from(brokenDepIds).join(', ') : undefined)}
              {activeUsers.length > 0 && (
                <div style={{ display:'flex', alignItems:'center', gap:3, padding:'0 14px', flexShrink:0 }}>
                  {activeUsers.slice(0,5).map((u,i) => (
                    <div key={u.email} title={u.name}
                      style={{ width:18, height:18, borderRadius: T.radius.full, background:u.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:8, fontWeight:600, color: T.surface, border:`2px solid ${T.bg}`, marginLeft: i>0?-5:0 }}>
                      {u.name[0].toUpperCase()}
                    </div>
                  ))}
                  <span style={{ fontSize: T.fs.xs, color: T.textMuted }}>{activeUsers.length} online</span>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      <div style={{ display:'flex', flex:1, overflow:'hidden' }}>

        {/* ── Backlog — vertical left panel ── */}
        <div
          onDragOver={e=>{ e.preventDefault(); e.stopPropagation(); setDragOver('__backlog__') }}
          onDragLeave={e=>{ e.stopPropagation(); setDragOver(null) }}
          onDrop={e=>{
            e.preventDefault(); e.stopPropagation()
            setDragOver(null)
            const id = (e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('Text') || draggingRef.current || dragging)
            setDragging(null)
            draggingRef.current = null
            if (!id) return
            if (view === 'action' && id.includes('__')) {
              const [action, persona] = id.split('__')
              const ids = stories.filter(s => s.action === action && s.persona === persona).map(s => s.id)
              if (ids.length) moveIds(ids, 'backlog', 'backlog')
              return
            }
            if (view === 'goal' || view !== 'story' && !id.includes('__') && stories.some(s => s.goal === id)) {
              const ids = stories.filter(s => s.goal === id).map(s => s.id)
              if (ids.length) { moveIds(ids, 'backlog', 'backlog'); return }
            }
            moveIds([id], 'backlog', 'backlog')
          }}
          style={{ width: showBacklog ? 240 : 32, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', background: dragOver==='__backlog__' ? T.primaryLight : T.bg, flexShrink:0, outline: dragOver==='__backlog__' ? `2px dashed ${T.primary}` : 'none', transition:'width 0.2s, background 0.1s' }}>
          <div style={{ padding: T.sp.sm, borderBottom:`1px solid ${T.border}`, background: T.surface, display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer' }} onClick={()=>setShowBacklog(p=>!p)}>
            {showBacklog ? <>
              <div>
                <div style={{ fontSize: T.fs.md, fontWeight:600, color: T.text }}>Backlog</div>
                <div style={{ fontSize: T.fs.xs, color: T.textMuted, marginTop:1 }}>{unassigned.length} &middot; {fmtPts(unassigned.reduce((a,s)=>a+(s.pts||0),0))} pts</div>
              </div>
              <span style={{ fontSize: T.fs.md, color: T.textMuted }}>&lsaquo;</span>
            </> : <span style={{ fontSize: T.fs.md, color: T.textMuted, transform:'rotate(180deg)', display:'block' }}>&lsaquo;</span>}
          </div>
          {showBacklog && <div style={{ flex:1, overflowY:'auto', padding: T.sp.sm, display:'flex', flexDirection:'column', gap: T.sp.xs }}>
            {/* Empty state */}
            {stories.length === 0 && (
              <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding: T.sp.xxl, textAlign:'center' }}>
                <div style={{ fontSize: 32, marginBottom: T.sp.md }}>&#9889;</div>
                <div style={{ fontSize: T.fs.lg, fontWeight:600, color: T.text, marginBottom: T.sp.sm }}>Welcome to FlashPro</div>
                <div style={{ fontSize: T.fs.base, color: T.textSecondary, marginBottom: T.sp.xl, lineHeight:1.5 }}>Plan your releases across parallel streams</div>
                <div style={{ display:'flex', flexDirection:'column', gap: T.sp.sm, width:'100%' }}>
                  <button onClick={()=>{ setShowImportModal(true); setImportFeedback(null) }} style={{ padding:`${T.sp.sm}px ${T.sp.md}px`, background: T.primary, color: T.surface, borderRadius: T.radius.md, cursor:'pointer', fontWeight:600, fontSize: T.fs.sm, textAlign:'center', border:'none', fontFamily: T.fontFamily }}>
                    Import Story Map
                  </button>
                  <a href="/intro" style={{ padding:`${T.sp.sm}px ${T.sp.md}px`, background: T.bg, color: T.textSecondary, borderRadius: T.radius.md, border:`1px solid ${T.border}`, fontSize: T.fs.sm, textAlign:'center', textDecoration:'none' }}>Setup Guide</a>
                </div>
              </div>
            )}
            {getBacklogCards().map((card:any) => {
              const isCPcard = view==='story' && CRITICAL_PATH.has(card.key)
              const cardBrokenDep = view==='story' && brokenDepIds.has(card.key)
              const isSplitChild = view==='story' && stories.find(s=>s.id===card.key)?.isSplitChild
              // Determine left border
              const leftBorderColor = isCPcard ? T.danger : cardBrokenDep ? T.warning : isSplitChild ? T.accent : 'transparent'
              return (
                <div key={card.key}
                  draggable onDragStart={e=>onDragStart(e, card.key)} onDragEnd={()=>{ setDragging(null); draggingRef.current=null; setDragOver(null); setDragOverCard(null) }}
                  style={{ background: T.surface, border:`1px solid ${T.border}`, borderLeft: leftBorderColor !== 'transparent' ? `3px solid ${leftBorderColor}` : `1px solid ${T.border}`, borderRadius: T.radius.md, padding: T.sp.sm, cursor:'grab',
                    boxShadow: T.shadow.sm }}>
                  {/* Line 1: ID + badges + pts */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:2 }}>
                    <div style={{ display:'flex', gap: T.sp.xs, alignItems:'center', minWidth:0 }}>
                      <span style={{ fontSize: T.fs.sm, fontWeight:600, color: T.text, fontFamily: view==='story' ? T.fontMono : T.fontFamily, flexShrink:0 }}>{card.label}</span>
                      {isCPcard && <span style={{ fontSize: T.fs.xs, background: T.danger, color: T.surface, padding:'1px 4px', borderRadius: T.radius.sm, fontWeight:600, flexShrink:0 }}>CP</span>}
                    </div>
                    <span style={{ fontSize: T.fs.xs, color: T.textMuted, fontWeight:600, flexShrink:0 }}>{card.pts} pts</span>
                  </div>
                  {/* Line 2: Headline */}
                  <div style={{ fontSize: T.fs.sm, color: T.textSecondary, lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{card.sub}</div>
                  {/* Line 3: Persona badge + size badge + action */}
                  <div style={{ display:'flex', alignItems:'center', gap: T.sp.xs, marginTop:3, flexWrap:'nowrap', overflow:'hidden' }}>
                    {/* BUG-02 fix: styled persona pill in backlog */}
                    {card.persona && (
                      <span style={{ fontSize:9, fontWeight:600, padding:'1px 5px', borderRadius: T.radius.full, background: PERSONA_BG[card.persona] || T.borderLight, color: PERSONA_COLOR[card.persona] || T.textMuted, flexShrink:0, lineHeight:'14px' }}>
                        {card.persona}
                      </span>
                    )}
                    {/* BUG-01 fix: size badge in backlog */}
                    {view==='story' && (card as any).size && SIZE_COLOR[(card as any).size] && (
                      <span style={{ fontSize:9, fontWeight:600, padding:'1px 5px', borderRadius: T.radius.full, color: SIZE_COLOR[(card as any).size], border:`1px solid ${SIZE_COLOR[(card as any).size]}40`, flexShrink:0, lineHeight:'14px' }}>
                        {(card as any).size}
                      </span>
                    )}
                    {view==='story' && card.action && (
                      <span style={{ fontSize: T.fs.xs, color: T.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{card.action}</span>
                    )}
                  </div>
                </div>
              )
            })}
            {unassigned.length === 0 && stories.length > 0 && <div style={{ textAlign:'center', color: T.textMuted, fontSize: T.fs.sm, padding: T.sp.xl }}>All planned!</div>}
          </div>}
        </div>

        {/* ── Main 2D Grid or Deps view ── */}
        <div ref={boardRef} style={{ flex:1, overflow:'hidden', display:'flex', flexDirection:'column', position:'relative' }}>
          {/* Zoom controls */}
          <div style={{ position:'absolute', bottom: T.sp.md, right: T.sp.md, zIndex:20, display:'flex', gap: T.sp.xs, alignItems:'center', background: T.surface, border:`1px solid ${T.border}`, borderRadius: T.radius.md, padding:'3px 6px', boxShadow: T.shadow.md }}>
            <button onClick={()=>setZoom(z=>Math.max(0.4,z-0.1))} style={{ border:'none', background:'none', cursor:'pointer', fontSize: T.fs.md, color: T.textSecondary, lineHeight:1 }}>&minus;</button>
            <span style={{ fontSize: T.fs.sm, color: T.textSecondary, minWidth:36, textAlign:'center' }}>{Math.round(zoom*100)}%</span>
            <button onClick={()=>setZoom(z=>Math.min(2,z+0.1))} style={{ border:'none', background:'none', cursor:'pointer', fontSize: T.fs.md, color: T.textSecondary, lineHeight:1 }}>+</button>
            <button onClick={()=>setZoom(1)} style={{ border:'none', background:'none', cursor:'pointer', fontSize: T.fs.xs, color: T.textMuted }}>reset</button>
          </div>
          <div style={{ flex:1, overflow:'auto' }}>
          <div style={{ zoom: zoom } as React.CSSProperties}>
        {/* ── Gantt Chart View ── */}
        {view === 'gantt' && (() => {
          // Grouping options: stream | action | goal | persona | workflow | story
          const GROUP_OPTIONS = [
            { value: 'stream', label: 'Stream' },
            { value: 'action', label: 'Action' },
            { value: 'goal', label: 'Goal' },
            { value: 'persona', label: 'Persona' },
            ...aggregates.filter(a => !['Action','Goal'].includes(a)).map(a => ({ value: a.toLowerCase(), label: a })),
          ]

          // Build rows: each unique value of the groupBy field
          const groupField = ganttGroupBy === 'stream' ? 'stream' : ganttGroupBy
          const rows: { key: string; label: string; color: string }[] = []
          const rowSet = new Set<string>()
          if (ganttGroupBy === 'stream') {
            streams.forEach(s => { rows.push({ key: s.key, label: s.name, color: s.color }); rowSet.add(s.key) })
          } else {
            const streamColors: Record<string, string> = {}
            streams.forEach(s => { streamColors[s.key] = s.color })
            filtered.forEach(s => {
              const val = (s as any)[groupField] || 'Other'
              if (!rowSet.has(val)) {
                rowSet.add(val)
                const color = streamColors[s.stream] || T.primary
                rows.push({ key: val, label: val, color })
              }
            })
          }

          // SPRINT_COL_W: width of each sprint column in the Gantt
          const COL_W = 160
          const ROW_H = 40
          const LABEL_W = 180

          return (
            <div style={{ padding:`${T.sp.lg}px ${T.sp.xl}px`, fontFamily: T.fontFamily }}>
              {/* Gantt toolbar */}
              <div style={{ display:'flex', alignItems:'center', gap: T.sp.md, marginBottom: T.sp.lg, flexWrap:'wrap' }}>
                <div style={{ display:'flex', alignItems:'center', gap: T.sp.sm }}>
                  <span style={{ fontSize: T.fs.sm, fontWeight:600, color: T.text }}>Group by</span>
                  <select value={ganttGroupBy} onChange={e => setGanttGroupBy(e.target.value)}
                    style={{ padding:'4px 8px', fontSize: T.fs.sm, border:`1px solid ${T.border}`, borderRadius: T.radius.sm, background: T.bg, color: T.text, fontFamily: T.fontFamily, cursor:'pointer' }}>
                    {GROUP_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <button onClick={() => {
                  // Pure SVG export — no external libraries, no print dialog, no canvg
                  const groupLabel = GROUP_OPTIONS.find(o => o.value === ganttGroupBy)?.label || ''
                  const title = `${currentProject || 'Release Plan'} — Gantt Chart`
                  const filename = `${filePrefix}Gantt Chart.svg`

                  // Layout constants (px, SVG units ≈ px)
                  const MARGIN = 24
                  const LABEL_W_SVG = 200
                  const COL_W_SVG = 160
                  const ROW_H_SVG = 36
                  const HEADER_H_SVG = 48
                  const TITLE_H = 40
                  const totalW = MARGIN * 2 + LABEL_W_SVG + SPRINTS.length * COL_W_SVG
                  const totalH = MARGIN + TITLE_H + HEADER_H_SVG + rows.length * ROW_H_SVG + ROW_H_SVG + MARGIN

                  const e = (s: string) => s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')

                  // Pre-compute backlog stories (needed for outer border height calculation)
                  const backlogStories2 = filtered.filter((s: Story) => !s.sprint || s.sprint === 'backlog')

                  // QA5-3 fix: all colours from T tokens — no hardcoded hex
                  // Nav/header bg uses navBg (dark navy), text from T.text/T.textSecondary/T.textMuted
                  const SVG_HDR_BG    = '#1e3a5f'  // dark navy header — no T token, kept as SVG-specific design constant
                  const SVG_HDR_DIV   = '#2d4f7a'  // header column divider — SVG-specific
                  const SVG_DATE_COL  = '#BAC8FF'  // date label on dark header — SVG-specific (periwinkle)

                  // Build SVG elements
                  const parts: string[] = []

                  // Title — uses T.text and T.textSecondary
                  parts.push(`<text x="${MARGIN}" y="${MARGIN + 18}" font-family="Inter,system-ui,sans-serif" font-size="15" font-weight="600" fill="${T.text}">${e(title)}</text>`)
                  parts.push(`<text x="${MARGIN}" y="${MARGIN + 32}" font-family="Inter,system-ui,sans-serif" font-size="10" fill="${T.textSecondary}">Grouped by: ${e(groupLabel)}</text>`)

                  const tableY = MARGIN + TITLE_H

                  // Header row background
                  parts.push(`<rect x="${MARGIN}" y="${tableY}" width="${totalW - MARGIN*2}" height="${HEADER_H_SVG}" fill="${SVG_HDR_BG}" rx="4"/>`)

                  // Header: label column
                  parts.push(`<text x="${MARGIN + 12}" y="${tableY + HEADER_H_SVG/2 + 4}" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="600" fill="${T.surface}">${e(groupLabel)}</text>`)

                  // Header: sprint columns
                  SPRINTS.forEach((sp, idx) => {
                    const x = MARGIN + LABEL_W_SVG + idx * COL_W_SVG
                    const dateLabel = getSprintDateLabel(idx)
                    parts.push(`<text x="${x + COL_W_SVG/2}" y="${tableY + 18}" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="700" fill="${T.surface}" text-anchor="middle">${e(sp.label)}</text>`)
                    if (dateLabel) parts.push(`<text x="${x + COL_W_SVG/2}" y="${tableY + 33}" font-family="Inter,system-ui,sans-serif" font-size="9" fill="${SVG_DATE_COL}" text-anchor="middle">${e(dateLabel)}</text>`)
                    // Column divider
                    parts.push(`<line x1="${x}" y1="${tableY}" x2="${x}" y2="${tableY + HEADER_H_SVG}" stroke="${SVG_HDR_DIV}" stroke-width="1"/>`)
                  })

                  // Data rows — uses T.bg/T.surface/T.text/T.textMuted/T.border
                  rows.forEach((row, rowIdx) => {
                    const rowY = tableY + HEADER_H_SVG + rowIdx * ROW_H_SVG
                    const rowBgFill = rowIdx % 2 === 0 ? T.bg : T.surface
                    const pastel = toPastel(row.color)
                    parts.push(`<rect x="${MARGIN}" y="${rowY}" width="${totalW - MARGIN*2}" height="${ROW_H_SVG}" fill="${rowBgFill}"/>`)
                    // Row bottom border — T.border
                    parts.push(`<line x1="${MARGIN}" y1="${rowY + ROW_H_SVG}" x2="${totalW - MARGIN}" y2="${rowY + ROW_H_SVG}" stroke="${T.border}" stroke-width="1"/>`)
                    // Row label dot
                    parts.push(`<circle cx="${MARGIN + 16}" cy="${rowY + ROW_H_SVG/2}" r="4" fill="${row.color}"/>`)
                    const rowStories2 = filtered.filter((s: Story) => ganttGroupBy === 'stream' ? s.stream === row.key : ((s as any)[groupField] || 'Other') === row.key)
                    const totalRowPts2 = rowStories2.reduce((a: number, s: Story) => a + (s.pts || 0), 0)
                    parts.push(`<text x="${MARGIN + 26}" y="${rowY + ROW_H_SVG/2 + 4}" font-family="Inter,system-ui,sans-serif" font-size="11" font-weight="600" fill="${T.text}">${e(row.label.substring(0,24))}${row.label.length>24?'…':''}</text>`)
                    if (totalRowPts2 > 0) parts.push(`<text x="${MARGIN + LABEL_W_SVG - 8}" y="${rowY + ROW_H_SVG/2 + 4}" font-family="Inter,system-ui,sans-serif" font-size="9" fill="${T.textMuted}" text-anchor="end">(${fmtPts(totalRowPts2)})</text>`)
                    // Sprint cells
                    const rowSprintGroups: Record<string, Story[]> = {}
                    rowStories2.forEach((s: Story) => { const k = s.sprint||'backlog'; if (!rowSprintGroups[k]) rowSprintGroups[k]=[]; rowSprintGroups[k].push(s) })
                    SPRINTS.forEach((sp, idx) => {
                      const x = MARGIN + LABEL_W_SVG + idx * COL_W_SVG
                      parts.push(`<line x1="${x}" y1="${rowY}" x2="${x}" y2="${rowY+ROW_H_SVG}" stroke="${T.border}" stroke-width="1"/>`)
                      const cell = rowSprintGroups[sp.key] || []
                      if (cell.length > 0) {
                        const cellPts2 = cell.reduce((a: number, s: Story) => a + (s.pts||0), 0)
                        const barX = x + 4, barY = rowY + 5, barW = COL_W_SVG - 8, barH = ROW_H_SVG - 10
                        parts.push(`<rect x="${barX}" y="${barY}" width="${barW}" height="${barH}" fill="${pastel.bg}" stroke="${pastel.border}" stroke-width="1" rx="3"/>`)
                        const cellLabel = cell.length === 1 ? cell[0].headline.substring(0, 18) + (cell[0].headline.length > 18 ? '…' : '') : `${cell.length} stories`
                        parts.push(`<text x="${barX + 6}" y="${barY + barH/2 + 3.5}" font-family="Inter,system-ui,sans-serif" font-size="9" font-weight="600" fill="${pastel.text}">${e(cellLabel)}</text>`)
                        parts.push(`<text x="${barX + barW - 5}" y="${barY + barH/2 + 3.5}" font-family="Inter,system-ui,sans-serif" font-size="8" font-weight="700" fill="${pastel.text}" text-anchor="end">${fmtPts(cellPts2)}</text>`)
                      }
                    })
                  })

                  // Backlog row — T.borderLight/T.textMuted
                  if (backlogStories2.length > 0) {
                    const rowY = tableY + HEADER_H_SVG + rows.length * ROW_H_SVG
                    parts.push(`<rect x="${MARGIN}" y="${rowY}" width="${totalW - MARGIN*2}" height="${ROW_H_SVG}" fill="${T.borderLight}"/>`)
                    parts.push(`<text x="${MARGIN + 12}" y="${rowY + ROW_H_SVG/2 + 4}" font-family="Inter,system-ui,sans-serif" font-size="10" fill="${T.textMuted}" font-style="italic">Backlog: ${backlogStories2.length} stories · ${fmtPts(backlogStories2.reduce((a:number,s:Story)=>a+(s.pts||0),0))} pts unplanned</text>`)
                  }

                  // Outer border — T.border
                  parts.push(`<rect x="${MARGIN}" y="${tableY}" width="${totalW - MARGIN*2}" height="${HEADER_H_SVG + rows.length * ROW_H_SVG + (backlogStories2.length>0?ROW_H_SVG:0)}" fill="none" stroke="${T.border}" stroke-width="1" rx="4"/>`)

                  const svgContent = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${totalW}" height="${totalH}" viewBox="0 0 ${totalW} ${totalH}">
  <rect width="${totalW}" height="${totalH}" fill="${T.surface}"/>
  ${parts.join('\n  ')}
</svg>`

                  const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url; a.download = filename; a.click()
                  setTimeout(() => URL.revokeObjectURL(url), 1000)
                }}
                  style={{ padding:'5px 12px', fontSize: T.fs.sm, background: T.primary, color: T.surface, border:'none', borderRadius: T.radius.sm, cursor:'pointer', fontWeight:600, fontFamily: T.fontFamily, display:'flex', alignItems:'center', gap: T.sp.xs }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  Download SVG
                </button>
              </div>

              {/* Gantt table */}
              <div ref={ganttRef} style={{ overflowX:'auto' }}>
                <table style={{ borderCollapse:'collapse', minWidth: LABEL_W + SPRINTS.length * COL_W }}>
                  <thead>
                    <tr>
                      <th style={{ width: LABEL_W, minWidth: LABEL_W, padding:'8px 12px', background:'#1e3a5f', color:'#fff', fontSize: T.fs.sm, fontWeight:600, textAlign:'left', borderRight:`1px solid #2d4f7a`, position:'sticky', left:0, zIndex:2 }}>
                        {GROUP_OPTIONS.find(o=>o.value===ganttGroupBy)?.label || 'Group'}
                      </th>
                      {SPRINTS.map((sp, idx) => {
                        const dateLabel = getSprintDateLabel(idx)
                        return (
                          <th key={sp.key} style={{ width: COL_W, minWidth: COL_W, padding:'6px 8px', background:'#1e3a5f', color:'#fff', fontSize: T.fs.xs, fontWeight:600, textAlign:'center', borderRight:`1px solid #2d4f7a`, whiteSpace:'nowrap' }}>
                            <div style={{ fontWeight:700, fontSize: T.fs.sm }}>{sp.label}</div>
                            {dateLabel && <div style={{ fontSize:10, opacity:0.8, marginTop:2 }}>{dateLabel}</div>}
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row, rowIdx) => {
                      const rowBg = rowIdx % 2 === 0 ? T.bg : T.surface
                      // Stories for this row
                      const rowStories = filtered.filter(s => {
                        if (ganttGroupBy === 'stream') return s.stream === row.key
                        return ((s as any)[groupField] || 'Other') === row.key
                      })
                      // Group by sprint
                      const sprintGroups: Record<string, typeof rowStories> = {}
                      rowStories.forEach(s => {
                        const sp = s.sprint === 'backlog' ? 'backlog' : s.sprint
                        if (!sprintGroups[sp]) sprintGroups[sp] = []
                        sprintGroups[sp].push(s)
                      })
                      const totalPts = rowStories.reduce((a, s) => a + (s.pts || 0), 0)
                      const pastel = toPastel(row.color)
                      return (
                        <tr key={row.key}>
                          <td style={{ padding:'6px 12px', fontSize: T.fs.sm, fontWeight:600, borderRight:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, background: rowBg, position:'sticky', left:0, zIndex:1, maxWidth: LABEL_W, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                            <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                              <span style={{ width:8, height:8, borderRadius:'50%', background: row.color, flexShrink:0 }} />
                              <span style={{ overflow:'hidden', textOverflow:'ellipsis', color: T.text }}>{row.label}</span>
                              {totalPts > 0 && <span style={{ fontSize:10, color:T.textMuted, flexShrink:0 }}>({fmtPts(totalPts)}pts)</span>}
                            </div>
                          </td>
                          {SPRINTS.map(sp => {
                            const cellStories = sprintGroups[sp.key] || []
                            const cellPts = cellStories.reduce((a, s) => a + (s.pts || 0), 0)
                            const cap = streams.reduce((a, s) => a + getCapacity(s.key, sp.key), 0)
                            const over = cellPts > cap && cap > 0
                            return (
                              <td key={sp.key} style={{ padding:'4px 6px', borderRight:`1px solid ${T.border}`, borderBottom:`1px solid ${T.border}`, background: rowBg, verticalAlign:'middle', height: ROW_H, minWidth: COL_W }}>
                                {cellStories.length > 0 && (
                                  // Pastel bar: soft background, dark text, coloured border
                                  <div style={{ background: pastel.bg, border:`1px solid ${pastel.border}`, borderRadius: T.radius.sm, padding:'3px 8px', fontSize: T.fs.xs, color: pastel.text, fontWeight:600, display:'flex', justifyContent:'space-between', alignItems:'center', gap:4 }}>
                                    <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', flex:1 }}>
                                      {cellStories.length === 1 ? cellStories[0].headline.substring(0, 30) + (cellStories[0].headline.length > 30 ? '…' : '') : `${cellStories.length} stories`}
                                    </span>
                                    <span style={{ flexShrink:0, fontSize:10, background: over ? '#FEF3C7' : 'rgba(0,0,0,0.06)', borderRadius:3, padding:'1px 4px', color: over ? T.warning : pastel.text, fontWeight:700 }}>
                                      {fmtPts(cellPts)}pts
                                    </span>
                                  </div>
                                )}
                              </td>
                            )
                          })}
                        </tr>
                      )
                    })}
                    {/* Backlog row */}
                    {(() => {
                      const backlogStories = filtered.filter(s => !s.sprint || s.sprint === 'backlog')
                      if (!backlogStories.length) return null
                      const rowBg = rows.length % 2 === 0 ? T.bg : T.surface
                      return (
                        <tr key="backlog">
                          <td colSpan={SPRINTS.length + 1} style={{ padding:'6px 12px', fontSize: T.fs.xs, color: T.textMuted, borderTop:`2px solid ${T.border}`, background: rowBg, fontStyle:'italic' }}>
                            Backlog: {backlogStories.length} stories · {fmtPts(backlogStories.reduce((a,s)=>a+(s.pts||0),0))} pts unplanned
                          </td>
                        </tr>
                      )
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })()}

        {view === 'deps' && (
          <div style={{ padding: T.sp.xl }}>
            <h2 style={{ margin:`0 0 ${T.sp.sm}px`, fontSize: T.fs.lg, color: T.text }}>Dependency Map</h2>
            <p style={{ margin:`0 0 ${T.sp.lg}px`, fontSize: T.fs.sm, color: T.textSecondary }}>Stories with hard blockers. Red = blocker not yet planned before this story.</p>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize: T.fs.sm }}>
              <thead>
                <tr style={{ background: T.bg }}>
                  {['Story','Headline','Sprint','Depends On','Status'].map(h=>(
                    <th key={h} style={{ padding:'8px 10px', textAlign:'left', borderBottom:`2px solid ${T.border}`, color: T.textSecondary, fontWeight:600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {Object.entries(STORY_DEPS_VIEW).map(([sid, deps]:any) => {
                  const story = stories.find(s=>s.id===sid)
                  if (!story) return null
                  const storyOrder = SPRINT_NUM[story.sprint] || 999
                  const broken = deps.filter((depId:string) => {
                    const dep = stories.find(s=>s.id===depId)
                    if (!dep) return false
                    return (SPRINT_NUM[dep.sprint]||999) > storyOrder
                  })
                  return (
                    <tr key={sid} style={{ borderBottom:`1px solid ${T.border}`, background: broken.length>0 ? T.dangerBg : T.surface }}>
                      <td style={{ padding:'6px 10px', fontFamily: T.fontMono, fontWeight:600, color: CRITICAL_PATH.has(sid) ? T.danger : T.text }}>
                        {sid}{CRITICAL_PATH.has(sid)&&<span style={{ fontSize: T.fs.xs, background: T.danger, color: T.surface, padding:'1px 3px', borderRadius: T.radius.sm, marginLeft:4 }}>CP</span>}
                      </td>
                      <td style={{ padding:'6px 10px', color: T.text }}>{story.headline}</td>
                      <td style={{ padding:'6px 10px', color: T.textSecondary }}>{story.sprint==='backlog'?'Backlog':story.sprint.replace('sprint','Sprint ')}</td>
                      <td style={{ padding:'6px 10px', color: T.textSecondary }}>
                        {deps.map((depId:string)=>{
                          const dep = stories.find(s=>s.id===depId)
                          const isBroken = dep && (SPRINT_NUM[dep.sprint]||999) > storyOrder
                          return <span key={depId} style={{ display:'inline-block', margin:'1px 3px', padding:'1px 6px', borderRadius: T.radius.sm, fontSize: T.fs.sm,
                            background: isBroken ? T.dangerBg : T.successBg, color: isBroken ? T.danger : T.success, fontFamily: T.fontMono, fontWeight:600 }}>{depId}</span>
                        })}
                      </td>
                      <td style={{ padding:'6px 10px' }}>
                        {broken.length>0
                          ? <span style={{ color: T.danger, fontSize: T.fs.sm, fontWeight:600 }}>{broken.length} blocker{broken.length>1?'s':''} planned later</span>
                          : <span style={{ color: T.success, fontSize: T.fs.sm }}>OK</span>
                        }
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
        {view !== 'deps' && view !== 'gantt' && (<>

          {/* Sprint header row */}
          <div style={{ display:'grid', gridTemplateColumns:`120px repeat(${SPRINTS.length}, minmax(200px,1fr))`, background: T.surface, position:'sticky', top:0, zIndex:10, borderBottom:`1px solid ${T.border}` }}>
            <div style={{ padding:`${T.sp.sm}px ${T.sp.sm}px`, fontSize: T.fs.sm, color: T.textMuted, borderRight:`1px solid ${T.border}`, fontWeight:600 }}>Stream / Sprint</div>
            {SPRINTS.map((sp, idx) => {
              const totals = getSprintTotals(sp.key)
              const totalCap = streams.reduce((a, s) => a + getCapacity(s.key, sp.key), 0)
              const sprintOver = totals.pts > totalCap && totalCap > 0
              const dateLabel = getSprintDateLabel(idx)
              return (
                <div key={sp.key} style={{ padding:`${T.sp.sm}px ${T.sp.sm}px`, borderRight:`1px solid ${T.border}`, display:'flex', flexDirection:'column', alignItems:'flex-start', background: T.surface, borderBottom:`1px solid ${T.border}` }}>
                  <span style={{ fontSize: T.fs.md, fontWeight:600, color: sprintOver ? T.warning : T.text }}>{sp.label}</span>
                  {dateLabel && <span style={{ fontSize: T.fs.xs, color: T.primary, marginTop:1, fontWeight:500 }}>{dateLabel}</span>}
                  <span style={{ fontSize: T.fs.xs, color: sprintOver ? T.warning : T.textMuted, marginTop:1, fontWeight: sprintOver ? 700 : 400 }}>
                    {fmtPts(totals.pts)}/{totalCap} pts
                  </span>
                </div>
              )
            })}
          </div>

          {/* Stream rows */}
          {streams.map(stream => (
            <div key={stream.key} style={{ display:'grid', gridTemplateColumns:`120px repeat(${SPRINTS.length}, minmax(200px,1fr))`, borderBottom:`1px solid ${T.border}`, alignItems:'stretch' }}>

              {/* Stream label */}
              <div className="stream-label" style={{ padding:0, borderRight:`1px solid ${T.border}`, background: T.surface, display:'flex', alignItems:'stretch', position:'sticky', left:0, zIndex:5, overflow:'hidden' }}>
                <span style={{ width:3, background:stream.color, flexShrink:0 }} />
                <div style={{ flex:1, minWidth:0, padding:`${T.sp.sm}px ${T.sp.sm}px`, display:'flex', flexDirection:'column', justifyContent:'center', position:'relative' }}>
                  <div style={{ fontSize: T.fs.sm, fontWeight:600, color: stream.color, lineHeight:1.3, wordBreak:'break-word' }}>{stream.name}</div>
                  {stream.description && <div style={{ fontSize: T.fs.xs, color: T.textMuted, marginTop:2, lineHeight:1.3, wordBreak:'break-word' }}>{stream.description}</div>}
                  <button onClick={()=>startEditStream(stream)} className="stream-edit-btn"
                    style={{ marginTop: T.sp.xs, padding:'2px 6px', fontSize: T.fs.xs, background:'transparent', color: T.textMuted, border:`1px solid ${T.border}`, borderRadius: T.radius.sm, cursor:'pointer', alignSelf:'flex-start', opacity:0, transition:'opacity 0.15s' }}
                    onMouseEnter={e=>(e.currentTarget.style.opacity='1')}
                    >&#9998;</button>
                </div>
              </div>

              {/* Sprint cells */}
              {SPRINTS.map(sp => {
                const cellKey = `${sp.key}__${stream.key}`
                const cards = getCellCards(sp.key, stream.key)
                const cellPts = getCellPts(sp.key, stream.key)
                return (
                  <div key={sp.key}
                    onDragOver={e=>{ e.preventDefault(); setDragOver(cellKey) }}
                    onDragLeave={()=>setDragOver(null)}
                    onDrop={e=>onDrop(e, sp.key, stream.key)}
                    style={{
                      borderRight:`1px solid ${T.border}`, padding: T.sp.xs,
                      display:'flex', flexDirection:'column', gap:3,
                      background: dragOver===cellKey ? T.primaryLight : T.surface,
                      borderTop: isCellOver(sp.key, stream.key) ? `2px solid ${T.warning}` : 'none',
                      outline: dragOver===cellKey ? `2px dashed ${T.primary}` : 'none',
                      transition:'background 0.1s', minHeight:80,
                      alignSelf:'stretch', overflow:'visible'
                    }}>
                    {/* Cell pts indicator */}
                    {cards.length > 0 && (() => {
                      const over = isCellOver(sp.key, stream.key)
                      const cap = getCapacity(stream.key, sp.key)
                      return (
                        <div style={{ display:'flex', justifyContent:'flex-end', padding:'0 2px' }}>
                          <span style={{ fontSize: T.fs.xs, fontWeight: over?700:400, color: over ? T.warning : T.textMuted }}>
                            {fmtPts(cellPts)}/{cap} pts
                          </span>
                        </div>
                      )
                    })()}
                    {/* Cards */}
                    <div style={{ display:'flex', flexWrap:'wrap', gap:3, alignContent:'flex-start', width:'100%' }}>
                    {cards.map(card => {
                      const isCP = CRITICAL_PATH.has(card.key)
                      const isSplit = card.totalParts > 1
                      const storyObj = view==='story' ? stories.find(s=>s.id===card.key) : null
                      const isSplitChild = storyObj?.isSplitChild || false
                      const splitParentId = storyObj?.originalStoryId
                      const cardBroken = view === 'story'
                        ? brokenDepIds.has(card.key)
                        : (card.ids || []).some((id: string) => brokenDepIds.has(id))
                      const brokenList = view === 'story'
                        ? getBrokenDeps(card.key)
                        : (card.ids || []).flatMap((id: string) => getBrokenDeps(id))

                      // Left border color: CP=red, broken dep=orange, split=yellow
                      const leftBorderColor = isCP ? T.danger : cardBroken ? T.warning : isSplit ? T.accent : 'transparent'

                      return (
                        <div key={card.key}
                          draggable
                          onDragStart={e=>onDragStart(e, card.key)}
                          onDragEnd={()=>{ setDragging(null); draggingRef.current=null; setDragOver(null); setDragOverCard(null) }}
                          onDragOver={e=>{ e.preventDefault(); setDragOverCard(card.key) }}
                          onDragLeave={e=>{ setDragOverCard(null) }}
                          onDrop={e=>{
                            e.preventDefault()
                            setDragOverCard(null)
                            const draggedId = (e.dataTransfer.getData('text/plain') || e.dataTransfer.getData('Text') || draggingRef.current || dragging)
                            if (!draggedId || draggedId === card.key) { e.stopPropagation(); return }
                            const draggedStory = stories.find(s => s.id === draggedId)
                            const targetStory = stories.find(s => s.id === card.key)
                            if (draggedStory && targetStory &&
                                draggedStory.sprint === targetStory.sprint &&
                                draggedStory.stream === targetStory.stream) {
                              e.stopPropagation()
                              reorderCard(draggedId, card.key)
                              setDragging(null)
                            }
                          }}
                          title={(() => {
                            const storyMap2: Record<string,Story> = {}
                            stories.forEach(s => { storyMap2[s.id] = s })
                            const cardStoryIds: string[] = view === 'story' ? [card.key] : (card.ids || [])
                            const depLines: string[] = []
                            let hasDeps = false
                            let hasBroken = false
                            cardStoryIds.forEach((storyId: string) => {
                              const allDeps = STORY_DEPS_VIEW[storyId] || []
                              if (allDeps.length === 0) return
                              hasDeps = true
                              const story = storyMap2[storyId]
                              const myOrder = SPRINT_NUM[storySprintMap[storyId]] ?? 999
                              if (cardStoryIds.length > 1) depLines.push(`\n${storyId}: ${story?.headline || ''}`)
                              allDeps.forEach(depId => {
                                const dep = storyMap2[depId]
                                const depOrder = SPRINT_NUM[dep?.sprint ?? 'backlog'] ?? 999
                                const broken = depOrder > myOrder
                                if (broken) hasBroken = true
                                const sprintLabel = dep ? (dep.sprint === 'backlog' ? 'Backlog' : dep.sprint.replace('sprint','Sprint ')) : 'not in plan'
                                const aggField = getFieldForView(view)
                                const aggValue = dep ? ((dep as any)[aggField] || dep.goal || '') : ''
                                const aggLabel = view !== 'story' && aggValue ? ` [${aggValue}]` : ''
                                depLines.push(`  ${broken ? '!' : 'ok'} ${depId}: ${dep?.headline || ''}${aggLabel} - ${sprintLabel}`)
                              })
                            })
                            if (!hasDeps) return isSplit ? `Split across ${card.totalParts} sprints` : undefined
                            const header = view === 'story' ? 'Dependencies:' : `Dependencies across ${cardStoryIds.length} stories:`
                            return `${header}\n${depLines.join('\n')}${hasBroken ? '\n\nSome blockers are planned AFTER!' : '\nAll deps in order'}`
                          })()}
                          style={{
                            background: T.surface,
                            borderRadius: T.radius.md,
                            padding:`${T.sp.xs}px ${T.sp.sm}px`,
                            border:`1px solid ${dragOverCard===card.key ? T.primary : T.border}`,
                            borderLeft: leftBorderColor !== 'transparent' ? `3px solid ${leftBorderColor}` : `1px solid ${dragOverCard===card.key ? T.primary : T.border}`,
                            cursor:'grab', opacity:dragging===card.key?0.4:1,
                            boxShadow: dragOverCard===card.key ? `0 0 0 2px ${T.primaryLight}` : dragging===card.key ? T.shadow.lg : T.shadow.sm,
                            transform: dragging===card.key ? 'rotate(2deg)' : 'none',
                            width: '100%',
                            boxSizing:'border-box' as 'border-box',
                            overflow:'hidden',
                            transition:'border-color 0.15s, box-shadow 0.15s, transform 0.15s'
                          }}
                          onMouseEnter={e=>{if(dragging!==card.key){e.currentTarget.style.borderColor=T.primary;e.currentTarget.style.boxShadow=T.shadow.md}}}
                          onMouseLeave={e=>{if(dragging!==card.key){e.currentTarget.style.borderColor=T.border;e.currentTarget.style.boxShadow=T.shadow.sm}}}>
                          {/* Line 1: Story ID + badges + points */}
                          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap: T.sp.xs }}>
                            <div style={{ display:'flex', gap: T.sp.xs, alignItems:'center', minWidth:0, overflow:'hidden' }}>
                              <span style={{ fontSize: T.fs.sm, fontWeight:600, color: T.text, fontFamily: view==='story' ? T.fontMono : T.fontFamily, flexShrink:0 }}>{card.label}</span>
                              {isCP && <span style={{ fontSize: T.fs.xs, background: T.danger, color: T.surface, padding:'1px 4px', borderRadius: T.radius.sm, fontWeight:600, flexShrink:0 }}>CP</span>}
                              {cardBroken && <span style={{ fontSize: T.fs.xs, background: T.warning, color: T.surface, padding:'1px 4px', borderRadius: T.radius.sm, fontWeight:600, flexShrink:0 }} title={`Needs: ${brokenList.join(', ')}`}>dep</span>}
                              {isSplit && <span style={{ fontSize: T.fs.xs, background: '#fef08a', color:'#713f12', padding:'1px 4px', borderRadius: T.radius.sm, fontWeight:600, flexShrink:0 }}>
                                {card.totalParts > 1 ? `${card.partLabel?.match(/\((\d+) of/)?.[1] || '?'}/${card.totalParts}` : 'split'}
                              </span>}
                            </div>
                            {(() => {
                              const cardPts = view==='story'
                                ? ((card as any).pts || 0)
                                : (card.ids || []).reduce((a: number, id: string) => {
                                    const s = stories.find((st: any) => st.id === id)
                                    return a + (s ? (s.pts || 0) : 0)
                                  }, 0)
                              return cardPts > 0 ? (
                                <span style={{ fontSize: T.fs.xs, color: T.textMuted, fontWeight:600, flexShrink:0 }}>
                                  {fmtPts(cardPts)}pts
                                </span>
                              ) : null
                            })()}
                          </div>
                          {/* Line 2: Headline */}
                          <div style={{ fontSize: T.fs.sm, color: T.textSecondary, lineHeight:1.3, marginTop:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{card.sub}</div>
                          {/* Line 3: Persona badge + size badge + action */}
                          <div style={{ display:'flex', alignItems:'center', gap: T.sp.xs, marginTop:2, flexWrap:'nowrap', overflow:'hidden' }}>
                            {/* BUG-02 fix: styled persona pill */}
                            {card.persona && (
                              <span style={{ fontSize:9, fontWeight:600, padding:'1px 5px', borderRadius: T.radius.full, background: PERSONA_BG[card.persona] || T.borderLight, color: PERSONA_COLOR[card.persona] || T.textMuted, flexShrink:0, lineHeight:'14px' }}>
                                {card.persona}
                              </span>
                            )}
                            {/* BUG-01 fix: size badge */}
                            {view==='story' && (card as any).size && SIZE_COLOR[(card as any).size] && (
                              <span style={{ fontSize:9, fontWeight:600, padding:'1px 5px', borderRadius: T.radius.full, background:(PERSONA_BG[(card as any).size]||T.borderLight), color: SIZE_COLOR[(card as any).size], border:`1px solid ${SIZE_COLOR[(card as any).size]}40`, flexShrink:0, lineHeight:'14px' }}>
                                {(card as any).size}
                              </span>
                            )}
                            {view==='story' && card.action && (
                              <span style={{ fontSize: T.fs.xs, color: T.textMuted, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{card.action}</span>
                            )}
                          </div>
                        </div>
                      )
                    })}
                    </div>
                    {cards.length===0 && (
                      <div style={{ flex:1, minHeight:60, border:`1px dashed ${T.border}`, borderRadius: T.radius.sm, margin:2 }} />
                    )}
                  </div>
                )
              })}
            </div>
          ))}

        </>)}
        </div>
        </div>
        </div>


      </div>
    </div>
  )
}
