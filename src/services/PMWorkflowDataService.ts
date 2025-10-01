import { supabase } from '@/integrations/supabase/client';
import type {
  PMWorkflowSession,
  PMWorkflowData,
  SiteIntelligenceData,
  SystemDiscoveryData,
  ContactInfo,
  AccessInfo,
  SafetyInfo,
  ProjectHandoffInfo,
  PhotoData
} from '@/types/pmWorkflow';

export interface SessionCreateData {
  customerName: string;
  serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  technicianName: string;
  technicianId: string;
  customerId?: string;
}

export interface SessionUpdateData {
  currentPhase?: 1 | 2 | 3 | 4;
  status?: 'Draft' | 'In Progress' | 'Completed' | 'Cancelled';
  lastSaved?: Date;
  completionTime?: Date;
  totalDurationMinutes?: number;
}

export class PMWorkflowDataService {

  // ===================================================================
  // SESSION MANAGEMENT
  // ===================================================================

  /**
   * Create a new PM workflow session
   */
  static async createSession(data: SessionCreateData): Promise<string> {
    try {
      const sessionData = {
        customer_name: data.customerName,
        service_tier: data.serviceTier,
        technician_name: data.technicianName,
        technician_id: data.technicianId,
        customer_id: data.customerId,
        current_phase: 1,
        status: 'Draft',
        start_time: new Date().toISOString(),
        last_saved: new Date().toISOString()
      };

      const { data: session, error } = await supabase
        .from('pm_workflow_sessions')
        .insert([sessionData])
        .select('id')
        .single();

      if (error) throw error;
      return session.id;
    } catch (error) {
      console.error('Error creating PM session:', error);
      throw new Error(`Failed to create PM session: ${error.message}`);
    }
  }

  /**
   * Update session metadata
   */
  static async updateSession(sessionId: string, updates: SessionUpdateData): Promise<void> {
    try {
      const updateData: any = {
        last_saved: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (updates.currentPhase) updateData.current_phase = updates.currentPhase;
      if (updates.status) updateData.status = updates.status;
      if (updates.completionTime) updateData.completion_time = updates.completionTime.toISOString();
      if (updates.totalDurationMinutes) updateData.total_duration_minutes = updates.totalDurationMinutes;

      const { error } = await supabase
        .from('pm_workflow_sessions')
        .update(updateData)
        .eq('id', sessionId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating PM session:', error);
      throw new Error(`Failed to update PM session: ${error.message}`);
    }
  }

  /**
   * Get session with all related data
   */
  static async getSession(sessionId: string): Promise<PMWorkflowData | null> {
    try {
      // Get session data
      const { data: session, error: sessionError } = await supabase
        .from('pm_workflow_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      if (!session) return null;

      // Get all related data in parallel
      const [
        customerData,
        contactsData,
        accessData,
        safetyData,
        handoffData,
        bmsData,
        inventoryData,
        photosData,
        baselineData
      ] = await Promise.all([
        this.getCustomerData(session.customer_id),
        this.getContacts(sessionId),
        this.getAccessInfo(sessionId),
        this.getSafetyInfo(sessionId),
        this.getHandoffInfo(sessionId),
        this.getBMSSystemInfo(sessionId),
        this.getManualInventory(sessionId),
        this.getPhotos(sessionId),
        this.getSystemBaseline(sessionId)
      ]);

      // Construct complete workflow data
      const workflowData: PMWorkflowData = {
        session: {
          id: session.id,
          customerId: session.customer_id,
          customerName: session.customer_name,
          serviceTier: session.service_tier,
          currentPhase: session.current_phase,
          startTime: new Date(session.start_time),
          lastSaved: new Date(session.last_saved),
          status: session.status,
          technicianName: session.technician_name,
          technicianId: session.technician_id
        },
        phase1: {
          customer: customerData || {
            companyName: session.customer_name,
            siteName: '',
            address: '',
            serviceTier: session.service_tier,
            contractNumber: '',
            accountManager: ''
          },
          contacts: contactsData,
          access: accessData || {} as AccessInfo,
          safety: safetyData || {} as SafetyInfo,
          projectHandoff: handoffData || {} as ProjectHandoffInfo
        },
        phase2: {
          bmsSystem: bmsData || {} as any,
          tridiumExports: {} as any,
          manualInventory: inventoryData || {} as any,
          photos: photosData,
          systemBaseline: baselineData
        },
        phase3: {} as any, // TODO: Implement Phase 3 data
        phase4: {} as any  // TODO: Implement Phase 4 data
      };

      return workflowData;
    } catch (error) {
      console.error('Error getting PM session:', error);
      return null;
    }
  }

  // ===================================================================
  // PHASE 1: SITE INTELLIGENCE DATA
  // ===================================================================

  /**
   * Save customer data (enhanced)
   */
  static async saveCustomerData(sessionId: string, customerData: SiteIntelligenceData['customer']): Promise<void> {
    try {
      // First try to update existing customer
      const { data: existingCustomer } = await supabase
        .from('customers')
        .select('id')
        .eq('company_name', customerData.companyName)
        .eq('site_name', customerData.siteName)
        .single();

      const customerRecord = {
        company_name: customerData.companyName,
        site_name: customerData.siteName,
        address: customerData.address,
        service_tier: customerData.serviceTier,
        contract_number: customerData.contractNumber,
        account_manager: customerData.accountManager,
        bas_platform: customerData.basPlatform,
        system_architecture: customerData.systemArchitecture,
        primary_technician_id: customerData.primaryTechnicianId,
        primary_technician_name: customerData.primaryTechnicianName,
        primary_technician_email: customerData.primaryTechnicianEmail,
        primary_technician_phone: customerData.primaryTechnicianPhone,
        secondary_technician_id: customerData.secondaryTechnicianId,
        secondary_technician_name: customerData.secondaryTechnicianName,
        secondary_technician_email: customerData.secondaryTechnicianEmail,
        secondary_technician_phone: customerData.secondaryTechnicianPhone,
        drive_folder_id: customerData.driveFolderId,
        drive_folder_url: customerData.driveFolderUrl,
        simpro_customer_id: customerData.simproCustomerId,
        updated_at: new Date().toISOString()
      };

      let customerId: string;

      if (existingCustomer) {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update(customerRecord)
          .eq('id', existingCustomer.id);
        if (error) throw error;
        customerId = existingCustomer.id;
      } else {
        // Create new customer
        const { data: newCustomer, error } = await supabase
          .from('customers')
          .insert([{ ...customerRecord, created_by: (await supabase.auth.getUser()).data.user?.id }])
          .select('id')
          .single();
        if (error) throw error;
        customerId = newCustomer.id;
      }

      // Update session with customer ID
      await this.updateSession(sessionId, {});
      await supabase
        .from('pm_workflow_sessions')
        .update({ customer_id: customerId })
        .eq('id', sessionId);

    } catch (error) {
      console.error('Error saving customer data:', error);
      throw new Error(`Failed to save customer data: ${error.message}`);
    }
  }

  /**
   * Save site contacts
   */
  static async saveContacts(sessionId: string, contacts: ContactInfo[]): Promise<void> {
    try {
      // Delete existing contacts
      await supabase
        .from('site_contacts')
        .delete()
        .eq('session_id', sessionId);

      // Insert new contacts
      if (contacts.length > 0) {
        const contactRecords = contacts.map(contact => ({
          session_id: sessionId,
          name: contact.name,
          phone: contact.phone,
          email: contact.email,
          role: contact.role,
          is_primary: contact.isPrimary,
          is_emergency: contact.isEmergency
        }));

        const { error } = await supabase
          .from('site_contacts')
          .insert(contactRecords);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving contacts:', error);
      throw new Error(`Failed to save contacts: ${error.message}`);
    }
  }

  /**
   * Save site access information
   */
  static async saveAccessInfo(sessionId: string, accessInfo: AccessInfo): Promise<void> {
    try {
      const accessRecord = {
        session_id: sessionId,
        access_method: accessInfo.method,
        parking_instructions: accessInfo.parkingInstructions,
        badge_required: accessInfo.badgeRequired,
        escort_required: accessInfo.escortRequired,
        best_arrival_time: accessInfo.bestArrivalTime,
        special_instructions: accessInfo.specialInstructions,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('site_access')
        .upsert([accessRecord], {
          onConflict: 'session_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving access info:', error);
      throw new Error(`Failed to save access info: ${error.message}`);
    }
  }

  /**
   * Save safety information
   */
  static async saveSafetyInfo(sessionId: string, safetyInfo: SafetyInfo): Promise<void> {
    try {
      const safetyRecord = {
        session_id: sessionId,
        required_ppe: safetyInfo.requiredPPE,
        known_hazards: safetyInfo.knownHazards,
        safety_contact: safetyInfo.safetyContact,
        safety_phone: safetyInfo.safetyPhone,
        special_notes: safetyInfo.specialNotes,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('site_safety')
        .upsert([safetyRecord], {
          onConflict: 'session_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving safety info:', error);
      throw new Error(`Failed to save safety info: ${error.message}`);
    }
  }

  /**
   * Save project handoff information
   */
  static async saveHandoffInfo(sessionId: string, handoffInfo: ProjectHandoffInfo): Promise<void> {
    try {
      const handoffRecord = {
        session_id: sessionId,
        has_submittals: handoffInfo.hasSubmittals,
        submittal_location: handoffInfo.submittalLocation,
        has_as_builts: handoffInfo.hasAsBuilts,
        as_built_location: handoffInfo.asBuiltLocation,
        has_floor_plans: handoffInfo.hasFloorPlans,
        floor_plan_location: handoffInfo.floorPlanLocation,
        has_soo: handoffInfo.hasSOO,
        soo_location: handoffInfo.sooLocation,
        completeness_score: handoffInfo.completenessScore,
        notes: handoffInfo.notes,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('project_handoff')
        .upsert([handoffRecord], {
          onConflict: 'session_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving handoff info:', error);
      throw new Error(`Failed to save handoff info: ${error.message}`);
    }
  }

  // ===================================================================
  // PHASE 2: SYSTEM DISCOVERY DATA
  // ===================================================================

  /**
   * Save BMS system information
   */
  static async saveBMSSystemInfo(sessionId: string, bmsInfo: any): Promise<void> {
    try {
      const bmsRecord = {
        session_id: sessionId,
        platform: bmsInfo.platform,
        software_version: bmsInfo.softwareVersion,
        supervisor_location: bmsInfo.supervisorLocation,
        supervisor_ip: bmsInfo.supervisorIP,
        system_architecture: bmsInfo.systemArchitecture,
        credentials_location: bmsInfo.credentialsLocation,
        notes: bmsInfo.notes,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('bms_systems')
        .upsert([bmsRecord], {
          onConflict: 'session_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving BMS system info:', error);
      throw new Error(`Failed to save BMS system info: ${error.message}`);
    }
  }

  /**
   * Save manual inventory data
   */
  static async saveManualInventory(sessionId: string, inventoryData: any): Promise<void> {
    try {
      const inventoryRecord = {
        session_id: sessionId,
        device_count: inventoryData.deviceCount || 0,
        controller_count: inventoryData.controllerCount || 0,
        major_equipment: inventoryData.majorEquipment || [],
        network_segments: inventoryData.networkSegments || [],
        notes: inventoryData.notes || '',
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('manual_inventory')
        .upsert([inventoryRecord], {
          onConflict: 'session_id'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error saving manual inventory:', error);
      throw new Error(`Failed to save manual inventory: ${error.message}`);
    }
  }

  /**
   * Save system photos
   */
  static async savePhotos(sessionId: string, photos: PhotoData[]): Promise<void> {
    try {
      // Delete existing photos for this session
      await supabase
        .from('system_photos')
        .delete()
        .eq('session_id', sessionId);

      // Insert new photos
      if (photos.length > 0) {
        const photoRecords = photos.map(photo => ({
          session_id: sessionId,
          filename: photo.filename,
          description: photo.description,
          alt_text: (photo as any).altText || '',
          category: photo.category,
          timestamp: photo.timestamp.toISOString(),
          // Note: file_path, file_size, mime_type would be set during actual file upload
        }));

        const { error } = await supabase
          .from('system_photos')
          .insert(photoRecords);

        if (error) throw error;
      }
    } catch (error) {
      console.error('Error saving photos:', error);
      throw new Error(`Failed to save photos: ${error.message}`);
    }
  }

  /**
   * Save system baseline from processed Tridium data
   */
  static async saveSystemBaseline(sessionId: string, baselineData: any): Promise<string> {
    try {
      const { data: session } = await supabase
        .from('pm_workflow_sessions')
        .select('customer_id, customer_name')
        .eq('id', sessionId)
        .single();

      const baselineRecord = {
        session_id: sessionId,
        customer_id: session?.customer_id,
        site_name: session?.customer_name || 'Unknown Site',
        baseline_date: new Date().toISOString(),
        system_architecture: baselineData.architectureDetection?.architecture || 'single-jace',
        niagara_version: baselineData.resourceData?.versions?.niagara || 'Unknown',
        total_devices: baselineData.deviceCounts?.total || 0,
        total_points: baselineData.resourceData?.capacities?.points?.current || 0,
        health_score: baselineData.healthScore || 100,
        resource_data: baselineData.resourceData || {},
        device_inventory: {
          bacnet_devices: baselineData.bacnetData?.summary || {},
          n2_devices: baselineData.n2Data?.summary || {},
          health_percentage: baselineData.healthPercentage || 100
        },
        network_topology: {
          architecture_type: baselineData.architectureDetection?.architecture || 'single-jace',
          jace_stations: baselineData.networkData?.stations || [],
          network_segments: baselineData.networkData?.segments || 1,
          total_connections: baselineData.networkData?.totalConnections || 0,
          healthy_connections: baselineData.networkData?.healthyConnections || 0
        },
        platform_details: baselineData.platformData || {}
      };

      const { data: baseline, error } = await supabase
        .from('system_baselines')
        .insert([baselineRecord])
        .select('id')
        .single();

      if (error) throw error;

      // Save detailed device data
      if (baselineData.bacnetData?.devices) {
        await this.saveBACnetDevices(baseline.id, baselineData.bacnetData.devices);
      }

      if (baselineData.n2Data?.devices) {
        await this.saveN2Devices(baseline.id, baselineData.n2Data.devices);
      }

      if (baselineData.networkData?.stations) {
        await this.saveNetworkStations(baseline.id, baselineData.networkData.stations);
      }

      return baseline.id;
    } catch (error) {
      console.error('Error saving system baseline:', error);
      throw new Error(`Failed to save system baseline: ${error.message}`);
    }
  }

  // ===================================================================
  // DETAILED DEVICE DATA STORAGE
  // ===================================================================

  private static async saveBACnetDevices(baselineId: string, devices: any[]): Promise<void> {
    const deviceRecords = devices.map(device => ({
      baseline_id: baselineId,
      device_name: device.name,
      device_id: device.id,
      status: Array.isArray(device.status) ? device.status : [device.status],
      vendor: device.vendor,
      model: device.model,
      firmware_revision: device.firmwareRev,
      health: device.health,
      health_timestamp: device.healthTimestamp ? new Date(device.healthTimestamp).toISOString() : null,
      network_id: device.networkId,
      mac_address: device.macAddress,
      max_apdu: device.maxAPDU,
      enabled: device.enabled,
      cov_enabled: device.covEnabled,
      protocol_revision: device.protocolRev,
      app_sw_version: device.appSwVersion,
      encoding: device.encoding,
      segmentation: device.segmentation
    }));

    const { error } = await supabase
      .from('bacnet_devices')
      .insert(deviceRecords);

    if (error) throw error;
  }

  private static async saveN2Devices(baselineId: string, devices: any[]): Promise<void> {
    const deviceRecords = devices.map(device => ({
      baseline_id: baselineId,
      device_name: device.name,
      address: device.address,
      status: Array.isArray(device.status) ? device.status : [device.status],
      controller_type: device.type,
      raw_type: device.raw_type
    }));

    const { error } = await supabase
      .from('n2_devices')
      .insert(deviceRecords);

    if (error) throw error;
  }

  private static async saveNetworkStations(baselineId: string, stations: any[]): Promise<void> {
    const stationRecords = stations.map(station => ({
      baseline_id: baselineId,
      station_name: station.name,
      ip_address: station.ipAddress,
      fox_port: station.foxPort,
      host_model: station.model,
      version: station.version,
      status: station.status,
      connection_status: station.connectionStatus,
      platform_status: station.platformStatus,
      credentials_store: station.credentialsStore,
      secure_platform: station.securePlatform,
      platform_port: station.platformPort
    }));

    const { error } = await supabase
      .from('network_stations')
      .insert(stationRecords);

    if (error) throw error;
  }

  // ===================================================================
  // DATA RETRIEVAL METHODS
  // ===================================================================

  private static async getCustomerData(customerId: string): Promise<any> {
    if (!customerId) return null;

    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', customerId)
      .single();

    if (error) return null;
    return data;
  }

  private static async getContacts(sessionId: string): Promise<ContactInfo[]> {
    const { data, error } = await supabase
      .from('site_contacts')
      .select('*')
      .eq('session_id', sessionId);

    if (error) return [];

    return data.map(contact => ({
      id: contact.id,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      role: contact.role,
      isPrimary: contact.is_primary,
      isEmergency: contact.is_emergency
    }));
  }

  private static async getAccessInfo(sessionId: string): Promise<AccessInfo | null> {
    const { data, error } = await supabase
      .from('site_access')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) return null;

    return {
      method: data.access_method,
      parkingInstructions: data.parking_instructions,
      badgeRequired: data.badge_required,
      escortRequired: data.escort_required,
      bestArrivalTime: data.best_arrival_time,
      specialInstructions: data.special_instructions
    };
  }

  private static async getSafetyInfo(sessionId: string): Promise<SafetyInfo | null> {
    const { data, error } = await supabase
      .from('site_safety')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) return null;

    return {
      requiredPPE: data.required_ppe || [],
      knownHazards: data.known_hazards || [],
      safetyContact: data.safety_contact,
      safetyPhone: data.safety_phone,
      specialNotes: data.special_notes
    };
  }

  private static async getHandoffInfo(sessionId: string): Promise<ProjectHandoffInfo | null> {
    const { data, error } = await supabase
      .from('project_handoff')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) return null;

    return {
      hasSubmittals: data.has_submittals,
      submittalLocation: data.submittal_location,
      hasAsBuilts: data.has_as_builts,
      asBuiltLocation: data.as_built_location,
      hasFloorPlans: data.has_floor_plans,
      floorPlanLocation: data.floor_plan_location,
      hasSOO: data.has_soo,
      sooLocation: data.soo_location,
      completenessScore: data.completeness_score,
      notes: data.notes
    };
  }

  private static async getBMSSystemInfo(sessionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('bms_systems')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) return null;
    return data;
  }

  private static async getManualInventory(sessionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('manual_inventory')
      .select('*')
      .eq('session_id', sessionId)
      .single();

    if (error) return null;
    return data;
  }

  private static async getPhotos(sessionId: string): Promise<PhotoData[]> {
    const { data, error } = await supabase
      .from('system_photos')
      .select('*')
      .eq('session_id', sessionId);

    if (error) return [];

    return data.map(photo => ({
      id: photo.id,
      filename: photo.filename,
      description: photo.description,
      category: photo.category as any,
      timestamp: new Date(photo.timestamp)
    }));
  }

  private static async getSystemBaseline(sessionId: string): Promise<any> {
    const { data, error } = await supabase
      .from('system_baselines')
      .select('*')
      .eq('session_id', sessionId)
      .order('baseline_date', { ascending: false })
      .limit(1)
      .single();

    if (error) return null;
    return data;
  }

  // ===================================================================
  // UTILITY METHODS
  // ===================================================================

  /**
   * Get all sessions for a technician
   */
  static async getTechnicianSessions(technicianId: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('pm_workflow_sessions')
      .select(`
        *,
        customers(company_name, site_name, address),
        system_baselines(health_score, baseline_date)
      `)
      .eq('technician_id', technicianId)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error getting technician sessions:', error);
      return [];
    }

    return data || [];
  }

  /**
   * Search sessions by customer name or site
   */
  static async searchSessions(searchTerm: string): Promise<any[]> {
    const { data, error } = await supabase
      .from('pm_workflow_sessions')
      .select(`
        *,
        customers(company_name, site_name, address)
      `)
      .or(`customer_name.ilike.%${searchTerm}%,customers.company_name.ilike.%${searchTerm}%,customers.site_name.ilike.%${searchTerm}%`)
      .order('start_time', { ascending: false });

    if (error) {
      console.error('Error searching sessions:', error);
      return [];
    }

    return data || [];
  }
}