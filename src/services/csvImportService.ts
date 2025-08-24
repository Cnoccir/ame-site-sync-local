import { GoogleDriveService } from './googleDriveService';
import { AMEService } from './ameService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for importing CSV data from Google Sheets into Supabase tables
 */
export class CSVImportService {
  /**
   * Parse CSV text into array of objects
   */
  static parseCSV(csvText: string): Record<string, any>[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Handle quoted fields properly
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/"/g, '').trim());
    const rows: Record<string, any>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = parseCSVLine(lines[i]).map(v => v.replace(/"/g, '').trim());
      const row: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Convert common data types
        if (value === 'TRUE' || value === 'true' || value === '1') {
          row[header] = true;
        } else if (value === 'FALSE' || value === 'false' || value === '0') {
          row[header] = false;
        } else if (value && !isNaN(Number(value)) && value !== '') {
          row[header] = Number(value);
        } else {
          row[header] = value || null;
        }
      });
      
      if (Object.values(row).some(v => v !== null && v !== '')) {
        rows.push(row);
      }
    }
    
    return rows;
  }

  /**
   * Import customers data from CSV text
   */
  static async importCustomersFromCsv(csvData: string): Promise<{ success: number; errors: string[] }> {
    try {
      const customers = this.parseCSV(csvData);
      
      let success = 0;
      const errors: string[] = [];
      
      for (const customer of customers) {
        try {
          // Map CSV columns to database fields
          const customerData = {
            customer_id: customer.customer_id || customer.Customer_ID || customer.ID,
            company_name: customer.company_name || customer.Company_Name || customer.Company,
            site_name: customer.site_name || customer.Site_Name || customer.Site,
            site_address: customer.site_address || customer.Address || customer.Site_Address,
            service_tier: customer.service_tier || customer.Service_Tier || customer.Tier,
            system_type: customer.system_type || customer.System_Type || customer.System,
            contract_status: customer.contract_status || customer.Status || 'Active',
            building_type: customer.building_type || customer.Building_Type || customer.Type,
            primary_contact: customer.primary_contact || customer.Primary_Contact || customer.Contact,
            contact_phone: customer.contact_phone || customer.Phone || customer.Contact_Phone,
            contact_email: customer.contact_email || customer.Email || customer.Contact_Email,
            emergency_contact: customer.emergency_contact || customer.Emergency_Contact,
            emergency_phone: customer.emergency_phone || customer.Emergency_Phone,
            emergency_email: customer.emergency_email || customer.Emergency_Email,
            security_contact: customer.security_contact || customer.Security_Contact,
            security_phone: customer.security_phone || customer.Security_Phone,
            building_access_type: customer.building_access_type || customer.Access_Type,
            building_access_details: customer.building_access_details || customer.Access_Details,
            access_hours: customer.access_hours || customer.Access_Hours,
            ppe_required: customer.ppe_required || customer.PPE_Required || false,
            badge_required: customer.badge_required || customer.Badge_Required || false,
            training_required: customer.training_required || customer.Training_Required || false,
            remote_access: customer.remote_access || customer.Remote_Access || false,
            vpn_required: customer.vpn_required || customer.VPN_Required || false,
            remote_access_type: customer.remote_access_type || customer.Remote_Access_Type,
            vpn_details: customer.vpn_details || customer.VPN_Details,
            web_supervisor_url: customer.web_supervisor_url || customer.Web_Supervisor_URL,
            workbench_username: customer.workbench_username || customer.Workbench_Username,
            workbench_password: customer.workbench_password || customer.Workbench_Password,
            platform_username: customer.platform_username || customer.Platform_Username,
            platform_password: customer.platform_password || customer.Platform_Password,
            bms_supervisor_ip: customer.bms_supervisor_ip || customer.BMS_Supervisor_IP,
            safety_requirements: customer.safety_requirements || customer.Safety_Requirements,
            site_hazards: customer.site_hazards || customer.Site_Hazards,
            last_service: customer.last_service || customer.Last_Service,
            next_due: customer.next_due || customer.Next_Due,
            technician_assigned: customer.technician_assigned || customer.Technician_Assigned,
            region: customer.region || customer.Region,
            district: customer.district || customer.District,
            territory: customer.territory || customer.Territory,
            account_manager: customer.account_manager || customer.Account_Manager,
            technical_contact: customer.technical_contact || customer.Technical_Contact,
            technical_phone: customer.technical_phone || customer.Technical_Phone,
            technical_email: customer.technical_email || customer.Technical_Email,
            billing_contact: customer.billing_contact || customer.Billing_Contact,
            billing_phone: customer.billing_phone || customer.Billing_Phone,
            billing_email: customer.billing_email || customer.Billing_Email,
            contract_start_date: customer.contract_start_date || customer.Contract_Start,
            contract_end_date: customer.contract_end_date || customer.Contract_End,
            service_frequency: customer.service_frequency || customer.Service_Frequency,
            annual_contract_value: customer.annual_contract_value || customer.Contract_Value,
            payment_terms: customer.payment_terms || customer.Payment_Terms,
            escalation_contact: customer.escalation_contact || customer.Escalation_Contact,
            escalation_phone: customer.escalation_phone || customer.Escalation_Phone,
            special_instructions: customer.special_instructions || customer.Special_Instructions,
            site_timezone: customer.site_timezone || customer.Timezone
          };

          const { error } = await supabase
            .from('ame_customers')
            .upsert(customerData, { onConflict: 'customer_id' });
          
          if (error) {
            errors.push(`Customer ${customerData.customer_id}: ${error.message}`);
          } else {
            success++;
          }
        } catch (error) {
          errors.push(`Customer processing error: ${error}`);
        }
      }
      
      return { success, errors };
    } catch (error) {
      throw new Error(`Failed to import customers from CSV: ${error}`);
    }
  }

  /**
   * Import customers data from Google Sheets
   */
  static async importCustomers(): Promise<{ success: number; errors: string[] }> {
    try {
      const csvData = await GoogleDriveService.getCustomersData();
      return this.importCustomersFromCsv(csvData);
    } catch (error) {
      throw new Error(`Failed to import customers: ${error}`);
    }
  }

  /**
   * Import tasks data from CSV text
   */
  static async importTasksFromCsv(csvData: string): Promise<{ success: number; errors: string[] }> {
    try {
      const tasks = this.parseCSV(csvData);
      
      let success = 0;
      const errors: string[] = [];
      
      for (const task of tasks) {
        try {
          const taskData = {
            task_id: task.task_id || task.Task_ID || task.ID,
            task_name: task.task_name || task.Task_Name || task.Name,
            category: task.category || task.Category || 'General',
            service_tiers: this.parseArray(task.service_tiers || task.Service_Tiers || task.Tiers),
            duration: task.duration || task.Duration || task.estimated_time_minutes,
            phase: task.phase || task.Phase || 1,
            task_order: task.task_order || task.Order || 1,
            is_mandatory: task.is_mandatory || task.Mandatory || true,
            equipment_types: this.parseArray(task.equipment_types || task.Equipment_Types),
            estimated_time_minutes: task.estimated_time_minutes || task.Duration || task.Time,
            complexity_level: task.complexity_level || task.Complexity || 'standard',
            certification_required: this.parseArray(task.certification_required || task.Certifications),
            navigation_path: task.navigation_path || task.Navigation_Path || task.Path,
            sop_steps: task.sop_steps || task.SOP_Steps || task.Steps,
            tools_required: this.parseArray(task.tools_required || task.Tools_Required || task.Tools),
            quality_checks: task.quality_checks || task.Quality_Checks || task.QC,
            prerequisites: task.prerequisites || task.Prerequisites,
            skills_required: task.skills_required || task.Skills_Required || task.Skills,
            safety_notes: task.safety_notes || task.Safety_Notes || task.Safety,
            documentation_required: task.documentation_required || task.Documentation_Required || false,
            photo_required: task.photo_required || task.Photo_Required || false,
            frequency: task.frequency || task.Frequency || 'every_visit'
          };

          const { error } = await supabase
            .from('ame_tasks_normalized')
            .upsert(taskData, { onConflict: 'task_id' });
          
          if (error) {
            errors.push(`Task ${taskData.task_id}: ${error.message}`);
          } else {
            success++;
          }
        } catch (error) {
          errors.push(`Task processing error: ${error}`);
        }
      }
      
      return { success, errors };
    } catch (error) {
      throw new Error(`Failed to import tasks from CSV: ${error}`);
    }
  }

  /**
   * Import tasks data from Google Sheets
   */
  static async importTasks(): Promise<{ success: number; errors: string[] }> {
    try {
      const csvData = await GoogleDriveService.getTaskLibraryData();
      return this.importTasksFromCsv(csvData);
    } catch (error) {
      throw new Error(`Failed to import tasks: ${error}`);
    }
  }

  /**
   * Import tools data from CSV text
   */
  static async importToolsFromCsv(csvData: string): Promise<{ success: number; errors: string[] }> {
    try {
      const tools = this.parseCSV(csvData);
      
      let success = 0;
      const errors: string[] = [];
      
      for (const tool of tools) {
        try {
          const toolData = {
            tool_id: tool.tool_id || tool.Tool_ID || tool.ID,
            tool_name: tool.tool_name || tool.Tool_Name || tool.Name,
            category: tool.category || tool.Category || 'General',
            safety_category: tool.safety_category || tool.Safety_Category || 'Standard',
            is_consumable: tool.is_consumable || tool.Consumable || false,
            part_number: tool.part_number || tool.Part_Number,
            manufacturer: tool.manufacturer || tool.Manufacturer,
            model_number: tool.model_number || tool.Model_Number || tool.Model,
            current_stock: tool.current_stock || tool.Stock || 0,
            minimum_stock: tool.minimum_stock || tool.Min_Stock || 0,
            maximum_stock: tool.maximum_stock || tool.Max_Stock || 0,
            unit_cost: tool.unit_cost || tool.Cost,
            storage_location: tool.storage_location || tool.Location,
            calibration_required: tool.calibration_required || tool.Calibration_Required || false,
            calibration_frequency_months: tool.calibration_frequency_months || tool.Cal_Frequency,
            tool_status: tool.tool_status || tool.Status || 'active',
            typical_quantity: tool.typical_quantity || tool.Quantity || 1,
            reorder_point: tool.reorder_point || tool.Reorder_Point || 0,
            unit_of_measure: tool.unit_of_measure || tool.UOM || 'each',
            supplier: tool.supplier || tool.Supplier,
            notes: tool.notes || tool.Notes || tool.Description
          };

          const { error } = await supabase
            .from('ame_tools_normalized')
            .upsert(toolData, { onConflict: 'tool_id' });
          
          if (error) {
            errors.push(`Tool ${toolData.tool_id}: ${error.message}`);
          } else {
            success++;
          }
        } catch (error) {
          errors.push(`Tool processing error: ${error}`);
        }
      }
      
      return { success, errors };
    } catch (error) {
      throw new Error(`Failed to import tools from CSV: ${error}`);
    }
  }

  /**
   * Import tools data from Google Sheets
   */
  static async importTools(): Promise<{ success: number; errors: string[] }> {
    try {
      const csvData = await GoogleDriveService.getToolLibraryData();
      return this.importToolsFromCsv(csvData);
    } catch (error) {
      throw new Error(`Failed to import tools: ${error}`);
    }
  }

  /**
   * Import SOPs data from CSV text
   */
  static async importSOPsFromCsv(csvData: string): Promise<{ success: number; errors: string[] }> {
    try {
      const sops = this.parseCSV(csvData);
      
      let success = 0;
      const errors: string[] = [];
      
      for (const sop of sops) {
        try {
          const sopData = {
            sop_id: sop.sop_id || sop.SOP_ID || sop.ID,
            title: sop.sop_name || sop.SOP_Name || sop.Name || sop.title,
            category_id: sop.category || sop.Category || null,
            goal: sop.description || sop.Description,
            steps: this.parseJSON(sop.procedure_steps || sop.Steps),
            best_practices: sop.best_practices || sop.Best_Practices,
            tools_required: this.parseJSON(sop.tools_required || sop.Tools_Required || sop.Tools),
            hyperlinks: this.parseJSON(sop.hyperlinks || sop.Hyperlinks),
            version: sop.version || sop.Version || '1.0',
            estimated_duration_minutes: sop.estimated_duration || sop.Duration
          };

          const { error } = await supabase
            .from('ame_sops_normalized')
            .upsert(sopData, { onConflict: 'sop_id' });
          
          if (error) {
            errors.push(`SOP ${sopData.sop_id}: ${error.message}`);
          } else {
            success++;
          }
        } catch (error) {
          errors.push(`SOP processing error: ${error}`);
        }
      }
      
      return { success, errors };
    } catch (error) {
      throw new Error(`Failed to import SOPs from CSV: ${error}`);
    }
  }

  /**
   * Import SOPs data from Google Sheets
   */
  static async importSOPs(): Promise<{ success: number; errors: string[] }> {
    try {
      const csvData = await GoogleDriveService.getSopLibraryData();
      return this.importSOPsFromCsv(csvData);
    } catch (error) {
      throw new Error(`Failed to import SOPs: ${error}`);
    }
  }

  /**
   * Import service tier tasks data from CSV text
   */
  static async importServiceTierTasksFromCsv(csvData: string): Promise<{ success: number; errors: string[] }> {
    try {
      const serviceTierTasks = this.parseCSV(csvData);
      
      let success = 0;
      const errors: string[] = [];
      
      for (const task of serviceTierTasks) {
        try {
          const taskData = {
            service_tier: task.service_tier || task.Service_Tier || task.Tier,
            category: task.category || task.Category || 'General',
            task_name: task.task_name || task.Task_Name || task.Name,
            description: task.description || task.Description,
            estimated_duration: task.estimated_duration || task.Duration || task.estimated_duration_minutes || 30,
            is_required: task.is_required !== undefined ? task.is_required : (task.Is_Required !== undefined ? task.Is_Required : true),
            prerequisites: this.parseArray(task.prerequisites || task.Prerequisites),
            tools_required: this.parseArray(task.tools_required || task.Tools_Required || task.Tools),
            sop_content: this.parseJSON(task.sop_content || task.SOP_Content || '{}'),
            sort_order: task.sort_order || task.Sort_Order || task.Order || 0
          };

          const { error } = await supabase
            .from('service_tier_tasks')
            .insert(taskData);
          
          if (error) {
            errors.push(`Service Tier Task ${taskData.task_name}: ${error.message}`);
          } else {
            success++;
          }
        } catch (error) {
          errors.push(`Service Tier Task processing error: ${error}`);
        }
      }
      
      return { success, errors };
    } catch (error) {
      throw new Error(`Failed to import service tier tasks from CSV: ${error}`);
    }
  }

  /**
   * Import task procedures data from CSV text
   */
  static async importTaskProceduresFromCsv(csvData: string): Promise<{ success: number; errors: string[] }> {
    try {
      const procedures = this.parseCSV(csvData);
      
      let success = 0;
      const errors: string[] = [];
      
      for (const procedure of procedures) {
        try {
          const procedureData = {
            task_id: procedure.task_id || procedure.Task_ID,
            procedure_title: procedure.procedure_title || procedure.Title || procedure.SOP_Title,
            procedure_category: procedure.procedure_category || procedure.Category,
            procedure_steps: this.parseJSON(procedure.procedure_steps || procedure.Steps || '[]'),
            visual_guides: this.parseJSON(procedure.visual_guides || procedure.Visual_Guides || '[]'),
            additional_resources: this.parseJSON(procedure.additional_resources || procedure.Resources || '[]')
          };

          // Only insert if we have a valid task_id
          if (procedureData.task_id) {
            const { error } = await supabase
              .from('task_procedures')
              .insert(procedureData);
            
            if (error) {
              errors.push(`Task Procedure ${procedureData.procedure_title}: ${error.message}`);
            } else {
              success++;
            }
          } else {
            errors.push(`Task Procedure missing task_id: ${procedureData.procedure_title}`);
          }
        } catch (error) {
          errors.push(`Task Procedure processing error: ${error}`);
        }
      }
      
      return { success, errors };
    } catch (error) {
      throw new Error(`Failed to import task procedures from CSV: ${error}`);
    }
  }

  /**
   * Import visit tasks data from CSV text
   */
  static async importVisitTasksFromCsv(csvData: string): Promise<{ success: number; errors: string[] }> {
    try {
      const visitTasks = this.parseCSV(csvData);
      
      let success = 0;
      const errors: string[] = [];
      
      for (const visitTask of visitTasks) {
        try {
          const visitTaskData = {
            visit_id: visitTask.visit_id || visitTask.Visit_ID,
            task_id: visitTask.task_id || visitTask.Task_ID,
            status: visitTask.status || visitTask.Status || 'not_started',
            start_time: visitTask.start_time || visitTask.Start_Time,
            completion_time: visitTask.completion_time || visitTask.Completion_Time,
            actual_duration: visitTask.actual_duration || visitTask.Duration,
            notes: visitTask.notes || visitTask.Notes
          };

          // Only insert if we have required fields
          if (visitTaskData.visit_id && visitTaskData.task_id) {
            const { error } = await supabase
              .from('visit_tasks')
              .insert(visitTaskData);
            
            if (error) {
              errors.push(`Visit Task ${visitTaskData.visit_id}-${visitTaskData.task_id}: ${error.message}`);
            } else {
              success++;
            }
          } else {
            errors.push(`Visit Task missing required fields: visit_id or task_id`);
          }
        } catch (error) {
          errors.push(`Visit Task processing error: ${error}`);
        }
      }
      
      return { success, errors };
    } catch (error) {
      throw new Error(`Failed to import visit tasks from CSV: ${error}`);
    }
  }

  /**
   * Import all data from all CSV sources
   */
  static async importAllData(): Promise<{
    customers: { success: number; errors: string[] };
    tasks: { success: number; errors: string[] };
    tools: { success: number; errors: string[] };
    sops: { success: number; errors: string[] };
    serviceTierTasks: { success: number; errors: string[] };
    taskProcedures: { success: number; errors: string[] };
    visitTasks: { success: number; errors: string[] };
  }> {
    const results = {
      customers: { success: 0, errors: [] as string[] },
      tasks: { success: 0, errors: [] as string[] },
      tools: { success: 0, errors: [] as string[] },
      sops: { success: 0, errors: [] as string[] },
      serviceTierTasks: { success: 0, errors: [] as string[] },
      taskProcedures: { success: 0, errors: [] as string[] },
      visitTasks: { success: 0, errors: [] as string[] }
    };

    try {
      // Import existing data first
      const [customersResult, tasksResult, toolsResult, sopsResult] = await Promise.allSettled([
        this.importCustomers(),
        this.importTasks(),
        this.importTools(),
        this.importSOPs()
      ]);

      if (customersResult.status === 'fulfilled') {
        results.customers = customersResult.value;
      } else {
        results.customers.errors.push(`Import failed: ${customersResult.reason}`);
      }

      if (tasksResult.status === 'fulfilled') {
        results.tasks = tasksResult.value;
      } else {
        results.tasks.errors.push(`Import failed: ${tasksResult.reason}`);
      }

      if (toolsResult.status === 'fulfilled') {
        results.tools = toolsResult.value;
      } else {
        results.tools.errors.push(`Import failed: ${toolsResult.reason}`);
      }

      if (sopsResult.status === 'fulfilled') {
        results.sops = sopsResult.value;
      } else {
        results.sops.errors.push(`Import failed: ${sopsResult.reason}`);
      }

      // Note: The new service tier execution tables (service_tier_tasks, task_procedures, visit_tasks)
      // are populated by the migration sample data and don't have Google Sheets sources yet.
      // These would be populated from CSV files when available.
      results.serviceTierTasks = { success: 0, errors: ['No CSV source available - use migration sample data'] };
      results.taskProcedures = { success: 0, errors: ['No CSV source available - use migration sample data'] };
      results.visitTasks = { success: 0, errors: ['No CSV source available - use migration sample data'] };

      return results;
    } catch (error) {
      throw new Error(`Failed to import data: ${error}`);
    }
  }

  /**
   * Helper method to parse array-like strings
   */
  private static parseArray(value: any): string[] {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      // Handle semicolon, comma, or pipe separated values
      return value.split(/[;,|]/).map(v => v.trim()).filter(v => v);
    }
    return [];
  }

  /**
   * Helper method to parse JSON-like strings
   */
  private static parseJSON(value: any): any {
    if (!value) return [];
    if (typeof value === 'object') return value;
    if (typeof value === 'string') {
      try {
        return JSON.parse(value);
      } catch {
        // If not valid JSON, return as array of steps
        return value.split('\n').map(step => step.trim()).filter(step => step);
      }
    }
    return [];
  }
}
