/**
 * Unified Customer Service
 * Single source of truth for all customer CRUD operations
 * Ensures data consistency across all components
 */

import { supabase } from '@/integrations/supabase/client';
import { 
  UnifiedCustomer, 
  CustomerFormData, 
  prepareCustomerForDatabase,
  normalizeSiteHazards 
} from '@/types/customer.unified';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/errorHandler';

export class UnifiedCustomerService {
  /**
   * Get all customers with enhanced data
   */
  static async getAllCustomers(): Promise<UnifiedCustomer[]> {
    return errorHandler.withErrorHandling(async () => {
      // Always use ame_customers as source of truth
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .order('company_name');
      
      if (error) throw errorHandler.handleSupabaseError(error, 'getAllCustomers');
      
      // Normalize the data to ensure consistency
      return (data || []).map(record => this.normalizeCustomerData(record));
    }, 'getAllCustomers');
  }

  /**
   * Get a single customer by ID
   */
  static async getCustomer(id: string): Promise<UnifiedCustomer | null> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw errorHandler.handleSupabaseError(error, 'getCustomer');
      }
      
      return this.normalizeCustomerData(data);
    }, 'getCustomer', { additionalData: { customerId: id } });
  }

  /**
   * Create a new customer
   */
  static async createCustomer(customerData: CustomerFormData): Promise<UnifiedCustomer> {
    return errorHandler.withErrorHandling(async () => {
      logger.info('Creating customer with unified service', {
        company: customerData.company_name,
        customerId: customerData.customer_id
      });
      
      // Prepare data for database
      const cleanedData = prepareCustomerForDatabase(customerData);
      
      // Extract credentials if present
      const credentials = {
        system_credentials: customerData.system_credentials,
        windows_credentials: customerData.windows_credentials,
        service_credentials: customerData.service_credentials,
        access_credentials: customerData.access_credentials
      };
      
      // Use the RPC function for creation
      const { data: createdData, error: rpcError } = await supabase
        .rpc('create_customer_full', { 
          customer_data: cleanedData
        });

      if (rpcError) {
        logger.error('Customer creation failed', rpcError);
        throw errorHandler.handleSupabaseError(rpcError, 'createCustomer');
      }

      const customerId = createdData[0]?.id;
      if (!customerId) {
        throw new Error('Failed to get customer ID from creation response');
      }
      
      // Save credentials if provided
      if (Object.values(credentials).some(c => c != null)) {
        await this.saveCredentials(customerId, credentials);
      }

      // Fetch and return the complete customer record
      const newCustomer = await this.getCustomer(customerId);
      if (!newCustomer) {
        throw new Error('Failed to retrieve created customer');
      }

      logger.info('Customer created successfully', {
        customerId: newCustomer.id,
        companyName: newCustomer.company_name
      });

      return newCustomer;
    }, 'createCustomer');
  }

  /**
   * Update an existing customer
   */
  static async updateCustomer(id: string, updates: Partial<CustomerFormData>): Promise<UnifiedCustomer> {
    return errorHandler.withErrorHandling(async () => {
      logger.info('Updating customer with unified service', {
        customerId: id,
        fieldsToUpdate: Object.keys(updates)
      });
      
      // Prepare data for database
      const cleanedUpdates = prepareCustomerForDatabase(updates);
      
      // Extract credentials if present
      const credentials = {
        system_credentials: updates.system_credentials,
        windows_credentials: updates.windows_credentials,
        service_credentials: updates.service_credentials,
        access_credentials: updates.access_credentials
      };
      
      // Ensure updated_at is set
      cleanedUpdates.updated_at = new Date().toISOString();
      
      // Update main customer data
      const { data, error } = await supabase
        .from('ame_customers')
        .update(cleanedUpdates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        logger.error('Customer update failed', error);
        throw errorHandler.handleSupabaseError(error, 'updateCustomer');
      }
      
      // Update credentials if provided
      if (Object.values(credentials).some(c => c != null)) {
        await this.saveCredentials(id, credentials);
      }
      
      // Return normalized customer data
      const updatedCustomer = this.normalizeCustomerData(data);
      
      logger.info('Customer updated successfully', {
        customerId: id,
        updatedFields: Object.keys(cleanedUpdates).length
      });
      
      return updatedCustomer;
    }, 'updateCustomer', { additionalData: { customerId: id } });
  }

  /**
   * Delete a customer
   */
  static async deleteCustomer(id: string): Promise<void> {
    return errorHandler.withErrorHandling(async () => {
      logger.info('Deleting customer', { customerId: id });
      
      // Delete credentials first (foreign key constraint)
      await supabase
        .from('customer_system_credentials')
        .delete()
        .eq('customer_id', id);
      
      // Delete the customer
      const { error } = await supabase
        .from('ame_customers')
        .delete()
        .eq('id', id);
      
      if (error) throw errorHandler.handleSupabaseError(error, 'deleteCustomer');
      
      logger.info('Customer deleted successfully', { customerId: id });
    }, 'deleteCustomer', { additionalData: { customerId: id } });
  }

  /**
   * Search customers by query
   */
  static async searchCustomers(query: string): Promise<UnifiedCustomer[]> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .or(`company_name.ilike.%${query}%,site_name.ilike.%${query}%,site_nickname.ilike.%${query}%,customer_id.ilike.%${query}%`)
        .order('company_name')
        .limit(20);
      
      if (error) throw errorHandler.handleSupabaseError(error, 'searchCustomers');
      
      return (data || []).map(record => this.normalizeCustomerData(record));
    }, 'searchCustomers');
  }

  /**
   * Get customer with credentials
   */
  static async getCustomerWithCredentials(id: string): Promise<UnifiedCustomer & { credentials?: any }> {
    return errorHandler.withErrorHandling(async () => {
      // Get customer data
      const customer = await this.getCustomer(id);
      if (!customer) throw new Error('Customer not found');
      
      // Get credentials
      const { data: credData } = await supabase
        .from('customer_system_credentials')
        .select('*')
        .eq('customer_id', id);
      
      // Organize credentials by type
      const credentials = {
        bms: credData?.find(c => c.credential_type === 'bms')?.credentials_data,
        windows: credData?.find(c => c.credential_type === 'windows')?.credentials_data,
        services: credData?.find(c => c.credential_type === 'services')?.credentials_data,
        remote_access: credData?.find(c => c.credential_type === 'remote_access')?.credentials_data
      };
      
      return {
        ...customer,
        credentials,
        has_bms_credentials: !!credentials.bms,
        has_windows_credentials: !!credentials.windows,
        has_service_credentials: !!credentials.services,
        has_remote_access_credentials: !!credentials.remote_access
      };
    }, 'getCustomerWithCredentials', { additionalData: { customerId: id } });
  }

  /**
   * Validate customer form data
   */
  static validateCustomerData(data: Partial<CustomerFormData>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    
    // Required fields
    if (!data.customer_id?.trim()) errors.push('Customer ID is required');
    if (!data.company_name?.trim()) errors.push('Company Name is required');
    if (!data.site_name?.trim()) errors.push('Site Name is required');
    if (!data.site_address?.trim()) errors.push('Site Address is required');
    if (!data.primary_contact?.trim()) errors.push('Primary Contact is required');
    if (!data.contact_phone?.trim()) errors.push('Contact Phone is required');
    if (!data.contact_email?.trim()) errors.push('Contact Email is required');
    
    // Email validation
    if (data.contact_email && !this.isValidEmail(data.contact_email)) {
      errors.push('Invalid primary contact email format');
    }
    if (data.secondary_contact_email && !this.isValidEmail(data.secondary_contact_email)) {
      errors.push('Invalid secondary contact email format');
    }
    
    // Phone validation
    if (data.contact_phone && !this.isValidPhone(data.contact_phone)) {
      errors.push('Invalid primary contact phone format');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Private helper methods
   */
  
  private static normalizeCustomerData(record: any): UnifiedCustomer {
    return {
      ...record,
      site_hazards: normalizeSiteHazards(record.site_hazards),
      // Ensure boolean fields are properly typed
      ppe_required: !!record.ppe_required,
      badge_required: !!record.badge_required,
      training_required: !!record.training_required,
      remote_access: !!record.remote_access,
      vpn_required: !!record.vpn_required,
      different_platform_station_creds: !!record.different_platform_station_creds,
      service_address_different: !!record.service_address_different
    };
  }

  private static async saveCredentials(customerId: string, credentials: any): Promise<void> {
    try {
      const { error } = await supabase
        .rpc('save_customer_credentials', {
          p_customer_id: customerId,
          p_bms_credentials: credentials.system_credentials || null,
          p_windows_credentials: credentials.windows_credentials || null,
          p_service_credentials: credentials.service_credentials || null,
          p_access_credentials: credentials.access_credentials || null
        });
      
      if (error) {
        logger.error('Failed to save customer credentials', error);
      } else {
        logger.info('Successfully saved credentials', { customerId });
      }
    } catch (error) {
      logger.error('Credential saving error', error, { customerId });
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private static isValidPhone(phone: string): boolean {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '');
    // Check if it's a valid US phone number (10 digits) or international
    return digits.length >= 10 && digits.length <= 15;
  }

  /**
   * Get customers by service tier
   */
  static async getCustomersByTier(tier: 'CORE' | 'ASSURE' | 'GUARDIAN'): Promise<UnifiedCustomer[]> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .eq('service_tier', tier)
        .order('company_name');
      
      if (error) throw errorHandler.handleSupabaseError(error, 'getCustomersByTier');
      
      return (data || []).map(record => this.normalizeCustomerData(record));
    }, 'getCustomersByTier');
  }

  /**
   * Get customers by contract status
   */
  static async getCustomersByStatus(status: 'Active' | 'Inactive' | 'Pending' | 'Expired'): Promise<UnifiedCustomer[]> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .eq('contract_status', status)
        .order('company_name');
      
      if (error) throw errorHandler.handleSupabaseError(error, 'getCustomersByStatus');
      
      return (data || []).map(record => this.normalizeCustomerData(record));
    }, 'getCustomersByStatus');
  }

  /**
   * Get customer's visit history
   */
  static async getCustomerVisits(customerId: string): Promise<any[]> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('ame_visits')
        .select('*')
        .eq('customer_id', customerId)
        .order('visit_date', { ascending: false });
      
      if (error) throw errorHandler.handleSupabaseError(error, 'getCustomerVisits');
      
      return data || [];
    }, 'getCustomerVisits');
  }
}
