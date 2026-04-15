export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'

// In-memory presence store (resets on server restart — intentional for ephemeral presence)
const presence: Record<string, { name: string; email: string; color: string; lastSeen: number; view?: string }> = {}

const COLORS = ['#0257a4','#15803d','#7e22ce','#b45309','#0e7490','#be123c','#059669','#d97706']
const userColors: Record<string, string> = {}
let colorIdx = 0

function getColor(email: string) {
  if (!userColors[email]) {
    userColors[email] = COLORS[colorIdx % COLORS.length]
    colorIdx++
  }
  return userColors[email]
}

// POST /api/presence — heartbeat (user is active)
export async function POST(req: NextRequest) {
  const { name, email, view } = await req.json()
  if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
  presence[email] = { name: name || email, email, color: getColor(email), lastSeen: Date.now(), view }
  return NextResponse.json({ ok: true })
}

// GET /api/presence — list active users (seen in last 30 seconds)
export async function GET() {
  const now = Date.now()
  const active = Object.values(presence).filter(u => now - u.lastSeen < 30000)
  return NextResponse.json({ users: active })
}
