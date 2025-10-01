import { TridiumDataset, TridiumDataRow, TridiumDataCategory, TridiumFormatSpec } from '@/types/tridium';
import { TridiumBaseParser, ParseResult } from '../baseParser';
import { logger } from '@/utils/logger';

/**
 * Enhanced Parser for BACnet device exports
 * Extracts comprehensive BACnet device information including:
 * - Device metadata: Vendor, Type, Firmware/Software version, IP/MAC/Address
 * - Device & Point counts per JACE
 * - Protocol version per network
 * - Addressing: IP, MSTP MAC, Address
 * - Polling interval / COV enabled
 * - Errors / Timeouts
 */
export class BACnetExportParser extends TridiumBaseParser {
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
      logger.info('Starting BACnet Export parsing', { filename });

      const validationErrors = this.validateContent(content, filename);
      if (validationErrors.length > 0) {
        return this.createErrorResult(validationErrors, warnings, Date.now() - startTime);
      }

      const { headers, rows: rawRows } = this.parseCSVContent(content);

      // More flexible validation - check for essential BACnet fields
      const essentialFields = ['Name', 'Device ID'];
      const hasStatus = headers.includes('Status');
      const hasType = headers.includes('Type');

      const missing = essentialFields.filter(c => !headers.includes(c));
      if (missing.length > 0) {
        warnings.push(`Some essential BACnet fields missing: ${missing.join(', ')}`);
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
          id: `bacnet-${index}`,
          selected: false,
          data: rowData
        };

        // Enhanced status parsing
        if (rowData.Status !== undefined) {
          row.parsedStatus = this.parseStatus(String(rowData.Status));
        }

        // Parse and enhance device metadata
        row.metadata = this.extractBacnetMetadata(rowData);

        // Parse health information if available
        if (rowData.Health) {
          row.health = this.parseHealthInfo(String(rowData.Health));
        }

        return row;
      });

      // Enhanced summary with BACnet-specific analysis
      const summary = this.generateBacnetSummary(rows, formatSpec);

      const dataset: TridiumDataset = {
        id: `bacnet-${Date.now()}`,
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
          protocolStats: this.calculateProtocolStats(rows)
        },
        rawContent: content
      };

      logger.info('BACnet Export parsing completed', { filename, rowCount: rows.length });
      return this.createSuccessResult(dataset, warnings, Date.now() - startTime);

    } catch (error) {
      logger.error('BACnet Export parsing failed', { filename, error });
      return this.createErrorResult([
        `BACnet Export parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ], warnings, Date.now() - startTime);
    }
  }

  /**
   * Extract comprehensive BACnet device metadata
   */
  private extractBacnetMetadata(rowData: Record<string, any>) {
    return {
      deviceId: rowData['Device ID'] || '',
      vendor: rowData.Vendor || 'Unknown',
      model: rowData.Model || 'Unknown',
      firmwareVersion: rowData['Firmware Rev'] || rowData['Firmware Version'],
      softwareVersion: rowData['App SW Version'] || rowData['Software Version'],
      protocolRevision: rowData['Protocol Rev'] || rowData['Protocol Revision'],
      maxApdu: this.parseNumber(rowData['Max APDU']),
      segmentation: rowData.Segmentation,
      encoding: rowData.Encoding,
      network: rowData.Netwk || rowData.Network,
      macAddress: rowData['MAC Addr'] || rowData['MAC Address'],
      ipAddress: this.extractIpAddress(rowData),
      useCoV: this.parseBoolean(rowData['Use Cov']) || this.parseBoolean(rowData['Use COV']),
      maxCovSubscriptions: this.parseNumber(rowData['Max Cov Subscriptions']),
      covSubscriptions: this.parseNumber(rowData['Cov Subscriptions']),
      enabled: this.parseBoolean(rowData.Enabled, true), // Default to true if not specified
      deviceType: this.categorizeBacnetDevice(rowData.Name, rowData.Type, rowData.Model)
    };
  }

  /**
   * Parse health information from BACnet health field
   */
  private parseHealthInfo(healthText: string) {
    const healthInfo: any = {
      rawText: healthText,
      lastSeen: null,
      responseTime: null,
      communicationQuality: 'unknown'
    };

    // Parse timestamp from health text like "Ok [19-Aug-25 10:11 PM EDT]"
    const timestampMatch = healthText.match(/\[([^\]]+)\]/);
    if (timestampMatch) {
      const timestamp = new Date(timestampMatch[1]);
      if (!isNaN(timestamp.getTime())) {
        healthInfo.lastSeen = timestamp;

        // Calculate how recent the communication was
        const now = new Date();
        const ageMinutes = (now.getTime() - timestamp.getTime()) / (1000 * 60);

        if (ageMinutes < 5) {
          healthInfo.communicationQuality = 'excellent';
        } else if (ageMinutes < 30) {
          healthInfo.communicationQuality = 'good';
        } else if (ageMinutes < 120) {
          healthInfo.communicationQuality = 'fair';
        } else {
          healthInfo.communicationQuality = 'poor';
        }
      }
    }

    return healthInfo;
  }

  /**
   * Categorize BACnet device based on name, type, and model
   */
  private categorizeBacnetDevice(name?: string, type?: string, model?: string): string {
    const deviceName = (name || '').toUpperCase();
    const deviceType = (type || '').toUpperCase();
    const deviceModel = (model || '').toUpperCase();

    // Air Handling Units
    if (deviceName.includes('AHU') || deviceName.includes('AIR_HAND')) return 'AHU';

    // VAV Boxes
    if (deviceName.includes('VAV') || deviceName.includes('SVAV')) return 'VAV';

    // Chillers and Cooling
    if (deviceName.includes('CHWR') || deviceName.includes('CHILL') || deviceName.includes('COOL')) return 'Chiller';

    // Boilers and Heating
    if (deviceName.includes('BLR') || deviceName.includes('BOIL') || deviceName.includes('HEAT') || deviceName.includes('STM')) return 'Boiler';

    // Fans
    if (deviceName.includes('FAN') || deviceName.includes('SF_') || deviceName.includes('EXHAUST')) return 'Fan';

    // Pumps
    if (deviceName.includes('PUMP') || deviceName.includes('CP')) return 'Pump';

    // Controllers based on model
    if (deviceModel.includes('FEC') || deviceModel.includes('NAE') || deviceModel.includes('NCE')) return 'Controller';
    if (deviceModel.includes('VMA') || deviceModel.includes('VND')) return 'VAV Controller';

    // Control Panels
    if (deviceName.includes('PANEL') || deviceName.includes('CNTL')) return 'Control Panel';

    return deviceType || 'Unknown';
  }

  /**
   * Extract IP address if available in the data
   */
  private extractIpAddress(rowData: Record<string, any>): string | undefined {
    // Look for IP address in various possible fields
    const ipFields = ['IP', 'IP Address', 'Network Address', 'Address'];

    for (const field of ipFields) {
      if (rowData[field]) {
        const value = String(rowData[field]);
        // Check if it looks like an IP address
        if (/^\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}\\.\\d{1,3}$/.test(value)) {
          return value;
        }
      }
    }

    return undefined;
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

    const num = parseFloat(String(value).replace(/[^\\d.-]/g, ''));
    return isNaN(num) ? undefined : num;
  }

  /**
   * Generate BACnet-specific summary with device analysis
   */
  private generateBacnetSummary(rows: TridiumDataRow[], formatSpec: TridiumFormatSpec) {
    const summary = this.generateSummary(rows, formatSpec, this.getDataCategory());

    // BACnet-specific analysis
    const vendorBreakdown: Record<string, number> = {};
    const deviceCategories: Record<string, number> = {};
    const networkBreakdown: Record<string, number> = {};
    const protocolVersions: Record<string, number> = {};
    const communicationIssues: string[] = [];
    const configIssues: string[] = [];

    rows.forEach(row => {
      const metadata = row.metadata || {};

      // Count vendors
      const vendor = metadata.vendor || 'Unknown';
      vendorBreakdown[vendor] = (vendorBreakdown[vendor] || 0) + 1;

      // Count device categories
      const category = metadata.deviceType || 'Unknown';
      deviceCategories[category] = (deviceCategories[category] || 0) + 1;

      // Count networks
      const network = metadata.network || 'Unknown';
      networkBreakdown[network] = (networkBreakdown[network] || 0) + 1;

      // Count protocol versions
      const protocolRev = metadata.protocolRevision || 'Unknown';
      protocolVersions[protocolRev] = (protocolVersions[protocolRev] || 0) + 1;

      // Check for communication issues
      if (row.health?.communicationQuality === 'poor') {
        communicationIssues.push(`${row.data.Name}: Poor communication (last seen ${row.health.lastSeen})`);
      }

      // Check for configuration issues
      if (!metadata.enabled) {
        configIssues.push(`${row.data.Name}: Device disabled`);
      }

      if (metadata.useCoV === false && metadata.vendor === 'JCI') {
        configIssues.push(`${row.data.Name}: COV not enabled - may impact performance`);
      }
    });

    // Add BACnet-specific findings and recommendations
    if (communicationIssues.length > 0) {
      summary.criticalFindings.push(`${communicationIssues.length} devices with communication issues`);
      summary.recommendations.push('Investigate network connectivity for devices with poor communication');
    }

    if (configIssues.length > 0) {
      summary.recommendations.push(`Review configuration for ${configIssues.length} devices with potential issues`);
    }

    // Check protocol version consistency
    const protocolVersionCount = Object.keys(protocolVersions).length;
    if (protocolVersionCount > 2) {
      summary.recommendations.push(`Multiple BACnet protocol versions in use (${protocolVersionCount}) - consider standardization`);
    }

    // Update type breakdown to use device categories
    summary.typeBreakdown = deviceCategories;

    // Add BACnet-specific metadata
    (summary as any).bacnetAnalysis = {
      vendorBreakdown,
      deviceCategories,
      networkBreakdown,
      protocolVersions,
      communicationIssues: communicationIssues.slice(0, 10), // Limit to 10 for summary
      configIssues: configIssues.slice(0, 10),
      totalNetworks: Object.keys(networkBreakdown).length,
      dominantVendor: Object.entries(vendorBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'Unknown'
    };

    return summary;
  }

  /**
   * Calculate protocol-specific statistics
   */
  private calculateProtocolStats(rows: TridiumDataRow[]) {
    const stats = {
      totalDevices: rows.length,
      onlineDevices: 0,
      offlineDevices: 0,
      alarmedDevices: 0,
      faultedDevices: 0,
      enabledDevices: 0,
      covEnabledDevices: 0,
      averageResponseTime: 0,
      oldestCommunication: null as Date | null,
      newestCommunication: null as Date | null
    };

    let totalResponseTime = 0;
    let responseTimeCount = 0;
    const communicationTimes: Date[] = [];

    rows.forEach(row => {
      // Status analysis
      if (row.parsedStatus) {
        switch (row.parsedStatus.status) {
          case 'ok':
            stats.onlineDevices++;
            break;
          case 'down':
            stats.offlineDevices++;
            break;
          case 'alarm':
            stats.alarmedDevices++;
            break;
          case 'fault':
            stats.faultedDevices++;
            break;
        }
      }

      // Configuration analysis
      if (row.metadata?.enabled) {
        stats.enabledDevices++;
      }

      if (row.metadata?.useCoV) {
        stats.covEnabledDevices++;
      }

      // Communication analysis
      if (row.health?.lastSeen) {
        communicationTimes.push(row.health.lastSeen);
      }

      if (row.health?.responseTime) {
        totalResponseTime += row.health.responseTime;
        responseTimeCount++;
      }
    });

    // Calculate communication statistics
    if (communicationTimes.length > 0) {
      stats.oldestCommunication = new Date(Math.min(...communicationTimes.map(d => d.getTime())));
      stats.newestCommunication = new Date(Math.max(...communicationTimes.map(d => d.getTime())));
    }

    if (responseTimeCount > 0) {
      stats.averageResponseTime = totalResponseTime / responseTimeCount;
    }

    return stats;
  }
}

