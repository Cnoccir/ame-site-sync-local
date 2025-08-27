import { supabase } from "@/integrations/supabase/client";
import type { TridiumDataset, TridiumDataRow } from "@/types/tridium";

export interface DeviceRecord {
  id: string;
  name: string;
  type: string;
  status: string;
  address?: string;
  protocol: string;
  device_id?: string;
  vendor?: string;
  model?: string;
  location?: string;
  fox_port?: string;
  host_model?: string;
  version?: string;
  health_score?: number;
  raw_data: Record<string, any>;
  source_file: string;
  source_format: string;
  aggregation_id?: string;
  visit_id?: string;
}

export interface DeviceAggregation {
  id: string;
  name: string;
  description?: string;
  device_count: number;
  protocols: string[];
  created_by?: string;
  visit_id?: string;
  metadata: {
    files: string[];
    formats: string[];
    importedAt: Date;
    totalDevices: number;
    statusBreakdown: Record<string, number>;
    protocolBreakdown: Record<string, number>;
  };
}

export class DeviceInventoryService {
  /**
   * Save individual device records to the database
   */
  static async saveDevices(devices: DeviceRecord[]): Promise<{ success: boolean; error?: string }> {
    try {
      // For now, store in local storage until database is available
      const existingDevices = JSON.parse(localStorage.getItem('device_inventory') || '[]');
      const updatedDevices = [...existingDevices, ...devices];
      localStorage.setItem('device_inventory', JSON.stringify(updatedDevices));
      
      return { success: true };
    } catch (error) {
      console.error('Error saving devices:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Convert TridiumDataset to DeviceRecord array
   */
  static convertDatasetToDevices(
    dataset: TridiumDataset, 
    visitId?: string, 
    aggregationId?: string
  ): DeviceRecord[] {
    return dataset.rows.map(row => ({
      id: row.id,
      name: row.data.Name || row.data.name || `Device_${row.id}`,
      type: row.data.Type || row.data.type || row.data['Controller Type'] || 'Unknown',
      status: row.parsedStatus?.status || row.data.Status || row.data.status || 'unknown',
      address: row.data.Address || row.data.address || row.data['IP Address'],
      protocol: this.detectProtocol(dataset.format as any, dataset.filename),
      device_id: row.data['Device ID'] || row.data.device_id,
      vendor: row.data.Vendor || row.data.vendor,
      model: row.data.Model || row.data.model,
      location: row.data.Location || row.data.location,
      fox_port: row.data['Fox Port'] || row.data.fox_port,
      host_model: row.data['Host Model'] || row.data.host_model,
      version: row.data.Version || row.data.version || row.data['Firmware Rev'] || row.data['App SW Version'],
      health_score: this.calculateHealthScore(row),
      raw_data: row.data,
      source_file: dataset.filename,
      source_format: dataset.format,
      aggregation_id: aggregationId,
      visit_id: visitId
    }));
  }

  /**
   * Create a new device aggregation
   */
  static async createAggregation(
    name: string, 
    datasets: TridiumDataset[], 
    visitId?: string
  ): Promise<{ success: boolean; aggregationId?: string; error?: string }> {
    try {
      const metadata = this.generateAggregationMetadata(datasets);
      const aggregationId = `agg_${Date.now()}`;
      
      // Store aggregation in local storage for now
      const existingAggregations = JSON.parse(localStorage.getItem('device_aggregations') || '[]');
      const newAggregation = {
        id: aggregationId,
        name,
        description: `Aggregated inventory from ${datasets.length} file(s)`,
        device_count: metadata.totalDevices,
        protocols: metadata.protocols,
        visit_id: visitId,
        metadata,
        created_at: new Date().toISOString()
      };
      
      existingAggregations.push(newAggregation);
      localStorage.setItem('device_aggregations', JSON.stringify(existingAggregations));
      
      return { success: true, aggregationId };
    } catch (error) {
      console.error('Error creating aggregation:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Get devices for an aggregation with deduplication
   */
  static async getAggregatedDevices(aggregationId: string): Promise<DeviceRecord[]> {
    try {
      const allDevices = JSON.parse(localStorage.getItem('device_inventory') || '[]');
      const aggregatedDevices = allDevices.filter((device: DeviceRecord) => 
        device.aggregation_id === aggregationId
      );
      
      return this.deduplicateDevices(aggregatedDevices);
    } catch (error) {
      console.error('Error fetching aggregated devices:', error);
      return [];
    }
  }

  /**
   * Deduplicate devices based on name, address, and device_id
   */
  static deduplicateDevices(devices: DeviceRecord[]): DeviceRecord[] {
    const uniqueDevices = new Map<string, DeviceRecord>();
    
    devices.forEach(device => {
      const key = this.generateDeviceKey(device);
      const existing = uniqueDevices.get(key);
      
      if (!existing || this.isMoreComplete(device, existing)) {
        uniqueDevices.set(key, device);
      }
    });
    
    return Array.from(uniqueDevices.values());
  }

  /**
   * Generate a unique key for device deduplication
   */
  private static generateDeviceKey(device: DeviceRecord): string {
    const name = device.name.toLowerCase().trim();
    const address = (device.address || '').toLowerCase().trim();
    const deviceId = (device.device_id || '').toLowerCase().trim();
    
    return `${name}:${address}:${deviceId}`;
  }

  /**
   * Check if one device record is more complete than another
   */
  private static isMoreComplete(device1: DeviceRecord, device2: DeviceRecord): boolean {
    const score1 = this.getCompletenessScore(device1);
    const score2 = this.getCompletenessScore(device2);
    return score1 > score2;
  }

  /**
   * Calculate completeness score for a device record
   */
  private static getCompletenessScore(device: DeviceRecord): number {
    let score = 0;
    if (device.address) score += 2;
    if (device.device_id) score += 2;
    if (device.vendor) score += 1;
    if (device.model) score += 1;
    if (device.location) score += 1;
    if (device.fox_port) score += 1;
    if (device.host_model) score += 1;
    if (device.version) score += 1;
    if (device.health_score !== undefined) score += 1;
    return score;
  }

  /**
   * Detect protocol from dataset type and filename
   */
  private static detectProtocol(typeOrFormat: string | undefined, filename: string): string {
    const lowerType = (typeOrFormat || '').toLowerCase();
    const lowerFilename = (filename || '').toLowerCase();
    
    if (lowerType.includes('bacnet') || lowerFilename.includes('bacnet')) return 'BACnet';
    if (lowerType.includes('niagara') || lowerFilename.includes('niagara')) return 'Niagara';
    if (lowerType.includes('n2') || lowerFilename.includes('n2')) return 'N2';
    if (lowerType.includes('resource') || lowerFilename.includes('resource')) return 'System';
    
    return 'Unknown';
  }

  /**
   * Calculate health score for a device
   */
  private static calculateHealthScore(row: TridiumDataRow): number {
    if (!row.parsedStatus) return 50; // Default neutral score
    
    switch (row.parsedStatus.status) {
      case 'ok': return 100;
      case 'down': return 0;
      case 'alarm': return 25;
      case 'fault': return 10;
      default: return 50;
    }
  }

  /**
   * Generate metadata for device aggregation
   */
  private static generateAggregationMetadata(datasets: TridiumDataset[]) {
    const files = datasets.map(d => d.filename);
    const formats = [...new Set(datasets.map(d => d.format))] as string[];
    const protocols = [...new Set(datasets.map(d => this.detectProtocol(d.format as any, d.filename)))] as string[];
    
    let totalDevices = 0;
    const statusBreakdown: Record<string, number> = {};
    const protocolBreakdown: Record<string, number> = {};
    
    datasets.forEach(dataset => {
      totalDevices += dataset.rows.length;
      
      // Count status breakdown
      dataset.rows.forEach(row => {
        const status = row.parsedStatus?.status || 'unknown';
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });
      
      // Count protocol breakdown
      const protocol = this.detectProtocol(dataset.format as any, dataset.filename);
      protocolBreakdown[protocol] = (protocolBreakdown[protocol] || 0) + dataset.rows.length;
    });
    
    return {
      files,
      formats,
      importedAt: new Date().toISOString(),
      totalDevices,
      statusBreakdown,
      protocolBreakdown,
      protocols
    };
  }

  /**
   * Generate simple inventory report from devices
   */
  static generateSimpleInventory(devices: DeviceRecord[], title?: string): string {
    const groupedByProtocol = this.groupDevicesByProtocol(devices);
    const statusCounts = this.getStatusCounts(devices);
    
    let report = `# ${title || 'Network Device Inventory Report'}\n\n`;
    report += `**Generated:** ${new Date().toLocaleDateString()}\n`;
    report += `**Total Devices:** ${devices.length}\n\n`;
    
    // Status Summary
    report += `## Status Summary\n`;
    Object.entries(statusCounts).forEach(([status, count]) => {
      report += `- ${status.toUpperCase()}: ${count}\n`;
    });
    report += '\n';
    
    // Device Inventory by Protocol
    Object.entries(groupedByProtocol).forEach(([protocol, protocolDevices]) => {
      report += `## ${protocol} Devices (${protocolDevices.length})\n\n`;
      report += `| Name | Type | Status | Address | Device ID | Host Model | Fox Port | Version |\n`;
      report += `|------|------|--------|---------|----------|------------|----------|---------|\n`;
      
      protocolDevices.forEach(device => {
        report += `| ${device.name} | ${device.type} | ${device.status.toUpperCase()} | ${device.address || 'N/A'} | ${device.device_id || 'N/A'} | ${device.host_model || 'N/A'} | ${device.fox_port || 'N/A'} | ${device.version || 'N/A'} |\n`;
      });
      report += '\n';
    });
    
    return report;
  }

  /**
   * Group devices by protocol
   */
  private static groupDevicesByProtocol(devices: DeviceRecord[]): Record<string, DeviceRecord[]> {
    return devices.reduce((groups, device) => {
      const protocol = device.protocol || 'Unknown';
      if (!groups[protocol]) groups[protocol] = [];
      groups[protocol].push(device);
      return groups;
    }, {} as Record<string, DeviceRecord[]>);
  }

  /**
   * Get status counts for devices
   */
  private static getStatusCounts(devices: DeviceRecord[]): Record<string, number> {
    return devices.reduce((counts, device) => {
      const status = device.status || 'unknown';
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {} as Record<string, number>);
  }

  /**
   * Save inventory report to database
   */
  static async saveInventoryReport(
    title: string,
    content: string,
    aggregationId?: string,
    visitId?: string
  ): Promise<{ success: boolean; reportId?: string; error?: string }> {
    try {
      const reportId = `report_${Date.now()}`;
      
      // Store report in local storage for now
      const existingReports = JSON.parse(localStorage.getItem('inventory_reports') || '[]');
      const newReport = {
        id: reportId,
        title,
        content,
        report_type: 'inventory_simple',
        aggregation_id: aggregationId,
        visit_id: visitId,
        metadata: {
          generatedAt: new Date().toISOString(),
          format: 'markdown',
          type: 'simple_inventory'
        },
        created_at: new Date().toISOString()
      };
      
      existingReports.push(newReport);
      localStorage.setItem('inventory_reports', JSON.stringify(existingReports));
      
      return { success: true, reportId };
    } catch (error) {
      console.error('Error saving inventory report:', error);
      return { success: false, error: error.message };
    }
  }
}