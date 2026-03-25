import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  const supabase = await createClient()

  console.log('🔐 [MIDDLEWARE]', pathname)

  // ========================================
  // PUBLIC ROUTES (no auth required)
  // ========================================
  const publicRoutes = [
    '/',
    '/signin',
    '/signup',
    '/auth/callback',
    '/auth/google/callback',
    '/auth/verify-email',
    '/auth/verify-email-failed',
    '/auth/reset-password',
    '/properties',  // Public property browsing
    '/about',
    '/contact',
    '/help',
    '/privacy',
    '/terms',
    '/blog',
    '/api',
    '/_next',
    '/favicon.ico',
  ]

  // Property detail pages are public (can view without auth)
  if (pathname.match(/^\/properties\/[\w-]+$/)) {
    console.log('✅ Public property detail page')
    return NextResponse.next()
  }

  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  )

  if (isPublicRoute) {
    console.log('✅ Public route')
    return NextResponse.next()
  }

  // ========================================
  // PROTECTED ROUTES - AUTHENTICATION REQUIRED
  // ========================================
  // Onboarding routes require authentication
  if (pathname.startsWith('/onboarding/landlord')) {
    console.log('🔐 [MIDDLEWARE] Onboarding route detected - checking auth...')
  }

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    console.log('❌ No session → signin')
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // ========================================
  // GET USER PROFILE (with error handling)
  // ========================================
  let profile = null;
  let profileError = null;
  
  try {
    const result = await supabase
      .from('users')
      .select('user_type, email_verified, first_time_visit, onboarding_completed, verification_status')
      .eq('id', session.user.id)
      .single();
    
    profile = result.data;
    profileError = result.error;
    
    // Handle AbortError gracefully
    if (profileError?.message?.includes('AbortError') || profileError?.message?.includes('signal is aborted')) {
      console.log('ℹ️ [MIDDLEWARE] Database lock timeout, using auth metadata fallback');
      
      // Only use the metadata value if it is one of the three known valid types
      const metaType = session.user.user_metadata?.user_type
      const safeType = (['admin', 'landlord', 'tenant'] as const).includes(metaType)
        ? (metaType as 'admin' | 'landlord' | 'tenant')
        : null

      if (!safeType) {
        console.warn(
          '⚠️ [MIDDLEWARE] DB timeout + unrecognised user_type in metadata.',
          'Allowing through — client auth will handle routing.'
        )
        return NextResponse.next()
      }

      console.log('ℹ️ [MIDDLEWARE] DB timeout, using metadata fallback. Type:', safeType)
      profile = {
        user_type: safeType,
        email_verified: session.user.email_confirmed_at ? true : false,
        first_time_visit: session.user.user_metadata?.first_time_visit !== false,
        onboarding_completed: session.user.user_metadata?.onboarding_completed ?? false,
        verification_status: session.user.user_metadata?.verification_status ?? 'pending',
      };
    }
  } catch (err: any) {
    console.warn('⚠️ [MIDDLEWARE] Profile query exception:', err.message);
    // Same safe approach — allow through on exception rather than
    // misidentifying a user or triggering a redirect loop
    return NextResponse.next()
  }

  if (!profile || !profile.user_type) {
    console.log('❌ No profile or user_type found')
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    return NextResponse.redirect(url)
  }

  console.log('👤 User:', profile.user_type)

  // ========================================
  // EMAIL VERIFICATION (except onboarding)
  // ========================================
  if (!profile.email_verified && 
      !pathname.startsWith('/auth/verify-email') &&
      !pathname.startsWith('/onboarding/landlord') &&
      !pathname.startsWith('/onboarding/tenant')) {
    console.log('📧 Email not verified')
    const url = request.nextUrl.clone()
    url.pathname = '/auth/verify-email'
    url.searchParams.set('email', session.user.email || '')
    return NextResponse.redirect(url)
  }

  // ========================================
  // ADMIN ROUTING
  // ========================================
  if (profile.user_type === 'admin') {
    // Admins can access everything, but default to admin panel
    if (!pathname.startsWith('/admin') && 
        !pathname.startsWith('/landlord') && 
        !pathname.startsWith('/properties') &&
        !pathname.startsWith('/tenant')) {
      console.log('🔀 Admin → dashboard')
      const url = request.nextUrl.clone()
      url.pathname = '/admin'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  // ========================================
  // LANDLORD ROUTING
  // ========================================
  if (profile.user_type === 'landlord') {
    // ✅ Allow access to onboarding routes when authenticated
    if (pathname.startsWith('/onboarding/landlord')) {
      console.log('✅ Landlord onboarding route - allowing access')
      return NextResponse.next()
    }

    console.log('🏠 Landlord Status:', {
      onboarding_completed: profile?.onboarding_completed,
      verification_status: profile?.verification_status,
    })

    // ✅ RETURNING LANDLORD (completed onboarding) → Allow dashboard access
    if (profile?.onboarding_completed === true) {
      console.log('✅ Landlord onboarding complete - allow dashboard access')
      return NextResponse.next()
    }

    // ❌ NEW LANDLORD (incomplete onboarding) → Force to onboarding
    // CRITICAL: Use explicit check for FALSE, not falsy. Prevents redirect loop on stale data.
    // Undefined (from timeout) should NOT trigger redirect, only explicit false should.
    if (profile?.onboarding_completed === false) {
      console.log('🔀 Landlord incomplete onboarding (onboarding_completed=false) → redirect to step-1')
      if (!pathname.startsWith('/onboarding/landlord')) {
        console.log('🔀 Redirecting to /onboarding/landlord/step-1')
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding/landlord/step-1'
        return NextResponse.redirect(url)
      }
      // Already on onboarding route, allow through
      return NextResponse.next()
    }

    // ⚠️ UNCERTAIN STATE (onboarding_completed is undefined from timeout)
    // Allow access - don't redirect on uncertain data. Client-side auth will handle routing.
    if (profile?.onboarding_completed === undefined) {
      console.log('⚠️ [MIDDLEWARE] onboarding_completed is undefined (likely DB timeout) - allowing through')
      return NextResponse.next()
    }

    return NextResponse.next()
  }

  // ========================================
  // TENANT ROUTING
  // ========================================
  if (profile.user_type === 'tenant') {
    
    // Block access to landlord/admin areas AND landlord onboarding
    if (pathname.startsWith('/landlord') || 
        pathname.startsWith('/admin') ||
        pathname.startsWith('/onboarding/landlord')) {
      console.log('❌ Tenant blocked from landlord/admin/onboarding routes')
      const url = request.nextUrl.clone()
      url.pathname = '/properties'
      return NextResponse.redirect(url)
    }

    // Allow tenant to access:
    // - /properties (public browsing)
    // - /tenant (their dashboard)
    // - /tenant/onboarding (if applicable)
    
    // Default tenant route
    if (!pathname.startsWith('/tenant') && 
        !pathname.startsWith('/properties')) {
      console.log('🔀 Tenant → properties')
      const url = request.nextUrl.clone()
      url.pathname = '/properties'
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  // ========================================
  // FALLBACK
  // ========================================
  console.log('✅ Access granted')
  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon)
     * - Image files (svg, png, jpg, jpeg, gif, webp)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}



