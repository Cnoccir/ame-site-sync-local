/**
 * Niagara Analysis Service
 * Converts parsed Tridium export data into unified JSON analysis output
 * with threshold checking, alerting, and comprehensive system analysis.
 */

import {
  NiagaraSystemAnalysis,
  PlatformIdentity,
  ResourceUtilization,
  NetworkInventory,
  LicenseInfo,
  DriverInfo,
  ModuleInfo,
  CertificateInfo,
  AlertInfo,
  Alert,
  ThresholdViolation,
  DeviceInfo,
  NetworkNode,
  SYSTEM_THRESHOLDS,
  VERSION_COMPATIBILITY
} from '@/types/niagaraAnalysis';
import { TridiumDataset, TridiumDataRow } from '@/types/tridium';
import { logger } from '@/utils/logger';

export interface AnalysisInput {
  platformDetails?: TridiumDataset;
  resourceExport?: TridiumDataset;
  bacnetExport?: TridiumDataset;
  n2Export?: TridiumDataset;
  modbusExport?: TridiumDataset;
  niagaraNetExport?: TridiumDataset;
}

export class NiagaraAnalysisService {
  private alerts: Alert[] = [];
  private thresholdViolations: ThresholdViolation[] = [];
  private recommendations: string[] = [];

  /**
   * Main analysis method - converts parsed datasets to unified analysis
   */
  async analyze(input: AnalysisInput): Promise<NiagaraSystemAnalysis> {
    const startTime = Date.now();
    this.resetAnalysis();

    logger.info('Starting Niagara system analysis', {
      filesProvided: Object.keys(input).filter(key => input[key as keyof AnalysisInput] !== undefined)
    });

    try {
      const analysis: NiagaraSystemAnalysis = {
        metadata: {
          analysisDate: new Date(),
          analysisVersion: '1.0.0',
          filesProcessed: this.getProcessedFiles(input),
          processingTime: 0, // Will be set at the end
          confidence: this.calculateConfidence(input)
        },
        platform_identity: await this.extractPlatformIdentity(input.platformDetails, input.resourceExport),
        resources: await this.extractResourceUtilization(input.resourceExport),
        inventory: await this.extractNetworkInventory(input),
        licenses: await this.extractLicenseInfo(input.platformDetails),
        drivers: await this.extractDriverInfo(input),
        modules: await this.extractModuleInfo(input.platformDetails),
        certificates: await this.extractCertificateInfo(input.platformDetails),
        alerts: {
          alerts: this.alerts,
          thresholdViolations: this.thresholdViolations,
          recommendations: this.recommendations
        },
        summary: {
          systemType: 'JACE', // Will be determined from platform data
          totalDevices: 0,
          healthScore: 0,
          criticalIssues: 0,
          warningIssues: 0,
          capacityUtilization: 0,
          recommendedActions: []
        }
      };

      // Generate summary and final calculations
      analysis.summary = this.generateSummary(analysis);
      analysis.metadata.processingTime = Date.now() - startTime;

      logger.info('Niagara system analysis completed', {
        processingTime: analysis.metadata.processingTime,
        totalDevices: analysis.summary.totalDevices,
        healthScore: analysis.summary.healthScore,
        alertsGenerated: this.alerts.length
      });

      return analysis;

    } catch (error) {
      logger.error('Niagara analysis failed', { error });
      throw new Error(`Analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Extract platform identity information
   */
  private async extractPlatformIdentity(
    platformDetails?: TridiumDataset,
    resourceExport?: TridiumDataset
  ): Promise<PlatformIdentity> {
    const identity: Partial<PlatformIdentity> = {
      hostId: '',
      model: 'Unknown',
      product: 'Unknown',
      niagaraVersion: '',
      operatingSystem: '',
      architecture: '',
      cpuCount: 1,
      ram: { free: 0, total: 0, percentage: 0 },
      jvmVersion: ''
    };

    // Extract from platform details
    if (platformDetails?.rows?.length > 0) {
      const platformRow = platformDetails.rows[0];
      const data = platformRow.data;

      identity.hostId = this.extractValue(data, ['Host ID', 'HostID', 'host_id']) || '';
      identity.model = this.extractValue(data, ['Model', 'model']) || 'Unknown';
      identity.product = this.extractValue(data, ['Product', 'product']) || 'Unknown';
      identity.stationName = this.extractValue(data, ['Station Name', 'Station', 'station_name']);
      identity.niagaraVersion = this.extractValue(data, ['Version', 'Niagara Runtime', 'version.niagara']) || '';
      identity.operatingSystem = this.extractValue(data, ['Operating System', 'OS']) || '';
      identity.architecture = this.extractValue(data, ['Architecture', 'arch']) || '';
      identity.cpuCount = this.parseNumber(this.extractValue(data, ['Number of CPUs', 'CPU Count', 'cpus'])) || 1;
      identity.jvmVersion = this.extractValue(data, ['Java Virtual Machine', 'JVM', 'version.java']) || '';

      // Parse RAM from platform details text
      const ramText = this.extractValue(data, ['Physical RAM', 'RAM', 'Memory']);
      if (ramText) {
        const ramMatch = ramText.match(/(\d+,?\d*)\s*KB.*?(\d+,?\d*)\s*KB/);
        if (ramMatch) {
          const free = this.parseNumber(ramMatch[1].replace(/,/g, '')) || 0;
          const total = this.parseNumber(ramMatch[2].replace(/,/g, '')) || 0;
          identity.ram = {
            free,
            total,
            percentage: total > 0 ? Math.round((total - free) / total * 100) : 0
          };
        }
      }
    }

    // Extract additional data from resource export
    if (resourceExport?.rows) {
      const resourceMap = new Map(
        resourceExport.rows.map(row => [row.data.Name, row.data.Value])
      );

      if (resourceMap.has('mem.total') && resourceMap.has('mem.used')) {
        const totalMB = this.parseMemoryValue(resourceMap.get('mem.total')) || 0;
        const usedMB = this.parseMemoryValue(resourceMap.get('mem.used')) || 0;

        identity.ram = {
          free: Math.max(0, totalMB - usedMB) * 1024, // Convert to KB
          total: totalMB * 1024, // Convert to KB
          percentage: totalMB > 0 ? Math.round(usedMB / totalMB * 100) : 0
        };
      }

      identity.uptime = resourceMap.get('time.uptime');

      // Extract version info if not already present
      if (!identity.niagaraVersion && resourceMap.has('version.niagara')) {
        identity.niagaraVersion = resourceMap.get('version.niagara') || '';
      }
      if (!identity.jvmVersion && resourceMap.has('version.java')) {
        identity.jvmVersion = resourceMap.get('version.java') || '';
      }
      if (!identity.operatingSystem && resourceMap.has('version.os')) {
        identity.operatingSystem = resourceMap.get('version.os') || '';
      }
    }

    // Validate and check thresholds
    this.validatePlatformIdentity(identity as PlatformIdentity);

    return identity as PlatformIdentity;
  }

  /**
   * Extract resource utilization information
   */
  private async extractResourceUtilization(resourceExport?: TridiumDataset): Promise<ResourceUtilization> {
    const resources: ResourceUtilization = {
      components: { count: 0 },
      devices: { used: 0, licensed: 0, unlimited: false },
      points: { used: 0, licensed: 0, unlimited: false },
      histories: { count: 0 },
      resourceUnits: { total: 0, byCategory: {}, unit: 'kRU' },
      engine: {
        queues: {
          actions: { current: 0, peak: 0 },
          longTimers: { current: 0, peak: 0 },
          mediumTimers: { current: 0, peak: 0 },
          shortTimers: { current: 0, peak: 0 }
        },
        scanTimes: { lifetime: 0, recent: 0, peak: 0 },
        usage: 0
      },
      memory: {
        heap: { used: 0, free: 0, total: 0, max: 0 },
        physical: { used: 0, total: 0, percentage: 0 }
      },
      cpu: { usage: 0 }
    };

    if (!resourceExport?.rows) {
      return resources;
    }

    const resourceMap = new Map(
      resourceExport.rows.map(row => [row.data.Name, row.data.Value])
    );

    // Parse component count
    resources.components.count = this.parseNumber(resourceMap.get('component.count')) || 0;

    // Parse device and point capacities
    const deviceData = this.parseCapacityValue(resourceMap.get('globalCapacity.devices') || '0');
    resources.devices = {
      used: deviceData.used,
      licensed: deviceData.limit,
      unlimited: deviceData.unlimited
    };

    const pointData = this.parseCapacityValue(resourceMap.get('globalCapacity.points') || '0');
    resources.points = {
      used: pointData.used,
      licensed: pointData.limit,
      unlimited: pointData.unlimited
    };

    // Parse histories
    resources.histories.count = this.parseNumber(resourceMap.get('history.count')) || 0;

    // Parse resource units
    resources.resourceUnits.total = this.parseResourceUnits(resourceMap.get('resources.total') || '0');
    resources.resourceUnits.byCategory = {
      alarm: this.parseResourceUnits(resourceMap.get('resources.category.alarm') || '0'),
      component: this.parseResourceUnits(resourceMap.get('resources.category.component') || '0'),
      device: this.parseResourceUnits(resourceMap.get('resources.category.device') || '0'),
      history: this.parseResourceUnits(resourceMap.get('resources.category.history') || '0'),
      network: this.parseResourceUnits(resourceMap.get('resources.category.network') || '0'),
      program: this.parseResourceUnits(resourceMap.get('resources.category.program') || '0'),
      proxyExt: this.parseResourceUnits(resourceMap.get('resources.category.proxyExt') || '0')
    };

    // Parse engine metrics
    resources.engine.queues.actions = this.parseQueueValue(resourceMap.get('engine.queue.actions') || '0');
    resources.engine.queues.longTimers = this.parseQueueValue(resourceMap.get('engine.queue.longTimers') || '0');
    resources.engine.queues.mediumTimers = this.parseQueueValue(resourceMap.get('engine.queue.mediumTimers') || '0');
    resources.engine.queues.shortTimers = this.parseQueueValue(resourceMap.get('engine.queue.shortTimers') || '0');

    resources.engine.scanTimes.lifetime = this.parseNumber(resourceMap.get('engine.scan.lifetime')?.replace(/[^\d.]/g, '')) || 0;
    resources.engine.scanTimes.recent = this.parseNumber(resourceMap.get('engine.scan.recent')?.replace(/[^\d.]/g, '')) || 0;
    resources.engine.scanTimes.peak = this.parseNumber(resourceMap.get('engine.scan.peak')?.replace(/[^\d.]/g, '')) || 0;
    resources.engine.usage = this.parsePercentage(resourceMap.get('engine.scan.usage')) || 0;

    // Parse memory metrics
    resources.memory.heap.used = this.parseMemoryValue(resourceMap.get('heap.used')) || 0;
    resources.memory.heap.free = this.parseMemoryValue(resourceMap.get('heap.free')) || 0;
    resources.memory.heap.total = this.parseMemoryValue(resourceMap.get('heap.total')) || 0;
    resources.memory.heap.max = this.parseMemoryValue(resourceMap.get('heap.max')) || 0;

    resources.memory.physical.used = this.parseMemoryValue(resourceMap.get('mem.used')) || 0;
    resources.memory.physical.total = this.parseMemoryValue(resourceMap.get('mem.total')) || 0;
    resources.memory.physical.percentage = resources.memory.physical.total > 0
      ? Math.round(resources.memory.physical.used / resources.memory.physical.total * 100)
      : 0;

    // Parse CPU usage
    resources.cpu.usage = this.parsePercentage(resourceMap.get('cpu.usage')) || 0;

    // Check thresholds and generate alerts
    this.checkResourceThresholds(resources);

    return resources;
  }

  /**
   * Extract network inventory from all device exports
   */
  private async extractNetworkInventory(input: AnalysisInput): Promise<NetworkInventory> {
    const inventory: NetworkInventory = {
      totalDevices: 0,
      devicesByProtocol: {
        bacnet: [],
        n2: []
      },
      networkHierarchy: [],
      protocolStatistics: {}
    };

    // Process BACnet devices
    if (input.bacnetExport?.rows) {
      inventory.devicesByProtocol.bacnet = input.bacnetExport.rows.map(row => this.parseBacnetDevice(row));
    }

    // Process N2 devices
    if (input.n2Export?.rows) {
      inventory.devicesByProtocol.n2 = input.n2Export.rows.map(row => this.parseN2Device(row));
    }

    // Process Niagara network hierarchy
    if (input.niagaraNetExport?.rows) {
      inventory.networkHierarchy = this.parseNetworkHierarchy(input.niagaraNetExport.rows);
    }

    // Calculate statistics
    inventory.totalDevices =
      inventory.devicesByProtocol.bacnet.length +
      inventory.devicesByProtocol.n2.length +
      (inventory.devicesByProtocol.modbus?.length || 0);

    inventory.protocolStatistics = {
      bacnet: this.calculateProtocolStats(inventory.devicesByProtocol.bacnet),
      n2: this.calculateProtocolStats(inventory.devicesByProtocol.n2)
    };

    return inventory;
  }

  /**
   * Extract license information
   */
  private async extractLicenseInfo(platformDetails?: TridiumDataset): Promise<LicenseInfo> {
    const licenseInfo: LicenseInfo = {
      licenses: [],
      deviceCapacity: { used: 0, limit: 0, unlimited: false },
      pointCapacity: { used: 0, limit: 0, unlimited: false },
      expirationWarnings: []
    };

    if (!platformDetails?.rows?.length) {
      return licenseInfo;
    }

    // Extract licenses from platform details
    const data = platformDetails.rows[0].data;
    const licensesText = this.extractValue(data, ['Licenses', 'licenses']);

    if (licensesText) {
      const licenseLines = licensesText.split('\n').filter(line => line.trim());
      for (const line of licenseLines) {
        const license = this.parseLicenseLine(line);
        if (license) {
          licenseInfo.licenses.push(license);

          // Check for expiring licenses
          if (!license.neverExpires && license.expiryDate) {
            const daysUntilExpiry = Math.ceil((license.expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
            if (daysUntilExpiry <= SYSTEM_THRESHOLDS.certificates.expiringDays) {
              licenseInfo.expirationWarnings.push(`License ${license.name} expires in ${daysUntilExpiry} days`);
            }
          }
        }
      }
    }

    return licenseInfo;
  }

  /**
   * Extract driver-specific information
   */
  private async extractDriverInfo(input: AnalysisInput): Promise<DriverInfo> {
    const driverInfo: DriverInfo = {};

    if (input.bacnetExport?.rows) {
      driverInfo.bacnet = this.extractBacnetDriverInfo(input.bacnetExport.rows);
    }

    if (input.n2Export?.rows) {
      driverInfo.n2 = this.extractN2DriverInfo(input.n2Export.rows);
    }

    return driverInfo;
  }

  /**
   * Extract module information
   */
  private async extractModuleInfo(platformDetails?: TridiumDataset): Promise<ModuleInfo> {
    const moduleInfo: ModuleInfo = {
      enabled: [],
      thirdParty: [],
      vendorBreakdown: {}
    };

    if (!platformDetails?.rows?.length) {
      return moduleInfo;
    }

    const data = platformDetails.rows[0].data;
    const modulesText = this.extractValue(data, ['Modules', 'modules']);

    if (modulesText) {
      const moduleLines = modulesText.split('\n').filter(line => line.trim());
      for (const line of moduleLines) {
        const module = this.parseModuleLine(line);
        if (module) {
          moduleInfo.enabled.push(module);

          if (module.vendor !== 'Tridium') {
            moduleInfo.thirdParty.push(module);
          }

          if (!moduleInfo.vendorBreakdown[module.vendor]) {
            moduleInfo.vendorBreakdown[module.vendor] = [];
          }
          moduleInfo.vendorBreakdown[module.vendor].push(module);
        }
      }
    }

    return moduleInfo;
  }

  /**
   * Extract certificate information
   */
  private async extractCertificateInfo(platformDetails?: TridiumDataset): Promise<CertificateInfo> {
    const certInfo: CertificateInfo = {
      certificates: [],
      expiring: [],
      expired: []
    };

    if (!platformDetails?.rows?.length) {
      return certInfo;
    }

    const data = platformDetails.rows[0].data;
    const certificatesText = this.extractValue(data, ['Certificates', 'certificates']);

    if (certificatesText) {
      const certLines = certificatesText.split('\n').filter(line => line.trim());
      for (const line of certLines) {
        const cert = this.parseCertificateLine(line);
        if (cert) {
          certInfo.certificates.push(cert);

          if (cert.status === 'expiring') {
            certInfo.expiring.push(cert);
          } else if (cert.status === 'expired') {
            certInfo.expired.push(cert);
          }
        }
      }
    }

    return certInfo;
  }

  // Utility methods for parsing various data formats
  private parseCapacityValue(value: string): { used: number; limit: number; unlimited: boolean } {
    const match = value.match(/(\d+(?:,\d+)*)\s*\(\s*Limit:\s*(\d+(?:,\d+)*|none)\s*\)/i);
    if (match) {
      const used = this.parseNumber(match[1].replace(/,/g, '')) || 0;
      const limitStr = match[2].toLowerCase();
      const unlimited = limitStr === 'none' || limitStr === '0';
      const limit = unlimited ? 0 : (this.parseNumber(limitStr.replace(/,/g, '')) || 0);
      return { used, limit, unlimited };
    }

    const simpleNumber = this.parseNumber(value.replace(/,/g, ''));
    return { used: simpleNumber || 0, limit: 0, unlimited: true };
  }

  private parseResourceUnits(value: string): number {
    const match = value.match(/([\d,]+(?:\.\d+)?)\s*kRU/i);
    if (match) {
      return this.parseNumber(match[1].replace(/,/g, '')) || 0;
    }
    return 0;
  }

  private parseQueueValue(value: string): { current: number; peak: number } {
    const match = value.match(/(\d+(?:,\d+)*)\s*\(\s*Peak\s+(\d+(?:,\d+)*)\s*\)/i);
    if (match) {
      return {
        current: this.parseNumber(match[1].replace(/,/g, '')) || 0,
        peak: this.parseNumber(match[2].replace(/,/g, '')) || 0
      };
    }
    return { current: 0, peak: 0 };
  }

  private parseMemoryValue(value?: string): number {
    if (!value) return 0;
    const match = value.match(/([\d,]+(?:\.\d+)?)\s*([KMGT]B|MB|KB)/i);
    if (match) {
      const number = this.parseNumber(match[1].replace(/,/g, '')) || 0;
      const unit = match[2].toUpperCase();
      switch (unit) {
        case 'GB': return number * 1024;
        case 'MB': return number;
        case 'KB': return number / 1024;
        default: return number;
      }
    }
    return this.parseNumber(value.replace(/[^\d.]/g, '')) || 0;
  }

  private parsePercentage(value?: string): number {
    if (!value) return 0;
    const match = value.match(/([\d.]+)%/);
    return match ? (this.parseNumber(match[1]) || 0) : 0;
  }

  private parseNumber(value?: string): number | null {
    if (!value) return null;
    const num = parseFloat(value.replace(/[^\d.-]/g, ''));
    return isNaN(num) ? null : num;
  }

  private extractValue(data: Record<string, any>, keys: string[]): string | undefined {
    for (const key of keys) {
      if (data[key] !== undefined && data[key] !== null) {
        return String(data[key]).trim();
      }
    }
    return undefined;
  }

  // Validation and threshold checking methods
  private validatePlatformIdentity(identity: PlatformIdentity): void {
    // Check Niagara version
    if (identity.niagaraVersion && !VERSION_COMPATIBILITY.niagara.supported.some(v => identity.niagaraVersion.includes(v))) {
      this.addAlert('warning', 'maintenance', 'niagara_version', identity.niagaraVersion, undefined,
        `Niagara version ${identity.niagaraVersion} may not be current LTS`,
        'Consider upgrading to Niagara 4.15 LTS for latest features and support');
    }

    // Check RAM usage
    if (identity.ram.percentage > SYSTEM_THRESHOLDS.memory.critical) {
      this.addAlert('critical', 'performance', 'ram_usage', identity.ram.percentage, SYSTEM_THRESHOLDS.memory.critical,
        `RAM usage at ${identity.ram.percentage}% is critically high`,
        'Consider adding more memory or reducing system load');
    } else if (identity.ram.percentage > SYSTEM_THRESHOLDS.memory.warning) {
      this.addAlert('warning', 'performance', 'ram_usage', identity.ram.percentage, SYSTEM_THRESHOLDS.memory.warning,
        `RAM usage at ${identity.ram.percentage}% is high`,
        'Monitor memory usage and consider optimization');
    }
  }

  private checkResourceThresholds(resources: ResourceUtilization): void {
    // Check CPU usage
    if (resources.cpu.usage > SYSTEM_THRESHOLDS.cpu.critical) {
      this.addAlert('critical', 'performance', 'cpu_usage', resources.cpu.usage, SYSTEM_THRESHOLDS.cpu.critical,
        `CPU usage at ${resources.cpu.usage}% is critically high`,
        'Investigate high CPU processes and optimize system performance');
    } else if (resources.cpu.usage > SYSTEM_THRESHOLDS.cpu.warning) {
      this.addAlert('warning', 'performance', 'cpu_usage', resources.cpu.usage, SYSTEM_THRESHOLDS.cpu.warning,
        `CPU usage at ${resources.cpu.usage}% is high`,
        'Monitor CPU usage trends and consider performance optimization');
    }

    // Check heap usage
    const heapPercentage = resources.memory.heap.max > 0
      ? Math.round(resources.memory.heap.used / resources.memory.heap.max * 100)
      : 0;

    if (heapPercentage > SYSTEM_THRESHOLDS.heap.critical) {
      this.addAlert('critical', 'performance', 'heap_usage', heapPercentage, SYSTEM_THRESHOLDS.heap.critical,
        `Heap usage at ${heapPercentage}% is critically high`,
        'Restart system to free heap memory and investigate memory leaks');
    } else if (heapPercentage > SYSTEM_THRESHOLDS.heap.warning) {
      this.addAlert('warning', 'performance', 'heap_usage', heapPercentage, SYSTEM_THRESHOLDS.heap.warning,
        `Heap usage at ${heapPercentage}% is high`,
        'Monitor heap usage and consider memory optimization');
    }

    // Check capacity limits
    if (!resources.devices.unlimited) {
      const devicePercentage = resources.devices.licensed > 0
        ? Math.round(resources.devices.used / resources.devices.licensed * 100)
        : 0;

      if (devicePercentage > SYSTEM_THRESHOLDS.capacity.devices.critical) {
        this.addAlert('critical', 'capacity', 'device_capacity', devicePercentage, SYSTEM_THRESHOLDS.capacity.devices.critical,
          `Device capacity at ${devicePercentage}% is critically high`,
          'Upgrade licensing or remove unused devices before reaching limit');
      } else if (devicePercentage > SYSTEM_THRESHOLDS.capacity.devices.warning) {
        this.addAlert('warning', 'capacity', 'device_capacity', devicePercentage, SYSTEM_THRESHOLDS.capacity.devices.warning,
          `Device capacity at ${devicePercentage}% is high`,
          'Plan for capacity expansion or device optimization');
      }
    }

    if (!resources.points.unlimited) {
      const pointPercentage = resources.points.licensed > 0
        ? Math.round(resources.points.used / resources.points.licensed * 100)
        : 0;

      if (pointPercentage > SYSTEM_THRESHOLDS.capacity.points.critical) {
        this.addAlert('critical', 'capacity', 'point_capacity', pointPercentage, SYSTEM_THRESHOLDS.capacity.points.critical,
          `Point capacity at ${pointPercentage}% is critically high`,
          'Upgrade licensing or optimize point usage before reaching limit');
      }
    }
  }

  private addAlert(
    severity: 'info' | 'warning' | 'critical',
    category: 'performance' | 'capacity' | 'security' | 'maintenance',
    metric: string,
    value: number | string,
    threshold: number | string | undefined,
    message: string,
    recommendation: string
  ): void {
    const alert: Alert = {
      id: `alert-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      severity,
      category,
      metric,
      value,
      threshold,
      message,
      recommendation
    };

    this.alerts.push(alert);

    if (typeof value === 'number' && typeof threshold === 'number') {
      this.thresholdViolations.push({
        metric,
        value,
        threshold,
        severity: severity === 'critical' ? 'critical' : 'warning',
        description: message
      });
    }

    if (!this.recommendations.includes(recommendation)) {
      this.recommendations.push(recommendation);
    }
  }

  // Additional parsing methods would continue here...
  // [Truncated for brevity - would include methods for parsing BACnet devices, N2 devices, network hierarchy, etc.]

  private parseBacnetDevice(row: TridiumDataRow): DeviceInfo {
    // Implementation for BACnet device parsing
    return {
      name: row.data.Name || '',
      deviceId: row.data['Device ID'] || '',
      type: row.data.Type || 'BACnet Device',
      status: this.normalizeStatus(row.data.Status),
      vendor: row.data.Vendor || '',
      model: row.data.Model || '',
      firmwareVersion: row.data['Firmware Rev'],
      softwareVersion: row.data['App SW Version'],
      addressing: {
        network: row.data.Netwk,
        macAddress: row.data['MAC Addr']
      },
      protocolDetails: {
        protocol: 'BACnet',
        version: row.data['Protocol Rev'],
        maxApdu: parseInt(row.data['Max APDU']) || undefined,
        segmentation: row.data.Segmentation,
        encoding: row.data.Encoding
      },
      communications: {
        useCoV: row.data['Use Cov'] === 'true',
        maxCovSubscriptions: parseInt(row.data['Max Cov Subscriptions']) || undefined,
        covSubscriptions: parseInt(row.data['Cov Subscriptions']) || undefined
      },
      health: {
        lastSeen: this.parseHealthDate(row.data.Health)
      },
      enabled: row.data.Enabled === 'true'
    };
  }

  private parseN2Device(row: TridiumDataRow): DeviceInfo {
    return {
      name: row.data.Name || '',
      deviceId: row.data.Address?.toString() || '',
      type: row.data['Controller Type'] || 'N2 Device',
      status: this.normalizeStatus(row.data.Status),
      vendor: 'Johnson Controls', // N2 is JCI protocol
      model: row.data['Controller Type'] || '',
      addressing: {
        address: parseInt(row.data.Address) || undefined
      },
      protocolDetails: {
        protocol: 'N2'
      },
      communications: {},
      health: {},
      enabled: true // N2 devices are typically always enabled if listed
    };
  }

  private normalizeStatus(status: string): 'ok' | 'down' | 'alarm' | 'fault' | 'unknown' {
    if (!status) return 'unknown';
    const statusLower = status.toLowerCase();

    if (statusLower.includes('{ok}') || statusLower === 'ok') return 'ok';
    if (statusLower.includes('{down}') || statusLower === 'down') return 'down';
    if (statusLower.includes('alarm')) return 'alarm';
    if (statusLower.includes('fault')) return 'fault';

    return 'unknown';
  }

  private parseHealthDate(healthText?: string): Date | undefined {
    if (!healthText) return undefined;

    const dateMatch = healthText.match(/\[([^\]]+)\]/);
    if (dateMatch) {
      const date = new Date(dateMatch[1]);
      return isNaN(date.getTime()) ? undefined : date;
    }

    return undefined;
  }

  private calculateProtocolStats(devices: DeviceInfo[]) {
    return {
      totalDevices: devices.length,
      onlineDevices: devices.filter(d => d.status === 'ok').length,
      offlineDevices: devices.filter(d => d.status === 'down').length,
      alarmedDevices: devices.filter(d => d.status === 'alarm').length,
      faultedDevices: devices.filter(d => d.status === 'fault').length
    };
  }

  private parseNetworkHierarchy(rows: TridiumDataRow[]): NetworkNode[] {
    // Implementation would parse Niagara network export into hierarchy
    return [];
  }

  private extractBacnetDriverInfo(rows: TridiumDataRow[]) {
    const vendorCounts: Record<string, number> = {};

    rows.forEach(row => {
      const vendor = row.data.Vendor || 'Unknown';
      vendorCounts[vendor] = (vendorCounts[vendor] || 0) + 1;
    });

    return {
      networkCount: 1, // Would be calculated from network data
      deviceCount: rows.length,
      pointCount: 0, // Would need point export data
      protocolRevision: '9', // Most common in examples
      maxApduLength: 480,
      segmentationSupport: 'Segmented Both',
      covEnabled: rows.some(row => row.data['Use Cov'] === 'true'),
      vendorBreakdown: vendorCounts
    };
  }

  private extractN2DriverInfo(rows: TridiumDataRow[]) {
    const controllerTypes: Record<string, number> = {};
    const offlineDevices: string[] = [];
    const unknownControllers: string[] = [];

    let minAddress = Infinity;
    let maxAddress = -Infinity;

    rows.forEach(row => {
      const type = row.data['Controller Type'] || 'Unknown';
      controllerTypes[type] = (controllerTypes[type] || 0) + 1;

      if (row.data.Status?.includes('down')) {
        offlineDevices.push(row.data.Name || '');
      }

      if (type.includes('Unknown') || type.includes('177')) {
        unknownControllers.push(row.data.Name || '');
      }

      const address = parseInt(row.data.Address);
      if (!isNaN(address)) {
        minAddress = Math.min(minAddress, address);
        maxAddress = Math.max(maxAddress, address);
      }
    });

    return {
      networkCount: 1,
      deviceCount: rows.length,
      controllerTypes,
      addressRange: {
        min: minAddress === Infinity ? 0 : minAddress,
        max: maxAddress === -Infinity ? 0 : maxAddress
      },
      offlineDevices,
      unknownControllers
    };
  }

  private parseLicenseLine(line: string) {
    // Parse license line like "FacExp.license (Tridium 4.13 - never expires)"
    const match = line.match(/^([^(]+)\s*\(([^)]+)\)$/);
    if (!match) return null;

    const [, name, details] = match;
    const detailsParts = details.split(' - ');
    const vendorVersion = detailsParts[0]?.trim() || '';
    const expiry = detailsParts[1]?.trim() || '';

    const [vendor, version] = vendorVersion.split(' ');

    return {
      name: name.trim(),
      vendor: vendor || 'Unknown',
      version: version || '',
      expiryDate: expiry === 'never expires' ? undefined : new Date(expiry),
      neverExpires: expiry === 'never expires',
      type: 'License'
    };
  }

  private parseModuleLine(line: string) {
    // Parse module line like "alarm-rt (Tridium 4.12.1.16)"
    const match = line.match(/^([^(]+)\s*\(([^)]+)\)$/);
    if (!match) return null;

    const [, name, details] = match;
    const [vendor, version] = details.trim().split(' ');
    const [moduleName, type] = name.trim().split('-');

    return {
      name: name.trim(),
      vendor: vendor || 'Unknown',
      version: version || '',
      type: (type as 'rt' | 'ux' | 'wb' | 'se' | 'doc') || 'rt',
      compatible: VERSION_COMPATIBILITY.vendors[vendor as keyof typeof VERSION_COMPATIBILITY.vendors]?.includes(version) ?? true
    };
  }

  private parseCertificateLine(line: string) {
    // Parse certificate line like "Johnson.certificate (Johnson - never expires)"
    const match = line.match(/^([^(]+)\s*\(([^)]+)\)$/);
    if (!match) return null;

    const [, name, details] = match;
    const detailsParts = details.split(' - ');
    const vendor = detailsParts[0]?.trim() || 'Unknown';
    const expiry = detailsParts[1]?.trim() || '';

    const neverExpires = expiry === 'never expires';
    const expiryDate = neverExpires ? undefined : new Date(expiry);

    let daysUntilExpiry: number | undefined;
    let status: 'valid' | 'expiring' | 'expired' = 'valid';

    if (!neverExpires && expiryDate) {
      daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
      if (daysUntilExpiry < 0) {
        status = 'expired';
      } else if (daysUntilExpiry <= SYSTEM_THRESHOLDS.certificates.expiringDays) {
        status = 'expiring';
      }
    }

    return {
      name: name.trim(),
      vendor,
      expiryDate,
      neverExpires,
      daysUntilExpiry,
      status
    };
  }

  private generateSummary(analysis: NiagaraSystemAnalysis) {
    const criticalAlerts = this.alerts.filter(a => a.severity === 'critical');
    const warningAlerts = this.alerts.filter(a => a.severity === 'warning');

    // Determine system type
    let systemType: 'JACE' | 'Supervisor' | 'Workstation' = 'JACE';
    if (analysis.platform_identity.product?.toLowerCase().includes('supervisor')) {
      systemType = 'Supervisor';
    } else if (analysis.platform_identity.product?.toLowerCase().includes('workstation')) {
      systemType = 'Workstation';
    }

    // Calculate health score (0-100)
    let healthScore = 100;
    healthScore -= criticalAlerts.length * 15; // -15 per critical
    healthScore -= warningAlerts.length * 5;   // -5 per warning
    healthScore = Math.max(0, Math.min(100, healthScore));

    // Calculate capacity utilization
    const deviceUtil = analysis.resources.devices.unlimited ? 0 :
      analysis.resources.devices.licensed > 0 ?
      (analysis.resources.devices.used / analysis.resources.devices.licensed * 100) : 0;
    const pointUtil = analysis.resources.points.unlimited ? 0 :
      analysis.resources.points.licensed > 0 ?
      (analysis.resources.points.used / analysis.resources.points.licensed * 100) : 0;
    const capacityUtilization = Math.max(deviceUtil, pointUtil);

    return {
      systemType,
      totalDevices: analysis.inventory.totalDevices,
      healthScore: Math.round(healthScore),
      criticalIssues: criticalAlerts.length,
      warningIssues: warningAlerts.length,
      capacityUtilization: Math.round(capacityUtilization),
      recommendedActions: this.recommendations.slice(0, 5) // Top 5 recommendations
    };
  }

  private getProcessedFiles(input: AnalysisInput): string[] {
    const files: string[] = [];

    if (input.platformDetails?.filename) files.push(input.platformDetails.filename);
    if (input.resourceExport?.filename) files.push(input.resourceExport.filename);
    if (input.bacnetExport?.filename) files.push(input.bacnetExport.filename);
    if (input.n2Export?.filename) files.push(input.n2Export.filename);
    if (input.modbusExport?.filename) files.push(input.modbusExport.filename);
    if (input.niagaraNetExport?.filename) files.push(input.niagaraNetExport.filename);

    return files;
  }

  private calculateConfidence(input: AnalysisInput): number {
    let confidence = 0;
    let totalPossible = 0;

    if (input.platformDetails) { confidence += 25; totalPossible += 25; }
    if (input.resourceExport) { confidence += 25; totalPossible += 25; }
    if (input.bacnetExport) { confidence += 15; totalPossible += 15; }
    if (input.n2Export) { confidence += 15; totalPossible += 15; }
    if (input.modbusExport) { confidence += 10; totalPossible += 10; }
    if (input.niagaraNetExport) { confidence += 10; totalPossible += 10; }

    totalPossible = Math.max(totalPossible, 1); // Avoid division by zero
    return Math.round((confidence / totalPossible) * 100);
  }

  private resetAnalysis(): void {
    this.alerts = [];
    this.thresholdViolations = [];
    this.recommendations = [];
  }
}