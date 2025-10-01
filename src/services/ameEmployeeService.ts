import { supabase } from '@/integrations/supabase/client';
import { logger } from '../utils/logger';

export interface AMEEmployee {
  id: string;
  technician_id?: string;
  user_id?: string;
  first_name?: string;
  last_name?: string;
  employee_name?: string;
  employee_id?: string;
  email?: string;
  phone?: string;
  mobile_phone?: string;
  direct_line?: string;
  extension?: string;
  role?: string;
  department?: string;
  hire_date?: string;
  employment_status?: string;
  is_active?: boolean;
  is_technician?: boolean;
  certifications?: string[];
  specializations?: string[];
  service_regions?: string[];
  max_concurrent_visits?: number;
  travel_radius_miles?: number;
  hourly_rate?: number;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  vehicle_info?: Record<string, any>;
  created_at?: string;
  updated_at?: string;
}

export interface AMEEmployeeSearchResult extends AMEEmployee {
  display_name?: string;
  contact_info?: string;
  similarity_score?: number;
}

export class AMEEmployeeService {
  /**
   * Search employees by name, email, or role
   */
  static async searchEmployees(query: string): Promise<AMEEmployeeSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      logger.info('Searching AME employees', { query });

      const { data, error } = await supabase
        .from('ame_employees')
        .select('*')
        .or(`
          first_name.ilike.%${query}%,
          last_name.ilike.%${query}%,
          employee_name.ilike.%${query}%,
          email.ilike.%${query}%,
          role.ilike.%${query}%,
          department.ilike.%${query}%
        `)
        .eq('is_active', true)
        .order('employee_name');

      if (error) {
        logger.error('Error searching employees:', error);
        throw error;
      }

      return (data || []).map(employee => ({
        ...employee,
        display_name: this.getDisplayName(employee),
        contact_info: this.getContactInfo(employee),
        similarity_score: this.calculateSimilarity(query, employee)
      }));
    } catch (error) {
      logger.error('Failed to search employees:', error);
      throw error;
    }
  }

  /**
   * Get all technicians
   */
  static async getTechnicians(): Promise<AMEEmployee[]> {
    try {
      const { data, error } = await supabase
        .from('ame_employees')
        .select('*')
        .eq('is_technician', true)
        .eq('is_active', true)
        .order('employee_name');

      if (error) {
        logger.error('Error fetching technicians:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to fetch technicians:', error);
      throw error;
    }
  }

  /**
   * Get employees by role
   */
  static async getEmployeesByRole(role: string): Promise<AMEEmployee[]> {
    try {
      const { data, error } = await supabase
        .from('ame_employees')
        .select('*')
        .ilike('role', `%${role}%`)
        .eq('is_active', true)
        .order('employee_name');

      if (error) {
        logger.error('Error fetching employees by role:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to fetch employees by role:', error);
      throw error;
    }
  }

  /**
   * Get employee by ID
   */
  static async getEmployeeById(id: string): Promise<AMEEmployee | null> {
    try {
      const { data, error } = await supabase
        .from('ame_employees')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Employee not found
        }
        throw error;
      }

      return data;
    } catch (error) {
      logger.error('Failed to fetch employee by ID:', error);
      throw error;
    }
  }

  /**
   * Get all account managers
   */
  static async getAccountManagers(): Promise<AMEEmployee[]> {
    try {
      // Show all active employees; caller can filter as needed in UI
      const { data, error } = await supabase
        .from('ame_employees')
        .select('*')
        .eq('is_active', true)
        .order('employee_name');

      if (error) {
        logger.error('Error fetching account managers:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      logger.error('Failed to fetch account managers:', error);
      throw error;
    }
  }

  /**
   * Get employees for dropdown selection
   */
  static async getEmployeesForDropdown(): Promise<Array<{ id: string; name: string; role?: string; email?: string }>> {
    try {
      const { data, error } = await supabase
        .from('ame_employees')
        .select('id, employee_name, first_name, last_name, role, email')
        .eq('is_active', true)
        .order('employee_name');

      if (error) {
        logger.error('Error fetching employees for dropdown:', error);
        throw error;
      }

      return (data || []).map(employee => ({
        id: employee.id,
        name: this.getDisplayName(employee),
        role: employee.role,
        email: employee.email
      }));
    } catch (error) {
      logger.error('Failed to fetch employees for dropdown:', error);
      throw error;
    }
  }

  /**
   * Get display name for an employee
   */
  static getDisplayName(employee: Partial<AMEEmployee>): string {
    if (employee.employee_name) {
      return employee.employee_name;
    }

    if (employee.first_name && employee.last_name) {
      return `${employee.first_name} ${employee.last_name}`;
    }

    if (employee.first_name) {
      return employee.first_name;
    }

    if (employee.email) {
      return employee.email;
    }

    return 'Unknown Employee';
  }

  /**
   * Get contact information for an employee
   */
  static getContactInfo(employee: Partial<AMEEmployee>): string {
    const parts = [];

    if (employee.email) {
      parts.push(employee.email);
    }

    if (employee.mobile_phone) {
      parts.push(employee.mobile_phone);
    } else if (employee.phone) {
      parts.push(employee.phone);
    }

    if (employee.role) {
      parts.push(employee.role);
    }

    return parts.join(' • ');
  }

  /**
   * Calculate similarity score for search results
   */
  private static calculateSimilarity(query: string, employee: Partial<AMEEmployee>): number {
    const searchTerm = query.toLowerCase();
    let score = 0;

    // Check for exact matches (highest score)
    const fields = [
      employee.employee_name,
      employee.first_name,
      employee.last_name,
      employee.email,
      employee.role
    ];

    for (const field of fields) {
      if (field) {
        const fieldLower = field.toLowerCase();
        if (fieldLower === searchTerm) {
          score += 1.0;
        } else if (fieldLower.startsWith(searchTerm)) {
          score += 0.8;
        } else if (fieldLower.includes(searchTerm)) {
          score += 0.6;
        }
      }
    }

    return Math.min(score, 1.0); // Cap at 1.0
  }

  /**
   * Get employee statistics
   */
  static async getEmployeeStatistics(): Promise<{
    totalEmployees: number;
    activeTechnicians: number;
    employeesByRole: Record<string, number>;
    employeesByDepartment: Record<string, number>;
  }> {
    try {
      const { data, error } = await supabase
        .from('ame_employees')
        .select('is_active, is_technician, role, department');

      if (error) throw error;

      const stats = {
        totalEmployees: 0,
        activeTechnicians: 0,
        employeesByRole: {} as Record<string, number>,
        employeesByDepartment: {} as Record<string, number>
      };

      data.forEach(employee => {
        if (employee.is_active) {
          stats.totalEmployees++;

          if (employee.is_technician) {
            stats.activeTechnicians++;
          }

          if (employee.role) {
            stats.employeesByRole[employee.role] = (stats.employeesByRole[employee.role] || 0) + 1;
          }

          if (employee.department) {
            stats.employeesByDepartment[employee.department] = (stats.employeesByDepartment[employee.department] || 0) + 1;
          }
        }
      });

      return stats;
    } catch (error) {
      logger.error('Failed to get employee statistics:', error);
      throw error;
    }
  }
}