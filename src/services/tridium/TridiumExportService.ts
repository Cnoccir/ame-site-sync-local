import Papa from 'papaparse';
import { 
  ResourceExportData, 
  BACnetDeviceData, 
  N2DeviceData, 
  ProcessedTridiumExports,
  TridiumFileUpload,
  ParseOptions,
  FILE_TYPE_PATTERNS,
  ExportFileType,
  DEVICE_CATEGORIES 
} from '@/types/tridiumExport.types';

/**
 * Tridium Export Processing Service
 * Handles parsing of various Tridium Workbench CSV exports
 */
export class TridiumExportService {
  
  /**
   * Detect file type based on filename patterns
   */
  static detectFileType(filename: string): ExportFileType | 'unknown' {
    const lowerFilename = filename.toLowerCase();
    
    for (const [type, pattern] of Object.entries(FILE_TYPE_PATTERNS)) {
      if (pattern.test(lowerFilename)) {
        return type as ExportFileType;
      }
    }
    
    return 'unknown';
  }

  /**
   * Parse ResourceExport CSV (Name/Value pairs)
   */
  static async parseResourceExport(file: File): Promise<ResourceExportData> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false, // Keep as strings for custom parsing
        complete: (results) => {
          try {
            const data = results.data as Array<{ Name: string; Value: string }>;
            const metrics: Record<string, string> = {};
            
            // Build key-value lookup
            data.forEach(row => {
              if (row.Name && row.Value !== undefined) {
                metrics[row.Name] = row.Value;
              }
            });

            // Parse specific metrics
            const resourceData: ResourceExportData = {
              cpuUsage: this.parsePercentage(metrics['cpu.usage'] || '0%'),
              memoryUsage: this.parsePercentage(metrics['engine.scan.usage'] || '0%'),
              heapUsed: this.parseMemoryMB(metrics['heap.used'] || '0 MB'),
              heapMax: this.parseMemoryMB(metrics['heap.max'] || '0 MB'),
              uptime: metrics['time.uptime'] || 'Unknown',
              
              deviceCount: this.parseDeviceCount(metrics['globalCapacity.devices'] || '0'),
              deviceLimit: this.parseDeviceLimit(metrics['globalCapacity.devices'] || '0'),
              pointCount: this.parseDeviceCount(metrics['globalCapacity.points'] || '0'),
              pointLimit: this.parseDeviceLimit(metrics['globalCapacity.points'] || '0'),
              historyCount: parseInt(metrics['history.count'] || '0'),
              
              engineUsage: this.parsePercentage(metrics['engine.scan.usage'] || '0%'),
              scanLifetime: parseFloat(metrics['engine.scan.lifetime']?.replace(' ms', '') || '0'),
              scanPeak: parseFloat(metrics['engine.scan.peak']?.replace(' ms', '') || '0'),
              componentCount: parseInt(metrics['component.count']?.replace(',', '') || '0'),
              
              licenseUsage: this.extractLicenseUsage(metrics['globalCapacity.devices'] || ''),
              
              rawMetrics: metrics
            };

            resolve(resourceData);
          } catch (error) {
            reject(new Error(`Failed to parse resource export: ${error.message}`));
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  /**
   * Parse BACnet Device Export CSV
   */
  static async parseBACnetExport(file: File): Promise<BACnetDeviceData[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          try {
            const rawData = results.data as Array<Record<string, string>>;
            const devices: BACnetDeviceData[] = rawData.map(row => ({
              name: row.Name || '',
              type: row.Type || '',
              deviceId: row['Device ID'] || '',
              status: this.parseDeviceStatus(row.Status || ''),
              network: row.Netwk || '',
              macAddress: row['MAC Addr'] || '',
              vendor: row.Vendor || '',
              model: row.Model || '',
              firmwareVersion: row['Firmware Rev'] || '',
              health: row.Health || '',
              enabled: row.Enabled === 'true',
              lastSeen: this.extractTimestamp(row.Health || '')
            }));

            resolve(devices);
          } catch (error) {
            reject(new Error(`Failed to parse BACnet export: ${error.message}`));
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  /**
   * Parse N2 Export CSV
   */
  static async parseN2Export(file: File): Promise<N2DeviceData[]> {
    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: false,
        complete: (results) => {
          try {
            const rawData = results.data as Array<Record<string, string>>;
            const devices: N2DeviceData[] = rawData.map(row => ({
              name: row.Name || '',
              status: this.parseDeviceStatus(row.Status || ''),
              address: parseInt(row.Address || '0'),
              controllerType: row['Controller Type'] || ''
            }));

            resolve(devices);
          } catch (error) {
            reject(new Error(`Failed to parse N2 export: ${error.message}`));
          }
        },
        error: (error) => {
          reject(new Error(`CSV parsing error: ${error.message}`));
        }
      });
    });
  }

  /**
   * Process multiple export files and combine results
   */
  static async processMultipleExports(files: File[]): Promise<ProcessedTridiumExports> {
    const uploads: TridiumFileUpload[] = files.map(file => ({
      file,
      type: this.detectFileType(file.name),
      status: 'pending'
    }));

    let resourceData: ResourceExportData | undefined;
    let bacnetDevices: BACnetDeviceData[] = [];
    let n2Devices: N2DeviceData[] = [];
    const filesProcessed: string[] = [];

    // Process each file based on type
    for (const upload of uploads) {
      try {
        upload.status = 'processing';
        
        switch (upload.type) {
          case 'resource':
            resourceData = await this.parseResourceExport(upload.file);
            upload.data = resourceData;
            break;
            
          case 'bacnet':
            bacnetDevices = await this.parseBACnetExport(upload.file);
            upload.data = bacnetDevices;
            break;
            
          case 'n2':
            n2Devices = await this.parseN2Export(upload.file);
            upload.data = n2Devices;
            break;
        }
        
        upload.status = 'completed';
        filesProcessed.push(upload.file.name);
      } catch (error) {
        upload.status = 'error';
        upload.error = error.message;
        console.error(`Error processing ${upload.file.name}:`, error);
      }
    }

    // Generate summary statistics
    const summary = this.generateSummary(bacnetDevices, n2Devices, resourceData);

    return {
      processed: true,
      uploadTime: new Date(),
      filesProcessed,
      resourceData,
      bacnetDevices,
      n2Devices,
      summary
    };
  }

  /**
   * Generate summary statistics from parsed data
   */
  private static generateSummary(
    bacnetDevices: BACnetDeviceData[], 
    n2Devices: N2DeviceData[], 
    resourceData?: ResourceExportData
  ) {
    const allDevices = [...bacnetDevices, ...n2Devices];
    const totalDevices = allDevices.length;
    
    const onlineDevices = allDevices.filter(device => device.status === 'ok').length;
    const offlineDevices = allDevices.filter(device => device.status === 'down').length;
    const devicesWithAlarms = allDevices.filter(device => 
      device.status === 'unackedAlarm' || device.status === 'fault'
    ).length;

    // Calculate system health score (0-100)
    let healthScore = 100;
    if (totalDevices > 0) {
      healthScore = Math.round((onlineDevices / totalDevices) * 100);
    }
    
    // If we have resource data, factor in CPU/memory
    if (resourceData) {
      const cpuPenalty = Math.max(0, resourceData.cpuUsage - 80) * 0.5;
      const memoryPenalty = Math.max(0, resourceData.memoryUsage - 80) * 0.5;
      healthScore = Math.max(0, healthScore - cpuPenalty - memoryPenalty);
    }

    // Count vendors
    const vendorCounts: Record<string, number> = {};
    bacnetDevices.forEach(device => {
      vendorCounts[device.vendor] = (vendorCounts[device.vendor] || 0) + 1;
    });
    const primaryVendors = Object.entries(vendorCounts)
      .map(([vendor, count]) => ({ vendor, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Count device types
    const typeCounts: Record<string, number> = {};
    [...bacnetDevices, ...n2Devices].forEach(device => {
      const deviceType = this.categorizeDevice(device.name || device.type);
      typeCounts[deviceType] = (typeCounts[deviceType] || 0) + 1;
    });
    const deviceTypes = Object.entries(typeCounts)
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count);

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      devicesWithAlarms,
      systemHealthScore: Math.round(healthScore),
      primaryVendors,
      deviceTypes
    };
  }

  // Utility parsing functions
  private static parsePercentage(value: string): number {
    const match = value.match(/(\d+(?:\.\d+)?)%?/);
    return match ? parseFloat(match[1]) : 0;
  }

  private static parseMemoryMB(value: string): number {
    const match = value.match(/(\d+(?:\.\d+)?)\s*MB/);
    return match ? parseFloat(match[1]) : 0;
  }

  private static parseDeviceCount(value: string): number {
    const match = value.match(/(\d+(?:,\d+)*)/);
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  private static parseDeviceLimit(value: string): number {
    const limitMatch = value.match(/Limit:\s*(\d+(?:,\d+)*|none)/);
    if (limitMatch && limitMatch[1] !== 'none') {
      return parseInt(limitMatch[1].replace(/,/g, ''));
    }
    return 0; // 0 means unlimited
  }

  private static extractLicenseUsage(value: string): string {
    const match = value.match(/\(([^)]+)\)/);
    return match ? match[1] : '';
  }

  private static parseDeviceStatus(status: string): 'ok' | 'unackedAlarm' | 'down' | 'fault' {
    const cleanStatus = status.replace(/[{}]/g, '').toLowerCase();
    
    if (cleanStatus.includes('ok')) return 'ok';
    if (cleanStatus.includes('unackedalarm')) return 'unackedAlarm';
    if (cleanStatus.includes('down')) return 'down';
    if (cleanStatus.includes('fault')) return 'fault';
    
    return 'ok'; // Default fallback
  }

  private static extractTimestamp(health: string): string | undefined {
    const match = health.match(/\[(.*?)\]/);
    return match ? match[1] : undefined;
  }

  private static categorizeDevice(deviceName: string): string {
    const upperName = deviceName.toUpperCase();
    
    for (const [prefix, category] of Object.entries(DEVICE_CATEGORIES)) {
      if (upperName.includes(prefix)) {
        return category;
      }
    }
    
    return 'Other Devices';
  }
}

export default TridiumExportService;