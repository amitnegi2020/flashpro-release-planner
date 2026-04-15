export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const PROJECTS_DIR = path.join(process.cwd(), 'projects')
const STATE_FILE = path.join(process.cwd(), 'planner-state.json')

function safeKey(name: string) {
  return name.replace(/[^a-zA-Z0-9_\-\s]/g, '').trim().replace(/\s+/g, '_')
}

function projectPath(name: string) {
  return path.join(PROJECTS_DIR, `${safeKey(name)}.json`)
}

// GET /api/projects — list all projects
export async function GET() {
  if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true })
  const files = fs.readdirSync(PROJECTS_DIR).filter(f => f.endsWith('.json'))
  const projects = files.map(f => {
    try {
      const data = JSON.parse(fs.readFileSync(path.join(PROJECTS_DIR, f), 'utf-8'))
      return {
        key: f.replace('.json', ''),
        name: data.projectName || f.replace('.json', '').replace(/_/g, ' '),
        savedAt: data.savedAt || null,
        storyCount: data.stories?.length || 0,
        plannedCount: data.stories?.filter((s: any) => s.sprint && s.sprint !== 'backlog').length || 0,
      }
    } catch { return null }
  }).filter(Boolean)
  return NextResponse.json({ projects })
}

// POST /api/projects — save current state as a project
export async function POST(req: NextRequest) {
  if (!fs.existsSync(PROJECTS_DIR)) fs.mkdirSync(PROJECTS_DIR, { recursive: true })
  const { name, state } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Project name required' }, { status: 400 })

  const payload = {
    projectName: name.trim(),
    savedAt: new Date().toISOString(),
    ...(state || {}),
  }
  fs.writeFileSync(projectPath(name), JSON.stringify(payload, null, 2))
  return NextResponse.json({ ok: true, key: safeKey(name) })
}

// PATCH /api/projects — load a project into current state
export async function PATCH(req: NextRequest) {
  const { name } = await req.json()
  const p = projectPath(name)
  if (!fs.existsSync(p)) return NextResponse.json({ error: 'Project not found' }, { status: 404 })
  const data = JSON.parse(fs.readFileSync(p, 'utf-8'))
  // Set as current state
  fs.writeFileSync(STATE_FILE, JSON.stringify(data, null, 2))
  return NextResponse.json({ ok: true, state: data })
}

// DELETE /api/projects — delete a project
export async function DELETE(req: NextRequest) {
  const { name } = await req.json()
  const p = projectPath(name)
  if (fs.existsSync(p)) fs.unlinkSync(p)
  return NextResponse.json({ ok: true })
}
