import { TridiumDataset, TridiumDataRow, TridiumDataCategory, TridiumFormatSpec } from '@/types/tridium';
import { TridiumBaseParser, ParseResult } from '../baseParser';
import { logger } from '@/utils/logger';

export interface PlatformAlert {
  metric: string;
  value: string;
  threshold: string;
  severity: 'warning' | 'critical';
  recommendation: string;
}

export interface PlatformDetailsOutput {
  platform_identity: {
    host_id: string;
    serial_number?: string;
    model: string;
    product: string;
    ip?: string;
  };
  system: {
    niagara_version: string;
    runtime: string;
    os_name: string;
    os_build: string;
    architecture: string;
    cpu_count: number;
    cpu_type?: string;
    jvm_version: string;
    enabled_profiles: string[];
  };
  memory: {
    total_ram_gb: number;
    free_ram_gb: number;
    used_ram_gb: number;
    ram_usage_percent: number;
    heap_usage_percent?: number;
  };
  storage: {
    disks: Array<{
      path: string;
      free_gb: number;
      total_gb: number;
      used_percent: number;
      files?: number;
      max_files?: number;
    }>;
  };
  licenses: Array<{
    name: string;
    vendor: string;
    version: string;
    capacity?: string;
    expires: string;
    days_until_expiry?: number;
  }>;
  certificates: Array<{
    name: string;
    vendor: string;
    expires: string;
    days_until_expiry?: number;
  }>;
  security: {
    tls_support: string;
    tls_enabled: boolean;
    http_port?: number;
    https_port?: number;
    tls_ports?: number[];
    active_certificate?: string;
    protocol?: string;
  };
  modules: Array<{
    name: string;
    vendor: string;
    version: string;
    type: string;
    is_third_party: boolean;
    is_signed?: boolean;
  }>;
  applications: Array<{
    name: string;
    type: string;
    autostart: boolean;
    autorestart: boolean;
    status: string;
    fox?: number;
    foxs?: number;
    http?: number;
    https?: number;
  }>;
  alerts: PlatformAlert[];
  raw_data?: any;
}

/**
 * Enhanced Parser for Platform Details text exports (.txt)
 * Extracts comprehensive platform/system information according to operational best practices.
 * Supports both Supervisor and JACE systems with full alert threshold checking.
 *
 * Output is normalized JSON that supports:
 * - Interactive React UI visualization (cards, charts, alerts)
 * - Static PDF export (tables, health flags, recommendations)
 */
export class PlatformDetailsParser extends TridiumBaseParser {
  getDataCategory(): TridiumDataCategory {
    return 'platformInfo';
  }

  async parse(
    content: string,
    filename: string,
    formatSpec: TridiumFormatSpec
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      logger.info('Starting Platform Details parsing', { filename });

      const validationErrors = this.validateContent(content, filename);
      if (validationErrors.length > 0) {
        return this.createErrorResult(validationErrors, warnings, Date.now() - startTime);
      }

      // Parse content into normalized structure
      const parsedData = this.parseContent(content, warnings);

      // Generate alerts based on thresholds and best practices
      const alerts = this.generateAlerts(parsedData, warnings);

      // Create normalized output structure
      const normalizedOutput: PlatformDetailsOutput = {
        ...parsedData,
        alerts
      };

      // Create legacy format for existing UI compatibility
      const legacyData = this.createLegacyFormat(parsedData, alerts);

      const columns = this.createColumns(Object.keys(legacyData), formatSpec);

      const rows: TridiumDataRow[] = [{
        id: 'platform-0',
        selected: false,
        data: legacyData,
        metadata: {
          normalizedData: normalizedOutput,
          alerts: alerts
        }
      }];

      const summary = this.generateEnhancedSummary(normalizedOutput);

      const dataset: TridiumDataset = {
        id: `platform-${Date.now()}`,
        filename,
        format: 'PlatformDetails',
        category: this.getDataCategory(),
        columns,
        rows,
        summary,
        formatSpec: {
          format: 'PlatformDetails',
          displayName: 'Platform Details',
          description: 'Comprehensive platform analysis with operational best practices',
          fileTypes: ['.txt'],
          requiredColumns: ['Host ID', 'Model', 'Product'],
          optionalColumns: [],
          identifierColumns: ['Host ID'],
          keyColumn: 'Host ID'
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

      logger.info('Platform Details parsing completed', { filename, alertCount: alerts.length });
      return this.createSuccessResult(dataset, warnings, Date.now() - startTime);

    } catch (error) {
      logger.error('Platform Details parsing failed', { filename, error });
      return this.createErrorResult([
        `Platform Details parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ], warnings, Date.now() - startTime);
    }
  }

  /**
   * Parse content into normalized structure
   */
  private parseContent(content: string, warnings: string[]): Omit<PlatformDetailsOutput, 'alerts'> {
    const lines = content.split(/\r?\n/);
    const rawData: Record<string, any> = {};
    let summaryTarget: string | undefined;
    const modules: any[] = [];
    const applications: any[] = [];
    const licenses: any[] = [];
    const certificates: any[] = [];
    const filesystems: any[] = [];

    let currentSection: string | null = null;
    let ramData: { free?: number; total?: number } = {};

    // Parse line by line
    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line || line.startsWith('---------')) continue;

      // Capture "Platform summary for <target>" line (IP/host)
      const summaryMatch = line.match(/^Platform summary for\s+(.+)$/i);
      if (summaryMatch && !summaryTarget) {
        summaryTarget = summaryMatch[1].trim();
        rawData['Platform Summary For'] = summaryTarget;
        continue;
      }

      // Section detection
      if (/^modules:?$/i.test(line)) { currentSection = 'modules'; continue; }
      if (/^applications:?$/i.test(line)) { currentSection = 'applications'; continue; }
      if (/^licenses:?$/i.test(line)) { currentSection = 'licenses'; continue; }
      if (/^certificates:?$/i.test(line)) { currentSection = 'certificates'; continue; }
      if (/^other\s+parts:?$/i.test(line)) { currentSection = 'otherParts'; continue; }
      if (/^lexicons:?$/i.test(line)) { currentSection = 'lexicons'; continue; }
      if (/^Filesystem\s+Free\s+Total/.test(line)) { currentSection = 'filesystems'; continue; }

      // Parse RAM table
      if (line.includes('Physical RAM') && line.includes('Free') && line.includes('Total')) {
        currentSection = 'ram';
        continue;
      }

      if (currentSection === 'ram') {
        const ramMatch = line.match(/(\d+(?:,\d+)*)\s*KB\s+(\d+(?:,\d+)*)\s*KB/);
        if (ramMatch) {
          ramData.free = parseInt(ramMatch[1].replace(/,/g, ''));
          ramData.total = parseInt(ramMatch[2].replace(/,/g, ''));
          currentSection = null;
          continue;
        }
      }

      // Parse sections
      if (currentSection === 'modules') {
        const moduleMatch = line.match(/^\s*([\w-]+)\s*\(([^)]+)\)$/);
        if (moduleMatch) {
          const [, name, details] = moduleMatch;
          const [vendor, version] = details.trim().split(/\s+/);
          const [moduleName, moduleType] = name.split('-');
          modules.push({
            name: name.trim(),
            vendor: vendor || 'Unknown',
            version: version || '',
            type: moduleType || 'rt',
            is_third_party: vendor !== 'Tridium',
            is_signed: true // Assume signed unless proven otherwise
          });
        }
        continue;
      }

      if (currentSection === 'applications') {
        const appMatch = line.match(/^\s*station\s+([^\s]+)\s+(.+)$/);
        if (appMatch) {
          const [, name, details] = appMatch;
          // Parse application details: autostart, autorestart, ports, status
          const app: any = {
            name,
            type: 'station',
            autostart: details.includes('autostart=true'),
            autorestart: details.includes('autorestart=true'),
            status: 'Unknown'
          };
          
          // Extract ports if present
          const foxMatch = details.match(/fox=(\d+)/);
          const foxsMatch = details.match(/foxs=(\d+)/);
          const httpMatch = details.match(/http=(\d+)/);
          const httpsMatch = details.match(/https=(\d+)/);
          
          if (foxMatch) app.fox = parseInt(foxMatch[1]);
          if (foxsMatch) app.foxs = parseInt(foxsMatch[1]);
          if (httpMatch) app.http = parseInt(httpMatch[1]);
          if (httpsMatch) app.https = parseInt(httpsMatch[1]);
          
          // Extract status
          const statusMatch = details.match(/status=(\w+)/);
          if (statusMatch) app.status = statusMatch[1];
          
          applications.push(app);
        }
        continue;
      }

      if (currentSection === 'licenses') {
        const licenseMatch = line.match(/^\s*([^(]+)\s*\(([^)]+)\)$/);
        if (licenseMatch) {
          const [, name, details] = licenseMatch;
          const detailsParts = details.split(' - ');
          const vendorVersion = detailsParts[0]?.trim() || '';
          const expires = detailsParts[1]?.trim() || 'never expires';
          const [vendor, version] = vendorVersion.split(/\s+/);

          licenses.push({
            name: name.trim(),
            vendor: vendor || 'Unknown',
            version: version || '',
            expires,
            days_until_expiry: this.calculateDaysUntilExpiry(expires)
          });
        }
        continue;
      }

      if (currentSection === 'certificates') {
        const certMatch = line.match(/^\s*([^(]+)\s*\(([^)]+)\)$/);
        if (certMatch) {
          const [, name, details] = certMatch;
          const detailsParts = details.split(' - ');
          const vendor = detailsParts[0]?.trim() || 'Unknown';
          const expires = detailsParts[1]?.trim() || 'never expires';

          certificates.push({
            name: name.trim(),
            vendor,
            expires,
            days_until_expiry: this.calculateDaysUntilExpiry(expires)
          });
        }
        continue;
      }

      if (currentSection === 'filesystems') {
        const fsMatch = line.match(/^\s*([^\s]+)\s+([\d,]+)\s+KB\s+([\d,]+)\s+KB(?:\s+([\d,]+)\s+([\d,]+))?/);
        if (fsMatch) {
          const [, path, freeStr, totalStr, filesStr, maxFilesStr] = fsMatch;
          const free = parseInt(freeStr.replace(/,/g, ''));
          const total = parseInt(totalStr.replace(/,/g, ''));

          filesystems.push({
            path,
            free_gb: Math.round((free / 1024 / 1024) * 100) / 100,
            total_gb: Math.round((total / 1024 / 1024) * 100) / 100,
            used_percent: Math.round(((total - free) / total) * 100),
            files: parseInt(filesStr?.replace(/,/g, '') || '0'),
            max_files: parseInt(maxFilesStr?.replace(/,/g, '') || '0')
          });
        }
        continue;
      }

      // Key-value pairs
      const kv = line.match(/^([^:]+):\s*(.*)$/);
      if (kv) {
        const key = kv[1].trim();
        const value = kv[2].trim();
        rawData[key] = value;
      }
    }

    // Extract and normalize data
    const niagaraVersion = this.extractNiagaraVersion(rawData);
    const osInfo = this.parseOperatingSystem(rawData['Operating System'] || '');
    const profilesText = rawData['Enabled Runtime Profiles'] || '';
    const profiles = profilesText.split(',').map(p => p.trim()).filter(Boolean);

    // Memory calculations
    const totalRamGb = ramData.total ? Math.round((ramData.total / 1024 / 1024) * 100) / 100 : 0;
    const freeRamGb = ramData.free ? Math.round((ramData.free / 1024 / 1024) * 100) / 100 : 0;
    const usedRamGb = totalRamGb - freeRamGb;
    const ramUsagePercent = totalRamGb > 0 ? Math.round((usedRamGb / totalRamGb) * 100) : 0;

    // Security info
    const tlsSupport = rawData['Platform TLS Support'] || '';
    const tlsEnabled = tlsSupport.toLowerCase().includes('enabled') || tlsSupport.toLowerCase().includes('tls only');

    return {
      platform_identity: {
        host_id: rawData['Host ID'] || '',
        model: rawData['Model'] || 'Unknown',
        product: rawData['Product'] || 'Unknown',
        ip: summaryTarget
      },
      system: {
        niagara_version: niagaraVersion,
        runtime: rawData['Niagara Runtime'] || '',
        os_name: osInfo.name,
        os_build: osInfo.build,
        architecture: rawData['Architecture'] || '',
        cpu_count: parseInt(rawData['Number of CPUs'] || '1'),
        jvm_version: rawData['Java Virtual Machine'] || '',
        enabled_profiles: profiles
      },
      memory: {
        total_ram_gb: totalRamGb,
        free_ram_gb: freeRamGb,
        used_ram_gb: usedRamGb,
        ram_usage_percent: ramUsagePercent
      },
      storage: {
        disks: filesystems
      },
      licenses,
      certificates,
      security: {
        tls_support: tlsSupport,
        tls_enabled: tlsEnabled,
        http_port: parseInt(rawData['Daemon HTTP Port'] || '0') || undefined,
        https_port: parseInt(rawData['Port'] || '0') || undefined,
        active_certificate: rawData['Certificate'],
        protocol: rawData['Protocol']
      },
      modules,
      applications,
      raw_data: rawData
    };
  }

  /**
   * Generate alerts based on thresholds and best practices
   */
  private generateAlerts(data: Omit<PlatformDetailsOutput, 'alerts'>, warnings: string[]): PlatformAlert[] {
    const alerts: PlatformAlert[] = [];

    // RAM Usage Check
    const ramUsage = data.memory.ram_usage_percent;
    if (ramUsage > 80) {
      alerts.push({
        metric: 'RAM Usage',
        value: `${ramUsage}%`,
        threshold: '80%',
        severity: ramUsage > 90 ? 'critical' : 'warning',
        recommendation: ramUsage > 90 ? 'Critical memory usage - immediate action required' : 'High memory usage - monitor and optimize'
      });
    }

    // Disk Usage Checks
    data.storage.disks.forEach((disk, index) => {
      const isJace = data.platform_identity.product?.toLowerCase().includes('jace');
      const threshold = isJace ? 20 : 10;

      if (disk.used_percent > (100 - threshold)) {
        alerts.push({
          metric: `Disk Free (${disk.path})`,
          value: `${100 - disk.used_percent}%`,
          threshold: `${threshold}%`,
          severity: disk.used_percent > 95 ? 'critical' : 'warning',
          recommendation: disk.used_percent > 95 ? 'Critical - clean up disk space immediately' : 'Low disk space - plan cleanup'
        });
      }
    });

    // Niagara Version Check
    const version = data.system.niagara_version;
    if (version && !version.startsWith('4.15')) {
      alerts.push({
        metric: 'Niagara Version',
        value: version,
        threshold: '4.15.x (LTS)',
        severity: 'warning',
        recommendation: 'Upgrade to Niagara 4.15 LTS for latest features and support'
      });
    }

    // Certificate Expiry Checks
    data.certificates.forEach(cert => {
      if (cert.days_until_expiry !== undefined) {
        if (cert.days_until_expiry <= 0) {
          alerts.push({
            metric: 'Certificate Expiry',
            value: 'Expired',
            threshold: '30 days',
            severity: 'critical',
            recommendation: `Certificate "${cert.name}" has expired - security risk`
          });
        } else if (cert.days_until_expiry <= 30) {
          alerts.push({
            metric: 'Certificate Expiry',
            value: `${cert.days_until_expiry} days`,
            threshold: '30 days',
            severity: 'warning',
            recommendation: `Certificate "${cert.name}" expires soon - renew immediately`
          });
        }
      }
    });

    // License Expiry Checks
    data.licenses.forEach(license => {
      if (license.days_until_expiry !== undefined && license.days_until_expiry <= 30 && license.days_until_expiry > 0) {
        alerts.push({
          metric: 'License Expiry',
          value: `${license.days_until_expiry} days`,
          threshold: '30 days',
          severity: 'warning',
          recommendation: `License "${license.name}" expires soon - renew to avoid service interruption`
        });
      }
    });

    // Security Checks
    if (!data.security.tls_enabled) {
      alerts.push({
        metric: 'TLS Security',
        value: 'Disabled',
        threshold: 'Enabled',
        severity: 'critical',
        recommendation: 'Enable TLS for secure communication'
      });
    }

    // Module Checks
    const unsignedModules = data.modules.filter(m => m.is_signed === false);
    if (unsignedModules.length > 0) {
      alerts.push({
        metric: 'Module Security',
        value: `${unsignedModules.length} unsigned`,
        threshold: '0 unsigned',
        severity: 'warning',
        recommendation: 'Review unsigned modules for security risks'
      });
    }

    // Operating System Check
    const osName = data.system.os_name.toLowerCase();
    if (osName.includes('windows') && (osName.includes('2016') || osName.includes('2012'))) {
      alerts.push({
        metric: 'Operating System',
        value: data.system.os_name,
        threshold: 'Supported version',
        severity: 'warning',
        recommendation: 'Operating system approaching or past end-of-support - plan upgrade'
      });
    }

    return alerts;
  }

  /**
   * Create legacy format for existing UI compatibility
   */
  private createLegacyFormat(data: Omit<PlatformDetailsOutput, 'alerts'>, alerts: PlatformAlert[]): Record<string, any> {
    return {
      'Host ID': data.platform_identity.host_id,
      'Model': data.platform_identity.model,
      'Product': data.platform_identity.product,
      'Niagara Version': data.system.niagara_version,
      'Operating System': `${data.system.os_name} ${data.system.os_build}`.trim(),
      'Architecture': data.system.architecture,
      'CPU Count': data.system.cpu_count,
      'JVM Version': data.system.jvm_version,
      'RAM Total (GB)': data.memory.total_ram_gb,
      'RAM Free (GB)': data.memory.free_ram_gb,
      'RAM Usage (%)': data.memory.ram_usage_percent,
      'Disk Count': data.storage.disks.length,
      'Total Disk Space (GB)': data.storage.disks.reduce((sum, disk) => sum + disk.total_gb, 0),
      'Module Count': data.modules.length,
      'Third Party Modules': data.modules.filter(m => m.is_third_party).length,
      'License Count': data.licenses.length,
      'Certificate Count': data.certificates.length,
      'TLS Enabled': data.security.tls_enabled ? 'Yes' : 'No',
      'Alert Count': alerts.length,
      'Critical Alerts': alerts.filter(a => a.severity === 'critical').length,
      'Enabled Profiles': data.system.enabled_profiles.join(', ')
    };
  }

  /**
   * Generate enhanced summary
   */
  private generateEnhancedSummary(data: PlatformDetailsOutput) {
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
        [data.platform_identity.product || 'Platform']: 1
      },
      criticalFindings: criticalAlerts.map(a => `${a.metric}: ${a.value}`),
      recommendations: data.alerts.map(a => a.recommendation)
    };
  }

  /**
   * Extract Niagara version from various fields
   */
  private extractNiagaraVersion(rawData: Record<string, any>): string {
    const versionFields = ['Niagara Runtime', 'Daemon Version'];

    for (const field of versionFields) {
      if (rawData[field]) {
        const value = String(rawData[field]);
        const match = value.match(/(\d+\.\d+\.\d+\.\d+)/);
        if (match) return match[1];
      }
    }
    return rawData['Daemon Version'] || '';
  }

  /**
   * Parse operating system string
   */
  private parseOperatingSystem(osString: string): { name: string; build: string } {
    if (!osString) return { name: '', build: '' };

    const parts = osString.split(/\s+/);
    if (parts.length >= 2) {
      const lastPart = parts[parts.length - 1];
      const isVersion = /^\(\d+\.\d+\)$/.test(lastPart) || /^\d+\.\d+/.test(lastPart);

      if (isVersion) {
        return {
          name: parts.slice(0, -1).join(' '),
          build: lastPart.replace(/[()]/g, '')
        };
      }
    }

    return { name: osString, build: '' };
  }

  /**
   * Calculate days until expiry
   */
  private calculateDaysUntilExpiry(expiryString: string): number | undefined {
    if (!expiryString || expiryString.toLowerCase().includes('never') || expiryString.toLowerCase().includes('unknown')) {
      return undefined;
    }

    // Try to parse common date formats
    const dateMatch = expiryString.match(/(\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4}|\d{1,2}\/\d{1,2}\/\d{4})/);
    if (dateMatch) {
      const dateStr = dateMatch[1];
      let date: Date;

      if (dateStr.includes('-')) {
        date = new Date(dateStr);
      } else {
        const [month, day, year] = dateStr.split('/');
        date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      }

      if (!isNaN(date.getTime())) {
        const now = new Date();
        const diffTime = date.getTime() - now.getTime();
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      }
    }

    return undefined;
  }

  /**
   * Static method to get normalized output from dataset
   * Useful for React components and PDF generation
   */
  static getNormalizedOutput(dataset: TridiumDataset): PlatformDetailsOutput | null {
    if (dataset.format !== 'PlatformDetails' || !dataset.metadata?.normalizedData) {
      return null;
    }

    return dataset.metadata.normalizedData as PlatformDetailsOutput;
  }

  /**
   * Static method to validate if a file appears to be a PlatformDetails export
   */
  static isValidPlatformDetailsFile(content: string): boolean {
    return content.includes('Platform summary') &&
           content.includes('Host ID:') &&
           content.includes('Model:') &&
           content.includes('Product:');
  }
}

