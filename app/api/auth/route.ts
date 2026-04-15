import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const STATE_FILE = path.join(process.cwd(), 'planner-state.json')

function readState() {
  if (!fs.existsSync(STATE_FILE)) return {}
  try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8')) } catch { return {} }
}

// POST /api/auth — verify password, set session cookie
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json()
    const state = readState()
    const config = state.config || {}
    const storedHash = config.passwordHash || ''

    if (config.authMode !== 'password' || !storedHash) {
      // Auth not required, always succeed
      const res = NextResponse.json({ ok: true })
      res.cookies.set('planner_session', 'open', { httpOnly: true, path: '/', maxAge: 86400 * 7 })
      return res
    }

    const inputHash = crypto.createHash('sha256').update(password || '').digest('hex')
    if (inputHash === storedHash) {
      const token = crypto.randomBytes(32).toString('hex')
      const res = NextResponse.json({ ok: true })
      res.cookies.set('planner_session', token, { httpOnly: true, path: '/', maxAge: 86400 * 7 })
      return res
    }
    return NextResponse.json({ error: 'Incorrect password' }, { status: 401 })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// DELETE /api/auth — logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete('planner_session')
  return res
}
