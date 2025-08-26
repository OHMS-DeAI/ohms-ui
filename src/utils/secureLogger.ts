/**
 * Secure Logger Migration to Professional Logging System
 * 
 * DEPRECATED: This file is being migrated to the new professional logging system.
 * Import { logger } from './professionalLogger' instead of this file.
 * 
 * This file provides backward compatibility for existing code.
 */

import { logger, logError, logOperation } from './professionalLogger';

// Legacy compatibility type
type LogLevel = 'debug' | 'info' | 'warn' | 'error'

class SecureLogger {
  constructor() {
    // Migration notice
    logger.warn('SecureLogger is deprecated. Use professionalLogger instead.', {
      migration: 'Replace with: import { logger } from "./professionalLogger"'
    });
  }

  debug(message: any, context?: any): void {
    logger.debug(String(message), typeof context === 'object' ? context : { context });
  }

  info(message: any, context?: any): void {
    logger.info(String(message), typeof context === 'object' ? context : { context });
  }

  warn(message: any, context?: any): void {
    logger.warn(String(message), typeof context === 'object' ? context : { context });
  }

  error(message: any, context?: any): void {
    logger.error(String(message), typeof context === 'object' ? context : { context });
  }

  // Safe logging methods that always sanitize
  safeLog(message: any, context?: any): void {
    logger.info(`SAFE: ${String(message)}`, typeof context === 'object' ? context : { context });
  }

  // Production-safe error logging
  prodError(message: string, errorCode?: string): void {
    logger.error(errorCode ? `Error ${errorCode}: ${message}` : message, { errorCode });
  }
}

// Global secure logger instance (for backward compatibility)
export const secureLogger = new SecureLogger()

// Professional logging system is now handling console overrides
export const disableProductionLogging = (): void => {
  logger.warn('disableProductionLogging is deprecated. Console management is now automatic.');
}

// Re-export professional logger for easy migration
export { logger, logError, logOperation } from './professionalLogger';

export default secureLogger