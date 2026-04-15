import fs from 'fs'
import path from 'path'
import crypto from 'crypto'

const USERS_FILE = path.join(process.cwd(), 'users.json')

export type Role = 'admin' | 'collaborator' | 'viewer'
export type AuthProvider = 'password' | 'okta'

export interface User {
  id: string
  email: string
  name: string
  role: Role
  provider: AuthProvider
  passwordHash?: string
  createdAt: string
  invitedBy?: string
  lastSeen?: string
}

export interface UsersStore {
  users: User[]
  invites: { token: string; email: string; role: Role; expiresAt: string; invitedBy: string }[]
}

export function readUsers(): UsersStore {
  if (!fs.existsSync(USERS_FILE)) return { users: [], invites: [] }
  try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')) } catch { return { users: [], invites: [] } }
}

export function writeUsers(store: UsersStore) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(store, null, 2))
}

export function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password + process.env.AUTH_SECRET || 'flashpro-secret').digest('hex')
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export function createInviteToken(email: string, role: Role, invitedBy: string) {
  const store = readUsers()
  const token = generateToken()
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString() // 7 days
  store.invites = store.invites.filter(i => i.email !== email) // remove old invite
  store.invites.push({ token, email, role, expiresAt, invitedBy })
  writeUsers(store)
  return token
}

export function findUserByEmail(email: string): User | undefined {
  return readUsers().users.find(u => u.email.toLowerCase() === email.toLowerCase())
}

export function createUser(data: Omit<User, 'id' | 'createdAt'>): User {
  const store = readUsers()
  const user: User = { ...data, id: generateToken(), createdAt: new Date().toISOString() }
  store.users.push(user)
  writeUsers(store)
  return user
}

export function updateUserLastSeen(email: string) {
  const store = readUsers()
  const user = store.users.find(u => u.email === email)
  if (user) { user.lastSeen = new Date().toISOString(); writeUsers(store) }
}

export function isFirstUser(): boolean {
  return readUsers().users.length === 0
}
