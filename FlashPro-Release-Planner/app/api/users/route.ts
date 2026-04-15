export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { readUsers, writeUsers, createUser, createInviteToken, hashPassword, findUserByEmail } from '@/lib/users'
import type { Role } from '@/lib/users'
import { getServerSession } from 'next-auth'

// GET /api/users — list all users (admin only)
export async function GET(req: NextRequest) {
  // BUG-03 fix: require valid session in non-open auth modes
  try {
    const { readFileSync, existsSync } = await import('fs')
    const { join } = await import('path')
    const statePath = join(process.cwd(), 'planner-state.json')
    const state = existsSync(statePath) ? JSON.parse(readFileSync(statePath, 'utf-8')) : {}
    const authMode = state?.config?.authMode || 'open'
    if (authMode !== 'open') {
      const session = await getServerSession()
      if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
  } catch {}
  const store = readUsers()
  return NextResponse.json({
    users: store.users.map(u => ({ ...u, passwordHash: undefined })),
    invites: store.invites,
  })
}

// POST /api/users — create user (admin: password users) or accept invite
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { action } = body

  if (action === 'create') {
    const { email, name, password, role } = body
    if (!email || !name) return NextResponse.json({ error: 'Email and name required' }, { status: 400 })
    if (findUserByEmail(email)) return NextResponse.json({ error: 'User already exists' }, { status: 409 })
    const user = createUser({
      email, name,
      role: role || 'collaborator',
      provider: 'password',
      passwordHash: password ? hashPassword(password) : undefined,
    })
    return NextResponse.json({ ok: true, user: { ...user, passwordHash: undefined } })
  }

  if (action === 'invite') {
    const { email, role, invitedBy } = body
    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 })
    const token = createInviteToken(email, role || 'collaborator', invitedBy || 'admin')
    const inviteUrl = `${req.nextUrl.origin}/login?invite=${token}&email=${encodeURIComponent(email)}`
    return NextResponse.json({ ok: true, token, inviteUrl })
  }

  if (action === 'accept_invite') {
    const { token, email, name, password } = body
    const store = readUsers()
    const invite = store.invites.find(i => i.token === token && i.email.toLowerCase() === email.toLowerCase())
    if (!invite) return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
    if (new Date(invite.expiresAt) < new Date()) return NextResponse.json({ error: 'Invite has expired' }, { status: 400 })
    if (findUserByEmail(email)) return NextResponse.json({ error: 'Account already exists' }, { status: 409 })

    const user = createUser({
      email, name: name || email,
      role: invite.role,
      provider: 'password',
      passwordHash: password ? hashPassword(password) : undefined,
      invitedBy: invite.invitedBy,
    })
    store.invites = store.invites.filter(i => i.token !== token)
    writeUsers(store)
    return NextResponse.json({ ok: true, user: { ...user, passwordHash: undefined } })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

// PATCH /api/users — update user role
export async function PATCH(req: NextRequest) {
  const { email, role } = await req.json()
  const store = readUsers()
  const user = store.users.find(u => u.email === email)
  if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })
  user.role = role as Role
  writeUsers(store)
  return NextResponse.json({ ok: true })
}

// DELETE /api/users — remove user
export async function DELETE(req: NextRequest) {
  const { email } = await req.json()
  const store = readUsers()
  store.users = store.users.filter(u => u.email !== email)
  writeUsers(store)
  return NextResponse.json({ ok: true })
}
