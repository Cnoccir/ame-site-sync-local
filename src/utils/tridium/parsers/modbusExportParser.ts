import { TridiumDataset, TridiumDataRow, TridiumDataCategory, TridiumFormatSpec } from '@/types/tridium';
import { TridiumBaseParser, ParseResult } from '../baseParser';
import { logger } from '@/utils/logger';

/**
 * Enhanced Parser for Modbus device exports
 * Extracts comprehensive Modbus device information including:
 * - Device IDs & Names
 * - Slave addressing
 * - Polling interval / COV enabled
 * - Point counts per device
 * - Connection types (TCP/RTU/ASCII)
 * - Errors / Timeouts
 */
export class ModbusExportParser extends TridiumBaseParser {
  getDataCategory(): TridiumDataCategory {
    return 'networkDevices';
  }

  async parse(
    content: string,
    filename: string,
    formatSpec: TridiumFormatSpec
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      logger.info('Starting Modbus Export parsing', { filename });

      const validationErrors = this.validateContent(content, filename);
      if (validationErrors.length > 0) {
        return this.createErrorResult(validationErrors, warnings, Date.now() - startTime);
      }

      const { headers, rows: rawRows } = this.parseCSVContent(content);

      // Flexible validation for Modbus exports
      const essentialFields = ['Name', 'Address'];
      const hasStatus = headers.includes('Status');
      const hasSlaveId = headers.includes('Slave ID') || headers.includes('Slave Id') || headers.includes('SlaveID');

      const missing = essentialFields.filter(c => !headers.includes(c));
      if (missing.length > 0) {
        warnings.push(`Some essential Modbus fields missing: ${missing.join(', ')}`);
      }

      if (!hasStatus) {
        warnings.push('Status column not found - device health analysis will be limited');
      }

      const columns = this.createColumns(headers, formatSpec);

      const rows: TridiumDataRow[] = rawRows.map((rawRow, index) => {
        const rowData: Record<string, any> = {};
        headers.forEach((header, i) => {
          rowData[header] = rawRow[i] ?? '';
        });

        const row: TridiumDataRow = {
          id: `modbus-${index}`,
          selected: false,
          data: rowData
        };

        // Enhanced status parsing
        if (rowData.Status !== undefined) {
          row.parsedStatus = this.parseStatus(String(rowData.Status));
        }

        // Parse and enhance Modbus metadata
        row.metadata = this.extractModbusMetadata(rowData);

        return row;
      });

      // Enhanced summary with Modbus-specific analysis
      const summary = this.generateModbusSummary(rows, formatSpec);

      const dataset: TridiumDataset = {
        id: `modbus-${Date.now()}`,
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
          confidence: 85,
          protocolStats: this.calculateModbusStats(rows)
        },
        rawContent: content
      };

      logger.info('Modbus Export parsing completed', { filename, rowCount: rows.length });
      return this.createSuccessResult(dataset, warnings, Date.now() - startTime);

    } catch (error) {
      logger.error('Modbus Export parsing failed', { filename, error });
      return this.createErrorResult([
        `Modbus Export parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ], warnings, Date.now() - startTime);
    }
  }

  /**
   * Extract comprehensive Modbus device metadata
   */
  private extractModbusMetadata(rowData: Record<string, any>) {
    return {
      slaveId: this.parseNumber(rowData['Slave ID'] || rowData['Slave Id'] || rowData['SlaveID']) ||
               this.parseNumber(rowData.Address),
      address: rowData.Address || '',
      connectionType: this.detectConnectionType(rowData),
      registerCount: this.parseNumber(rowData['Register Count'] || rowData['Registers']),
      coilCount: this.parseNumber(rowData['Coil Count'] || rowData['Coils']),
      pollingRate: this.parseNumber(rowData['Polling Rate'] || rowData['Poll Rate']),
      timeout: this.parseNumber(rowData.Timeout),
      errorCount: this.parseNumber(rowData['Error Count'] || rowData['Errors']),
      enabled: this.parseBoolean(rowData.Enabled, true),
      deviceType: this.categorizeModbusDevice(rowData.Name, rowData.Type),
      vendor: rowData.Vendor || this.inferVendorFromName(rowData.Name),
      model: rowData.Model || 'Unknown'
    };
  }

  /**
   * Detect Modbus connection type from available data
   */
  private detectConnectionType(rowData: Record<string, any>): 'TCP' | 'RTU' | 'ASCII' | 'Unknown' {
    const connectionField = String(rowData['Connection Type'] || rowData['Type'] || '').toUpperCase();

    if (connectionField.includes('TCP')) return 'TCP';
    if (connectionField.includes('RTU')) return 'RTU';
    if (connectionField.includes('ASCII')) return 'ASCII';

    // Infer from address format
    const address = String(rowData.Address || '');
    if (/^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/.test(address)) {
      return 'TCP'; // IP address suggests TCP
    }

    return 'Unknown';
  }

  /**
   * Categorize Modbus device based on name and type
   */
  private categorizeModbusDevice(name?: string, type?: string): string {
    const deviceName = (name || '').toUpperCase();
    const deviceType = (type || '').toUpperCase();

    // Power meters
    if (deviceName.includes('METER') || deviceName.includes('PM') || deviceType.includes('METER')) {
      return 'Power Meter';
    }

    // Variable Frequency Drives
    if (deviceName.includes('VFD') || deviceName.includes('DRIVE') || deviceType.includes('VFD')) {
      return 'VFD';
    }

    // Temperature sensors
    if (deviceName.includes('TEMP') || deviceName.includes('SENSOR') || deviceType.includes('SENSOR')) {
      return 'Sensor';
    }

    // UPS systems
    if (deviceName.includes('UPS') || deviceType.includes('UPS')) {
      return 'UPS';
    }

    // Generic PLC/Controller
    if (deviceName.includes('PLC') || deviceName.includes('CONTROL') || deviceType.includes('PLC')) {
      return 'PLC';
    }

    return deviceType || 'Modbus Device';
  }

  /**
   * Infer vendor from device name patterns
   */
  private inferVendorFromName(name?: string): string {
    if (!name) return 'Unknown';

    const deviceName = name.toUpperCase();

    if (deviceName.includes('ABB')) return 'ABB';
    if (deviceName.includes('SCHNEIDER') || deviceName.includes('SE')) return 'Schneider Electric';
    if (deviceName.includes('SIEMENS')) return 'Siemens';
    if (deviceName.includes('ALLEN') || deviceName.includes('AB')) return 'Allen-Bradley';
    if (deviceName.includes('EATON')) return 'Eaton';
    if (deviceName.includes('GE') || deviceName.includes('GENERAL')) return 'General Electric';
    if (deviceName.includes('HONEYWELL')) return 'Honeywell';
    if (deviceName.includes('YOKOGAWA')) return 'Yokogawa';

    return 'Unknown';
  }

  /**
   * Parse boolean value from various string representations
   */
  private parseBoolean(value: any, defaultValue: boolean = false): boolean {
    if (value === undefined || value === null) return defaultValue;

    const str = String(value).toLowerCase().trim();
    return str === 'true' || str === 'yes' || str === '1' || str === 'on' || str === 'enabled';
  }

  /**
   * Parse numeric value from string
   */
  private parseNumber(value: any): number | undefined {
    if (value === undefined || value === null) return undefined;

    const num = parseFloat(String(value).replace(/[^\d.-]/g, ''));
    return isNaN(num) ? undefined : num;
  }

  /**
   * Generate Modbus-specific summary with device analysis
   */
  private generateModbusSummary(rows: TridiumDataRow[], formatSpec: TridiumFormatSpec) {
    const summary = this.generateSummary(rows, formatSpec, this.getDataCategory());

    // Modbus-specific analysis
    const connectionTypes: Record<string, number> = {};
    const deviceCategories: Record<string, number> = {};
    const vendorBreakdown: Record<string, number> = {};
    const configIssues: string[] = [];
    const communicationIssues: string[] = [];

    rows.forEach(row => {
      const metadata = row.metadata || {};

      // Count connection types
      const connType = metadata.connectionType || 'Unknown';
      connectionTypes[connType] = (connectionTypes[connType] || 0) + 1;

      // Count device categories
      const category = metadata.deviceType || 'Unknown';
      deviceCategories[category] = (deviceCategories[category] || 0) + 1;

      // Count vendors
      const vendor = metadata.vendor || 'Unknown';
      vendorBreakdown[vendor] = (vendorBreakdown[vendor] || 0) + 1;

      // Check for configuration issues
      if (!metadata.enabled) {
        configIssues.push(`${row.data.Name}: Device disabled`);
      }

      if (metadata.timeout && metadata.timeout < 1000) {
        configIssues.push(`${row.data.Name}: Short timeout (${metadata.timeout}ms) may cause communication issues`);
      }

      // Check for communication issues
      if (metadata.errorCount && metadata.errorCount > 0) {
        communicationIssues.push(`${row.data.Name}: ${metadata.errorCount} communication errors`);
      }

      if (row.parsedStatus?.status === 'down') {
        communicationIssues.push(`${row.data.Name}: Device offline`);
      }
    });

    // Add Modbus-specific findings and recommendations
    if (communicationIssues.length > 0) {
      summary.criticalFindings.push(`${communicationIssues.length} devices with communication issues`);
      summary.recommendations.push('Investigate Modbus communication problems for offline devices');
    }

    if (configIssues.length > 0) {
      summary.recommendations.push(`Review configuration for ${configIssues.length} devices with potential issues`);
    }

    // Check for mixed connection types
    const connectionTypeCount = Object.keys(connectionTypes).length;
    if (connectionTypeCount > 1) {
      summary.recommendations.push(`Multiple Modbus connection types in use (${Object.keys(connectionTypes).join(', ')}) - verify network topology`);
    }

    // Update type breakdown to use device categories
    summary.typeBreakdown = deviceCategories;

    // Add Modbus-specific metadata
    (summary as any).modbusAnalysis = {
      connectionTypes,
      deviceCategories,
      vendorBreakdown,
      communicationIssues: communicationIssues.slice(0, 10),
      configIssues: configIssues.slice(0, 10),
      dominantConnectionType: Object.entries(connectionTypes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown',
      dominantVendor: Object.entries(vendorBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
    };

    return summary;
  }

  /**
   * Calculate Modbus-specific statistics
   */
  private calculateModbusStats(rows: TridiumDataRow[]) {
    const stats = {
      totalDevices: rows.length,
      onlineDevices: 0,
      offlineDevices: 0,
      enabledDevices: 0,
      totalRegisters: 0,
      totalCoils: 0,
      averagePollingRate: 0,
      totalErrors: 0,
      connectionTypes: {} as Record<string, number>
    };

    let pollingRateSum = 0;
    let pollingRateCount = 0;

    rows.forEach(row => {
      const metadata = row.metadata || {};

      // Status analysis
      if (row.parsedStatus?.status === 'ok') {
        stats.onlineDevices++;
      } else if (row.parsedStatus?.status === 'down') {
        stats.offlineDevices++;
      }

      // Configuration analysis
      if (metadata.enabled) {
        stats.enabledDevices++;
      }

      if (metadata.registerCount) {
        stats.totalRegisters += metadata.registerCount;
      }

      if (metadata.coilCount) {
        stats.totalCoils += metadata.coilCount;
      }

      if (metadata.pollingRate) {
        pollingRateSum += metadata.pollingRate;
        pollingRateCount++;
      }

      if (metadata.errorCount) {
        stats.totalErrors += metadata.errorCount;
      }

      // Connection type analysis
      const connType = metadata.connectionType || 'Unknown';
      stats.connectionTypes[connType] = (stats.connectionTypes[connType] || 0) + 1;
    });

    if (pollingRateCount > 0) {
      stats.averagePollingRate = Math.round(pollingRateSum / pollingRateCount);
    }

    return stats;
  }
}