import { supabase } from '../lib/supabase';

// Type definitions
interface CustomerSuggestion {
  id: string;
  label: string;
  sublabel: string;
  value: {
    id: string;
    company_name: string;
    site_nickname: string;
    site_number: string;
    service_tier: string;
  };
}

interface CustomerAutoFill {
  siteIdentity: {
    company_name: string;
    site_nickname: string;
    site_number: string;
    service_tier: string;
    system_platform: string;
  };
  contactInfo: {
    primary_contact_email: string;
    primary_contact_name: string;
    primary_contact_phone: string;
    secondary_contact_email: string;
    secondary_contact_name: string;
    secondary_contact_phone: string;
  };
  siteAccess: {
    mailing_address: string;
    mailing_city: string;
    mailing_state: string;
    best_arrival_time: string;
    access_notes: string;
    site_hazards: string;
  };
  contractInfo: {
    active_contracts: any[];
    total_value: number;
    primary_contract?: any;
  };
}

interface ValidationError {
  field: string;
  message: string;
}

interface ValidationWarning {
  field: string;
  message: string;
}

interface DataSuggestion {
  field: string;
  suggestion: string;
  reason: string;
}

interface ValidationResult {
  errors: ValidationError[];
  warnings: ValidationWarning[];
  suggestions: DataSuggestion[];
  isValid: boolean;
}

export class SmartAutoCompleteService {
  // Get customer suggestions based on partial input
  static async getCustomerSuggestions(query: string): Promise<CustomerSuggestion[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name, site_nickname, site_number, service_tier')
        .or(`company_name.ilike.%${query}%,site_nickname.ilike.%${query}%,site_number.ilike.%${query}%`)
        .limit(10);
        
      if (error) {
        console.error('Error fetching customer suggestions:', error);
        return [];
      }
      
      return (data || []).map(customer => ({
        id: customer.id,
        label: `${customer.company_name} (${customer.site_nickname || 'No nickname'})`,
        sublabel: `${customer.site_number} • ${customer.service_tier}`,
        value: {
          id: customer.id,
          company_name: customer.company_name,
          site_nickname: customer.site_nickname || '',
          site_number: customer.site_number || '',
          service_tier: customer.service_tier || 'CORE'
        }
      }));
    } catch (error) {
      console.error('Error in getCustomerSuggestions:', error);
      return [];
    }
  }
  
  // Auto-populate fields based on selected customer
  static async autoPopulateCustomerFields(customerId: string): Promise<CustomerAutoFill | null> {
    try {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select(`
          *
        `)
        .eq('id', customerId)
        .single();
        
      if (customerError) {
        console.error('Error fetching customer for auto-populate:', customerError);
        return null;
      }

      // Get contracts separately
      const { data: contracts, error: contractsError } = await supabase
        .from('customer_contracts')
        .select('*')
        .eq('customer_id', customerId);

      if (contractsError) {
        console.error('Error fetching contracts:', contractsError);
      }
      
      return {
        siteIdentity: {
          company_name: customer.company_name || '',
          site_nickname: customer.site_nickname || '',
          site_number: customer.site_number || '',
          service_tier: customer.service_tier || 'CORE',
          system_platform: customer.system_platform || ''
        },
        contactInfo: {
          primary_contact_email: customer.primary_contact_email || '',
          primary_contact_name: customer.primary_contact_name || '',
          primary_contact_phone: customer.primary_contact_phone || '',
          secondary_contact_email: customer.secondary_contact_email || '',
          secondary_contact_name: customer.secondary_contact_name || '',
          secondary_contact_phone: customer.secondary_contact_phone || ''
        },
        siteAccess: {
          mailing_address: customer.mailing_address || '',
          mailing_city: customer.mailing_city || '',
          mailing_state: customer.mailing_state || '',
          best_arrival_time: customer.best_arrival_time || '',
          access_notes: customer.access_notes || '',
          site_hazards: customer.site_hazards || ''
        },
        contractInfo: {
          active_contracts: (contracts || []).filter(c => c.contract_status === 'Active'),
          total_value: customer.total_contract_value || 0,
          primary_contract: (contracts || []).find(c => c.contract_status === 'Active')
        }
      };
    } catch (error) {
      console.error('Error in autoPopulateCustomerFields:', error);
      return null;
    }
  }
  
  // Validate and suggest corrections for data entry
  static async validateCustomerData(data: any): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const suggestions: DataSuggestion[] = [];
    
    try {
      // Validate required fields
      if (!data.company_name?.trim()) {
        errors.push({ field: 'company_name', message: 'Company name is required' });
      }
      
      // Check for duplicate site numbers
      if (data.site_number) {
        const existing = await this.checkSiteNumberExists(data.site_number, data.id);
        if (existing) {
          errors.push({ field: 'site_number', message: 'Site number already exists' });
        }
      }
      
      // Validate email format
      if (data.primary_contact_email && !this.isValidEmail(data.primary_contact_email)) {
        errors.push({ field: 'primary_contact_email', message: 'Invalid email format' });
      }
      
      if (data.secondary_contact_email && !this.isValidEmail(data.secondary_contact_email)) {
        errors.push({ field: 'secondary_contact_email', message: 'Invalid email format' });
      }
      
      // Suggest improvements
      if (data.company_name && !data.site_nickname) {
        suggestions.push({
          field: 'site_nickname',
          suggestion: this.generateSuggestedNickname(data.company_name),
          reason: 'Generated from company name for quick reference'
        });
      }
      
      if (data.company_name && !data.site_number) {
        // Generate a site number suggestion
        const suggestedNumber = await this.generateUniqueSiteNumber();
        suggestions.push({
          field: 'site_number',
          suggestion: suggestedNumber,
          reason: 'Auto-generated unique site identifier'
        });
      }
      
      // Warn about missing contact info
      if (!data.primary_contact_email && !data.primary_contact_phone) {
        warnings.push({
          field: 'primary_contact_email',
          message: 'Consider adding primary contact information for better coordination'
        });
      }
      
      return { 
        errors, 
        warnings, 
        suggestions, 
        isValid: errors.length === 0 
      };
    } catch (error) {
      console.error('Error in validateCustomerData:', error);
      return {
        errors: [{ field: 'general', message: 'Validation error occurred' }],
        warnings: [],
        suggestions: [],
        isValid: false
      };
    }
  }
  
  // Check if site number already exists
  private static async checkSiteNumberExists(siteNumber: string, excludeId?: string): Promise<boolean> {
    try {
      let query = supabase
        .from('customers')
        .select('id')
        .eq('site_number', siteNumber);
        
      if (excludeId) {
        query = query.neq('id', excludeId);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error checking site number:', error);
        return false;
      }
      
      return (data || []).length > 0;
    } catch (error) {
      console.error('Error in checkSiteNumberExists:', error);
      return false;
    }
  }
  
  // Generate suggested nickname from company name
  static generateSuggestedNickname(companyName: string): string {
    if (!companyName) return '';
    
    // Remove common suffixes and clean up
    const cleanName = companyName
      .replace(/\b(inc|llc|corp|corporation|company|co|ltd)\b\.?/gi, '')
      .replace(/[^\w\s]/g, '')
      .trim();
    
    // Take first 2-3 words or abbreviate long single word
    const words = cleanName.split(/\s+/).filter(w => w.length > 0);
    if (words.length >= 2) {
      return words.slice(0, 2).join(' ');
    } else if (words.length === 1 && words[0].length > 8) {
      return words[0].substring(0, 8);
    }
    return cleanName.substring(0, 20);
  }
  
  // Generate unique site number
  private static async generateUniqueSiteNumber(): Promise<string> {
    try {
      // Get the highest existing site number
      const { data, error } = await supabase
        .from('customers')
        .select('site_number')
        .not('site_number', 'is', null)
        .order('site_number', { ascending: false })
        .limit(1);
        
      if (error) {
        console.error('Error generating site number:', error);
        return `SITE-${Date.now().toString().slice(-4)}`;
      }
      
      if (!data || data.length === 0) {
        return 'SITE-0001';
      }
      
      // Extract number from existing site number and increment
      const lastNumber = data[0].site_number;
      const match = lastNumber.match(/SITE-(\d+)/);
      if (match) {
        const nextNumber = parseInt(match[1]) + 1;
        return `SITE-${nextNumber.toString().padStart(4, '0')}`;
      }
      
      return `SITE-${Date.now().toString().slice(-4)}`;
    } catch (error) {
      console.error('Error in generateUniqueSiteNumber:', error);
      return `SITE-${Date.now().toString().slice(-4)}`;
    }
  }
  
  // Calculate suggested service tier based on contract values
  static async calculateSuggestedServiceTier(customerId: string): Promise<'CORE' | 'ASSURE' | 'GUARDIAN'> {
    try {
      const { data: contracts, error } = await supabase
        .from('customer_contracts')
        .select('contract_value, contract_status')
        .eq('customer_id', customerId)
        .eq('contract_status', 'Active');
        
      if (error || !contracts) {
        return 'CORE';
      }
      
      const totalValue = contracts.reduce((sum, contract) => sum + (contract.contract_value || 0), 0);
      
      // Tier determination based on annual contract value
      if (totalValue >= 200000) return 'GUARDIAN';  // $200k+ = Premium service
      if (totalValue >= 75000) return 'ASSURE';     // $75k-$200k = Enhanced service  
      return 'CORE';                                // <$75k = Basic service
    } catch (error) {
      console.error('Error calculating suggested service tier:', error);
      return 'CORE';
    }
  }
  
  // Validate email format
  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  // Get all customers for dropdown/selection
  static async getAllCustomers(): Promise<CustomerSuggestion[]> {
    try {
      const { data, error } = await supabase
        .from('customers')
        .select('id, company_name, site_nickname, site_number, service_tier')
        .order('company_name');
        
      if (error) {
        console.error('Error fetching all customers:', error);
        return [];
      }
      
      return (data || []).map(customer => ({
        id: customer.id,
        label: `${customer.company_name} (${customer.site_nickname || 'No nickname'})`,
        sublabel: `${customer.site_number} • ${customer.service_tier}`,
        value: {
          id: customer.id,
          company_name: customer.company_name,
          site_nickname: customer.site_nickname || '',
          site_number: customer.site_number || '',
          service_tier: customer.service_tier || 'CORE'
        }
      }));
    } catch (error) {
      console.error('Error in getAllCustomers:', error);
      return [];
    }
  }
}

// Export types for use in components
export type { 
  CustomerSuggestion, 
  CustomerAutoFill, 
  ValidationResult, 
  ValidationError, 
  ValidationWarning, 
  DataSuggestion 
};
