import { GoogleDriveService } from './googleDriveService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for importing CSV data into Supabase normalized tables
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
            navigation_path: task.navigation_path || task.Navigation_Path || task.Path,
            sop_steps: task.sop_steps || task.SOP_Steps || task.Steps,
            sop_template_sheet: task.sop_template_sheet || task.SOP_Template_Sheet,
            quality_checks: task.quality_checks || task.Quality_Checks || task.QC,
            prerequisites: task.prerequisites || task.Prerequisites,
            skills_required: task.skills_required || task.Skills_Required || task.Skills,
            safety_notes: task.safety_notes || task.Safety_Notes || task.Safety,
            duration_minutes: task.duration_minutes || task.Duration || task.Time || 30,
            phase: task.phase || task.Phase || 1,
            task_order: task.task_order || task.Order || 1,
            is_mandatory: task.is_mandatory !== undefined ? task.is_mandatory : (task.Mandatory !== undefined ? task.Mandatory : true),
            version: task.version || task.Version || '1.0'
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
            description: tool.description || tool.Description,
            safety_category: tool.safety_category || tool.Safety_Category || 'standard',
            vendor_link: tool.vendor_link || tool.Vendor_Link,
            request_method: tool.request_method || tool.Request_Method,
            alternative_tools: tool.alternative_tools || tool.Alternative_Tools,
            maintenance_notes: tool.maintenance_notes || tool.Maintenance_Notes,
            calibration_required: tool.calibration_required !== undefined ? tool.calibration_required : (tool.Calibration_Required !== undefined ? tool.Calibration_Required : false),
            cost_estimate: tool.cost_estimate || tool.Cost_Estimate,
            current_stock: tool.current_stock || tool.Stock || 0,
            minimum_stock: tool.minimum_stock || tool.Min_Stock || 0,
            status: tool.status || tool.Status || 'active'
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
            title: sop.title || sop.Title || sop.SOP_Name || sop.Name,
            goal: sop.goal || sop.Goal || sop.description || sop.Description,
            steps: this.parseJSON(sop.steps || sop.Steps || sop.procedure_steps),
            best_practices: sop.best_practices || sop.Best_Practices,
            tools_required: this.parseJSON(sop.tools_required || sop.Tools_Required || sop.Tools),
            hyperlinks: this.parseJSON(sop.hyperlinks || sop.Hyperlinks),
            version: sop.version || sop.Version || '1.0',
            estimated_duration_minutes: sop.estimated_duration_minutes || sop.estimated_duration || sop.Duration || 30
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
   * Import all data from Google Sheets
   */
  static async importAllData(): Promise<{
    tasks: { success: number; errors: string[] };
    tools: { success: number; errors: string[] };
    sops: { success: number; errors: string[] };
  }> {
    try {
      const [
        tasksResult,
        toolsResult,
        sopsResult
      ] = await Promise.all([
        this.importTasks(),
        this.importTools(),
        this.importSOPs()
      ]);

      return {
        tasks: tasksResult,
        tools: toolsResult,
        sops: sopsResult
      };
    } catch (error) {
      throw new Error(`Failed to import all data: ${error}`);
    }
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
