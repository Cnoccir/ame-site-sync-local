import { 
  TridiumDataset, 
  EnhancedTridiumDataset, 
  DeviceHealth, 
  SystemResourceMetrics, 
  NetworkTopology, 
  HealthDashboardConfig 
} from '@/types/tridium';
import { NetworkTopologyService } from '@/services/networkTopologyService';
import { TridiumCSVParser } from '@/utils/tridiumParser';
import { logger } from '@/utils/logger';

export class HealthMonitoringService {
  /**
   * Convert standard datasets to enhanced datasets with health metrics
   */
  static enhanceDatasets(
    datasets: TridiumDataset[], 
    serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN'
  ): EnhancedTridiumDataset[] {
    return datasets.map(dataset => {
      const enhanced: EnhancedTridiumDataset = {
        ...dataset,
        dashboardConfig: this.generateDashboardConfig(serviceTier)
      };

      // Add health metrics for device datasets
      if (dataset.type === 'bacnetDevices' || dataset.type === 'networkDevices') {
        enhanced.healthMetrics = this.extractDeviceHealth(dataset);
      }

      // Add resource metrics for resource datasets
      if (dataset.type === 'resourceMetrics') {
        enhanced.resourceMetrics = this.extractResourceMetrics(dataset);
      }

      return enhanced;
    });
  }

  /**
   * Generate dashboard configuration based on service tier
   */
  static generateDashboardConfig(serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN'): HealthDashboardConfig {
    const tierConfigs = {
      CORE: {
        enabledMetrics: {
          deviceStatus: true,
          resourceMonitoring: false,
          networkTopology: false,
          alerting: true,
          historicalTrends: false,
          predictiveAnalytics: false
        },
        alertThresholds: {
          cpu: 85,
          memory: 90,
          deviceOffline: 30,
          criticalAlarms: true
        },
        refreshInterval: 300 // 5 minutes
      },
      ASSURE: {
        enabledMetrics: {
          deviceStatus: true,
          resourceMonitoring: true,
          networkTopology: true,
          alerting: true,
          historicalTrends: false,
          predictiveAnalytics: false
        },
        alertThresholds: {
          cpu: 80,
          memory: 85,
          deviceOffline: 15,
          criticalAlarms: true
        },
        refreshInterval: 60 // 1 minute
      },
      GUARDIAN: {
        enabledMetrics: {
          deviceStatus: true,
          resourceMonitoring: true,
          networkTopology: true,
          alerting: true,
          historicalTrends: true,
          predictiveAnalytics: true
        },
        alertThresholds: {
          cpu: 70,
          memory: 75,
          deviceOffline: 5,
          criticalAlarms: true
        },
        refreshInterval: 30 // 30 seconds
      }
    };

    return {
      serviceTier,
      ...tierConfigs[serviceTier]
    };
  }

  /**
   * Extract device health from dataset
   */
  static extractDeviceHealth(dataset: TridiumDataset): DeviceHealth[] {
    return dataset.rows.map(row => {
      const deviceId = row.data['Device ID'] || row.data.Address || row.id;
      const deviceName = row.data.Name || row.data.name || `Device_${deviceId}`;
      
      let protocol: DeviceHealth['protocol'] = 'Unknown';
      if (dataset.type === 'bacnetDevices') protocol = 'BACnet';
      else if (dataset.type === 'networkDevices') protocol = 'N2';
      else if (dataset.type === 'niagaraStations') protocol = 'Niagara';

      const status = row.parsedStatus || {
        status: 'unknown' as const,
        severity: 'normal' as const,
        details: ['No status information'],
        badge: { text: 'UNKNOWN', variant: 'default' as const }
      };

      const healthScore = this.calculateHealthScore(status, row.data);
      const diagnostics = this.generateDiagnostics(row.data, status);

      return {
        deviceId,
        deviceName,
        protocol,
        status,
        healthScore,
        lastSeen: new Date(),
        diagnostics,
        metadata: {
          vendor: row.data.Vendor,
          model: row.data.Model,
          address: row.data.Address,
          sourceDataset: dataset.filename,
          rawData: row.data
        }
      };
    });
  }

  /**
   * Extract system resource metrics from dataset
   */
  static extractResourceMetrics(dataset: TridiumDataset): SystemResourceMetrics | undefined {
    if (dataset.type !== 'resourceMetrics') return undefined;

    const resourceData: Record<string, any> = {};
    dataset.rows.forEach(row => {
      if (row.data.Name && row.data.Value) {
        resourceData[row.data.Name] = row.data.Value;
        if (row.parsedValues?.Value) {
          resourceData[`${row.data.Name}_parsed`] = row.parsedValues.Value;
        }
      }
    });

    // Extract platform information from filename or data
    const stationName = this.extractStationName(dataset.filename, resourceData);
    const platform = this.detectPlatform(resourceData);

    // Parse resource values
    const resources = this.parseResourceValues(resourceData);
    const licensing = this.parseLicensing(resourceData);

    return {
      stationId: `station_${dataset.id}`,
      stationName,
      platform,
      model: resourceData.Model || resourceData.model,
      version: resourceData.Version || resourceData.version,
      resources,
      licensing,
      uptime: resourceData.uptime || resourceData.Uptime,
      timestamp: new Date()
    };
  }

  /**
   * Calculate device health score (0-100)
   */
  private static calculateHealthScore(status: any, deviceData: Record<string, any>): number {
    let score = 50; // Base score

    // Status-based scoring
    switch (status.status) {
      case 'ok':
        score = 100;
        break;
      case 'alarm':
        score = 60;
        break;
      case 'down':
        score = 0;
        break;
      case 'fault':
        score = 10;
        break;
      default:
        score = 50;
        break;
    }

    // Adjust based on device metadata
    if (deviceData.Health) {
      const health = deviceData.Health.toLowerCase();
      if (health.includes('good')) score = Math.max(score, 90);
      else if (health.includes('fair')) score = Math.min(score, 75);
      else if (health.includes('poor')) score = Math.min(score, 25);
    }

    // Adjust based on vendor/model reliability (could be enhanced with historical data)
    const vendor = (deviceData.Vendor || '').toLowerCase();
    if (vendor.includes('johnson') || vendor.includes('schneider')) {
      score += 5; // Reliable vendors get slight boost
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate diagnostics for a device
   */
  private static generateDiagnostics(deviceData: Record<string, any>, status: any): DeviceHealth['diagnostics'] {
    const diagnostics: DeviceHealth['diagnostics'] = {
      connectivity: 'unknown',
      performance: 'unknown',
      errors: [],
      warnings: []
    };

    // Determine connectivity
    if (status.status === 'ok') {
      diagnostics.connectivity = 'online';
    } else if (status.status === 'down') {
      diagnostics.connectivity = 'offline';
      diagnostics.errors.push('Device not responding');
    } else if (status.status === 'alarm') {
      diagnostics.connectivity = 'intermittent';
      diagnostics.warnings.push('Device showing alarm condition');
    }

    // Analyze performance indicators
    if (deviceData.Health) {
      const health = deviceData.Health.toLowerCase();
      if (health.includes('good')) diagnostics.performance = 'good';
      else if (health.includes('fair')) diagnostics.performance = 'fair';
      else if (health.includes('poor')) {
        diagnostics.performance = 'poor';
        diagnostics.warnings.push('Poor device health reported');
      }
    }

    // Check for potential issues
    if (deviceData.Address && deviceData.Address.toString().includes('timeout')) {
      diagnostics.errors.push('Network timeout detected');
    }

    if (deviceData.Enabled === 'false' || deviceData.Enabled === false) {
      diagnostics.warnings.push('Device disabled in configuration');
    }

    return diagnostics;
  }

  /**
   * Extract station name from filename or data
   */
  private static extractStationName(filename: string, resourceData: Record<string, any>): string {
    // Try to extract from hostname or station name in data
    if (resourceData['platform.hostName']) return resourceData['platform.hostName'];
    if (resourceData.hostname) return resourceData.hostname;
    
    // Extract from filename
    const filenameParts = filename.replace(/\.(csv|txt)$/i, '').split(/[_-]/);
    if (filenameParts.length > 1) {
      return filenameParts[0];
    }

    return 'Unknown Station';
  }

  /**
   * Detect platform type from resource data
   */
  private static detectPlatform(resourceData: Record<string, any>): SystemResourceMetrics['platform'] {
    const model = (resourceData.Model || resourceData.model || '').toLowerCase();
    const osName = (resourceData['platform.osName'] || '').toLowerCase();

    if (model.includes('workstation') || osName.includes('windows')) {
      return 'Workstation';
    } else if (model.includes('jace') || model.includes('titan')) {
      return 'JACE';
    } else {
      return 'Supervisor';
    }
  }

  /**
   * Parse resource values from raw data
   */
  private static parseResourceValues(resourceData: Record<string, any>): SystemResourceMetrics['resources'] {
    const resources: SystemResourceMetrics['resources'] = {
      cpu: { usage: 0 },
      memory: { used: 0, total: 0, percentage: 0 }
    };

    // Parse CPU usage
    if (resourceData['cpu.usage']) {
      const cpuValue = TridiumCSVParser.parseValue(resourceData['cpu.usage']);
      if (cpuValue.type === 'percentage' && typeof cpuValue.value === 'number') {
        resources.cpu.usage = cpuValue.value;
      }
    }

    // Parse memory usage
    const memoryKeys = ['memory.used', 'heap.used', 'platform.memory.used'];
    for (const key of memoryKeys) {
      if (resourceData[key]) {
        const memValue = TridiumCSVParser.parseValue(resourceData[key]);
        if (memValue.type === 'memory' && typeof memValue.value === 'number') {
          resources.memory.used = memValue.value;
          break;
        }
      }
    }

    const memoryTotalKeys = ['memory.total', 'heap.total', 'platform.memory.total'];
    for (const key of memoryTotalKeys) {
      if (resourceData[key]) {
        const memValue = TridiumCSVParser.parseValue(resourceData[key]);
        if (memValue.type === 'memory' && typeof memValue.value === 'number') {
          resources.memory.total = memValue.value;
          break;
        }
      }
    }

    // Calculate memory percentage
    if (resources.memory.total > 0) {
      resources.memory.percentage = (resources.memory.used / resources.memory.total) * 100;
    }

    return resources;
  }

  /**
   * Parse licensing information from resource data
   */
  private static parseLicensing(resourceData: Record<string, any>): SystemResourceMetrics['licensing'] {
    const licensing: SystemResourceMetrics['licensing'] = {
      points: { used: 0, limit: 0 }
    };

    // Parse points licensing
    if (resourceData['globalCapacity.points']) {
      const pointsValue = TridiumCSVParser.parseValue(resourceData['globalCapacity.points']);
      if (pointsValue.metadata?.limit) {
        licensing.points.used = typeof pointsValue.value === 'number' ? pointsValue.value : 0;
        licensing.points.limit = pointsValue.metadata.limit;
      }
    }

    // Parse histories licensing
    if (resourceData['globalCapacity.histories']) {
      const historiesValue = TridiumCSVParser.parseValue(resourceData['globalCapacity.histories']);
      if (historiesValue.metadata?.limit) {
        licensing.histories = {
          used: typeof historiesValue.value === 'number' ? historiesValue.value : 0,
          limit: historiesValue.metadata.limit
        };
      }
    }

    // Parse KRU (Kilo Resource Units)
    if (resourceData.resources) {
      const kruValue = TridiumCSVParser.parseValue(resourceData.resources);
      if (kruValue.unit === 'kRU' && typeof kruValue.value === 'number') {
        licensing.kru = { used: kruValue.value };
      }
    }

    return licensing;
  }

  /**
   * Generate comprehensive health report for assessment
   */
  static generateHealthReport(datasets: EnhancedTridiumDataset[]): {
    summary: string;
    criticalIssues: string[];
    recommendations: string[];
    metrics: {
      totalDevices: number;
      healthyDevices: number;
      degradedDevices: number;
      offlineDevices: number;
      systemLoadAverage: number;
    };
  } {
    const allHealth = datasets.flatMap(ds => ds.healthMetrics || []);
    const resourceMetrics = datasets.map(ds => ds.resourceMetrics).filter(Boolean);
    
    const totalDevices = allHealth.length;
    const healthyDevices = allHealth.filter(h => h.healthScore >= 80).length;
    const degradedDevices = allHealth.filter(h => h.healthScore >= 40 && h.healthScore < 80).length;
    const offlineDevices = allHealth.filter(h => h.healthScore < 40).length;
    
    const systemLoadAverage = resourceMetrics.length > 0 
      ? resourceMetrics.reduce((sum, rm) => sum + (rm?.resources.cpu.usage || 0), 0) / resourceMetrics.length
      : 0;

    const criticalIssues: string[] = [];
    const recommendations: string[] = [];

    // Identify critical issues
    if (offlineDevices > 0) {
      criticalIssues.push(`${offlineDevices} devices are offline or severely degraded`);
      recommendations.push('Immediate investigation required for offline devices');
    }

    if (systemLoadAverage > 80) {
      criticalIssues.push(`High system load average: ${systemLoadAverage.toFixed(1)}%`);
      recommendations.push('Consider system optimization or load reduction');
    }

    resourceMetrics.forEach(rm => {
      if (rm && rm.resources.memory.percentage > 85) {
        criticalIssues.push(`${rm.stationName}: Memory usage above 85%`);
        recommendations.push(`Review memory usage on ${rm.stationName}`);
      }
    });

    // Generate summary
    const healthPercentage = totalDevices > 0 ? ((healthyDevices / totalDevices) * 100).toFixed(1) : '0';
    
    let summary = `System Health Assessment: ${healthPercentage}% of devices (${healthyDevices}/${totalDevices}) are healthy. `;
    
    if (criticalIssues.length > 0) {
      summary += `${criticalIssues.length} critical issues identified requiring immediate attention. `;
    } else {
      summary += 'No critical issues detected. ';
    }

    if (systemLoadAverage > 0) {
      summary += `Average system load is ${systemLoadAverage.toFixed(1)}%.`;
    }

    return {
      summary,
      criticalIssues,
      recommendations,
      metrics: {
        totalDevices,
        healthyDevices,
        degradedDevices,
        offlineDevices,
        systemLoadAverage
      }
    };
  }

  /**
   * Create network topology with health overlay
   */
  static buildHealthTopology(datasets: EnhancedTridiumDataset[]): NetworkTopology {
    // Use the standard topology service but enhance with health data
    const basicDatasets = datasets.map(ds => ({
      ...ds,
      healthMetrics: undefined,
      resourceMetrics: undefined
    })) as TridiumDataset[];

    const topology = NetworkTopologyService.buildTopology(basicDatasets);

    // Enhance nodes with health information
    this.enhanceTopologyWithHealth(topology.rootNode, datasets);

    return topology;
  }

  /**
   * Enhance topology nodes with health information
   */
  private static enhanceTopologyWithHealth(node: any, datasets: EnhancedTridiumDataset[]): void {
    // Find health data for this node
    const allHealthMetrics = datasets.flatMap(ds => ds.healthMetrics || []);
    const nodeHealth = allHealthMetrics.find(h => 
      h.deviceId === node.id || h.deviceName === node.name
    );

    if (nodeHealth) {
      node.metadata.healthScore = nodeHealth.healthScore;
      node.metadata.diagnostics = nodeHealth.diagnostics;
      node.metadata.lastSeen = nodeHealth.lastSeen;
    }

    // Recursively enhance children
    node.children.forEach((child: any) => {
      this.enhanceTopologyWithHealth(child, datasets);
    });
  }

  /**
   * Export health data for assessment reporting
   */
  static exportHealthSummary(datasets: EnhancedTridiumDataset[]): {
    csvData: string;
    reportText: string;
  } {
    const healthReport = this.generateHealthReport(datasets);
    const allHealth = datasets.flatMap(ds => ds.healthMetrics || []);

    // Generate CSV
    const csvHeaders = [
      'Device Name',
      'Device ID', 
      'Protocol',
      'Status',
      'Health Score',
      'Connectivity',
      'Performance',
      'Vendor',
      'Model',
      'Last Seen'
    ];

    const csvRows = allHealth.map(h => [
      h.deviceName,
      h.deviceId,
      h.protocol,
      h.status.status,
      h.healthScore.toString(),
      h.diagnostics.connectivity,
      h.diagnostics.performance,
      h.metadata.vendor || '',
      h.metadata.model || '',
      h.lastSeen?.toISOString() || ''
    ]);

    const csvData = [csvHeaders, ...csvRows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    // Generate report text
    const reportText = `
# Network Health Assessment Report

## Executive Summary
${healthReport.summary}

## System Metrics
- Total Devices: ${healthReport.metrics.totalDevices}
- Healthy Devices: ${healthReport.metrics.healthyDevices} (${((healthReport.metrics.healthyDevices / healthReport.metrics.totalDevices) * 100).toFixed(1)}%)
- Degraded Devices: ${healthReport.metrics.degradedDevices}
- Offline Devices: ${healthReport.metrics.offlineDevices}
- Average System Load: ${healthReport.metrics.systemLoadAverage.toFixed(1)}%

## Critical Issues
${healthReport.criticalIssues.length > 0 
  ? healthReport.criticalIssues.map(issue => `- ${issue}`).join('\n')
  : 'No critical issues identified.'
}

## Recommendations
${healthReport.recommendations.length > 0
  ? healthReport.recommendations.map(rec => `- ${rec}`).join('\n')
  : 'System is operating within normal parameters.'
}

Generated on: ${new Date().toLocaleString()}
    `.trim();

    return { csvData, reportText };
  }
}
