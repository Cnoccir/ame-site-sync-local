/**
 * Centralized logging utility with environment-based log levels
 */
export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

class Logger {
  private isDevelopment = import.meta.env.DEV;

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const contextStr = context ? ` | ${JSON.stringify(context)}` : '';
    return `[${timestamp}] ${level.toUpperCase()}: ${message}${contextStr}`;
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }

  info(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.info(this.formatMessage('info', message, context));
    }
  }

  warn(message: string, error?: Error | unknown, context?: LogContext): void {
    const warnContext = error instanceof Error 
      ? { ...context, error: error.message, stack: error.stack }
      : context;
    
    console.warn(this.formatMessage('warn', message, warnContext));
  }

  error(message: string, error?: Error | unknown, context?: LogContext): void {
    const errorContext = error instanceof Error 
      ? { ...context, error: error.message, stack: error.stack }
      : { ...context, error };
    
    console.error(this.formatMessage('error', message, errorContext));
  }
}

export const logger = new Logger();