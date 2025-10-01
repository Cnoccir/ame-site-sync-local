import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { ShieldCheck, Server, Activity } from 'lucide-react';

interface Application {
  name: string;
  type: string;
  status: string;
  autostart: boolean;
  autorestart?: boolean;
  fox?: number;
  foxs?: number;
  http?: number;
  https?: number;
}

interface SummaryProps {
  summary: {
    hostId: string;
    daemonVersion: string;
    operatingSystem: string;
    cpuCount: number;
    platformTlsSupport: string;
    certificate: string;
    daemonHttpPort?: string;
    port?: string;
    ramTotal?: string | number; // accepts KB string ("33,163,900 KB") or numeric KB
    ramFree?: string | number;  // accepts KB string or numeric KB
  };
  filesystems: Array<{ path: string; free: string | number; total: string | number; }>;
  applications?: Application[]; // Enhanced: application data with ports and status
}

function parseKBToMB(value?: string | number): number {
  if (value === undefined || value === null) return 0;
  if (typeof value === 'number') {
    // assume value is in KB
    return Math.round(value / 1024);
  }
  const num = parseInt(value.replace(/[^\d]/g, ''), 10);
  if (isNaN(num)) return 0;
  return Math.round(num / 1024);
}

export const NiagaraPlatformSummary: React.FC<SummaryProps> = ({ summary, filesystems, applications }) => {
  const totalRAM = parseKBToMB(summary.ramTotal);
  const freeRAM = parseKBToMB(summary.ramFree);
  const usedRAM = Math.max(totalRAM - freeRAM, 0);
  const ramPercent = totalRAM > 0 ? Math.round((usedRAM / totalRAM) * 100) : 0;

  // Pick first filesystem as system disk (best effort)
  const fs0 = filesystems && filesystems.length > 0 ? filesystems[0] : undefined;
  const totalDisk = parseKBToMB(fs0?.total);
  const freeDisk = parseKBToMB(fs0?.free);
  const usedDisk = Math.max(totalDisk - freeDisk, 0);
  const diskPercent = totalDisk > 0 ? Math.round((usedDisk / totalDisk) * 100) : 0;

  const toGB = (mb: number) => (mb / 1024).toFixed(1);

  // Helper: Get status badge variant and color
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower.includes('running') || statusLower.includes('ok')) {
      return { variant: 'default' as const, className: 'bg-green-500 hover:bg-green-600' };
    }
    if (statusLower.includes('stopped') || statusLower.includes('disabled')) {
      return { variant: 'secondary' as const, className: 'bg-gray-400 hover:bg-gray-500' };
    }
    if (statusLower.includes('error') || statusLower.includes('fault')) {
      return { variant: 'destructive' as const, className: '' };
    }
    return { variant: 'outline' as const, className: '' };
  };

  // Helper: Format port info for display
  const formatPorts = (app: Application): string => {
    const ports: string[] = [];
    if (app.fox) ports.push(`FOX: ${app.fox}`);
    if (app.foxs) ports.push(`FOXS: ${app.foxs}`);
    if (app.http) ports.push(`HTTP: ${app.http}`);
    if (app.https) ports.push(`HTTPS: ${app.https}`);
    return ports.length > 0 ? ports.join(' | ') : 'No ports configured';
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Identity Card */}
      <Card>
        <CardHeader>
          <CardTitle>Niagara Platform Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          <div>
            <div className="text-gray-500">Host ID</div>
            <div className="font-semibold break-all">{summary.hostId || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">Niagara Version</div>
            <div className="font-semibold">{summary.daemonVersion || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">OS</div>
            <div className="font-semibold text-xs">{summary.operatingSystem || '—'}</div>
          </div>
          <div>
            <div className="text-gray-500">CPU Cores</div>
            <div className="font-semibold">{summary.cpuCount ?? '—'}</div>
          </div>
        </CardContent>
      </Card>

      {/* Memory Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Memory Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={ramPercent} className="w-full" />
          <div className="mt-2 text-sm text-center">
            {toGB(usedRAM)} GB used / {toGB(totalRAM)} GB total ({ramPercent}% used)
          </div>
        </CardContent>
      </Card>

      {/* Disk Usage */}
      <Card>
        <CardHeader>
          <CardTitle>Disk Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={diskPercent} className="w-full" />
          <div className="mt-2 text-sm text-center">
            {toGB(usedDisk)} GB used / {toGB(totalDisk)} GB total ({diskPercent}% used)
          </div>
        </CardContent>
      </Card>

      {/* Security */}
      <Card>
        <CardHeader>
          <CardTitle>Security Status</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center space-y-2 text-sm">
          <ShieldCheck className={`h-10 w-10 ${/tls/i.test(summary.platformTlsSupport || '') ? 'text-green-500' : 'text-gray-400'}`} />
          <div>{/tls/i.test(summary.platformTlsSupport || '') ? 'TLS Enabled' : 'TLS Disabled'}</div>
          <div className="text-xs text-gray-500">Cert: {summary.certificate || '—'}</div>
          <div className="text-xs text-gray-500 text-center">
            <div>Ports:</div>
            <ul className="list-disc list-inside">
              {(summary.daemonHttpPort ?? (summary as any).httpsPort) && (
                <li>HTTP: {summary.daemonHttpPort ?? (summary as any).httpsPort}</li>
              )}
              {(summary.port ?? (summary as any).foxPort) && (
                <li>TLS: {summary.port ?? (summary as any).foxPort}</li>
              )}
            </ul>
          </div>
        </CardContent>
      </Card>
      </div>

      {/* Applications Table (Enhanced) - Only show if applications data is available */}
      {applications && applications.length > 0 && (
        <div className="mt-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Server className="h-5 w-5 text-blue-500" />
              <span>Niagara Applications</span>
              <Badge variant="secondary">{applications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Application</th>
                    <th className="text-left py-2 px-3 font-medium">Type</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-left py-2 px-3 font-medium">Autostart</th>
                    <th className="text-left py-2 px-3 font-medium">Ports</th>
                  </tr>
                </thead>
                <tbody>
                  {applications.map((app, idx) => {
                    const statusBadge = getStatusBadge(app.status);
                    return (
                      <tr key={idx} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 font-medium">{app.name}</td>
                        <td className="py-2 px-3">
                          <Badge variant="outline" className="text-xs">{app.type}</Badge>
                        </td>
                        <td className="py-2 px-3">
                          <Badge {...statusBadge}>
                            <Activity className="h-3 w-3 mr-1" />
                            {app.status}
                          </Badge>
                        </td>
                        <td className="py-2 px-3">
                          <Badge variant={app.autostart ? 'default' : 'secondary'}>
                            {app.autostart ? 'Yes' : 'No'}
                          </Badge>
                        </td>
                        <td className="py-2 px-3 text-xs text-gray-600">
                          {formatPorts(app)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        </div>
      )}
    </div>
  );
};
