import { supabase } from '@/integrations/supabase/client';
import { logger } from '../utils/logger';

export interface Task {
  task_id: string;
  task_name: string;
  system_family?: string;
  vendor_flavor?: string;
  phase?: string;
  service_tiers: string;
  frequency?: string;
  estimated_duration_min?: number;
  audience_level?: number;
  initial_steps?: string;
  sop_refs?: string;
  acceptance_criteria?: string;
  artifacts?: string;
  prerequisites?: string;
  tools_required?: string;
  safety_tags?: string;
  reference_links?: string;
  notes?: string;
  owner?: string;
  last_updated?: string;
  version?: string;
}

export interface SOP {
  sop_id: string;
  task_id?: string;
  title: string;
  goal?: string;
  steps?: string;
  why_important?: string;
  best_practices?: string;
  reference_links?: string;
}

export interface TaskWithSOP extends Task {
  sop?: SOP;
}

export class TaskSOPService {
  /**
   * Get tasks filtered by service tier and optionally by phase
   */
  static async getTasksForServiceTier(
    serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN',
    phase?: string,
    systemFamily?: string
  ): Promise<TaskWithSOP[]> {
    try {
      logger.info('Fetching tasks for service tier', { serviceTier, phase, systemFamily });

      let query = supabase
        .from('tasks')
        .select(`
          *,
          sops (*)
        `);

      // Filter by service tier
      query = query.or(`service_tiers.ilike.%${serviceTier}%`);

      // Filter by phase if provided
      if (phase) {
        query = query.eq('phase', phase);
      }

      // Filter by system family if provided
      if (systemFamily) {
        query = query.eq('system_family', systemFamily);
      }

      const { data, error } = await query.order('task_id');

      if (error) {
        logger.error('Error fetching tasks:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to fetch tasks for service tier:', error);
      throw error;
    }
  }

  /**
   * Get all available phases
   */
  static async getAvailablePhases(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('phase')
        .not('phase', 'is', null);

      if (error) throw error;

      const uniquePhases = [...new Set(data.map(item => item.phase))].filter(Boolean);
      return uniquePhases.sort();
    } catch (error) {
      logger.error('Failed to fetch available phases:', error);
      throw error;
    }
  }

  /**
   * Get all available system families
   */
  static async getAvailableSystemFamilies(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('system_family')
        .not('system_family', 'is', null);

      if (error) throw error;

      const uniqueFamilies = [...new Set(data.map(item => item.system_family))].filter(Boolean);
      return uniqueFamilies.sort();
    } catch (error) {
      logger.error('Failed to fetch available system families:', error);
      throw error;
    }
  }

  /**
   * Get task by ID with its SOP
   */
  static async getTaskById(taskId: string): Promise<TaskWithSOP | null> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          sops (*)
        `)
        .eq('task_id', taskId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Task not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to fetch task by ID:', error);
      throw error;
    }
  }

  /**
   * Get SOP by ID
   */
  static async getSOPById(sopId: string): Promise<SOP | null> {
    try {
      const { data, error } = await supabase
        .from('sops')
        .select('*')
        .eq('sop_id', sopId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // SOP not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to fetch SOP by ID:', error);
      throw error;
    }
  }

  /**
   * Search tasks by name or description
   */
  static async searchTasks(query: string): Promise<TaskWithSOP[]> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          *,
          sops (*)
        `)
        .or(`task_name.ilike.%${query}%, initial_steps.ilike.%${query}%, notes.ilike.%${query}%`)
        .order('task_name');

      if (error) throw error;

      return data || [];
    } catch (error) {
      logger.error('Failed to search tasks:', error);
      throw error;
    }
  }

  /**
   * Get task statistics for reporting
   */
  static async getTaskStatistics(): Promise<{
    totalTasks: number;
    tasksByServiceTier: Record<string, number>;
    tasksByPhase: Record<string, number>;
    tasksBySystemFamily: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('service_tiers, phase, system_family');

      if (error) throw error;

      const stats = {
        totalTasks: data.length,
        tasksByServiceTier: {} as Record<string, number>,
        tasksByPhase: {} as Record<string, number>,
        tasksBySystemFamily: {} as Record<string, number>
      };

      data.forEach(task => {
        // Count service tiers
        const tiers = task.service_tiers?.split(',').map(t => t.trim()) || [];
        tiers.forEach(tier => {
          stats.tasksByServiceTier[tier] = (stats.tasksByServiceTier[tier] || 0) + 1;
        });

        // Count phases
        if (task.phase) {
          stats.tasksByPhase[task.phase] = (stats.tasksByPhase[task.phase] || 0) + 1;
        }

        // Count system families
        if (task.system_family) {
          stats.tasksBySystemFamily[task.system_family] = (stats.tasksBySystemFamily[task.system_family] || 0) + 1;
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get task statistics:', error);
      throw error;
    }
  }
}