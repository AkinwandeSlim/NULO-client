import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';

export const updateSession = async (request: NextRequest) => {
  // This `try/catch` block is only here for the interactive tutorial.
  // Feel free to remove once you have Supabase connected.
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    });

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            response = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // This will refresh session if expired - required for Server Components
    // https://supabase.com/docs/guides/auth/server-side/nextjs
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // ✅ FIXED: Check email verification for protected routes
    if (user) {
      const pathname = request.nextUrl.pathname;
      
      // Allow public routes and email verification page
      const publicRoutes = ['/', '/signin', '/signup', '/auth/verify-email', '/auth/callback', '/auth/verify-email-failed', '/properties'];
      const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith('/properties/') || pathname.startsWith('/about') || pathname.startsWith('/blog'));
      
      // ✅ FIXED: Check email_confirmed_at from auth session (more reliable than DB column)
      // If email not verified and trying to access protected route, redirect to verify-email
      if (!user.email_confirmed_at && !isPublicRoute && !pathname.startsWith('/auth/') && !pathname.startsWith('/onboarding/')) {
        console.log('📧 [MIDDLEWARE] Email not confirmed → redirect to /auth/verify-email');
        return NextResponse.redirect(new URL(`/auth/verify-email?email=${encodeURIComponent(user.email || '')}`, request.url));
      }
      
      // Redirect logged-in users away from /login and /signup
      if (pathname === '/login' || pathname === '/signup') {
        return NextResponse.redirect(new URL('/', request.url));
      }
    }

    return response;
  } catch (e) {
    // If you are here, a Supabase client could not be created!
    // This is likely because you have not set up environment variables.
    // Check out http://localhost:3000 for Next Steps.
    return NextResponse.next({
      request: {
        headers: request.headers,
      },
    });
  }
};
