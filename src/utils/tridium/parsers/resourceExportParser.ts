import { TridiumDataset, TridiumDataRow, TridiumDataCategory, TridiumFormatSpec } from '@/types/tridium';
import { TridiumBaseParser, ParseResult } from '../baseParser';
import { logger } from '@/utils/logger';

export interface ResourceAlert {
  metric: string;
  value: string;
  threshold: string;
  severity: 'warning' | 'critical';
  recommendation: string;
}

export interface ResourceExportOutput {
  resources: {
    components: number;
    devices: { used: number; licensed: number; usage_percent: number; };
    points: { used: number; licensed: number; usage_percent: number; };
    histories: number;
    resource_units: {
      total: number;
      breakdown: Record<string, number>;
    };
    cpu: {
      usage_percent: number;
    };
    memory: {
      used_mb: number;
      total_mb: number;
      usage_percent: number;
    };
    engine: {
      queue_current: number;
      queue_peak: number;
      scan_time_ms: number;
    };
    heap: {
      used_mb: number;
      max_mb: number;
      percent_used: number;
    };
    time: {
      current: string;
      start: string;
      uptime: string;
      uptime_seconds?: number;
      uptime_days?: number;
      uptime_hours?: number;
      uptime_minutes?: number;
      uptime_secs?: number;
    };
  };
  alerts: ResourceAlert[];
  raw_data?: Record<string, string>;
}

/**
 * Enhanced Parser for Niagara ResourceExport.csv files
 * Extracts and evaluates resource usage fields against operational thresholds.
 * Supports both Supervisor and JACE systems with comprehensive alerting.
 *
 * Output supports:
 * - Interactive React UI visualization (charts, usage gauges, resource breakdowns, uptime badges)
 * - Static PDF export (tables, baselines, alerts, timestamps)
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

      const validationErrors = this.validateContent(content, filename);
      if (validationErrors.length > 0) {
        return this.createErrorResult(validationErrors, warnings, Date.now() - startTime);
      }

      // Parse CSV content
      const { headers, rows: rawRows } = this.parseCSVContent(content);

      // Validate Resource Export format
      if (headers.length !== 2 || !headers.includes('Name') || !headers.includes('Value')) {
        return this.createErrorResult([
          `Invalid Resource Export format. Expected exactly 2 columns (Name, Value), got ${headers.length}: ${headers.join(', ')}`
        ], warnings, Date.now() - startTime);
      }

      // Create raw data map
      const rawData: Record<string, string> = {};
      rawRows.forEach(row => {
        if (row[0] && row[1]) {
          rawData[row[0].trim()] = row[1].trim();
        }
      });

      // Parse content into normalized structure
      const parsedData = this.parseResourceData(rawData, warnings);

      // Generate alerts based on thresholds
      const alerts = this.generateResourceAlerts(parsedData, filename, warnings);

      // Create normalized output structure
      const normalizedOutput: ResourceExportOutput = {
        resources: parsedData,
        alerts,
        raw_data: rawData
      };

      // Create legacy format for existing UI compatibility
      const legacyData = this.createLegacyFormat(parsedData, alerts, rawData);
      const columns = this.createColumns(Object.keys(legacyData), formatSpec);

      const rows: TridiumDataRow[] = [{
        id: 'resource-0',
        selected: false,
        data: legacyData,
        metadata: {
          normalizedData: normalizedOutput,
          alerts: alerts
        }
      }];

      const summary = this.generateEnhancedSummary(normalizedOutput);

      const dataset: TridiumDataset = {
        id: `resource-${Date.now()}`,
        filename,
        format: 'ResourceExport',
        category: this.getDataCategory(),
        columns,
        rows,
        summary,
        formatSpec: {
          format: 'ResourceExport',
          displayName: 'Resource Export',
          description: 'Comprehensive resource utilization and performance metrics',
          fileTypes: ['.csv'],
          requiredColumns: ['Name', 'Value'],
          optionalColumns: [],
          identifierColumns: ['Name'],
          keyColumn: 'Name'
        },
        metadata: {
          totalRows: rows.length,
          totalColumns: columns.length,
          parseErrors: [],
          parseWarnings: warnings,
          uploadedAt: new Date(),
          fileSize: content.length,
          processingTime: Date.now() - startTime,
          isValid: true,
          confidence: 98,
          normalizedData: normalizedOutput,
          alerts: alerts
        },
        rawContent: content
      };

      logger.info('Resource Export parsing completed', { filename, alertCount: alerts.length });
      return this.createSuccessResult(dataset, warnings, Date.now() - startTime);

    } catch (error) {
      logger.error('Resource Export parsing failed', { filename, error });
      return this.createErrorResult([
        `Resource Export parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ], warnings, Date.now() - startTime);
    }
  }

  /**
   * Parse resource data into normalized structure
   */
  private parseResourceData(rawData: Record<string, string>, warnings: string[]) {
    // Extract component count
    const components = this.parseNumber(rawData['component.count']) || 0;

    // Extract device and point capacity
    const deviceCapacity = this.parseCapacityString(rawData['globalCapacity.devices']);
    const pointCapacity = this.parseCapacityString(rawData['globalCapacity.points']);
    const devicePercent = deviceCapacity.limit > 0 ? Math.round((deviceCapacity.used / deviceCapacity.limit) * 100) : 0;
    const pointPercent = pointCapacity.limit > 0 ? Math.round((pointCapacity.used / pointCapacity.limit) * 100) : 0;

    // Extract histories
    const histories = this.parseNumber(rawData['history.count']) || 0;

    // Extract CPU usage
    const cpuUsage = this.parseNumber(rawData['cpu.usage']) || 0;

    // Extract memory statistics
    const memTotal = this.parseMemoryValue(rawData['mem.total']);
    const memUsed = this.parseMemoryValue(rawData['mem.used']);
    const memPercent = memTotal > 0 ? Math.round((memUsed / memTotal) * 100) : 0;

    // Extract resource units
    const resourceTotal = this.parseResourceUnits(rawData['resources.total']);
    const resourceBreakdown = this.parseResourceBreakdown(rawData);

    // Extract engine statistics
    const queueCurrent = this.parseQueueValue(rawData['engine.queue.actions']);
    const queuePeak = this.parseQueuePeak(rawData['engine.queue.actions']);
    const scanTime = this.parseNumber(rawData['engine.scan.recent']) || 0;

    // Extract heap statistics
    const heapUsed = this.parseMemoryValue(rawData['heap.used']);
    const heapMax = this.parseMemoryValue(rawData['heap.max']);
    const heapPercent = heapMax > 0 ? Math.round((heapUsed / heapMax) * 100) : 0;

    // Extract time metrics
    const timeCurrent = this.parseTimestamp(rawData['time.current']);
    const timeStart = this.parseTimestamp(rawData['time.start']);
    const uptime = rawData['time.uptime'] || '';
    const uptimeSeconds = this.parseUptimeToSeconds(uptime);

    // Parse uptime components
    const uptimeComponents = this.parseUptimeComponents(uptime);

    return {
      components,
      devices: {
        used: deviceCapacity.used,
        licensed: deviceCapacity.limit,
        usage_percent: devicePercent
      },
      points: {
        used: pointCapacity.used,
        licensed: pointCapacity.limit,
        usage_percent: pointPercent
      },
      histories,
      resource_units: {
        total: resourceTotal,
        breakdown: resourceBreakdown
      },
      cpu: {
        usage_percent: cpuUsage
      },
      memory: {
        used_mb: memUsed,
        total_mb: memTotal,
        usage_percent: memPercent
      },
      engine: {
        queue_current: queueCurrent,
        queue_peak: queuePeak,
        scan_time_ms: scanTime
      },
      heap: {
        used_mb: heapUsed,
        max_mb: heapMax,
        percent_used: heapPercent
      },
      time: {
        current: timeCurrent,
        start: timeStart,
        uptime,
        uptime_seconds: uptimeSeconds,
        uptime_days: uptimeComponents.days,
        uptime_hours: uptimeComponents.hours,
        uptime_minutes: uptimeComponents.minutes,
        uptime_secs: uptimeComponents.seconds
      }
    };
  }

  /**
   * Generate alerts based on thresholds and best practices
   */
  private generateResourceAlerts(
    data: ReturnType<typeof this.parseResourceData>,
    filename: string,
    warnings: string[]
  ): ResourceAlert[] {
    const alerts: ResourceAlert[] = [];
    const isJace = filename.toLowerCase().includes('jace');

    // Device capacity check
    if (data.devices.licensed > 0) {
      const devicePercent = (data.devices.used / data.devices.licensed) * 100;
      if (devicePercent > 90) {
        alerts.push({
          metric: 'Device Capacity',
          value: `${data.devices.used}/${data.devices.licensed} (${devicePercent.toFixed(1)}%)`,
          threshold: '90%',
          severity: 'warning',
          recommendation: 'Device usage near license limit - consider upgrading license'
        });
      }
    }

    // Point capacity check
    if (data.points.licensed > 0) {
      const pointPercent = (data.points.used / data.points.licensed) * 100;
      if (pointPercent > 90) {
        alerts.push({
          metric: 'Point Capacity',
          value: `${data.points.used}/${data.points.licensed} (${pointPercent.toFixed(1)}%)`,
          threshold: '90%',
          severity: 'warning',
          recommendation: 'Point usage near license limit - consider upgrading license'
        });
      }
    }

    // Histories check (JACE specific)
    if (isJace && data.histories > 6000) {
      alerts.push({
        metric: 'History Count',
        value: data.histories.toString(),
        threshold: '6000',
        severity: 'warning',
        recommendation: 'History count exceeds Tridium guidelines for JACE - consider archival'
      });
    }

    // Resource Units check
    if (data.resource_units.total > 0) {
      Object.entries(data.resource_units.breakdown).forEach(([category, value]) => {
        const percent = (value / data.resource_units.total) * 100;
        if (percent > 80) {
          alerts.push({
            metric: `Resource Units (${category})`,
            value: `${value.toFixed(1)} kRU (${percent.toFixed(1)}%)`,
            threshold: '80% of total',
            severity: 'warning',
            recommendation: `High resource usage in ${category} category - review performance tuning`
          });
        }
      });
    }

    // Engine queue check
    if (data.engine.queue_current > 5000) {
      alerts.push({
        metric: 'Engine Queue',
        value: data.engine.queue_current.toString(),
        threshold: '5000',
        severity: 'warning',
        recommendation: 'High engine queue - potential bottleneck, review station tuning'
      });
    }

    // Scan time check
    if (data.engine.scan_time_ms > 500) {
      alerts.push({
        metric: 'Scan Time',
        value: `${data.engine.scan_time_ms}ms`,
        threshold: '500ms',
        severity: 'warning',
        recommendation: 'High scan time detected - review station configuration and tuning'
      });
    }

    // Heap usage check
    if (data.heap.percent_used > 75) {
      alerts.push({
        metric: 'Heap Usage',
        value: `${data.heap.percent_used}%`,
        threshold: '75%',
        severity: data.heap.percent_used > 90 ? 'critical' : 'warning',
        recommendation: data.heap.percent_used > 90
          ? 'Critical heap usage - immediate action required'
          : 'High heap usage - review memory optimization'
      });
    }

    // Uptime check (very high uptime without reboot)
    if (data.time.uptime_seconds && data.time.uptime_seconds > 365 * 24 * 3600) {
      alerts.push({
        metric: 'System Uptime',
        value: data.time.uptime,
        threshold: '365 days',
        severity: 'warning',
        recommendation: 'Very high uptime - recommend planned restart to clear memory fragmentation'
      });
    }

    // Timestamp validation
    if (!data.time.current || data.time.current === 'Invalid Date') {
      alerts.push({
        metric: 'Export Timestamp',
        value: 'Missing or invalid',
        threshold: 'Valid timestamp',
        severity: 'critical',
        recommendation: 'Invalid export timestamp - data may be corrupt or incomplete'
      });
    }

    return alerts;
  }

  /**
   * Create legacy format for existing UI compatibility
   */
  private createLegacyFormat(
    data: ReturnType<typeof this.parseResourceData>,
    alerts: ResourceAlert[],
    rawData: Record<string, string>
  ): Record<string, any> {
    return {
      'Components': data.components,
      'Devices Used': data.devices.used,
      'Devices Licensed': data.devices.licensed,
      'Device Utilization (%)': data.devices.licensed > 0
        ? Math.round((data.devices.used / data.devices.licensed) * 100)
        : 0,
      'Points Used': data.points.used,
      'Points Licensed': data.points.licensed,
      'Point Utilization (%)': data.points.licensed > 0
        ? Math.round((data.points.used / data.points.licensed) * 100)
        : 0,
      'Histories': data.histories,
      'Total Resource Units (kRU)': data.resource_units.total,
      'Heap Used (MB)': data.heap.used_mb,
      'Heap Max (MB)': data.heap.max_mb,
      'Heap Utilization (%)': data.heap.percent_used,
      'Engine Queue Current': data.engine.queue_current,
      'Engine Queue Peak': data.engine.queue_peak,
      'Scan Time (ms)': data.engine.scan_time_ms,
      'Export Timestamp': data.time.current,
      'System Start': data.time.start,
      'Uptime': data.time.uptime,
      'Alert Count': alerts.length,
      'Critical Alerts': alerts.filter(a => a.severity === 'critical').length,
      'CPU Usage': rawData['cpu.usage'] || 'N/A',
      'Memory Total (MB)': this.parseMemoryValue(rawData['mem.total'] || '0'),
      'Memory Used (MB)': this.parseMemoryValue(rawData['mem.used'] || '0')
    };
  }

  /**
   * Generate enhanced summary
   */
  private generateEnhancedSummary(data: ResourceExportOutput) {
    const criticalAlerts = data.alerts.filter(a => a.severity === 'critical');
    const warningAlerts = data.alerts.filter(a => a.severity === 'warning');

    return {
      totalDevices: 1,
      statusBreakdown: {
        ok: criticalAlerts.length === 0 ? 1 : 0,
        alarm: warningAlerts.length > 0 ? 1 : 0,
        fault: criticalAlerts.length > 0 ? 1 : 0,
        down: 0,
        unknown: 0
      },
      typeBreakdown: {
        'Resource Export': 1
      },
      criticalFindings: criticalAlerts.map(a => `${a.metric}: ${a.value}`),
      recommendations: data.alerts.map(a => a.recommendation)
    };
  }

  // Helper methods for parsing specific data formats
  private parseNumber(value?: string): number {
    if (!value) return 0;
    const cleaned = value.replace(/[^\d.]/g, '');
    return parseFloat(cleaned) || 0;
  }

  private parseCapacityString(value?: string): { used: number; limit: number } {
    if (!value) return { used: 0, limit: 0 };

    // Support both "84 (Limit: 101)" and "150 (3000)" and comma-separated numbers
    const match = value.match(/([\d,]+)\s*\((?:Limit:\s*)?([\d,]+|none)\)/i);
    if (match) {
      const used = parseInt(match[1].replace(/,/g, ''));
      const limit = match[2].toLowerCase && match[2].toLowerCase() === 'none' ? 0 : parseInt(String(match[2]).replace(/,/g, ''));
      return { used, limit: isNaN(limit) ? 0 : limit };
    }

    // Fallback: try simple "used/limit" pattern
    const slash = value.match(/([\d,]+)\s*\/\s*([\d,]+)/);
    if (slash) {
      return { used: parseInt(slash[1].replace(/,/g, '')), limit: parseInt(slash[2].replace(/,/g, '')) };
    }

    return { used: 0, limit: 0 };
  }

  private parseResourceUnits(value?: string): number {
    if (!value) return 0;
    // Format: "2,618.101 kRU"
    const match = value.match(/([\d,]+(?:\.\d+)?)/);
    return match ? parseFloat(match[1].replace(/,/g, '')) : 0;
  }

  private parseResourceBreakdown(rawData: Record<string, string>): Record<string, number> {
    const breakdown: Record<string, number> = {};

    Object.entries(rawData).forEach(([key, value]) => {
      if (key.startsWith('resources.category.')) {
        const category = key.replace('resources.category.', '');
        breakdown[category] = this.parseResourceUnits(value);
      }
    });

    return breakdown;
  }

  private parseQueueValue(value?: string): number {
    if (!value) return 0;
    // Format: "0 (Peak 2212)"
    const match = value.match(/^(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private parseQueuePeak(value?: string): number {
    if (!value) return 0;
    // Format: "0 (Peak 2212)"
    const match = value.match(/Peak\s+(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private parseMemoryValue(value?: string): number {
    if (!value) return 0;
    // Format: "265 MB"
    const match = value.match(/(\d+)/);
    return match ? parseInt(match[1]) : 0;
  }

  private parseTimestamp(value?: string): string {
    if (!value) return '';

    try {
      // Try to parse Niagara timestamp format: "19-Aug-25 2:13 PM EDT"
      const niagaraMatch = value.match(/(\d{1,2})-(\w{3})-(\d{2,4})\s+(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([AP]M)?\s*(\w+)?/i);
      if (niagaraMatch) {
        const [, day, monthStr, year, hour, minute, second, ampm, timezone] = niagaraMatch;

        const months: Record<string, number> = {
          'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
          'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
        };

        const month = months[monthStr.toLowerCase()];
        const fullYear = parseInt(year) < 100 ? 2000 + parseInt(year) : parseInt(year);
        let hour24 = parseInt(hour);

        if (ampm && ampm.toLowerCase() === 'pm' && hour24 !== 12) hour24 += 12;
        if (ampm && ampm.toLowerCase() === 'am' && hour24 === 12) hour24 = 0;

        const date = new Date(fullYear, month, parseInt(day), hour24, parseInt(minute), parseInt(second || '0'));
        return date.toISOString();
      }

      // Fallback to standard Date parsing
      const date = new Date(value);
      return isNaN(date.getTime()) ? value : date.toISOString();
    } catch {
      return value;
    }
  }

  private parseUptimeToSeconds(uptime?: string): number | undefined {
    if (!uptime) return undefined;

    // Format: "26 days, 3 hours, 3 minutes, 33 seconds"
    const match = uptime.match(/(?:(\d+)\s*days?)?\s*(?:,\s*)?(?:(\d+)\s*hours?)?\s*(?:,\s*)?(?:(\d+)\s*minutes?)?\s*(?:,\s*)?(?:(\d+)\s*seconds?)?/i);
    if (match) {
      const days = parseInt(match[1] || '0');
      const hours = parseInt(match[2] || '0');
      const minutes = parseInt(match[3] || '0');
      const seconds = parseInt(match[4] || '0');

      return (days * 24 * 3600) + (hours * 3600) + (minutes * 60) + seconds;
    }

    return undefined;
  }

  private parseUptimeComponents(uptime?: string): { days: number; hours: number; minutes: number; seconds: number } {
    if (!uptime) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

    // Format: "26 days, 3 hours, 3 minutes, 33 seconds"
    const match = uptime.match(/(?:(\d+)\s*days?)?\s*(?:,\s*)?(?:(\d+)\s*hours?)?\s*(?:,\s*)?(?:(\d+)\s*minutes?)?\s*(?:,\s*)?(?:(\d+)\s*seconds?)?/i);
    if (match) {
      return {
        days: parseInt(match[1] || '0'),
        hours: parseInt(match[2] || '0'),
        minutes: parseInt(match[3] || '0'),
        seconds: parseInt(match[4] || '0')
      };
    }

    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  /**
   * Static method to get normalized output from dataset
   */
  static getNormalizedOutput(dataset: TridiumDataset): ResourceExportOutput | null {
    if (dataset.format !== 'ResourceExport' || !dataset.metadata?.normalizedData) {
      return null;
    }

    return dataset.metadata.normalizedData as ResourceExportOutput;
  }

  /**
   * Static method to validate if a file appears to be a ResourceExport
   */
  static isValidResourceExportFile(content: string): boolean {
    return content.includes('Name,Value') &&
           (content.includes('component.count') || content.includes('heap.used') || content.includes('time.current'));
  }
}
