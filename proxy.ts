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
      .select('user_type, email_verified, first_time_visit')
      .eq('id', session.user.id)
      .single();
    
    profile = result.data;
    profileError = result.error;
    
    // Handle AbortError gracefully
    if (profileError?.message?.includes('AbortError') || profileError?.message?.includes('signal is aborted')) {
      console.log('ℹ️ [MIDDLEWARE] Database lock timeout, using auth metadata fallback');
      // Fallback to auth metadata
      profile = {
        user_type: session.user.user_metadata?.user_type || 'tenant',
        email_verified: session.user.email_confirmed_at ? true : false,
        first_time_visit: session.user.user_metadata?.first_time_visit !== false
      };
    }
  } catch (err: any) {
    console.warn('⚠️ [MIDDLEWARE] Profile query failed:', err);
    // Fallback to auth metadata
    profile = {
      user_type: session.user.user_metadata?.user_type || 'tenant',
      email_verified: session.user.email_confirmed_at ? true : false,
      first_time_visit: session.user.user_metadata?.first_time_visit !== false
    };
  }

  if (!profile) {
    console.log('❌ No profile found')
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
    // Get landlord profile for onboarding status
    let landlordProfile = null
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('onboarding_completed, verification_status, email_verified')
        .eq('id', session.user.id)
        .single()
      
      if (error) {
        console.warn('⚠️ [MIDDLEWARE] Landlord profile query failed:', error.message)
        // Fallback: assume incomplete if can't fetch
        landlordProfile = { onboarding_completed: false }
      } else {
        landlordProfile = data
      }
    } catch (err: any) {
      console.warn('⚠️ [MIDDLEWARE] Landlord profile exception:', err.message)
      landlordProfile = { onboarding_completed: false }
    }

    // ✅ Allow access to onboarding routes when authenticated
    if (pathname.startsWith('/onboarding/landlord')) {
      console.log('✅ Landlord onboarding route - allowing access')
      return NextResponse.next()
    }

    console.log('🏠 Landlord Status:', {
      onboarding_completed: landlordProfile?.onboarding_completed,
      verification_status: landlordProfile?.verification_status,
    })

    // ✅ RETURNING LANDLORD (completed onboarding) → Allow dashboard access
    if (landlordProfile?.onboarding_completed === true) {
      console.log('✅ Landlord onboarding complete - allow dashboard access')
      return NextResponse.next()
    }

    // ❌ NEW LANDLORD (incomplete onboarding) → Force to onboarding
    if (landlordProfile?.onboarding_completed === false) {
      if (!pathname.startsWith('/onboarding/landlord')) {
        console.log('🔀 Landlord incomplete onboarding → redirect to step-1')
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding/landlord/step-1'
        return NextResponse.redirect(url)
      }
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



