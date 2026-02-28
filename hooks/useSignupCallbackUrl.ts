'use client'

import { useEffect } from 'react'

/**
 * Hook to preserve the current URL for post-signup redirect
 * 
 * Usage in signup pages:
 * ```tsx
 * useSignupCallbackUrl()
 * // or specify a custom path
 * useSignupCallbackUrl('/properties/123')
 * ```
 * 
 * This stores the URL in BOTH localStorage and cookie for compatibility:
 * - localStorage: 'signup_callback_url' (for client-side redirects)
 * - Cookie: 'nulo_redirect_path' (for server-side callback route)
 * The callback route will use this to redirect after email verification
 */
export function useSignupCallbackUrl(customUrl?: string) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Use custom URL if provided, otherwise use current page
    const urlToStore = customUrl || window.location.pathname + window.location.search

    // Only store if it's a property detail page or other valid redirects
    // Avoid storing signup/auth pages to prevent redirect loops
    const validPrefixes = [
      '/properties/',
      '/tenant/',
      '/landlord/',
      '/admin/',
    ]

    const isValidRedirect = validPrefixes.some(prefix => urlToStore.startsWith(prefix))

    if (isValidRedirect) {
      // Store in localStorage for client-side use
      localStorage.setItem('signup_callback_url', urlToStore)
      console.log('📍 [SIGNUP] Stored callback URL in localStorage:', urlToStore)
      
      // ALSO store in cookie for server-side callback route compatibility
      document.cookie = `nulo_redirect_path=${encodeURIComponent(urlToStore)}; path=/; max-age=3600; SameSite=Lax`
      console.log('🍪 [SIGNUP] Stored callback URL in cookie:', urlToStore)
    } else {
      // Clear any previous callback URLs if on signup pages
      localStorage.removeItem('signup_callback_url')
      document.cookie = 'nulo_redirect_path=; path=/; max-age=0; SameSite=Lax'
      console.log('🧹 [SIGNUP] Cleared callback URLs (not a valid redirect target)')
    }
  }, [customUrl])
}

/**
 * Get the stored callback URL and clear it from localStorage
 */
export function getAndClearSignupCallbackUrl(): string | null {
  if (typeof window === 'undefined') return null
  
  const url = localStorage.getItem('signup_callback_url')
  localStorage.removeItem('signup_callback_url')
  
  // Also clear the cookie
  document.cookie = 'nulo_redirect_path=; path=/; max-age=0; SameSite=Lax'
  
  return url
}

/**
 * Clear the stored callback URL from both localStorage and cookie
 */
export function clearSignupCallbackUrl(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('signup_callback_url')
  document.cookie = 'nulo_redirect_path=; path=/; max-age=0; SameSite=Lax'
}
