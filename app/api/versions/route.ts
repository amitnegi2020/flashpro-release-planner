export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const VERSIONS_DIR = path.join(process.cwd(), 'planner-versions')
const INDEX_FILE = path.join(VERSIONS_DIR, 'index.json')
const MAX_VERSIONS = 100

export interface VersionMeta {
  id: string
  name: string
  starred: boolean
  trigger: string          // 'manual' | 'import-story-map' | 'import-release-plan' | 'import-backlog' | 'import-deps' | 'import-cp' | 'restore'
  savedAt: string          // ISO timestamp
  storyCount: number
  plannedCount: number
  projectName: string
}

function ensureDir() {
  if (!fs.existsSync(VERSIONS_DIR)) fs.mkdirSync(VERSIONS_DIR, { recursive: true })
}

function readIndex(): VersionMeta[] {
  ensureDir()
  if (!fs.existsSync(INDEX_FILE)) return []
  try { return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8')) } catch { return [] }
}

function writeIndex(index: VersionMeta[]) {
  ensureDir()
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2))
}

function pruneIndex(index: VersionMeta[]): VersionMeta[] {
  if (index.length <= MAX_VERSIONS) return index
  // Keep all starred + most recent up to MAX_VERSIONS
  const starred = index.filter(v => v.starred)
  const unstarred = index.filter(v => !v.starred).sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  const keep = new Set(starred.map(v => v.id))
  const slots = MAX_VERSIONS - starred.length
  unstarred.slice(0, Math.max(slots, 0)).forEach(v => keep.add(v.id))
  // Delete files for pruned versions
  index.filter(v => !keep.has(v.id)).forEach(v => {
    const f = path.join(VERSIONS_DIR, `${v.id}.json`)
    try { if (fs.existsSync(f)) fs.unlinkSync(f) } catch {}
  })
  return index.filter(v => keep.has(v.id)).sort((a, b) => b.savedAt.localeCompare(a.savedAt))
}

// GET /api/versions — list all version metadata (no state)
export async function GET() {
  const index = readIndex().sort((a, b) => b.savedAt.localeCompare(a.savedAt))
  return NextResponse.json({ versions: index })
}

// POST /api/versions — create a new version snapshot
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { trigger, name, starred, state, projectName } = body

    if (!state?.stories) return NextResponse.json({ error: 'state.stories required' }, { status: 400 })

    const id = String(Date.now())
    const plannedCount = (state.stories as any[]).filter(
      (s: any) => s.sprint && s.sprint !== 'backlog'
    ).length

    const meta: VersionMeta = {
      id,
      name: name || '',
      starred: starred || false,
      trigger: trigger || 'manual',
      savedAt: new Date().toISOString(),
      storyCount: state.stories.length,
      plannedCount,
      projectName: projectName || '',
    }

    // Write full state to individual file
    ensureDir()
    fs.writeFileSync(path.join(VERSIONS_DIR, `${id}.json`), JSON.stringify({ ...meta, state }, null, 2))

    // Update index
    const index = readIndex()
    index.unshift(meta)
    writeIndex(pruneIndex(index))

    return NextResponse.json({ ok: true, id, meta })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
