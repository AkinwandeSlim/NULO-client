import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export const dynamic = 'force-dynamic'

// Helper to ensure user record exists in database
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

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const error_code = requestUrl.searchParams.get('error_code')
  const error_description = requestUrl.searchParams.get('error_description')
  const user_type = requestUrl.searchParams.get('user_type') || 'tenant'

  console.log('🔄 [CALLBACK] Processing OAuth callback')
  console.log('📝 [CALLBACK] Full URL:', request.url)
  console.log('📝 [CALLBACK] Code:', code?.substring(0, 20) + '...')
  console.log('📝 [CALLBACK] User type from URL:', requestUrl.searchParams.get('user_type'))
  console.log('📝 [CALLBACK] User type (final):', user_type)
  console.log('🌍 [CALLBACK] Origin:', requestUrl.origin)

  // ✅ Handle email verification errors
  if (error || error_code) {
    console.error('❌ [CALLBACK] Email verification error')
    console.error('   Error:', error)
    console.error('   Error code:', error_code)
    console.error('   Description:', error_description)

    // Map error codes to user-friendly messages
    const errorMap: Record<string, { message: string; action: string }> = {
      'otp_expired': {
        message: 'Email verification link has expired',
        action: 'Please sign in and request a new verification link'
      },
      'invalid_otp': {
        message: 'Email verification link is invalid',
        action: 'Please sign in and request a new verification link'
      },
      'access_denied': {
        message: 'Email verification was denied',
        action: 'Please sign in and try again'
      },
    }

    const errorInfo = errorMap[error_code as string] || {
      message: error_description || 'Email verification failed',
      action: 'Please sign in and try again'
    }

    console.log(`📧 [CALLBACK] ${errorInfo.message}`)
    console.log(`📧 [CALLBACK] User action: ${errorInfo.action}`)

    // Redirect to signin with better error message
    return NextResponse.redirect(
      new URL(
        `/auth/verify-email-failed?error=${encodeURIComponent((error_code || error) ?? 'unknown_error')}&message=${encodeURIComponent(errorInfo.message)}`,
        requestUrl.origin
      )
    )
  }

  // Validate code exists
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
    
    // Create server client with proper cookie handling
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

    // Exchange code for session
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
      return NextResponse.redirect(
        new URL('/signin?error=no_session', requestUrl.origin)
      )
    }

    console.log('✅ [CALLBACK] Session created for:', data.session.user.id)

    // ✅ NEW: Read user_type from multiple sources (prioritized)
    let cookieUserType: string | null = null
    try {
      const cookieHeader = request.headers.get('cookie') || ''
      console.log('📝 [CALLBACK] Raw cookie header:', cookieHeader.substring(0, 100) + (cookieHeader.length > 100 ? '...' : ''))
      
      // Try to find nulo_user_type cookie
      const userTypeCookieMatch = cookieHeader.match(/nulo_user_type=([^;]+)/)
      if (userTypeCookieMatch) {
        cookieUserType = decodeURIComponent(userTypeCookieMatch[1])
        console.log('🍪 [CALLBACK] ✅ Found user_type in cookie:', cookieUserType)
      } else {
        console.log('🍪 [CALLBACK] ❌ No nulo_user_type cookie found in headers')
        console.log('🍪 [CALLBACK] Cookies present:', cookieHeader.split(';').map(c => c.trim().split('=')[0]).join(', '))
      }
    } catch (cookieError) {
      console.warn('⚠️ [CALLBACK] Error reading user_type cookie:', cookieError)
    }

    // Get user_type from URL parameter and metadata as fallbacks
    const urlUserType = requestUrl.searchParams.get('user_type')
    const authenticatedUserType = data.session.user.user_metadata?.user_type
  
    console.log('📋 [CALLBACK] User type sources found:')
    console.log('   🍪 Cookie (PREFERRED):', cookieUserType || 'NOT FOUND')
    console.log('   📮 URL param (FALLBACK):', urlUserType || 'NOT FOUND')
    console.log('   📊 Metadata (FALLBACK):', authenticatedUserType || 'NOT FOUND')
  
    // Priority: Cookie (OAuth) > URL param (OAuth) > metadata (manual) > default to tenant
    let finalUserType = cookieUserType || urlUserType || authenticatedUserType || 'tenant'
    console.log('✅ [CALLBACK] Final user_type determined:', finalUserType)
    
    if (!cookieUserType && !urlUserType && !authenticatedUserType) {
      console.warn('⚠️ [CALLBACK] WARNING: Falling back to default tenant (no cookie, URL param, or metadata found)')
    }

    // IMPORTANT: Only update if metadata is missing
    if (!data.session.user.user_metadata?.user_type) {
      console.log('🔄 [CALLBACK] user_type missing from metadata, updating...')
      const { error: updateError } = await supabase.auth.updateUser({
        data: { user_type: finalUserType }
      })

      if (updateError) {
        console.warn('⚠️ [CALLBACK] Could not update metadata:', updateError.message)
      } else {
        console.log('✅ [CALLBACK] Metadata updated with user_type:', finalUserType)
      }
    } else {
      console.log('✅ [CALLBACK] user_type already in metadata:', data.session.user.user_metadata.user_type)
    }

    // ✅ NEW: Check if user with this email already exists (duplicate email handling)
    console.log('🔍 [CALLBACK] Checking if user with email already exists...')
    const { data: existingUser, error: existingUserError } = await supabase
      .from('users')
      .select('id, user_type, email')
      .eq('email', data.session.user.email?.toLowerCase())
      .single()
    
    if (existingUser && existingUser.id !== data.session.user.id) {
      // Email exists for a different user (duplicate email scenario)
      console.warn('⚠️ [CALLBACK] Email already exists for different user - this is a duplicate email signup!')
      console.warn('   Existing user:', existingUser.id, 'Type:', existingUser.user_type)
      console.warn('   New user:', data.session.user.id, 'Type:', finalUserType)
      
      // Just sign in as the existing user instead of creating a new one
      // This mirrors Airbnb/Spleet behavior
      console.log('✅ [CALLBACK] Signing in existing user with same email')
      // The session is already created for the new Auth user, but we'll keep them signed in
      // Their user_type will be based on their existing record
      finalUserType = existingUser.user_type as 'landlord' | 'tenant'
      console.log('📝 [CALLBACK] Updated finalUserType to existing user type:', finalUserType)
    } else if (existingUserError && existingUserError.code !== 'PGRST116') {
      console.warn('⚠️ [CALLBACK] Error checking existing user:', existingUserError.message)
    } else {
      console.log('✅ [CALLBACK] No existing user found with this email')
    }

    // Wait for database trigger to create user record
    console.log('⏳ [CALLBACK] Waiting for database trigger to complete...')
    const userExists = await ensureUserRecordExists(supabase, data.session.user.id)

    if (!userExists) {
      console.error('❌ [CALLBACK] User record was not created by trigger')
      // Continue anyway - the update might still work if trigger completes late
    }

    // Update user_type in database
    const updateData: any = { user_type: finalUserType }
    
    // For landlords, set initial verification_status to 'pending'
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
      console.log('✅ [CALLBACK] Database updated:', { 
        user_type: finalUserType, 
        verification_status: finalUserType === 'landlord' ? 'pending' : 'unchanged' 
      })
    }

    // Determine redirect destination
    // ✅ CRITICAL: Read redirect path from cookie set by OAuth client BEFORE redirect
    let customRedirectTo: string | null = null;
    
    try {
      const cookieHeader = request.headers.get('cookie') || '';
      // Look for our custom cookie with the path to redirect to
      const redirectCookieMatch = cookieHeader.match(/nulo_redirect_path=([^;]+)/);
      if (redirectCookieMatch) {
        customRedirectTo = decodeURIComponent(redirectCookieMatch[1]);
        console.log('🍪 [CALLBACK] Found redirect path in cookie:', customRedirectTo);
      }
    } catch (cookieError) {
      console.warn('⚠️ [CALLBACK] Error reading cookie:', cookieError);
    }
    
    let redirectTo = '/properties' // default fallback
    
    if (customRedirectTo) {
      // Use custom redirect if provided (e.g., property detail page)
      redirectTo = customRedirectTo
      console.log('🔀 [CALLBACK] Using custom redirect from cookie:', redirectTo)
    } else if (finalUserType === 'landlord') {
      redirectTo = '/onboarding/landlord/step-1'
      console.log('🏠 [CALLBACK] Redirecting landlord to onboarding...')
    } else {
      const redirectMap: Record<string, string> = {
        tenant: '/properties',
        admin: '/admin',
      }
      redirectTo = redirectMap[finalUserType] || '/properties'
      console.log('👤 [CALLBACK] Redirecting to default:', redirectTo)
    }

    console.log('🔀 [CALLBACK] Final redirect to:', redirectTo)

    // Create response with redirect
    const response = NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
    
    // ✅ CRITICAL: Clear the temporary cookies after use
    response.cookies.delete('nulo_redirect_path')
    response.cookies.delete('nulo_user_type')
    
    // Optional: Add security headers
    response.headers.set('X-Robots-Tag', 'noindex')
    
    return response

  } catch (error: any) {
    console.error('❌ [CALLBACK] Exception:', error)
    console.error('❌ [CALLBACK] Stack trace:', error.stack)
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

// export async function GET(request: NextRequest) {
//   const requestUrl = new URL(request.url)
//   const code = requestUrl.searchParams.get('code')
//   const error = requestUrl.searchParams.get('error')
//   const error_code = requestUrl.searchParams.get('error_code')
//   const error_description = requestUrl.searchParams.get('error_description')
//   const user_type = requestUrl.searchParams.get('user_type') || 'tenant'

//   console.log('🔄 [CALLBACK] Processing OAuth callback')
//   console.log('📝 [CALLBACK] Code:', code?.substring(0, 20) + '...')
//   console.log('📝 [CALLBACK] User type:', user_type)

//   // ✅ Handle email verification errors
//   if (error || error_code) {
//     console.error('❌ [CALLBACK] Email verification error')
//     console.error('   Error:', error)
//     console.error('   Error code:', error_code)
//     console.error('   Description:', error_description)

//     // Map error codes to user-friendly messages
//     const errorMap: Record<string, { message: string; action: string }> = {
//       'otp_expired': {
//         message: 'Email verification link has expired',
//         action: 'Please sign in and request a new verification link'
//       },
//       'invalid_otp': {
//         message: 'Email verification link is invalid',
//         action: 'Please sign in and request a new verification link'
//       },
//       'access_denied': {
//         message: 'Email verification was denied',
//         action: 'Please sign in and try again'
//       },
//     }

//     const errorInfo = errorMap[error_code as string] || {
//       message: error_description || 'Email verification failed',
//       action: 'Please sign in and try again'
//     }

//     console.log(`📧 [CALLBACK] ${errorInfo.message}`)
//     console.log(`📧 [CALLBACK] User action: ${errorInfo.action}`)

//     // Redirect to signin with better error message
//     return NextResponse.redirect(
//       new URL(
//         `/auth/verify-email-failed?error=${encodeURIComponent((error_code || error) ?? 'unknown_error')}&message=${encodeURIComponent(errorInfo.message)}`,
//         requestUrl.origin
//       )
//     )
//   }

//   // Validate code exists
//   if (!code) {
//     console.error('❌ [CALLBACK] No code provided')
//     return NextResponse.redirect(new URL('/auth/verify-email-failed?error=no_code&message=' + encodeURIComponent('No verification code found. Please check your email again.'), requestUrl.origin))
//   }

//   try {
//     const cookieStore = await cookies()
    
//     // Create server client with proper cookie handling
//     const supabase = createServerClient(
//       process.env.NEXT_PUBLIC_SUPABASE_URL!,
//       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
//       {
//         cookies: {
//           getAll() {
//             return cookieStore.getAll()
//           },
//           setAll(cookiesToSet) {
//             cookiesToSet.forEach(({ name, value, options }) =>
//               cookieStore.set(name, value, options)
//             )
//           },
//         },
//       }
//     )

//     // Exchange code for session
//     console.log('🔄 [CALLBACK] Exchanging code for session...')
//     const { data, error } = await supabase.auth.exchangeCodeForSession(code)

//     if (error) {
//       console.error('❌ [CALLBACK] Exchange failed:', error.message)
//       return NextResponse.redirect(
//         new URL(`/signin?error=${encodeURIComponent(error.message)}`, requestUrl.origin)
//       )
//     }

//     if (!data.session) {
//       console.error(' [CALLBACK] No session returned')
//       return NextResponse.redirect(new URL('/signin?error=no_session', requestUrl.origin))
//     }

//     console.log(' [CALLBACK] Session created for:', data.session.user.id)

//     // FIX: Get user_type from URL parameter first (OAuth), then metadata
//     // OAuth signup should pass user_type in URL, manual signup sets it in metadata
//     const urlUserType = requestUrl.searchParams.get('user_type')
//     const authenticatedUserType = data.session.user.user_metadata?.user_type
  
//     console.log(' [CALLBACK] URL user_type (OAuth):', urlUserType)
//     console.log(' [CALLBACK] Metadata user_type (manual):', authenticatedUserType)
  
//     // Priority: URL param (OAuth) > metadata (manual) > default to tenant
//     const finalUserType = urlUserType || authenticatedUserType || 'tenant'
//     console.log(' [CALLBACK] Final user_type to use:', finalUserType)

//     // IMPORTANT: Only update if metadata is missing
//     // Email verification should NOT change user_type that was already set during signup
//     if (!data.session.user.user_metadata?.user_type) {
//       console.log(' [CALLBACK] user_type missing from metadata, updating...')
//       const { error: updateError } = await supabase.auth.updateUser({
//         data: { user_type: finalUserType }
//       })

//       if (updateError) {
//         console.warn('⚠️ [CALLBACK] Could not update metadata:', updateError.message)
//       } else {
//         console.log('✅ [CALLBACK] Metadata updated with user_type:', finalUserType)
//       }
//     } else {
//       console.log('✅ [CALLBACK] user_type already in metadata:', data.session.user.user_metadata.user_type)
//     }

//     // SIMPLIFIED: Only update user_type, skip complex onboarding checks for new users
//     const updateData: any = { user_type: finalUserType }
    
//     // For landlords, set initial verification_status to 'pending' (new users)
//     if (finalUserType === 'landlord') {
//       updateData.verification_status = 'pending'
//     }
    
//     const { error: dbError } = await supabase
//       .from('users')
//       .update(updateData)
//       .eq('id', data.session.user.id)

//     if (dbError) {
//       console.warn('⚠️ [CALLBACK] Could not update database:', dbError.message)
//     } else {
//       console.log('✅ [CALLBACK] Database updated:', { user_type: finalUserType, verification_status: finalUserType === 'landlord' ? 'pending' : 'unchanged' })
//     }

//     // Wait for trigger to complete
//     console.log('⏳ [CALLBACK] Waiting for database trigger...')
//     await new Promise(resolve => setTimeout(resolve, 1000))

//     // SIMPLIFIED REDIRECT: Send landlords to onboarding, others to normal destinations
//     let redirectTo = '/properties' // default fallback
//     if (finalUserType === 'landlord') {
//       // All landlords go to onboarding first - let onboarding pages handle completion checks
//       redirectTo = '/onboarding/landlord/step-1'
//       console.log('🏠 [CALLBACK] Redirecting landlord to onboarding...')
//     } else {
//       // Non-landlord users use normal redirect map
//       const redirectMap: Record<string, string> = {
//         tenant: '/properties',
//         admin: '/admin',
//       }
//       redirectTo = redirectMap[finalUserType] || '/properties'
//       console.log('👤 [CALLBACK] Redirecting to:', redirectTo)
//     }

//     console.log('🔀 [CALLBACK] Final redirect to:', redirectTo)

//     // Create response with proper cookie handling
//     const response = NextResponse.redirect(new URL(redirectTo, requestUrl.origin))
    
//     return response

//   } catch (error: any) {
//     console.error('❌ [CALLBACK] Exception:', error)
//     return NextResponse.redirect(
//       new URL('/signin?error=callback_error', requestUrl.origin)
//     )
//   }
// }
