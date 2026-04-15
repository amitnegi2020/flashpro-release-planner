export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { STORY_DEPS } from '../../../lib/dependencies'
import { broadcast } from '../../../lib/broadcast'

const STATE_FILE = path.join(process.cwd(), 'planner-state.json')

function readState() {
  if (!fs.existsSync(STATE_FILE)) return {}
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) } catch { return {} }
}

// GET: return merged deps (base STORY_DEPS + custom from state)
export async function GET() {
  const state = readState()
  const customDeps: Record<string, string[]> = state.customDeps || {}
  // Merge: custom overrides base for same keys
  const merged = { ...STORY_DEPS, ...customDeps }
  return NextResponse.json({ deps: merged, customDeps })
}

// POST: update custom deps
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { customDeps } = body
    if (!customDeps || typeof customDeps !== 'object') {
      return NextResponse.json({ error: 'customDeps must be an object' }, { status: 400 })
    }
    // Validation: check story IDs are valid strings
    for (const [k, v] of Object.entries(customDeps)) {
      if (typeof k !== 'string') return NextResponse.json({ error: `Invalid key: ${k}` }, { status: 400 })
      if (!Array.isArray(v)) return NextResponse.json({ error: `Deps for ${k} must be an array` }, { status: 400 })
    }
    const state = readState()
    state.customDeps = customDeps
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
    broadcast(state)
    return NextResponse.json({ ok: true, customDeps })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
