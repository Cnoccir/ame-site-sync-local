/**
 * Date utility functions for consistent date handling
 */

/**
 * Get current ISO date string
 */
export const getCurrentISODate = (): string => {
  return new Date().toISOString();
};

/**
 * Get current date in YYYY-MM-DD format
 */
export const getCurrentDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Format timestamp for display
 */
export const formatTimestamp = (timestamp: string | Date): string => {
  const date = typeof timestamp === 'string' ? new Date(timestamp) : timestamp;
  return date.toLocaleString();
};

/**
 * Calculate duration between two timestamps
 */
export const calculateDuration = (start: string | Date, end: string | Date): number => {
  const startTime = typeof start === 'string' ? new Date(start) : start;
  const endTime = typeof end === 'string' ? new Date(end) : end;
  return Math.round((endTime.getTime() - startTime.getTime()) / 60000); // Return minutes
};

/**
 * Check if a date is today
 */
export const isToday = (date: string | Date): boolean => {
  const targetDate = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return targetDate.toDateString() === today.toDateString();
};

/**
 * Add days to a date
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Generate visit expiration date (24 hours from now)
 */
export const generateVisitExpiration = (): string => {
  const expiration = new Date();
  expiration.setHours(expiration.getHours() + 24);
  return expiration.toISOString();
};