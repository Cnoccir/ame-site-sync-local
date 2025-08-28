import { supabase } from '@/integrations/supabase/client';
import { Technician } from '@/types/technician';

export class TechnicianService {
  /**
   * Get all active technicians
   */
  static async getActiveTechnicians(): Promise<Technician[]> {
    const { data, error } = await supabase
      .from('ame_technicians')
      .select('*')
      .eq('is_active', true)
      .order('employee_name');
    
    if (error) {
      console.error('Error fetching technicians:', error);
      throw error;
    }
    
    return data as Technician[];
  }

  /**
   * Get technician by ID
   */
  static async getTechnician(id: string): Promise<Technician | null> {
    const { data, error } = await supabase
      .from('ame_technicians')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      console.error('Error fetching technician:', error);
      throw error;
    }
    
    return data as Technician;
  }

  /**
   * Search technicians by name
   */
  static async searchTechnicians(query: string): Promise<Technician[]> {
    const { data, error } = await supabase
      .from('ame_technicians')
      .select('*')
      .eq('is_active', true)
      .ilike('employee_name', `%${query}%`)
      .order('employee_name')
      .limit(10);
    
    if (error) {
      console.error('Error searching technicians:', error);
      throw error;
    }
    
    return data as Technician[];
  }

  /**
   * Get technicians by IDs (for display names)
   */
  static async getTechniciansByIds(ids: (string | null)[]): Promise<Record<string, Technician>> {
    const validIds = ids.filter(id => id !== null) as string[];
    
    if (validIds.length === 0) {
      return {};
    }

    const { data, error } = await supabase
      .from('ame_technicians')
      .select('*')
      .in('id', validIds);
    
    if (error) {
      console.error('Error fetching technicians by IDs:', error);
      throw error;
    }
    
    return data.reduce((acc, tech) => {
      acc[tech.id] = tech;
      return acc;
    }, {} as Record<string, Technician>);
  }
}
