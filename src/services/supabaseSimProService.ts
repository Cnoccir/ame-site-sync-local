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
  match_type?: string;
  match_value?: string;
  contract_number?: string;
  latest_contract_number?: string;
  latest_contract_email?: string;
  latest_contract_name?: string;
  has_active_contracts?: boolean;
  total_contract_value?: number;
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
  latest_contract_number?: string;
  latest_contract_name?: string;
  latest_start_date?: string;
  latest_end_date?: string;
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
      // Try the original legacy search function only
      const { data, error } = await supabase.rpc('search_simpro_customers_by_name', {
        search_name: query.trim()
      });
      
      if (error) {
        console.warn('Legacy search failed, using table query fallback:', error);
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
      // Use the working fallback method directly (includes contract data)
      return await this.fallbackGetCustomerAutofill(customerId);
    } catch (error) {
      console.error('Error in getCustomerAutofill:', error);
      return null;
    }
  }

  /**
   * Get a combined search result with comprehensive matching
   */
  static async searchCustomersCombined(query: string): Promise<SimProCustomerSuggestion[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      // Use the original working method - search by name first, then multi-field
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
      site_nickname: simProData.latest_contract_number || '', // Use contract number as site nickname for Google Drive search
      site_address: this.formatFullAddress(simProData),
      service_tier: simProData.service_tier || 'CORE',
      contact_email: simProData.email || simProData.latest_contract_email || '',
      primary_contact_name: '', // Not available in SimPro data
      contact_phone: '', // Not available in SimPro data
      contract_status: simProData.has_active_contracts ? 'Active' : 'Inactive',
      contract_number: simProData.latest_contract_number || '', // New field from enhanced search
      contract_value: simProData.total_contract_value || 0,  // Add contract value
      contract_name: simProData.latest_contract_name || '' // Add contract name
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
        .ilike('company_name', `%${query}%`)
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
      // Search across multiple fields by running separate queries and combining results
      const [nameResults, addressResults, cityResults] = await Promise.all([
        supabase
          .from('simpro_customers')
          .select('simpro_customer_id, company_name, mailing_address, mailing_city, mailing_state, mailing_zip, email, service_tier')
          .ilike('company_name', `%${query}%`)
          .not('company_name', 'is', null)
          .limit(10),
        supabase
          .from('simpro_customers')
          .select('simpro_customer_id, company_name, mailing_address, mailing_city, mailing_state, mailing_zip, email, service_tier')
          .ilike('mailing_address', `%${query}%`)
          .not('company_name', 'is', null)
          .limit(10),
        supabase
          .from('simpro_customers')
          .select('simpro_customer_id, company_name, mailing_address, mailing_city, mailing_state, mailing_zip, email, service_tier')
          .ilike('mailing_city', `%${query}%`)
          .not('company_name', 'is', null)
          .limit(10)
      ]);

      // Check for errors
      if (nameResults.error || addressResults.error || cityResults.error) {
        console.error('Error in fallback multi search:', {
          name: nameResults.error,
          address: addressResults.error,
          city: cityResults.error
        });
        return [];
      }

      // Combine and deduplicate results
      const allResults = [
        ...(nameResults.data || []),
        ...(addressResults.data || []),
        ...(cityResults.data || [])
      ];

      // Remove duplicates based on simpro_customer_id
      const uniqueResults = allResults.reduce((acc, customer) => {
        const id = customer.simpro_customer_id?.toString() || '';
        if (id && !acc.find(c => c.simpro_customer_id?.toString() === id)) {
          acc.push(customer);
        }
        return acc;
      }, [] as typeof allResults);

      return uniqueResults.slice(0, 10).map(customer => ({
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
      // Try with simpro_customer_id first (most common case)
      let customerData = null;
      let customerError = null;
      
      // Check if customerId is a UUID
      const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(customerId);
      
      if (isUUID) {
        // Search by UUID
        const result = await supabase
          .from('simpro_customers')
          .select('*')
          .eq('id', customerId)
          .single();
        customerData = result.data;
        customerError = result.error;
      } else {
        // Search by simpro_customer_id
        const result = await supabase
          .from('simpro_customers')
          .select('*')
          .eq('simpro_customer_id', customerId)
          .single();
        customerData = result.data;
        customerError = result.error;
      }

      if (customerError) {
        console.error('Error getting customer data for autofill:', customerError);
        return null;
      }

      if (!customerData) {
        return null;
      }

      // Get contract data using the customer's UUID
      const { data: contractData, error: contractError } = await supabase
        .from('simpro_customer_contracts')
        .select('contract_value, contract_status, contract_email, contract_name, contract_number, start_date, end_date')
        .eq('customer_id', customerData.id)
        .order('start_date', { ascending: false });

      if (contractError) {
        console.warn('Error getting contract data for autofill:', contractError);
      }

      // Calculate contract stats
      const contracts = contractData || [];
      const activeContracts = contracts.filter(c => c.contract_status === 'Active');
      const totalContractValue = contracts.reduce((sum, c) => sum + (c.contract_value || 0), 0);
      const latestContract = contracts[0]; // Most recent contract
      
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
        latest_contract_email: latestContract?.contract_email || customerData.email || '',
        latest_contract_number: latestContract?.contract_number || '',
        latest_contract_name: latestContract?.contract_name || '',
        latest_start_date: latestContract?.start_date || '',
        latest_end_date: latestContract?.end_date || ''
      };
    } catch (error) {
      console.error('Error in fallbackGetCustomerAutofill:', error);
      return null;
    }
  }
}
