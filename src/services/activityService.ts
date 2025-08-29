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

      // Use ame_audit_logs instead of non-existent table
      const { error } = await supabase
        .from('ame_audit_logs')
        .insert({
          user_id: user.id,
          action: activityType,
          entity_type: entityType,
          entity_id: entityId,
          changes: metadata || {}
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

      // Use ame_audit_logs instead of non-existent table
      const { data, error } = await supabase
        .from('ame_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Failed to fetch activities:', error);
        return [];
      }

      // Transform audit logs to activity logs format
      return (data || []).map(log => ({
        id: log.id,
        user_id: log.user_id || 'system',
        activity_type: log.action,
        description: `${log.action} on ${log.entity_type || 'unknown'}`,
        created_at: log.created_at,
        entity_id: log.entity_id,
        entity_type: log.entity_type,
        metadata: log.changes
      }));
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