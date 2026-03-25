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
  const state = url.searchParams.get('state')
  const error = url.searchParams.get('error')

  // ✅ CRITICAL DEBUGGING: Log all parameters received
  console.log('[GOOGLE-CB] ========================================')
  console.log('[GOOGLE-CB] CALLBACK RECEIVED')
  console.log('[GOOGLE-CB] State parameter:', state)
  console.log('[GOOGLE-CB] State is null/undefined:', !state)
  console.log('[GOOGLE-CB] Full URL:', request.url)
  console.log('[GOOGLE-CB] ========================================')

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

  // ── Parse state parameter ──────────────────────────────────────────────────
  // state format: "{userType}:{nonce}"  e.g. "landlord:abc123" or "signin:abc123"
  // CRITICAL: "signin" is NOT a user type choice - it means "use DB type for returning users"
  let userTypeFromState: string | null = null  // null = use DB type for returning users
  let isSigninOnlyState = false
  let nonceFromState: string | undefined

  if (state && state.includes(':')) {
    const [extractedType, extractedNonce] = state.split(':')
    
    // ✅ CRITICAL: Handle "signin" specially - it's NOT a user type
    if (extractedType === 'signin') {
      // Signin flow: Don't impose a type, let DB decide for returning users
      isSigninOnlyState = true
      userTypeFromState = null
      nonceFromState = extractedNonce
      console.log('[GOOGLE-CB] ✅ State parsed successfully (SIGNIN FLOW)')
      console.log('[GOOGLE-CB] Extracted type: signin (no type imposed)')
      console.log('[GOOGLE-CB] Will use DB user type for returning users')
      console.log('[GOOGLE-CB] Extracted nonce:', nonceFromState)
    } else if (['tenant', 'landlord', 'admin'].includes(extractedType)) {
      // Signup or type-switch flow: Use the specified type
      userTypeFromState = extractedType
      nonceFromState = extractedNonce
      console.log('[GOOGLE-CB] ✅ State parsed successfully')
      console.log('[GOOGLE-CB] Extracted user type:', extractedType)
      console.log('[GOOGLE-CB] User is explicitly choosing this type')
      console.log('[GOOGLE-CB] Extracted nonce:', nonceFromState)
    } else {
      console.warn('[GOOGLE-CB] ⚠️ Unknown user type in state:', extractedType)
      // Default to tenant for unknown types
      userTypeFromState = 'tenant'
    }
  } else {
    // ✅ NEW: Better logging when state is missing
    console.warn('[GOOGLE-CB] ⚠️ State parameter missing or malformed:', state)
    console.log('[GOOGLE-CB] Defaulting to "tenant" for safety')
    userTypeFromState = 'tenant'
  }

  // ── Validate CSRF nonce ────────────────────────────────────────────────────
  const cookieHeader = request.headers.get('cookie') || ''
  const nonceMatch   = cookieHeader.match(/nulo_oauth_nonce=([^;]+)/)
  const storedNonce  = nonceMatch ? decodeURIComponent(nonceMatch[1]) : null

  console.log('[GOOGLE-CB] Nonce validation:')
  console.log('[GOOGLE-CB]   Raw cookie:', cookieHeader)
  console.log('[GOOGLE-CB]   Nonce match found:', !!nonceMatch)
  console.log('[GOOGLE-CB]   Raw stored nonce (before decode):', nonceMatch ? nonceMatch[1] : 'NOT FOUND')
  console.log('[GOOGLE-CB]   Decoded stored nonce:', storedNonce)
  console.log('[GOOGLE-CB]   Nonce from state:', nonceFromState)
  console.log('[GOOGLE-CB]   Nonces match:', storedNonce === nonceFromState)
  console.log('[GOOGLE-CB]   Both present:', !!storedNonce && !!nonceFromState)

  if (!storedNonce || storedNonce !== nonceFromState) {
    console.error('[GOOGLE-CB] ❌ CSRF nonce mismatch or missing!')
    console.error('[GOOGLE-CB]   Cookie has nonce:', !!storedNonce)
    console.error('[GOOGLE-CB]   State has nonce:', !!nonceFromState)
    if (storedNonce && nonceFromState) {
      console.error('[GOOGLE-CB]   Stored:', storedNonce)
      console.error('[GOOGLE-CB]   From state:', nonceFromState)
      console.error('[GOOGLE-CB]   Match result:', storedNonce === nonceFromState)
    }
    return NextResponse.redirect(new URL('/signin?error=csrf_failed', url.origin))
  }

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

    // ── Check if user already exists in public.users ────────────────────────
    // ✅ FIX: Use retry logic to handle DB cold starts
    let existingUser = null
    let userQueryError = null
    
    for (let attempt = 0; attempt < 4; attempt++) {
      console.log(`[GOOGLE-CB] DB query attempt ${attempt + 1}/4...`)
      
      const result = await supabase
        .from('users')
        .select('id, user_type, onboarding_completed, email, verification_status, created_at')
        .eq('id', supabaseUser.id)
        .single()
      
      if (result.data && !result.error) {
        existingUser = result.data
        console.log(`[GOOGLE-CB] ✅ Found existing user on attempt ${attempt + 1}`)
        break
      }
      
      // PGRST116 = "No rows found" - this is expected for new users
      if (result.error?.code === 'PGRST116') {
        console.log('[GOOGLE-CB] No user found (expected for new signup users) - stopping retry')
        userQueryError = result.error
        break
      }
      
      // Other errors - retry with delay
      if (result.error && attempt < 3) {
        console.warn(`[GOOGLE-CB] Query failed on attempt ${attempt + 1}:`, result.error.message)
        await new Promise(resolve => setTimeout(resolve, 600))
      } else if (result.error) {
        userQueryError = result.error
        console.error(`[GOOGLE-CB] Query failed after all retries:`, result.error.message)
      }
    }

    console.log('[GOOGLE-CB] Query for existing user:')
    console.log('[GOOGLE-CB]   Error (expected if new):', userQueryError?.message)
    console.log('[GOOGLE-CB]   Existing user data:', existingUser)

    // ✅ BETTER SIGNAL: Detect signup vs signin using onboarding_completed status
    // - Signup flow: onboarding_completed = false (user just started or is new)
    // - Signin flow: onboarding_completed = true (user already went through flow)
    // This is more reliable than account age checks which fail with clock skew
    const isSignupFlow = !existingUser || existingUser.onboarding_completed === false
    const isSigninFlow = existingUser && existingUser.onboarding_completed === true
    
    console.log('[GOOGLE-CB] Flow detection:')
    console.log('[GOOGLE-CB]   Is signup flow:', isSignupFlow)
    console.log('[GOOGLE-CB]   Is signin flow:', isSigninFlow)
    console.log('[GOOGLE-CB]   onboarding_completed:', existingUser?.onboarding_completed)

    // ✅ NOW we can resolve user type (existingUser is defined!)
    const dbUserType = existingUser?.user_type

    // Check cookie for user_type (set during signup flow)
    const cookieMatch = cookieHeader.match(/nulo_user_type=([^;]+)/)
    const cookieUserType = cookieMatch ? decodeURIComponent(cookieMatch[1]) : null

    // Already have urlUserType (userTypeFromState) and metaUserType (not used in this route)
    const urlUserType = userTypeFromState
    const metaUserType = null // Could extract from metadata if needed

    // ✅ CRITICAL FIX: For signin-only flows, don't treat null/missing userType as a choice
    // isSigninOnlyState means state was "signin:nonce" - use DB type for returning users
    const userChoseTypeExplicitly = (
      !isSigninOnlyState &&  // ← KEY: For signin flows, this is false
      urlUserType && 
      urlUserType !== 'signin'
    )
    const hasExistingDifferentType = existingUser?.user_type && existingUser.user_type !== urlUserType

    // ✅ CORRECTED: Type switching logic
    let finalUserType: string
    
    if (userChoseTypeExplicitly && hasExistingDifferentType) {
      // User EXPLICITLY chose a different type during signup/type-switch
      // Example: Signing up as a different type, or clicking "I'm a landlord" button
      finalUserType = urlUserType!
      console.log('[GOOGLE-CB] 🔄 User switching types:', `${dbUserType} → ${urlUserType}`)
    } else if (isSigninOnlyState && isSigninFlow && dbUserType) {
      // ✅ FIX: Signin flow with "signin" state - PRESERVE existing user type
      finalUserType = dbUserType
      console.log('[GOOGLE-CB] 📝 Signin flow - preserving DB user type:', dbUserType)
    } else {
      // Standard fallback hierarchy (for new signups without explicit choice)
      finalUserType =
        dbUserType ||           // 1. DB (most reliable for existing users)
        cookieUserType ||       // 2. Cookie (from signup flow)
        urlUserType ||          // 3. URL/State (from OAuth state param)
        metaUserType ||         // 4. Metadata (from auth provider)
        'tenant'                // 5. Default (safe fallback)
    }

    console.log('[GOOGLE-CB] ✅ Complete user type resolution:')
    console.log('[GOOGLE-CB]   Is signin-only state:', isSigninOnlyState)
    console.log('[GOOGLE-CB]   Is signin flow:', isSigninFlow)
    console.log('[GOOGLE-CB]   DB user_type:', dbUserType || '(none)')
    console.log('[GOOGLE-CB]   Cookie user_type:', cookieUserType || '(none)')
    console.log('[GOOGLE-CB]   URL/State user_type:', urlUserType || '(none)')
    console.log('[GOOGLE-CB]   User chose type explicitly:', userChoseTypeExplicitly)
    console.log('[GOOGLE-CB]   Has existing different type:', hasExistingDifferentType)
    console.log('[GOOGLE-CB]   → Final user_type:', finalUserType)

    // ✅ FIX: Only sync for actual new signups or explicit type-switching
    // Don't sync for returning users just signing in with their existing type
    const shouldSyncUser = isSignupFlow || (userChoseTypeExplicitly && hasExistingDifferentType)
    
    console.log('[GOOGLE-CB] User classification:')
    console.log('[GOOGLE-CB]   Is signup flow:', isSignupFlow)
    console.log('[GOOGLE-CB]   Is signin flow:', isSigninFlow)
    console.log('[GOOGLE-CB]   Should sync with backend:', shouldSyncUser)
    console.log('[GOOGLE-CB]   Reason:', isSignupFlow ? 'new signup' : userChoseTypeExplicitly && hasExistingDifferentType ? 'type switch' : 'returning signin')

    // ✅ SIMPLIFIED: Use finalUserType directly (already handles all cases above)
    const resolvedUserType = finalUserType

    console.log('[GOOGLE-CB] Final resolved user_type:', resolvedUserType)

    // ── New user: sync with backend + notify ───────────────────────────────
    // Also sync if user is explicitly changing their type (e.g., tenant → landlord)
    if (shouldSyncUser) {
      const googleName =
        supabaseUser.user_metadata?.full_name ||
        supabaseUser.user_metadata?.name ||
        supabaseUser.email ||
        'User'

      // ✅ FIX: Update database immediately with correct user_type
      // This ensures the database is updated BEFORE backend sync, avoiding race conditions
      console.log('[GOOGLE-CB] Updating user record with correct user_type...')
      const updateData: any = { user_type: resolvedUserType }
      
      // For new landlords, set flags for onboarding
      if (resolvedUserType === 'landlord') {
        updateData.verification_status = 'pending'
        updateData.onboarding_completed = false  // ✅ Must complete 4Ps onboarding
      }
      
      const { error: dbUpdateError } = await supabase
        .from('users')
        .update(updateData)
        .eq('id', supabaseUser.id)
      
      if (dbUpdateError) {
        console.error('[GOOGLE-CB] ⚠️ Failed to update user_type in database:', dbUpdateError.message)
        // Continue - backend sync will attempt to set it
      } else {
        console.log('[GOOGLE-CB] ✅ User record updated:', updateData)
      }

      console.log('[GOOGLE-CB] Syncing new user with backend...')
      await syncNewOAuthUser(supabaseUser.id, supabaseUser.email!, googleName, resolvedUserType)
      
      console.log('[GOOGLE-CB] Firing signup notification...')
      await fireSignupNotification(supabaseUser.id, supabaseUser.email!, googleName, resolvedUserType)
      
      // ✅ CRITICAL: Verify AND refresh user data from database
      // Must refresh because we just updated onboarding_completed, and redirect logic needs fresh data
      console.log('[GOOGLE-CB] Verifying user in database...')
      
      let verifyError = null
      for (let attempt = 1; attempt <= 4; attempt++) {
        const result = await supabase
          .from('users')
          .select('id, user_type, email, onboarding_completed')
          .eq('id', supabaseUser.id)
          .single()
        
        if (!result.error && result.data) {
          // ✅ ESSENTIAL: Update existingUser with FRESH data after DB update
          // This ensures redirect logic uses the NEW onboarding_completed value (false for new landlords)
          existingUser = result.data
          
          console.log('[GOOGLE-CB] ✅ User verified in database:')
          console.log('[GOOGLE-CB]   ID:', existingUser.id)
          console.log('[GOOGLE-CB]   Email:', existingUser.email)
          console.log('[GOOGLE-CB]   User Type:', existingUser.user_type)
          console.log('[GOOGLE-CB]   Onboarding Completed:', existingUser.onboarding_completed)
          
          if (existingUser.user_type !== resolvedUserType) {
            console.error('[GOOGLE-CB] ⚠️ CRITICAL: User type mismatch!')
            console.error('[GOOGLE-CB]   Expected:', resolvedUserType)
            console.error('[GOOGLE-CB]   Got:', existingUser.user_type)
          }
          break
        }
        
        if (attempt < 4) {
          console.log(`[GOOGLE-CB] Verification attempt ${attempt}/4 failed, retrying...`)
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          verifyError = result.error
          console.warn('[GOOGLE-CB] User verification failed after all retries:', verifyError?.message)
        }
      }
    } else {
      console.log('[GOOGLE-CB] Signin flow (not syncing backend) - skipping sync and notification')
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
      // ✅ CRITICAL: Check onboarding_completed, not just isReturningUser
      // - Signup flow OR incomplete onboarding → go to onboarding
      // - Signin flow AND completed onboarding → go to dashboard
      if (isSigninFlow && existingUser?.onboarding_completed === true) {
        // User signing in who already completed onboarding
        redirectTo = '/landlord/overview'
      } else {
        // New signup OR incomplete onboarding
        redirectTo = '/onboarding/landlord/step-1?oauth=1'
      }
    } else if (resolvedUserType === 'tenant') {
      // Tenants: Smart redirection based on user context and activity
      if (customRedirect && customRedirect.startsWith('/properties/') && customRedirect !== '/properties') {
        // User was viewing a specific property page - return there
        redirectTo = customRedirect
        console.log('[GOOGLE-CB] Tenant: Returning to specific property page:', customRedirect)
      } else if (isSigninFlow) {
        // Returning tenant - check if they have applications/viewings
        console.log('[GOOGLE-CB] Tenant: Returning user, checking activity...')
        
        try {
          // Import and check APIs for tenant activity
          const [applicationsAPI, viewingRequestsAPI] = await Promise.all([
            import('@/lib/api/applications').then(mod => mod.applicationsAPI),
            import('@/lib/api/viewingRequestsTenant').then(mod => mod.viewingRequestsAPI)
          ]);

          // Check for applications and viewing requests in parallel
          const [applicationsResponse, viewingsResponse] = await Promise.allSettled([
            applicationsAPI.getMyApplicationsFast(),
            viewingRequestsAPI.getMyRequests()
          ]);

          const hasApplications = applicationsResponse.status === 'fulfilled' && 
                                applicationsResponse.value.success && 
                                applicationsResponse.value.applications.length > 0;
          
          const hasViewings = viewingsResponse.status === 'fulfilled' && 
                             viewingsResponse.value.success && 
                             viewingsResponse.value.data.length > 0;

          if (hasApplications || hasViewings) {
            redirectTo = '/tenant';
            console.log('[GOOGLE-CB] Tenant: Returning user with activity, going to dashboard', {
              hasApplications,
              hasViewings
            });
          } else {
            redirectTo = '/properties';
            console.log('[GOOGLE-CB] Tenant: Returning user but no activity, going to properties');
          }
        } catch (error) {
          console.warn('[GOOGLE-CB] Failed to check tenant activity, defaulting to properties:', error);
          redirectTo = '/properties';
        }
      } else {
        // New tenant - go to properties page to browse
        redirectTo = '/properties'
        console.log('[GOOGLE-CB] Tenant: New user, going to properties:', redirectTo)
      }
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
