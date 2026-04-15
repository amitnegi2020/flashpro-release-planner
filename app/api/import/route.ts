export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { writeFileSync, unlinkSync, existsSync, readFileSync } from 'fs'
import { join } from 'path'
import { promisify } from 'util'

const execAsync = promisify(exec)
const STATE_FILE = join(process.cwd(), 'planner-state.json')
const PYTHON_DIR = join(process.cwd(), 'lib', 'python')

// Python scripts loaded from files — edit lib/python/*.py directly
const IMPORT_SCRIPT = readFileSync(join(PYTHON_DIR, 'import-stories.py'), 'utf-8')
const DEPS_XLSX_SCRIPT = readFileSync(join(PYTHON_DIR, 'import-deps.py'), 'utf-8')
const VALIDATE_MERGE_SCRIPT = readFileSync(join(PYTHON_DIR, 'validate-merge.py'), 'utf-8')

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('file') as File
    const importType = (formData.get('importType') as string) || 'story'
    const validateOnly = formData.get('validate') === '1'
    if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })

    // BUG-04 fix: server-side MIME type validation
    // Server-side MIME validation — octet-stream intentionally excluded (too permissive)
    const allowedMimes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
    ]
    // Accept if MIME matches OR if file extension is .xlsx/.xls (some browsers send blank type)
    const mimeOk = !file.type || allowedMimes.includes(file.type)
    const extOk = file.name.match(/\.(xlsx|xls)$/i)
    if (!mimeOk && !extOk) {
      return NextResponse.json({ error: 'Invalid file type. Only .xlsx and .xls files are accepted.' }, { status: 400 })
    }

    // BUG-09 fix: enforce 10MB file size limit
    const MAX_SIZE = 10 * 1024 * 1024
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: `File too large (${(file.size/1024/1024).toFixed(1)}MB). Maximum size is 10MB.` }, { status: 400 })
    }

    // ── Merge validation pass ─────────────────────────────────────────────
    if (importType === 'merge' && validateOnly) {
      const existingStoriesJson = (formData.get('existingStories') as string) || '[]'
      // F8G.01/F8G.02 fix: pass required columns (dynamic fields from original story map)
      const requiredColumnsJson = (formData.get('requiredColumns') as string) || '[]'
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      const ts = Date.now()
      const tmpPath = join('/tmp', `merge_validate_${ts}.xlsx`)
      const scriptPath = join('/tmp', `merge_validate_script_${ts}.py`)
      const existingPath = join('/tmp', `existing_${ts}.json`)
      const requiredPath = join('/tmp', `required_${ts}.json`)
      writeFileSync(tmpPath, buffer)
      writeFileSync(scriptPath, VALIDATE_MERGE_SCRIPT)
      writeFileSync(existingPath, existingStoriesJson)
      writeFileSync(requiredPath, requiredColumnsJson)
      const { stdout } = await execAsync(`python3 "${scriptPath}" "${tmpPath}" "${existingPath}" "${requiredPath}"`)
      const result = JSON.parse(stdout.trim())
      ;[tmpPath, scriptPath, existingPath, requiredPath].forEach(p => { try { if (existsSync(p)) unlinkSync(p) } catch {} })
      return NextResponse.json(result)
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const ts = Date.now()
    const tmpPath = join('/tmp', `import_${ts}.xlsx`)
    writeFileSync(tmpPath, buffer)

    // Handle dependency map or critical path import from MakroPro_Open_InputFiles.xlsx
    if (importType === 'deps-xlsx' || importType === 'cp') {
      const scriptPath = join('/tmp', `deps_script_${ts}.py`)
      writeFileSync(scriptPath, DEPS_XLSX_SCRIPT)
      const { stdout } = await execAsync(`python3 "${scriptPath}" "${tmpPath}"`)
      const parsed = JSON.parse(stdout.trim())
      ;[tmpPath, scriptPath].forEach(p => { try { if (existsSync(p)) unlinkSync(p) } catch {} })
      if (parsed.error) return NextResponse.json({ error: parsed.error }, { status: 400 })
      // Merge into state
      try {
        const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf-8')) : {}
        if (parsed.deps && Object.keys(parsed.deps).length > 0) state.customDeps = { ...(state.customDeps||{}), ...parsed.deps }
        if (parsed.cp && parsed.cp.length > 0) state.criticalPath = parsed.cp
        writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
      } catch {}
      return NextResponse.json({ ok: true, deps_count: Object.keys(parsed.deps||{}).length, cp_count: (parsed.cp||[]).length })
    }

    const scriptPath = join('/tmp', `import_script_${ts}.py`)
    writeFileSync(scriptPath, IMPORT_SCRIPT)

    const { stdout } = await execAsync(`python3 "${scriptPath}" "${tmpPath}"`)
    const parsed = JSON.parse(stdout.trim())

    ;[tmpPath, scriptPath].forEach(p => { try { if (existsSync(p)) unlinkSync(p) } catch {} })

    if (parsed.error) return NextResponse.json({ error: parsed.error, trace: parsed.trace }, { status: 400 })

    if (parsed.columns?.length) {
      try {
        const state = existsSync(STATE_FILE) ? JSON.parse(readFileSync(STATE_FILE, 'utf-8')) : {}
        state.lastImportColumns = parsed.columns
        writeFileSync(STATE_FILE, JSON.stringify(state, null, 2))
      } catch {}
    }

    return NextResponse.json({
      stories: parsed.stories,
      count: parsed.stories.length,
      is_export: parsed.is_export,
      columns: parsed.columns
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
