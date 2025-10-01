import { supabase } from '@/integrations/supabase/client';

export interface DropdownOption {
  id: string;
  name: string;
  description?: string;
  category?: string;
  manufacturer?: string;
  display_order: number;
}

export interface GroupedDropdownOption {
  category: string;
  options: DropdownOption[];
}

export class DropdownDataService {
  /**
   * Get all building types
   */
  static async getBuildingTypes(): Promise<DropdownOption[]> {
    try {
      const { data, error } = await supabase
        .from('building_types')
        .select('id, type_name, description, display_order')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        name: item.type_name,
        description: item.description,
        display_order: item.display_order
      }));
    } catch (e) {
      console.warn('Building types not available; returning empty list');
      return [];
    }
  }

  /**
   * Get all system architectures
   */
  static async getSystemArchitectures(): Promise<DropdownOption[]> {
    try {
      const { data, error } = await supabase
        .from('system_architectures')
        .select('id, architecture_name, description, display_order')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        name: item.architecture_name,
        description: item.description,
        display_order: item.display_order
      }));
    } catch (e) {
      console.warn('System architectures not available; returning empty list');
      return [];
    }
  }

  /**
   * Get all BAS platforms
   */
  static async getBasPlatforms(): Promise<DropdownOption[]> {
    try {
      const { data, error } = await supabase
        .from('bas_platforms')
        .select('id, platform_name, platform_category, manufacturer, description, display_order')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        name: item.platform_name,
        category: item.platform_category,
        manufacturer: item.manufacturer,
        description: item.description,
        display_order: item.display_order
      }));
    } catch (e) {
      console.warn('BAS platforms not available; returning empty list');
      return [];
    }
  }

  /**
   * Get BAS platforms grouped by category
   */
  static async getBasPlatformsGrouped(): Promise<GroupedDropdownOption[]> {
    const platforms = await this.getBasPlatforms();
    
    const grouped = platforms.reduce((acc, platform) => {
      const category = platform.category || 'Other';
      const existingGroup = acc.find(g => g.category === category);
      
      if (existingGroup) {
        existingGroup.options.push(platform);
      } else {
        acc.push({
          category,
          options: [platform]
        });
      }
      
      return acc;
    }, [] as GroupedDropdownOption[]);
    
    // Sort groups by the minimum display_order in each group
    return grouped.sort((a, b) => {
      const minOrderA = Math.min(...a.options.map(opt => opt.display_order));
      const minOrderB = Math.min(...b.options.map(opt => opt.display_order));
      return minOrderA - minOrderB;
    });
  }

  /**
   * Get all contact roles
   */
  static async getContactRoles(): Promise<DropdownOption[]> {
    try {
      const { data, error } = await supabase
        .from('contact_roles')
        .select('id, role_name, description, display_order')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        name: item.role_name,
        description: item.description,
        display_order: item.display_order
      }));
    } catch (e) {
      console.warn('Contact roles not available; returning empty list');
      return [];
    }
  }

  /**
   * Get all access methods
   */
  static async getAccessMethods(): Promise<DropdownOption[]> {
    try {
      const { data, error } = await supabase
        .from('access_methods')
        .select('id, method_name, description, display_order')
        .eq('is_active', true)
        .order('display_order');
      if (error) throw error;
      return (data || []).map(item => ({
        id: item.id,
        name: item.method_name,
        description: item.description,
        display_order: item.display_order
      }));
    } catch (e) {
      console.warn('Access methods not available; returning empty list');
      return [];
    }
  }

  /**
   * Get all dropdown data at once (for form initialization)
   */
  static async getAllDropdownData() {
    const results = await Promise.allSettled([
      this.getBuildingTypes(),
      this.getSystemArchitectures(),
      this.getBasPlatforms(),
      this.getContactRoles(),
      this.getAccessMethods(),
      this.getActiveTechnicians()
    ]);

    const [buildingTypes, systemArchitectures, basPlatforms, contactRoles, accessMethods, technicians] = results.map(r => r.status === 'fulfilled' ? r.value : []);

    return {
      buildingTypes,
      systemArchitectures,
      basPlatforms,
      basPlatformsGrouped: (basPlatforms?.length ? (await this.getBasPlatformsGrouped()) : []),
      contactRoles,
      accessMethods,
      technicians
    };
  }

  /**
   * Get active technicians for dropdown
   */
  static async getActiveTechnicians(): Promise<DropdownOption[]> {
    const { data, error } = await supabase
      .from('ame_employees')
      .select('id, employee_name, email, mobile_phone, is_technician')
      .eq('is_active', true)
      .eq('is_technician', true)
      .order('employee_name');
    
    if (error) {
      console.error('Error fetching technicians:', error);
      throw error;
    }
    
    return (data || []).map(tech => ({
      id: tech.id,
      name: tech.employee_name,
      description: `${tech.email}${tech.mobile_phone ? ' • ' + tech.mobile_phone : ''}`,
      display_order: 0
    }));
  }

  /**
   * Cache management for dropdown data
   */
  private static cache = new Map<string, { data: any; timestamp: number }>();
  private static CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get cached data or fetch fresh data
   */
  static async getCachedDropdownData() {
    const cacheKey = 'all_dropdown_data';
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    
    const data = await this.getAllDropdownData();
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
    
    return data;
  }

  /**
   * Clear cache (useful after admin updates)
   */
  static clearCache() {
    this.cache.clear();
  }
}
