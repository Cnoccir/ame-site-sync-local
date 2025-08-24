import { logger } from './logger';

/**
 * Centralized error handling utility
 */
export interface ErrorContext {
  operation: string;
  userId?: string;
  additionalData?: Record<string, any>;
}

export class AppError extends Error {
  constructor(
    message: string,
    public code?: string,
    public context?: ErrorContext
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export const errorHandler = {
  /**
   * Handle and log errors consistently
   */
  handle(error: unknown, context?: ErrorContext): AppError {
    const message = error instanceof Error ? error.message : 'Unknown error occurred';
    const appError = new AppError(message, undefined, context);
    
    logger.error(
      `Error in ${context?.operation || 'unknown operation'}`,
      error,
      context?.additionalData
    );
    
    return appError;
  },

  /**
   * Handle Supabase errors with proper typing
   */
  handleSupabaseError(error: any, operation: string): AppError {
    const context: ErrorContext = {
      operation,
      additionalData: {
        code: error?.code,
        details: error?.details,
        hint: error?.hint
      }
    };
    
    return this.handle(error, context);
  },

  /**
   * Handle async operations with consistent error handling
   */
  async withErrorHandling<T>(
    operation: () => Promise<T>,
    operationName: string,
    context?: Partial<ErrorContext>
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      throw this.handle(error, { operation: operationName, ...context });
    }
  }
};