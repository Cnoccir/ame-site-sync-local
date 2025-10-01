import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Cpu, FileText, Trash2 } from 'lucide-react';
import { NiagaraPlatformSummary } from './NiagaraPlatformSummary';

interface PlatformStoredCardProps {
  id?: string;
  title?: string;
  data: any; // PlatformParsedData shape
  onRemove?: () => void;
}

export const PlatformStoredCard: React.FC<PlatformStoredCardProps> = ({ id = 'supervisor-platform-card', title = 'Supervisor Platform', data, onRemove }) => {
  // Accept preview payloads: unwrap { type:'platform', data:{...}, summary }
  const effective: any = data && typeof data === 'object' && 'data' in (data as any) && (data as any).type === 'platform'
    ? { ...(data as any).data, summary: (data as any).summary ?? (data as any).data?.summary }
    : data;

  if (!effective || !effective.summary) return null;
  const summary = effective.summary;
  // Filesystems: prefer parsed KB arrays; fallback to normalized storage.disks in GB
  const filesystems = Array.isArray(effective.filesystems) && effective.filesystems.length > 0
    ? effective.filesystems
    : (Array.isArray(effective?.storage?.disks) && effective.storage.disks.length > 0
        ? effective.storage.disks.map((d: any) => ({ path: d.path, free: Math.round((d.free_gb || 0) * 1024 * 1024), total: Math.round((d.total_gb || 0) * 1024 * 1024) }))
        : Array.isArray(effective?.metadata?.normalizedData?.storage?.disks)
          ? effective.metadata.normalizedData.storage.disks.map((d: any) => ({ path: d.path, free: Math.round((d.free_gb || 0) * 1024 * 1024), total: Math.round((d.total_gb || 0) * 1024 * 1024) }))
          : []
      );
  // Modules: accept arrays, objects, or normalized
  const modulesRaw = effective.modules ?? effective?.metadata?.normalizedData?.modules ?? effective?.normalizedData?.modules ?? [];
  const modules = Array.isArray(modulesRaw) ? modulesRaw : Object.values(modulesRaw || {});
  // Licenses: accept arrays, objects, or normalized
  const licensesRaw = effective.licenses ?? effective?.metadata?.normalizedData?.licenses ?? [];
  const licenses = Array.isArray(licensesRaw) ? licensesRaw : Object.values(licensesRaw || {});
  const applications = Array.isArray(effective.applications) ? effective.applications : [];

  return (
    <Card id={id} className="border-2 border-blue-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="h-5 w-5 text-blue-600" />
          {title}
          <span className="ml-2 text-sm text-gray-500">{summary.daemonVersion}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <NiagaraPlatformSummary summary={summary} filesystems={filesystems} applications={applications} />

        {/* Expanded Detailed Platform Summary - Now Full Width */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Cpu className="h-4 w-4" />
              Detailed Platform Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Hardware Platform Table */}
              <div>
                <div className="font-semibold text-sm mb-2 text-gray-700">Hardware Platform</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Model:</span>
                    <Badge variant="outline" className="font-mono text-xs">{summary.model}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Product:</span>
                    <Badge variant="outline" className="text-xs">{summary.product}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Architecture:</span>
                    <Badge variant="outline" className="text-xs">{summary.architecture}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">CPUs:</span>
                    <Badge variant="outline" className="text-xs">{summary.cpuCount}</Badge>
                  </div>
                  <div className="flex justify-between col-span-2">
                    <span className="text-gray-600">Host ID:</span>
                    <Badge variant="outline" className="font-mono text-xs">{summary.hostId}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">License Status:</span>
                    <Badge variant={summary.hostIdStatus?.toLowerCase() === 'enabled' ? 'default' : 'secondary'} className="text-xs">
                      {summary.hostIdStatus}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Niagara Platform Table */}
              <div>
                <div className="font-semibold text-sm mb-2 text-gray-700">Niagara Platform</div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Version:</span>
                    <Badge variant="default" className="text-xs">{summary.daemonVersion}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Runtime:</span>
                    <Badge variant="outline" className="font-mono text-xs">{summary.niagaraRuntime}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">HTTP Port:</span>
                    <Badge variant="outline" className="text-xs">{(summary as any).daemonHttpPort ?? (summary as any).httpsPort ?? '—'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TLS Port:</span>
                    <Badge variant="outline" className="text-xs">{(summary as any).port ?? (summary as any).foxPort ?? '—'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">TLS Support:</span>
                    <Badge variant="outline" className="text-xs">{summary.platformTlsSupport}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Protocol:</span>
                    <Badge variant="outline" className="text-xs">{(summary as any).tlsProtocol ?? (summary as any).protocol ?? '—'}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Certificate:</span>
                    <Badge variant="outline" className="text-xs">{summary.certificate}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Stations Enabled:</span>
                    <Badge variant="outline" className="text-xs">{(summary as any).niagaraStationsEnabled ?? '—'}</Badge>
                  </div>
                </div>
              </div>

              {/* System Environment Table */}
              <div>
                <div className="font-semibold text-sm mb-2 text-gray-700">System Environment</div>
                <div className="space-y-2 text-sm bg-gray-50 p-4 rounded-lg border">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Operating System:</span>
                    <Badge variant="outline" className="text-xs max-w-md text-right">{summary.operatingSystem}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Java Virtual Machine:</span>
                    <Badge variant="outline" className="text-xs max-w-md text-right">{summary.javaVirtualMachine}</Badge>
                  </div>
                  <div>
                    <span className="text-gray-600 block mb-2">Runtime Profiles:</span>
                    <div className="flex flex-wrap gap-1">
                      {(summary.enabledRuntimeProfiles || []).length > 0 ? (
                        (summary.enabledRuntimeProfiles || []).map((p: string) => (
                          <Badge key={p} variant="secondary" className="text-xs">{p}</Badge>
                        ))
                      ) : (
                        <Badge variant="outline" className="text-xs text-gray-400">None</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {onRemove && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" className="gap-2" onClick={onRemove}>
              <Trash2 className="h-4 w-4" />
              Remove Platform Data
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
