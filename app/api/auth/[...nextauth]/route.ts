import NextAuth from 'next-auth'
import OktaProvider from 'next-auth/providers/okta'
import CredentialsProvider from 'next-auth/providers/credentials'
import { findUserByEmail, createUser, verifyPassword, isFirstUser, updateUserLastSeen, readUsers, writeUsers } from '@/lib/users'
import fs from 'fs'
import path from 'path'

const STATE_FILE = path.join(process.cwd(), 'planner-state.json')

function getAuthMode(): string {
  if (!fs.existsSync(STATE_FILE)) return 'open'
  try {
    const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf-8'))
    return state.config?.authMode || 'open'
  } catch { return 'open' }
}

const handler = NextAuth({
  secret: process.env.AUTH_SECRET || 'flashpro-dev-secret-change-in-production',
  providers: [
    // Okta — ThoughtWorks SSO
    OktaProvider({
      clientId: process.env.OKTA_CLIENT_ID || '',
      clientSecret: process.env.OKTA_CLIENT_SECRET || '',
      issuer: process.env.OKTA_ISSUER || '',
    }),

    // Password-based credentials (local/password mode)
    CredentialsProvider({
      name: 'Password',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null
        const user = findUserByEmail(credentials.email)
        if (!user || user.provider !== 'password') return null
        if (!verifyPassword(credentials.password, user.passwordHash || '')) return null
        updateUserLastSeen(user.email)
        return { id: user.id, email: user.email, name: user.name, role: user.role }
      },
    }),
  ],

  callbacks: {
    async signIn({ user, account }) {
      const authMode = getAuthMode()
      if (authMode === 'open') return true

      // Okta SSO sign-in
      if (account?.provider === 'okta') {
        const email = user.email!
        let dbUser = findUserByEmail(email)

        if (!dbUser) {
          // Check for pending invite
          const store = readUsers()
          const invite = store.invites.find(
            i => i.email.toLowerCase() === email.toLowerCase() &&
            new Date(i.expiresAt) > new Date()
          )

          if (invite) {
            dbUser = createUser({
              email, name: user.name || email,
              role: invite.role,
              provider: 'okta',
              invitedBy: invite.invitedBy,
            })
            store.invites = store.invites.filter(i => i.token !== invite.token)
            writeUsers(store)
          } else if (isFirstUser()) {
            // First Okta user becomes admin
            dbUser = createUser({ email, name: user.name || email, role: 'admin', provider: 'okta' })
          } else {
            // No invite, not first user — deny access
            return '/login?error=NoAccess'
          }
        }

        updateUserLastSeen(email)
        ;(user as any).role = dbUser.role
        return true
      }

      return true
    },

    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role || 'collaborator'
        token.email = user.email
      }
      // Refresh role from DB on each token refresh
      if (token.email) {
        const dbUser = findUserByEmail(token.email as string)
        if (dbUser) token.role = dbUser.role
      }
      return token
    },

    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role || 'collaborator'
        ;(session.user as any).id = token.sub
      }
      return session
    },
  },

  pages: {
    signIn: '/login',
    error: '/login',
  },
})

export { handler as GET, handler as POST }
