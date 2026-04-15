export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { writeFileSync, readFileSync, unlinkSync, existsSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)
const PYTHON_DIR = join(process.cwd(), 'lib', 'python')

// Python script loaded from file — edit lib/python/import-rp.py directly
const RP_IMPORT_SCRIPT = readFileSync(join(PYTHON_DIR, 'import-rp.py'), 'utf-8')

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const peekOnly = formData.get('peek') === '1'
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ts = Date.now()
    const tmpPath = join('/tmp', `rp_import_${ts}.rp`)
    const scriptPath = join('/tmp', `rp_import_script_${ts}.py`)

    writeFileSync(tmpPath, buffer)
    writeFileSync(scriptPath, RP_IMPORT_SCRIPT)

    const { stdout } = await execAsync(`python3 "${scriptPath}" "${tmpPath}"`)
    const result = JSON.parse(stdout.trim())

    ;[tmpPath, scriptPath].forEach(p => { try { if (existsSync(p)) unlinkSync(p) } catch {} })

    if (!result.ok) return NextResponse.json(result)

    // Peek mode: return metadata only (no side-effects)
    if (peekOnly) {
      const storyCount = result.state?.stories?.length || 0
      const savedAt = result.state?.savedAt || result.state?.projectName || ''
      return NextResponse.json({
        ok: true,
        projectName: result.projectName,
        storyCount,
        savedAt,
        streamCount: result.state?.streams?.length || 0,
      })
    }

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 })
  }
}
