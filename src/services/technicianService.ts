/**
 * Technician Service - Handles technician data and search
 * Uses the real AME employee database
 */

import { supabase } from '@/integrations/supabase/client';

export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string; // Job role from employee database
  department?: string;
  extension?: string;
  direct_line?: string;
  is_technician: boolean;
  isActive: boolean;
}

export class TechnicianService {

  /**
   * Search technicians by name, email, or role
   */
  static async searchTechnicians(query: string): Promise<Technician[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const searchTerm = query.toLowerCase().trim();

      const { data, error } = await supabase
        .from('ame_employees')
        .select('*')
        .eq('is_active', true)
        .or(`employee_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,role.ilike.%${searchTerm}%`)
        .order('is_technician', { ascending: false })
        .order('employee_name');

      if (error) {
        console.error('Error searching technicians:', error);
        return [];
      }

      return data.map(emp => ({
        id: emp.id,
        name: emp.employee_name,
        email: emp.email || '',
        phone: emp.mobile_phone || emp.direct_line || '',
        role: emp.role || '',
        department: emp.department || '',
        extension: emp.extension || '',
        direct_line: emp.direct_line || '',
        is_technician: emp.is_technician || false,
        isActive: emp.is_active
      }));
    } catch (error) {
      console.error('Error searching technicians:', error);
      return [];
    }
  }

  /**
   * Get all active technicians (prioritize is_technician = true)
   */
  static async getAllActiveTechnicians(): Promise<Technician[]> {
    try {
      const { data, error } = await supabase
        .from('ame_employees')
        .select('*')
        .eq('is_active', true)
        .order('is_technician', { ascending: false })
        .order('employee_name');

      if (error) {
        console.error('Error fetching technicians:', error);
        return [];
      }

      return data.map(emp => ({
        id: emp.id,
        name: emp.employee_name,
        email: emp.email || '',
        phone: emp.mobile_phone || emp.direct_line || '',
        role: emp.role || '',
        department: emp.department || '',
        extension: emp.extension || '',
        direct_line: emp.direct_line || '',
        is_technician: emp.is_technician || false,
        isActive: emp.is_active
      }));
    } catch (error) {
      console.error('Error fetching technicians:', error);
      return [];
    }
  }

  /**
   * Get technician by ID
   */
  static async getTechnicianById(id: string): Promise<Technician | null> {
    if (!id) return null;

    try {
      const { data, error } = await supabase
        .from('ame_employees')
        .select('*')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        return null;
      }

      return {
        id: data.id,
        name: data.employee_name,
        email: data.email || '',
        phone: data.mobile_phone || data.direct_line || '',
        role: data.role || '',
        department: data.department || '',
        extension: data.extension || '',
        direct_line: data.direct_line || '',
        is_technician: data.is_technician || false,
        isActive: data.is_active
      };
    } catch (error) {
      console.error('Error fetching technician by ID:', error);
      return null;
    }
  }

  /**
   * Get technicians by role
   */
  static async getTechniciansByRole(role: string): Promise<Technician[]> {
    try {
      const { data, error } = await supabase
        .from('ame_employees')
        .select('*')
        .eq('is_active', true)
        .ilike('role', `%${role}%`)
        .order('is_technician', { ascending: false })
        .order('employee_name');

      if (error) {
        console.error('Error fetching technicians by role:', error);
        return [];
      }

      return data.map(emp => ({
        id: emp.id,
        name: emp.employee_name,
        email: emp.email || '',
        phone: emp.mobile_phone || emp.direct_line || '',
        role: emp.role || '',
        department: emp.department || '',
        extension: emp.extension || '',
        direct_line: emp.direct_line || '',
        is_technician: emp.is_technician || false,
        isActive: emp.is_active
      }));
    } catch (error) {
      console.error('Error fetching technicians by role:', error);
      return [];
    }
  }

  /**
   * Format technician display name
   */
  static formatTechnicianName(tech: Technician): string {
    return `${tech.name} (${tech.role})`;
  }

  /**
   * Format technician for dropdown display
   */
  static formatTechnicianDropdown(tech: Technician): string {
    const parts = [tech.name];
    if (tech.role) parts.push(tech.role);
    if (tech.department) parts.push(tech.department);
    return parts.join(' • ');
  }

  /**
   * Get only field technicians
   */
  static async getFieldTechnicians(): Promise<Technician[]> {
    try {
      const { data, error } = await supabase
        .from('ame_employees')
        .select('*')
        .eq('is_active', true)
        .eq('is_technician', true)
        .order('employee_name');

      if (error) {
        console.error('Error fetching field technicians:', error);
        return [];
      }

      return data.map(emp => ({
        id: emp.id,
        name: emp.employee_name,
        email: emp.email || '',
        phone: emp.mobile_phone || emp.direct_line || '',
        role: emp.role || '',
        department: emp.department || '',
        extension: emp.extension || '',
        direct_line: emp.direct_line || '',
        is_technician: emp.is_technician || false,
        isActive: emp.is_active
      }));
    } catch (error) {
      console.error('Error fetching field technicians:', error);
      return [];
    }
  }

}

export default TechnicianService;
