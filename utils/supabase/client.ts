import { createBrowserClient } from '@supabase/ssr';

// Singleton pattern to prevent multiple client creations
let supabaseClient: ReturnType<typeof createBrowserClient> | null = null;
let isInitializing = false;
let initPromise: Promise<ReturnType<typeof createBrowserClient>> | null = null;

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables');
  }
  
  // Return existing client if already created
  if (supabaseClient) {
    console.log('🔄 [SUPABASE] Reusing existing client instance');
    return supabaseClient;
  }

  // Prevent concurrent initialization attempts
  if (isInitializing && initPromise) {
    console.log('🔄 [SUPABASE] Waiting for client initialization...');
    return initPromise as any;
  }

  // Create new client only once
  isInitializing = true;
  
  try {
    console.log('🆕 [SUPABASE] Creating new client instance');
    supabaseClient = createBrowserClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      }
    });
    isInitializing = false;
    return supabaseClient;
  } catch (error: any) {
    isInitializing = false;
    console.error('❌ [SUPABASE] Error creating client:', error);
    throw error;
  }
}

// Export a cleanup function for testing
export function cleanupSupabaseClient() {
  supabaseClient = null;
  isInitializing = false;
  initPromise = null;
  console.log('🧹 [SUPABASE] Client instance cleaned up');
}
