import { TridiumDataset, TridiumDataRow, TridiumDataCategory, TridiumFormatSpec } from '@/types/tridium';
import { TridiumBaseParser, ParseResult } from '../baseParser';
import { logger } from '@/utils/logger';

/**
 * Parser for Tridium Resource Export files
 * Handles system metrics like CPU, memory, licensing, and capacity information
 */
export class ResourceExportParser extends TridiumBaseParser {
  
  getDataCategory(): TridiumDataCategory {
    return 'systemMetrics';
  }

  async parse(
    content: string,
    filename: string,
    formatSpec: TridiumFormatSpec
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      logger.info('Starting Resource Export parsing', { filename });

      // Validate content
      const validationErrors = this.validateContent(content, filename);
      if (validationErrors.length > 0) {
        return this.createErrorResult(validationErrors, warnings, Date.now() - startTime);
      }

      // Parse CSV content
      const { headers, rows: rawRows } = this.parseCSVContent(content);

      // Validate Resource Export format - MUST have exactly Name and Value columns
      if (headers.length !== 2 || !headers.includes('Name') || !headers.includes('Value')) {
        return this.createErrorResult([
          `Invalid Resource Export format. Expected exactly 2 columns (Name, Value), got ${headers.length}: ${headers.join(', ')}`
        ], warnings, Date.now() - startTime);
      }

      logger.info('Resource Export format validated', { 
        filename, 
        headers, 
        totalRows: rawRows.length 
      });

      // Create columns
      const columns = this.createColumns(headers, formatSpec);

      // Parse rows with resource-specific logic
      const rows: TridiumDataRow[] = rawRows.map((rawRow, index) => {
        const rowData: Record<string, any> = {};
        
        headers.forEach((header, headerIndex) => {
          rowData[header] = rawRow[headerIndex] || '';
        });

        const row: TridiumDataRow = {
          id: `resource-${index}`,
          selected: false,
          data: rowData
        };

        // Parse the value with resource-specific logic
        if (rowData.Value) {
          const parsedValue = this.parseResourceValue(rowData.Value);
          row.parsedValues = {
            [formatSpec.valueColumn!]: parsedValue
          };
          
          // Add resource metadata
          row.data.category = this.categorizeResource(rowData.Name);
          row.data.isCapacity = parsedValue.metadata?.limit !== undefined;
          row.data.isPercentage = parsedValue.type === 'percentage';
          row.data.isMemory = parsedValue.type === 'memory';
        }

        return row;
      });

      // Generate summary
      const summary = this.generateResourceSummary(rows, formatSpec);

      // Create dataset
      const dataset: TridiumDataset = {
        id: `resource-${Date.now()}`,
        filename,
        format: formatSpec.format,
        category: this.getDataCategory(),
        columns,
        rows,
        summary,
        formatSpec,
        metadata: {
          totalRows: rows.length,
          totalColumns: columns.length,
          parseErrors: [],
          parseWarnings: warnings,
          uploadedAt: new Date(),
          fileSize: content.length,
          processingTime: Date.now() - startTime,
          isValid: true,
          confidence: 100  // Perfect match for resource exports
        },
        rawContent: content
      };

      logger.info('Resource Export parsing completed successfully', {
        filename,
        rowCount: rows.length,
        processingTime: Date.now() - startTime
      });

      return this.createSuccessResult(dataset, warnings, Date.now() - startTime);

    } catch (error) {
      logger.error('Resource Export parsing failed', { filename, error });
      return this.createErrorResult([
        `Resource Export parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ], warnings, Date.now() - startTime);
    }
  }

  /**
   * Parse resource values with enhanced logic for system metrics
   */
  private parseResourceValue(value: string) {
    const parsed = this.parseValue(value);
    
    // Enhanced resource-specific parsing
    const stringValue = String(value).trim();

    // Resource units (kRU - Kilo Resource Units)
    const kruMatch = stringValue.match(/([\d,]+(?:\.\d+)?)\s*kRU/i);
    if (kruMatch) {
      return {
        ...parsed,
        value: parseFloat(kruMatch[1].replace(/,/g, '')),
        unit: 'kRU',
        type: 'count' as const,
        metadata: { ...parsed.metadata, resourceUnit: true }
      };
    }

    // Duration patterns for uptime
    const durationMatch = stringValue.match(/(\d+)\s*days?,\s*(\d+)\s*hours?,\s*(\d+)\s*minutes?/);
    if (durationMatch) {
      const days = parseInt(durationMatch[1]);
      const hours = parseInt(durationMatch[2]);
      const minutes = parseInt(durationMatch[3]);
      const totalMinutes = (days * 24 * 60) + (hours * 60) + minutes;
      
      return {
        ...parsed,
        value: totalMinutes,
        unit: 'minutes',
        type: 'duration' as const,
        metadata: { 
          ...parsed.metadata,
          days, 
          hours, 
          minutes, 
          uptime: true 
        }
      };
    }

    // Timestamp parsing for Niagara formats
    const timestampPatterns = [
      /(\d{1,2}-\w{3}-\d{2,4})\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[AP]M)?)\s*(\w+)?/i,
      /(\d{4}-\d{2}-\d{2})[T\s](\d{2}:\d{2}:\d{2})/
    ];
    
    for (const pattern of timestampPatterns) {
      const match = stringValue.match(pattern);
      if (match) {
        const date = new Date(stringValue);
        if (!isNaN(date.getTime())) {
          return {
            ...parsed,
            value: date.toISOString(),
            type: 'timestamp' as const,
            metadata: { 
              ...parsed.metadata,
              originalTimestamp: stringValue,
              timezone: match[3] || 'Unknown'
            }
          };
        }
      }
    }

    return parsed;
  }

  /**
   * Categorize resource by name
   */
  private categorizeResource(name: string): string {
    if (!name) return 'Unknown';
    
    const resourceName = name.toLowerCase();
    
    // System resources
    if (resourceName.includes('cpu') || resourceName.includes('processor')) return 'CPU';
    if (resourceName.includes('memory') || resourceName.includes('heap') || resourceName.includes('mem.')) return 'Memory';
    if (resourceName.includes('disk') || resourceName.includes('storage') || resourceName.includes('filesystem')) return 'Storage';
    
    // Network and connections
    if (resourceName.includes('connection') || resourceName.includes('socket') || resourceName.includes('fd.')) return 'Network';
    
    // Engine and scanning
    if (resourceName.includes('engine') || resourceName.includes('scan') || resourceName.includes('queue')) return 'Engine';
    
    // Capacity and licensing
    if (resourceName.includes('capacity') || resourceName.includes('licensing') || resourceName.includes('globalcapacity')) return 'Licensing';
    if (resourceName.includes('points') || resourceName.includes('devices') || resourceName.includes('histories')) return 'Capacity';
    if (resourceName.includes('resources') || resourceName.includes('kru')) return 'Resources';
    
    // Time and version info
    if (resourceName.includes('time') || resourceName.includes('uptime') || resourceName.includes('version')) return 'System Info';
    if (resourceName.includes('count') || resourceName.includes('history')) return 'Statistics';
    
    return 'System';
  }

  /**
   * Generate resource-specific summary
   */
  private generateResourceSummary(rows: TridiumDataRow[], formatSpec: TridiumFormatSpec) {
    const summary = this.generateSummary(rows, formatSpec, this.getDataCategory());
    
    // Analyze resource categories
    const categoryBreakdown: Record<string, number> = {};
    const criticalResources: string[] = [];
    const capacityInfo: { name: string; used: number; limit: number; percentage: number }[] = [];
    
    rows.forEach(row => {
      const category = row.data.category || 'Unknown';
      categoryBreakdown[category] = (categoryBreakdown[category] || 0) + 1;
      
      // Check for capacity limits
      if (row.parsedValues && row.parsedValues.Value) {
        const parsedValue = row.parsedValues.Value;
        if (parsedValue.metadata?.limit !== undefined) {
          const percentage = parsedValue.metadata.percentage || 0;
          capacityInfo.push({
            name: row.data.Name,
            used: parsedValue.value as number,
            limit: parsedValue.metadata.limit,
            percentage
          });
          
          // Flag high utilization
          if (percentage > 80) {
            criticalResources.push(`${row.data.Name}: ${percentage.toFixed(1)}% utilized`);
          }
        }
        
        // Check CPU and memory thresholds
        if (parsedValue.type === 'percentage') {
          const value = parsedValue.value as number;
          const name = row.data.Name?.toLowerCase() || '';
          
          if ((name.includes('cpu') && value > 80) || 
              (name.includes('memory') && value > 85)) {
            criticalResources.push(`${row.data.Name}: ${value}% usage`);
          }
        }
      }
    });

    // Update type breakdown to use categories
    summary.typeBreakdown = categoryBreakdown;
    summary.criticalFindings.push(...criticalResources);

    // Add resource-specific recommendations
    if (capacityInfo.some(info => info.percentage > 90)) {
      summary.recommendations.push('Some capacity limits are over 90% - consider upgrading licensing');
    }
    
    const cpuRow = rows.find(row => row.data.Name?.toLowerCase().includes('cpu.usage'));
    if (cpuRow?.parsedValues?.Value && (cpuRow.parsedValues.Value.value as number) > 75) {
      summary.recommendations.push('High CPU usage detected - monitor system performance');
    }
    
    const memoryRows = rows.filter(row => row.data.Name?.toLowerCase().includes('memory') || row.data.Name?.toLowerCase().includes('heap'));
    if (memoryRows.length > 0) {
      summary.recommendations.push('Review memory utilization patterns for optimization opportunities');
    }

    return summary;
  }
}
