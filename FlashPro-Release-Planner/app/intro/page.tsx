'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

const steps = [
  {
    icon: '📥',
    title: 'Import your Story Map',
    color: '#2563EB',
    bg: '#EFF6FF',
    border: '#BFDBFE',
    tag: 'Getting started',
    desc: 'FlashPro reads your team\'s story map from an Excel file. Structure it with these columns and the app handles the rest.',
    items: [
      { label: 'Story ID', note: 'Unique identifier — e.g. S01, O12, FEAT-42' },
      { label: 'Headline', note: 'One-line description of the story' },
      { label: 'User Persona', note: 'Who does this work? e.g. Seller, Operator, Dev, Admin' },
      { label: 'Goal', note: 'The high-level objective this story contributes to' },
      { label: 'Action', note: 'The specific action or feature being built' },
      { label: 'Story Estimate (weeks)', note: 'Numeric effort — e.g. 0.5, 1, 2. Used for capacity planning.' },
      { label: 'Status', note: 'Mark "delete" to exclude a story from the plan' },
    ],
    tip: 'Import via ↑ Import → Story Map. Stories with Status = "delete" are automatically excluded. Download a blank template to get started quickly.',
  },
  {
    icon: '🏊',
    title: 'Set up your Streams',
    color: '#16A34A',
    bg: '#F0FDF4',
    border: '#bbf7d0',
    tag: 'Parallel workstreams',
    desc: 'Streams are your parallel delivery lanes — one per team or capability area. The board starts with four but you can add up to eight.',
    items: [
      { label: 'Stream 1–4', note: 'Default names. Click ✏ Edit on any stream header to rename.' },
      { label: 'Name', note: 'Give each stream a meaningful name — e.g. "Platform Config", "Seller Journey"' },
      { label: 'Description', note: 'Add your key integrations or tech stack — shown as a subtitle' },
      { label: 'Count', note: 'Change the number of streams in ⚙ Config (2–8 supported)' },
    ],
    tip: 'Stream names and configuration are saved in your project file and restored when you reload.',
  },
  {
    icon: '📅',
    title: 'Plan your Sprints',
    color: '#7c3aed',
    bg: '#faf5ff',
    border: '#ddd6fe',
    tag: 'The planning board',
    desc: 'The board is a 2D grid — Streams (rows) × Sprints (columns). Drag stories from the backlog on the left into any cell to plan them.',
    items: [
      { label: 'Story view', note: 'Plan individual story cards. Cards display 2 per row for density.' },
      { label: 'Action view', note: 'Group and plan by action. Drag an action block to move all its stories together.' },
      { label: 'Goal view', note: 'Group and plan by goal. Move an entire goal across sprints in one drag.' },
      { label: 'Custom aggregate views', note: 'Action and Goal are the default grouping levels, but you can add any column from your story map as a view tab via ⚙ Config → View Aggregates. Good candidates: Platform Capability, Workflow, User Persona — any column where one value maps to multiple stories.' },
      { label: 'Deps view', note: 'See which stories have unresolved dependencies — blockers planned later than the story that needs them.' },
    ],
    tip: 'Use ⚙ Config to set the number of sprints (1–12), point capacity per sprint, and to configure custom aggregate view tabs.',
  },
  {
    icon: '⚠',
    title: 'Understand the Indicators',
    color: '#c2410c',
    bg: '#FFFBEB',
    border: '#fed7aa',
    tag: 'Visual signals',
    desc: 'Every card and cell on the board gives you instant visual feedback. Here\'s what each indicator means.',
    items: [
      { label: '🔴 CP badge', note: 'Critical Path — this story must be completed early or the whole plan slips' },
      { label: '🟠 ⚠ dep badge', note: 'Broken dependency — a prerequisite story is planned in a later sprint. Hover to see which.' },
      { label: '🟡 Yellow stripe + 1/3', note: 'Split — this action or goal is spread across multiple sprints. The fraction shows which part.' },
      { label: '🟠 ⚠ X/Ypts header', note: 'Over capacity — that sprint×stream cell exceeds its configured point limit.' },
      { label: '🟢 ✓ CP on track', note: 'All critical path stories are in early sprints — good.' },
    ],
    tip: 'Click ⬡ Legend on the board at any time to see a visual key for all indicators.',
  },
  {
    icon: '🔗',
    title: 'Import Dependencies & Critical Path',
    color: '#0891b2',
    bg: '#ecfeff',
    border: '#a5f3fc',
    tag: 'Guardrails',
    desc: 'FlashPro can warn you when you\'re about to break a dependency. Import your rules once and the board enforces them automatically.',
    items: [
      { label: 'Dependency Map (.xlsx)', note: 'Columns: Story ID, Depends On (Story ID), Type (H/C/D). Import via ↑ Import → Dependency Map.' },
      { label: 'Critical Path (.xlsx)', note: 'Same file, separate sheet. Marks which stories are CP — shown with red badge.' },
      { label: 'H — Hard Blocker', note: 'Story B cannot start without Story A. Strongest warning.' },
      { label: 'C — Config Prerequisite', note: 'Story B will fail without data from Story A.' },
      { label: 'D — Downstream Consumer', note: 'Story B reads output from Story A.' },
      { label: 'Aggregate columns & dependencies', note: 'The Deps view checks story-level dependencies regardless of which aggregate view (Goal, Action, Platform Capability, Workflow, etc.) you are using. Broken deps show the ⚠ dep badge in all views.' },
    ],
    tip: 'Export your dependency map anytime via ↓ Export → Dependency Map (.json) to back it up or share it.',
  },
  {
    icon: '📦',
    title: 'Save, Export and Restore',
    color: '#0F172A',
    bg: '#F8FAFC',
    border: '#E2E8F0',
    tag: 'Projects & portability',
    desc: 'Your work is always saved. Use Projects to switch between plans, and the .RP bundle to share a complete snapshot with your team.',
    items: [
      { label: '📁 Projects', note: 'Save named snapshots of your board. Click a project to restore it instantly.' },
      { label: '↓ Export → Release Plan (.xlsx)', note: '5-sheet Excel: full story list + board views at Story, Action, and Goal level.' },
      { label: '↓ Export → Full Project (.rp)', note: 'ZIP bundle with everything: plan, deps, critical path, streams. Share with anyone.' },
      { label: '↑ Import → Import .RP File', note: 'Restore a complete project from a .rp bundle in one step.' },
      { label: '↑ Import → Import Release Plan', note: 'Restore sprint and stream assignments from a previously exported .xlsx.' },
    ],
    tip: 'Real-time collaboration: share your local IP with teammates on the same network. They open the same URL and see your board live.',
  },
]

export default function IntroPage() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const current = steps[step]

  return (
    <div style={{ minHeight:'100vh', background:'#F8FAFC', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'24px 16px', fontFamily:'system-ui,-apple-system,sans-serif' }}>

      {/* App name */}
      <div style={{ textAlign:'center', marginBottom:28 }}>
        <div style={{ fontSize:11, fontWeight:700, color:'#94A3B8', letterSpacing:3, textTransform:'uppercase', marginBottom:6 }}>FlashPro Release Plan</div>
        <h1 style={{ margin:'0 0 6px', fontSize:26, fontWeight:800, color:'#0F172A' }}>Setup Guide</h1>
        <p style={{ margin:0, fontSize:13, color:'#94A3B8' }}>Six steps to your first release plan</p>
      </div>

      {/* Step dots */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {steps.map((s, i) => (
          <button key={i} onClick={() => setStep(i)} style={{
            width: i === step ? 24 : 8, height:8, borderRadius:4, border:'none', cursor:'pointer',
            background: i === step ? current.color : '#cbd5e1', transition:'all 0.2s', padding:0
          }} />
        ))}
      </div>

      {/* Card */}
      <div style={{ maxWidth:600, width:'100%', background:'#FFFFFF', borderRadius:12, border:`1.5px solid ${current.border}`, boxShadow:'0 4px 24px rgba(0,0,0,0.06)', overflow:'hidden' }}>

        {/* Card header */}
        <div style={{ background:current.bg, borderBottom:`1px solid ${current.border}`, padding:'20px 24px', display:'flex', gap:16, alignItems:'center' }}>
          <div style={{ fontSize:32, lineHeight:1, flexShrink:0 }}>{current.icon}</div>
          <div>
            <div style={{ fontSize:10, fontWeight:700, color:current.color, textTransform:'uppercase', letterSpacing:1.5, marginBottom:3 }}>Step {step + 1} of {steps.length} · {current.tag}</div>
            <h2 style={{ margin:0, fontSize:18, fontWeight:700, color:'#0F172A' }}>{current.title}</h2>
          </div>
        </div>

        {/* Card body */}
        <div style={{ padding:'20px 24px' }}>
          <p style={{ margin:'0 0 16px', fontSize:13, color:'#475569', lineHeight:1.7 }}>{current.desc}</p>

          <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:16 }}>
            {current.items.map((item, i) => (
              <div key={i} style={{ display:'flex', gap:10, alignItems:'flex-start', padding:'8px 10px', background:'#F8FAFC', borderRadius:6, border:'1px solid #e5e5e5' }}>
                <div style={{ width:6, height:6, borderRadius:3, background:current.color, flexShrink:0, marginTop:5 }} />
                <div>
                  <span style={{ fontSize:12, fontWeight:700, color:'#0F172A' }}>{item.label}</span>
                  <span style={{ fontSize:12, color:'#94A3B8' }}> — {item.note}</span>
                </div>
              </div>
            ))}
          </div>

          <div style={{ background:current.bg, border:`1px solid ${current.border}`, borderRadius:8, padding:'10px 14px', display:'flex', gap:8, alignItems:'flex-start' }}>
            <span style={{ fontSize:14, flexShrink:0 }}>💡</span>
            <div>
              <span style={{ fontSize:12, color:current.color, fontWeight:500, lineHeight:1.5 }}>{current.tip}</span>
              {step === 0 && (
                <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
                  <a href="/api/templates/story-map" style={{ fontSize:11, color:current.color, textDecoration:'none', fontWeight:700, padding:'3px 10px', background:'#FFFFFF', border:`1px solid ${current.border}`, borderRadius:6 }}>↓ Download story map template</a>
                </div>
              )}
              {step === 4 && (
                <div style={{ marginTop:8, display:'flex', gap:8, flexWrap:'wrap' }}>
                  <a href="/api/templates/dependency-map" style={{ fontSize:11, color:current.color, textDecoration:'none', fontWeight:700, padding:'3px 10px', background:'#FFFFFF', border:`1px solid ${current.border}`, borderRadius:6 }}>↓ Download dependency map template</a>
                  <a href="/api/templates/critical-path" style={{ fontSize:11, color:current.color, textDecoration:'none', fontWeight:700, padding:'3px 10px', background:'#FFFFFF', border:`1px solid ${current.border}`, borderRadius:6 }}>↓ Download critical path template</a>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer nav */}
        <div style={{ padding:'14px 24px', borderTop:'1px solid #f1f5f9', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <button onClick={() => setStep(s => Math.max(0, s - 1))} disabled={step === 0}
            style={{ padding:'7px 18px', fontSize:12, background:'#F8FAFC', color:step===0?'#cbd5e1':'#475569', border:`1px solid ${step===0?'#f1f5f9':'#E2E8F0'}`, borderRadius:7, cursor:step===0?'default':'pointer' }}>
            ← Back
          </button>
          <div style={{ display:'flex', gap:4 }}>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep(s => s + 1)}
                style={{ padding:'7px 20px', fontSize:12, fontWeight:700, background:current.color, color:'#FFFFFF', border:'none', borderRadius:7, cursor:'pointer' }}>
                Next →
              </button>
            ) : (
              <button onClick={() => router.push('/')}
                style={{ padding:'7px 20px', fontSize:12, fontWeight:700, background:'#0F172A', color:'#FFFFFF', border:'none', borderRadius:7, cursor:'pointer' }}>
                Open Board →
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ marginTop:16, width:600, maxWidth:'100%', background:'#E2E8F0', borderRadius:4, height:3 }}>
        <div style={{ height:3, borderRadius:4, background:current.color, width:`${((step+1)/steps.length)*100}%`, transition:'width 0.3s' }} />
      </div>

      {/* Skip */}
      <button onClick={() => router.push('/')}
        style={{ marginTop:14, fontSize:11, color:'#94A3B8', background:'none', border:'none', cursor:'pointer', textDecoration:'underline' }}>
        Skip — go straight to the board
      </button>
    </div>
  )
}
