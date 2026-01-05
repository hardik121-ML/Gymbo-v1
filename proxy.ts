// ============================================================================
// Next.js Proxy - Custom Auth
// ============================================================================
// This proxy checks authentication and redirects accordingly
// ============================================================================

import { NextResponse, type NextRequest } from 'next/server'
import { getSessionFromRequest } from '@/lib/auth/session'

export async function proxy(request: NextRequest) {
  const session = getSessionFromRequest(request)
  const isAuthPage = request.nextUrl.pathname === '/login' || request.nextUrl.pathname === '/signup'
  const isProtectedPage = request.nextUrl.pathname.startsWith('/clients')

  // Redirect authenticated users away from auth pages
  if (session && isAuthPage) {
    return NextResponse.redirect(new URL('/clients', request.url))
  }

  // Redirect unauthenticated users to login
  if (!session && isProtectedPage) {
    return NextResponse.redirect(new URL('/login', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
