import { supabase } from '@/integrations/supabase/client';

// Type definitions
export interface SimProCustomerSuggestion {
  id: string;
  company_name: string;
  mailing_address?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip?: string;
  email?: string;
  service_tier?: string;
  similarity_score?: number;
}

export interface SimProCustomerAutoFill {
  company_name: string;
  email: string;
  mailing_address: string;
  mailing_city: string;
  mailing_state: string;
  mailing_zip: string;
  service_tier: string;
  labor_tax_code?: string;
  part_tax_code?: string;
  is_contract_customer: boolean;
  has_active_contracts: boolean;
  total_contract_value?: number;
  active_contract_count?: number;
  latest_contract_email?: string;
}

export class SupabaseSimProService {
  /**
   * Search SimPro customers by company name with fuzzy matching
   */
  static async searchCustomersByName(query: string): Promise<SimProCustomerSuggestion[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      // First try the RPC function
      const { data, error } = await supabase.rpc('search_simpro_customers_by_name', {
        search_name: query.trim()
      });

      if (error) {
        console.warn('RPC function not available, falling back to table query:', error);
        // Fallback to direct table query
        return await this.fallbackSearchByName(query.trim());
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchCustomersByName:', error);
      // Try fallback method
      return await this.fallbackSearchByName(query.trim());
    }
  }

  /**
   * Multi-field search across company name, address, and city
   */
  static async searchCustomersMulti(query: string): Promise<SimProCustomerSuggestion[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const { data, error } = await supabase.rpc('search_simpro_customers_multi', {
        search_text: query.trim()
      });

      if (error) {
        console.warn('RPC function not available, falling back to table query:', error);
        // Fallback to direct table query
        return await this.fallbackSearchMulti(query.trim());
      }

      return data || [];
    } catch (error) {
      console.error('Error in searchCustomersMulti:', error);
      // Try fallback method
      return await this.fallbackSearchMulti(query.trim());
    }
  }

  /**
   * Get detailed customer information for autofill
   */
  static async getCustomerAutofill(customerId: string): Promise<SimProCustomerAutoFill | null> {
    if (!customerId) {
      return null;
    }

    try {
      const { data, error } = await supabase.rpc('get_simpro_customer_autofill', {
        customer_id: customerId
      });

      if (error) {
        console.warn('RPC function not available, falling back to table query:', error);
        return await this.fallbackGetCustomerAutofill(customerId);
      }

      // The function returns an array with one object, extract the nested object
      if (data && data.length > 0 && data[0].get_simpro_customer_autofill) {
        return data[0].get_simpro_customer_autofill;
      }

      return await this.fallbackGetCustomerAutofill(customerId);
    } catch (error) {
      console.error('Error in getCustomerAutofill:', error);
      return await this.fallbackGetCustomerAutofill(customerId);
    }
  }

  /**
   * Get a combined search result with both name-based and multi-field search
   */
  static async searchCustomersCombined(query: string): Promise<SimProCustomerSuggestion[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      // Run both searches in parallel
      const [nameResults, multiResults] = await Promise.all([
        this.searchCustomersByName(query),
        this.searchCustomersMulti(query)
      ]);

      // Combine results, prioritizing name-based matches
      const combined = [...nameResults];
      
      // Add multi-field results that aren't already included
      for (const multiResult of multiResults) {
        if (!nameResults.find(nameResult => nameResult.id === multiResult.id)) {
          combined.push(multiResult);
        }
      }

      // Sort by similarity score (descending) and take top 10
      return combined
        .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
        .slice(0, 10);
    } catch (error) {
      console.error('Error in searchCustomersCombined:', error);
      return [];
    }
  }

  /**
   * Format address for display
   */
  static formatAddress(customer: SimProCustomerSuggestion): string {
    const parts = [
      customer.mailing_address,
      customer.mailing_city,
      customer.mailing_state,
      customer.mailing_zip
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Create a display label for a customer
   */
  static createDisplayLabel(customer: SimProCustomerSuggestion): string {
    const address = this.formatAddress(customer);
    return `${customer.company_name}${address ? ` • ${address}` : ''}`;
  }

  /**
   * Map SimPro customer data to the NewCustomerWizard form format
   */
  static mapToFormData(simProData: SimProCustomerAutoFill): Partial<any> {
    return {
      company_name: simProData.company_name || '',
      site_name: simProData.company_name || '', // Use company name as default site name
      site_address: this.formatFullAddress(simProData),
      service_tier: simProData.service_tier || 'CORE',
      contact_email: simProData.email || simProData.latest_contract_email || '',
      primary_contact_name: '', // Not available in SimPro data
      contact_phone: '', // Not available in SimPro data
      contract_status: simProData.has_active_contracts ? 'Active' : 'Inactive'
    };
  }

  /**
   * Format full address from SimPro data
   */
  private static formatFullAddress(data: SimProCustomerAutoFill): string {
    const parts = [
      data.mailing_address,
      data.mailing_city,
      data.mailing_state,
      data.mailing_zip
    ].filter(Boolean);
    
    return parts.join(', ');
  }

  /**
   * Fallback method to search by name using direct table query
   */
  private static async fallbackSearchByName(query: string): Promise<SimProCustomerSuggestion[]> {
    try {
      const { data, error } = await supabase
        .from('simpro_customers')
        .select('simpro_customer_id, company_name, mailing_address, mailing_city, mailing_state, mailing_zip, email, service_tier')
        .or(`company_name.ilike.%${query}%,company_name.ilike.${query}%`)
        .not('company_name', 'is', null)
        .limit(10);

      if (error) {
        console.error('Error in fallback search by name:', error);
        return [];
      }

      return (data || []).map(customer => ({
        id: customer.simpro_customer_id?.toString() || '',
        company_name: customer.company_name || '',
        mailing_address: customer.mailing_address || '',
        mailing_city: customer.mailing_city || '',
        mailing_state: customer.mailing_state || '',
        mailing_zip: customer.mailing_zip || '',
        email: customer.email || '',
        service_tier: customer.service_tier || '',
        similarity_score: 0.5 // Default similarity for fallback
      }));
    } catch (error) {
      console.error('Error in fallbackSearchByName:', error);
      return [];
    }
  }

  /**
   * Fallback method to search across multiple fields using direct table query
   */
  private static async fallbackSearchMulti(query: string): Promise<SimProCustomerSuggestion[]> {
    try {
      const { data, error } = await supabase
        .from('simpro_customers')
        .select('simpro_customer_id, company_name, mailing_address, mailing_city, mailing_state, mailing_zip, email, service_tier')
        .or(`company_name.ilike.%${query}%,mailing_address.ilike.%${query}%,mailing_city.ilike.%${query}%`)
        .not('company_name', 'is', null)
        .limit(10);

      if (error) {
        console.error('Error in fallback multi search:', error);
        return [];
      }

      return (data || []).map(customer => ({
        id: customer.simpro_customer_id?.toString() || '',
        company_name: customer.company_name || '',
        mailing_address: customer.mailing_address || '',
        mailing_city: customer.mailing_city || '',
        mailing_state: customer.mailing_state || '',
        mailing_zip: customer.mailing_zip || '',
        email: customer.email || '',
        service_tier: customer.service_tier || '',
        similarity_score: 0.4 // Default similarity for fallback
      }));
    } catch (error) {
      console.error('Error in fallbackSearchMulti:', error);
      return [];
    }
  }

  /**
   * Fallback method to get customer autofill data using direct table queries
   */
  private static async fallbackGetCustomerAutofill(customerId: string): Promise<SimProCustomerAutoFill | null> {
    try {
      // Get customer data
      const { data: customerData, error: customerError } = await supabase
        .from('simpro_customers')
        .select('*')
        .eq('simpro_customer_id', customerId)
        .single();

      if (customerError) {
        console.error('Error getting customer data for autofill:', customerError);
        return null;
      }

      if (!customerData) {
        return null;
      }

      // Get contract data
      const { data: contractData, error: contractError } = await supabase
        .from('simpro_customer_contracts')
        .select('contract_value, contract_status, email')
        .eq('customer_id', customerId);

      if (contractError) {
        console.warn('Error getting contract data for autofill:', contractError);
      }

      // Calculate contract stats
      const contracts = contractData || [];
      const activeContracts = contracts.filter(c => c.contract_status === 'Active');
      const totalContractValue = contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0);
      const latestContractEmail = contracts.find(c => c.email)?.email || customerData.email;

      return {
        company_name: customerData.company_name || '',
        email: customerData.email || '',
        mailing_address: customerData.mailing_address || '',
        mailing_city: customerData.mailing_city || '',
        mailing_state: customerData.mailing_state || '',
        mailing_zip: customerData.mailing_zip || '',
        service_tier: customerData.service_tier || 'CORE',
        labor_tax_code: customerData.labor_tax_code,
        part_tax_code: customerData.part_tax_code,
        is_contract_customer: contracts.length > 0,
        has_active_contracts: activeContracts.length > 0,
        total_contract_value: totalContractValue,
        active_contract_count: activeContracts.length,
        latest_contract_email: latestContractEmail
      };
    } catch (error) {
      console.error('Error in fallbackGetCustomerAutofill:', error);
      return null;
    }
  }
}
