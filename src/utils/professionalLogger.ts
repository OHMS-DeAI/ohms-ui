/**
 * Professional Logging System for OHMS 2.0
 * 
 * Enterprise-grade logging with:
 * - Environment-specific configuration
 * - Structured error reporting
 * - Security compliance (no sensitive data)
 * - Performance monitoring
 * - Development tools integration
 */

export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5,
  OFF = 6
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, any>;
  stack?: string;
  userId?: string;
  sessionId?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableRemote: boolean;
  sanitizeData: boolean;
  maxEntries: number;
  remoteEndpoint?: string;
}

class ProfessionalLogger {
  private config: LoggerConfig;
  private buffer: LogEntry[] = [];
  private sessionId: string;
  private listeners: Array<(entry: LogEntry) => void> = [];

  constructor(config: LoggerConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.initializeEnvironmentConfig();
  }

  private initializeEnvironmentConfig(): void {
    if (import.meta.env.PROD) {
      // Production: Only ERROR and FATAL
      this.config.level = LogLevel.ERROR;
      this.config.enableConsole = false;
      this.config.sanitizeData = true;
    } else if (import.meta.env.MODE === 'test') {
      // Testing: Minimal logging
      this.config.level = LogLevel.WARN;
      this.config.enableConsole = false;
    } else {
      // Development: Full logging
      this.config.level = LogLevel.DEBUG;
      this.config.enableConsole = true;
      this.config.sanitizeData = false;
    }
  }

  private sanitizeData(data: any): any {
    if (!this.config.sanitizeData) return data;

    const sensitivePatterns = [
      /principal[a-zA-Z0-9-_]*/gi,
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      /password|token|secret|key|auth/gi
    ];

    try {
      let sanitized = JSON.stringify(data);
      sensitivePatterns.forEach(pattern => {
        sanitized = sanitized.replace(pattern, '[REDACTED]');
      });
      return JSON.parse(sanitized);
    } catch {
      return '[SANITIZED]';
    }
  }

  public trace(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.TRACE, message, context);
  }

  public debug(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, context);
  }

  public info(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, context);
  }

  public warn(message: string, context?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, context);
  }

  public error(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.ERROR, message, context, error?.stack);
  }

  public fatal(message: string, context?: Record<string, any>, error?: Error): void {
    this.log(LogLevel.FATAL, message, context, error?.stack);
  }

  private log(level: LogLevel, message: string, context?: Record<string, any>, stack?: string): void {
    if (level < this.config.level) return;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      context: context ? this.sanitizeData(context) : undefined,
      stack,
      sessionId: this.sessionId
    };

    this.buffer.push(entry);
    this.maintainBufferSize();

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(entry);
      } catch {
        // Fail silently for listener errors
      }
    });

    if (this.config.enableConsole) {
      this.outputToConsole(entry);
    }

    if (this.config.enableRemote && level >= LogLevel.ERROR) {
      this.sendToRemote(entry);
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const levelStr = LogLevel[entry.level];
    const timestamp = entry.timestamp.split('T')[1].split('.')[0];
    const message = `[${timestamp}] ${levelStr}: ${entry.message}`;

    switch (entry.level) {
      case LogLevel.TRACE:
      case LogLevel.DEBUG:
        console.debug(message, entry.context || '');
        break;
      case LogLevel.INFO:
        console.info(message, entry.context || '');
        break;
      case LogLevel.WARN:
        console.warn(message, entry.context || '');
        break;
      case LogLevel.ERROR:
      case LogLevel.FATAL:
        console.error(message, entry.context || '', entry.stack || '');
        break;
    }
  }

  private async sendToRemote(entry: LogEntry): Promise<void> {
    if (!this.config.remoteEndpoint) return;

    try {
      await fetch(this.config.remoteEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry)
      });
    } catch {
      // Fail silently for remote logging errors
    }
  }

  private maintainBufferSize(): void {
    if (this.buffer.length > this.config.maxEntries) {
      this.buffer = this.buffer.slice(-this.config.maxEntries);
    }
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  public getRecentLogs(count: number = 100): LogEntry[] {
    return this.buffer.slice(-count);
  }

  public clearBuffer(): void {
    this.buffer = [];
  }

  public subscribe(listener: (entry: LogEntry) => void): () => void {
    this.listeners.push(listener);
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  public getMetrics(): { 
    bufferSize: number;
    sessionId: string;
    errorCount: number;
    warningCount: number;
  } {
    const errorCount = this.buffer.filter(e => e.level >= LogLevel.ERROR).length;
    const warningCount = this.buffer.filter(e => e.level === LogLevel.WARN).length;
    
    return {
      bufferSize: this.buffer.length,
      sessionId: this.sessionId,
      errorCount,
      warningCount
    };
  }
}

// Global logger instance
export const logger = new ProfessionalLogger({
  level: LogLevel.INFO,
  enableConsole: true,
  enableRemote: false,
  sanitizeData: true,
  maxEntries: 1000
});

// Helper functions for common logging patterns
export const logOperation = (operation: string, context?: Record<string, any>) => {
  logger.debug(`Operation: ${operation}`, context);
};

export const logError = (operation: string, error: Error, context?: Record<string, any>) => {
  logger.error(`Operation failed: ${operation}`, { 
    ...context, 
    error: error.message 
  }, error);
};

export const logPerformance = (operation: string, startTime: number, context?: Record<string, any>) => {
  const duration = Date.now() - startTime;
  logger.info(`Performance: ${operation} completed in ${duration}ms`, {
    ...context,
    duration
  });
};

export default logger;