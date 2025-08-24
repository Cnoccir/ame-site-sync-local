/**
 * ID generation utilities
 */

/**
 * Generate a random UUID
 */
export const generateUUID = (): string => {
  return crypto.randomUUID();
};

/**
 * Generate customer ID in format CUST_XXX
 */
export const generateCustomerId = (existingIds: string[] = []): string => {
  if (existingIds.length === 0) {
    return 'CUST_001';
  }
  
  const numbers = existingIds
    .filter(id => id.startsWith('CUST_'))
    .map(id => parseInt(id.replace('CUST_', '')))
    .filter(num => !isNaN(num));
  
  const maxNumber = numbers.length > 0 ? Math.max(...numbers) : 0;
  return `CUST_${(maxNumber + 1).toString().padStart(3, '0')}`;
};

/**
 * Generate visit ID in format VIS_YYYYMMDD_XXX
 */
export const generateVisitId = (existingIds: string[] = []): string => {
  const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
  const prefix = `VIS_${today}_`;
  
  const todayIds = existingIds.filter(id => id.startsWith(prefix));
  const count = todayIds.length + 1;
  
  return `${prefix}${count.toString().padStart(3, '0')}`;
};

/**
 * Generate session token
 */
export const generateSessionToken = (): string => {
  return generateUUID();
};