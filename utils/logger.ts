/**
 * Production-ready Logger Utility
 * Minimizes console spam in production while maintaining useful debugging in development
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableApiLogs: boolean;
  enableAuthLogs: boolean;
  enableNetworkLogs: boolean;
}

class Logger {
  private config: LoggerConfig;

  constructor() {
    const isProduction = process.env.NODE_ENV === 'production';
    
    this.config = {
      level: isProduction ? 'error' : 'debug',
      enableConsole: !isProduction,
      enableApiLogs: !isProduction,
      enableAuthLogs: !isProduction,
      enableNetworkLogs: !isProduction,
    };
  }

  private shouldLog(level: LogLevel, category: keyof Omit<LoggerConfig, 'level' | 'enableConsole'>): boolean {
    if (!this.config.enableConsole) return false;
    if (!this.config[category]) return false;
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(this.config.level);
    const messageLevelIndex = levels.indexOf(level);
    
    return messageLevelIndex >= currentLevelIndex;
  }

  debug(message: string, data?: any, category: keyof Omit<LoggerConfig, 'level' | 'enableConsole'> = 'enableApiLogs') {
    if (this.shouldLog('debug', category)) {
      console.log(`🔍 [DEBUG] ${message}`, data || '');
    }
  }

  info(message: string, data?: any, category: keyof Omit<LoggerConfig, 'level' | 'enableConsole'> = 'enableApiLogs') {
    if (this.shouldLog('info', category)) {
      console.log(`ℹ️ [INFO] ${message}`, data || '');
    }
  }

  warn(message: string, data?: any, category: keyof Omit<LoggerConfig, 'level' | 'enableConsole'> = 'enableApiLogs') {
    if (this.shouldLog('warn', category)) {
      console.warn(`⚠️ [WARN] ${message}`, data || '');
    }
  }

  error(message: string, data?: any, category: keyof Omit<LoggerConfig, 'level' | 'enableConsole'> = 'enableApiLogs') {
    if (this.shouldLog('error', category)) {
      console.error(`❌ [ERROR] ${message}`, data || '');
    }
  }

  // Specific logging methods for different categories
  api(message: string, data?: any) {
    this.debug(message, data, 'enableApiLogs');
  }

  auth(message: string, data?: any) {
    this.info(message, data, 'enableAuthLogs');
  }

  network(message: string, data?: any) {
    this.warn(message, data, 'enableNetworkLogs');
  }

  // Silent method for production-critical logs that should never appear in console
  silent(message: string, data?: any) {
    // This could send to a logging service in production
    // For now, it does nothing to avoid console spam
  }
}

// Create singleton instance
export const logger = new Logger();

// Export convenience methods
export const log = {
  debug: logger.debug.bind(logger),
  info: logger.info.bind(logger),
  warn: logger.warn.bind(logger),
  error: logger.error.bind(logger),
  api: logger.api.bind(logger),
  auth: logger.auth.bind(logger),
  network: logger.network.bind(logger),
  silent: logger.silent.bind(logger),
};

export default logger;
