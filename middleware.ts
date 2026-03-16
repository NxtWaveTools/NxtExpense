import { NextResponse, type NextRequest } from 'next/server'

import { isAllowedCorporateEmail } from '@/lib/auth/allowed-email-domains'
import { copyResponseCookies } from '@/lib/utils/session-utils'
import { refreshAuthSession } from '@/lib/supabase/middleware'

const MAX_COOKIE_HEADER_LENGTH = 7000
const protectedRoutes = [
  '/dashboard',
  '/claims',
  '/approvals',
  '/finance',
  '/admin',
]
const publicAuthRoutes = ['/login']

function matchesRoute(pathname: string, route: string): boolean {
  return pathname === route || pathname.startsWith(`${route}/`)
}

function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => matchesRoute(pathname, route))
}

function isPublicAuthRoute(pathname: string): boolean {
  return publicAuthRoutes.some((route) => matchesRoute(pathname, route))
}

function getSupabaseAuthCookiePrefix(): string | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) return null

  try {
    const parsedUrl = new URL(supabaseUrl)
    const [projectRef] = parsedUrl.hostname.split('.')
    return projectRef ? `sb-${projectRef}-` : null
  } catch {
    return null
  }
}

function clearSupabaseAuthCookies(
  request: NextRequest,
  response: NextResponse
): boolean {
  const cookiePrefix = getSupabaseAuthCookiePrefix()
  if (!cookiePrefix) return false

  const authCookieNames = request.cookies
    .getAll()
    .map(({ name }) => name)
    .filter((cookieName) => cookieName.startsWith(cookiePrefix))

  const uniqueCookieNames = [...new Set(authCookieNames)]
  uniqueCookieNames.forEach((cookieName) => {
    response.cookies.set({
      name: cookieName,
      value: '',
      path: '/',
      maxAge: 0,
      expires: new Date(0),
    })
  })

  return uniqueCookieNames.length > 0
}

function handleOversizedCookieHeader(
  request: NextRequest
): NextResponse | null {
  const cookieHeader = request.headers.get('cookie')
  if (!cookieHeader || cookieHeader.length <= MAX_COOKIE_HEADER_LENGTH) {
    return null
  }

  const loginUrl = request.nextUrl.clone()
  loginUrl.pathname = '/login'
  loginUrl.search = '?message=session_reset'

  const resetResponse = NextResponse.redirect(loginUrl)
  const hasClearedAuthCookies = clearSupabaseAuthCookies(request, resetResponse)

  if (!hasClearedAuthCookies) {
    return null
  }

  return resetResponse
}

export async function middleware(request: NextRequest) {
  const oversizedCookieHeaderResponse = handleOversizedCookieHeader(request)
  if (oversizedCookieHeaderResponse) {
    return oversizedCookieHeaderResponse
  }

  const { response, user, supabase } = await refreshAuthSession(request)
  const { pathname } = request.nextUrl
  const hasSession = Boolean(user)
  const hasAllowedDomain = user
    ? await isAllowedCorporateEmail(supabase, user.email)
    : false

  if (isProtectedRoute(pathname) && !hasAllowedDomain) {
    const loginUrl = request.nextUrl.clone()
    loginUrl.pathname = '/login'
    loginUrl.search = hasSession ? '?error=email_domain_not_allowed' : ''

    const redirectResponse = NextResponse.redirect(loginUrl)
    return copyResponseCookies(response, redirectResponse)
  }

  if (isPublicAuthRoute(pathname) && hasAllowedDomain) {
    const dashboardUrl = request.nextUrl.clone()
    dashboardUrl.pathname = '/dashboard'
    dashboardUrl.search = ''

    const redirectResponse = NextResponse.redirect(dashboardUrl)
    return copyResponseCookies(response, redirectResponse)
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/claims/:path*',
    '/approvals/:path*',
    '/finance/:path*',
    '/admin/:path*',
    '/login',
  ],
}
