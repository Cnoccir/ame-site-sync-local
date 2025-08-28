import { supabase } from '@/integrations/supabase/client';

export class CustomerIdService {
  /**
   * Generate the next customer ID in AME-YYYY-XXX format
   */
  static async generateNextCustomerId(): Promise<string> {
    try {
      const { data, error } = await supabase.rpc('generate_next_customer_id');
      
      if (error) {
        console.error('Error generating customer ID:', error);
        throw error;
      }
      
      return data as string;
    } catch (error) {
      console.error('Failed to generate customer ID:', error);
      
      // Fallback: Generate a basic ID with timestamp if the function fails
      const currentYear = new Date().getFullYear();
      const timestamp = Date.now().toString().slice(-3);
      return `AME-${currentYear}-${timestamp}`;
    }
  }
  
  /**
   * Validate customer ID format
   */
  static validateCustomerId(customerId: string): boolean {
    const pattern = /^AME-\d{4}-\d{3}$/;
    return pattern.test(customerId);
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
