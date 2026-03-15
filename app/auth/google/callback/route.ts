import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// ─── Exchange Google code for tokens ─────────────────────────────────────────
async function exchangeGoogleCode(code: string): Promise<{
  access_token: string
  id_token: string
  refresh_token?: string
} | null> {
  const clientId     = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!
  const redirectUri  = process.env.GOOGLE_REDIRECT_URI!

  const response = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id:     clientId,
      client_secret: clientSecret,
      redirect_uri:  redirectUri,
      grant_type:    'authorization_code',
    }),
  })

  if (!response.ok) {
    const err = await response.text()
    console.error('[GOOGLE-CB] Token exchange failed:', err)
    return null
  }

  return response.json()
}

// ─── Sync new OAuth user with FastAPI backend ─────────────────────────────────
async function syncNewOAuthUser(
  userId: string,
  email: string,
  fullName: string,
  userType: string
): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL
  if (!backendUrl) return

  const firstName = fullName.split(' ')[0] || fullName
  const lastName  = fullName.split(' ').slice(1).join(' ') || ''

  try {
    const res = await fetch(`${backendUrl}/api/v1/auth/sync-user-profile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        user_id:       userId,
        email,
        first_name:    firstName,
        last_name:     lastName,
        full_name:     fullName,
        user_type:     userType,
        auth_provider: 'google',
      }),
    })
    if (res.ok) {
      console.log('[GOOGLE-CB] Backend sync successful')
    } else {
      console.warn('[GOOGLE-CB] Backend sync returned:', res.status)
    }
  } catch (err: any) {
    // Non-fatal — user exists in Supabase auth, profile can be created later
    console.warn('[GOOGLE-CB] Backend sync failed (non-fatal):', err.message)
  }
}

// ─── Fire signup notification ─────────────────────────────────────────────────
async function fireSignupNotification(
  userId: string,
  email: string,
  fullName: string,
  userType: string
): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL
  if (!backendUrl) return

  try {
    await fetch(`${backendUrl}/api/v1/notifications/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Service-Key': process.env.NEXT_PUBLIC_INTERNAL_SERVICE_KEY || '',
      },
      body: JSON.stringify({
        user_id:    userId,
        user_email: email,
        user_name:  fullName,
        user_type:  userType,
        is_oauth:   true,
      }),
    })
  } catch {
    // Non-fatal
  }
}

// ─── Main GET handler ─────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const url   = new URL(request.url)
  const code  = url.searchParams.get('code')
  const state = url.searchParams.get('state') || 'signin'
  const error = url.searchParams.get('error')

  console.log('[GOOGLE-CB] Received callback, state:', state)

  // ── Handle Google errors ───────────────────────────────────────────────────
  if (error) {
    console.error('[GOOGLE-CB] Google returned error:', error)
    return NextResponse.redirect(
      new URL(`/signin?error=${encodeURIComponent(error)}`, url.origin)
    )
  }

  if (!code) {
    console.error('[GOOGLE-CB] No code in callback')
    return NextResponse.redirect(new URL('/signin?error=no_code', url.origin))
  }

  // ── Validate CSRF nonce ────────────────────────────────────────────────────
  // state format: "{userType}:{nonce}"  e.g. "landlord:abc123"
  const [userTypeFromState, nonceFromState] = state.split(':')
  const cookieHeader = request.headers.get('cookie') || ''
  const nonceMatch   = cookieHeader.match(/nulo_oauth_nonce=([^;]+)/)
  const storedNonce  = nonceMatch ? decodeURIComponent(nonceMatch[1]) : null

  if (!storedNonce || storedNonce !== nonceFromState) {
    console.error('[GOOGLE-CB] CSRF nonce mismatch')
    return NextResponse.redirect(new URL('/signin?error=csrf_failed', url.origin))
  }

  const finalUserType = ['tenant', 'landlord'].includes(userTypeFromState)
    ? userTypeFromState
    : 'tenant'

  try {
    // ── Exchange code with Google ──────────────────────────────────────────
    const tokens = await exchangeGoogleCode(code)
    if (!tokens) {
      return NextResponse.redirect(new URL('/signin?error=token_exchange_failed', url.origin))
    }

    // ── Create Supabase session using Google id_token ──────────────────────
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() { return cookieStore.getAll() },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch {}
          },
        },
      }
    )

    // signInWithIdToken exchanges Google's id_token for a Supabase JWT
    // and sets the session in cookies — exactly like exchangeCodeForSession
    const { data, error: signInError } = await supabase.auth.signInWithIdToken({
      provider: 'google',
      token:    tokens.id_token,
      access_token: tokens.access_token,
    })

    if (signInError || !data.session) {
      console.error('[GOOGLE-CB] signInWithIdToken failed:', signInError?.message)
      return NextResponse.redirect(
        new URL('/signin?error=session_failed', url.origin)
      )
    }

    const supabaseUser = data.session.user
    console.log('[GOOGLE-CB] Supabase session created for:', supabaseUser.id)

    // ── Determine if new user (created in last 60 seconds) ──────────────────
    const isNewUser = Date.now() - new Date(supabaseUser.created_at).getTime() < 60_000

    // ── Check if user already exists in public.users ────────────────────────
    const { data: existingUser } = await supabase
      .from('users')
      .select('id, user_type, onboarding_completed')
      .eq('id', supabaseUser.id)
      .single()

    const isReturningUser = !!existingUser

    // For returning users, preserve their existing user_type from DB
    const resolvedUserType = isReturningUser
      ? (existingUser.user_type || finalUserType)
      : finalUserType

    // ── New user: sync with backend + notify ───────────────────────────────
    if (!isReturningUser) {
      const googleName =
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.user_metadata?.name ||
        supabaseUser.email ||
        'User'

      await syncNewOAuthUser(supabaseUser.id, supabaseUser.email!, googleName, resolvedUserType)
      await fireSignupNotification(supabaseUser.id, supabaseUser.email!, googleName, resolvedUserType)
    } else {
      console.log('[GOOGLE-CB] Returning user — skipping sync and notification')
    }

    // ── Determine redirect ─────────────────────────────────────────────────
    let customRedirect: string | null = null
    try {
      const redirectMatch = cookieHeader.match(/nulo_redirect_path=([^;]+)/)
      if (redirectMatch) customRedirect = decodeURIComponent(redirectMatch[1])
    } catch {}

    let redirectTo = '/properties'

    if (resolvedUserType === 'admin') {
      redirectTo = '/admin'
    } else if (resolvedUserType === 'landlord') {
      if (isReturningUser && existingUser?.onboarding_completed === true) {
        redirectTo = '/landlord/overview'
      } else {
        redirectTo = '/onboarding/landlord/step-1?oauth=1'
      }
    } else if (resolvedUserType === 'tenant') {
      redirectTo = customRedirect || '/properties'
    }

    console.log('[GOOGLE-CB] Redirecting to:', redirectTo)

    const response = NextResponse.redirect(new URL(redirectTo, url.origin))

    // Clear temporary cookies
    response.cookies.delete('nulo_oauth_nonce')
    response.cookies.delete('nulo_redirect_path')
    response.headers.set('X-Robots-Tag', 'noindex')

    return response

  } catch (err: any) {
    console.error('[GOOGLE-CB] Exception:', err.message)
    return NextResponse.redirect(new URL('/signin?error=callback_error', url.origin))
  }
}
