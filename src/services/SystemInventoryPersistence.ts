import { supabase } from '@/integrations/supabase/client';

// Enhanced interfaces for comprehensive system inventory
export interface SystemBaseline {
  id?: string;
  customer_id?: string;
  site_name: string;
  baseline_date: Date;
  system_architecture: 'single-jace' | 'multi-jace' | 'supervisor';
  niagara_version: string;
  total_devices: number;
  total_points: number;
  resource_data: ResourceSummary;
  device_inventory: DeviceInventorySummary;
  network_topology: NetworkTopology;
  platform_details: PlatformSummary;
  health_score: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface ResourceSummary {
  cpu_usage: number;
  memory_usage: number;
  heap_usage: number;
  capacity_utilization: {
    points: { current: number; limit: number; percentage: number };
    devices: { current: number; limit: number; percentage: number };
    networks: { current: number; limit: number; percentage: number };
    histories: { current: number; limit: number | null };
  };
  uptime: string;
  system_load: 'low' | 'medium' | 'high' | 'critical';
}

export interface DeviceInventorySummary {
  bacnet_devices: {
    total: number;
    healthy: number;
    faulty: number;
    offline: number;
    by_vendor: Record<string, number>;
    by_model: Record<string, number>;
    firmware_versions: Record<string, number>;
  };
  n2_devices: {
    total: number;
    healthy: number;
    faulty: number;
    offline: number;
    by_type: Record<string, number>;
  };
  health_percentage: number;
}

export interface NetworkTopology {
  architecture_type: 'single-jace' | 'multi-jace' | 'supervisor';
  jace_stations: Array<{
    name: string;
    ip_address: string;
    model: string;
    version: string;
    status: string;
    connection_status: string;
  }>;
  network_segments: number;
  total_connections: number;
  healthy_connections: number;
}

export interface PlatformSummary {
  model: string;
  product: string;
  host_id: string;
  architecture: string;
  cpu_count: number;
  ram_total: number;
  ram_free: number;
  storage_free: number;
  storage_total: number;
  modules_count: number;
  licenses: string[];
  certificates: string[];
}

export class SystemInventoryPersistence {

  /**
   * Save complete system baseline to database
   */
  static async saveSystemBaseline(baseline: SystemBaseline): Promise<string> {
    try {
      const { data, error } = await supabase
        .from('system_baselines')
        .insert([{
          customer_id: baseline.customer_id,
          site_name: baseline.site_name,
          baseline_date: baseline.baseline_date.toISOString(),
          system_architecture: baseline.system_architecture,
          niagara_version: baseline.niagara_version,
          total_devices: baseline.total_devices,
          total_points: baseline.total_points,
          resource_data: baseline.resource_data,
          device_inventory: baseline.device_inventory,
          network_topology: baseline.network_topology,
          platform_details: baseline.platform_details,
          health_score: baseline.health_score,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (error) {
      console.error('Error saving system baseline:', error);
      throw new Error(`Failed to save system baseline: ${error.message}`);
    }
  }

  /**
   * Get system baselines for a customer/site
   */
  static async getSystemBaselines(customerId?: string, siteName?: string): Promise<SystemBaseline[]> {
    try {
      let query = supabase
        .from('system_baselines')
        .select('*')
        .order('baseline_date', { ascending: false });

      if (customerId) {
        query = query.eq('customer_id', customerId);
      }

      if (siteName) {
        query = query.eq('site_name', siteName);
      }

      const { data, error } = await query;
      if (error) throw error;

      return data.map(item => ({
        ...item,
        baseline_date: new Date(item.baseline_date),
        created_at: item.created_at ? new Date(item.created_at) : undefined,
        updated_at: item.updated_at ? new Date(item.updated_at) : undefined
      }));
    } catch (error) {
      console.error('Error fetching system baselines:', error);
      return [];
    }
  }

  /**
   * Save processed export data to localStorage for session persistence
   */
  static saveSessionData(key: string, data: any): void {
    try {
      const sessionData = {
        data,
        timestamp: new Date().toISOString(),
        version: '1.0'
      };
      localStorage.setItem(`tridium_${key}`, JSON.stringify(sessionData));
    } catch (error) {
      console.error('Error saving session data:', error);
    }
  }

  /**
   * Load processed export data from localStorage
   */
  static loadSessionData(key: string): any | null {
    try {
      const stored = localStorage.getItem(`tridium_${key}`);
      if (!stored) return null;

      const sessionData = JSON.parse(stored);

      // Check if data is less than 24 hours old
      const timestamp = new Date(sessionData.timestamp);
      const now = new Date();
      const hoursDiff = (now.getTime() - timestamp.getTime()) / (1000 * 60 * 60);

      if (hoursDiff > 24) {
        localStorage.removeItem(`tridium_${key}`);
        return null;
      }

      return sessionData.data;
    } catch (error) {
      console.error('Error loading session data:', error);
      return null;
    }
  }

  /**
   * Clear all session data
   */
  static clearSessionData(): void {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('tridium_'));
      keys.forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.error('Error clearing session data:', error);
    }
  }

  /**
   * Create system baseline from processed export data
   */
  static createBaselineFromExports(
    processedData: any,
    siteName: string,
    customerId?: string
  ): SystemBaseline {
    const baseline: SystemBaseline = {
      customer_id: customerId,
      site_name: siteName,
      baseline_date: new Date(),
      system_architecture: processedData.architectureDetection?.architecture || 'single-jace',
      niagara_version: processedData.resourceData?.versions?.niagara || 'Unknown',
      total_devices: processedData.deviceCounts?.total || 0,
      total_points: processedData.resourceData?.capacities?.points?.current || 0,
      resource_data: {
        cpu_usage: processedData.resourceData?.cpu?.usage || 0,
        memory_usage: processedData.resourceData?.memory?.used || 0,
        heap_usage: processedData.resourceData?.heap?.used || 0,
        capacity_utilization: processedData.resourceData?.capacities || {},
        uptime: processedData.resourceData?.uptime || '',
        system_load: this.calculateSystemLoad(processedData.resourceData)
      },
      device_inventory: {
        bacnet_devices: {
          total: processedData.bacnetData?.devices?.length || 0,
          healthy: processedData.bacnetData?.summary?.ok || 0,
          faulty: processedData.bacnetData?.summary?.faulty || 0,
          offline: processedData.bacnetData?.summary?.unackedAlarm || 0,
          by_vendor: processedData.bacnetData?.summary?.byVendor || {},
          by_model: processedData.bacnetData?.summary?.byModel || {},
          firmware_versions: this.extractFirmwareVersions(processedData.bacnetData?.devices || [])
        },
        n2_devices: {
          total: processedData.n2Data?.devices?.length || 0,
          healthy: processedData.n2Data?.summary?.ok || 0,
          faulty: processedData.n2Data?.summary?.faulty || 0,
          offline: processedData.n2Data?.summary?.down || 0,
          by_type: processedData.n2Data?.summary?.byType || {}
        },
        health_percentage: this.calculateHealthPercentage(processedData)
      },
      network_topology: {
        architecture_type: processedData.architectureDetection?.architecture || 'single-jace',
        jace_stations: processedData.networkData?.stations || [],
        network_segments: processedData.networkData?.segments || 1,
        total_connections: processedData.networkData?.totalConnections || 0,
        healthy_connections: processedData.networkData?.healthyConnections || 0
      },
      platform_details: {
        model: processedData.platformData?.model || 'Unknown',
        product: processedData.platformData?.product || 'Unknown',
        host_id: processedData.platformData?.hostId || 'Unknown',
        architecture: processedData.platformData?.architecture || 'Unknown',
        cpu_count: processedData.platformData?.cpuCount || 1,
        ram_total: processedData.platformData?.ramTotal || 0,
        ram_free: processedData.platformData?.ramFree || 0,
        storage_free: processedData.platformData?.storageFree || 0,
        storage_total: processedData.platformData?.storageTotal || 0,
        modules_count: processedData.platformData?.modulesCount || 0,
        licenses: processedData.platformData?.licenses || [],
        certificates: processedData.platformData?.certificates || []
      },
      health_score: this.calculateOverallHealthScore(processedData)
    };

    return baseline;
  }

  private static calculateSystemLoad(resourceData: any): 'low' | 'medium' | 'high' | 'critical' {
    if (!resourceData) return 'low';

    const cpuUsage = resourceData.cpu?.usage || 0;
    const memoryPercentage = resourceData.memory ?
      (resourceData.memory.used / resourceData.memory.total) * 100 : 0;
    const pointsPercentage = resourceData.capacities?.points?.percentage || 0;

    const avgUtilization = (cpuUsage + memoryPercentage + pointsPercentage) / 3;

    if (avgUtilization >= 90) return 'critical';
    if (avgUtilization >= 75) return 'high';
    if (avgUtilization >= 50) return 'medium';
    return 'low';
  }

  private static extractFirmwareVersions(devices: any[]): Record<string, number> {
    const versions: Record<string, number> = {};
    devices.forEach(device => {
      if (device.firmwareRev) {
        versions[device.firmwareRev] = (versions[device.firmwareRev] || 0) + 1;
      }
    });
    return versions;
  }

  private static calculateHealthPercentage(processedData: any): number {
    const bacnetHealth = processedData.bacnetData?.summary?.healthyPercentage || 100;
    const n2Healthy = processedData.n2Data?.summary?.ok || 0;
    const n2Total = processedData.n2Data?.summary?.total || 1;
    const n2Health = (n2Healthy / n2Total) * 100;

    return (bacnetHealth + n2Health) / 2;
  }

  private static calculateOverallHealthScore(processedData: any): number {
    const deviceHealth = this.calculateHealthPercentage(processedData);
    const resourceHealth = this.calculateResourceHealth(processedData.resourceData);
    const networkHealth = this.calculateNetworkHealth(processedData.networkData);

    return Math.round((deviceHealth * 0.5 + resourceHealth * 0.3 + networkHealth * 0.2));
  }

  private static calculateResourceHealth(resourceData: any): number {
    if (!resourceData) return 100;

    const cpuHealth = Math.max(0, 100 - (resourceData.cpu?.usage || 0));
    const memoryHealth = resourceData.memory ?
      Math.max(0, 100 - ((resourceData.memory.used / resourceData.memory.total) * 100)) : 100;
    const capacityHealth = resourceData.capacities?.points?.percentage ?
      Math.max(0, 100 - resourceData.capacities.points.percentage) : 100;

    return (cpuHealth + memoryHealth + capacityHealth) / 3;
  }

  private static calculateNetworkHealth(networkData: any): number {
    if (!networkData) return 100;

    const connectionHealth = networkData.totalConnections > 0 ?
      (networkData.healthyConnections / networkData.totalConnections) * 100 : 100;

    return connectionHealth;
  }

  /**
   * Save selected analysis data fields to database for future review
   */
  static async saveAnalysisData(analysisData: {
    fields: string[];
    mappings: Record<string, string>;
    analysisData: any;
    timestamp: Date;
    sessionId: string;
    customerId: string;
    siteName: string;
  }): Promise<string> {
    try {
      // Extract the actual field values from the analysis data
      const extractedData: Record<string, any> = {};

      analysisData.fields.forEach(fieldKey => {
        const customName = analysisData.mappings[fieldKey] || fieldKey;
        const fieldValue = this.extractFieldValue(analysisData.analysisData, fieldKey);
        extractedData[customName] = fieldValue;
      });

      // Save to a generic analysis_data table or create a structured storage
      const dataToSave = {
        session_id: analysisData.sessionId,
        customer_id: analysisData.customerId,
        site_name: analysisData.siteName,
        analysis_timestamp: analysisData.timestamp.toISOString(),
        selected_fields: analysisData.fields,
        custom_mappings: analysisData.mappings,
        extracted_values: extractedData,
        raw_analysis_data: analysisData.analysisData,
        created_at: new Date().toISOString()
      };

      // For now, store in localStorage since we don't have the analysis_data table yet
      // In a real implementation, this would go to Supabase
      const storageKey = `analysis_${analysisData.sessionId}_${Date.now()}`;
      this.saveSessionData(storageKey, dataToSave);

      console.log('Analysis data saved to localStorage with key:', storageKey);
      return storageKey;

    } catch (error) {
      console.error('Error saving analysis data:', error);
      throw new Error(`Failed to save analysis data: ${error}`);
    }
  }

  /**
   * Extract field value from nested analysis data using dot notation
   */
  private static extractFieldValue(data: any, fieldKey: string): any {
    const keys = fieldKey.split('.');
    let value = data;

    for (const key of keys) {
      if (value && typeof value === 'object') {
        // Handle array indices like 'alerts.0'
        if (!isNaN(parseInt(key))) {
          const index = parseInt(key);
          value = Array.isArray(value) ? value[index] : undefined;
        } else {
          value = value[key];
        }
      } else {
        return undefined;
      }
    }

    return value;
  }

  /**
   * Retrieve saved analysis data for a customer/session
   */
  static async getAnalysisData(customerId?: string, sessionId?: string): Promise<any[]> {
    try {
      const savedAnalysis: any[] = [];
      const keys = Object.keys(localStorage).filter(key => key.startsWith('tridium_analysis_'));

      keys.forEach(key => {
        try {
          const data = this.loadSessionData(key.replace('tridium_', ''));
          if (data && data.data) {
            const analysisItem = data.data;

            // Filter by customer or session if specified
            if (customerId && analysisItem.customer_id !== customerId) return;
            if (sessionId && analysisItem.session_id !== sessionId) return;

            savedAnalysis.push({
              ...analysisItem,
              analysis_timestamp: new Date(analysisItem.analysis_timestamp),
              created_at: new Date(analysisItem.created_at)
            });
          }
        } catch (error) {
          console.warn('Error loading analysis data from key:', key, error);
        }
      });

      return savedAnalysis.sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

    } catch (error) {
      console.error('Error retrieving analysis data:', error);
      return [];
    }
  }
}