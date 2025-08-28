import { supabase } from '@/integrations/supabase/client';
import { Customer, SiteContext, TechnicianInfo, SiteIntelligence } from '@/types';
import { logger } from '@/utils/logger';
import { errorHandler } from '@/utils/errorHandler';

/**
 * Site Intelligence Service - Manages site nicknames, persistent numbers, and technician assignments
 * Addresses Rob's feedback about job number confusion and quick site reference needs
 */
export class SiteIntelligenceService {
  
  /**
   * Generate unique site number automatically
   * Format: AME-YYYY-### (e.g., "AME-2025-001")
   */
  static async generateSiteNumber(): Promise<string> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase.rpc('generate_site_number');
      
      if (error) throw errorHandler.handleSupabaseError(error, 'generateSiteNumber');
      
      return data as string;
    }, 'generateSiteNumber');
  }
  
  /**
   * Get technician information by ID
   */
  static async getTechnicianInfo(technicianId: string): Promise<TechnicianInfo | null> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role
        `)
        .eq('id', technicianId)
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw errorHandler.handleSupabaseError(error, 'getTechnicianInfo');
      }
      
      if (!data) return null;
      
      return {
        id: data.id,
        name: data.full_name || data.email,
        email: data.email,
        role: data.role || 'technician'
      };
    }, 'getTechnicianInfo', { additionalData: { technicianId } });
  }
  
  /**
   * Get technician names from IDs
   */
  static async getTechnicianNames(
    primaryId?: string, 
    secondaryId?: string
  ): Promise<{ primary?: string; secondary?: string }> {
    return errorHandler.withErrorHandling(async () => {
      const result: { primary?: string; secondary?: string } = {};
      
      if (primaryId) {
        const primaryTech = await this.getTechnicianInfo(primaryId);
        result.primary = primaryTech?.name;
      }
      
      if (secondaryId) {
        const secondaryTech = await this.getTechnicianInfo(secondaryId);
        result.secondary = secondaryTech?.name;
      }
      
      return result;
    }, 'getTechnicianNames', { additionalData: { primaryId, secondaryId } });
  }
  
  /**
   * Get all available technicians for assignment
   */
  static async getAvailableTechnicians(): Promise<TechnicianInfo[]> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          id,
          full_name,
          email,
          role
        `)
        .in('role', ['technician', 'admin'])
        .order('full_name');
      
      if (error) throw errorHandler.handleSupabaseError(error, 'getAvailableTechnicians');
      
      return (data || []).map(tech => ({
        id: tech.id,
        name: tech.full_name || tech.email,
        email: tech.email,
        role: tech.role || 'technician'
      }));
    }, 'getAvailableTechnicians');
  }
  
  /**
   * Update site intelligence data for a customer
   */
  static async updateSiteIntelligence(
    customerId: string, 
    updates: Partial<Customer>
  ): Promise<void> {
    return errorHandler.withErrorHandling(async () => {
      const { error } = await supabase
        .from('ame_customers')
        .update(updates)
        .eq('id', customerId);
      
      if (error) throw errorHandler.handleSupabaseError(error, 'updateSiteIntelligence');
      
      logger.info('Site intelligence updated', { 
        customerId, 
        updatedFields: Object.keys(updates) 
      });
    }, 'updateSiteIntelligence', { additionalData: { customerId, updates } });
  }
  
  /**
   * Get comprehensive site context for technician handoffs
   */
  static async getSiteContext(customerId: string): Promise<SiteContext> {
    return errorHandler.withErrorHandling(async () => {
      // Get customer data with site intelligence
      const { data: customer, error: customerError } = await supabase
        .from('ame_customers')
        .select('*')
        .eq('id', customerId)
        .single();
      
      if (customerError) {
        throw errorHandler.handleSupabaseError(customerError, 'getSiteContext');
      }
      
      // Get technician names if assigned
      const techNames = await this.getTechnicianNames(
        customer.primary_technician_id,
        customer.secondary_technician_id
      );
      
      // Get last visit information
      const { data: lastVisit } = await supabase
        .from('ame_visits')
        .select(`
          technician_id,
          visit_date,
          current_phase,
          notes,
          profiles:technician_id (full_name)
        `)
        .eq('customer_id', customerId)
        .order('visit_date', { ascending: false })
        .limit(1)
        .single();
      
      return {
        nickname: customer.site_nickname || customer.site_name,
        siteNumber: customer.site_number || 'Not assigned',
        systemPlatform: customer.system_platform,
        primaryTech: techNames.primary,
        secondaryTech: techNames.secondary,
        lastVisit: lastVisit ? {
          technicianName: lastVisit.profiles?.full_name || 'Unknown',
          technicianId: lastVisit.technician_id,
          date: new Date(lastVisit.visit_date),
          phase: lastVisit.current_phase || 1,
          notes: lastVisit.notes
        } : undefined,
        jobNumberHistory: customer.last_job_numbers || []
      };
    }, 'getSiteContext', { additionalData: { customerId } });
  }
  
  /**
   * Add job number to history for a site
   */
  static async addJobNumberToHistory(customerId: string, jobNumber: string): Promise<void> {
    return errorHandler.withErrorHandling(async () => {
      // Get current job numbers
      const { data: customer, error: fetchError } = await supabase
        .from('ame_customers')
        .select('last_job_numbers')
        .eq('id', customerId)
        .single();
      
      if (fetchError) {
        throw errorHandler.handleSupabaseError(fetchError, 'addJobNumberToHistory');
      }
      
      const currentJobNumbers = customer.last_job_numbers || [];
      
      // Add new job number if not already present
      if (!currentJobNumbers.includes(jobNumber)) {
        const updatedJobNumbers = [...currentJobNumbers, jobNumber].slice(-5); // Keep last 5
        
        await this.updateSiteIntelligence(customerId, {
          last_job_numbers: updatedJobNumbers
        });
      }
    }, 'addJobNumberToHistory', { additionalData: { customerId, jobNumber } });
  }
  
  /**
   * Search customers by site nickname or site number
   */
  static async searchSites(query: string): Promise<Customer[]> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .or(
          `site_nickname.ilike.%${query}%,site_number.ilike.%${query}%,company_name.ilike.%${query}%`
        )
        .limit(10);
      
      if (error) throw errorHandler.handleSupabaseError(error, 'searchSites');
      
      return data as Customer[];
    }, 'searchSites', { additionalData: { query } });
  }
  
  /**
   * Get sites assigned to a specific technician
   */
  static async getSitesForTechnician(technicianId: string): Promise<Customer[]> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .or(`primary_technician_id.eq.${technicianId},secondary_technician_id.eq.${technicianId}`)
        .order('site_nickname');
      
      if (error) throw errorHandler.handleSupabaseError(error, 'getSitesForTechnician');
      
      return data as Customer[];
    }, 'getSitesForTechnician', { additionalData: { technicianId } });
  }
  
  /**
   * Validate and ensure site has required intelligence data
   */
  static async ensureSiteIntelligence(customerId: string): Promise<void> {
    return errorHandler.withErrorHandling(async () => {
      const { data: customer, error } = await supabase
        .from('ame_customers')
        .select('site_number, site_nickname')
        .eq('id', customerId)
        .single();
      
      if (error) throw errorHandler.handleSupabaseError(error, 'ensureSiteIntelligence');
      
      const updates: Partial<Customer> = {};
      
      // Generate site number if missing
      if (!customer.site_number) {
        updates.site_number = await this.generateSiteNumber();
      }
      
      // Generate default nickname if missing
      if (!customer.site_nickname) {
        const { data: customerData } = await supabase
          .from('ame_customers')
          .select('company_name, site_name')
          .eq('id', customerId)
          .single();
        
        if (customerData) {
          updates.site_nickname = `${customerData.company_name} - ${customerData.site_name}`.substring(0, 50);
        }
      }
      
      if (Object.keys(updates).length > 0) {
        await this.updateSiteIntelligence(customerId, updates);
      }
    }, 'ensureSiteIntelligence', { additionalData: { customerId } });
  }
  
  /**
   * Get complete site intelligence data using the database function
   * Returns structured intelligence data for enhanced pre-visit preparation
   */
  static async getSiteIntelligenceData(customerId: string): Promise<SiteIntelligence | null> {
    return errorHandler.withErrorHandling(async () => {
      const { data, error } = await supabase.rpc('get_site_intelligence', {
        customer_id_param: customerId
      });
      
      if (error) throw errorHandler.handleSupabaseError(error, 'getSiteIntelligenceData');
      
      return data as SiteIntelligence;
    }, 'getSiteIntelligenceData', { additionalData: { customerId } });
  }
  
  /**
   * Generate intelligent tool recommendations based on site data
   * Considers system platform, service tier, known issues, and site history
   */
  static generateToolRecommendations(customer: Customer): Array<{
    toolName: string;
    reason: string;
    priority: 'essential' | 'recommended' | 'optional';
    category: string;
  }> {
    const recommendations = [];
    
    // System platform specific tools
    if (customer.system_platform) {
      switch (customer.system_platform) {
        case 'N4':
          recommendations.push({
            toolName: 'N4 Workbench Laptop',
            reason: 'Required for N4 system access and configuration',
            priority: 'essential' as const,
            category: 'System Access'
          });
          recommendations.push({
            toolName: 'Network Cable (CAT6)',
            reason: 'Direct connection often required for N4 programming',
            priority: 'recommended' as const,
            category: 'Connectivity'
          });
          break;
        case 'WEBs':
          recommendations.push({
            toolName: 'Laptop with Modern Browser',
            reason: 'Required for WEBs system web interface access',
            priority: 'essential' as const,
            category: 'System Access'
          });
          break;
        case 'FX':
          recommendations.push({
            toolName: 'FX Tool Software & Cable',
            reason: 'Required for FX controller programming and diagnostics',
            priority: 'essential' as const,
            category: 'System Access'
          });
          break;
        case 'Mixed-ALC':
          recommendations.push({
            toolName: 'Multi-Platform Tool Kit',
            reason: 'Site has mixed ALC systems requiring multiple tools',
            priority: 'essential' as const,
            category: 'System Access'
          });
          break;
      }
    }
    
    // Service tier specific tools
    if (customer.service_tier === 'GUARDIAN') {
      recommendations.push({
        toolName: 'Vibration Analysis Kit',
        reason: 'Enhanced diagnostics required for Guardian tier service',
        priority: 'recommended' as const,
        category: 'Diagnostic'
      });
      recommendations.push({
        toolName: 'Thermal Imaging Camera',
        reason: 'Advanced troubleshooting for premium service tier',
        priority: 'recommended' as const,
        category: 'Diagnostic'
      });
    }
    
    // Known issues specific tools
    if (customer.known_issues) {
      customer.known_issues.forEach(issue => {
        if (issue.toLowerCase().includes('actuator')) {
          recommendations.push({
            toolName: 'Actuator Calibration Kit',
            reason: 'Site has documented actuator calibration issues',
            priority: 'recommended' as const,
            category: 'Calibration'
          });
        }
        if (issue.toLowerCase().includes('sensor')) {
          recommendations.push({
            toolName: 'Temperature/Pressure Calibrators',
            reason: 'Site has documented sensor calibration needs',
            priority: 'recommended' as const,
            category: 'Calibration'
          });
        }
        if (issue.toLowerCase().includes('network') || issue.toLowerCase().includes('connectivity')) {
          recommendations.push({
            toolName: 'Network Testing Equipment',
            reason: 'Site has documented network connectivity issues',
            priority: 'essential' as const,
            category: 'Network'
          });
        }
      });
    }
    
    // Access-specific tools
    if (customer.common_access_issues?.some(issue => issue.toLowerCase().includes('badge'))) {
      recommendations.push({
        toolName: 'Temporary Access Forms',
        reason: 'Site has documented badge system issues',
        priority: 'recommended' as const,
        category: 'Access'
      });
    }
    
    // Always include basic essentials
    recommendations.push(
      {
        toolName: 'Safety Equipment (PPE)',
        reason: 'Required for all site visits',
        priority: 'essential' as const,
        category: 'Safety'
      },
      {
        toolName: 'Basic Hand Tools',
        reason: 'Standard tools for mechanical adjustments',
        priority: 'essential' as const,
        category: 'Mechanical'
      },
      {
        toolName: 'Digital Multimeter',
        reason: 'Electrical diagnostics and troubleshooting',
        priority: 'essential' as const,
        category: 'Electrical'
      }
    );
    
    return recommendations;
  }
  
  /**
   * Update team context information for a site
   */
  static async updateTeamContext(customerId: string, teamContext: {
    last_visit_by?: string;
    last_visit_date?: string;
    site_experience?: 'first_time' | 'familiar' | 'expert';
    handoff_notes?: string;
  }): Promise<void> {
    return this.updateSiteIntelligence(customerId, teamContext);
  }
  
  /**
   * Update access intelligence information for a site
   */
  static async updateAccessIntelligence(customerId: string, accessInfo: {
    best_arrival_times?: string[];
    poc_name?: string;
    poc_phone?: string;
    poc_available_hours?: string;
    backup_contact?: string;
    access_approach?: string;
    common_access_issues?: string[];
    scheduling_notes?: string;
  }): Promise<void> {
    return this.updateSiteIntelligence(customerId, accessInfo);
  }
  
  /**
   * Update project status information for a site
   */
  static async updateProjectStatus(customerId: string, projectStatus: {
    completion_status?: 'Design' | 'Construction' | 'Commissioning' | 'Operational' | 'Warranty';
    commissioning_notes?: string;
    known_issues?: string[];
    documentation_score?: number;
    original_team_contact?: string;
    original_team_role?: string;
    original_team_info?: string;
    when_to_contact_original?: string;
  }): Promise<void> {
    return this.updateSiteIntelligence(customerId, projectStatus);
  }
}
