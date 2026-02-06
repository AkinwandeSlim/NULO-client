// Test Google OAuth setup
console.log('🔍 Testing Google OAuth Setup...')

// Check environment variables
console.log('📋 Environment Variables:')
console.log('  - GOOGLE_CLIENT_ID:', process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ? 'SET' : 'MISSING')
console.log('  - GOOGLE_CLIENT_SECRET:', process.env.GOOGLE_CLIENT_SECRET ? 'SET' : 'MISSING')
console.log('  - NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000')

// Test Google OAuth flow
const testGoogleAuth = async () => {
  try {
    console.log('🚀 Testing Google OAuth flow...')
    
    // 1. Test Google Provider URL
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` + 
      new URLSearchParams({
        client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || '',
        redirect_uri: encodeURIComponent(`${window.location.origin}/api/auth/callback/google`),
        response_type: 'code',
        scope: 'openid email profile',
        access_type: 'offline',
        prompt: 'consent'
      })
    
    console.log('🔗 Google Auth URL:', googleAuthUrl)
    
    // 2. Test NextAuth sign-in endpoint
    const signInUrl = `${window.location.origin}/api/auth/signin`
    console.log('📝 NextAuth Sign-in URL:', signInUrl)
    
    // 3. Test backend social-login endpoint
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000'}/api/v1/auth/social-login`
    console.log('🔧 Backend Social Login URL:', backendUrl)
    
    return {
      googleAuthUrl,
      signInUrl,
      backendUrl,
      envVars: {
        clientId: !!process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        clientSecret: !!process.env.GOOGLE_CLIENT_SECRET,
        apiUrl: !!process.env.NEXT_PUBLIC_API_URL
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
    return { error: error.message }
  }
}

// Export for browser console
if (typeof window !== 'undefined') {
  window.testGoogleAuth = testGoogleAuth
  console.log('💡 Run testGoogleAuth() in browser console to test OAuth setup')
}
