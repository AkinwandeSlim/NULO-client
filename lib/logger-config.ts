/**
 * Logger Configuration
 * Suppresses verbose logs in development while preserving error reporting
 */

const SUPPRESSED_PATTERNS = [
  'Using fallback coordinates',
  'Cache Hit Rate',
  'cache cleanup',
  'Valid property:',
  'Total properties received:',
  'Properties without valid',
  '[CACHE]',
  '[HMR]',
  '[Fast Refresh]',
  'WebSocket connection',
  'Failed to load resource: net::ERR_NAME_NOT_RESOLVED',
]

const SUPPRESSED_SOURCES = [
  'websocket-factory.ts',
  'forward-logs-shared.ts',
  'intercept-console-error.ts',
]

// Store original console methods in a way that preserves context
const originalLog = console.log.bind(console)
const originalError = console.error.bind(console) 
const originalWarn = console.warn.bind(console)

/**
 * Check if a log message should be suppressed
 */
function shouldSuppress(message: string, source?: string): boolean {
  // Check if source is suppressed
  if (source && SUPPRESSED_SOURCES.some(s => source.includes(s))) {
    return true
  }

  // Check if message matches suppressed patterns
  return SUPPRESSED_PATTERNS.some(pattern => 
    message?.includes?.(pattern)
  )
}

/**
 * Initialize logger configuration
 * Call this in your root layout or app initialization
 */
export function initializeLoggerConfig() {
  if (typeof window === 'undefined') return // Skip on server

  // Override console.log
  console.log = function(...args: any[]) {
    const message = args[0]?.toString?.() ?? ''
    const stack = new Error().stack || ''
    
    // Don't suppress actual errors in production debugging
    if (!shouldSuppress(message, stack)) {
      originalLog(...args)
    }
  }

  // Override console.error - still show network errors but format better
  console.error = function(...args: any[]) {
    const message = args[0]?.toString?.() ?? ''
    const stack = new Error().stack || ''
    
    // Only suppress websocket/network errors that are expected
    if (message?.includes?.('net::ERR_NAME_NOT_RESOLVED') ||
        message?.includes?.('WebSocket connection')) {
      // Silently ignore expected network errors
      return
    }
    
    // Show other errors normally
    originalError(...args)
  }

  // Override console.warn
  console.warn = function(...args: any[]) {
    const message = args[0]?.toString?.() ?? ''
    const stack = new Error().stack || ''
    
    if (!shouldSuppress(message, stack)) {
      originalWarn(...args)
    }
  }
}

/**
 * Create a filtered logger for specific modules
 */
export function createLogger(module: string, verbose = false) {
  return {
    log: (...args: any[]) => {
      if (!verbose) return
      originalLog(`[${module}]`, ...args)
    },
    error: (...args: any[]) => {
      originalError(`[${module}] ERROR:`, ...args)
    },
    warn: (...args: any[]) => {
      originalWarn(`[${module}] WARN:`, ...args)
    },
    debug: (...args: any[]) => {
      if (!verbose) return
      originalLog(`[${module}] DEBUG:`, ...args)
    },
  }
}

/**
 * Restore original console methods
 */
export function restoreConsole() {
  console.log = originalLog
  console.error = originalError
  console.warn = originalWarn
}
