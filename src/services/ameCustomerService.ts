import { supabase } from '@/integrations/supabase/client';
import { logger } from '../utils/logger';

export interface AMECustomer {
  id: string;
  customer_id: string;
  company_name: string;
  site_name: string;
  site_nickname?: string;
  site_address: string;
  service_tier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  system_type: string;
  contract_status?: string;
  building_type?: string;

  // Contact information
  primary_contact: string;
  contact_phone: string;
  contact_email: string;
  primary_contact_role?: string;

  secondary_contact_name?: string;
  secondary_contact_phone?: string;
  secondary_contact_email?: string;
  secondary_contact_role?: string;

  // Site access information
  access_method?: string;
  access_procedure?: string;
  parking_instructions?: string;
  equipment_access_notes?: string;
  best_arrival_time?: string;
  badge_required?: boolean;
  escort_required?: boolean;
  special_instructions?: string;

  // Safety information
  required_ppe?: string[];
  known_hazards?: string[];
  safety_contact_name?: string;
  safety_contact_phone?: string;
  safety_notes?: string;
  site_hazards?: string;
  other_hazards_notes?: string;

  // Technician assignments
  primary_technician_id?: string;
  primary_technician_name?: string;
  primary_technician_phone?: string;
  primary_technician_email?: string;
  secondary_technician_id?: string;
  secondary_technician_name?: string;
  secondary_technician_phone?: string;
  secondary_technician_email?: string;

  // Account management
  account_manager?: string;
  account_manager_id?: string;
  account_manager_name?: string;
  account_manager_phone?: string;
  account_manager_email?: string;

  // Contract information
  contract_number?: string;
  contract_value?: number;

  // System information
  system_family?: string;
  system_architecture?: string;
  primary_bas_platform?: string;
  bms_platform?: string;

  // External references
  legacy_customer_id?: number;
  simpro_customer_id?: number;
  drive_folder_id?: string;
  drive_folder_url?: string;

  // Metadata
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AMECustomerSearchResult extends AMECustomer {
  similarity_score?: number;
}

export interface CreateAMECustomerData extends Omit<AMECustomer, 'id' | 'created_at' | 'updated_at' | 'created_by' | 'updated_by'> {}

export interface UpdateAMECustomerData extends Partial<CreateAMECustomerData> {}

export class AMECustomerService {
  /**
   * Create a new AME customer
   */
  static async createCustomer(customerData: CreateAMECustomerData): Promise<AMECustomer> {
    try {
      logger.info('Creating new AME customer', { companyName: customerData.company_name });

      const { data, error } = await supabase
        .from('ame_customers')
        .insert({
          ...customerData,
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating AME customer:', error);
        throw error;
      }

      logger.info('AME customer created successfully', { id: data.id });
      return data;
    } catch (error) {
      logger.error('Failed to create AME customer:', error);
      throw error;
    }
  }

  /**
   * Update an existing AME customer
   */
  static async updateCustomer(id: string, updates: UpdateAMECustomerData): Promise<AMECustomer> {
    try {
      logger.info('Updating AME customer', { id, updates });

      const { data, error } = await supabase
        .from('ame_customers')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Error updating AME customer:', error);
        throw error;
      }

      logger.info('AME customer updated successfully', { id });
      return data;
    } catch (error) {
      logger.error('Failed to update AME customer:', error);
      throw error;
    }
  }

  /**
   * Get AME customer by ID
   */
  static async getCustomerById(id: string): Promise<AMECustomer | null> {
    try {
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Customer not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to fetch AME customer by ID:', error);
      throw error;
    }
  }

  /**
   * Get AME customer by customer_id
   */
  static async getCustomerByCustomerId(customerId: string): Promise<AMECustomer | null> {
    try {
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .eq('customer_id', customerId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Customer not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to fetch AME customer by customer ID:', error);
      throw error;
    }
  }

  /**
   * Search AME customers by company name or site name
   */
  static async searchCustomers(query: string): Promise<AMECustomerSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      logger.info('Searching AME customers', { query });

      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .or(`company_name.ilike.%${query}%, site_name.ilike.%${query}%, site_nickname.ilike.%${query}%`)
        .order('company_name')
        .limit(10);

      if (error) {
        logger.error('Error searching AME customers:', error);
        throw error;
      }

      return (data || []).map(customer => ({
        ...customer,
        similarity_score: this.calculateSimilarity(query, customer)
      }));
    } catch (error) {
      logger.error('Failed to search AME customers:', error);
      throw error;
    }
  }

  /**
   * Get all AME customers for current user
   */
  static async getAllCustomers(): Promise<AMECustomer[]> {
    try {
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .order('company_name');

      if (error) {
        logger.error('Error fetching all AME customers:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to fetch all AME customers:', error);
      throw error;
    }
  }

  /**
   * Delete AME customer
   */
  static async deleteCustomer(id: string): Promise<void> {
    try {
      logger.info('Deleting AME customer', { id });

      const { error } = await supabase
        .from('ame_customers')
        .delete()
        .eq('id', id);

      if (error) {
        logger.error('Error deleting AME customer:', error);
        throw error;
      }

      logger.info('AME customer deleted successfully', { id });
    } catch (error) {
      logger.error('Failed to delete AME customer:', error);
      throw error;
    }
  }

  /**
   * Create or update customer from PM workflow data
   */
  static async upsertFromPMWorkflow(workflowData: any): Promise<AMECustomer> {
    try {
      const { phase1 } = workflowData;
      const customerData = phase1.customer;
      const contacts = phase1.contacts || [];
      const access = phase1.access || {};
      const safety = phase1.safety || {};

      // Check if customer already exists by customer_id
      let existingCustomer = null;
      if (customerData.customerId) {
        existingCustomer = await this.getCustomerByCustomerId(customerData.customerId);
      }

      const ameCustomerData: CreateAMECustomerData = {
        customer_id: customerData.customerId || `AME-${Date.now()}`,
        company_name: customerData.companyName,
        site_name: customerData.siteName,
        site_nickname: customerData.siteNickname,
        site_address: customerData.address,
        service_tier: customerData.serviceTier,
        system_type: workflowData.phase2?.bmsSystem?.platform || 'Unknown',
        contract_status: 'Active',
        building_type: '',

        // Primary contact
        primary_contact: contacts[0]?.name || '',
        contact_phone: contacts[0]?.phone || '',
        contact_email: contacts[0]?.email || '',
        primary_contact_role: contacts[0]?.role || '',

        // Secondary contact
        secondary_contact_name: contacts[1]?.name || '',
        secondary_contact_phone: contacts[1]?.phone || '',
        secondary_contact_email: contacts[1]?.email || '',
        secondary_contact_role: contacts[1]?.role || '',

        // Access information
        access_method: access.method,
        access_procedure: access.specialInstructions,
        parking_instructions: access.parkingInstructions,
        best_arrival_time: access.bestArrivalTime,
        badge_required: access.badgeRequired,
        escort_required: access.escortRequired,
        special_instructions: access.specialInstructions,

        // Safety information
        required_ppe: safety.requiredPPE || [],
        known_hazards: safety.knownHazards || [],
        safety_contact_name: safety.safetyContact,
        safety_contact_phone: safety.safetyPhone,
        safety_notes: safety.specialNotes,

        // Technician assignments
        primary_technician_id: customerData.primaryTechnicianId,
        primary_technician_name: customerData.primaryTechnicianName,
        primary_technician_phone: customerData.primaryTechnicianPhone,
        primary_technician_email: customerData.primaryTechnicianEmail,
        secondary_technician_id: customerData.secondaryTechnicianId,
        secondary_technician_name: customerData.secondaryTechnicianName,
        secondary_technician_phone: customerData.secondaryTechnicianPhone,
        secondary_technician_email: customerData.secondaryTechnicianEmail,

        // Account management
        account_manager: customerData.accountManager,
        account_manager_id: customerData.accountManagerId,
        account_manager_name: customerData.accountManager,
        account_manager_phone: customerData.accountManagerPhone,
        account_manager_email: customerData.accountManagerEmail,

        // Contract information
        contract_number: customerData.contractNumber,

        // System information
        system_architecture: workflowData.phase2?.tridiumExports?.systemArchitecture,
        primary_bas_platform: workflowData.phase2?.bmsSystem?.platform,
        bms_platform: workflowData.phase2?.bmsSystem?.platform,

        // External references
        legacy_customer_id: customerData.legacyCustomerId,
        simpro_customer_id: customerData.simproCustomerId,
        drive_folder_id: customerData.driveFolderId,
        drive_folder_url: customerData.driveFolderUrl,
      };

      if (existingCustomer) {
        return await this.updateCustomer(existingCustomer.id, ameCustomerData);
      } else {
        return await this.createCustomer(ameCustomerData);
      }
    } catch (error) {
      logger.error('Failed to upsert customer from PM workflow:', error);
      throw error;
    }
  }

  /**
   * Calculate similarity score for search results
   */
  private static calculateSimilarity(query: string, customer: Partial<AMECustomer>): number {
    const searchTerm = query.toLowerCase();
    let score = 0;

    const fields = [
      customer.company_name,
      customer.site_name,
      customer.site_nickname,
    ];

    for (const field of fields) {
      if (field) {
        const fieldLower = field.toLowerCase();
        if (fieldLower === searchTerm) {
          score += 1.0;
        } else if (fieldLower.startsWith(searchTerm)) {
          score += 0.8;
        } else if (fieldLower.includes(searchTerm)) {
          score += 0.6;
        }
      }
    }

    return Math.min(score, 1.0);
  }

  /**
   * Map AME customer data to PM workflow format
   */
  static mapToPMWorkflowFormat(customer: AMECustomer): any {
    return {
      phase1: {
        customer: {
          customerId: customer.customer_id,
          companyName: customer.company_name,
          siteName: customer.site_name,
          siteNickname: customer.site_nickname,
          address: customer.site_address,
          serviceTier: customer.service_tier,
          contractNumber: customer.contract_number,
          accountManager: customer.account_manager,
          accountManagerId: customer.account_manager_id,
          accountManagerPhone: customer.account_manager_phone,
          accountManagerEmail: customer.account_manager_email,
          primaryTechnicianId: customer.primary_technician_id,
          primaryTechnicianName: customer.primary_technician_name,
          primaryTechnicianPhone: customer.primary_technician_phone,
          primaryTechnicianEmail: customer.primary_technician_email,
          secondaryTechnicianId: customer.secondary_technician_id,
          secondaryTechnicianName: customer.secondary_technician_name,
          secondaryTechnicianPhone: customer.secondary_technician_phone,
          secondaryTechnicianEmail: customer.secondary_technician_email,
          legacyCustomerId: customer.legacy_customer_id,
          simproCustomerId: customer.simpro_customer_id,
          driveFolderId: customer.drive_folder_id,
          driveFolderUrl: customer.drive_folder_url,
        },
        contacts: [
          {
            id: 'primary',
            name: customer.primary_contact,
            phone: customer.contact_phone,
            email: customer.contact_email,
            role: customer.primary_contact_role,
            isPrimary: true,
            isEmergency: false
          },
          ...(customer.secondary_contact_name ? [{
            id: 'secondary',
            name: customer.secondary_contact_name,
            phone: customer.secondary_contact_phone,
            email: customer.secondary_contact_email,
            role: customer.secondary_contact_role,
            isPrimary: false,
            isEmergency: false
          }] : [])
        ],
        access: {
          method: customer.access_method,
          parkingInstructions: customer.parking_instructions,
          bestArrivalTime: customer.best_arrival_time,
          badgeRequired: customer.badge_required,
          escortRequired: customer.escort_required,
          specialInstructions: customer.special_instructions
        },
        safety: {
          requiredPPE: customer.required_ppe || [],
          knownHazards: customer.known_hazards || [],
          safetyContact: customer.safety_contact_name,
          safetyPhone: customer.safety_contact_phone,
          specialNotes: customer.safety_notes
        }
      }
    };
  }
}