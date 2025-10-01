import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { isValidUUID } from '@/utils/uuid';

export type SystemType = 'supervisor' | 'engine';
export type DriverType = 'bacnet' | 'n2' | 'modbus' | 'lon' | 'custom';

export interface EnsureRunParams {
  sessionId?: string;
  customerId?: string;
  siteName?: string;
  systemType: SystemType;
}

export interface NiagaraNetworkNode {
  name?: string;
  address?: string; // may contain IP
  ip?: string;
  type?: string;
  hostModel?: string;
  foxPort?: number | string;
  version?: string;
  [k: string]: any;
}

export class DiscoveryRunService {
  private static unavailable = false;

  static isUnavailable(): boolean { return this.unavailable; }

  static async tryEnsureRunOrNull(params: EnsureRunParams): Promise<string | null> {
    if (this.unavailable) return null;
    try {
      // If sessionId is provided but not a valid UUID, skip DB entirely (local-only mode)
      if (params.sessionId && !isValidUUID(params.sessionId)) {
        return null;
      }
      return await this.ensureRun(params);
    } catch (e: any) {
      if (this.isMissingTableError(e)) {
        this.unavailable = true;
        return null;
      }
      throw e;
    }
  }

  private static isMissingTableError(e: any): boolean {
    const msg = String(e?.message || e);
    return msg.includes("Could not find the table 'public.discovery_runs'") || msg.includes('PGRST205');
  }

  // Create or find a discovery run linked to a session
  static async ensureRun(params: EnsureRunParams): Promise<string> {
    const { sessionId, customerId, siteName, systemType } = params;

    try {
      if (sessionId && isValidUUID(sessionId)) {
        const { data: existing, error: exErr } = await supabase
          .from('discovery_runs')
          .select('id')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!exErr && existing?.id) return existing.id as string;
      }

      const { data, error } = await supabase
        .from('discovery_runs')
        .insert({
          session_id: isValidUUID(sessionId || '') ? sessionId : null,
          customer_id: customerId || null,
          site_name: siteName || null,
          system_type: systemType
        })
        .select('id')
        .single();
      if (error) throw error;
      return data.id as string;
    } catch (e) {
      logger.error('ensureRun failed', e);
      if (this.isMissingTableError(e)) {
        this.unavailable = true;
      }
      throw new Error(e instanceof Error ? e.message : 'Failed to ensure discovery run');
    }
  }

  // Upsert supervisor platform/resources/network JSON blobs
  static async upsertSupervisor(discoveryRunId: string, patch: { identity?: any; resources?: any; network?: any }): Promise<void> {
    try {
      // Try update existing
      const { data: existing, error: selErr } = await supabase
        .from('supervisors')
        .select('id')
        .eq('discovery_run_id', discoveryRunId)
        .maybeSingle();

      if (!selErr && existing?.id) {
        const { error: updErr } = await supabase
          .from('supervisors')
          .update({
            identity: patch.identity !== undefined ? patch.identity : undefined,
            resources: patch.resources !== undefined ? patch.resources : undefined,
            network: patch.network !== undefined ? patch.network : undefined,
            updated_at: new Date().toISOString()
          })
          .eq('id', existing.id);
        if (updErr) throw updErr;
        return;
      }

      const { error: insErr } = await supabase
        .from('supervisors')
        .insert({
          discovery_run_id: discoveryRunId,
          identity: patch.identity || null,
          resources: patch.resources || null,
          network: patch.network || null
        });
      if (insErr) throw insErr;
    } catch (e) {
      logger.error('upsertSupervisor failed', e);
    }
  }

  // Create or update JACEs from Niagara Network export nodes
  static async upsertJacesFromNetwork(discoveryRunId: string, nodes: NiagaraNetworkNode[]): Promise<void> {
    try {
      for (const node of nodes) {
        const name = (node.name || '').toString();
        if (!name) continue;
        const address = (node.address || node.ip || '').toString();
        const hostModel = (node.hostModel || '').toString();
        const niagaraVersion = (node.version || '').toString();
        const foxPort = Number(node.foxPort || 1911);

        // Try existing by (run,name)
        const { data: existing, error: selErr } = await supabase
          .from('jaces')
          .select('id')
          .eq('discovery_run_id', discoveryRunId)
          .eq('name', name)
          .maybeSingle();

        if (!selErr && existing?.id) {
          const { error: updErr } = await supabase
            .from('jaces')
            .update({ address, fox_port: isNaN(foxPort) ? null : foxPort, host_model: hostModel, niagara_version: niagaraVersion, network_info: node, updated_at: new Date().toISOString() })
            .eq('id', existing.id);
          if (updErr) throw updErr;
        } else {
          const { error: insErr } = await supabase
            .from('jaces')
            .insert({ discovery_run_id: discoveryRunId, name, address, fox_port: isNaN(foxPort) ? null : foxPort, host_model: hostModel, niagara_version: niagaraVersion, network_info: node });
          if (insErr) throw insErr;
        }
      }
    } catch (e) {
      logger.error('upsertJacesFromNetwork failed', e);
    }
  }

  static async upsertJacePlatform(discoveryRunId: string, jaceName: string, platform: any): Promise<void> {
    try {
      const jaceId = await this.ensureJace(discoveryRunId, jaceName);
      const { error } = await supabase
        .from('jaces')
        .update({ platform, updated_at: new Date().toISOString() })
        .eq('id', jaceId);
      if (error) throw error;
    } catch (e) {
      logger.error('upsertJacePlatform failed', e);
    }
  }

  static async upsertJaceResources(discoveryRunId: string, jaceName: string, resources: any): Promise<void> {
    try {
      const jaceId = await this.ensureJace(discoveryRunId, jaceName);
      const { error } = await supabase
        .from('jaces')
        .update({ resources, updated_at: new Date().toISOString() })
        .eq('id', jaceId);
      if (error) throw error;
    } catch (e) {
      logger.error('upsertJaceResources failed', e);
    }
  }

  static async upsertDriverAndDevices(discoveryRunId: string, jaceName: string, type: DriverType, parsed: any): Promise<void> {
    try {
      const jaceId = await this.ensureJace(discoveryRunId, jaceName);

      // Upsert driver
      const { data: drv, error: drvSelErr } = await supabase
        .from('drivers')
        .select('id')
        .eq('jace_id', jaceId)
        .eq('type', type)
        .maybeSingle();

      let driverId: string;
      if (!drvSelErr && drv?.id) {
        driverId = drv.id as string;
        const { error: updErr } = await supabase
          .from('drivers')
          .update({ summary: parsed?.summary || parsed?.analysis || parsed || null, updated_at: new Date().toISOString() })
          .eq('id', driverId);
        if (updErr) throw updErr;
      } else {
        const { data: inserted, error: insErr } = await supabase
          .from('drivers')
          .insert({ jace_id: jaceId, type, summary: parsed?.summary || parsed?.analysis || parsed || null })
          .select('id')
          .single();
        if (insErr) throw insErr;
        driverId = inserted.id as string;
      }

      // Replace devices for this driver
      await supabase.from('devices').delete().eq('driver_id', driverId);

      const devices = (parsed?.devices || []) as any[];
      if (Array.isArray(devices) && devices.length > 0) {
        const rows = devices.slice(0, 10000).map(d => ({
          driver_id: driverId,
          name: d.name || d.deviceName || null,
          device_id: String(d.id ?? d.deviceId ?? ''),
          vendor: d.vendor || null,
          status: Array.isArray(d.status) ? d.status.join(',') : (d.status || null),
          network_no: Number(d.networkId ?? d.network_no ?? null),
          mac_addr: String(d.macAddress ?? d.mac_addr ?? ''),
          ip_addr: d.ip || d.ip_addr || null,
          firmware: d.firmwareRev || d.firmware || null,
          caps: d.caps || null,
          raw: d
        }));
        const { error: devInsErr } = await supabase.from('devices').insert(rows, { defaultToNull: true });
        if (devInsErr) throw devInsErr;
      }
    } catch (e) {
      logger.error('upsertDriverAndDevices failed', e);
    }
  }

  // Fetch full run tree
  static async getRun(discoveryRunId: string): Promise<any> {
    const [runs, supers, jaces, drivers, devices] = await Promise.all([
      supabase.from('discovery_runs').select('*').eq('id', discoveryRunId).single(),
      supabase.from('supervisors').select('*').eq('discovery_run_id', discoveryRunId),
      supabase.from('jaces').select('*').eq('discovery_run_id', discoveryRunId),
      supabase.from('drivers').select('*').in('jace_id', (await supabase.from('jaces').select('id').eq('discovery_run_id', discoveryRunId)).data?.map((r: any) => r.id) || []),
      supabase.from('devices').select('*')
    ]);

    const supervisor = Array.isArray(supers.data) ? supers.data[0] : null;
    const jaceMap: Record<string, any> = {};

    (jaces.data || []).forEach((j: any) => { jaceMap[j.id] = j; jaceMap[j.id].drivers = {}; });
    (drivers.data || []).forEach((d: any) => { const j = jaceMap[d.jace_id]; if (j) { if (!j.drivers[d.type]) j.drivers[d.type] = { summary: d.summary, devices: [] }; else j.drivers[d.type].summary = d.summary; j.drivers[d.type]._driver_id = d.id; } });
    (devices.data || []).forEach((dev: any) => {
      const driver = Object.values(jaceMap).flatMap((j: any) => Object.entries(j.drivers).map(([t, v]: any) => ({ j, t, v }))).find(x => x.v._driver_id === dev.driver_id);
      if (driver) { driver.v.devices = driver.v.devices || []; driver.v.devices.push(dev.raw || dev); }
    });

    return {
      run: runs.data,
      supervisor,
      jaces: Object.values(jaceMap)
    };
  }

  private static async ensureJace(discoveryRunId: string, jaceName: string): Promise<string> {
    const name = jaceName;
    const { data: existing, error: selErr } = await supabase
      .from('jaces')
      .select('id')
      .eq('discovery_run_id', discoveryRunId)
      .eq('name', name)
      .maybeSingle();
    if (!selErr && existing?.id) return existing.id as string;
    const { data: ins, error: insErr } = await supabase
      .from('jaces')
      .insert({ discovery_run_id: discoveryRunId, name })
      .select('id')
      .single();
    if (insErr) throw insErr;
    return ins.id as string;
  }
}
