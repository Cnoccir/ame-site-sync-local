/**
 * Tridium Data Transformer
 * Bridges parser output structures to UI component expectations
 */

import type { PlatformParsedData, ResourceParsedData } from './TridiumExportProcessor';

/**
 * Transform platform data from parser output to NiagaraPlatformSummary props
 */
export function transformPlatformForDisplay(parsed: PlatformParsedData) {
  // Transform summary to match UI component expectations
  const summary = {
    hostId: parsed.summary.hostId || '',
    daemonVersion: parsed.summary.daemonVersion || '',
    operatingSystem: parsed.summary.os || '',
    cpuCount: parsed.summary.cpuCount || 0,
    platformTlsSupport: parsed.summary.platformTlsSupport || '',
    certificate: parsed.summary.certificate || '',
    daemonHttpPort: String(parsed.summary.httpsPort || ''),
    port: String(parsed.summary.foxPort || ''),
    ramTotal: parsed.summary.ramTotal || 0,  // in KB
    ramFree: parsed.summary.ramFree || 0      // in KB
  };

  // Transform filesystems
  const filesystems = parsed.filesystems.map(fs => ({
    path: fs.path,
    free: fs.free,    // in KB
    total: fs.total   // in KB
  }));

  // Transform applications to match expected structure
  const applications = parsed.applications.map(app => ({
    name: app.name,
    type: 'station', // All are stations from platform details
    status: app.status,
    autostart: app.autostart,
    autorestart: app.autorestart,
    fox: app.ports.fox || 0,
    foxs: app.ports.foxs || 0,
    http: app.ports.http || 0,
    https: app.ports.https || 0
  }));

  return {
    summary,
    filesystems,
    applications,
    // Keep original data for detailed views
    _raw: parsed
  };
}

/**
 * Transform resource data for display
 */
export function transformResourceForDisplay(parsed: ResourceParsedData) {
  return {
    devices: {
      used: parsed.devices?.used || 0,
      licensed: parsed.devices?.licensed || 0,
      percentage: parsed.devices?.licensed ? 
        Math.round((parsed.devices.used / parsed.devices.licensed) * 100) : 0
    },
    points: {
      used: parsed.points?.used || 0,
      licensed: parsed.points?.licensed || 0,
      percentage: parsed.points?.licensed ?
        Math.round((parsed.points.used / parsed.points.licensed) * 100) : 0
    },
    heap: {
      usedMB: parsed.heap_used_mb || 0,
      maxMB: parsed.heap_max_mb || 0,
      percentage: parsed.heap_used_pct || 0
    },
    histories: parsed.histories || 0,
    // Keep original for detailed views
    _raw: parsed
  };
}

/**
 * Transform loaded database data back to display format
 */
export function transformDatabasePlatformForDisplay(dbRecord: any) {
  const platformJson = dbRecord.platform_json || {};
  
  return transformPlatformForDisplay(platformJson);
}

/**
 * Transform loaded database resource data back to display format
 */
export function transformDatabaseResourceForDisplay(dbRecord: any) {
  const resourceJson = dbRecord.resource_json || {};
  
  return transformResourceForDisplay(resourceJson);
}