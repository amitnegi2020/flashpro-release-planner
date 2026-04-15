export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import { broadcast } from '../../../lib/broadcast'

const STATE_FILE = path.join(process.cwd(), 'planner-state.json')

export async function GET() {
  if (!fs.existsSync(STATE_FILE)) return NextResponse.json({})
  try { return NextResponse.json(JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))) }
  catch { return NextResponse.json({}) }
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  let existing: any = {}
  if (fs.existsSync(STATE_FILE)) {
    try { existing = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) } catch {}
  }

  // QA-C-01 fix: story-level merge — merge by story ID so concurrent clients
  // editing different stories don't overwrite each other's changes.
  // If body contains a stories array, merge story-by-story (last-writer-wins per story).
  // If body does NOT contain stories (e.g. config-only update), preserve existing stories.
  let mergedStories = existing.stories || []
  if (body.stories && Array.isArray(body.stories)) {
    const existingById: Record<string, any> = {}
    mergedStories.forEach((s: any) => { existingById[s.id] = s })
    body.stories.forEach((s: any) => { existingById[s.id] = s })
    // Remove any story whose ID is in existing but NOT in the incoming body
    // (this handles intentional story removals, e.g. after import)
    // Heuristic: if body has ≥ 80% of existing stories, treat as full replacement
    // If body has < 20 stories vs existing's many, treat as partial update (drag-drop)
    const bodyIds = new Set(body.stories.map((s: any) => s.id))
    const existingCount = mergedStories.length
    const bodyCount = body.stories.length
    if (existingCount > 0 && bodyCount / existingCount < 0.5 && bodyCount < 30) {
      // Partial update (drag-drop by one user) — merge into existing
      mergedStories = Object.values(existingById)
    } else {
      // Full replacement (import, reset, bulk move) — use body stories
      mergedStories = body.stories
    }
  }

  const merged = {
    ...existing,
    ...body,
    stories: mergedStories,
    // Preserve config, deps, columns unless explicitly sent
    config: body.config ?? existing.config,
    customDeps: body.customDeps ?? existing.customDeps,
    lastImportColumns: body.lastImportColumns ?? existing.lastImportColumns,
    // QA-C-04 fix: deep-merge sprintCapacity so concurrent capacity edits don't overwrite each other
    ...(body.config?.sprintCapacity && existing.config?.sprintCapacity ? {
      config: {
        ...(body.config ?? existing.config),
        sprintCapacity: {
          ...existing.config.sprintCapacity,
          ...body.config.sprintCapacity,
        }
      }
    } : {}),
  }

  fs.writeFileSync(STATE_FILE, JSON.stringify(merged, null, 2))
  broadcast(merged)
  return NextResponse.json({ ok: true })
}
