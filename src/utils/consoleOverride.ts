/**
 * Console Override System for OHMS 2.0
 * 
 * Professional console management that:
 * - Blocks all console output in production
 * - Provides formatted output in development
 * - Captures errors for professional logging
 * - Maintains security compliance
 */

import { logger } from './professionalLogger';

interface ConsoleMethodOverride {
  original: (...args: any[]) => void;
  override: (...args: any[]) => void;
  enabled: boolean;
}

class ConsoleOverrideManager {
  private overrides: Map<string, ConsoleMethodOverride> = new Map();
  private isInstalled = false;
  private developmentMode = !import.meta.env.PROD;

  public install(): void {
    if (this.isInstalled) return;

    const methods = ['log', 'debug', 'info', 'warn', 'error'] as const;

    methods.forEach(method => {
      const original = console[method].bind(console);
      const override = this.createOverride(method);

      this.overrides.set(method, { original, override, enabled: true });
      console[method] = override;
    });

    this.isInstalled = true;
    
    if (this.developmentMode) {
      logger.debug('Console override system installed', { 
        environment: import.meta.env.MODE,
        production: import.meta.env.PROD 
      });
    }
  }

  public uninstall(): void {
    if (!this.isInstalled) return;

    this.overrides.forEach((override, method) => {
      (console as any)[method] = override.original;
    });

    this.overrides.clear();
    this.isInstalled = false;

    if (this.developmentMode) {
      logger.debug('Console override system uninstalled');
    }
  }

  private createOverride(method: string) {
    return (...args: any[]) => {
      const override = this.overrides.get(method);
      if (!override?.enabled) return;

      // In production, only allow errors and route them to our logger
      if (import.meta.env.PROD) {
        if (method === 'error') {
          logger.error('Console Error Captured', { 
            originalArgs: args.map(this.sanitizeArg),
            source: 'console.error'
          });
        }
        return;
      }

      // In development, allow all but with formatting
      if (this.developmentMode) {
        const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
        const prefix = `[${timestamp}] [${method.toUpperCase()}]`;
        
        // Add structured formatting
        if (args.length === 0) {
          override.original(prefix);
        } else if (args.length === 1) {
          override.original(`${prefix} ${this.formatArg(args[0])}`);
        } else {
          override.original(prefix, ...args.map(this.formatArg));
        }
        
        // Also log to our professional logger for development insights
        this.logToProfessionalLogger(method, args);
      }
    };
  }

  private formatArg(arg: any): any {
    if (typeof arg === 'string') {
      return this.sanitizeArg(arg);
    } else if (typeof arg === 'object' && arg !== null) {
      try {
        return JSON.stringify(arg, null, 2);
      } catch {
        return '[Object]';
      }
    }
    return arg;
  }

  private sanitizeArg(arg: any): any {
    if (typeof arg === 'string') {
      return arg
        .replace(/principal[a-zA-Z0-9-_]*/gi, '[PRINCIPAL-REDACTED]')
        .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL-REDACTED]')
        .replace(/sk_[a-zA-Z0-9_]+/g, '[SECRET-KEY-REDACTED]')
        .replace(/pk_[a-zA-Z0-9_]+/g, '[PUBLIC-KEY-REDACTED]');
    }
    return '[OBJECT]';
  }

  private logToProfessionalLogger(method: string, args: any[]): void {
    const sanitizedArgs = args.map(this.sanitizeArg);
    
    switch (method) {
      case 'error':
        logger.error('Console Error', { args: sanitizedArgs });
        break;
      case 'warn':
        logger.warn('Console Warning', { args: sanitizedArgs });
        break;
      case 'info':
        logger.info('Console Info', { args: sanitizedArgs });
        break;
      case 'debug':
        logger.debug('Console Debug', { args: sanitizedArgs });
        break;
      case 'log':
        logger.debug('Console Log', { args: sanitizedArgs });
        break;
    }
  }

  public enableMethod(method: string): void {
    const override = this.overrides.get(method);
    if (override) {
      override.enabled = true;
      logger.debug(`Console method enabled: ${method}`);
    }
  }

  public disableMethod(method: string): void {
    const override = this.overrides.get(method);
    if (override) {
      override.enabled = false;
      logger.debug(`Console method disabled: ${method}`);
    }
  }

  public getStatus(): { 
    installed: boolean; 
    methods: string[]; 
    environment: string;
    production: boolean;
  } {
    return {
      installed: this.isInstalled,
      methods: Array.from(this.overrides.keys()),
      environment: import.meta.env.MODE || 'unknown',
      production: import.meta.env.PROD || false
    };
  }

  public captureGlobalErrors(): void {
    // Capture unhandled errors
    window.addEventListener('error', (event) => {
      logger.error('Global Error Captured', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        source: 'window.error'
      }, event.error);
    });

    // Capture unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Unhandled Promise Rejection', {
        reason: event.reason,
        source: 'unhandledrejection'
      });
    });

    logger.debug('Global error capture enabled');
  }
}

// Global instance
export const consoleManager = new ConsoleOverrideManager();

// Development tools interface
interface DevToolsInterface {
  logger: typeof logger;
  console: typeof consoleManager;
  getLogs: (count?: number) => any[];
  clearLogs: () => void;
  enableConsole: () => void;
  disableConsole: () => void;
  getMetrics: () => any;
}

// Expose development tools in non-production environments
if (!import.meta.env.PROD && typeof window !== 'undefined') {
  (window as any).__OHMS_DEV__ = {
    logger,
    console: consoleManager,
    getLogs: (count = 100) => logger.getRecentLogs(count),
    clearLogs: () => logger.clearBuffer(),
    enableConsole: () => consoleManager.enableMethod('log'),
    disableConsole: () => consoleManager.disableMethod('log'),
    getMetrics: () => ({
      logger: logger.getMetrics(),
      console: consoleManager.getStatus()
    })
  } as DevToolsInterface;
}

// Auto-install in production
if (import.meta.env.PROD) {
  consoleManager.install();
  consoleManager.captureGlobalErrors();
}

export default consoleManager;