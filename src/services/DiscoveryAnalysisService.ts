import { SYSTEM_THRESHOLDS } from '@/types/niagaraAnalysis';

export interface AnalysisSettings {
  cpu: { warning: number; critical: number };
  heap: { warning: number; critical: number };
  ram: { minFreePctSupervisor: number; minFreePctJace: number };
  disk: { minFreePctSupervisor: number; minFreePctJace: number };
  histories: { jaceMax: number; supervisorMax: number };
  certificates: { expiringDays: number };
  niagara: { currentLTS: string };
  license: { warnPct: number };
}

export interface AnalysisSnapshot {
  id?: string;
  scope: 'supervisor' | 'jace';
  refId: string; // 'supervisor' or jace name/key
  score: number; // 0-100
  alerts: Array<{ severity: 'warning' | 'critical'; code: string; message: string; value?: any; threshold?: any }>;
  metrics: Record<string, any>;
  settingsUsed?: AnalysisSettings;
  created_at: string;
}

export function defaultAnalysisSettings(): AnalysisSettings {
  return {
    cpu: { warning: SYSTEM_THRESHOLDS.cpu.warning, critical: SYSTEM_THRESHOLDS.cpu.critical },
    heap: { warning: SYSTEM_THRESHOLDS.heap.warning, critical: SYSTEM_THRESHOLDS.heap.critical },
    ram: { minFreePctSupervisor: 10, minFreePctJace: 20 },
    disk: { minFreePctSupervisor: SYSTEM_THRESHOLDS.disk.supervisor.warning, minFreePctJace: SYSTEM_THRESHOLDS.disk.jace.warning },
    histories: { jaceMax: SYSTEM_THRESHOLDS.capacity.histories.jace, supervisorMax: SYSTEM_THRESHOLDS.capacity.histories.supervisor },
    certificates: { expiringDays: SYSTEM_THRESHOLDS.certificates.expiringDays },
    niagara: { currentLTS: SYSTEM_THRESHOLDS.niagara.currentLTS },
    license: { warnPct: 90 }
  };
}

export class DiscoveryAnalysisService {
  static computeSupervisorSnapshot(persisted: any, settings?: Partial<AnalysisSettings>): AnalysisSnapshot {
    const s = { ...defaultAnalysisSettings(), ...(settings || {}) } as AnalysisSettings;
    const platform = persisted?.supervisor?.platform;
    const resources = persisted?.supervisor?.resources;
    const now = new Date().toISOString();

    const alerts: AnalysisSnapshot['alerts'] = [];
    const metrics: Record<string, any> = {};

    // CPU
    const cpu = resources?.cpu?.usage || resources?.metrics?.cpu?.usage || 0;
    metrics.cpu = cpu;
    if (cpu > s.cpu.warning) alerts.push({ severity: 'warning', code: 'cpu.high', message: `CPU usage ${cpu}%`, value: cpu, threshold: s.cpu.warning });
    if (cpu > s.cpu.critical) alerts.push({ severity: 'critical', code: 'cpu.critical', message: `CPU usage ${cpu}%`, value: cpu, threshold: s.cpu.critical });

    // Heap
    const heapPct = resources?.resources?.heap?.percent_used ?? resources?.memory?.heap?.percentage ?? 0;
    metrics.heap = heapPct;
    if (heapPct > s.heap.warning) alerts.push({ severity: 'warning', code: 'heap.high', message: `Heap usage ${heapPct}%`, value: heapPct, threshold: s.heap.warning });

    // RAM free (supervisor threshold)
    const ramFreePct = resources?.memory?.physical?.percentage ? (100 - (resources.memory.physical.percentage)) : (platform?.memory?.ram_usage_percent ? (100 - platform.memory.ram_usage_percent) : 100);
    metrics.ramFreePct = ramFreePct;
    if (ramFreePct < s.ram.minFreePctSupervisor) alerts.push({ severity: 'warning', code: 'ram.low', message: `RAM free ${ramFreePct}%`, value: ramFreePct, threshold: s.ram.minFreePctSupervisor });

    // Disk free (supervisor)
    const disks = platform?.storage?.disks || [];
    const minDiskFree = Math.min(...disks.map((d: any) => 100 - (d.used_percent || 0))).toString() === 'Infinity' ? 100 : Math.min(...disks.map((d: any) => 100 - (d.used_percent || 0)));
    metrics.diskFreeMinPct = isFinite(minDiskFree) ? minDiskFree : 100;
    if (metrics.diskFreeMinPct < s.disk.minFreePctSupervisor) alerts.push({ severity: 'warning', code: 'disk.low', message: `Disk free ${metrics.diskFreeMinPct}%`, value: metrics.diskFreeMinPct, threshold: s.disk.minFreePctSupervisor });

    // Histories (supervisor)
    const histories = resources?.resources?.histories ?? 0;
    if (histories > s.histories.supervisorMax) alerts.push({ severity: 'warning', code: 'histories.high', message: `Histories ${histories} > ${s.histories.supervisorMax}`, value: histories, threshold: s.histories.supervisorMax });

    // Niagara version LTS
    const niagaraVersion = platform?.system?.niagara_version || '';
    metrics.niagaraVersion = niagaraVersion;
    if (niagaraVersion && niagaraVersion !== s.niagara.currentLTS) {
      alerts.push({ severity: 'warning', code: 'version.lts', message: `Niagara ${niagaraVersion} not current LTS (${s.niagara.currentLTS})` });
    }

    // Certificates
    const expiringCerts = (platform?.certificates || []).filter((c: any) => typeof c.days_until_expiry === 'number' && c.days_until_expiry <= s.certificates.expiringDays);
    if (expiringCerts.length > 0) alerts.push({ severity: 'warning', code: 'certs.expiring', message: `${expiringCerts.length} certificate(s) expiring ≤${s.certificates.expiringDays} days` });

    // License usage > warnPct
    const devUsed = resources?.resources?.devices?.used ?? resources?.devices?.used ?? 0;
    const devLic = resources?.resources?.devices?.licensed ?? resources?.devices?.licensed ?? 0;
    if (devLic > 0) {
      const pct = Math.round((devUsed / devLic) * 100);
      metrics.deviceLicensePct = pct;
      if (pct > s.license.warnPct) alerts.push({ severity: 'warning', code: 'license.devices.high', message: `Device license at ${pct}%`, value: pct, threshold: s.license.warnPct });
    }

    // Score simple: 100 - penalties
    let score = 100;
    alerts.forEach(a => { score -= a.severity === 'critical' ? 15 : 7; });
    score = Math.max(0, Math.min(100, score));

    return { scope: 'supervisor', refId: 'supervisor', score, alerts, metrics, settingsUsed: s, created_at: now };
  }

  static computeJaceSnapshot(jaceName: string, j: any, settings?: Partial<AnalysisSettings>): AnalysisSnapshot {
    const s = { ...defaultAnalysisSettings(), ...(settings || {}) } as AnalysisSettings;
    const now = new Date().toISOString();
    const alerts: AnalysisSnapshot['alerts'] = [];
    const metrics: Record<string, any> = {};

    const platform = j?.platform;
    const resources = j?.resources;

    const cpu = resources?.resources?.cpu?.usage ?? resources?.cpu?.usage ?? 0;
    metrics.cpu = cpu;
    if (cpu > s.cpu.warning) alerts.push({ severity: 'warning', code: 'cpu.high', message: `CPU usage ${cpu}%`, value: cpu, threshold: s.cpu.warning });

    const heapPct = resources?.resources?.heap?.percent_used ?? resources?.memory?.heap?.percentage ?? 0;
    metrics.heap = heapPct;
    if (heapPct > s.heap.warning) alerts.push({ severity: 'warning', code: 'heap.high', message: `Heap usage ${heapPct}%`, value: heapPct, threshold: s.heap.warning });

    const diskDisks = platform?.storage?.disks || [];
    const minDiskFree = Math.min(...diskDisks.map((d: any) => 100 - (d.used_percent || 0))).toString() === 'Infinity' ? 100 : Math.min(...diskDisks.map((d: any) => 100 - (d.used_percent || 0)));
    metrics.diskFreeMinPct = isFinite(minDiskFree) ? minDiskFree : 100;
    if (metrics.diskFreeMinPct < s.disk.minFreePctJace) alerts.push({ severity: 'warning', code: 'disk.low', message: `Disk free ${metrics.diskFreeMinPct}%`, value: metrics.diskFreeMinPct, threshold: s.disk.minFreePctJace });

    const histories = resources?.resources?.histories ?? 0;
    if (histories > s.histories.jaceMax) alerts.push({ severity: 'warning', code: 'histories.high', message: `Histories ${histories} > ${s.histories.jaceMax}`, value: histories, threshold: s.histories.jaceMax });

    const niagaraVersion = platform?.system?.niagara_version || '';
    metrics.niagaraVersion = niagaraVersion;
    if (niagaraVersion && niagaraVersion !== s.niagara.currentLTS) {
      alerts.push({ severity: 'warning', code: 'version.lts', message: `Niagara ${niagaraVersion} not current LTS (${s.niagara.currentLTS})` });
    }

    if (!platform) {
      // Orphaned JACE: discovered via network but missing platform import
      alerts.push({ severity: 'warning', code: 'jace.orphaned', message: 'JACE discovered but no PlatformDetails uploaded' });
    }

    // Driver/device health
    const drivers = j?.drivers || {};
    const badDevices = [
      ...(drivers?.bacnet?.devices || []).filter((d: any) => d.status && !String(d.status).toLowerCase().includes('ok')),
      ...(drivers?.n2?.devices || []).filter((d: any) => d.status && !String(d.status).toLowerCase().includes('ok'))
    ];
    if (badDevices.length > 0) alerts.push({ severity: 'critical', code: 'devices.bad', message: `${badDevices.length} device(s) not OK` });

    let score = 100;
    alerts.forEach(a => { score -= a.severity === 'critical' ? 15 : 7; });
    score = Math.max(0, Math.min(100, score));

    return { scope: 'jace', refId: jaceName, score, alerts, metrics, settingsUsed: s, created_at: now };
  }
}
