import { supabase } from '@/integrations/supabase/client';
import { Customer, Visit, Task, VisitTask, Tool, SOP, Report } from '@/types';

/**
 * Service for AME maintenance system database operations
 */
export class AMEService {
  
  // Customer operations
  static async getCustomers(): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('ame_customers')
      .select('*')
      .order('company_name');
    
    if (error) throw error;
    return (data || []) as Customer[];
  }
  
  static async getCustomer(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('ame_customers')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Customer;
  }
  
  static async createCustomer(customer: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('ame_customers')
      .insert(customer)
      .select()
      .single();
    
    if (error) throw error;
    return data as Customer;
  }
  
  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('ame_customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Customer;
  }
  
  static async deleteCustomer(id: string): Promise<void> {
    const { error } = await supabase
      .from('ame_customers')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }
  
  // Visit operations
  static async getVisits(): Promise<Visit[]> {
    const { data, error } = await supabase
      .from('ame_visits')
      .select('*')
      .order('visit_date', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Visit[];
  }
  
  static async getVisit(id: string): Promise<Visit | null> {
    const { data, error } = await supabase
      .from('ame_visits')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data as Visit;
  }
  
  static async createVisit(visit: Omit<Visit, 'id' | 'created_at' | 'updated_at'>): Promise<Visit> {
    const { data, error } = await supabase
      .from('ame_visits')
      .insert(visit)
      .select()
      .single();
    
    if (error) throw error;
    return data as Visit;
  }
  
  static async updateVisit(id: string, updates: Partial<Visit>): Promise<Visit> {
    const { data, error } = await supabase
      .from('ame_visits')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as Visit;
  }
  
  // Task operations
  static async getTasks(): Promise<Task[]> {
    const { data, error } = await supabase
      .from('ame_tasks')
      .select('*')
      .order('task_id');
    
    if (error) throw error;
    return (data || []) as Task[];
  }
  
  static async getTasksByServiceTier(serviceTier: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('ame_tasks')
      .select('*')
      .contains('service_tiers', [serviceTier])
      .order('task_id');
    
    if (error) throw error;
    return (data || []) as Task[];
  }
  
  static async createTask(task: Omit<Task, 'id'>): Promise<Task> {
    const { data, error } = await supabase
      .from('ame_tasks')
      .insert(task)
      .select()
      .single();
    
    if (error) throw error;
    return data as Task;
  }
  
  // Visit Task operations
  static async getVisitTasks(visitId: string): Promise<VisitTask[]> {
    const { data, error } = await supabase
      .from('ame_visit_tasks')
      .select('*')
      .eq('visit_id', visitId)
      .order('created_at');
    
    if (error) throw error;
    return (data || []) as VisitTask[];
  }
  
  static async updateVisitTask(id: string, updates: Partial<VisitTask>): Promise<VisitTask> {
    const { data, error } = await supabase
      .from('ame_visit_tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data as VisitTask;
  }
  
  // Tool operations
  static async getTools(): Promise<Tool[]> {
    const { data, error } = await supabase
      .from('ame_tools')
      .select('*')
      .order('tool_name');
    
    if (error) throw error;
    return (data || []) as Tool[];
  }
  
  static async createTool(tool: Omit<Tool, 'id' | 'created_at'>): Promise<Tool> {
    const { data, error } = await supabase
      .from('ame_tools')
      .insert(tool)
      .select()
      .single();
    
    if (error) throw error;
    return data as Tool;
  }
  
  // SOP operations
  static async getSOPs(): Promise<SOP[]> {
    const { data, error } = await supabase
      .from('ame_sops')
      .select('*')
      .order('sop_name');
    
    if (error) throw error;
    return (data || []) as SOP[];
  }
  
  static async createSOP(sop: Omit<SOP, 'id'>): Promise<SOP> {
    const { data, error } = await supabase
      .from('ame_sops')
      .insert(sop)
      .select()
      .single();
    
    if (error) throw error;
    return data as SOP;
  }
  
  // Report operations
  static async getReports(): Promise<Report[]> {
    const { data, error } = await supabase
      .from('ame_reports')
      .select('*')
      .order('generated_at', { ascending: false });
    
    if (error) throw error;
    return (data || []) as Report[];
  }
  
  static async createReport(report: Omit<Report, 'id'>): Promise<Report> {
    const { data, error } = await supabase
      .from('ame_reports')
      .insert(report)
      .select()
      .single();
    
    if (error) throw error;
    return data as Report;
  }
  
  // Utility methods
  static async generateCustomerId(): Promise<string> {
    const { data, error } = await supabase
      .from('ame_customers')
      .select('customer_id')
      .order('customer_id', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    if (!data || data.length === 0) {
      return 'CUST_001';
    }
    
    const lastId = data[0].customer_id;
    const num = parseInt(lastId.replace('CUST_', '')) + 1;
    return `CUST_${num.toString().padStart(3, '0')}`;
  }
  
  static async generateVisitId(): Promise<string> {
    const today = new Date().toISOString().split('T')[0].replace(/-/g, '');
    
    const { data, error } = await supabase
      .from('ame_visits')
      .select('visit_id')
      .like('visit_id', `VIS_${today}_%`)
      .order('visit_id', { ascending: false })
      .limit(1);
    
    if (error) throw error;
    
    let count = 1;
    if (data && data.length > 0) {
      const lastId = data[0].visit_id;
      const lastCount = parseInt(lastId.split('_')[2]);
      count = lastCount + 1;
    }
    
    return `VIS_${today}_${count.toString().padStart(3, '0')}`;
  }
}