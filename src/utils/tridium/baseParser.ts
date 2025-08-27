import { TridiumDataset, TridiumDataRow, CSVColumn, ParsedStatus, ParsedValue, DatasetSummary, TridiumDataCategory, TridiumExportFormat, TridiumFormatSpec } from '@/types/tridium';
import { logger } from '@/utils/logger';

export interface ParseResult {
  success: boolean;
  dataset?: TridiumDataset;
  errors: string[];
  warnings: string[];
  processingTime: number;
}

export interface ParserConfig {
  maxRows?: number;
  maxFileSize?: number;
  strictValidation?: boolean;
  sanitizeData?: boolean;
}

/**
 * Base class for all Tridium format parsers
 */
export abstract class TridiumBaseParser {
  protected config: ParserConfig;
  
  constructor(config: ParserConfig = {}) {
    this.config = {
      maxRows: 100000,
      maxFileSize: 50 * 1024 * 1024, // 50MB
      strictValidation: true,
      sanitizeData: true,
      ...config
    };
  }

  /**
   * Parse file content into a TridiumDataset
   */
  abstract parse(
    content: string,
    filename: string,
    formatSpec: TridiumFormatSpec
  ): Promise<ParseResult>;

  /**
   * Get the data category this parser handles
   */
  abstract getDataCategory(): TridiumDataCategory;

  /**
   * Validate raw content before parsing
   */
  protected validateContent(content: string, filename: string): string[] {
    const errors: string[] = [];

    if (!content || content.trim().length === 0) {
      errors.push('File content is empty');
      return errors;
    }

    if (content.length > this.config.maxFileSize!) {
      errors.push(`File size ${(content.length / 1024 / 1024).toFixed(2)}MB exceeds limit of ${this.config.maxFileSize! / 1024 / 1024}MB`);
    }

    return errors;
  }

  /**
   * Parse CSV lines from content
   */
  protected parseCSVContent(content: string): { headers: string[]; rows: string[][] } {
    const lines = content.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length === 0) {
      return { headers: [], rows: [] };
    }

    const headers = this.parseCSVLine(lines[0]);
    const rows: string[][] = [];

    for (let i = 1; i < lines.length && rows.length < this.config.maxRows!; i++) {
      const rowData = this.parseCSVLine(lines[i]);
      if (rowData.length > 0) {
        // Pad or trim row to match header length
        while (rowData.length < headers.length) {
          rowData.push('');
        }
        rows.push(rowData.slice(0, headers.length));
      }
    }

    return { headers, rows };
  }

  /**
   * Parse a single CSV line handling quotes and commas properly
   */
  protected parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    // Remove BOM if present
    if (line.charCodeAt(0) === 0xFEFF) {
      line = line.slice(1);
    }

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(this.sanitizeField(current));
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(this.sanitizeField(current));
    return result;
  }

  /**
   * Sanitize and clean field data
   */
  protected sanitizeField(field: string): string {
    if (!this.config.sanitizeData) return field;

    return field
      .trim()
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '') // Remove control characters
      .replace(/�/g, '?'); // Replace Unicode replacement characters
  }

  /**
   * Create CSV columns from headers
   */
  protected createColumns(headers: string[], formatSpec: TridiumFormatSpec): CSVColumn[] {
    return headers.map(header => ({
      key: header,
      label: header,
      type: this.detectColumnType(header, formatSpec),
      visible: true,
      sortable: true,
      width: this.calculateColumnWidth(header)
    }));
  }

  /**
   * Detect column type based on header name and format
   */
  protected detectColumnType(header: string, formatSpec: TridiumFormatSpec): CSVColumn['type'] {
    const lowerHeader = header.toLowerCase();
    
    if (header === formatSpec.statusColumn || lowerHeader.includes('status') || lowerHeader.includes('health')) {
      return 'status';
    }
    if (header === formatSpec.valueColumn || lowerHeader.includes('value') || lowerHeader.includes('usage') || lowerHeader.includes('%')) {
      return 'value';
    }
    if (lowerHeader.includes('date') || lowerHeader.includes('time')) {
      return 'date';
    }
    if (lowerHeader.includes('id') || lowerHeader.includes('count') || lowerHeader.includes('number') || lowerHeader.includes('address')) {
      return 'number';
    }
    
    return 'text';
  }

  /**
   * Calculate appropriate column width
   */
  protected calculateColumnWidth(header: string): number {
    const baseWidth = Math.max(header.length * 8, 100);
    return Math.min(baseWidth, 300);
  }

  /**
   * Parse status values into structured format
   */
  protected parseStatus(statusValue: string): ParsedStatus {
    if (!statusValue || statusValue.trim() === '') {
      return {
        status: 'unknown',
        severity: 'normal',
        details: ['No status information'],
        badge: { text: 'UNKNOWN', variant: 'default' }
      };
    }

    const status = statusValue.toLowerCase().trim();
    const details: string[] = [];
    let finalStatus: 'ok' | 'down' | 'alarm' | 'fault' | 'unknown' = 'unknown';
    let severity: 'normal' | 'warning' | 'critical' = 'normal';
    let badgeText = 'UNKNOWN';
    let badgeVariant: 'default' | 'success' | 'warning' | 'destructive' = 'default';

    // Parse compound status strings like {down,alarm,unackedAlarm}
    const statusFlags = this.extractStatusFlags(status);
    
    if (statusFlags.includes('ok')) {
      finalStatus = 'ok';
      severity = 'normal';
      details.push('System operational');
      badgeText = 'OK';
      badgeVariant = 'success';
    } else if (statusFlags.includes('down')) {
      finalStatus = 'down';
      severity = 'critical';
      details.push('Device offline');
      badgeText = 'DOWN';
      badgeVariant = 'destructive';
      
      if (statusFlags.includes('fault')) {
        finalStatus = 'fault';
        details.push('Fault condition detected');
        badgeText = 'FAULT/DOWN';
      }
      if (statusFlags.includes('alarm') || statusFlags.includes('unackedalarm')) {
        details.push('Alarm condition present');
        if (!statusFlags.includes('fault')) {
          badgeText = 'DOWN/ALARM';
        }
      }
    } else if (statusFlags.includes('fault')) {
      finalStatus = 'fault';
      severity = 'critical';
      details.push('Fault condition detected');
      badgeText = 'FAULT';
      badgeVariant = 'destructive';
    } else if (statusFlags.includes('unackedalarm') || statusFlags.includes('alarm')) {
      finalStatus = 'alarm';
      severity = 'warning';
      details.push('Unacknowledged alarm');
      badgeText = 'ALARM';
      badgeVariant = 'warning';
    } else {
      details.push(`Status: ${statusValue}`);
      badgeText = statusValue.length > 10 ? statusValue.substring(0, 10) + '...' : statusValue;
    }

    return {
      status: finalStatus,
      severity,
      details,
      badge: { text: badgeText, variant: badgeVariant }
    };
  }

  /**
   * Extract status flags from compound status strings
   */
  private extractStatusFlags(status: string): string[] {
    const flags: string[] = [];
    
    // Handle braced compound status: {down,alarm,unackedAlarm}
    const bracedMatch = status.match(/\{([^}]+)\}/);
    if (bracedMatch) {
      const flagsString = bracedMatch[1];
      flags.push(...flagsString.split(',').map(flag => flag.trim().toLowerCase()));
    } else {
      // Handle simple status strings
      const simpleFlags = ['ok', 'down', 'alarm', 'fault', 'unackedalarm', 'connected', 'disconnected', 'online', 'offline'];
      simpleFlags.forEach(flag => {
        if (status.includes(flag)) {
          flags.push(flag);
        }
      });
    }
    
    return flags;
  }

  /**
   * Parse value with units and type detection
   */
  protected parseValue(value: any): ParsedValue {
    const stringValue = String(value).trim();
    
    if (!stringValue) {
      return {
        value: '',
        formatted: '',
        type: 'text'
      };
    }

    // Resource values with limits (e.g., "84 (Limit: 101)")
    const limitMatch = stringValue.match(/([\d,]+(?:\.\d+)?)\s*\(.*?[lL]imit[^\d]*([\d,]+(?:\.\d+)?)/);
    if (limitMatch) {
      const current = parseFloat(limitMatch[1].replace(/,/g, ''));
      const limit = parseFloat(limitMatch[2].replace(/,/g, ''));
      return {
        value: current,
        unit: `of ${limit}`,
        formatted: stringValue,
        type: 'count',
        metadata: { limit, percentage: limit > 0 ? (current / limit) * 100 : 0 }
      };
    }

    // Percentage values
    const percentMatch = stringValue.match(/([\d.]+)\s*%/);
    if (percentMatch) {
      return {
        value: parseFloat(percentMatch[1]),
        unit: '%',
        formatted: stringValue,
        type: 'percentage'
      };
    }
    
    // Memory values (KB, MB, GB)
    const memoryMatch = stringValue.match(/([\d,.]+)\s*(KB|MB|GB|[Bb]ytes?)/i);
    if (memoryMatch) {
      const value = parseFloat(memoryMatch[1].replace(/,/g, ''));
      return {
        value,
        unit: memoryMatch[2],
        formatted: stringValue,
        type: 'memory',
        metadata: { originalValue: value, originalUnit: memoryMatch[2] }
      };
    }

    // Numeric values with commas
    const commaNumberMatch = stringValue.match(/^([\d,]+)$/);
    if (commaNumberMatch) {
      return {
        value: parseInt(commaNumberMatch[1].replace(/,/g, '')),
        formatted: stringValue,
        type: 'count'
      };
    }
    
    // Plain numeric values
    const numericMatch = stringValue.match(/^-?[\d.]+$/);
    if (numericMatch) {
      return {
        value: parseFloat(stringValue),
        formatted: stringValue,
        type: 'count'
      };
    }
    
    // Default to text
    return {
      value: stringValue,
      formatted: stringValue,
      type: 'text'
    };
  }

  /**
   * Generate basic summary for the dataset
   */
  protected generateSummary(
    rows: TridiumDataRow[], 
    formatSpec: TridiumFormatSpec,
    category: TridiumDataCategory
  ): DatasetSummary {
    const summary: DatasetSummary = {
      totalDevices: rows.length,
      statusBreakdown: {
        ok: 0,
        down: 0,
        alarm: 0,
        fault: 0,
        unknown: 0
      },
      typeBreakdown: {},
      criticalFindings: [],
      recommendations: []
    };

    // Analyze rows for status and type information
    rows.forEach(row => {
      // Count status
      if (row.parsedStatus) {
        summary.statusBreakdown[row.parsedStatus.status]++;
        
        if (row.parsedStatus.severity === 'critical') {
          const deviceName = row.data[formatSpec.keyColumn] || 'Unknown Device';
          summary.criticalFindings.push(`${deviceName}: ${row.parsedStatus.details.join(', ')}`);
        }
      }
      
      // Count types - try different type columns
      const typeColumns = ['Type', 'Controller Type', 'Model', 'Category'];
      let deviceType = 'Unknown';
      
      for (const col of typeColumns) {
        if (row.data[col]) {
          deviceType = row.data[col];
          break;
        }
      }
      
      summary.typeBreakdown[deviceType] = (summary.typeBreakdown[deviceType] || 0) + 1;
    });

    // Generate recommendations based on findings
    if (summary.statusBreakdown.down > 0) {
      summary.recommendations.push(`${summary.statusBreakdown.down} devices are offline and require immediate attention`);
    }
    if (summary.statusBreakdown.alarm > 0) {
      summary.recommendations.push(`${summary.statusBreakdown.alarm} devices have unacknowledged alarms`);
    }
    if (summary.statusBreakdown.fault > 0) {
      summary.recommendations.push(`${summary.statusBreakdown.fault} devices show fault conditions`);
    }

    return summary;
  }

  /**
   * Create successful parse result
   */
  protected createSuccessResult(
    dataset: TridiumDataset,
    warnings: string[],
    processingTime: number
  ): ParseResult {
    return {
      success: true,
      dataset,
      errors: [],
      warnings,
      processingTime
    };
  }

  /**
   * Create failed parse result
   */
  protected createErrorResult(
    errors: string[],
    warnings: string[],
    processingTime: number
  ): ParseResult {
    return {
      success: false,
      errors,
      warnings,
      processingTime
    };
  }
}
