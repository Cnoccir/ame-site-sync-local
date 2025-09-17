import { supabase } from '@/integrations/supabase/client';
import { errorHandler } from '@/utils/errorHandler';

export class PlanningService {
  /**
   * Generate visit task plan based on service tier and phase, then materialize into ame_visit_tasks.
   */
  static async planTasksForVisit(visitId: string, customerId: string, serviceTier: string, phase: number) {
    return errorHandler.withErrorHandling(async () => {
      // Fetch tasks matching tier and phase
      const { data: tasks, error } = await supabase
        .from('ame_tasks')
        .select('*')
        .contains('service_tiers', [serviceTier])
        .eq('phase', phase)
        .order('task_order', { ascending: true });

      if (error) throw errorHandler.handleSupabaseError(error, 'planTasksFetch');

      const inserts = (tasks || []).map(t => ({
        visit_id: visitId,
        task_id: (t as any).id,
        status: 'Pending' as const
      }));

      if (inserts.length === 0) return 0;

      const { error: insertError } = await supabase
        .from('ame_visit_tasks')
        .insert(inserts);

      if (insertError) throw errorHandler.handleSupabaseError(insertError, 'planTasksInsert');
      return inserts.length;
    }, 'planTasksForVisit', { additionalData: { visitId, serviceTier, phase } });
  }

  /**
   * Plan tools for a visit from tasks.tools_required and persist to visit_tools as is_planned=true
   */
  static async planToolsForVisit(visitId: string, serviceTier: string, phase: number) {
    return errorHandler.withErrorHandling(async () => {
      // Get tasks for this visit
      const { data: visitTasks, error: vterr } = await supabase
        .from('ame_visit_tasks')
        .select('task_id')
        .eq('visit_id', visitId);
      if (vterr) throw errorHandler.handleSupabaseError(vterr, 'planToolsVisitTasks');
      if (!visitTasks || visitTasks.length === 0) return 0;

      const taskIds = visitTasks.map(vt => vt.task_id);
      const { data: tasks, error: tfetch } = await supabase
        .from('ame_tasks')
        .select('tools_required, task_name, id')
        .in('id', taskIds as string[]);
      if (tfetch) throw errorHandler.handleSupabaseError(tfetch, 'planToolsTasks');

      const toolNames = new Set<string>();
      (tasks || []).forEach(t => {
        (t.tools_required || []).forEach((name: string) => toolNames.add(name));
      });

      if (toolNames.size === 0) return 0;

      // Try to match by tool_name
      const { data: tools, error: toolErr } = await supabase
        .from('ame_tools')
        .select('id, tool_name');
      if (toolErr) throw errorHandler.handleSupabaseError(toolErr, 'planToolsFetchTools');

      const toolsByName = new Map<string, string>();
      (tools || []).forEach(t => toolsByName.set((t.tool_name || '').toLowerCase(), t.id));

      const planned: { visit_id: string; tool_id: string; is_planned: boolean; is_used: boolean; quantity: number }[] = [];
      toolNames.forEach(name => {
        const id = toolsByName.get((name || '').toLowerCase());
        if (id) {
          planned.push({ visit_id: visitId, tool_id: id, is_planned: true, is_used: false, quantity: 1 });
        }
      });

      if (planned.length === 0) return 0;

      // Upsert by (visit_id, tool_id)
      const { error: insertToolsErr } = await supabase
        .from('visit_tools')
        .upsert(planned, { onConflict: 'visit_id,tool_id' });
      if (insertToolsErr) throw errorHandler.handleSupabaseError(insertToolsErr, 'planToolsInsert');

      return planned.length;
    }, 'planToolsForVisit', { additionalData: { visitId, phase } });
  }
}