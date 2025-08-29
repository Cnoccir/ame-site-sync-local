import { supabase } from '@/integrations/supabase/client';
import { Customer, Visit, Task, VisitTask, Tool, SOP, Report } from '@/types';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/errorHandler';
import { getCurrentISODate, getCurrentDateString, generateVisitExpiration } from '@/utils/dateHelpers';
import { generateUUID, generateSessionToken } from '@/utils/idGenerators';
import { VISIT_STATUS, PHASE_STATUS } from '@/utils/constants';
import { filterContentByTier } from '@/types/serviceTiers';
import { SiteIntelligenceService } from './siteIntelligenceService';

/**
 * Service for AME maintenance system database operations
 */
export class AMEService {
  
  // Customer operations
  static async getAllCustomers(): Promise<Customer[]> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .order('company_name');
      
      if (error) throw errorHandler.handleSupabaseError(error, 'getAllCustomers');
      
      // Transform database records to frontend Customer type
      return (data || []).map(record => ({
        ...record,
        site_hazards: Array.isArray(record.site_hazards) 
          ? record.site_hazards 
          : record.site_hazards 
            ? [record.site_hazards] 
            : []
      })) as Customer[];
    }, 'getAllCustomers');
  }

  static async getCustomers(): Promise<Customer[]> {
    return errorHandler.withErrorHandling(async () => {
      // Use comprehensive view that includes credential information
      const { data, error } = await supabase
        .from('customer_management_view')
        .select('*')
        .order('company_name');
      
      if (error) {
        logger.warn('Failed to fetch from comprehensive view, falling back to basic table', error);
        // Fallback to basic table
        const { data: basicData, error: basicError } = await supabase
          .from('ame_customers')
          .select('*')
          .order('company_name');
        
        if (basicError) throw errorHandler.handleSupabaseError(basicError, 'getCustomers');
        
        return (basicData || []).map(record => ({
          ...record,
          site_hazards: Array.isArray(record.site_hazards) 
            ? record.site_hazards 
            : record.site_hazards 
              ? [record.site_hazards] 
              : []
        })) as Customer[];
      }
      
      // Transform comprehensive view records to frontend Customer type
      const customers = (data || []).map(record => ({
        ...record,
        site_hazards: Array.isArray(record.site_hazards) 
          ? record.site_hazards 
          : record.site_hazards 
            ? [record.site_hazards] 
            : []
      })) as Customer[];
      
      // Populate technician names for customers with assigned technicians (if not already populated)
      const customersWithTechNames = await Promise.all(
        customers.map(async (customer) => {
          // Check if technician names are already populated from the view
          if (!customer.primary_technician_name && !customer.secondary_technician_name) {
            if (customer.primary_technician_id || customer.secondary_technician_id) {
              const techNames = await SiteIntelligenceService.getTechnicianNames(
                customer.primary_technician_id,
                customer.secondary_technician_id
              );
              return {
                ...customer,
                primary_technician_name: techNames.primary,
                secondary_technician_name: techNames.secondary
              };
            }
          }
          return customer;
        })
      );
      
      logger.debug('Retrieved customers with enhanced data', {
        customerCount: customersWithTechNames.length,
        withCredentials: customersWithTechNames.filter(c => c.has_bms_credentials || c.has_windows_credentials).length
      });
      
      return customersWithTechNames;
    }, 'getCustomers');
  }
  
  static async getCustomer(id: string): Promise<Customer | null> {
    return errorHandler.withErrorHandling(async () => {
      // Try to get customer from comprehensive view first (includes credentials)
      const { data: customerData, error } = await supabase
        .from('customer_management_view')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        // Fallback to basic table if view fails
        logger.warn('Failed to fetch from comprehensive view, using basic table', error);
        const { data: basicData, error: basicError } = await supabase
          .from('ame_customers')
          .select('*')
          .eq('id', id)
          .single();
        
        if (basicError) throw errorHandler.handleSupabaseError(basicError, 'getCustomer');
        
        return {
          ...basicData,
          site_hazards: Array.isArray(basicData.site_hazards) 
            ? basicData.site_hazards 
            : basicData.site_hazards 
              ? [basicData.site_hazards] 
              : []
        } as Customer;
      }
      
      // Transform comprehensive view data to frontend Customer type
      const customer = {
        ...customerData,
        site_hazards: Array.isArray(customerData.site_hazards) 
          ? customerData.site_hazards 
          : customerData.site_hazards 
            ? [customerData.site_hazards] 
            : []
      } as Customer;
      
      logger.debug('Retrieved customer with enhanced data', {
        customerId: id,
        hasCredentials: customerData.has_bms_credentials || customerData.has_windows_credentials
      });
      
      return customer;
    }, 'getCustomer', { additionalData: { customerId: id } });
  }
  
  static async createCustomer(customerData: any): Promise<Customer> {
    return errorHandler.withErrorHandling(async () => {
      logger.info('Creating customer with enhanced credential system', {
        hasCredentials: !!(customerData.system_credentials || customerData.access_credentials),
        fieldsProvided: Object.keys(customerData || {})
      });
      
      // Extract credentials from customer data if present
      const credentials = {
        system_credentials: customerData.system_credentials,
        windows_credentials: customerData.windows_credentials,
        service_credentials: customerData.service_credentials,
        access_credentials: customerData.access_credentials
      };
      
      // Create customer data without credentials for main table insert
      const customerDataClean = { ...customerData };
      delete customerDataClean.system_credentials;
      delete customerDataClean.windows_credentials;
      delete customerDataClean.service_credentials;
      delete customerDataClean.access_credentials;
      
      // Use the enhanced create function that handles both customer data and credentials
      const { data: createdCustomerData, error: rpcError } = await supabase
        .rpc('create_customer_full', { 
          customer_data: customerDataClean
        });

      if (rpcError) {
        logger.error('Enhanced customer creation failed', rpcError, {
          customerData: Object.keys(customerDataClean),
          hasCredentials: Object.values(credentials).some(c => c != null)
        });
        throw errorHandler.handleSupabaseError(rpcError, 'createCustomer');
      }

      const customerId = createdCustomerData[0]?.id;
      if (!customerId) {
        throw new Error('Failed to get customer ID from creation response');
      }
      
      // Save credentials using the new enhanced credential system
      if (Object.values(credentials).some(c => c != null && c !== undefined)) {
        logger.info('Saving enhanced credentials for new customer', {
          customerId,
          credentialTypes: Object.keys(credentials).filter(k => credentials[k] != null)
        });
        
        try {
          const { error: credError } = await supabase
            .rpc('save_customer_credentials', {
              p_customer_id: customerId,
              p_bms_credentials: credentials.system_credentials || null,
              p_windows_credentials: credentials.windows_credentials || null,
              p_service_credentials: credentials.service_credentials || null,
              p_access_credentials: credentials.access_credentials || null
            });
          
          if (credError) {
            logger.error('Failed to save customer credentials', credError);
            // Don't fail the entire operation, but log the issue
          } else {
            logger.info('Successfully saved enhanced credentials', { customerId });
          }
        } catch (credError) {
          logger.error('Credential saving error', credError, { customerId });
        }
      }

      // Fetch the complete customer record using the comprehensive view
      const { data: finalCustomer, error: fetchError } = await supabase
        .from('customer_management_view')
        .select('*')
        .eq('id', customerId)
        .single();

      if (fetchError) {
        logger.warn('Failed to fetch from comprehensive view, falling back to basic table', fetchError);
        // Fallback to basic table
        const { data: basicCustomer } = await supabase
          .from('ame_customers')
          .select('*')
          .eq('id', customerId)
          .single();
        return basicCustomer as Customer;
      }

      logger.info('Customer created successfully with enhanced schema', {
        customerId: finalCustomer.id,
        companyName: finalCustomer.company_name,
        hasCredentials: finalCustomer.has_bms_credentials || finalCustomer.has_windows_credentials || finalCustomer.has_service_credentials || finalCustomer.has_remote_access_credentials
      });

      return finalCustomer as Customer;
    }, 'createCustomer');
  }
  
  static async updateCustomer(id: string, updates: any): Promise<Customer> {
    return errorHandler.withErrorHandling(async () => {
      // Extract credentials from updates if present
      const credentials = {
        system_credentials: updates.system_credentials,
        windows_credentials: updates.windows_credentials,
        service_credentials: updates.service_credentials,
        access_credentials: updates.access_credentials
      };
      
      // Remove metadata fields and credentials that shouldn't be in the main table update
      const cleanUpdates = { ...updates };
      delete cleanUpdates.id;
      delete cleanUpdates.created_at;
      delete cleanUpdates.system_credentials;
      delete cleanUpdates.windows_credentials;
      delete cleanUpdates.service_credentials;
      delete cleanUpdates.access_credentials;
      
      // Transform frontend Customer type to database format
      if (cleanUpdates.site_hazards) {
        cleanUpdates.site_hazards = Array.isArray(cleanUpdates.site_hazards) 
          ? cleanUpdates.site_hazards 
          : [cleanUpdates.site_hazards];
      }
      
      // Ensure updated_at is set
      cleanUpdates.updated_at = new Date().toISOString();
      
      logger.info('Updating customer with enhanced system', {
        customerId: id,
        fieldsToUpdate: Object.keys(cleanUpdates),
        hasCredentials: Object.values(credentials).some(c => c != null),
        updateCount: Object.keys(cleanUpdates).length
      });
      
      // Update main customer data
      const { data, error } = await supabase
        .from('ame_customers')
        .update(cleanUpdates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) {
        logger.error('Customer update failed', {
          customerId: id,
          error: error.message,
          code: error.code
        });
        throw errorHandler.handleSupabaseError(error, 'updateCustomer');
      }
      
      // Update credentials if provided
      if (Object.values(credentials).some(c => c != null && c !== undefined)) {
        logger.info('Updating enhanced credentials', {
          customerId: id,
          credentialTypes: Object.keys(credentials).filter(k => credentials[k] != null)
        });
        
        try {
          const { error: credError } = await supabase
            .rpc('save_customer_credentials', {
              p_customer_id: id,
              p_bms_credentials: credentials.system_credentials || null,
              p_windows_credentials: credentials.windows_credentials || null,
              p_service_credentials: credentials.service_credentials || null,
              p_access_credentials: credentials.access_credentials || null
            });
          
          if (credError) {
            logger.error('Failed to update customer credentials', credError);
            // Don't fail the entire operation, but log the issue
          } else {
            logger.info('Successfully updated enhanced credentials', { customerId: id });
          }
        } catch (credError) {
          logger.error('Credential update error', credError, { customerId: id });
        }
      }
      
      logger.info('Customer update completed successfully', {
        customerId: id,
        updatedFields: Object.keys(cleanUpdates).length
      });
      
      // Return the updated customer with enhanced data
      const { data: updatedCustomer } = await supabase
        .from('customer_management_view')
        .select('*')
        .eq('id', id)
        .single();
      
      if (updatedCustomer) {
        return {
          ...updatedCustomer,
          site_hazards: Array.isArray(updatedCustomer.site_hazards) 
            ? updatedCustomer.site_hazards 
            : updatedCustomer.site_hazards 
              ? [updatedCustomer.site_hazards] 
              : []
        } as Customer;
      }
      
      // Fallback to basic data if comprehensive view fails
      return {
        ...data,
        site_hazards: Array.isArray(data.site_hazards) 
          ? data.site_hazards 
          : data.site_hazards 
            ? [data.site_hazards] 
            : []
      } as Customer;
    }, 'updateCustomer', { additionalData: { customerId: id, updateFields: Object.keys(updates) } });
  }
  
  static async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('ame_customers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  // Visit operations
  static async getVisits(): Promise<Visit[]> {
    const { data, error } = await supabase
      .from('ame_visits')
      .select('*')
      .order('visit_date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Visit[];
  }

  static async getActiveVisits(technicianId?: string): Promise<Visit[]> {
    let query = supabase
      .from('ame_visits')
      .select('*')
      .eq('is_active', true)
      .in('visit_status', ['Scheduled', 'In Progress']);
    
    if (technicianId) {
      query = query.eq('technician_id', technicianId);
    }
    
    const { data, error } = await query.order('started_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Visit[];
  }

  static async getActiveVisitForCustomer(customerId: string, technicianId: string): Promise<Visit | null> {
    const { data, error } = await supabase
      .from('ame_visits')
      .select('*')
      .eq('customer_id', customerId)
      .eq('technician_id', technicianId)
      .eq('is_active', true)
      .in('visit_status', ['Scheduled', 'In Progress'])
      .single();
    
    if (error && error.code !== 'PGRST116') throw error;
    return data as Visit;
  }

  static async createVisitWithSession(customerId: string, technicianId: string): Promise<{ visit: Visit; sessionToken: string }> {
    return errorHandler.withErrorHandling(async () => {
      // Generate unique visit ID
      const { data: visitIdData, error: visitIdError } = await supabase.rpc('generate_visit_id');
      if (visitIdError) throw errorHandler.handleSupabaseError(visitIdError, 'generateVisitId');
      
      const visitId = visitIdData as string;
      const sessionToken = generateSessionToken();
      
      // Create visit record
      const visitData = {
        visit_id: visitId,
        customer_id: customerId,
        technician_id: technicianId,
        visit_date: getCurrentDateString(),
        visit_status: VISIT_STATUS.IN_PROGRESS,
        current_phase: 1,
        started_at: getCurrentISODate(),
        expires_at: generateVisitExpiration(),
        is_active: true
      };

      const { data: visit, error: visitError } = await supabase
        .from('ame_visits')
        .insert(visitData)
        .select()
        .single();
      
      if (visitError) throw errorHandler.handleSupabaseError(visitError, 'createVisit');

      // Create session record
      const sessionData = {
        visit_id: visit.id,
        technician_id: technicianId,
        session_token: sessionToken,
        auto_save_data: {}
      };

      const { error: sessionError } = await supabase
        .from('ame_visit_sessions')
        .insert(sessionData);
      
      if (sessionError) throw errorHandler.handleSupabaseError(sessionError, 'createSession');

      logger.info('Visit and session created successfully', {
        visitId: visit.id,
        customerId,
        technicianId
      });

      return { visit: visit as Visit, sessionToken };
    }, 'createVisitWithSession', { additionalData: { customerId, technicianId } });
  }

  static async saveVisitProgress(visitId: string, sessionToken: string, progressData: any): Promise<void> {
    return errorHandler.withErrorHandling(async () => {
      const timestamp = getCurrentISODate();
      
      // Update visit record
      const { error: visitError } = await supabase
        .from('ame_visits')
        .update({
          current_phase: progressData.currentPhase,
          auto_save_data: progressData.autoSaveData,
          skipped_steps: progressData.skippedSteps || [],
          last_activity: timestamp
        })
        .eq('id', visitId);
      
      if (visitError) throw errorHandler.handleSupabaseError(visitError, 'updateVisitProgress');

      // Update session record
      const { error: sessionError } = await supabase
        .from('ame_visit_sessions')
        .update({
          auto_save_data: progressData.autoSaveData,
          last_activity: timestamp
        })
        .eq('session_token', sessionToken);
      
      if (sessionError) throw errorHandler.handleSupabaseError(sessionError, 'updateSessionProgress');
      
      logger.debug('Visit progress saved', { visitId, currentPhase: progressData.currentPhase });
    }, 'saveVisitProgress', { additionalData: { visitId, sessionToken } });
  }

  static async saveSkippedSteps(visitId: string, skippedSteps: number[]): Promise<void> {
    return errorHandler.withErrorHandling(async () => {
      const { error } = await supabase
        .from('ame_visits')
        .update({
          skipped_steps: skippedSteps,
          last_activity: getCurrentISODate()
        })
        .eq('id', visitId);
      
      if (error) throw errorHandler.handleSupabaseError(error, 'saveSkippedSteps');
      
      logger.debug('Skipped steps saved', { visitId, skippedSteps });
    }, 'saveSkippedSteps', { additionalData: { visitId, skippedSteps } });
  }

  static async completeVisitPhase(visitId: string, phase: number): Promise<void> {
    return errorHandler.withErrorHandling(async () => {
      const timestamp = getCurrentISODate();
      const updateData: any = {
        [`phase_${phase}_completed_at`]: timestamp,
        [`phase_${phase}_status`]: PHASE_STATUS.COMPLETED,
        last_activity: timestamp
      };

      // If completing final phase, mark visit as complete
      if (phase === 4) {
        updateData.visit_status = VISIT_STATUS.COMPLETED;
        updateData.completion_date = timestamp;
        updateData.is_active = false;
      } else {
        updateData.current_phase = phase + 1;
      }

      const { error } = await supabase
        .from('ame_visits')
        .update(updateData)
        .eq('id', visitId);
      
      if (error) throw errorHandler.handleSupabaseError(error, 'completeVisitPhase');
      
      logger.info('Visit phase completed', { visitId, phase, isLastPhase: phase === 4 });
    }, 'completeVisitPhase', { additionalData: { visitId, phase } });
  }

  static async getVisitSession(sessionToken: string): Promise<any> {
    const { data, error } = await supabase
      .from('ame_visit_sessions')
      .select(`
        *,
        visit:ame_visits(*)
      `)
      .eq('session_token', sessionToken)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async createSessionForVisit(visitId: string): Promise<{ visit: any; sessionToken: string } | null> {
    return errorHandler.withErrorHandling(async () => {
      // First check if visit exists and is active
      const { data: visit, error: visitError } = await supabase
        .from('ame_visits')
        .select('*')
        .eq('id', visitId)
        .eq('is_active', true)
        .single();

      if (visitError || !visit) {
        logger.warn('Visit not found or inactive', undefined, { visitId });
        return null;
      }

      // Generate new session token
      const sessionToken = generateSessionToken();
      
      // Create new session record
      const sessionData = {
        visit_id: visit.id,
        technician_id: visit.technician_id,
        session_token: sessionToken,
        auto_save_data: visit.auto_save_data || {}
      };

      const { error: sessionError } = await supabase
        .from('ame_visit_sessions')
        .insert(sessionData);
      
      if (sessionError) {
        throw errorHandler.handleSupabaseError(sessionError, 'createSessionForVisit');
      }

      logger.info('Session created for existing visit', { visitId, sessionToken });
      return { visit, sessionToken };
    }, 'createSessionForVisit', { additionalData: { visitId } });
  }
  
  static async getVisit(id: string): Promise<Visit | null> {
    const { data, error } = await supabase
      .from('ame_visits')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Visit;
  }
  
  static async createVisit(visit: Omit<Visit, 'id' | 'created_at' | 'updated_at'>): Promise<Visit> {
    const { data, error } = await supabase
      .from('ame_visits')
      .insert(visit)
      .select()
      .single();
    
    if (error) throw error;
    return data as Visit;
  }
  
  static async updateVisit(id: string, updates: Partial<Visit>): Promise<Visit> {
    const { data, error } = await supabase
      .from('ame_visits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Visit;
  }

  static async endVisit(visitId: string): Promise<void> {
    const { error } = await supabase
      .from('ame_visits')
      .update({
        visit_status: 'Abandoned',
        is_active: false,
        completion_date: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', visitId);
    
    if (error) throw error;

    // Deactivate associated sessions
    const { error: sessionError } = await supabase
      .from('ame_visit_sessions')
      .update({
        is_active: false,
        last_activity: new Date().toISOString()
      })
      .eq('visit_id', visitId);
    
    if (sessionError) throw sessionError;
  }

  static async resetVisitProgress(visitId: string): Promise<void> {
    const { error } = await supabase
      .from('ame_visits')
      .update({
        current_phase: 1,
        phase_1_completed_at: null,
        phase_2_completed_at: null,
        phase_3_completed_at: null,
        phase_4_completed_at: null,
        auto_save_data: {},
        total_duration: 0,
        updated_at: new Date().toISOString()
      })
      .eq('id', visitId);
    
    if (error) throw error;

    // Clear visit tasks from ame_visit_tasks table
    const { error: tasksError } = await supabase
      .from('ame_visit_tasks')
      .delete()
      .eq('visit_id', visitId);
    
    if (tasksError) throw tasksError;

    // Clear visit progress records
    const { error: progressError } = await supabase
      .from('ame_visit_progress')
      .delete()
      .eq('visit_id', visitId);
    
    if (progressError) throw progressError;
  }
  
  // Task operations
  static async getTasks(): Promise<any[]> {
    const { data, error } = await supabase
      .from('ame_tasks')
      .select('*')
      .order('task_id');
    
    if (error) throw error;
    return data || [];
  }
  
  static async getTasksByServiceTier(serviceTier: string): Promise<any[]> {
    // Get all tasks first
    const { data, error } = await supabase
      .from('ame_tasks')
      .select('*')
      .order('task_id', { ascending: true });
    
    if (error) throw error;
    
    // Get inherited tiers for filtering
    const inheritedTiers = this.getInheritedTiers(serviceTier);
    
    // Filter tasks based on task_id prefixes (C = CORE, A = ASSURE, G = GUARDIAN)
    const filteredTasks = (data || []).filter(task => {
      const taskId = (task as any).task_id || '';
      let includeTask = false;
      
      if (taskId.startsWith('C') && inheritedTiers.includes('CORE')) {
        includeTask = true;
      } else if (taskId.startsWith('A') && inheritedTiers.includes('ASSURE')) {
        includeTask = true;
      } else if (taskId.startsWith('G') && inheritedTiers.includes('GUARDIAN')) {
        includeTask = true;
      }
      
      return includeTask;
    });
    
    console.log(`Service tier: ${serviceTier}, Inherited tiers: [${inheritedTiers.join(', ')}], Total tasks: ${(data || []).length}, Filtered tasks: ${filteredTasks.length}`);
    
    return filteredTasks.map(task => ({
      ...task,
      service_tier: serviceTier,
      category_name: task.task_name || 'General'
    }));
  }

  static getInheritedTiers(tier: string): string[] {
    switch (tier) {
      case 'CORE': return ['CORE'];
      case 'ASSURE': return ['CORE', 'ASSURE'];
      case 'GUARDIAN': return ['CORE', 'ASSURE', 'GUARDIAN'];
      default: return ['CORE'];
    }
  }

  static async getToolsByServiceTier(serviceTier: string): Promise<any[]> {
    const inheritedTiers = this.getInheritedTiers(serviceTier);
    
    const { data, error } = await supabase
      .from('ame_tools')
      .select('*')
      .eq('tool_status', 'active')
      .order('tool_name');
    
    if (error) throw error;
    return data || [];
  }

  static async getSOPsByServiceTier(serviceTier: string): Promise<any[]> {
    // For now, return all SOPs until we have proper tier data
    const { data, error } = await supabase
      .from('ame_sops')
      .select('*')
      .order('sop_name');
    
    if (error) throw error;
    return data || [];
  }
  
  static async createTask(task: any): Promise<any> {
    const { data, error } = await supabase
      .from('ame_tasks')
      .insert(task)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Visit Task operations
  static async getVisitTasks(visitId: string): Promise<VisitTask[]> {
    const { data, error } = await supabase
      .from('ame_visit_tasks')
      .select('*')
      .eq('visit_id', visitId)
      .order('created_at');
    
    if (error) throw error;
    return (data || []) as VisitTask[];
  }
  
  static async updateVisitTask(id: string, updates: Partial<VisitTask>): Promise<VisitTask> {
    const { data, error } = await supabase
      .from('ame_visit_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as VisitTask;
  }
  
  // Tool operations
  static async getTools(): Promise<any[]> {
    const { data, error } = await supabase
      .from('ame_tools')
      .select('*')
      .order('tool_name');
    
    if (error) throw error;
    return data || [];
  }
  
  static async createTool(tool: any): Promise<any> {
    const { data, error } = await supabase
      .from('ame_tools')
      .insert(tool)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // SOP operations
  static async getSOPs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('ame_sops')
      .select('*')
      .order('sop_name');
    
    if (error) throw error;
    return data || [];
  }
  
  static async createSOP(sop: any): Promise<any> {
    const { data, error } = await supabase
      .from('ame_sops')
      .insert(sop)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Report operations
  static async getReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from('ame_reports')
      .select('*')
      .order('generated_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Report[];
  }
  
  static async createReport(report: Omit<Report, 'id'>): Promise<Report> {
    const { data, error } = await supabase
      .from('ame_reports')
      .insert(report)
      .select()
      .single();
    
    if (error) throw error;
    return data as Report;
  }
  
  // Utility methods
  static async generateCustomerId(): Promise<string> {
    const { data, error } = await supabase
      .from('ame_customers')
      .select('customer_id')
      .order('customer_id', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return 'CUST_001';
    }
    
    const lastId = data[0].customer_id;
    const num = parseInt(lastId.replace('CUST_', '')) + 1;
    return `CUST_${num.toString().padStart(3, '0')}`;
  }
  
  static async generateVisitId(): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    const { data, error } = await supabase
      .from('ame_visits')
      .select('visit_id')
      .like('visit_id', `VIS_${today}_%`)
      .order('visit_id', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    let count = 1;
    if (data && data.length > 0) {
      const lastId = data[0].visit_id;
      const lastCount = parseInt(lastId.split('_')[2]);
      count = lastCount + 1;
    }
    
    return `VIS_${today}_${count.toString().padStart(3, '0')}`;
  }
}