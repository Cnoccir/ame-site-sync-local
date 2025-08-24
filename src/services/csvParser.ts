export interface ParsedCSVData {
  customers: any[];
  tasks: any[];
  tools: any[];
  sops: any[];
  serviceTiers: Set<string>;
  systemTypes: Set<string>;
  taskCategories: Set<string>;
  toolCategories: Set<string>;
  relationships: {
    taskServiceTiers: Array<{taskId: string, serviceTier: string}>;
    taskTools: Array<{taskId: string, toolId: string, isRequired: boolean}>;
    toolServiceTiers: Array<{toolId: string, serviceTier: string}>;
    toolSystemTypes: Array<{toolId: string, systemType: string}>;
    taskSops: Array<{taskId: string, sopId: string, relationshipType: string}>;
  };
  errors: string[];
  summary: {
    filesProcessed: number;
    recordsProcessed: number;
    relationshipsExtracted: number;
  };
}

export class CSVParser {
  private static readonly SERVICE_TIERS = ['CORE', 'ASSURE', 'GUARDIAN'];
  private static readonly BOOLEAN_TRUE_VALUES = ['true', 'yes', 'y', '1', 'on', 'enabled'];
  private static readonly BOOLEAN_FALSE_VALUES = ['false', 'no', 'n', '0', 'off', 'disabled'];

  /**
   * Parse a single CSV file content
   */
  static parseCSV(csvContent: string, filename: string): any[] {
    const lines = this.splitCSVLines(csvContent);
    if (lines.length < 2) {
      throw new Error(`CSV file ${filename} has no data rows`);
    }

    const headers = this.parseCSVLine(lines[0]);
    const normalizedHeaders = headers.map(h => this.normalizeFieldName(h));
    const records: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCSVLine(lines[i]);
        if (values.length !== headers.length) {
          console.warn(`Row ${i + 1} in ${filename} has ${values.length} columns, expected ${headers.length}`);
          continue;
        }

        const record: any = {};
        for (let j = 0; j < headers.length; j++) {
          const normalizedKey = normalizedHeaders[j];
          const rawValue = values[j]?.trim() || '';
          record[normalizedKey] = this.convertDataType(rawValue, normalizedKey);
        }
        
        records.push(record);
      } catch (error) {
        console.error(`Error parsing row ${i + 1} in ${filename}:`, error);
      }
    }

    return records;
  }

  /**
   * Parse all CSV files and extract relationships
   */
  static parseAllCSVs(csvFiles: {name: string, content: string}[]): ParsedCSVData {
    const result: ParsedCSVData = {
      customers: [],
      tasks: [],
      tools: [],
      sops: [],
      serviceTiers: new Set(this.SERVICE_TIERS),
      systemTypes: new Set(),
      taskCategories: new Set(),
      toolCategories: new Set(),
      relationships: {
        taskServiceTiers: [],
        taskTools: [],
        toolServiceTiers: [],
        toolSystemTypes: [],
        taskSops: []
      },
      errors: [],
      summary: {
        filesProcessed: 0,
        recordsProcessed: 0,
        relationshipsExtracted: 0
      }
    };

    for (const file of csvFiles) {
      try {
        const records = this.parseCSV(file.content, file.name);
        result.summary.filesProcessed++;
        result.summary.recordsProcessed += records.length;

        // Route records to appropriate collections based on filename
        if (file.name.toLowerCase().includes('customer')) {
          result.customers = records;
          this.extractCustomerRelatedData(records, result);
        } else if (file.name.toLowerCase().includes('task')) {
          result.tasks = records;
          this.extractTaskRelatedData(records, result);
        } else if (file.name.toLowerCase().includes('tool')) {
          result.tools = records;
          this.extractToolRelatedData(records, result);
        } else if (file.name.toLowerCase().includes('sop')) {
          result.sops = records;
          this.extractSopRelatedData(records, result);
        }
      } catch (error) {
        result.errors.push(`Error parsing ${file.name}: ${error.message}`);
      }
    }

    result.summary.relationshipsExtracted = 
      result.relationships.taskServiceTiers.length +
      result.relationships.taskTools.length +
      result.relationships.toolServiceTiers.length +
      result.relationships.toolSystemTypes.length +
      result.relationships.taskSops.length;

    return result;
  }

  /**
   * Extract service tiers from all parsed data
   */
  static extractServiceTiers(parsedData: ParsedCSVData): Array<{tier_code: string, tier_name: string, description: string}> {
    return Array.from(parsedData.serviceTiers).map(tier => ({
      tier_code: tier,
      tier_name: this.getTierDisplayName(tier),
      description: this.getTierDescription(tier)
    }));
  }

  /**
   * Extract system types from all parsed data
   */
  static extractSystemTypes(parsedData: ParsedCSVData): Array<{type_code: string, type_name: string, manufacturer: string}> {
    return Array.from(parsedData.systemTypes).map(type => ({
      type_code: this.normalizeSystemTypeCode(type),
      type_name: type,
      manufacturer: this.getSystemTypeManufacturer(type)
    }));
  }

  /**
   * Extract task categories from all parsed data
   */
  static extractTaskCategories(parsedData: ParsedCSVData): Array<{category_name: string, description: string, phase: number}> {
    return Array.from(parsedData.taskCategories).map(category => ({
      category_name: category,
      description: `Tasks related to ${category.toLowerCase()}`,
      phase: this.getCategoryPhase(category)
    }));
  }

  /**
   * Validate parsed data structure
   */
  static validateParsedData(parsedData: ParsedCSVData): {isValid: boolean, errors: string[]} {
    const errors: string[] = [];

    // Validate required data exists
    if (parsedData.customers.length === 0) errors.push('No customer data found');
    if (parsedData.tasks.length === 0) errors.push('No task data found');
    if (parsedData.tools.length === 0) errors.push('No tool data found');

    // Validate required fields exist
    for (const customer of parsedData.customers) {
      if (!customer.customerId) errors.push(`Customer missing ID: ${JSON.stringify(customer).substring(0, 100)}`);
      if (!customer.companyName) errors.push(`Customer missing company name: ${customer.customerId}`);
    }

    for (const task of parsedData.tasks) {
      if (!task.taskId) errors.push(`Task missing ID: ${JSON.stringify(task).substring(0, 100)}`);
      if (!task.taskName) errors.push(`Task missing name: ${task.taskId}`);
    }

    for (const tool of parsedData.tools) {
      if (!tool.toolId) errors.push(`Tool missing ID: ${JSON.stringify(tool).substring(0, 100)}`);
      if (!tool.toolName) errors.push(`Tool missing name: ${tool.toolId}`);
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Generate parsing summary report
   */
  static generateSummaryReport(parsedData: ParsedCSVData): string {
    const report = [
      '=== CSV PARSING SUMMARY ===',
      `Files Processed: ${parsedData.summary.filesProcessed}`,
      `Records Processed: ${parsedData.summary.recordsProcessed}`,
      `Relationships Extracted: ${parsedData.summary.relationshipsExtracted}`,
      '',
      '=== DATA BREAKDOWN ===',
      `Customers: ${parsedData.customers.length}`,
      `Tasks: ${parsedData.tasks.length}`,
      `Tools: ${parsedData.tools.length}`,
      `SOPs: ${parsedData.sops.length}`,
      '',
      '=== LOOKUP DATA ===',
      `Service Tiers: ${parsedData.serviceTiers.size}`,
      `System Types: ${parsedData.systemTypes.size}`,
      `Task Categories: ${parsedData.taskCategories.size}`,
      `Tool Categories: ${parsedData.toolCategories.size}`,
      '',
      '=== RELATIONSHIPS ===',
      `Task-Service Tiers: ${parsedData.relationships.taskServiceTiers.length}`,
      `Task-Tools: ${parsedData.relationships.taskTools.length}`,
      `Tool-Service Tiers: ${parsedData.relationships.toolServiceTiers.length}`,
      `Tool-System Types: ${parsedData.relationships.toolSystemTypes.length}`,
      `Task-SOPs: ${parsedData.relationships.taskSops.length}`,
    ];

    if (parsedData.errors.length > 0) {
      report.push('', '=== ERRORS ===');
      parsedData.errors.forEach(error => report.push(`- ${error}`));
    }

    return report.join('\n');
  }

  // Private helper methods

  private static splitCSVLines(content: string): string[] {
    return content.split(/\r?\n/).filter(line => line.trim());
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let currentField = '';
    let inQuotes = false;
    let i = 0;

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          currentField += '"';
          i += 2;
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        // Field separator
        result.push(currentField);
        currentField = '';
        i++;
      } else {
        currentField += char;
        i++;
      }
    }
    
    result.push(currentField);
    return result;
  }

  private static normalizeFieldName(fieldName: string): string {
    return fieldName
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .replace(/_+/g, '_')
      .replace(/^_|_$/g, '')
      .replace(/^(\d)/, '_$1'); // Prefix numbers with underscore
  }

  private static convertDataType(value: string, fieldName: string): any {
    if (!value) return null;

    // Boolean conversion
    if (this.BOOLEAN_TRUE_VALUES.includes(value.toLowerCase())) return true;
    if (this.BOOLEAN_FALSE_VALUES.includes(value.toLowerCase())) return false;

    // Date conversion
    if (fieldName.includes('date') || fieldName.includes('service') || fieldName.includes('due')) {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toISOString().split('T')[0]; // Return YYYY-MM-DD format
      }
    }

    // Number conversion
    if (fieldName.includes('count') || fieldName.includes('number') || fieldName.includes('port')) {
      const num = parseInt(value, 10);
      if (!isNaN(num)) return num;
    }

    // Keep as string
    return value;
  }

  private static extractCustomerRelatedData(customers: any[], result: ParsedCSVData): void {
    for (const customer of customers) {
      // Extract service tiers
      if (customer.serviceTier) {
        result.serviceTiers.add(customer.serviceTier);
      }

      // Extract system types
      if (customer.systemType) {
        const systemTypes = this.parseDelimitedField(customer.systemType);
        systemTypes.forEach(type => result.systemTypes.add(type));
      }
    }
  }

  private static extractTaskRelatedData(tasks: any[], result: ParsedCSVData): void {
    for (const task of tasks) {
      // Extract service tiers
      if (task.serviceTiers) {
        const tiers = this.parseDelimitedField(task.serviceTiers);
        tiers.forEach(tier => {
          result.serviceTiers.add(tier);
          result.relationships.taskServiceTiers.push({
            taskId: task.taskId,
            serviceTier: tier
          });
        });
      }

      // Extract categories
      if (task.category) {
        result.taskCategories.add(task.category);
      }

      // Extract tool relationships
      if (task.toolsRequired) {
        const tools = this.parseDelimitedField(task.toolsRequired);
        tools.forEach(toolId => {
          result.relationships.taskTools.push({
            taskId: task.taskId,
            toolId: toolId.trim(),
            isRequired: true
          });
        });
      }
    }
  }

  private static extractToolRelatedData(tools: any[], result: ParsedCSVData): void {
    for (const tool of tools) {
      // Extract service tiers
      if (tool.serviceTiers) {
        const tiers = this.parseDelimitedField(tool.serviceTiers);
        tiers.forEach(tier => {
          result.serviceTiers.add(tier);
          result.relationships.toolServiceTiers.push({
            toolId: tool.toolId,
            serviceTier: tier
          });
        });
      }

      // Extract system types
      if (tool.systemTypes) {
        const systemTypes = this.parseDelimitedField(tool.systemTypes);
        systemTypes.forEach(type => {
          if (type !== 'ALL') {
            result.systemTypes.add(type);
            result.relationships.toolSystemTypes.push({
              toolId: tool.toolId,
              systemType: type
            });
          }
        });
      }

      // Extract categories
      if (tool.category) {
        result.toolCategories.add(tool.category);
      }
    }
  }

  private static extractSopRelatedData(sops: any[], result: ParsedCSVData): void {
    for (const sop of sops) {
      // Extract categories
      if (sop.category) {
        result.taskCategories.add(sop.category);
      }

      // Extract tool relationships from tools field
      if (sop.tools) {
        const tools = this.parseDelimitedField(sop.tools);
        tools.forEach(toolId => {
          // This creates a relationship that can be used later to link SOPs to tasks via tools
          if (toolId.trim()) {
            result.relationships.taskSops.push({
              taskId: '', // Will be resolved later
              sopId: sop.sopId,
              relationshipType: 'reference'
            });
          }
        });
      }
    }
  }

  private static parseDelimitedField(value: string): string[] {
    if (!value) return [];
    
    return value
      .split(/[,;|]/)
      .map(item => item.trim())
      .filter(item => item.length > 0);
  }

  private static getTierDisplayName(tier: string): string {
    const names = {
      'CORE': 'Core Service',
      'ASSURE': 'Assured Service', 
      'GUARDIAN': 'Guardian Service'
    };
    return names[tier] || tier;
  }

  private static getTierDescription(tier: string): string {
    const descriptions = {
      'CORE': 'Essential maintenance and monitoring services for critical building systems',
      'ASSURE': 'Enhanced preventive maintenance with predictive analytics and optimization',
      'GUARDIAN': 'Comprehensive service with 24/7 monitoring, priority response, and advanced analytics'
    };
    return descriptions[tier] || `${tier} service tier`;
  }

  private static normalizeSystemTypeCode(type: string): string {
    return type
      .toUpperCase()
      .replace(/\s+/g, '_')
      .replace(/[^A-Z0-9_]/g, '')
      .replace(/_+/g, '_');
  }

  private static getSystemTypeManufacturer(type: string): string {
    if (type.toLowerCase().includes('niagara')) return 'Tridium';
    if (type.toLowerCase().includes('metasys')) return 'Johnson Controls';
    if (type.toLowerCase().includes('bacnet')) return 'Various';
    if (type.toLowerCase().includes('modbus')) return 'Various';
    if (type.toLowerCase().includes('lon')) return 'Echelon';
    return 'Various';
  }

  private static getCategoryPhase(category: string): number {
    const phase1Categories = ['Pre-Visit Setup', 'Preparation', 'Setup'];
    const phase2Categories = ['Assessment', 'Evaluation', 'Initial'];
    const phase3Categories = ['Maintenance', 'Optimization', 'Service', 'Backup'];
    const phase4Categories = ['Documentation', 'Reporting', 'Quality', 'Final'];

    const lowerCategory = category.toLowerCase();
    
    if (phase1Categories.some(p => lowerCategory.includes(p.toLowerCase()))) return 1;
    if (phase2Categories.some(p => lowerCategory.includes(p.toLowerCase()))) return 2;
    if (phase3Categories.some(p => lowerCategory.includes(p.toLowerCase()))) return 3;
    if (phase4Categories.some(p => lowerCategory.includes(p.toLowerCase()))) return 4;
    
    return 3; // Default to phase 3 (maintenance)
  }
}
