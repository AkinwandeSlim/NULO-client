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
    '/auth/verify-email',
    '/auth/verify-email-failed',
    '/auth/reset-password',
    '/properties',  // Public property browsing
    '/about',
    '/contact',
    '/api',
    '/_next',
    '/favicon.ico',
  ]

  // Property detail pages are public (can view without auth)
  if (pathname.match(/^\/properties\/[\w-]+$/)) {
    console.log('✅ Public property detail page')
    return NextResponse.next()
  }

  // Add onboarding routes to public routes for new OAuth users
  const onboardingRoutes = [
    '/onboarding/landlord/step-1',
    '/onboarding/landlord/step-2',
    '/onboarding/landlord/step-3',
    '/onboarding/landlord/step-4',
    '/onboarding/landlord/step-5',
  ]

  const isPublicRoute = publicRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  ) || onboardingRoutes.some(route => 
    pathname.startsWith(route)
  )

  if (isPublicRoute) {
    console.log('✅ Public route')
    return NextResponse.next()
  }

  // ========================================
  // AUTHENTICATION CHECK
  // ========================================
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
    
    // Allow onboarding routes always
    if (pathname.startsWith('/onboarding/landlord')) {
      console.log('✅ Landlord onboarding route')
      return NextResponse.next()
    }

    // Get landlord profile for onboarding status and verification
    const { data: landlordProfile } = await supabase
      .from('users')
      .select('first_time_visit, onboarding_completed_at, profile_step_completed, verification_status, onboarding_completed')
      .eq('id', session.user.id)
      .single()

    console.log('🏠 Status:', {
      first_time: landlordProfile?.first_time_visit,
      completed: !!landlordProfile?.onboarding_completed_at,
      profile_done: landlordProfile?.profile_step_completed,
      verification_status: landlordProfile?.verification_status,
      onboarding_completed: landlordProfile?.onboarding_completed
    })

    // FIRST-TIME LANDLORD → Force to onboarding
    if (landlordProfile?.first_time_visit !== false) {
      if (!pathname.startsWith('/onboarding/landlord')) {
        console.log('🔀 First-time → onboarding')
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding/landlord/step-1'
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }

    // INCOMPLETE ONBOARDING → Continue onboarding
    if (!landlordProfile?.onboarding_completed_at) {
      if (!pathname.startsWith('/onboarding/landlord')) {
        console.log('🔀 Incomplete onboarding → continue')
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding/landlord/step-1'
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }

    // PREVENT PROPERTY CREATION without profile step
    if (pathname.includes('/landlord/properties/new') && 
        !landlordProfile?.profile_step_completed) {
      console.log('❌ Can\'t create property → complete profile first')
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/landlord/step-1'
      return NextResponse.redirect(url)
    }

    // COMPLETED ONBOARDING → Check verification status
    if (!landlordProfile?.onboarding_completed_at) {
      if (!pathname.startsWith('/onboarding/landlord')) {
        console.log('🔀 Incomplete onboarding → continue')
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding/landlord/step-1'
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }

    // Check if onboarding is completed but verification is pending/under review
    if (landlordProfile?.onboarding_completed && 
        (landlordProfile?.verification_status === 'pending' || landlordProfile?.verification_status === 'under_review')) {
      // Allow access to verification pending page and dashboard
      const allowedPaths = [
        '/onboarding/landlord/verification-pending',
        '/landlord/overview',
        '/landlord/profile'
      ]
      
      const isAllowedPath = allowedPaths.some(allowedPath => pathname.startsWith(allowedPath))
      
      if (!isAllowedPath) {
        console.log('🔀 Onboarding completed but verification pending → redirect to verification pending')
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding/landlord/verification-pending'
        return NextResponse.redirect(url)
      }
    }

    // Check verification status - restrict property management for unverified users
    if (landlordProfile?.verification_status !== 'verified') {
      // Allow access to these pages even if not verified
      const allowedPaths = [
        '/onboarding/landlord',
        '/landlord/overview',
        '/properties',
        '/landlord/profile'
      ]
      
      const isAllowedPath = allowedPaths.some(allowedPath => pathname.startsWith(allowedPath))
      
      // Block access to property management features if not verified
      if (!isAllowedPath && (pathname.includes('/landlord/properties') || pathname.includes('/landlord/tenants'))) {
        console.log('❌ Property management requires verification')
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding/landlord/verification-pending'
        return NextResponse.redirect(url)
      }
    }

    return NextResponse.next()
  }

  // ========================================
  // TENANT ROUTING
  // ========================================
  if (profile.user_type === 'tenant') {
    
    // Block access to landlord/admin areas
    if (pathname.startsWith('/landlord') || pathname.startsWith('/admin')) {
      console.log('❌ Tenant blocked from landlord/admin')
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


















// import { NextResponse } from 'next/server'
// import type { NextRequest } from 'next/server'
// import { createClient } from '@/utils/supabase/server'

// export async function proxy(request: NextRequest) {
//   const { pathname } = request.nextUrl
//   const supabase = await createClient()

//   // Public routes that don't require authentication
//   const publicRoutes = [
//     '/',
//     '/signin',
//     '/signup',
//     '/auth/callback',
//     '/auth/verify-email',
//     '/auth/reset-password',
//     '/properties',
//     '/about',
//     '/contact',
//     '/api/auth',
//     '/_next',
//   ]

//   // Onboarding routes that should be accessible
//   const onboardingRoutes = ['/landlord/onboarding']

//   // Check if current path is public
//   const isPublicRoute = publicRoutes.some(route => 
//     pathname.startsWith(route) || pathname === route
//   )

//   // Check if current path is onboarding
//   const isOnboardingRoute = onboardingRoutes.some(route => pathname.startsWith(route))

//   if (isPublicRoute) {
//     return NextResponse.next()
//   }

//   // Get user session
//   const { data: { session } } = await supabase.auth.getSession()

//   // If no session and trying to access protected route, redirect to signin
//   if (!session && !isPublicRoute) {
//     const url = request.nextUrl.clone()
//     url.pathname = '/signin'
//     return NextResponse.redirect(url)
//   }

//   // If session exists, get user profile
//   if (session?.user) {
//     const { data: profile } = await supabase
//       .from('users')
//       .select('*')
//       .eq('id', session.user.id)
//       .single()

//     // Tenant email verification check
//     if (profile?.user_type === 'tenant' && !profile.email_verified) {
//       if (!pathname.startsWith('/auth/verify-email')) {
//         const url = request.nextUrl.clone()
//         url.pathname = '/auth/verify-email'
//         url.searchParams.set('email', profile.email || '')
//         return NextResponse.redirect(url)
//       }
//     }

//     // Role-based redirects
//     if (profile?.user_type === 'admin' && !pathname.startsWith('/admin')) {
//       const url = request.nextUrl.clone()
//       url.pathname = '/admin'
//       return NextResponse.redirect(url)
//     }

//     // ✅ LANDLORD: Smart redirect based on onboarding status
//     if (profile?.user_type === 'landlord') {
//       // First-time landlord: Redirect to onboarding (unless already there)
//       if (profile.first_time_visit && !isOnboardingRoute) {
//         const url = request.nextUrl.clone()
//         url.pathname = '/landlord/onboarding'
//         return NextResponse.redirect(url)
//       }

//       // Prevent property creation until profile step is complete
//       if (pathname.includes('/landlord/properties/new') && !profile.profile_step_completed) {
//         const url = request.nextUrl.clone()
//         url.pathname = '/landlord/onboarding/profile'
//         return NextResponse.redirect(url)
//       }

//       // Returning landlord: Allow all /landlord routes
//       if (!pathname.startsWith('/landlord')) {
//         const url = request.nextUrl.clone()
//         url.pathname = '/landlord/overview'
//         return NextResponse.redirect(url)
//       }
//     }

//     if (profile?.user_type === 'tenant' && !pathname.startsWith('/tenant')) {
//       const url = request.nextUrl.clone()
//       url.pathname = '/tenant'
//       return NextResponse.redirect(url)
//     }
//   }

//   return NextResponse.next()
// }

// export const config = {
//   matcher: [
//     /*
//      * Match all request paths except for the ones starting with:
//      * - api (API routes)
//      * - _next/static (static files)
//      * - _next/image (image optimization files)
//      * - favicon.ico (favicon file)
//      */
//     '/((?!api|_next/static|_next/image|favicon.ico).*)',
//   ],
// }
