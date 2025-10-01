import type { PlatformParsedData, ResourceParsedData, NiagaraNetworkParsedData, BACnetParsedData, N2ParsedData } from '@/services/TridiumExportProcessor';

export class TridiumParsedNormalizer {
  static normalizeByType(data: any, type: string): any {
    switch (type) {
      case 'platform':
        return this.normalizePlatform(data);
      case 'resource':
      case 'resources':
        return this.normalizeResources(data);
      case 'network':
      case 'niagara_network':
        return this.normalizeNiagaraNetwork(data);
      case 'bacnet':
        return this.normalizeBACnet(data);
      case 'n2':
        return this.normalizeN2(data);
      default:
        return data;
    }
  }

  static normalizePlatform(input: any): PlatformParsedData {
    // If already in canonical PlatformParsedData shape, return as-is
    if (input?.summary && (Array.isArray(input.modules) || input.modules)) return input as PlatformParsedData;

    const norm = input?.metadata?.normalizedData || input?.normalizedData || input;
    const identity = norm?.platform_identity || {};
    const system = norm?.system || {};
    const memory = norm?.memory || {};
    const storage = norm?.storage || {};

    const toKB = (gb?: number) => (typeof gb === 'number' ? Math.round(gb * 1024 * 1024) : 0);

    const filesystems = Array.isArray(storage.disks)
      ? storage.disks.map((d: any) => ({
          path: d.path,
          free: toKB(d.free_gb),
          total: toKB(d.total_gb),
          files: d.files ?? 0,
          maxFiles: d.max_files ?? 0,
        }))
      : [];

    const modules = Array.isArray(norm?.modules)
      ? norm.modules.map((m: any) => ({ name: m.name, vendor: m.vendor, version: m.version, profiles: [] }))
      : [];

    const licenses = Array.isArray(norm?.licenses)
      ? norm.licenses.map((l: any) => ({ name: l.name, vendor: l.vendor, version: l.version, expires: l.expires }))
      : [];

    const applications = Array.isArray(norm?.applications)
      ? norm.applications.map((a: any) => ({
          name: a.name,
          status: a.status,
          autostart: !!a.autostart,
          autorestart: !!a.autorestart,
          ports: {},
        }))
      : [];

    const summary: PlatformParsedData['summary'] = {
      daemonVersion: system.niagara_version || '',
      model: identity.model || 'Unknown',
      product: identity.product || 'Unknown',
      hostId: identity.host_id || '',
      hostIdStatus: '',
      architecture: system.architecture || '',
      cpuCount: system.cpu_count || 0,
      ramFree: toKB(memory.free_ram_gb),
      ramTotal: toKB(memory.total_ram_gb),
      os: system.os_name || '',
      java: system.jvm_version || '',
      httpsPort: 0,
      foxPort: 0,
      niagaraRuntime: system.runtime || '',
      systemHome: '',
      userHome: '',
      enabledProfiles: system.enabled_profiles || [],
      platformTlsSupport: (norm?.security?.tls_support || '') as string,
      tlsProtocol: (norm?.security?.protocol || '') as string,
      certificate: norm?.security?.active_certificate || '',
    };

    return {
      summary,
      modules,
      licenses,
      certificates: Array.isArray(norm?.certificates)
        ? norm.certificates.map((c: any) => ({ name: c.name, vendor: c.vendor, version: '', expires: c.expires }))
        : [],
      applications: applications.map((a) => ({ name: a.name, status: a.status, autostart: a.autostart, autorestart: a.autorestart, ports: a.ports })),
      filesystems,
      otherParts: [],
      analysis: {
        healthScore: 0,
        memoryUtilization: summary.ramTotal ? Math.round(((summary.ramTotal - summary.ramFree) / summary.ramTotal) * 100) : 0,
        alerts: [],
        recommendations: [],
        platformType: 'Unknown',
        versionCompatibility: { isSupported: true, isLTS: false, upgradeRecommended: false },
        moduleAnalysis: { total: modules.length, byVendor: {}, thirdPartyCount: 0, unsupportedModules: [] },
        licenseStatus: { total: licenses.length, expiring: 0, expired: 0, perpetual: 0 },
        certificateStatus: { total: 0, expiring: 0, expired: 0, selfSigned: 0 },
      },
    } as PlatformParsedData;
  }

  static normalizeResources(input: any): ResourceParsedData {
    console.log('🔧 TridiumParsedNormalizer.normalizeResources called with:', input);
    console.log('🔧 Has metrics?', !!input?.metrics);
    console.log('🔧 Has resources?', !!input?.resources);
    console.log('🔧 Input top-level keys:', Object.keys(input || {}));
    
    if (input?.metrics) {
      console.log('✅ Input already has metrics field - returning as-is (NO normalization needed)');
      console.log('📊 Metrics structure:', {
        hasCPU: !!input.metrics.cpu,
        hasHeap: !!input.metrics.heap,
        hasCapacities: !!input.metrics.capacities,
        components: input.metrics.capacities?.components,
        pointsCurrent: input.metrics.capacities?.points?.current,
        devicesLimit: input.metrics.capacities?.devices?.limit
      });
      return input as ResourceParsedData;
    }
    
    // Extract the actual resource data - handle both old double-nested and new single-nested formats
    const norm = input?.metadata?.normalizedData?.resources 
      || input?.normalizedData?.resources 
      || input?.metadata?.normalizedData
      || input?.normalizedData 
      || input?.resources
      || input;
    
    console.log('🔧 Extracted norm:', norm);
    console.log('🔧 norm.components:', norm?.components);

    const toMB = (v?: number) => (typeof v === 'number' ? v : 0);

    const result = {
      metrics: {
        cpu: { usage: norm?.cpu?.usage_percent ?? 0 },
        heap: {
          used: toMB(norm?.heap?.used_mb),
          max: toMB(norm?.heap?.max_mb),
          free: 0,
          total: 0,
        },
        memory: {
          used: toMB(norm?.memory?.used_mb),
          total: toMB(norm?.memory?.total_mb),
        },
        capacities: {
          components: norm?.components ?? 0,
          points: { current: norm?.points?.used ?? 0, limit: norm?.points?.licensed ?? 0, percentage: norm?.points?.usage_percent ?? 0 },
          devices: { current: norm?.devices?.used ?? 0, limit: norm?.devices?.licensed ?? 0, percentage: norm?.devices?.usage_percent ?? 0 },
          networks: { current: 0, limit: 0 },
          histories: { current: norm?.histories ?? 0, limit: null },
          links: { current: 0, limit: null },
          schedules: { current: 0, limit: null },
        },
        uptime: norm?.time?.uptime ?? '',
        versions: { niagara: norm?.versions?.niagara ?? '', java: norm?.versions?.java ?? '', os: norm?.versions?.os ?? '' },
        fileDescriptors: { open: 0, max: 0 },
        engineScan: {
          lifetime: norm?.engine?.scan_lifetime ?? '',
          peak: norm?.engine?.scan_peak ?? '',
          peakInterscan: norm?.engine?.scan_peakInterscan ?? '',
          recent: norm?.engine?.scan_time_ms ? `${norm.engine.scan_time_ms} ms` : '',
          usage: norm?.engine?.scan_usage ?? ''
        },
        engineQueue: {
          actions: norm?.engine?.queue_current ? `${norm.engine.queue_current} (Peak ${norm.engine.queue_peak ?? 0})` : '',
          longTimers: '',
          mediumTimers: '',
          shortTimers: ''
        },
      },
      warnings: norm?.warnings ?? [],
      raw: norm?.raw ?? [],
      analysis: norm?.analysis,
    } as ResourceParsedData;
    
    console.log('✅ Normalized result:', result);
    console.log('✅ result.metrics.capacities.components:', result.metrics.capacities.components);
    return result;
  }

  static normalizeNiagaraNetwork(input: any): NiagaraNetworkParsedData {
    if (input?.network?.nodes) return input as NiagaraNetworkParsedData;

    const rows = Array.isArray(input?.rows) ? input.rows : [];
    const nodes = rows.map((r: any) => ({
      path: r.data?.path || r.data?.Path || '',
      name: r.data?.name || r.data?.Name || '',
      type: r.data?.type || r.data?.Type || '',
      address: r.data?.address || r.data?.Address || '',
      ip: r.data?.ip || '',
      port: r.data?.port || 0,
      hostModel: r.data?.hostModel || r.data?.['Host Model'] || '',
      hostModelVersion: r.data?.hostModelVersion || r.data?.['Host Model Version'] || '',
      version: r.data?.version || r.data?.Version || '',
      status: Array.isArray(r.data?.status) ? r.data.status : (r.data?.parsedStatus?.status ? [r.data.parsedStatus.status] : []),
      platformStatus: [],
      health: r.data?.health || '',
      clientConn: '',
      serverConn: '',
      enabled: true,
      connected: !!(r.data?.isOnline || r.data?.connected),
      credentialStore: '',
      platformUser: '',
      platformPassword: '',
      securePlatform: false,
      platformPort: 0,
      foxPort: 0,
      useFoxs: false,
      virtualsEnabled: false,
      faultCause: '',
    }));

    return { network: { root: 'Supervisor', nodes }, summary: {}, analysis: { alerts: [], recommendations: [], healthScore: 0 } } as any;
  }

  static normalizeBACnet(input: any): BACnetParsedData { return input; }
  static normalizeN2(input: any): N2ParsedData { return input; }
}