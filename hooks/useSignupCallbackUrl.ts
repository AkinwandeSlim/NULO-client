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
 * This stores the URL in localStorage with key 'signup_callback_url'
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
      localStorage.setItem('signup_callback_url', urlToStore)
      console.log('📍 [SIGNUP] Stored callback URL:', urlToStore)
    } else {
      // Clear any previous callback URL if on signup pages
      localStorage.removeItem('signup_callback_url')
      console.log('🧹 [SIGNUP] Cleared callback URL (not a valid redirect target)')
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
  return url
}

/**
 * Clear the stored callback URL
 */
export function clearSignupCallbackUrl(): void {
  if (typeof window === 'undefined') return
  localStorage.removeItem('signup_callback_url')
}
