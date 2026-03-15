import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// ─── Helper: Wait for user record to exist ────────────────────────────────────
async function ensureUserRecordExists(
  supabase: any,
  userId: string,
  maxAttempts = 5
): Promise<boolean> {
  for (let i = 0; i < maxAttempts; i++) {
    const { data } = await supabase
      .from('users')
      .select('id')
      .eq('id', userId)
      .single()

    if (data) {
      console.log('✅ [CALLBACK] User record found in database')
      return true
    }

    console.log(`⏳ [CALLBACK] Waiting for user record... attempt ${i + 1}/${maxAttempts}`)
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  console.warn('⚠️ [CALLBACK] User record not found after waiting')
  return false
}

// ─── Helper: Create in-app notification via your FastAPI backend ──────────────
// This is called AFTER successful email verification so the landlord/tenant
// sees a welcome notification inside your app the first time they log in.
async function createWelcomeNotification(
  userId: string,
  userType: 'landlord' | 'tenant' | string
): Promise<void> {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL

  if (!backendUrl) {
    console.warn('⚠️ [CALLBACK] No backend URL configured — skipping welcome notification')
    return
  }

  // Build the right message depending on user type
  const notificationPayload =
    userType === 'landlord'
      ? {
          user_id: userId,
          title: '🎉 Email Verified!',
          message:
            'Your email has been confirmed. Complete your 5-step onboarding to get verified and start listing properties.',
          type: 'email_verified',
          link: '/onboarding/landlord/step-1',
        }
      : {
          user_id: userId,
          title: '🎉 Email Verified!',
          message:
            'Your email has been confirmed. Complete your profile to start browsing verified properties.',
          type: 'email_verified',
          link: '/onboarding/tenant/step-1',
        }

  try {
    console.log('🔔 [CALLBACK] Creating welcome notification for user:', userId)

    const response = await fetch(`${backendUrl}/api/v1/notifications/internal/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Use your internal service key if you have one, otherwise
        // protect this endpoint at the network/infrastructure level
        'X-Internal-Service-Key': process.env.INTERNAL_SERVICE_KEY || '',
      },
      body: JSON.stringify(notificationPayload),
    })

    if (response.ok) {
      console.log('✅ [CALLBACK] Welcome notification created successfully')
    } else {
      const body = await response.text()
      console.warn('⚠️ [CALLBACK] Notification API returned non-OK:', response.status, body)
    }
  } catch (err: any) {
    // Non-fatal — don't fail the auth flow if notification creation fails
    console.warn('⚠️ [CALLBACK] Could not create welcome notification:', err.message)
  }
}

// ─── Main GET Handler ─────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_code = requestUrl.searchParams.get('error_code')
  const error_description = requestUrl.searchParams.get('error_description')
  const user_type = requestUrl.searchParams.get('user_type') || 'tenant'

  console.log('🔄 [CALLBACK] Processing OAuth/email callback')
  console.log('📝 [CALLBACK] Full URL:', request.url)
  console.log('📝 [CALLBACK] Code:', code?.substring(0, 20) + '...')
  console.log('📝 [CALLBACK] User type from URL:', requestUrl.searchParams.get('user_type'))
  console.log('📝 [CALLBACK] User type (final):', user_type)
  console.log('🌍 [CALLBACK] Origin:', requestUrl.origin)

  // ─── Handle email verification errors ──────────────────────────────────────
  if (error || error_code) {
    console.error('❌ [CALLBACK] Email verification error:', error, error_code)

    const errorMap: Record<string, { message: string; action: string }> = {
      otp_expired: {
        message: 'Email verification link has expired',
        action: 'Please sign in and request a new verification link',
      },
      invalid_otp: {
        message: 'Email verification link is invalid',
        action: 'Please sign in and request a new verification link',
      },
      access_denied: {
        message: 'Email verification was denied',
        action: 'Please sign in and try again',
      },
    }

    const errorInfo = errorMap[error_code as string] || {
      message: error_description || 'Email verification failed',
      action: 'Please sign in and try again',
    }

    return NextResponse.redirect(
      new URL(
        `/auth/verify-email-failed?error=${encodeURIComponent(
          (error_code || error) ?? 'unknown_error'
        )}&message=${encodeURIComponent(errorInfo.message)}`,
        requestUrl.origin
      )
    )
  }

  // ─── No code = can't proceed ────────────────────────────────────────────────
  if (!code) {
    console.error('❌ [CALLBACK] No code provided')
    return NextResponse.redirect(
      new URL(
        '/auth/verify-email-failed?error=no_code&message=' +
          encodeURIComponent('No verification code found. Please check your email again.'),
        requestUrl.origin
      )
    )
  }

  try {
    const cookieStore = await cookies()

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              )
            } catch (error) {
              console.error('⚠️ [CALLBACK] Cookie setting error:', error)
            }
          },
        },
      }
    )

    // ─── Exchange code for session ────────────────────────────────────────────
    console.log('🔄 [CALLBACK] Exchanging code for session...')
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error('❌ [CALLBACK] Exchange failed:', exchangeError.message)
      return NextResponse.redirect(
        new URL(`/signin?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
      )
    }

    if (!data.session) {
      console.error('❌ [CALLBACK] No session returned')
      return NextResponse.redirect(new URL('/signin?error=no_session', requestUrl.origin))
    }

    console.log('✅ [CALLBACK] Session created for:', data.session.user.id)

    // ─── Step 1: DB lookup WITH retry (must happen before finalUserType is set) ──
    // Production bug fix: on cold Render starts the DB query can fail or return
    // an error. We retry up to 4 times with 600ms gaps so the DB has time to
    // respond before we fall through to an incorrect default.
    let existingUser: any = null
    let existingUserError: any = null

    for (let attempt = 0; attempt < 4; attempt++) {
      const { data: row, error: rowErr } = await supabase
        .from('users')
        .select('id, user_type, email, verification_status, onboarding_completed, created_at')
        .eq('id', data.session.user.id)
        .single()

      if (row && !rowErr) {
        existingUser = row
        existingUserError = null
        console.log(`✅ [CALLBACK] DB user record found on attempt ${attempt + 1}`)
        break
      }

      // PGRST116 = no rows — genuine new user, no point retrying
      if (rowErr?.code === 'PGRST116') {
        existingUserError = rowErr
        console.log('📝 [CALLBACK] No DB record yet (new user)')
        break
      }

      // Any other error — retry after a short wait
      existingUserError = rowErr
      console.warn(`⏳ [CALLBACK] DB query failed (attempt ${attempt + 1}/4):`, rowErr?.message)
      await new Promise(resolve => setTimeout(resolve, 600))
    }

    // ─── Step 2: Resolve user_type — DB is always source of truth if it exists ──
    // Order of priority:
    //   1. DB user_type  (most reliable — set during registration)
    //   2. cookie        (set by frontend during signup flow)
    //   3. URL param     (passed by frontend during signup redirect)
    //   4. auth metadata (set by a previous callback run)
    //   5. 'tenant'      (safe default — only reached for genuine new users)
    let cookieUserType: string | null = null
    try {
      const cookieHeader = request.headers.get('cookie') || ''
      const match = cookieHeader.match(/nulo_user_type=([^;]+)/)
      if (match) {
        cookieUserType = decodeURIComponent(match[1])
        console.log('🍪 [CALLBACK] Found user_type in cookie:', cookieUserType)
      }
    } catch (cookieError) {
      console.warn('⚠️ [CALLBACK] Error reading user_type cookie:', cookieError)
    }

    const urlUserType  = requestUrl.searchParams.get('user_type')
    const metaUserType = data.session.user.user_metadata?.user_type
    const dbUserType   = existingUser?.user_type as string | undefined

    // DB always wins for existing users — prevents cookie/URL/metadata from
    // overwriting a landlord back to 'tenant' on returning sign-ins.
    let finalUserType: string =
      dbUserType ||
      cookieUserType ||
      urlUserType ||
      metaUserType ||
      'tenant'

    console.log('✅ [CALLBACK] user_type resolution:', {
      db: dbUserType,
      cookie: cookieUserType,
      url: urlUserType,
      meta: metaUserType,
      final: finalUserType,
    })

    // ─── Step 3: Compute isReturningUser AFTER we have the DB result ────────────
    // "Returning" = row existed AND account is older than 60 seconds.
    // A brand-new OAuth signup has a DB row (trigger creates it immediately)
    // but the account age distinguishes it from a genuine returning user.
    const accountAgeMs = existingUser?.created_at
      ? Date.now() - new Date(existingUser.created_at).getTime()
      : Infinity
    const isReturningUser = !!existingUser && !existingUserError && accountAgeMs > 60_000

    console.log('📝 [CALLBACK] isReturningUser:', isReturningUser, '| accountAgeMs:', accountAgeMs)

    // ─── Step 4: Update auth metadata AFTER finalUserType is correctly resolved ──
    // Bug fix: previously this ran before the DB lookup, so it could write
    // 'tenant' into metadata for a returning landlord with no cookie/URL param.
    if (!data.session.user.user_metadata?.user_type || data.session.user.user_metadata?.user_type !== finalUserType) {
      const { error: updateError } = await supabase.auth.updateUser({
        data: { user_type: finalUserType },
      })
      if (updateError) {
        console.warn('⚠️ [CALLBACK] Could not update metadata:', updateError.message)
      } else {
        console.log('✅ [CALLBACK] Auth metadata synced with user_type:', finalUserType)
      }
    }

    // Handle duplicate email across different auth UIDs (edge case)
    if (!isReturningUser) {
      const { data: emailUser } = await supabase
        .from('users')
        .select('id, user_type, email')
        .eq('email', data.session.user.email?.toLowerCase())
        .neq('id', data.session.user.id)
        .single()

      if (emailUser) {
        console.warn('⚠️ [CALLBACK] Duplicate email across UIDs — using existing user type')
        finalUserType = emailUser.user_type as string
      }
    }

    // ─── Wait for DB trigger (new users only) ─────────────────────────────────
    if (!isReturningUser) {
      const userExists = await ensureUserRecordExists(supabase, data.session.user.id)
      if (!userExists) {
        console.error('❌ [CALLBACK] User record was not created by trigger — continuing anyway')
      }
    }

    // ─── Update user_type in DB ────────────────────────────────────────────────
    // For returning users: DO NOT overwrite user_type — DB already has the correct value.
    // Only update for new users or if metadata was missing.
    if (!isReturningUser) {
      const updateData: any = { user_type: finalUserType }
      if (finalUserType === 'landlord') {
        updateData.verification_status = 'pending'
      }

      const { error: dbError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', data.session.user.id)

      if (dbError) {
        console.warn('⚠️ [CALLBACK] Could not update database:', dbError.message)
      } else {
        console.log('✅ [CALLBACK] Database updated for new user:', updateData)
      }
    } else {
      console.log('✅ [CALLBACK] Returning user — skipping DB user_type overwrite')
    }

    // ─── 🔄 SYNC PROFILE + SIGNUP NOTIFICATION (Google OAuth only) ──────────
    // Manual email signup handles both of these in AuthContext.tsx after
    // supabase.auth.signUp(). Google OAuth users skip that path entirely and
    // land here instead — so we fire both from route.ts.
    //
    // Detect OAuth vs email: OAuth users have no password_hash and their
    // identity provider is 'google'. The most reliable signal is checking
    // identities[0].provider — but a simpler proxy is: if the user's
    // auth_provider metadata is not 'email', it came through OAuth.
    const isOAuthUser = data.session.user.user_metadata?.auth_provider !== 'email'
      && data.session.user.app_metadata?.provider !== 'email'

    // "New" = account created in the last 60 seconds (first OAuth login only)
    const isNewOAuthUser = (() => {
      const createdAt = new Date(data.session.user.created_at).getTime()
      return Date.now() - createdAt < 60_000
    })()

    const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || ''

    if (isOAuthUser && isNewOAuthUser && backendUrl) {
      const googleName =
        data.session.user.user_metadata?.full_name ||
        data.session.user.user_metadata?.name ||
        data.session.user.email ||
        'User'

      const firstName = data.session.user.user_metadata?.given_name
        || googleName.split(' ')[0]
        || googleName
      const lastName  = data.session.user.user_metadata?.family_name
        || googleName.split(' ').slice(1).join(' ')
        || ''

      // 1️⃣ Sync profile with FastAPI backend (creates landlord_profiles row etc.)
      try {
        console.log('🔄 [CALLBACK] Syncing Google OAuth user with backend...')
        const syncRes = await fetch(`${backendUrl}/api/v1/auth/sync-user-profile`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            user_id:    data.session.user.id,
            email:      data.session.user.email,
            first_name: firstName,
            last_name:  lastName,
            full_name:  googleName,
            user_type:  finalUserType,
            auth_provider: 'google',
          }),
        })
        if (syncRes.ok) {
          console.log('✅ [CALLBACK] Google OAuth profile synced with backend')
        } else {
          console.warn('⚠️ [CALLBACK] sync-user-profile returned:', syncRes.status)
        }
      } catch (syncErr: any) {
        // Non-fatal — user is already created in Supabase
        console.warn('⚠️ [CALLBACK] sync-user-profile failed (non-fatal):', syncErr.message)
      }

      // 2️⃣ Fire signup notification (in-app + email welcome) - ONLY for NEW users
      if (isNewOAuthUser) {
        try {
          const notifRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/signup-notification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id:    data.session.user.id,
              user_email: data.session.user.email,
              user_name:  googleName,
              user_type:  finalUserType,
              is_oauth:   true,   // triggers welcome email (notify_email_verified never fires for OAuth)
            }),
          })
          if (notifRes.ok) {
            console.log('✅ [CALLBACK] Signup notification fired for NEW Google OAuth user')
          } else {
            console.warn('⚠️ [CALLBACK] signup notification returned:', notifRes.status)
          }
        } catch (notifErr: any) {
          // Non-fatal
          console.warn('⚠️ [CALLBACK] Signup notification failed (non-fatal):', notifErr.message)
        }
      } else {
        console.log('👋 [CALLBACK] Returning OAuth user - skipping signup notification')
      }
    }

    // ─── 🔔 CREATE WELCOME IN-APP NOTIFICATION ────────────────────────────────
    // Only for brand-new users. Returning users signing in never get a welcome message.
    const shouldShowWelcome = isOAuthUser ? isNewOAuthUser : !isReturningUser

    if (shouldShowWelcome) {
      console.log('🎉 [CALLBACK] New user detected - creating welcome notification')
      await createWelcomeNotification(data.session.user.id, finalUserType)
    } else {
      console.log('👋 [CALLBACK] Returning user - skipping welcome notification')
    }

    // ─── Determine redirect ────────────────────────────────────────────────────
    let customRedirectTo: string | null = null
    try {
      const cookieHeader = request.headers.get('cookie') || ''
      const match = cookieHeader.match(/nulo_redirect_path=([^;]+)/)
      if (match) {
        customRedirectTo = decodeURIComponent(match[1])
        console.log('🍪 [CALLBACK] Found redirect path in cookie:', customRedirectTo)
      }
    } catch (cookieError) {
      console.warn('⚠️ [CALLBACK] Error reading redirect cookie:', cookieError)
    }

    // For returning users, use DB onboarding_completed (more reliable than metadata)
    const isOnboarded = isReturningUser
      ? (existingUser?.onboarding_completed === true)
      : false

    let redirectTo = '/properties'

    if (finalUserType === 'admin') {
      redirectTo = '/admin'
    } else if (finalUserType === 'landlord') {
      if (customRedirectTo && !customRedirectTo.startsWith('/properties')) {
        // Respect custom redirect only if it's not a tenant page
        redirectTo = customRedirectTo
      } else if (isReturningUser && existingUser?.onboarding_completed === true) {
        // Returning landlord who already finished onboarding → dashboard
        redirectTo = '/landlord/overview'
      } else {
        // New landlord OR returning landlord who never finished onboarding → onboarding
        redirectTo = '/onboarding/landlord/step-1'
      }
    } else if (finalUserType === 'tenant') {
      // Tenants: use the saved property page or fall back to /properties
      redirectTo = customRedirectTo || '/properties'
    }

    // ✅ Append verify/oauth param for any landlord going to onboarding
    // (new users, OR returning users who never finished onboarding).
    if (finalUserType === 'landlord' && redirectTo.includes('/onboarding/')) {
      const separator = redirectTo.includes('?') ? '&' : '?'
      const verifyParam = isOAuthUser ? 'oauth=1' : 'verified=1'
      redirectTo = `${redirectTo}${separator}${verifyParam}`
    }

    console.log('🔀 [CALLBACK] Final redirect to:', redirectTo)

    const response = NextResponse.redirect(new URL(redirectTo, requestUrl.origin))

    // Clear temporary cookies
    response.cookies.delete('nulo_redirect_path')
    response.cookies.delete('nulo_user_type')
    response.headers.set('X-Robots-Tag', 'noindex')

    return response
  } catch (error: any) {
    console.error('❌ [CALLBACK] Exception:', error)
    console.error('❌ [CALLBACK] Stack:', error.stack)
    return NextResponse.redirect(
      new URL('/signin?error=callback_error', requestUrl.origin)
    )
  }
}
























// import { createServerClient } from '@supabase/ssr'
// import { cookies } from 'next/headers'
// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'

// export const dynamic = 'force-dynamic'

// // ─── Helper: Wait for user record to exist ────────────────────────────────────
// async function ensureUserRecordExists(
//   supabase: any,
//   userId: string,
//   maxAttempts = 5
// ): Promise<boolean> {
//   for (let i = 0; i < maxAttempts; i++) {
//     const { data } = await supabase
//       .from('users')
//       .select('id')
//       .eq('id', userId)
//       .single()

//     if (data) {
//       console.log('✅ [CALLBACK] User record found in database')
//       return true
//     }

//     console.log(`⏳ [CALLBACK] Waiting for user record... attempt ${i + 1}/${maxAttempts}`)
//     await new Promise(resolve => setTimeout(resolve, 500))
//   }

//   console.warn('⚠️ [CALLBACK] User record not found after waiting')
//   return false
// }

// // ─── Helper: Create in-app notification via your FastAPI backend ──────────────
// // This is called AFTER successful email verification so the landlord/tenant
// // sees a welcome notification inside your app the first time they log in.
// async function createWelcomeNotification(
//   userId: string,
//   userType: 'landlord' | 'tenant' | string
// ): Promise<void> {
//   const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL

//   if (!backendUrl) {
//     console.warn('⚠️ [CALLBACK] No backend URL configured — skipping welcome notification')
//     return
//   }

//   // Build the right message depending on user type
//   const notificationPayload =
//     userType === 'landlord'
//       ? {
//           user_id: userId,
//           title: '🎉 Email Verified!',
//           message:
//             'Your email has been confirmed. Complete your 5-step onboarding to get verified and start listing properties.',
//           type: 'email_verified',
//           link: '/onboarding/landlord/step-1',
//         }
//       : {
//           user_id: userId,
//           title: '🎉 Email Verified!',
//           message:
//             'Your email has been confirmed. Complete your profile to start browsing verified properties.',
//           type: 'email_verified',
//           link: '/onboarding/tenant/step-1',
//         }

//   try {
//     console.log('🔔 [CALLBACK] Creating welcome notification for user:', userId)

//     const response = await fetch(`${backendUrl}/api/v1/notifications/internal/create`, {
//       method: 'POST',
//       headers: {
//         'Content-Type': 'application/json',
//         // Use your internal service key if you have one, otherwise
//         // protect this endpoint at the network/infrastructure level
//         'X-Internal-Service-Key': process.env.INTERNAL_SERVICE_KEY || '',
//       },
//       body: JSON.stringify(notificationPayload),
//     })

//     if (response.ok) {
//       console.log('✅ [CALLBACK] Welcome notification created successfully')
//     } else {
//       const body = await response.text()
//       console.warn('⚠️ [CALLBACK] Notification API returned non-OK:', response.status, body)
//     }
//   } catch (err: any) {
//     // Non-fatal — don't fail the auth flow if notification creation fails
//     console.warn('⚠️ [CALLBACK] Could not create welcome notification:', err.message)
//   }
// }

// // ─── Main GET Handler ─────────────────────────────────────────────────────────
// export async function GET(request: NextRequest) {
//   const requestUrl = new URL(request.url)
//   const code = requestUrl.searchParams.get('code')
//   const error = requestUrl.searchParams.get('error')
//   const error_code = requestUrl.searchParams.get('error_code')
//   const error_description = requestUrl.searchParams.get('error_description')
//   const user_type = requestUrl.searchParams.get('user_type') || 'tenant'

//   console.log('🔄 [CALLBACK] Processing OAuth/email callback')
//   console.log('📝 [CALLBACK] Full URL:', request.url)
//   console.log('📝 [CALLBACK] Code:', code?.substring(0, 20) + '...')
//   console.log('📝 [CALLBACK] User type from URL:', requestUrl.searchParams.get('user_type'))
//   console.log('📝 [CALLBACK] User type (final):', user_type)
//   console.log('🌍 [CALLBACK] Origin:', requestUrl.origin)

//   // ─── Handle email verification errors ──────────────────────────────────────
//   if (error || error_code) {
//     console.error('❌ [CALLBACK] Email verification error:', error, error_code)

//     const errorMap: Record<string, { message: string; action: string }> = {
//       otp_expired: {
//         message: 'Email verification link has expired',
//         action: 'Please sign in and request a new verification link',
//       },
//       invalid_otp: {
//         message: 'Email verification link is invalid',
//         action: 'Please sign in and request a new verification link',
//       },
//       access_denied: {
//         message: 'Email verification was denied',
//         action: 'Please sign in and try again',
//       },
//     }

//     const errorInfo = errorMap[error_code as string] || {
//       message: error_description || 'Email verification failed',
//       action: 'Please sign in and try again',
//     }

//     return NextResponse.redirect(
//       new URL(
//         `/auth/verify-email-failed?error=${encodeURIComponent(
//           (error_code || error) ?? 'unknown_error'
//         )}&message=${encodeURIComponent(errorInfo.message)}`,
//         requestUrl.origin
//       )
//     )
//   }

//   // ─── No code = can't proceed ────────────────────────────────────────────────
//   if (!code) {
//     console.error('❌ [CALLBACK] No code provided')
//     return NextResponse.redirect(
//       new URL(
//         '/auth/verify-email-failed?error=no_code&message=' +
//           encodeURIComponent('No verification code found. Please check your email again.'),
//         requestUrl.origin
//       )
//     )
//   }

//   try {
//     const cookieStore = await cookies()

//     const supabase = createServerClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//       {
//         cookies: {
//           getAll() {
//             return cookieStore.getAll()
//           },
//           setAll(cookiesToSet) {
//             try {
//               cookiesToSet.forEach(({ name, value, options }) =>
//                 cookieStore.set(name, value, options)
//               )
//             } catch (error) {
//               console.error('⚠️ [CALLBACK] Cookie setting error:', error)
//             }
//           },
//         },
//       }
//     )

//     // ─── Exchange code for session ────────────────────────────────────────────
//     console.log('🔄 [CALLBACK] Exchanging code for session...')
//     const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

//     if (exchangeError) {
//       console.error('❌ [CALLBACK] Exchange failed:', exchangeError.message)
//       return NextResponse.redirect(
//         new URL(`/signin?error=${encodeURIComponent(exchangeError.message)}`, requestUrl.origin)
//       )
//     }

//     if (!data.session) {
//       console.error('❌ [CALLBACK] No session returned')
//       return NextResponse.redirect(new URL('/signin?error=no_session', requestUrl.origin))
//     }

//     console.log('✅ [CALLBACK] Session created for:', data.session.user.id)

//     // ─── Resolve user_type (cookie → URL param → metadata → default) ──────────
//     let cookieUserType: string | null = null
//     try {
//       const cookieHeader = request.headers.get('cookie') || ''
//       const match = cookieHeader.match(/nulo_user_type=([^;]+)/)
//       if (match) {
//         cookieUserType = decodeURIComponent(match[1])
//         console.log('🍪 [CALLBACK] Found user_type in cookie:', cookieUserType)
//       }
//     } catch (cookieError) {
//       console.warn('⚠️ [CALLBACK] Error reading user_type cookie:', cookieError)
//     }

//     const urlUserType = requestUrl.searchParams.get('user_type')
//     const metaUserType = data.session.user.user_metadata?.user_type
//     let finalUserType: string = cookieUserType || urlUserType || metaUserType || 'tenant'
//     console.log('✅ [CALLBACK] Final user_type:', finalUserType)

//     // ─── Update metadata if missing ────────────────────────────────────────────
//     if (!data.session.user.user_metadata?.user_type) {
//       const { error: updateError } = await supabase.auth.updateUser({
//         data: { user_type: finalUserType },
//       })
//       if (updateError) {
//         console.warn('⚠️ [CALLBACK] Could not update metadata:', updateError.message)
//       }
//     }

//     // ─── Look up existing user record by auth UID (most reliable) ─────────────
//     const { data: existingUser, error: existingUserError } = await supabase
//       .from('users')
//       .select('id, user_type, email, verification_status, onboarding_completed, created_at')
//       .eq('id', data.session.user.id)
//       .single()

//     // ⚠️  A DB row existing does NOT mean "returning user".
//     // Supabase fires a trigger that inserts into public.users the moment
//     // auth.users is created — so for a brand-new Google OAuth signup the row
//     // already exists by the time we query here.
//     //
//     // "Returning" = account was created more than 60 seconds ago, meaning
//     // this is NOT the very first OAuth callback for this user.
//     const accountAgeMs = existingUser?.created_at
//       ? Date.now() - new Date(existingUser.created_at).getTime()
//       : Infinity
//     const isReturningUser = !!existingUser && !existingUserError && accountAgeMs > 60_000

//     if (isReturningUser) {
//       // ✅ CRITICAL: For returning users always trust the DB user_type.
//       // Cookies and URL params are only set during the signup flow — a returning
//       // user signing in via Google has no nulo_user_type cookie, so we must NOT
//       // fall back to 'tenant' default. The DB is the source of truth.
//       const dbUserType = existingUser.user_type as string
//       if (dbUserType && dbUserType !== finalUserType) {
//         console.log(`🔄 [CALLBACK] Overriding user_type from '${finalUserType}' → '${dbUserType}' (DB is source of truth for returning user)`)
//         finalUserType = dbUserType
//       }
//     }

//     // Handle duplicate email across different auth UIDs (edge case)
//     if (!isReturningUser) {
//       const { data: emailUser } = await supabase
//         .from('users')
//         .select('id, user_type, email')
//         .eq('email', data.session.user.email?.toLowerCase())
//         .neq('id', data.session.user.id)
//         .single()

//       if (emailUser) {
//         console.warn('⚠️ [CALLBACK] Duplicate email across UIDs — using existing user type')
//         finalUserType = emailUser.user_type as string
//       }
//     }

//     if (existingUserError && existingUserError.code !== 'PGRST116') {
//       console.warn('⚠️ [CALLBACK] Error checking existing user:', existingUserError.message)
//     }

//     // ─── Wait for DB trigger (new users only) ─────────────────────────────────
//     if (!isReturningUser) {
//       const userExists = await ensureUserRecordExists(supabase, data.session.user.id)
//       if (!userExists) {
//         console.error('❌ [CALLBACK] User record was not created by trigger — continuing anyway')
//       }
//     }

//     // ─── Update user_type in DB ────────────────────────────────────────────────
//     // For returning users: DO NOT overwrite user_type — DB already has the correct value.
//     // Only update for new users or if metadata was missing.
//     if (!isReturningUser) {
//       const updateData: any = { user_type: finalUserType }
//       if (finalUserType === 'landlord') {
//         updateData.verification_status = 'pending'
//       }

//       const { error: dbError } = await supabase
//         .from('users')
//         .update(updateData)
//         .eq('id', data.session.user.id)

//       if (dbError) {
//         console.warn('⚠️ [CALLBACK] Could not update database:', dbError.message)
//       } else {
//         console.log('✅ [CALLBACK] Database updated for new user:', updateData)
//       }
//     } else {
//       console.log('✅ [CALLBACK] Returning user — skipping DB user_type overwrite')
//     }

//     // ─── 🔄 SYNC PROFILE + SIGNUP NOTIFICATION (Google OAuth only) ──────────
//     // Manual email signup handles both of these in AuthContext.tsx after
//     // supabase.auth.signUp(). Google OAuth users skip that path entirely and
//     // land here instead — so we fire both from route.ts.
//     //
//     // Detect OAuth vs email: OAuth users have no password_hash and their
//     // identity provider is 'google'. The most reliable signal is checking
//     // identities[0].provider — but a simpler proxy is: if the user's
//     // auth_provider metadata is not 'email', it came through OAuth.
//     const isOAuthUser = data.session.user.user_metadata?.auth_provider !== 'email'
//       && data.session.user.app_metadata?.provider !== 'email'

//     // "New" = account created in the last 60 seconds (first OAuth login only)
//     const isNewOAuthUser = (() => {
//       const createdAt = new Date(data.session.user.created_at).getTime()
//       return Date.now() - createdAt < 60_000
//     })()

//     const backendUrl = process.env.NEXT_PUBLIC_API_URL || process.env.BACKEND_URL || ''

//     if (isOAuthUser && isNewOAuthUser && backendUrl) {
//       const googleName =
//         data.session.user.user_metadata?.full_name ||
//         data.session.user.user_metadata?.name ||
//         data.session.user.email ||
//         'User'

//       const firstName = data.session.user.user_metadata?.given_name
//         || googleName.split(' ')[0]
//         || googleName
//       const lastName  = data.session.user.user_metadata?.family_name
//         || googleName.split(' ').slice(1).join(' ')
//         || ''

//       // 1️⃣ Sync profile with FastAPI backend (creates landlord_profiles row etc.)
//       try {
//         console.log('🔄 [CALLBACK] Syncing Google OAuth user with backend...')
//         const syncRes = await fetch(`${backendUrl}/api/v1/auth/sync-user-profile`, {
//           method: 'POST',
//           headers: { 'Content-Type': 'application/json' },
//           body: JSON.stringify({
//             user_id:    data.session.user.id,
//             email:      data.session.user.email,
//             first_name: firstName,
//             last_name:  lastName,
//             full_name:  googleName,
//             user_type:  finalUserType,
//             auth_provider: 'google',
//           }),
//         })
//         if (syncRes.ok) {
//           console.log('✅ [CALLBACK] Google OAuth profile synced with backend')
//         } else {
//           console.warn('⚠️ [CALLBACK] sync-user-profile returned:', syncRes.status)
//         }
//       } catch (syncErr: any) {
//         // Non-fatal — user is already created in Supabase
//         console.warn('⚠️ [CALLBACK] sync-user-profile failed (non-fatal):', syncErr.message)
//       }

//       // 2️⃣ Fire signup notification (in-app + email welcome) - ONLY for NEW users
//       if (isNewOAuthUser) {
//         try {
//           const notifRes = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/signup-notification`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify({
//               user_id:    data.session.user.id,
//               user_email: data.session.user.email,
//               user_name:  googleName,
//               user_type:  finalUserType,
//               is_oauth:   true,   // triggers welcome email (notify_email_verified never fires for OAuth)
//             }),
//           })
//           if (notifRes.ok) {
//             console.log('✅ [CALLBACK] Signup notification fired for NEW Google OAuth user')
//           } else {
//             console.warn('⚠️ [CALLBACK] signup notification returned:', notifRes.status)
//           }
//         } catch (notifErr: any) {
//           // Non-fatal
//           console.warn('⚠️ [CALLBACK] Signup notification failed (non-fatal):', notifErr.message)
//         }
//       } else {
//         console.log('👋 [CALLBACK] Returning OAuth user - skipping signup notification')
//       }
//     }

//     // ─── 🔔 CREATE WELCOME IN-APP NOTIFICATION ────────────────────────────────
//     // Only for brand-new users. Returning users signing in never get a welcome message.
//     const shouldShowWelcome = isOAuthUser ? isNewOAuthUser : !isReturningUser

//     if (shouldShowWelcome) {
//       console.log('🎉 [CALLBACK] New user detected - creating welcome notification')
//       await createWelcomeNotification(data.session.user.id, finalUserType)
//     } else {
//       console.log('👋 [CALLBACK] Returning user - skipping welcome notification')
//     }

//     // ─── Determine redirect ────────────────────────────────────────────────────
//     let customRedirectTo: string | null = null
//     try {
//       const cookieHeader = request.headers.get('cookie') || ''
//       const match = cookieHeader.match(/nulo_redirect_path=([^;]+)/)
//       if (match) {
//         customRedirectTo = decodeURIComponent(match[1])
//         console.log('🍪 [CALLBACK] Found redirect path in cookie:', customRedirectTo)
//       }
//     } catch (cookieError) {
//       console.warn('⚠️ [CALLBACK] Error reading redirect cookie:', cookieError)
//     }

//     // For returning users, use DB onboarding_completed (more reliable than metadata)
//     const isOnboarded = isReturningUser
//       ? (existingUser?.onboarding_completed === true)
//       : false

//     let redirectTo = '/properties'

//     if (finalUserType === 'admin') {
//       redirectTo = '/admin'
//     } else if (finalUserType === 'landlord') {
//       if (customRedirectTo && !customRedirectTo.startsWith('/properties')) {
//         // Respect custom redirect only if it's not a tenant page
//         redirectTo = customRedirectTo
//       } else if (isReturningUser && existingUser?.onboarding_completed === true) {
//         // Returning landlord who already finished onboarding → dashboard
//         redirectTo = '/landlord/overview'
//       } else {
//         // New landlord OR returning landlord who never finished onboarding → onboarding
//         redirectTo = '/onboarding/landlord/step-1'
//       }
//     } else if (finalUserType === 'tenant') {
//       // Tenants: use the saved property page or fall back to /properties
//       redirectTo = customRedirectTo || '/properties'
//     }

//     // ✅ Append verify/oauth param for any landlord going to onboarding
//     // (new users, OR returning users who never finished onboarding).
//     if (finalUserType === 'landlord' && redirectTo.includes('/onboarding/')) {
//       const separator = redirectTo.includes('?') ? '&' : '?'
//       const verifyParam = isOAuthUser ? 'oauth=1' : 'verified=1'
//       redirectTo = `${redirectTo}${separator}${verifyParam}`
//     }

//     console.log('🔀 [CALLBACK] Final redirect to:', redirectTo)

//     const response = NextResponse.redirect(new URL(redirectTo, requestUrl.origin))

//     // Clear temporary cookies
//     response.cookies.delete('nulo_redirect_path')
//     response.cookies.delete('nulo_user_type')
//     response.headers.set('X-Robots-Tag', 'noindex')

//     return response
//   } catch (error: any) {
//     console.error('❌ [CALLBACK] Exception:', error)
//     console.error('❌ [CALLBACK] Stack:', error.stack)
//     return NextResponse.redirect(
//       new URL('/signin?error=callback_error', requestUrl.origin)
//     )
//   }
// }