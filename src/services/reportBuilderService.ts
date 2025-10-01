// Builds a professional Markdown summary from persisted Tridium datasets
import type { TridiumDataset } from '@/types/tridium';

export const ReportBuilderService = {
  buildMarkdownSummary(datasets: TridiumDataset[]): string {
    const lines: string[] = [];
    const now = new Date().toISOString();

    lines.push(`# Tridium System Summary`, `Generated: ${now}`, '');

    // Topology
    const niagara = datasets.find(d => d.format === 'NiagaraNetExport');
    if (niagara) {
      lines.push('## Network Topology', `- Stations: ${niagara.rows.length}`, '');
    }

    // Platform
    const platforms = datasets.filter(d => d.format === 'PlatformDetails');
    if (platforms.length > 0) {
      lines.push('## Platform Details');
      platforms.forEach(ds => {
        const nd: any = (ds.metadata as any)?.normalizedData || {};
        const id = nd.platform_identity || {}; const sys = nd.system || {}; const sec = nd.security || {};
        lines.push(`- File: ${ds.filename}`);
        lines.push(`  - Product/Model: ${id.product || ''} / ${id.model || ''}`);
        lines.push(`  - Niagara: ${sys.niagara_version || ''}`);
        lines.push(`  - TLS: ${sec.tls_enabled ? 'Enabled' : 'Disabled'}`);
      });
      lines.push('');
    }

    // Resources
    const resources = datasets.filter(d => d.format === 'ResourceExport');
    if (resources.length > 0) {
      lines.push('## Resource Utilization');
      resources.forEach(ds => {
        const r: any = (ds.metadata as any)?.normalizedData?.resources || {};
        lines.push(`- File: ${ds.filename}`);
        lines.push(`  - Devices: ${r.devices?.used ?? 0}/${r.devices?.licensed ?? 0}`);
        lines.push(`  - Points: ${r.points?.used ?? 0}/${r.points?.licensed ?? 0}`);
        lines.push(`  - Heap: ${r.heap?.percent_used ?? 0}% (used ${r.heap?.used_mb ?? 0}MB of ${r.heap?.max_mb ?? 0}MB)`);
        lines.push(`  - Uptime: ${r.time?.uptime || ''}`);
      });
      lines.push('');
    }

    // BACnet
    const bacnets = datasets.filter(d => d.format === 'BACnetExport');
    if (bacnets.length > 0) {
      let total = 0; bacnets.forEach(b => total += b.rows.length);
      lines.push('## BACnet Devices', `- Total devices: ${total}`, '');
    }

    // N2
    const n2s = datasets.filter(d => d.format === 'N2Export');
    if (n2s.length > 0) {
      let total = 0; n2s.forEach(n => total += n.rows.length);
      lines.push('## N2 Devices', `- Total devices: ${total}`, '');
    }

    return lines.join('\n');
  }
};
