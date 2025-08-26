import { supabase } from '@/integrations/supabase/client';
import { Customer, Visit, Task, VisitTask, Tool, SOP, Report } from '@/types';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/errorHandler';
import { getCurrentISODate, getCurrentDateString, generateVisitExpiration } from '@/utils/dateHelpers';
import { generateUUID, generateSessionToken } from '@/utils/idGenerators';
import { VISIT_STATUS, PHASE_STATUS } from '@/utils/constants';
import { filterContentByTier } from '@/types/serviceTiers';

/**
 * Service for AME maintenance system database operations
 */
export class AMEService {
  
  // Customer operations
  static async getCustomers(): Promise<Customer[]> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .order('company_name');
      
      if (error) throw errorHandler.handleSupabaseError(error, 'getCustomers');
      return (data || []) as Customer[];
    }, 'getCustomers');
  }
  
  static async getCustomer(id: string): Promise<Customer | null> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw errorHandler.handleSupabaseError(error, 'getCustomer');
      return data as Customer;
    }, 'getCustomer', { additionalData: { customerId: id } });
  }
  
  static async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('ame_customers')
        .insert(customer)
        .select()
        .single();
      
      if (error) throw errorHandler.handleSupabaseError(error, 'createCustomer');
      
      // Create Google Drive project folder after customer creation
      try {
        const { GoogleDriveFolderService } = await import('./googleDriveFolderService');
        await GoogleDriveFolderService.ensureProjectFolderExists(data);
      } catch (folderError) {
        logger.warn('Failed to create Google Drive folder for customer', folderError, {
          customerId: data.id,
          companyName: data.company_name
        });
      }
      
      return data as Customer;
    }, 'createCustomer');
  }
  
  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('ame_customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Customer;
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

    // Clear visit tasks
    const { error: tasksError } = await supabase
      .from('visit_tasks')
      .delete()
      .eq('visit_id', visitId);
    
    if (tasksError) throw tasksError;

    // Reset assessment steps
    const { error: assessmentError } = await supabase
      .from('assessment_steps')
      .delete()
      .eq('visit_id', visitId);
    
    if (assessmentError) throw assessmentError;
  }
  
  // Task operations
  static async getTasks(): Promise<any[]> {
    const { data, error } = await supabase
      .from('ame_tasks_normalized')
      .select('*')
      .order('task_id');
    
    if (error) throw error;
    return data || [];
  }
  
  static async getTasksByServiceTier(serviceTier: string): Promise<any[]> {
    // Get all tasks first
    const { data, error } = await supabase
      .from('ame_tasks_normalized')
      .select('*')
      .order('task_id', { ascending: true });
    
    if (error) throw error;
    
    // Get inherited tiers for filtering
    const inheritedTiers = this.getInheritedTiers(serviceTier);
    
    // Filter tasks based on task_id prefixes (C = CORE, A = ASSURE, G = GUARDIAN)
    const filteredTasks = (data || []).filter(task => {
      const taskId = task.task_id || '';
      if (taskId.startsWith('C')) return inheritedTiers.includes('CORE');
      if (taskId.startsWith('A')) return inheritedTiers.includes('ASSURE');
      if (taskId.startsWith('G')) return inheritedTiers.includes('GUARDIAN');
      return false; // Don't include tasks that don't match any prefix
    });
    
    console.log(`Service tier: ${serviceTier}, Inherited tiers: ${inheritedTiers.join(', ')}, Filtered tasks: ${filteredTasks.length}`);
    
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
      .from('ame_tools_normalized')
      .select('*')
      .overlaps('service_tiers', inheritedTiers)
      .order('tool_name');
    
    if (error) throw error;
    return data || [];
  }

  static async getSOPsByServiceTier(serviceTier: string): Promise<any[]> {
    // For now, return all SOPs until we have proper tier data
    const { data, error } = await supabase
      .from('ame_sops_normalized')
      .select('*')
      .order('title');
    
    if (error) throw error;
    return data || [];
  }
  
  static async createTask(task: any): Promise<any> {
    const { data, error } = await supabase
      .from('ame_tasks_normalized')
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
      .from('ame_tools_normalized')
      .select('*')
      .order('tool_name');
    
    if (error) throw error;
    return data || [];
  }
  
  static async createTool(tool: any): Promise<any> {
    const { data, error } = await supabase
      .from('ame_tools_normalized')
      .insert(tool)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // SOP operations
  static async getSOPs(): Promise<any[]> {
    const { data, error } = await supabase
      .from('ame_sops_normalized')
      .select('*')
      .order('title');
    
    if (error) throw error;
    return data || [];
  }
  
  static async createSOP(sop: any): Promise<any> {
    const { data, error } = await supabase
      .from('ame_sops_normalized')
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