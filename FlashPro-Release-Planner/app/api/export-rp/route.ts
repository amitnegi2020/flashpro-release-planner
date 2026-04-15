export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)
const PYTHON_DIR = join(process.cwd(), 'lib', 'python')

// Python script loaded from file — edit lib/python/export-rp.py directly
const RP_SCRIPT = readFileSync(join(PYTHON_DIR, 'export-rp.py'), 'utf-8')

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { stories, streams, customDeps, criticalPath, config, projectName, savedAt } = body

    // F9E.09 fix: if config block is missing or empty, read it from the server state
    let resolvedConfig = config || {}
    if (!resolvedConfig.sprintCapacity) {
      try {
        const { readFileSync, existsSync } = await import('fs')
        const { join: pathJoin } = await import('path')
        const statePath = pathJoin(process.cwd(), 'planner-state.json')
        if (existsSync(statePath)) {
          const state = JSON.parse(readFileSync(statePath, 'utf-8'))
          if (state?.config) resolvedConfig = { ...state.config, ...resolvedConfig }
        }
      } catch {}
    }

    const sprintOrder = ['backlog','sprint1','sprint2','sprint3','sprint4','sprint5','sprint6','sprint7','sprint8']
    const sorted = [...(stories||[])].sort((a: any, b: any) => {
      const ai = sprintOrder.indexOf(a.sprint), bi = sprintOrder.indexOf(b.sprint)
      if (ai !== bi) return ai - bi
      if (a.stream !== b.stream) return (a.stream||'').localeCompare(b.stream||'')
      return (a.id||'').localeCompare(b.id||'')
    })

    const ts = Date.now()
    const dataPath = join('/tmp', `rp_data_${ts}.json`)
    const scriptPath = join('/tmp', `rp_script_${ts}.py`)
    const outPath = join('/tmp', `export_${ts}.rp`)

    writeFileSync(dataPath, JSON.stringify({
      stories: sorted, streams: streams||[],
      customDeps: customDeps||{}, criticalPath: criticalPath||[],
      config: resolvedConfig,
      projectName: projectName||'Release Plan', savedAt: savedAt||new Date().toISOString()
    }))
    writeFileSync(scriptPath, RP_SCRIPT)

    await execAsync(`python3 "${scriptPath}" "${dataPath}" "${outPath}"`)

    if (!existsSync(outPath)) {
      return NextResponse.json({ error: 'RP export failed' }, { status: 500 })
    }

    const fileBuffer = readFileSync(outPath)
    ;[outPath, dataPath, scriptPath].forEach(p => { try { if (existsSync(p)) unlinkSync(p) } catch {} })

    const safeProject = (projectName || '').replace(/[^a-zA-Z0-9\s\-_]/g, '').trim()
    const exportFilename = safeProject ? `${safeProject} - Project File.rp` : 'Project File.rp'
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${exportFilename}"`
      }
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
