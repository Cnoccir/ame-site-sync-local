import { supabase } from '@/integrations/supabase/client';
import { logger } from '../utils/logger';
import { AMECustomerService } from './ameCustomerService';

export interface PMWorkflowSession {
  id: string;
  session_name?: string;
  customer_id?: string;
  technician_id?: string;
  secondary_technician_id?: string;
  session_type?: string;
  service_tier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  current_phase?: number;
  phase_1_data?: any;
  phase_2_data?: any;
  phase_3_data?: any;
  phase_4_data?: any;
  started_at?: string;
  completed_at?: string;
  estimated_duration?: number;
  actual_duration?: number;
  status?: string;
  completion_percentage?: number;
  customer_data?: any;
  primary_technician_name?: string;
  secondary_technician_name?: string;
  report_generated?: boolean;
  report_url?: string;
  photos_count?: number;
  issues_count?: number;
  recommendations_count?: number;
  created_by?: string;
  updated_by?: string;
  created_at?: string;
  updated_at?: string;
}

export interface CreatePMSessionData {
  session_name: string;
  service_tier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  session_type?: string;
  customer_id?: string;
  technician_id?: string;
  secondary_technician_id?: string;
  estimated_duration?: number;
}

export class PMWorkflowPersistenceService {
  /**
   * Create a new PM workflow session
   */
  static async createSession(sessionData: CreatePMSessionData): Promise<PMWorkflowSession> {
    try {
      logger.info('Creating new PM workflow session', { sessionName: sessionData.session_name });

      const { data, error } = await supabase
        .from('pm_workflow_sessions')
        .insert({
          ...sessionData,
          status: 'Draft',
          current_phase: 1,
          completion_percentage: 0,
          started_at: new Date().toISOString(),
          created_by: (await supabase.auth.getUser()).data.user?.id,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error creating PM workflow session:', error);
        throw error;
      }

      logger.info('PM workflow session created successfully', { id: data.id });
      return data;
    } catch (error) {
      logger.error('Failed to create PM workflow session:', error);
      throw error;
    }
  }

  /**
   * Update PM workflow session data
   */
  static async updateSession(sessionId: string, updates: Partial<PMWorkflowSession>): Promise<PMWorkflowSession> {
    try {
      logger.info('Updating PM workflow session', { sessionId, phase: updates.current_phase });

      const { data, error } = await supabase
        .from('pm_workflow_sessions')
        .update(updates)
        .eq('id', sessionId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating PM workflow session:', error);
        throw error;
      }

      logger.info('PM workflow session updated successfully', { id: sessionId });
      return data;
    } catch (error) {
      logger.error('Failed to update PM workflow session:', error);
      throw error;
    }
  }

  /**
   * Update specific phase data
   */
  static async updatePhaseData(sessionId: string, phase: number, phaseData: any): Promise<PMWorkflowSession> {
    try {
      const phaseColumn = `phase_${phase}_data`;
      const updates: any = {
        [phaseColumn]: phaseData,
        current_phase: phase,
        completion_percentage: this.calculateCompletionPercentage(phase, phaseData)
      };

      // If completing final phase, mark as completed
      if (phase === 4 && this.isPhaseComplete(phaseData)) {
        updates.status = 'Completed';
        updates.completed_at = new Date().toISOString();
      }

      return await this.updateSession(sessionId, updates);
    } catch (error) {
      logger.error('Failed to update phase data:', error);
      throw error;
    }
  }

  /**
   * Get PM workflow session by ID
   */
  static async getSession(sessionId: string): Promise<PMWorkflowSession | null> {
    try {
      const { data, error } = await supabase
        .from('pm_workflow_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Session not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to fetch PM workflow session:', error);
      throw error;
    }
  }

  /**
   * Get all PM workflow sessions for current user
   */
  static async getAllSessions(): Promise<PMWorkflowSession[]> {
    try {
      const { data, error } = await supabase
        .from('pm_workflow_sessions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        logger.error('Error fetching PM workflow sessions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to fetch PM workflow sessions:', error);
      throw error;
    }
  }

  /**
   * Get recent PM workflow sessions
   */
  static async getRecentSessions(limit: number = 10): Promise<PMWorkflowSession[]> {
    try {
      const { data, error } = await supabase
        .from('pm_workflow_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching recent PM workflow sessions:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to fetch recent PM workflow sessions:', error);
      throw error;
    }
  }

  /**
   * Delete PM workflow session
   */
  static async deleteSession(sessionId: string): Promise<void> {
    try {
      logger.info('Deleting PM workflow session', { sessionId });

      const { error } = await supabase
        .from('pm_workflow_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) {
        logger.error('Error deleting PM workflow session:', error);
        throw error;
      }

      logger.info('PM workflow session deleted successfully', { sessionId });
    } catch (error) {
      logger.error('Failed to delete PM workflow session:', error);
      throw error;
    }
  }

  /**
   * Save complete PM workflow data and sync with customer
   */
  static async saveWorkflowAndSyncCustomer(sessionId: string, workflowData: any): Promise<{
    session: PMWorkflowSession;
    customer: any;
  }> {
    try {
      logger.info('Saving complete workflow data and syncing customer', { sessionId });

      // Save the complete workflow data to the session
      const session = await this.updateSession(sessionId, {
        phase_1_data: workflowData.phase1,
        phase_2_data: workflowData.phase2,
        phase_3_data: workflowData.phase3,
        phase_4_data: workflowData.phase4,
        customer_data: workflowData.phase1?.customer,
        primary_technician_name: workflowData.phase1?.customer?.primaryTechnicianName,
        secondary_technician_name: workflowData.phase1?.customer?.secondaryTechnicianName,
        photos_count: workflowData.phase2?.photos?.length || 0,
        issues_count: workflowData.phase3?.issues?.length || 0,
        recommendations_count: workflowData.phase3?.recommendations?.length || 0,
        status: 'In Progress'
      });

      // Create or update the customer in ame_customers table
      const customer = await AMECustomerService.upsertFromPMWorkflow(workflowData);

      // Update the session with the customer ID
      await this.updateSession(sessionId, {
        customer_id: customer.id
      });

      logger.info('Workflow data saved and customer synced successfully', {
        sessionId,
        customerId: customer.id
      });

      return { session, customer };
    } catch (error) {
      logger.error('Failed to save workflow and sync customer:', error);
      throw error;
    }
  }

  /**
   * Start a new PM session from existing customer
   */
  static async startSessionFromCustomer(customerId: string, serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN'): Promise<{
    session: PMWorkflowSession;
    workflowData: any;
  }> {
    try {
      logger.info('Starting new PM session from existing customer', { customerId, serviceTier });

      // Get the existing customer data
      const customer = await AMECustomerService.getCustomerById(customerId);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Create new session
      const session = await this.createSession({
        session_name: `${customer.company_name} - ${new Date().toLocaleDateString()}`,
        service_tier: serviceTier,
        session_type: 'Preventive Maintenance',
        customer_id: customerId,
        technician_id: customer.primary_technician_id,
        secondary_technician_id: customer.secondary_technician_id,
        estimated_duration: this.getEstimatedDuration(serviceTier)
      });

      // Convert customer data to PM workflow format
      const workflowData = AMECustomerService.mapToPMWorkflowFormat(customer);

      logger.info('PM session started from customer successfully', {
        sessionId: session.id,
        customerId
      });

      return { session, workflowData };
    } catch (error) {
      logger.error('Failed to start session from customer:', error);
      throw error;
    }
  }

  /**
   * Calculate completion percentage based on phase and data completeness
   */
  private static calculateCompletionPercentage(phase: number, phaseData: any): number {
    const basePercentage = ((phase - 1) / 4) * 100;

    // Add bonus for phase completion
    if (this.isPhaseComplete(phaseData)) {
      return Math.min(basePercentage + 25, 100);
    }

    return basePercentage;
  }

  /**
   * Check if a phase is complete based on its data
   */
  private static isPhaseComplete(phaseData: any): boolean {
    if (!phaseData) return false;

    // Basic completeness check - can be enhanced based on specific phase requirements
    const keys = Object.keys(phaseData);
    const filledKeys = keys.filter(key => {
      const value = phaseData[key];
      return value !== null && value !== undefined && value !== '';
    });

    return filledKeys.length / keys.length > 0.7; // 70% completion threshold
  }

  /**
   * Get estimated duration based on service tier
   */
  private static getEstimatedDuration(serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN'): number {
    switch (serviceTier) {
      case 'CORE':
        return 120; // 2 hours
      case 'ASSURE':
        return 180; // 3 hours
      case 'GUARDIAN':
        return 240; // 4 hours
      default:
        return 120;
    }
  }
}