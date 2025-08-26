/**
 * Console Log Migration Utility
 * 
 * This utility provides helper functions to migrate legacy console statements
 * to the professional logging system. It's designed to be imported and used
 * throughout the application during the migration process.
 */

import { logger, logError, logOperation, logPerformance } from './professionalLogger';

/**
 * Migration helpers for common console patterns
 */
export const migrationHelpers = {
  // Replace simple console.log statements
  log: (message: string, context?: any) => {
    logger.info(message, context);
  },

  // Replace console.error statements with proper error handling
  error: (message: string, error?: Error | unknown, context?: any) => {
    if (error instanceof Error) {
      logger.error(message, { ...context, error: error.message }, error);
    } else if (error) {
      logger.error(message, { ...context, error: String(error) });
    } else {
      logger.error(message, context);
    }
  },

  // Replace console.warn statements
  warn: (message: string, context?: any) => {
    logger.warn(message, context);
  },

  // Replace console.info statements
  info: (message: string, context?: any) => {
    logger.info(message, context);
  },

  // Replace console.debug statements
  debug: (message: string, context?: any) => {
    logger.debug(message, context);
  },

  // Helper for authentication operations
  authOperation: (operation: string, success: boolean, context?: any) => {
    if (success) {
      logger.info(`Authentication: ${operation} successful`, context);
    } else {
      logger.warn(`Authentication: ${operation} failed`, context);
    }
  },

  // Helper for payment operations
  paymentOperation: (operation: string, success: boolean, context?: any) => {
    if (success) {
      logger.info(`Payment: ${operation} completed`, context);
    } else {
      logger.error(`Payment: ${operation} failed`, context);
    }
  },

  // Helper for API calls
  apiCall: (endpoint: string, success: boolean, context?: any) => {
    if (success) {
      logger.debug(`API: ${endpoint} succeeded`, context);
    } else {
      logger.warn(`API: ${endpoint} failed`, context);
    }
  },

  // Helper for performance tracking
  performance: (operation: string, startTime: number, context?: any) => {
    logPerformance(operation, startTime, context);
  },

  // Helper for operation logging
  operation: (operation: string, context?: any) => {
    logOperation(operation, context);
  }
};

/**
 * Safe console replacement functions
 * These can be used as direct replacements for console methods
 */
export const safeConsole = {
  log: migrationHelpers.log,
  info: migrationHelpers.info,
  warn: migrationHelpers.warn,
  error: migrationHelpers.error,
  debug: migrationHelpers.debug
};

/**
 * Development-only console functions
 * These only log in development mode
 */
export const devConsole = {
  log: (message: string, context?: any) => {
    if (import.meta.env.DEV) {
      migrationHelpers.log(`[DEV] ${message}`, context);
    }
  },
  
  info: (message: string, context?: any) => {
    if (import.meta.env.DEV) {
      migrationHelpers.info(`[DEV] ${message}`, context);
    }
  },

  warn: (message: string, context?: any) => {
    if (import.meta.env.DEV) {
      migrationHelpers.warn(`[DEV] ${message}`, context);
    }
  },

  error: (message: string, error?: Error | unknown, context?: any) => {
    if (import.meta.env.DEV) {
      migrationHelpers.error(`[DEV] ${message}`, error, context);
    }
  },

  debug: (message: string, context?: any) => {
    if (import.meta.env.DEV) {
      migrationHelpers.debug(`[DEV] ${message}`, context);
    }
  }
};

/**
 * Context-aware logging helpers
 */
export const contextualLog = {
  // Component lifecycle logging
  componentMount: (componentName: string, props?: any) => {
    logger.debug(`Component mounted: ${componentName}`, { component: componentName, props });
  },

  componentUnmount: (componentName: string) => {
    logger.debug(`Component unmounted: ${componentName}`, { component: componentName });
  },

  // State change logging
  stateChange: (component: string, property: string, oldValue?: any, newValue?: any) => {
    logger.debug(`State change in ${component}`, {
      component,
      property,
      oldValue: typeof oldValue === 'object' ? '[Object]' : oldValue,
      newValue: typeof newValue === 'object' ? '[Object]' : newValue
    });
  },

  // User action logging
  userAction: (action: string, component?: string, context?: any) => {
    logger.info(`User action: ${action}`, { action, component, ...context });
  },

  // Network request logging
  networkRequest: (method: string, url: string, status?: number, duration?: number) => {
    logger.debug(`Network request: ${method} ${url}`, { method, url, status, duration });
  },

  // Error boundary logging
  errorBoundary: (error: Error, errorInfo?: any, component?: string) => {
    logger.error(`Error boundary caught error in ${component || 'unknown component'}`, {
      component,
      error: error.message,
      stack: error.stack,
      errorInfo
    }, error);
  }
};

/**
 * Utility function to safely log objects without circular references
 */
export const safeStringify = (obj: any): string => {
  try {
    return JSON.stringify(obj, (key, value) => {
      // Remove circular references
      if (typeof value === 'object' && value !== null) {
        if (value.constructor.name === 'HTMLElement') return '[HTMLElement]';
        if (value.constructor.name === 'Principal') return '[Principal]';
        if (typeof value.toString === 'function' && value.toString().includes('[object')) {
          return '[Object]';
        }
      }
      return value;
    }, 2);
  } catch (error) {
    return '[Unable to stringify object]';
  }
};

export default migrationHelpers;