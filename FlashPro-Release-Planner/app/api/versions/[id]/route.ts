export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

const VERSIONS_DIR = path.join(process.cwd(), 'planner-versions')
const INDEX_FILE = path.join(VERSIONS_DIR, 'index.json')

function readIndex(): any[] {
  if (!fs.existsSync(INDEX_FILE)) return []
  try { return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf-8')) } catch { return [] }
}

function writeIndex(index: any[]) {
  fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2))
}

// GET /api/versions/[id] — return full version with state
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const file = path.join(VERSIONS_DIR, `${params.id}.json`)
  if (!fs.existsSync(file)) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  try {
    const version = JSON.parse(fs.readFileSync(file, 'utf-8'))
    return NextResponse.json({ version })
  } catch {
    return NextResponse.json({ error: 'Read error' }, { status: 500 })
  }
}

// PATCH /api/versions/[id] — update name or starred
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { name, starred } = await req.json()
    const file = path.join(VERSIONS_DIR, `${params.id}.json`)
    if (!fs.existsSync(file)) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const version = JSON.parse(fs.readFileSync(file, 'utf-8'))
    if (name !== undefined) version.name = name
    if (starred !== undefined) version.starred = starred
    fs.writeFileSync(file, JSON.stringify(version, null, 2))

    // Update index
    const index = readIndex()
    const idx = index.findIndex((v: any) => v.id === params.id)
    if (idx >= 0) {
      if (name !== undefined) index[idx].name = name
      if (starred !== undefined) index[idx].starred = starred
      writeIndex(index)
    }

    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/versions/[id]
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const file = path.join(VERSIONS_DIR, `${params.id}.json`)
    if (fs.existsSync(file)) fs.unlinkSync(file)
    const index = readIndex().filter((v: any) => v.id !== params.id)
    writeIndex(index)
    return NextResponse.json({ ok: true })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
