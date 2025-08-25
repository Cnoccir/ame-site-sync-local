import { TridiumDataset, TridiumDataRow, CSVColumn, ParsedStatus, ParsedValue, DatasetSummary, TridiumDataTypes } from '@/types/tridium';
import { logger } from '@/utils/logger';

export class TridiumCSVParser {
  private static supportedFormats = {
    'N2Export': {
      identifier: ['Name', 'Status', 'Address', 'Controller Type'],
      statusColumn: 'Status',
      keyColumn: 'Name',
      type: 'networkDevices' as keyof TridiumDataTypes
    },
    'ResourceExport': {
      identifier: ['Name', 'Value'],
      keyColumn: 'Name',
      valueParser: true,
      type: 'resourceMetrics' as keyof TridiumDataTypes
    },
    'BacnetExport': {
      identifier: ['Name', 'Type', 'Device ID', 'Status'],
      statusColumn: 'Status',
      keyColumn: 'Name',
      complexColumns: ['Vendor', 'Model', 'Health', 'Enabled'],
      type: 'bacnetDevices' as keyof TridiumDataTypes
    },
    'NiagaraNetExport': {
      identifier: ['Name', 'Type', 'Address', 'Status'],
      statusColumn: 'Status',
      keyColumn: 'Name',
      hierarchical: true,
      type: 'niagaraStations' as keyof TridiumDataTypes
    },
    'NiagaraPathExport': {
      identifier: ['Path', 'Name', 'Type', 'Status'],
      statusColumn: 'Status',
      keyColumn: 'Name',
      hierarchical: true,
      type: 'niagaraStations' as keyof TridiumDataTypes
    }
  };

  static parseFileContent(fileContent: string, filename: string): TridiumDataset {
    // Check if it's a text file (Platform Details)
    if (filename.toLowerCase().endsWith('.txt')) {
      return this.parsePlatformDetails(fileContent, filename);
    }
    
    return this.parseCSVContent(fileContent, filename);
  }

  static parseCSVContent(csvContent: string, filename: string): TridiumDataset {
    try {
      logger.info('Starting CSV parse', { filename });
      
      const lines = this.splitLines(csvContent);
      if (lines.length < 2) {
        throw new Error('CSV file must have at least a header and one data row');
      }

      const headers = this.parseCSVLine(lines[0]);
      const format = this.detectFormat(headers);
      
      logger.info('Detected format', { 
        format: format?.type, 
        formatName: format?.name, 
        headers: headers.slice(0, 5) 
      });

      const columns = this.createColumns(headers);
      const rows: TridiumDataRow[] = [];
      const parseErrors: string[] = [];

      // Parse data rows
      for (let i = 1; i < lines.length; i++) {
        try {
          const rowData = this.parseCSVLine(lines[i]);
          if (rowData.length === headers.length) {
            const dataObj: Record<string, any> = {};
            headers.forEach((header, index) => {
              dataObj[header] = this.convertValue(rowData[index], columns[index].type);
            });

            const row: TridiumDataRow = {
              id: `row-${i}`,
              selected: false,
              data: dataObj,
            };

            // Parse status if format has status column
            if (format && 'statusColumn' in format && format.statusColumn && dataObj[format.statusColumn]) {
              row.parsedStatus = this.parseStatus(dataObj[format.statusColumn]);
            }

            // Parse values for resource metrics
            if (format && 'valueParser' in format && format.valueParser) {
              row.parsedValues = {};
              Object.entries(dataObj).forEach(([key, value]) => {
                if (key !== format.keyColumn && value) {
                  row.parsedValues![key] = this.parseValue(value);
                }
              });
            }

            rows.push(row);
          }
        } catch (error) {
          parseErrors.push(`Row ${i + 1}: ${error instanceof Error ? error.message : 'Parse error'}`);
        }
      }

      const summary = this.generateSummary(rows, format);

      return {
        id: `dataset-${Date.now()}`,
        filename,
        type: format?.type || 'resourceMetrics',
        columns,
        rows,
        summary,
        metadata: {
          totalRows: rows.length,
          parseErrors,
          uploadedAt: new Date(),
          fileSize: csvContent.length
        }
      };
    } catch (error) {
      logger.error('CSV parse failed', { filename, error });
      throw error;
    }
  }

  private static splitLines(csvContent: string): string[] {
    return csvContent.split(/\r?\n/).filter(line => line.trim());
  }

  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

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
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current.trim());
    return result;
  }

  private static detectFormat(headers: string[]) {
    // Normalize headers for case-insensitive matching
    const normalizedHeaders = headers.map(h => h.toLowerCase().trim());
    
    // Try exact matches first
    for (const [formatName, config] of Object.entries(this.supportedFormats)) {
      const normalizedIdentifiers = config.identifier.map(id => id.toLowerCase().trim());
      const exactMatches = normalizedIdentifiers.filter(id => normalizedHeaders.includes(id));
      
      // For ResourceExport, require exact 2-column match
      if (formatName === 'ResourceExport' && headers.length === 2 && exactMatches.length === 2) {
        return { ...config, name: formatName };
      }
      
      // For other formats, require all required columns
      if (formatName !== 'ResourceExport' && exactMatches.length === normalizedIdentifiers.length) {
        return { ...config, name: formatName };
      }
    }
    
    // Fallback: check for partial matches with high threshold
    for (const [formatName, config] of Object.entries(this.supportedFormats)) {
      const normalizedIdentifiers = config.identifier.map(id => id.toLowerCase().trim());
      const partialMatches = normalizedIdentifiers.filter(id => 
        normalizedHeaders.some(h => h.includes(id) || id.includes(h))
      );
      
      // Require at least 80% match for fallback detection
      if (partialMatches.length >= Math.ceil(normalizedIdentifiers.length * 0.8)) {
        return { ...config, name: formatName };
      }
    }
    
    return null;
  }

  private static createColumns(headers: string[]): CSVColumn[] {
    return headers.map((header, index) => ({
      key: header,
      label: header,
      type: this.detectColumnType(header),
      visible: true,
      sortable: true,
      width: this.calculateColumnWidth(header)
    }));
  }

  private static detectColumnType(header: string): CSVColumn['type'] {
    const lowerHeader = header.toLowerCase();
    
    if (lowerHeader.includes('status') || lowerHeader.includes('health')) {
      return 'status';
    }
    if (lowerHeader.includes('value') || lowerHeader.includes('usage') || lowerHeader.includes('%')) {
      return 'value';
    }
    if (lowerHeader.includes('date') || lowerHeader.includes('time')) {
      return 'date';
    }
    if (lowerHeader.includes('id') || lowerHeader.includes('count') || lowerHeader.includes('number')) {
      return 'number';
    }
    
    return 'text';
  }

  private static calculateColumnWidth(header: string): number {
    const baseWidth = Math.max(header.length * 8, 100);
    return Math.min(baseWidth, 300);
  }

  private static convertValue(value: string, type: CSVColumn['type']): any {
    if (!value || value.trim() === '') return '';
    
    switch (type) {
      case 'number':
        const num = parseFloat(value.replace(/[^0-9.-]/g, ''));
        return isNaN(num) ? value : num;
      case 'date':
        const date = new Date(value);
        return isNaN(date.getTime()) ? value : date.toISOString();
      default:
        return value.trim();
    }
  }

  static parseStatus(statusValue: string): ParsedStatus {
    const status = statusValue.toLowerCase();
    
    if (status.includes('{ok}')) {
      return {
        status: 'ok',
        severity: 'normal',
        details: ['System operational'],
        badge: { text: 'OK', variant: 'success' }
      };
    }
    
    if (status.includes('{down}')) {
      const hasAlarm = status.includes('alarm');
      const hasFault = status.includes('fault');
      
      return {
        status: hasFault ? 'fault' : 'down',
        severity: 'critical',
        details: [
          'Device offline',
          ...(hasAlarm ? ['Alarm condition present'] : []),
          ...(hasFault ? ['Fault detected'] : [])
        ],
        badge: { text: hasFault ? 'FAULT/DOWN' : 'DOWN', variant: 'destructive' }
      };
    }
    
    if (status.includes('{unackedalarm}') || status.includes('{alarm}')) {
      return {
        status: 'alarm',
        severity: 'warning',
        details: ['Unacknowledged alarm'],
        badge: { text: 'ALARM', variant: 'warning' }
      };
    }
    
    return {
      status: 'unknown',
      severity: 'normal',
      details: ['Status unclear'],
      badge: { text: statusValue || 'UNKNOWN', variant: 'default' }
    };
  }

  static parseValue(value: any): ParsedValue {
    const stringValue = String(value).trim();
    
    // Percentage
    if (stringValue.includes('%')) {
      const num = parseFloat(stringValue.replace('%', ''));
      return {
        value: isNaN(num) ? 0 : num,
        unit: '%',
        formatted: stringValue,
        type: 'percentage'
      };
    }
    
    // Memory with units
    if (stringValue.match(/\d+\s*(MB|GB|KB|bytes?)/i)) {
      const match = stringValue.match(/(\d+(?:\.\d+)?)\s*(MB|GB|KB|bytes?)/i);
      if (match) {
        return {
          value: parseFloat(match[1]),
          unit: match[2],
          formatted: stringValue,
          type: 'memory'
        };
      }
    }
    
    // Count with limit
    if (stringValue.match(/\d+.*\(.*limit.*\)/i)) {
      const match = stringValue.match(/(\d+(?:,\d+)*)/);
      if (match) {
        return {
          value: parseInt(match[1].replace(/,/g, '')),
          formatted: stringValue,
          type: 'count'
        };
      }
    }
    
    // Duration
    if (stringValue.match(/\d+\s*(day|hour|minute|second)/i)) {
      return {
        value: stringValue,
        formatted: stringValue,
        type: 'duration'
      };
    }
    
    // Timestamp
    if (stringValue.match(/\d{1,2}-\w{3}-\d{2,4}/)) {
      const date = new Date(stringValue);
      return {
        value: isNaN(date.getTime()) ? stringValue : date.toISOString(),
        formatted: stringValue,
        type: 'timestamp'
      };
    }
    
    // Plain number
    const num = parseFloat(stringValue.replace(/[^0-9.-]/g, ''));
    if (!isNaN(num) && stringValue.match(/^\d+(?:\.\d+)?$/)) {
      return {
        value: num,
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

  private static generateSummary(rows: TridiumDataRow[], format: any): DatasetSummary {
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

    // Analyze rows
    rows.forEach(row => {
      // Count status
      if (row.parsedStatus) {
        summary.statusBreakdown[row.parsedStatus.status]++;
        
        if (row.parsedStatus.severity === 'critical') {
          const deviceName = row.data[format?.keyColumn || 'Name'] || 'Unknown Device';
          summary.criticalFindings.push(`${deviceName}: ${row.parsedStatus.details.join(', ')}`);
        }
      }
      
      // Count types
      const type = row.data['Type'] || row.data['Controller Type'] || 'Unknown';
      summary.typeBreakdown[type] = (summary.typeBreakdown[type] || 0) + 1;
    });

    // Generate recommendations
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

  static parsePlatformDetails(textContent: string, filename: string): TridiumDataset {
    try {
      logger.info('Parsing platform details', { filename });
      
      const lines = textContent.split(/\r?\n/).filter(line => line.trim());
      const platformData: Record<string, any> = {};
      
      let currentSection = '';
      let sectionData: string[] = [];
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Detect section headers
        if (trimmedLine.includes('Platform Summary') || 
            trimmedLine.includes('Modules') || 
            trimmedLine.includes('Applications') || 
            trimmedLine.includes('Licenses')) {
          
          // Save previous section
          if (currentSection && sectionData.length > 0) {
            platformData[currentSection] = sectionData.join('; ');
          }
          
          currentSection = trimmedLine.replace(':', '').trim();
          sectionData = [];
        } else if (trimmedLine && currentSection) {
          // Extract key-value pairs
          if (trimmedLine.includes(':')) {
            const [key, ...valueParts] = trimmedLine.split(':');
            const value = valueParts.join(':').trim();
            platformData[key.trim()] = value;
          } else {
            sectionData.push(trimmedLine);
          }
        }
      }
      
      // Save last section
      if (currentSection && sectionData.length > 0) {
        platformData[currentSection] = sectionData.join('; ');
      }

      // Create columns for platform data
      const columns: CSVColumn[] = Object.keys(platformData).map(key => ({
        key,
        label: key,
        type: 'text' as const,
        visible: true,
        sortable: false,
        width: 200
      }));

      // Create a single row for platform data
      const row: TridiumDataRow = {
        id: 'platform-details',
        selected: false,
        data: platformData
      };

      const summary: DatasetSummary = {
        totalDevices: 1,
        statusBreakdown: { ok: 1, down: 0, alarm: 0, fault: 0, unknown: 0 },
        typeBreakdown: { 'Platform Details': 1 },
        criticalFindings: [],
        recommendations: ['Review platform details for system specifications and licensing']
      };

      return {
        id: `platform-${Date.now()}`,
        filename,
        type: 'resourceMetrics',
        columns,
        rows: [row],
        summary,
        metadata: {
          totalRows: 1,
          parseErrors: [],
          uploadedAt: new Date(),
          fileSize: textContent.length
        }
      };
    } catch (error) {
      logger.error('Platform details parse failed', { filename, error });
      throw error;
    }
  }
}