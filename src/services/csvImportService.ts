import { GoogleDriveService } from './googleDriveService';
import { supabase } from '@/integrations/supabase/client';

/**
 * Service for importing CSV data into Supabase normalized tables
 */
export class CSVImportService {
  /**
   * Parse CSV text into array of objects with proper quoted field handling
   */
  static parseCSV(csvText: string): Record<string, any>[] {
    const lines = csvText.trim().split('\n');
    if (lines.length < 2) return [];
    
    // Handle quoted fields properly including fields with commas inside quotes
    const parseCSVLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"' && nextChar === '"') {
          // Handle escaped quotes
          current += '"';
          i++; // Skip next quote
        } else if (char === '"') {
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
    
    const headers = parseCSVLine(lines[0]).map(h => h.replace(/^"|"$/g, '').trim());
    const rows: Record<string, any>[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue; // Skip empty lines
      
      const values = parseCSVLine(lines[i]).map(v => v.replace(/^"|"$/g, '').trim());
      const row: Record<string, any> = {};
      
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Keep as string for now, we'll handle type conversion in import functions
        row[header] = value || null;
      });
      
      if (Object.values(row).some(v => v !== null && v !== '')) {
        rows.push(row);
      }
    }
    
    return rows;
  }

  /**
   * Import tasks data from CSV text with relationship handling
   */
  static async importTasksFromCsv(csvData: string): Promise<{ success: number; errors: string[] }> {
    try {
      const tasks = this.parseCSV(csvData);
      
      let success = 0;
      const errors: string[] = [];
      
      for (const task of tasks) {
        try {
          // Mock category lookup since table doesn't exist
          const categoryData = { id: crypto.randomUUID() };


          // Insert the main task record
          const taskData = {
            task_id: task.Task_ID,
            task_name: task.Task_Name,
            category: task.Category || 'General',
            navigation_path: task.Navigation_Path,
            sop_steps: task.SOP_Steps,
            quality_checks: task.Quality_Checks,
            prerequisites: task.Prerequisites,
            skills_required: task.Skills_Required,
            safety_notes: task.Safety_Notes,
            duration: parseInt(task.Duration) || 30,
            phase: 1,
            task_order: 1,
            is_mandatory: true,
            version: task.Version || '1.0'
          };

          const { data: insertedTask, error: taskError } = await supabase
            .from('ame_tasks')
            .upsert(taskData, { onConflict: 'task_id' })
            .select('id')
            .single();
          
          if (taskError) {
            errors.push(`Task ${taskData.task_id}: ${taskError.message}`);
            continue;
          }

          // Handle Service_Tiers (store as array in existing field)
          if (task.Service_Tiers && insertedTask) {
            const serviceTiers = task.Service_Tiers.split(',').map(tier => tier.trim());
            
            await supabase
              .from('ame_tasks')
              .update({
                service_tiers: serviceTiers
              })
              .eq('id', insertedTask.id);
          }

          // Handle Tools_Required (store as array in existing field)
          if (task.Tools_Required && insertedTask) {
            const tools = task.Tools_Required.split(',').map(tool => tool.trim());
            
            await supabase
              .from('ame_tasks')
              .update({
                tools_required: tools
              })
              .eq('id', insertedTask.id);
          }

          success++;
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
   * Parse rich HTML steps content into structured format
   */
  private static parseRichSteps(stepsHtml: string): any[] {
    if (!stepsHtml) return [];
    
    const steps: any[] = [];
    // Split by <br> tags and extract numbered steps
    const stepTexts = stepsHtml.split('<br>').filter(step => step.trim());
    
    stepTexts.forEach((stepText, index) => {
      const trimmed = stepText.trim();
      if (trimmed) {
        // Extract references like [1], [2] from the step text
        const references: number[] = [];
        const refMatches = trimmed.match(/\[(\d+)\]/g);
        if (refMatches) {
          refMatches.forEach(match => {
            const refNum = parseInt(match.replace(/[\[\]]/g, ''));
            if (!isNaN(refNum)) references.push(refNum);
          });
        }

        steps.push({
          step_number: index + 1,
          content: trimmed,
          references: references
        });
      }
    });
    
    return steps;
  }

  /**
   * Parse numbered hyperlinks format into structured array
   */
  private static parseNumberedHyperlinks(hyperlinksText: string): any[] {
    if (!hyperlinksText) return [];
    
    const links: any[] = [];
    // Split by <br> tags and parse numbered format: "1. url", "2. url"
    const linkTexts = hyperlinksText.split('<br>').filter(link => link.trim());
    
    linkTexts.forEach(linkText => {
      const trimmed = linkText.trim();
      // Enhanced pattern to match various URL formats with anchor text
      const match = trimmed.match(/^(\d+)\.\s*(https?:\/\/[^\s]+)(?:#:~:text=(.+))?/);
      if (match) {
        const [, refNumber, url, anchorText] = match;
        links.push({
          ref_number: parseInt(refNumber),
          url: url.trim(),
          title: anchorText ? decodeURIComponent(anchorText.replace(/[%,]/g, ' ')) : `Reference ${refNumber}`,
          display_text: anchorText ? decodeURIComponent(anchorText.replace(/[%,]/g, ' ')) : `Reference ${refNumber}`
        });
      } else {
        // Fallback for URLs without numbers
        const urlMatch = trimmed.match(/(https?:\/\/[^\s]+)/);
        if (urlMatch) {
          links.push({
            ref_number: links.length + 1,
            url: urlMatch[1],
            title: `Reference ${links.length + 1}`,
            display_text: `Reference ${links.length + 1}`
          });
        }
      }
    });
    
    return links;
  }

  /**
   * Parse tools list from CSV data
   */
  private static parseToolsList(toolsText: string): any[] {
    if (!toolsText) return [];
    
    const tools: any[] = [];
    // Split by comma and clean up
    const toolTexts = toolsText.split(',').map(t => t.trim()).filter(Boolean);
    
    toolTexts.forEach(tool => {
      tools.push({
        tool_id: tool,
        tool_name: tool,
        category: 'Standard'
      });
    });
    
    return tools;
  }

  /**
   * Parse comma-separated tool IDs into array
   */
  private static parseToolIds(toolsText: string): string[] {
    if (!toolsText) return [];
    return toolsText.split(',').map(tool => tool.trim()).filter(tool => tool);
  }

  /**
   * Import SOPs data from CSV text with rich content support
   */
  static async importSOPsFromCsv(csvData: string): Promise<{ success: number; errors: string[] }> {
    try {
      const sops = this.parseCSV(csvData);
      
      let success = 0;
      const errors: string[] = [];
      
      for (const sop of sops) {
        try {
          // Parse rich content from CSV
          const stepsHtml = sop.Steps || sop.steps || sop.Procedure_Steps || sop.SOP_Steps || '';
          const hyperlinksText = sop.Hyperlinks || sop.hyperlinks || sop.Links || '';
          const toolsText = sop.Tools || sop.tools_required || sop.Tools_Required || '';
          
          const sopData = {
            sop_id: sop.SOP_ID || sop.sop_id || sop.ID,
            sop_name: sop.SOP_Name || sop.Title || sop.title || sop.Name,
            category: sop.Category || sop.category || 'General',
            description: sop.Goal || sop.goal || sop.Description || sop.description,
            procedure_steps: this.parseRichSteps(stepsHtml),
            tools_required: this.parseToolIds(toolsText),
            version: sop.Version || sop.version || '1.0',
            estimated_duration: parseInt(sop.Duration || sop.estimated_duration_minutes || sop.Time || '30') || 30
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
      throw new Error(`Failed to import SOPs from CSV: ${error}`);
    }
  }

  /**
   * Import SOPs from Google Sheets or sample data with enhanced rich content parsing
   */
  static async importSOPs() {
    try {
      const csvData = await GoogleDriveService.getSopLibraryData();
      return await this.importEnhancedSOPsFromCsv(csvData);
    } catch (error) {
      console.error('Google Sheets SOP import failed, using sample data:', error);
      return await this.importSampleSOPs();
    }
  }

  /**
   * Import enhanced SOPs from CSV with rich content support
   */
  static async importEnhancedSOPsFromCsv(csvData: string) {
    try {
      const records = this.parseCSV(csvData);
      console.log('Importing enhanced SOPs from CSV:', records.length, 'records');

      const importResults = {
        success: 0,
        errors: [] as string[]
      };

      for (const record of records) {
        try {
          // Parse rich content with HTML steps and numbered hyperlinks
          const richSteps = this.parseRichSteps(record.Steps || record.steps || '');
          const numberedHyperlinks = this.parseNumberedHyperlinks(record.Hyperlinks || record.hyperlinks || '');
          const toolsRequired = this.parseToolsList(record.Tools || record.tools || '');

          const sopData = {
            sop_id: String(record.SOP_ID || record.sop_id || ''),
            sop_name: String(record.Title || record.title || ''),
            category: String(record.Category || record.category || 'General'),
            description: String(record.Goal || record.goal || ''),
            procedure_steps: richSteps,
            tools_required: this.parseToolIds(record.Tools || record.tools || ''),
            version: '1.0',
            estimated_duration: parseInt(record.EstimatedDuration || record.estimated_duration || '30') || 30,
            last_updated: new Date().toISOString()
          };

          const { error } = await supabase
            .from('ame_sops')
            .upsert(sopData, { 
              onConflict: 'sop_id',
              ignoreDuplicates: false 
            });

          if (error) {
            console.error('Error inserting SOP:', error);
            importResults.errors.push(`SOP ${sopData.sop_id}: ${error.message}`);
          } else {
            importResults.success++;
          }
        } catch (error) {
          console.error('Error processing SOP record:', error);
          importResults.errors.push(`Record processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
      }

      console.log('Enhanced SOP import results:', importResults);
      return importResults;
    } catch (error) {
      console.error('Enhanced SOP import failed:', error);
      throw error;
    }
  }

  /**
   * Fallback to import sample SOPs if Google Sheets fails
   */
  static async importSampleSOPs() {
    // Return empty result for now
    return { success: 0, errors: ['No sample SOPs available'] };
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
