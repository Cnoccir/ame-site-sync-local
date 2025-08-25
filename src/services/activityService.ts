import { supabase } from '@/integrations/supabase/client';

export interface ActivityLog {
  id: string;
  user_id: string;
  activity_type: string;
  description: string;
  entity_id?: string;
  entity_type?: string;
  metadata?: any;
  created_at: string;
}

export class ActivityService {
  static async logActivity(
    activityType: string,
    description: string,
    entityId?: string,
    entityType?: string,
    metadata?: any
  ): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('ame_activity_logs')
        .insert({
          user_id: user.id,
          activity_type: activityType,
          description,
          entity_id: entityId,
          entity_type: entityType,
          metadata: metadata || {}
        });

      if (error) {
        console.error('Failed to log activity:', error);
      }
    } catch (error) {
      console.error('Activity logging error:', error);
    }
  }

  static async getRecentActivities(limit: number = 10): Promise<ActivityLog[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('ame_activity_logs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch activities:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Activity fetch error:', error);
      return [];
    }
  }

  // Common activity logging methods
  static async logPhaseCompletion(phaseNumber: number, visitId: string, customerName: string) {
    await this.logActivity(
      'phase_completed',
      `Completed Phase ${phaseNumber} for ${customerName}`,
      visitId,
      'visit',
      { phase: phaseNumber, customer: customerName }
    );
  }

  static async logTaskStart(taskName: string, visitId: string, customerName: string) {
    await this.logActivity(
      'task_started',
      `Started task: ${taskName} for ${customerName}`,
      visitId,
      'task',
      { task: taskName, customer: customerName }
    );
  }

  static async logTaskCompletion(taskName: string, visitId: string, customerName: string) {
    await this.logActivity(
      'task_completed',
      `Completed task: ${taskName} for ${customerName}`,
      visitId,
      'task',
      { task: taskName, customer: customerName }
    );
  }

  static async logVisitStart(visitId: string, customerName: string) {
    await this.logActivity(
      'visit_started',
      `Started new visit for ${customerName}`,
      visitId,
      'visit',
      { customer: customerName }
    );
  }

  static async logVisitEnd(visitId: string, customerName: string) {
    await this.logActivity(
      'visit_completed',
      `Completed visit for ${customerName}`,
      visitId,
      'visit',
      { customer: customerName }
    );
  }
}