import { supabase } from '@/integrations/supabase/client';

// Type definitions
export interface SimProCustomerSuggestion {
  id: string;
  legacy_customer_id?: number;
  company_name: string;
  site_nickname?: string;
  mailing_address?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip?: string;
  primary_contact_email?: string;
  service_tier?: string;
  similarity_score?: number;
  match_type?: string;
  match_value?: string;
  contract_number?: string;
  contract_status?: string;
  latest_contract_email?: string;
  has_active_contracts?: boolean;
  total_contract_value?: number;
  primary_technician_id?: string;
  secondary_technician_id?: string;
}

export interface SimProCustomerAutoFill {
  company_name: string;
  site_nickname?: string;
  primary_contact_email?: string;
  mailing_address?: string;
  mailing_city?: string;
  mailing_state?: string;
  mailing_zip?: string;
  service_tier: string;
  has_active_contracts: boolean;
  total_contract_value?: number;
  contract_number?: string;
  contract_status?: string;
  latest_contract_email?: string;
  primary_technician_id?: string;
  secondary_technician_id?: string;
  legacy_customer_id?: number;
}

export class SupabaseSimProService {
  /**
   * Search customers by name using AME customers as the source of truth
   */
  static async searchCustomersByName(query: string): Promise<SimProCustomerSuggestion[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const q = `%${query.trim()}%`;
      const [byName, bySite, byNick] = await Promise.all([
        supabase
          .from('ame_customers')
          .select('id, legacy_customer_id, company_name, site_nickname, site_name, site_address, contact_email, service_tier, contract_number, contract_status, contract_value, primary_technician_id, secondary_technician_id')
          .ilike('company_name', q)
          .limit(10),
        supabase
          .from('ame_customers')
          .select('id, legacy_customer_id, company_name, site_nickname, site_name, site_address, contact_email, service_tier, contract_number, contract_status, contract_value, primary_technician_id, secondary_technician_id')
          .ilike('site_name', q)
          .limit(10),
        supabase
          .from('ame_customers')
          .select('id, legacy_customer_id, company_name, site_nickname, site_name, site_address, contact_email, service_tier, contract_number, contract_status, contract_value, primary_technician_id, secondary_technician_id')
          .ilike('site_nickname', q)
          .limit(10)
      ]);

      const all = [
        ...(byName.data || []),
        ...(bySite.data || []),
        ...(byNick.data || [])
      ];

      const unique = all.reduce((acc: any[], c: any) => {
        if (!acc.find(x => x.id === c.id)) acc.push(c);
        return acc;
      }, []);

      return unique.slice(0, 10).map((c: any) => ({
        id: c.id,
        legacy_customer_id: c.legacy_customer_id,
        company_name: c.company_name || '',
        site_nickname: c.site_nickname || c.site_name,
        mailing_address: c.site_address || '',
        mailing_city: '',
        mailing_state: '',
        mailing_zip: '',
        primary_contact_email: c.contact_email || '',
        service_tier: c.service_tier || '',
        has_active_contracts: (c.contract_status?.toLowerCase?.() === 'active') || (Number(c.contract_value) > 0),
        total_contract_value: Number(c.contract_value) || 0,
        contract_number: c.contract_number || '',
        contract_status: c.contract_status || '',
        latest_contract_email: '',
        primary_technician_id: c.primary_technician_id,
        secondary_technician_id: c.secondary_technician_id,
        similarity_score: 0.6
      }));
    } catch (error) {
      console.error('Error in searchCustomersByName:', error);
      return [];
    }
  }

  /**
   * Multi-field search across name and address using AME customers
   */
  static async searchCustomersMulti(query: string): Promise<SimProCustomerSuggestion[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const q = `%${query.trim()}%`;
      const [byName, bySite, byNick, byAddress] = await Promise.all([
        supabase.from('ame_customers').select('id, legacy_customer_id, company_name, site_nickname, site_name, site_address, contact_email, service_tier, contract_number, contract_status, contract_value, primary_technician_id, secondary_technician_id').ilike('company_name', q).limit(10),
        supabase.from('ame_customers').select('id, legacy_customer_id, company_name, site_nickname, site_name, site_address, contact_email, service_tier, contract_number, contract_status, contract_value, primary_technician_id, secondary_technician_id').ilike('site_name', q).limit(10),
        supabase.from('ame_customers').select('id, legacy_customer_id, company_name, site_nickname, site_name, site_address, contact_email, service_tier, contract_number, contract_status, contract_value, primary_technician_id, secondary_technician_id').ilike('site_nickname', q).limit(10),
        supabase.from('ame_customers').select('id, legacy_customer_id, company_name, site_nickname, site_name, site_address, contact_email, service_tier, contract_number, contract_status, contract_value, primary_technician_id, secondary_technician_id').ilike('site_address', q).limit(10)
      ]);

      const all = [
        ...(byName.data || []),
        ...(bySite.data || []),
        ...(byNick.data || []),
        ...(byAddress.data || [])
      ];

      const unique = all.reduce((acc: any[], c: any) => { if (!acc.find(x => x.id === c.id)) acc.push(c); return acc; }, []);

      return unique.slice(0, 10).map((c: any) => ({
        id: c.id,
        legacy_customer_id: c.legacy_customer_id,
        company_name: c.company_name || '',
        site_nickname: c.site_nickname || c.site_name,
        mailing_address: c.site_address || '',
        mailing_city: '',
        mailing_state: '',
        mailing_zip: '',
        primary_contact_email: c.contact_email || '',
        service_tier: c.service_tier || '',
        has_active_contracts: (c.contract_status?.toLowerCase?.() === 'active') || (Number(c.contract_value) > 0),
        total_contract_value: Number(c.contract_value) || 0,
        contract_number: c.contract_number || '',
        contract_status: c.contract_status || '',
        latest_contract_email: '',
        primary_technician_id: c.primary_technician_id,
        secondary_technician_id: c.secondary_technician_id,
        similarity_score: 0.5
      }));
    } catch (error) {
      console.error('Error in searchCustomersMulti:', error);
      return [];
    }
  }

  /**
   * Get detailed customer information for autofill from AME customers
   */
  static async getCustomerAutofill(customerId: string): Promise<SimProCustomerAutoFill | null> {
    if (!customerId) {
      return null;
    }

    try {
      const { data: c, error } = await supabase
        .from('ame_customers')
        .select(`
          id,
          legacy_customer_id,
          company_name,
          site_nickname,
          site_name,
          site_address,
          contact_email,
          service_tier,
          contract_value,
          contract_number,
          contract_status,
          primary_technician_id,
          secondary_technician_id
        `)
        .eq('id', customerId)
        .single();

      if (error) {
        console.error('Error getting AME customer for autofill:', error);
        return null;
      }

      if (!c) return null;

      // Map fields to the existing autofill interface
      return {
        company_name: c.company_name || '',
        site_nickname: c.site_nickname || c.site_name || '',
        primary_contact_email: c.contact_email || '',
        mailing_address: c.site_address || '',
        mailing_city: '',
        mailing_state: '',
        mailing_zip: '',
        service_tier: c.service_tier || 'CORE',
        has_active_contracts: (c.contract_status?.toLowerCase?.() === 'active') || (Number(c.contract_value) > 0),
        total_contract_value: Number(c.contract_value) || 0,
        contract_number: c.contract_number || '',
        contract_status: c.contract_status || '',
        latest_contract_email: '',
        primary_technician_id: c.primary_technician_id,
        secondary_technician_id: c.secondary_technician_id,
        legacy_customer_id: c.legacy_customer_id
      };
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
      const [nameResults, multiResults] = await Promise.all([
        this.searchCustomersByName(query),
        this.searchCustomersMulti(query)
      ]);

      const combined = [...nameResults];
      for (const multiResult of multiResults) {
        if (!nameResults.find(nameResult => nameResult.id === multiResult.id)) {
          combined.push(multiResult);
        }
      }

      return combined
        .sort((a, b) => (b.similarity_score || 0) - (a.similarity_score || 0))
        .slice(0, 10);
    } catch (error) {
      console.error('Error in searchCustomersCombined:', error);
      return [];
    }
  }

  /**
   * Format address for display (supports legacy mailing_* or site_address)
   */
  static formatAddress(customer: SimProCustomerSuggestion | any): string {
    const parts = [
      customer.mailing_address,
      customer.mailing_city,
      customer.mailing_state,
      customer.mailing_zip
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(', ');

    // Fallback to site_address if present on object
    if (customer.site_address) return String(customer.site_address);

    return '';
  }

  /**
   * Create a display label for a customer
   */
  static createDisplayLabel(customer: SimProCustomerSuggestion): string {
    const address = this.formatAddress(customer as any);
    return `${customer.company_name}${address ? ` • ${address}` : ''}`;
  }

  /**
   * Map SimPro customer data to the NewCustomerWizard form format
   */
  static mapToFormData(simProData: SimProCustomerAutoFill): Partial<any> {
    const formattedAddress = this.formatFullAddress(simProData);

    return {
      // PM Workflow compatible fields (what Phase1SiteIntelligence expects)
      companyName: simProData.company_name || '',
      siteName: simProData.site_nickname || simProData.company_name || '',
      address: formattedAddress, // PM workflow expects 'address'
      serviceTier: simProData.service_tier || 'CORE',
      contractNumber: simProData.contract_number || '', // PM workflow expects 'contractNumber'
      accountManager: '', // Will be filled from account manager search

      // NewCustomerWizard compatible fields (what the form handler looks for)
      company_name: simProData.company_name || '',
      site_name: simProData.site_nickname || simProData.company_name || '',
      site_nickname: simProData.site_nickname || '',
      site_address: formattedAddress, // Form handler expects 'site_address'
      service_tier: simProData.service_tier || 'CORE',
      contact_email: simProData.primary_contact_email || simProData.latest_contract_email || '',
      primary_contact_name: '', // Not available in imported data
      contact_phone: '', // Not available in imported data
      contract_status: simProData.has_active_contracts ? 'Active' : 'Inactive',
      contract_number: simProData.contract_number || '', // Form handler expects 'contract_number'
      contract_value: simProData.total_contract_value || 0,
      legacy_customer_id: simProData.legacy_customer_id,
      primary_technician_id: simProData.primary_technician_id,
      secondary_technician_id: simProData.secondary_technician_id,

      // Keep compatibility field
      simproCustomerId: simProData.legacy_customer_id
    };
  }

  /**
   * Format full address from data
   */
  private static formatFullAddress(data: SimProCustomerAutoFill): string {
    const parts = [
      data.mailing_address,
      data.mailing_city,
      data.mailing_state,
      data.mailing_zip
    ].filter(Boolean);

    if (parts.length > 0) return parts.join(', ');
    return (data as any).site_address || '';
  }
}
