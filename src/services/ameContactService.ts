import { supabase } from '@/integrations/supabase/client';

export interface AMETechnician {
  id: string;
  technician_id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  employment_status?: string;
  service_regions?: string[];
  specializations?: string[];
  certifications?: string[];
  employee_id?: string;
}

export interface AMEContactSearchResult {
  id: string;
  name: string;
  role?: string;
  phone?: string;
  email?: string;
  technician_id?: string;
  service_regions?: string[];
  specializations?: string[];
  employment_status?: string;
}

export class AMEContactService {
  /**
   * Search AME technicians by name, email, or phone
   */
  static async searchTechnicians(query: string): Promise<AMEContactSearchResult[]> {
    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      const searchQuery = query.trim().toLowerCase();
      
      const { data, error } = await supabase
        .from('ame_employees')
        .select('id, employee_name, mobile_phone, email, extension, direct_line, is_active')
        .eq('is_active', true)
        .or(`employee_name.ilike.%${searchQuery}%,email.ilike.%${searchQuery}%,mobile_phone.ilike.%${searchQuery}%`)
        .order('employee_name', { ascending: true })
        .limit(20);

      if (error) {
        console.error('Error searching AME technicians:', error);
        return [];
      }

      return (data || []).map(tech => ({
        id: tech.id,
        name: tech.employee_name,
        role: 'Technician',
        phone: tech.mobile_phone,
        email: tech.email,
        technician_id: tech.id,
        employment_status: 'Active'
      }));
    } catch (error) {
      console.error('Error in searchTechnicians:', error);
      return [];
    }
  };

  /**
   * Get all active technicians for dropdown selection
   */
  static async getTechnicians(): Promise<AMEContactSearchResult[]> {
    try {
      const { data, error } = await supabase
        .from('ame_employees')
        .select('id, employee_name, mobile_phone, email, extension, direct_line, is_active, is_technician')
        .eq('is_active', true)
        .eq('is_technician', true)
        .order('employee_name', { ascending: true });

      if (error) {
        console.error('Error fetching technicians:', error);
        return [];
      }

      return (data || []).map(tech => ({
        id: tech.id,
        name: tech.employee_name,
        role: 'Technician',
        phone: tech.mobile_phone,
        email: tech.email,
        technician_id: tech.id,
        employment_status: 'Active',
        extension: tech.extension
      }));
    } catch (error) {
      console.error('Error in getTechnicians:', error);
      return [];
    }
  };

  /**
   * Get account managers from profiles table (fallback)
   */
  static async getAccountManagers(): Promise<AMEContactSearchResult[]> {
    try {
      // Try ame_employees first, fallback to profiles if it doesn't exist
      const { data: employeesData, error: employeesError } = await supabase
        .from('ame_employees')
        .select('id, employee_name, mobile_phone, email, extension, direct_line, role, is_active')
        .eq('is_active', true)
        .or('role.ilike.%Account Manager%,role.ilike.%Sales%,role.ilike.%Manager%')
        .order('employee_name', { ascending: true });

      if (!employeesError && employeesData && employeesData.length > 0) {
        return employeesData.map(emp => ({
          id: emp.id,
          name: emp.employee_name,
          role: emp.role,
          phone: emp.mobile_phone,
          email: emp.email
        }));
      }

      console.log('ame_employees table not found or empty, falling back to profiles');
      
      // Fallback to profiles table
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, role, email')
        .in('role', ['admin', 'manager'])
        .order('full_name', { ascending: true });

      if (profilesError) {
        console.error('Error fetching account managers from profiles:', profilesError);
        return [];
      }

      return (profilesData || []).map(profile => ({
        id: profile.id,
        name: profile.full_name || 'Unknown',
        role: profile.role === 'admin' ? 'Administrator' : 'Manager',
        phone: '',
        email: profile.email
      }));
    } catch (error) {
      console.error('Error in getAccountManagers:', error);
      return [];
    }
  };

  /**
   * Get technician by ID
   */
  static async getTechnicianById(id: string): Promise<AMEContactSearchResult | null> {
    try {
      const { data, error } = await supabase
        .from('ame_employees')
        .select('id, employee_name, mobile_phone, email, extension, direct_line, is_active')
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        console.error('Error fetching technician by ID:', error);
        return null;
      }

      if (!data) return null;

      return {
        id: data.id,
        name: data.employee_name,
        role: 'Technician',
        phone: data.mobile_phone,
        email: data.email,
        technician_id: data.id,
        employment_status: 'Active'
      };
    } catch (error) {
      console.error('Error in getTechnicianById:', error);
      return null;
    }
  };

  /**
   * Search employees by role/department
   */
  static async searchByRole(role: string): Promise<AMEContactSearchResult[]> {
    if (!role || role.trim().length < 2) {
      return [];
    }

    try {
      const { data, error } = await supabase
        .from('ame_employees')
        .select('id, employee_name, mobile_phone, email, extension, direct_line, role, is_technician')
        .eq('is_active', true)
        .ilike('role', `%${role.trim()}%`)
        .order('employee_name', { ascending: true });

      if (error) {
        console.error('Error searching employees by role:', error);
        return [];
      }

      return (data || []).map(emp => ({
        id: emp.id,
        name: emp.employee_name,
        role: emp.role,
        phone: emp.mobile_phone,
        email: emp.email,
        extension: emp.extension,
        direct_line: emp.direct_line,
        is_technician: emp.is_technician
      }));
    } catch (error) {
      console.error('Error in searchByRole:', error);
      return [];
    }
  }

  /**
   * Format contact information for display
   */
  static formatContactInfo(contact: AMEContactSearchResult): string {
    const parts: string[] = [];
    
    if (contact.phone) {
      parts.push(`📱 ${contact.phone}`);
    }
    
    if (contact.email) {
      parts.push(`📧 ${contact.email}`);
    }
    
    return parts.join(' • ');
  };

  /**
   * Get contact options formatted for SearchableCombobox
   */
  static formatForCombobox(contacts: AMEContactSearchResult[]) {
    return contacts.map(contact => ({
      id: contact.id,
      name: contact.name,
      description: this.formatContactInfo(contact),
      subtitle: contact.role || 'Technician'
    }));
  };

  /**
   * Advanced search with multiple criteria
   */
  static async advancedSearch(criteria: {
    name?: string;
    role?: string;
    department?: string;
    technicianOnly?: boolean;
  }): Promise<AMEContactSearchResult[]> {
    try {
      let query = supabase
        .from('ame_employees')
        .select('id, employee_name, mobile_phone, email, extension, direct_line, role, is_technician')
        .eq('is_active', true);

      if (criteria.name) {
        query = query.ilike('employee_name', `%${criteria.name}%`);
      }

      if (criteria.role) {
        query = query.ilike('role', `%${criteria.role}%`);
      }

      if (criteria.department) {
        query = query.ilike('department', `%${criteria.department}%`);
      }

      if (criteria.technicianOnly) {
        query = query.eq('is_technician', true);
      }

      query = query.order('employee_name', { ascending: true }).limit(50);

      const { data, error } = await query;

      if (error) {
        console.error('Error in advanced search:', error);
        return [];
      }

      return (data || []).map(emp => ({
        id: emp.id,
        name: emp.employee_name,
        role: emp.role,
        phone: emp.mobile_phone,
        email: emp.email,
        extension: emp.extension,
        direct_line: emp.direct_line,
        is_technician: emp.is_technician
      }));
    } catch (error) {
      console.error('Error in advancedSearch:', error);
      return [];
    }
  }
}
