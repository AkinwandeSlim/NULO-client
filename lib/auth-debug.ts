/**
 * Authentication Debug Utilities
 * Helps debug token sync and redirection issues
 */

export const authDebug = {
  /**
   * Log current authentication state
   */
  logAuthState: (label: string = 'Auth State') => {
    if (typeof window === 'undefined') return
    
    const token = localStorage.getItem('access_token')
    const user = localStorage.getItem('user')
    
    console.log(`🔍 [${label}] Authentication State:`, {
      hasToken: !!token,
      tokenLength: token?.length,
      hasUser: !!user,
      userParsed: user ? JSON.parse(user) : null,
      storageKeys: Object.keys(localStorage),
      sessionStorageKeys: Object.keys(sessionStorage)
    })
  },

  /**
   * Check if Supabase session is available
   */
  checkSupabaseSession: async () => {
    try {
      const { createClient } = await import('@/utils/supabase/client')
      const supabase = createClient()
      const { data: { session }, error } = await supabase.auth.getSession()
      
      console.log('🔍 [Supabase Session Check]:', {
        hasSession: !!session,
        hasUser: !!session?.user,
        userKeys: session?.user ? Object.keys(session.user) : [],
        userId: session?.user?.id,
        email: session?.user?.email,
        metadata: session?.user?.user_metadata
      })
      
      return session
    } catch (error) {
      console.error('❌ [Supabase Session Check] Error:', error)
      return null
    }
  },

  /**
   * Validate token consistency across storage
   */
  validateTokenConsistency: async () => {
    if (typeof window === 'undefined') return false
    
    const localToken = localStorage.getItem('access_token')
    const session = await authDebug.checkSupabaseSession()
    const sessionToken = session?.access_token || null
    
    const isConsistent = localToken === sessionToken
    
    console.log('🔍 [Token Consistency Check]:', {
      localStorageToken: localToken ? 'present' : 'missing',
      sessionToken: sessionToken ? 'present' : 'missing',
      isConsistent,
      tokensMatch: localToken === sessionToken
    })
    
    return isConsistent
  },

  /**
   * Clear all auth-related storage (for debugging)
   */
  clearAuthStorage: () => {
    if (typeof window === 'undefined') return
    
    console.log('🧹 [Debug] Clearing auth storage...')
    
    // Clear localStorage
    localStorage.removeItem('access_token')
    localStorage.removeItem('user')
    
    // Clear sessionStorage
    sessionStorage.clear()
    
    console.log('✅ [Debug] Auth storage cleared')
  },

  /**
   * Simulate Supabase auth token sync
   */
  simulateSupabaseTokenSync: (token: string, user: any) => {
    if (typeof window === 'undefined') return
    
    console.log('🔄 [Debug] Simulating Supabase token sync...')
    
    // Simulate Supabase session storage
    localStorage.setItem('access_token', token)
    localStorage.setItem('user', JSON.stringify({
      id: user.id,
      email: user.email,
      full_name: user.user_metadata?.full_name || user.name,
      user_type: user.user_metadata?.user_type || 'tenant',
      ...user
    }))
    
    console.log('✅ [Debug] Supabase token sync simulated')
  }
}

// Auto-log auth state on page load (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    authDebug.logAuthState('Page Load')
    authDebug.validateTokenConsistency()
  }, 1000)
}
