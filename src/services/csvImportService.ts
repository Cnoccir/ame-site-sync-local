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
   * Import customers data from Google Sheets
   */
  static async importCustomers(): Promise<{ success: number; errors: string[] }> {
    try {
      const csvData = await GoogleDriveService.getCustomersData();
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
      throw new Error(`Failed to import customers: ${error}`);
    }
  }

  /**
   * Import tasks data from Google Sheets
   */
  static async importTasks(): Promise<{ success: number; errors: string[] }> {
    try {
      const csvData = await GoogleDriveService.getTaskLibraryData();
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
            .from('ame_tasks')
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
      throw new Error(`Failed to import tasks: ${error}`);
    }
  }

  /**
   * Import tools data from Google Sheets
   */
  static async importTools(): Promise<{ success: number; errors: string[] }> {
    try {
      const csvData = await GoogleDriveService.getToolLibraryData();
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
            .from('ame_tools')
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
      throw new Error(`Failed to import tools: ${error}`);
    }
  }

  /**
   * Import SOPs data from Google Sheets
   */
  static async importSOPs(): Promise<{ success: number; errors: string[] }> {
    try {
      const csvData = await GoogleDriveService.getSopLibraryData();
      const sops = this.parseCSV(csvData);
      
      let success = 0;
      const errors: string[] = [];
      
      for (const sop of sops) {
        try {
          const sopData = {
            sop_id: sop.sop_id || sop.SOP_ID || sop.ID,
            sop_name: sop.sop_name || sop.SOP_Name || sop.Name,
            category: sop.category || sop.Category || 'General',
            system_type: sop.system_type || sop.System_Type || sop.System,
            description: sop.description || sop.Description,
            version: sop.version || sop.Version || '1.0',
            revision_number: sop.revision_number || sop.Revision || '1.0',
            estimated_duration: sop.estimated_duration || sop.Duration,
            safety_requirements: this.parseArray(sop.safety_requirements || sop.Safety_Requirements),
            tools_required: this.parseArray(sop.tools_required || sop.Tools_Required || sop.Tools),
            procedure_steps: this.parseJSON(sop.procedure_steps || sop.Steps),
            compliance_standard: sop.compliance_standard || sop.Standard,
            training_required: sop.training_required || sop.Training_Required || false,
            certification_level: sop.certification_level || sop.Certification_Level,
            risk_level: sop.risk_level || sop.Risk_Level || 'low',
            environmental_conditions: sop.environmental_conditions || sop.Environmental_Conditions,
            frequency_of_use: sop.frequency_of_use || sop.Frequency,
            document_path: sop.document_path || sop.Document_Path,
            video_url: sop.video_url || sop.Video_URL,
            prerequisites: this.parseArray(sop.prerequisites || sop.Prerequisites)
          };

          const { error } = await supabase
            .from('ame_sops')
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
      throw new Error(`Failed to import SOPs: ${error}`);
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
  }> {
    const results = {
      customers: { success: 0, errors: [] as string[] },
      tasks: { success: 0, errors: [] as string[] },
      tools: { success: 0, errors: [] as string[] },
      sops: { success: 0, errors: [] as string[] }
    };

    try {
      // Import in parallel for efficiency
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