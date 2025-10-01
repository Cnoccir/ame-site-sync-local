import { supabase } from '@/integrations/supabase/client';
import { logger } from '../utils/logger';
import { AMECustomerService, AMECustomer } from './ameCustomerService';
import { PMWorkflowPersistenceService } from './pmWorkflowPersistenceService';

/**
 * Unified Customer Data Service
 *
 * This service ensures that customer data remains synchronized across all components:
 * - PM Workflow phases
 * - AME Customers table
 * - PM Workflow Sessions
 * - External integrations (SimPro, etc.)
 */
export class UnifiedCustomerDataService {
  private static syncListeners: ((customer: AMECustomer) => void)[] = [];
  private static currentCustomer: AMECustomer | null = null;
  private static currentSessionId: string | null = null;

  /**
   * Initialize a new PM workflow session with customer data
   */
  static async initializePMSession(
    serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN',
    initialCustomerData?: Partial<AMECustomer>
  ): Promise<{
    sessionId: string;
    customerId?: string;
    workflowData: any;
  }> {
    try {
      logger.info('Initializing new PM workflow session', { serviceTier });

      let customer: AMECustomer | null = null;
      let workflowData: any = {
        session: { serviceTier },
        phase1: {
          customer: initialCustomerData || {},
          contacts: [],
          access: {},
          safety: { requiredPPE: [], knownHazards: [] }
        },
        phase2: {
          bmsSystem: {},
          tridiumExports: {},
          manualInventory: {
            totalDeviceCount: 0,
            controllerTypes: [],
            majorEquipment: [],
            networkSegments: [],
            notes: ''
          },
          photos: []
        },
        phase3: {
          customerPriorities: { primaryConcerns: [] },
          tasks: [],
          issues: [],
          recommendations: [],
          serviceMetrics: {}
        },
        phase4: {
          serviceSummary: { executiveSummary: '', keyFindings: [] },
          reportConfig: {},
          deliveryInfo: {}
        }
      };

      // Get current user for technician_id (required field)
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData.user?.id;

      let technicianId: string | null = null;

      if (!currentUserId) {
        // Demo mode: allow no-auth if enabled via env
        const demoNoAuth = (import.meta as any).env?.VITE_DEMO_NO_AUTH === 'true';
        if (!demoNoAuth) {
          throw new Error('User not authenticated');
        }
        // Try to resolve a default technician for demo
        // Prefer tech@ame-inc.com if present, else first technician
        const { data: techByEmail } = await supabase
          .from('ame_employees')
          .select('id')
          .eq('email', 'tech@ame-inc.com')
          .limit(1);
        if (techByEmail && techByEmail.length > 0) {
          technicianId = techByEmail[0].id as string;
        } else {
          const { data: anyTech } = await supabase
            .from('ame_employees')
            .select('id')
            .limit(1);
          if (anyTech && anyTech.length > 0) {
            technicianId = anyTech[0].id as string;
          }
        }
        if (!technicianId) {
          throw new Error('No technician available for demo');
        }
      } else {
        // Find the technician record for current user
        const { data: technicianData } = await supabase
          .from('ame_employees')
          .select('id')
          .eq('user_id', currentUserId)
          .single();

        if (!technicianData) {
          throw new Error('Current user not found in employee directory');
        }
        technicianId = technicianData.id as string;
      }

      let customerId = null;

      // If we have a customer ID, load existing customer data and associate with session
      if (initialCustomerData?.id) {
        customer = await AMECustomerService.getCustomerById(initialCustomerData.id);
        if (customer) {
          workflowData = AMECustomerService.mapToPMWorkflowFormat(customer);
          workflowData.session = { serviceTier };
          customerId = customer.id;
        }
      }

      // Create PM session (can be blank initially, customer associated later)
      const session = await PMWorkflowPersistenceService.createSession({
        session_name: customer
          ? `${customer.company_name} - ${new Date().toLocaleDateString()}`
          : `New Session - ${new Date().toLocaleDateString()}`,
        service_tier: serviceTier,
        session_type: 'Preventive Maintenance',
        customer_id: customerId, // Can be null for blank sessions
        technician_id: technicianId, // Use ame_employees ID, not auth user ID
        secondary_technician_id: customer?.secondary_technician_id
      });

      this.currentSessionId = session.id;
      this.currentCustomer = customer;

      logger.info('PM workflow session initialized', {
        sessionId: session.id,
        customerId: customer?.id
      });

      return {
        sessionId: session.id,
        customerId: customer?.id,
        workflowData
      };
    } catch (error) {
      logger.error('Failed to initialize PM session:', error);
      throw error;
    }
  }

  /**
   * Update customer data and sync across all systems
   */
  static async updateCustomerData(
    customerData: Partial<AMECustomer>,
    sessionId?: string
  ): Promise<AMECustomer> {
    try {
      logger.info('Updating customer data with sync', {
        companyName: customerData.company_name,
        sessionId: sessionId || this.currentSessionId
      });

      let customer: AMECustomer;

      // Create or update customer in ame_customers table
      if (customerData.id) {
        customer = await AMECustomerService.updateCustomer(customerData.id, customerData);
      } else if (this.currentCustomer?.id) {
        customer = await AMECustomerService.updateCustomer(this.currentCustomer.id, customerData);
      } else {
        // Create new customer
        const createData = {
          customer_id: customerData.customer_id || `AME-${Date.now()}`,
          company_name: customerData.company_name || 'New Customer',
          site_name: customerData.site_name || customerData.company_name || 'Main Site',
          site_address: customerData.site_address || '',
          service_tier: customerData.service_tier || 'CORE',
          system_type: customerData.system_type || 'Unknown',
          primary_contact: customerData.primary_contact || '',
          contact_phone: customerData.contact_phone || '',
          contact_email: customerData.contact_email || '',
          ...customerData
        };
        customer = await AMECustomerService.createCustomer(createData);
      }

      // Update current session with customer reference
      const targetSessionId = sessionId || this.currentSessionId;
      if (targetSessionId) {
        await PMWorkflowPersistenceService.updateSession(targetSessionId, {
          customer_id: customer.id,
          customer_data: customer
        });
      }

      // Update current state
      this.currentCustomer = customer;

      // Also upsert normalized customer_team table if team fields are present
      try {
        const hasTeamFields = (
          customer.primary_technician_id || customer.secondary_technician_id ||
          customer.account_manager_id || customer.account_manager_name ||
          customer.account_manager_email || customer.account_manager_phone
        );
        if (hasTeamFields) {
          await supabase.from('customer_team').upsert({
            customer_id: customer.id,
            primary_technician_id: customer.primary_technician_id || null,
            primary_technician_name: customer.primary_technician_name || null,
            primary_technician_phone: customer.primary_technician_phone || null,
            primary_technician_email: customer.primary_technician_email || null,
            secondary_technician_id: customer.secondary_technician_id || null,
            secondary_technician_name: customer.secondary_technician_name || null,
            secondary_technician_phone: customer.secondary_technician_phone || null,
            secondary_technician_email: customer.secondary_technician_email || null,
            account_manager_id: customer.account_manager_id || null,
            account_manager_name: customer.account_manager_name || customer.account_manager || null,
            account_manager_phone: customer.account_manager_phone || null,
            account_manager_email: customer.account_manager_email || null,
          });
        }
      } catch (e) {
        logger.error('Failed to upsert customer_team (normalized) - non-blocking', e);
      }

      // Notify all listeners
      this.notifyListeners(customer);

      logger.info('Customer data updated and synced successfully', {
        customerId: customer.id,
        sessionId: targetSessionId
      });

      return customer;
    } catch (error) {
      logger.error('Failed to update customer data:', error);
      throw error;
    }
  }

  /**
   * Update PM workflow phase data and sync with customer
   */
  static async updatePhaseData(
    phase: number,
    phaseData: any,
    sessionId?: string
  ): Promise<void> {
    try {
      const targetSessionId = sessionId || this.currentSessionId;
      if (!targetSessionId) {
        throw new Error('No active session found');
      }

      logger.info('Updating phase data with sync', { phase, sessionId: targetSessionId });

      // Update phase data in session
      await PMWorkflowPersistenceService.updatePhaseData(targetSessionId, phase, phaseData);

      // If this is phase 1 (customer data), sync with ame_customers table and persist normalized snapshot
      if (phase === 1 && phaseData.customer) {
        const customerData = phaseData.customer;

        // Build comprehensive customer update
        const customerUpdate: Partial<AMECustomer> = {
          company_name: customerData.companyName,
          site_name: customerData.siteName,
          site_nickname: customerData.siteNickname,
          site_address: customerData.address,
          service_tier: customerData.serviceTier,
          contract_number: customerData.contractNumber,
          account_manager: customerData.accountManager,
          account_manager_id: customerData.accountManagerId,
          account_manager_name: customerData.accountManager,
          account_manager_phone: customerData.accountManagerPhone,
          account_manager_email: customerData.accountManagerEmail,
          primary_technician_id: customerData.primaryTechnicianId,
          primary_technician_name: customerData.primaryTechnicianName,
          primary_technician_phone: customerData.primaryTechnicianPhone,
          primary_technician_email: customerData.primaryTechnicianEmail,
          secondary_technician_id: customerData.secondaryTechnicianId,
          secondary_technician_name: customerData.secondaryTechnicianName,
          secondary_technician_phone: customerData.secondaryTechnicianPhone,
          secondary_technician_email: customerData.secondaryTechnicianEmail,
          legacy_customer_id: customerData.legacyCustomerId,
          simpro_customer_id: customerData.simproCustomerId,
          drive_folder_id: customerData.driveFolderId,
          drive_folder_url: customerData.driveFolderUrl,
        };

        // Add contact information
        if (phaseData.contacts?.length > 0) {
          const primaryContact = phaseData.contacts[0];
          customerUpdate.primary_contact = primaryContact.name;
          customerUpdate.contact_phone = primaryContact.phone;
          customerUpdate.contact_email = primaryContact.email;
          customerUpdate.primary_contact_role = primaryContact.role;

          const secondaryContact = phaseData.contacts[1];
          if (secondaryContact) {
            customerUpdate.secondary_contact_name = secondaryContact.name;
            customerUpdate.secondary_contact_phone = secondaryContact.phone;
            customerUpdate.secondary_contact_email = secondaryContact.email;
            customerUpdate.secondary_contact_role = secondaryContact.role;
          }
        }

        // Add access information
        if (phaseData.access) {
          customerUpdate.access_method = phaseData.access.method;
          customerUpdate.parking_instructions = phaseData.access.parkingInstructions;
          customerUpdate.best_arrival_time = phaseData.access.bestArrivalTime;
          customerUpdate.badge_required = phaseData.access.badgeRequired;
          customerUpdate.escort_required = phaseData.access.escortRequired;
          customerUpdate.special_instructions = phaseData.access.specialInstructions;
        }

        // Add safety information
        if (phaseData.safety) {
          customerUpdate.required_ppe = phaseData.safety.requiredPPE;
          customerUpdate.known_hazards = phaseData.safety.knownHazards;
          customerUpdate.safety_contact_name = phaseData.safety.safetyContact;
          customerUpdate.safety_contact_phone = phaseData.safety.safetyPhone;
          customerUpdate.safety_notes = phaseData.safety.specialNotes;
        }

        await this.updateCustomerData(customerUpdate, targetSessionId);

        try {
          const { PMPhase1PersistenceService } = await import('./pmPhase1PersistenceService');
          await PMPhase1PersistenceService.upsert(targetSessionId, phaseData);
        } catch (e) {
          logger.error('Phase 1 normalized persistence failed', e);
        }
      }

      logger.info('Phase data updated and synced successfully', { phase, sessionId: targetSessionId });
    } catch (error) {
      logger.error('Failed to update phase data:', error);
      throw error;
    }
  }

  /**
   * Load existing PM session and sync customer data
   */
  static async loadSession(sessionId: string): Promise<{
    session: any;
    customer: AMECustomer | null;
    workflowData: any;
  }> {
    try {
      logger.info('Loading PM session with sync', { sessionId });

      const session = await PMWorkflowPersistenceService.getSession(sessionId);
      if (!session) {
        throw new Error('Session not found');
      }

      let customer: AMECustomer | null = null;
      if (session.customer_id) {
        customer = await AMECustomerService.getCustomerById(session.customer_id);
      }

      // Build workflow data from session
      const workflowData = {
        session: { serviceTier: session.service_tier },
        phase1: session.phase_1_data || {
          customer: customer ? AMECustomerService.mapToPMWorkflowFormat(customer).phase1.customer : {},
          contacts: customer ? AMECustomerService.mapToPMWorkflowFormat(customer).phase1.contacts : [],
          access: customer ? AMECustomerService.mapToPMWorkflowFormat(customer).phase1.access : {},
          safety: customer ? AMECustomerService.mapToPMWorkflowFormat(customer).phase1.safety : { requiredPPE: [], knownHazards: [] }
        },
        phase2: session.phase_2_data || {
          bmsSystem: {},
          tridiumExports: {},
          manualInventory: {
            totalDeviceCount: 0,
            controllerTypes: [],
            majorEquipment: [],
            networkSegments: [],
            notes: ''
          },
          photos: []
        },
        phase3: session.phase_3_data || {
          customerPriorities: { primaryConcerns: [] },
          tasks: [],
          issues: [],
          recommendations: [],
          serviceMetrics: {}
        },
        phase4: session.phase_4_data || {
          serviceSummary: { executiveSummary: '', keyFindings: [] },
          reportConfig: {},
          deliveryInfo: {}
        }
      };

      this.currentSessionId = sessionId;
      this.currentCustomer = customer;

      if (customer) {
        this.notifyListeners(customer);
      }

      logger.info('Session loaded and synced successfully', { sessionId, customerId: customer?.id });

      return { session, customer, workflowData };
    } catch (error) {
      logger.error('Failed to load session:', error);
      throw error;
    }
  }

  /**
   * Subscribe to customer data changes
   */
  static subscribe(listener: (customer: AMECustomer) => void): () => void {
    this.syncListeners.push(listener);

    // Return unsubscribe function
    return () => {
      const index = this.syncListeners.indexOf(listener);
      if (index > -1) {
        this.syncListeners.splice(index, 1);
      }
    };
  }

  /**
   * Get current customer data
   */
  static getCurrentCustomer(): AMECustomer | null {
    return this.currentCustomer;
  }

  /**
   * Get current session ID
   */
  static getCurrentSessionId(): string | null {
    return this.currentSessionId;
  }

  /**
   * Clear current session state
   */
  static clearSession(): void {
    this.currentSessionId = null;
    this.currentCustomer = null;
    logger.info('Session state cleared');
  }

  /**
   * Notify all listeners of customer data changes
   */
  private static notifyListeners(customer: AMECustomer): void {
    this.syncListeners.forEach(listener => {
      try {
        listener(customer);
      } catch (error) {
        logger.error('Error in sync listener:', error);
      }
    });
  }

  /**
   * Associate a customer with an existing PM session
   */
  static async associateCustomerWithSession(
    sessionId: string,
    customerData: Partial<AMECustomer>
  ): Promise<AMECustomer> {
    try {
      logger.info('Associating customer with PM session', { sessionId });

      // Create or update customer
      let customer: AMECustomer;
      if (customerData.id) {
        customer = await AMECustomerService.updateCustomer(customerData.id, customerData);
      } else {
        const createData = {
          customer_id: customerData.customer_id || `AME-${Date.now()}`,
          company_name: customerData.company_name || 'New Customer',
          site_name: customerData.site_name || customerData.company_name || 'Main Site',
          site_address: customerData.site_address || '',
          service_tier: customerData.service_tier || 'CORE',
          system_type: customerData.system_type || 'Unknown',
          primary_contact: customerData.primary_contact || '',
          contact_phone: customerData.contact_phone || '',
          contact_email: customerData.contact_email || '',
          ...customerData
        };
        customer = await AMECustomerService.createCustomer(createData);
      }

      // Update the session with customer association
      await PMWorkflowPersistenceService.updateSession(sessionId, {
        customer_id: customer.id,
        customer_data: customer
      });

      // Update current state
      this.currentCustomer = customer;
      this.notifyListeners(customer);

      logger.info('Customer associated with session successfully', {
        sessionId,
        customerId: customer.id
      });

      return customer;
    } catch (error) {
      logger.error('Failed to associate customer with session:', error);
      throw error;
    }
  }

  /**
   * Import customer from SimPro and create PM session
   */
  static async importFromSimProAndStartSession(
    simproCustomerId: number,
    serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN'
  ): Promise<{
    sessionId: string;
    customerId: string;
    workflowData: any;
  }> {
    try {
      logger.info('Importing from SimPro and starting session', { simproCustomerId, serviceTier });

      // Check if customer already exists
      const existingCustomers = await supabase
        .from('ame_customers')
        .select('*')
        .eq('simpro_customer_id', simproCustomerId);

      let customer: AMECustomer;

      if (existingCustomers.data && existingCustomers.data.length > 0) {
        // Use existing customer
        customer = existingCustomers.data[0];
        logger.info('Using existing customer from SimPro import', { customerId: customer.id });
      } else {
        // Customer doesn't exist - this would require the SimPro data to be passed in
        // For now, create a placeholder
        customer = await AMECustomerService.createCustomer({
          customer_id: `SIMPRO-${simproCustomerId}`,
          company_name: 'SimPro Import',
          site_name: 'Main Site',
          site_address: '',
          service_tier: serviceTier,
          system_type: 'Unknown',
          primary_contact: '',
          contact_phone: '',
          contact_email: '',
          simpro_customer_id: simproCustomerId
        });
      }

      // Start PM session
      const result = await this.initializePMSession(serviceTier, customer);

      logger.info('SimPro import and session start completed', {
        sessionId: result.sessionId,
        customerId: customer.id
      });

      return {
        sessionId: result.sessionId,
        customerId: customer.id,
        workflowData: result.workflowData
      };
    } catch (error) {
      logger.error('Failed to import from SimPro and start session:', error);
      throw error;
    }
  }
}