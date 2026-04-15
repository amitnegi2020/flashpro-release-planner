export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)
const PYTHON_DIR = join(process.cwd(), 'lib', 'python')

// Python scripts loaded from files — edit lib/python/*.py directly
const PYTHON_SCRIPT = readFileSync(join(PYTHON_DIR, 'export-release-plan.py'), 'utf-8')
const STORY_MAP_SCRIPT = readFileSync(join(PYTHON_DIR, 'export-story-map.py'), 'utf-8')
const DEP_MAP_SCRIPT = readFileSync(join(PYTHON_DIR, 'export-dep-map.py'), 'utf-8')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { stories, streams, exportType, customDeps, criticalPath, projectName } = body
    // BUG-08 fix: build filename prefix from project name
    const safeProject = projectName ? projectName.replace(/[^a-zA-Z0-9\s\-_]/g, '').trim() : ''
    const prefix = safeProject ? `${safeProject} - ` : ''

    const ts = Date.now()
    const dataPath = join('/tmp', `export_data_${ts}.json`)
    const scriptPath = join('/tmp', `export_script_${ts}.py`)
    const outPath = join('/tmp', `export_${ts}.xlsx`)

    // ── Story Map export ───────────────────────────────────────────────────
    if (exportType === 'story-map') {
      writeFileSync(dataPath, JSON.stringify({ stories }))
      writeFileSync(scriptPath, STORY_MAP_SCRIPT)
      await execAsync(`python3 "${scriptPath}" "${dataPath}" "${outPath}"`)
      if (!existsSync(outPath)) return NextResponse.json({ error: 'Export failed' }, { status: 500 })
      const fileBuffer = readFileSync(outPath)
      ;[outPath, dataPath, scriptPath].forEach(p => { try { if (existsSync(p)) unlinkSync(p) } catch {} })
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${prefix}Story Map.xlsx"`
        }
      })
    }

    // ── Dependency Map export ─────────────────────────────────────────────
    // ── Critical Path export (dep-map with empty customDeps) ─────────────
    if (exportType === 'dep-map') {
      const isCPOnly = !customDeps || Object.keys(customDeps).length === 0
      const exportFilename = isCPOnly ? `${prefix}Critical Path.xlsx` : `${prefix}Dependency Map.xlsx`
      writeFileSync(dataPath, JSON.stringify({ customDeps: customDeps || {}, criticalPath: criticalPath || [] }))
      writeFileSync(scriptPath, DEP_MAP_SCRIPT)
      await execAsync(`python3 "${scriptPath}" "${dataPath}" "${outPath}"`)
      if (!existsSync(outPath)) return NextResponse.json({ error: 'Export failed' }, { status: 500 })
      const fileBuffer = readFileSync(outPath)
      ;[outPath, dataPath, scriptPath].forEach(p => { try { if (existsSync(p)) unlinkSync(p) } catch {} })
      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${exportFilename}"`
        }
      })
    }

    // ── Release Plan export (default) ─────────────────────────────────────
    const sprintOrder = ['backlog', 'sprint1', 'sprint2', 'sprint3', 'sprint4', 'sprint5', 'sprint6', 'sprint7', 'sprint8']
    const sorted = [...stories].sort((a: any, b: any) => {
      const ai = sprintOrder.indexOf(a.sprint), bi = sprintOrder.indexOf(b.sprint)
      if (ai !== bi) return ai - bi
      if (a.stream !== b.stream) return (a.stream || '').localeCompare(b.stream || '')
      return (a.id || '').localeCompare(b.id || '')
    })

    writeFileSync(dataPath, JSON.stringify({ stories: sorted, streams }))
    writeFileSync(scriptPath, PYTHON_SCRIPT)

    const { stdout, stderr } = await execAsync(`python3 "${scriptPath}" "${dataPath}" "${outPath}"`)

    if (!existsSync(outPath)) {
      return NextResponse.json({ error: 'Export failed: ' + (stderr || stdout) }, { status: 500 })
    }

    const fileBuffer = readFileSync(outPath)
    ;[outPath, dataPath, scriptPath].forEach(p => { try { if (existsSync(p)) unlinkSync(p) } catch {} })

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${prefix}Release Plan.xlsx"`
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
