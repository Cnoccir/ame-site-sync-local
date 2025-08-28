import { supabase } from '@/integrations/supabase/client';

export class CustomerIdService {
  /**
   * Generate the next customer ID in AME-XXXXXX format
   */
  static async generateNextCustomerId(): Promise<string> {
    try {
      // Try the new function name first
      const { data, error } = await supabase.rpc('generate_customer_id');
      
      if (error) {
        // Try the legacy function name as fallback
        const { data: legacyData, error: legacyError } = await supabase.rpc('generate_next_customer_id');
        
        if (legacyError) {
          console.error('Error generating customer ID:', legacyError);
          throw legacyError;
        }
        
        return legacyData as string;
      }
      
      return data as string;
    } catch (error) {
      console.error('Failed to generate customer ID:', error);
      
      // Fallback: Generate a basic ID with timestamp if the function fails
      const timestamp = Date.now().toString().slice(-6);
      return `AME-${timestamp}`;
    }
  }
  
  /**
   * Validate customer ID format (supports both old and new formats)
   */
  static validateCustomerId(customerId: string): boolean {
    // Support both AME-XXXXXX and AME-YYYY-XXX formats
    const newPattern = /^AME-\d{6}$/;
    const oldPattern = /^AME-\d{4}-\d{3}$/;
    return newPattern.test(customerId) || oldPattern.test(customerId);
  }
  
  /**
   * Check if customer ID already exists
   */
  static async isCustomerIdExists(customerId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('ame_customers')
      .select('id')
      .eq('customer_id', customerId)
      .limit(1);
    
    if (error) {
      console.error('Error checking customer ID:', error);
      throw error;
    }
    
    return data && data.length > 0;
  }
}
