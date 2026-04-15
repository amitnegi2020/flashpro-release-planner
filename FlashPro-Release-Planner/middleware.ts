import { NextRequest, NextResponse } from 'next/server'
import { getToken } from 'next-auth/jwt'

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Always allow: static assets, auth routes, invite flow, intro
  if (
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/intro') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next()
  }

  // Read auth mode from cookie (set when config is saved)
  const authModeCookie = req.cookies.get('planner_auth_mode')
  const authMode = authModeCookie?.value || 'open'

  // Open mode — no auth required
  if (authMode === 'open') return NextResponse.next()

  // Password-only mode — check legacy session cookie
  if (authMode === 'password') {
    const session = req.cookies.get('planner_session')
    if (session?.value) return NextResponse.next()
    return NextResponse.redirect(new URL('/login', req.url))
  }

  // Google / SSO mode — check NextAuth JWT token
  if (authMode === 'okta') {
    const token = await getToken({ req, secret: process.env.AUTH_SECRET || 'flashpro-dev-secret-change-in-production' })
    if (!token) return NextResponse.redirect(new URL('/login', req.url))

    // Viewer enforcement — read-only for /api/state POST and /api/ mutations
    const role = (token.role as string) || 'viewer'
    if (role === 'viewer') {
      const isWrite = req.method !== 'GET' && pathname.startsWith('/api/')
      const isAdminPage = pathname.startsWith('/admin')
      if (isWrite || isAdminPage) {
        return new NextResponse(JSON.stringify({ error: 'Viewer access — read only' }), {
          status: 403, headers: { 'Content-Type': 'application/json' }
        })
      }
    }

    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
