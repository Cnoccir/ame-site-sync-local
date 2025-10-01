import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useImportedDatasets } from '@/hooks/useImportedDatasets';
import type { TridiumDataset } from '@/types/tridium';
import { NetworkTopologyService } from '@/services/networkTopologyService';
import { ReportBuilderService } from '@/services/reportBuilderService';

interface TridiumAnalysisPanelProps {
  projectId?: string;
}

export const TridiumAnalysisPanel: React.FC<TridiumAnalysisPanelProps> = ({ projectId }) => {
  const { datasets, loading, error, reload } = useImportedDatasets(projectId);

  const niagara = useMemo(() => datasets.find(d => d.format === 'NiagaraNetExport'), [datasets]);
  const platforms = useMemo(() => datasets.filter(d => d.format === 'PlatformDetails'), [datasets]);
  const resources = useMemo(() => datasets.filter(d => d.format === 'ResourceExport'), [datasets]);
  const bacnets = useMemo(() => datasets.filter(d => d.format === 'BACnetExport'), [datasets]);
  const n2s = useMemo(() => datasets.filter(d => d.format === 'N2Export'), [datasets]);

  const topology = useMemo(() => {
    try { return NetworkTopologyService.buildTopology(datasets); } catch { return null; }
  }, [datasets]);

  const downloadSummary = () => {
    const md = ReportBuilderService.buildMarkdownSummary(datasets);
    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tridium_system_summary.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  const statusBadge = (status?: string) => {
    const s = (status || 'unknown').toLowerCase();
    const variant = s === 'ok' ? 'success' : s === 'alarm' ? 'warning' : s === 'down' || s === 'fault' ? 'destructive' : 'outline';
    const text = s.toUpperCase();
    return <Badge variant={variant as any}>{text}</Badge>;
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">System Health & Analysis</h3>
          <Skeleton className="h-9 w-48" />
        </div>
        <div className="grid gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-48" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">System Health & Analysis</h3>
          <Button variant="outline" onClick={reload}>Retry</Button>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">
              <p>Error loading system data: {error}</p>
              <Button variant="outline" onClick={reload} className="mt-2">Try Again</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">System Health & Analysis</h3>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={downloadSummary}>Download Summary (MD)</Button>
          <Button variant="outline" size="sm" onClick={reload}>Refresh</Button>
        </div>
      </div>

      {/* Topology Summary */}
      <Section title="Network Topology Overview">
        {!topology && <div className="text-sm text-muted-foreground">Upload a Niagara Network Export to build the topology.</div>}
        {topology && (
          <div className="grid grid-cols-4 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Total Nodes</div>
              <div className="text-xl font-semibold">{topology.totalDevices}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Healthy</div>
              <div className="text-xl font-semibold">{topology.healthSummary.healthy}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Degraded</div>
              <div className="text-xl font-semibold">{topology.healthSummary.degraded}</div>
            </div>
            <div>
              <div className="text-muted-foreground">Offline</div>
              <div className="text-xl font-semibold">{topology.healthSummary.offline}</div>
            </div>
          </div>
        )}
      </Section>

      {/* Platform Details */}
      <Section title="Platform Details">
        {platforms.length === 0 && <div className="text-sm text-muted-foreground">No Platform Details imported yet.</div>}
        {platforms.length > 0 && (
          <div className="grid grid-cols-1 gap-4">
            {platforms.map((ds) => {
              const nd = (ds.metadata as any)?.normalizedData; // PlatformDetailsOutput
              const id = nd?.platform_identity || {};
              const sys = nd?.system || {};
              const sec = nd?.security || {};
              return (
                <div key={ds.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{ds.filename}</div>
                    <div className="text-xs text-muted-foreground">IP: {id.ip || '—'}</div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Product</div>
                      <div>{id.product || '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Model</div>
                      <div>{id.model || '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Niagara</div>
                      <div>{sys.niagara_version || '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">TLS</div>
                      <div>{sec.tls_enabled ? 'Enabled' : 'Disabled'}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* Resource Exports */}
      <Section title="Resource Utilization">
        {resources.length === 0 && <div className="text-sm text-muted-foreground">No Resource Export imported yet.</div>}
        {resources.length > 0 && (
          <div className="space-y-3">
            {resources.map((ds) => {
              const rd = (ds.metadata as any)?.normalizedData?.resources || {};
              const alerts = (ds.metadata as any)?.alerts || [];
              const heapPct = rd.heap?.percent_used ?? 0;
              return (
                <div key={ds.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold">{ds.filename}</div>
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant={heapPct > 90 ? 'destructive' : heapPct > 75 ? 'warning' : 'success'}>
                        Heap {heapPct}%
                      </Badge>
                      <Badge variant="outline">Histories {rd.histories ?? 0}</Badge>
                      <Badge variant="outline">Components {rd.components ?? 0}</Badge>
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-4 mt-3 text-sm">
                    <div>
                      <div className="text-muted-foreground">Devices</div>
                      <div>{rd.devices?.used ?? 0} / {rd.devices?.licensed ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Points</div>
                      <div>{rd.points?.used ?? 0} / {rd.points?.licensed ?? 0}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">CPU Usage</div>
                      <div>{(ds.metadata as any)?.normalizedData?.resources?.engine ? (ds.metadata as any).normalizedData.resources.engine.scan_time_ms + ' ms' : '—'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Uptime</div>
                      <div>{rd.time?.uptime || '—'}</div>
                    </div>
                  </div>
                  {alerts.length > 0 && (
                    <div className="mt-3 text-xs">
                      <div className="font-semibold mb-1">Alerts</div>
                      <ul className="list-disc pl-5 space-y-1">
                        {alerts.slice(0, 5).map((a: any, i: number) => (
                          <li key={i} className={a.severity === 'critical' ? 'text-red-600' : a.severity === 'warning' ? 'text-amber-600' : ''}>
                            [{a.severity}] {a.metric}: {a.value} — {a.recommendation}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Section>

      {/* BACnet Inventory */}
      <Section title="BACnet Device Inventory">
        {bacnets.length === 0 && <div className="text-sm text-muted-foreground">No BACnet Export imported yet.</div>}
        {bacnets.length > 0 && (
          <div className="space-y-4">
            {bacnets.map((ds) => (
              <div key={ds.id} className="border rounded-lg overflow-hidden">
                <div className="px-4 py-2 text-sm font-semibold bg-gray-50 border-b">{ds.filename}</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Device ID</th>
                        <th className="px-3 py-2">Vendor</th>
                        <th className="px-3 py-2">Model</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2">Health</th>
                        <th className="px-3 py-2">Enabled</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ds.rows.slice(0, 200).map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="px-3 py-2">{r.data.Name}</td>
                          <td className="px-3 py-2">{r.data['Device ID']}</td>
                          <td className="px-3 py-2">{r.data.Vendor}</td>
                          <td className="px-3 py-2">{r.data.Model}</td>
                          <td className="px-3 py-2">{statusBadge(r.parsedStatus?.status)}</td>
                          <td className="px-3 py-2">{r.data.Health}</td>
                          <td className="px-3 py-2">{String(r.data.Enabled)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2 text-xs text-muted-foreground border-t">Showing first 200 devices</div>
              </div>
            ))}
          </div>
        )}
      </Section>

      {/* N2 Inventory */}
      <Section title="N2 Device Inventory">
        {n2s.length === 0 && <div className="text-sm text-muted-foreground">No N2 Export imported yet.</div>}
        {n2s.length > 0 && (
          <div className="space-y-4">
            {n2s.map((ds) => (
              <div key={ds.id} className="border rounded-lg overflow-hidden">
                <div className="px-4 py-2 text-sm font-semibold bg-gray-50 border-b">{ds.filename}</div>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="bg-gray-50 text-left">
                        <th className="px-3 py-2">Name</th>
                        <th className="px-3 py-2">Address</th>
                        <th className="px-3 py-2">Controller Type</th>
                        <th className="px-3 py-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ds.rows.slice(0, 200).map((r) => (
                        <tr key={r.id} className="border-t">
                          <td className="px-3 py-2">{r.data.Name}</td>
                          <td className="px-3 py-2">{r.data.Address}</td>
                          <td className="px-3 py-2">{r.data['Controller Type']}</td>
                          <td className="px-3 py-2">{statusBadge(r.parsedStatus?.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="px-4 py-2 text-xs text-muted-foreground border-t">Showing first 200 devices</div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
};