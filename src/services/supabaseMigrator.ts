import { supabase } from '@/integrations/supabase/client';
import type { ParsedCSVData } from './csvParser';

interface MigrationResult {
  success: boolean;
  recordsInserted: number;
  relationshipsCreated: number;
  errors: string[];
  lookupMaps: {
    serviceTiers: Map<string, string>;
    systemTypes: Map<string, string>;
    taskCategories: Map<string, string>;
    toolCategories: Map<string, string>;
    customers: Map<string, string>;
    tasks: Map<string, string>;
    tools: Map<string, string>;
    sops: Map<string, string>;
  };
  duration: number;
}

export class SupabaseMigrator {
  private lookupMaps: MigrationResult['lookupMaps'] = {
    serviceTiers: new Map(),
    systemTypes: new Map(),
    taskCategories: new Map(),
    toolCategories: new Map(),
    customers: new Map(),
    tasks: new Map(),
    tools: new Map(),
    sops: new Map()
  };

  /**
   * Test Supabase connection
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.from('service_tiers').select('id').limit(1);
      if (error) {
        console.error('Connection test failed:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.error('Connection test error:', error);
      return false;
    }
  }

  /**
   * Generic insert method with upsert support
   */
  async insertData(
    table: string, 
    data: any[], 
    options: {
      onConflict?: string;
      update?: string[];
      batchSize?: number;
    } = {}
  ): Promise<any[]> {
    const { batchSize = 100, onConflict, update } = options;
    const results: any[] = [];

    // Process in batches
    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      
      try {
        let query = supabase.from(table).insert(batch);
        
        if (onConflict) {
          query = query.onConflict(onConflict);
          if (update) {
            query = query.select();
          }
        } else {
          query = query.select();
        }

        const { data: insertedData, error } = await query;
        
        if (error) {
          throw new Error(`Insert failed for ${table}: ${error.message}`);
        }
        
        if (insertedData) {
          results.push(...insertedData);
        }
        
        console.log(`Inserted batch ${Math.floor(i / batchSize) + 1} for ${table}: ${batch.length} records`);
      } catch (error) {
        console.error(`Error inserting batch for ${table}:`, error);
        throw error;
      }
    }

    return results;
  }

  /**
   * Build lookup maps from inserted records
   */
  buildLookupMaps(lookupData: {
    serviceTiers: any[];
    systemTypes: any[];
    taskCategories: any[];
    toolCategories: any[];
  }): void {
    // Build service tier lookup
    lookupData.serviceTiers.forEach(tier => {
      this.lookupMaps.serviceTiers.set(tier.tier_code, tier.id);
    });

    // Build system type lookup
    lookupData.systemTypes.forEach(type => {
      this.lookupMaps.systemTypes.set(type.type_name, type.id);
      this.lookupMaps.systemTypes.set(type.type_code, type.id);
    });

    // Build category lookups
    lookupData.taskCategories.forEach(category => {
      this.lookupMaps.taskCategories.set(category.category_name, category.id);
    });

    lookupData.toolCategories.forEach(category => {
      this.lookupMaps.toolCategories.set(category.category_name, category.id);
    });
  }

  /**
   * Resolve customer foreign keys
   */
  resolveCustomerForeignKeys(customers: any[]): any[] {
    return customers.map(customer => {
      const resolved = { ...customer };
      
      // Resolve service tier
      if (customer.serviceTier) {
        resolved.service_tier_id = this.lookupMaps.serviceTiers.get(customer.serviceTier);
        delete resolved.serviceTier;
      }

      // Resolve system type
      if (customer.systemType) {
        resolved.system_type_id = this.lookupMaps.systemTypes.get(customer.systemType);
        delete resolved.systemType;
      }

      // Clean up field names to match database schema
      resolved.customer_id = customer.customerId;
      resolved.company_name = customer.companyName;
      resolved.site_name = customer.siteName;
      resolved.site_address = customer.siteAddress;
      resolved.primary_contact = customer.primaryContact;
      resolved.contact_phone = customer.contactPhone;
      resolved.contact_email = customer.contactEmail;
      resolved.building_type = customer.buildingType;
      resolved.emergency_contact = customer.emergencyContact;
      resolved.emergency_phone = customer.emergencyPhone;
      resolved.emergency_email = customer.emergencyEmail;
      resolved.security_contact = customer.securityContact;
      resolved.security_phone = customer.securityPhone;
      resolved.building_access_type = customer.buildingAccessType;
      resolved.building_access_details = customer.buildingAccessDetails;
      resolved.access_hours = customer.accessHours;
      resolved.ppe_required = customer.ppeRequired;
      resolved.badge_required = customer.badgeRequired;
      resolved.training_required = customer.trainingRequired;
      resolved.safety_requirements = customer.safetyRequirements;
      resolved.site_hazards = customer.siteHazards;
      resolved.bms_supervisor_ip = customer.bmsSupervisorIp;
      resolved.web_supervisor_url = customer.webSupervisorUrl;
      resolved.workbench_username = customer.workbenchUsername;
      resolved.workbench_password = customer.workbenchPassword;
      resolved.platform_username = customer.platformUsername;
      resolved.platform_password = customer.platformPassword;
      resolved.remote_access = customer.remoteAccess;
      resolved.remote_access_type = customer.remoteAccessType;
      resolved.vpn_required = customer.vpnRequired;
      resolved.vpn_details = customer.vpnDetails;
      resolved.last_service = customer.lastService;
      resolved.next_due = customer.nextDue;
      resolved.technician_assigned = customer.technicianAssigned;
      resolved.drive_folder_id = customer.driveFolderId;
      resolved.drive_folder_url = customer.driveFolderUrl;
      resolved.contract_status = customer.contractStatus;

      // Remove original field names
      Object.keys(customer).forEach(key => {
        if (key !== key.toLowerCase().replace(/[A-Z]/g, '_$&').toLowerCase()) {
          delete resolved[key];
        }
      });

      return resolved;
    });
  }

  /**
   * Resolve task foreign keys
   */
  resolveTaskForeignKeys(tasks: any[]): any[] {
    return tasks.map(task => {
      const resolved = { ...task };
      
      // Resolve category
      if (task.category) {
        resolved.category_id = this.lookupMaps.taskCategories.get(task.category);
        delete resolved.category;
      }

      // Clean up field names
      resolved.task_id = task.taskId;
      resolved.task_name = task.taskName;
      resolved.duration_minutes = task.duration || 30;
      resolved.navigation_path = task.navigationPath;
      resolved.sop_steps = task.sopSteps;
      resolved.sop_template_sheet = task.sopTemplateSheet;
      resolved.quality_checks = task.qualityChecks;
      resolved.prerequisites = task.prerequisites;
      resolved.skills_required = task.skillsRequired;
      resolved.safety_notes = task.safetyNotes;
      resolved.version = task.version || '1.0';

      // Remove service_tiers and tools_required as these become relationships
      delete resolved.serviceTiers;
      delete resolved.toolsRequired;

      return resolved;
    });
  }

  /**
   * Resolve tool foreign keys
   */
  resolveToolForeignKeys(tools: any[]): any[] {
    return tools.map(tool => {
      const resolved = { ...tool };
      
      // Resolve category
      if (tool.category) {
        resolved.category_id = this.lookupMaps.toolCategories.get(tool.category);
        delete resolved.category;
      }

      // Clean up field names
      resolved.tool_id = tool.toolId;
      resolved.tool_name = tool.toolName;
      resolved.description = tool.description;
      resolved.safety_category = tool.safetyCategory;
      resolved.calibration_required = tool.calibrationRequired;
      resolved.vendor_link = tool.vendorLink;
      resolved.request_method = tool.requestMethod;
      resolved.alternative_tools = tool.alternativeTools;
      resolved.cost_estimate = tool.costEstimate;
      resolved.maintenance_notes = tool.maintenanceNotes;
      resolved.status = tool.status || 'active';

      // Remove service_tiers and system_types as these become relationships
      delete resolved.serviceTiers;
      delete resolved.systemTypes;

      return resolved;
    });
  }

  /**
   * Resolve SOP foreign keys
   */
  resolveSopForeignKeys(sops: any[]): any[] {
    return sops.map(sop => {
      const resolved = { ...sop };
      
      // Resolve category
      if (sop.category) {
        resolved.category_id = this.lookupMaps.taskCategories.get(sop.category);
        delete resolved.category;
      }

      // Clean up field names
      resolved.sop_id = sop.sopId;
      resolved.title = sop.title;
      resolved.goal = sop.goal;
      resolved.steps = sop.steps ? JSON.parse(JSON.stringify(sop.steps)) : [];
      resolved.best_practices = sop.bestPractices;
      resolved.tools_required = sop.tools ? JSON.parse(JSON.stringify(sop.tools)) : [];
      resolved.hyperlinks = sop.hyperlinks ? JSON.parse(JSON.stringify(sop.hyperlinks)) : [];

      return resolved;
    });
  }

  /**
   * Insert all relationship data
   */
  async insertRelationships(relationships: ParsedCSVData['relationships']): Promise<number> {
    let totalInserted = 0;

    // Insert task-service tier relationships
    if (relationships.taskServiceTiers.length > 0) {
      const taskServiceTierData = relationships.taskServiceTiers
        .map(rel => ({
          task_id: this.lookupMaps.tasks.get(rel.taskId),
          service_tier_id: this.lookupMaps.serviceTiers.get(rel.serviceTier)
        }))
        .filter(rel => rel.task_id && rel.service_tier_id);

      if (taskServiceTierData.length > 0) {
        await this.insertData('task_service_tiers', taskServiceTierData, {
          onConflict: 'task_id,service_tier_id'
        });
        totalInserted += taskServiceTierData.length;
      }
    }

    // Insert task-tool relationships
    if (relationships.taskTools.length > 0) {
      const taskToolData = relationships.taskTools
        .map(rel => ({
          task_id: this.lookupMaps.tasks.get(rel.taskId),
          tool_id: this.lookupMaps.tools.get(rel.toolId),
          is_required: rel.isRequired
        }))
        .filter(rel => rel.task_id && rel.tool_id);

      if (taskToolData.length > 0) {
        await this.insertData('task_tools', taskToolData, {
          onConflict: 'task_id,tool_id'
        });
        totalInserted += taskToolData.length;
      }
    }

    // Insert tool-service tier relationships
    if (relationships.toolServiceTiers.length > 0) {
      const toolServiceTierData = relationships.toolServiceTiers
        .map(rel => ({
          tool_id: this.lookupMaps.tools.get(rel.toolId),
          service_tier_id: this.lookupMaps.serviceTiers.get(rel.serviceTier)
        }))
        .filter(rel => rel.tool_id && rel.service_tier_id);

      if (toolServiceTierData.length > 0) {
        await this.insertData('tool_service_tiers', toolServiceTierData, {
          onConflict: 'tool_id,service_tier_id'
        });
        totalInserted += toolServiceTierData.length;
      }
    }

    // Insert tool-system type relationships
    if (relationships.toolSystemTypes.length > 0) {
      const toolSystemTypeData = relationships.toolSystemTypes
        .map(rel => ({
          tool_id: this.lookupMaps.tools.get(rel.toolId),
          system_type_id: this.lookupMaps.systemTypes.get(rel.systemType)
        }))
        .filter(rel => rel.tool_id && rel.system_type_id);

      if (toolSystemTypeData.length > 0) {
        await this.insertData('tool_system_types', toolSystemTypeData, {
          onConflict: 'tool_id,system_type_id'
        });
        totalInserted += toolSystemTypeData.length;
      }
    }

    return totalInserted;
  }

  /**
   * Complete migration orchestration
   */
  async migrateAllData(parsedData: ParsedCSVData): Promise<MigrationResult> {
    const startTime = Date.now();
    const result: MigrationResult = {
      success: false,
      recordsInserted: 0,
      relationshipsCreated: 0,
      errors: [],
      lookupMaps: this.lookupMaps,
      duration: 0
    };

    try {
      console.log('Starting migration...');

      // Step 1: Test connection
      const connected = await this.testConnection();
      if (!connected) {
        throw new Error('Failed to connect to Supabase');
      }

      // Step 2: Insert lookup tables (already done in migration)
      console.log('Fetching existing lookup data...');
      const [serviceTiers, systemTypes, taskCategories, toolCategories] = await Promise.all([
        supabase.from('service_tiers').select('*'),
        supabase.from('system_types').select('*'),
        supabase.from('task_categories').select('*'),
        supabase.from('tool_categories').select('*')
      ]);

      if (serviceTiers.error) throw serviceTiers.error;
      if (systemTypes.error) throw systemTypes.error;
      if (taskCategories.error) throw taskCategories.error;
      if (toolCategories.error) throw toolCategories.error;

      this.buildLookupMaps({
        serviceTiers: serviceTiers.data || [],
        systemTypes: systemTypes.data || [],
        taskCategories: taskCategories.data || [],
        toolCategories: toolCategories.data || []
      });

      // Step 3: Insert main entity data
      console.log('Inserting main entity data...');
      
      // Insert customers
      if (parsedData.customers.length > 0) {
        const resolvedCustomers = this.resolveCustomerForeignKeys(parsedData.customers);
        const insertedCustomers = await this.insertData('ame_customers_normalized', resolvedCustomers);
        insertedCustomers.forEach(customer => {
          this.lookupMaps.customers.set(customer.customer_id, customer.id);
        });
        result.recordsInserted += insertedCustomers.length;
      }

      // Insert tasks
      if (parsedData.tasks.length > 0) {
        const resolvedTasks = this.resolveTaskForeignKeys(parsedData.tasks);
        const insertedTasks = await this.insertData('ame_tasks_normalized', resolvedTasks);
        insertedTasks.forEach(task => {
          this.lookupMaps.tasks.set(task.task_id, task.id);
        });
        result.recordsInserted += insertedTasks.length;
      }

      // Insert tools  
      if (parsedData.tools.length > 0) {
        const resolvedTools = this.resolveToolForeignKeys(parsedData.tools);
        const insertedTools = await this.insertData('ame_tools_normalized', resolvedTools);
        insertedTools.forEach(tool => {
          this.lookupMaps.tools.set(tool.tool_id, tool.id);
        });
        result.recordsInserted += insertedTools.length;
      }

      // Insert SOPs
      if (parsedData.sops.length > 0) {
        const resolvedSops = this.resolveSopForeignKeys(parsedData.sops);
        const insertedSops = await this.insertData('ame_sops_normalized', resolvedSops);
        insertedSops.forEach(sop => {
          this.lookupMaps.sops.set(sop.sop_id, sop.id);
        });
        result.recordsInserted += insertedSops.length;
      }

      // Step 4: Insert relationships
      console.log('Inserting relationships...');
      result.relationshipsCreated = await this.insertRelationships(parsedData.relationships);

      result.success = true;
      console.log('Migration completed successfully!');

    } catch (error) {
      console.error('Migration failed:', error);
      result.errors.push(error.message);
      result.success = false;
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Validate migration results
   */
  async validateMigrationResult(): Promise<{isValid: boolean, issues: string[]}> {
    const issues: string[] = [];

    try {
      // Check record counts
      const counts = await Promise.all([
        supabase.from('ame_customers_normalized').select('id', { count: 'exact' }),
        supabase.from('ame_tasks_normalized').select('id', { count: 'exact' }),
        supabase.from('ame_tools_normalized').select('id', { count: 'exact' }),
        supabase.from('ame_sops_normalized').select('id', { count: 'exact' }),
        supabase.from('task_service_tiers').select('id', { count: 'exact' }),
        supabase.from('task_tools').select('id', { count: 'exact' })
      ]);

      counts.forEach((result, index) => {
        if (result.error) {
          issues.push(`Error checking table ${index}: ${result.error.message}`);
        }
      });

      // Check for orphaned foreign keys
      const orphanedChecks = await Promise.all([
        supabase.rpc('check_orphaned_foreign_keys', { table_name: 'ame_customers_normalized' }),
        supabase.rpc('check_orphaned_foreign_keys', { table_name: 'ame_tasks_normalized' }),
        supabase.rpc('check_orphaned_foreign_keys', { table_name: 'ame_tools_normalized' })
      ]);

      // Note: The RPC functions would need to be created in the database

    } catch (error) {
      issues.push(`Validation error: ${error.message}`);
    }

    return {
      isValid: issues.length === 0,
      issues
    };
  }

  /**
   * Generate detailed migration report
   */
  generateMigrationReport(result: MigrationResult): string {
    const report = [
      '=== MIGRATION REPORT ===',
      `Status: ${result.success ? 'SUCCESS' : 'FAILED'}`,
      `Duration: ${(result.duration / 1000).toFixed(2)} seconds`,
      `Records Inserted: ${result.recordsInserted}`,
      `Relationships Created: ${result.relationshipsCreated}`,
      '',
      '=== LOOKUP MAPS ===',
      `Service Tiers: ${result.lookupMaps.serviceTiers.size}`,
      `System Types: ${result.lookupMaps.systemTypes.size}`,
      `Task Categories: ${result.lookupMaps.taskCategories.size}`,
      `Tool Categories: ${result.lookupMaps.toolCategories.size}`,
      `Customers: ${result.lookupMaps.customers.size}`,
      `Tasks: ${result.lookupMaps.tasks.size}`,
      `Tools: ${result.lookupMaps.tools.size}`,
      `SOPs: ${result.lookupMaps.sops.size}`,
    ];

    if (result.errors.length > 0) {
      report.push('', '=== ERRORS ===');
      result.errors.forEach(error => report.push(`- ${error}`));
    }

    return report.join('\n');
  }
}