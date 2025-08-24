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
            task_id: task.Task_ID,
            task_name: task.Task_Name,
            navigation_path: task.Navigation_Path,
            sop_steps: task.SOP_Steps,
            sop_template_sheet: task.SOP_Template_Sheet,
            quality_checks: task.Quality_Checks,
            prerequisites: task.Prerequisites,
            skills_required: task.Skills_Required,
            safety_notes: task.Safety_Notes,
            duration_minutes: parseInt(task.Duration) || 30,
            phase: 1, // Default phase
            task_order: 1, // Default order  
            is_mandatory: true, // Default mandatory
            version: task.Version || '1.0'
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
            tool_id: tool.Tool_ID || tool.tool_id || tool.ID,
            tool_name: tool.Tool_Name || tool.tool_name || tool.Name,
            description: tool.Description || tool.description || tool.Notes,
            safety_category: tool.Safety_Category || tool.safety_category || tool.Safety || 'standard',
            vendor_link: tool.Vendor_Link || tool.vendor_link || tool.Link,
            request_method: tool.Request_Method || tool.request_method || tool.Method,
            alternative_tools: tool.Alternative_Tools || tool.alternative_tools || tool.Alternatives,
            maintenance_notes: tool.Maintenance_Notes || tool.maintenance_notes || tool.Maintenance,
            calibration_required: tool.Calibration_Required === 'TRUE' || tool.calibration_required === true || false,
            cost_estimate: parseFloat(tool.Cost_Estimate || tool.cost_estimate || tool.Cost || '0') || null,
            current_stock: parseInt(tool.Current_Stock || tool.current_stock || tool.Stock || '0') || 0,
            minimum_stock: parseInt(tool.Min_Stock || tool.minimum_stock || tool.Minimum || '0') || 0,
            status: tool.Status || tool.status || tool.Tool_Status || 'active'
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
            sop_id: sop.SOP_ID || sop.sop_id || sop.ID,
            title: sop.SOP_Name || sop.Title || sop.title || sop.Name,
            goal: sop.Goal || sop.goal || sop.Description || sop.description,
            steps: this.parseJSON(sop.Steps || sop.steps || sop.Procedure_Steps || sop.SOP_Steps),
            best_practices: sop.Best_Practices || sop.best_practices || sop.Tips,
            tools_required: this.parseJSON(sop.Tools_Required || sop.tools_required || sop.Tools),
            hyperlinks: this.parseJSON(sop.Hyperlinks || sop.hyperlinks || sop.Links),
            version: sop.Version || sop.version || '1.0',
            estimated_duration_minutes: parseInt(sop.Duration || sop.estimated_duration_minutes || sop.Time || '30') || 30
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
