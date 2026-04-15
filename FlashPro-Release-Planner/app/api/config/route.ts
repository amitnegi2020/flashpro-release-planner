export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'
import { broadcast } from '../../../lib/broadcast'

const STATE_FILE = path.join(process.cwd(), 'planner-state.json')

function readState() {
  if (!fs.existsSync(STATE_FILE)) return {}
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) } catch { return {} }
}

const DEFAULT_CONFIG = {
  sprintCapacity: {
    sprint1: 20, sprint2: 20, sprint3: 20, sprint4: 20,
    sprint5: 20, sprint6: 20, sprint7: 20, sprint8: 20
  },
  streamCount: 4,
  aggregates: ['Goal', 'Action'],
  authMode: 'open' as 'open' | 'password',
  adminPassword: '',
  passwordHash: '',
  sprintStartDate: '',       // QA5-4 fix: include in default so fresh boards have defined sprint dates
  sprintDurationWeeks: 2,    // QA5-4 fix: 2-week sprints is the standard default
}

export async function GET() {
  const state = readState()
  const config = { ...DEFAULT_CONFIG, ...(state.config || {}) }
  // Don't return the password in plain text
  const safe = { ...config, adminPassword: '' }
  return NextResponse.json(safe)
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const state = readState()
    const current = { ...DEFAULT_CONFIG, ...(state.config || {}) }

    // Handle password hashing (Feature 11)
    if (body.adminPassword && body.adminPassword !== '') {
      body.passwordHash = crypto.createHash('sha256').update(body.adminPassword).digest('hex')
      body.adminPassword = '' // never store plain text
    } else if (body.adminPassword === '') {
      // keep existing hash if no new password provided
      if (current.passwordHash) body.passwordHash = current.passwordHash
    }

    // QA-C-04 fix: deep-merge sprintCapacity so concurrent capacity edits
    // by different users for different streams don't overwrite each other
    const updated = {
      ...current,
      ...body,
      ...(body.sprintCapacity && current.sprintCapacity ? {
        sprintCapacity: { ...current.sprintCapacity, ...body.sprintCapacity }
      } : {}),
    }
    state.config = updated

    // QA-C-05 fix: when sprintCount decreases, auto-move orphaned stories to backlog
    if (body.sprintCount && body.sprintCount < (current.sprintCount || 8)) {
      const maxSprint = body.sprintCount
      if (state.stories && Array.isArray(state.stories)) {
        state.stories = state.stories.map((s: any) => {
          const sprintNum = parseInt((s.sprint || '').replace('sprint', ''))
          if (!isNaN(sprintNum) && sprintNum > maxSprint) {
            return { ...s, sprint: 'backlog', stream: 'backlog' }
          }
          return s
        })
      }
    }

    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
    broadcast(state)
    const res = NextResponse.json({ ok: true, config: { ...updated, adminPassword: '' } })
    // Set edge-readable cookie for middleware auth mode check
    res.cookies.set('planner_auth_mode', updated.authMode || 'open', { httpOnly: false, path: '/', maxAge: 86400 * 365 })
    return res
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
