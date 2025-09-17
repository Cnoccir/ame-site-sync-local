import { supabase } from '@/integrations/supabase/client';
import { errorHandler } from '@/utils/errorHandler';

export class AssessmentService {
  /**
   * Ensure an assessment record exists and autosave arbitrary data
   */
  static async autoSave(customerId: string, visitId: string, data: any): Promise<string | null> {
    return errorHandler.withErrorHandling(async () => {
      const { data: recId, error } = await supabase.rpc('upsert_visit_assessment', {
        p_customer_id: customerId,
        p_visit_id: visitId,
        p_section_name: null,
        p_section_data: data
      });
      if (error) throw errorHandler.handleSupabaseError(error, 'assessmentAutoSave');
      return (recId as any) ?? null;
    }, 'assessmentAutoSave', { additionalData: { customerId, visitId } });
  }

  /**
   * Save a specific section by name
   */
  static async saveSection(
    customerId: string,
    visitId: string,
    sectionName: 'site_contact' | 'safety' | 'system_access' | 'network_inventory' | 'system_status' | 'priority',
    sectionData: any
  ): Promise<string | null> {
    return errorHandler.withErrorHandling(async () => {
      const { data: recId, error } = await supabase.rpc('upsert_visit_assessment', {
        p_customer_id: customerId,
        p_visit_id: visitId,
        p_section_name: sectionName,
        p_section_data: sectionData
      });
      if (error) throw errorHandler.handleSupabaseError(error, 'assessmentSaveSection');
      return (recId as any) ?? null;
    }, 'assessmentSaveSection', { additionalData: { customerId, visitId, sectionName } });
  }

  static async get(visitId: string): Promise<any | null> {
    const { data, error } = await supabase
      .from('visit_assessment')
      .select('*')
      .eq('visit_id', visitId)
      .maybeSingle();
    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  }
}