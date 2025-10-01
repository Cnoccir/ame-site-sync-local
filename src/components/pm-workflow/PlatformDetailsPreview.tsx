import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import {
  Server,
  Cpu,
  HardDrive,
  Activity,
  Shield,
  Clock,
  Zap,
  CheckCircle2,
  AlertTriangle,
  Info,
  Trash2,
  Eye,
  Package,
  FileText
} from 'lucide-react';
import { PlatformStoredCard } from './PlatformStoredCard';

interface PlatformDetailsPreviewProps {
  data: any;
  fileName: string;
  onRemove?: () => void;
  onViewAnalysis?: () => void;
  onSaveEdited?: (edited: any) => Promise<void> | void;
}

export const PlatformDetailsPreview: React.FC<PlatformDetailsPreviewProps> = ({
  data,
  fileName,
  onRemove,
  onViewAnalysis,
  onSaveEdited
}) => {
  // Debug logging
  console.log('🔍 PlatformDetailsPreview received data:', data);
  console.log('🔍 Data structure:', {
    hasRows: !!data?.rows,
    hasMetadata: !!data?.metadata,
    hasNormalizedData: !!data?.metadata?.normalizedData,
    topLevelKeys: data ? Object.keys(data) : []
  });

  // Extract platform data from various possible formats
  let effective: any = null;

  // Path 1: TridiumDataset structure (rows[0].metadata.normalizedData) - MOST COMMON FROM PARSER
  if (data?.rows?.[0]?.metadata?.normalizedData && 
      (data.rows[0].metadata.normalizedData.platform_identity || data.rows[0].metadata.normalizedData.system)) {
    effective = data.rows[0].metadata.normalizedData;
    console.log('✅ Using data.rows[0].metadata.normalizedData');
  }
  // Path 2: Metadata normalized structure (from stored data)
  else if (data?.metadata?.normalizedData && 
           (data.metadata.normalizedData.platform_identity || data.metadata.normalizedData.system)) {
    effective = data.metadata.normalizedData;
    console.log('✅ Using data.metadata.normalizedData');
  }
  // Path 3: Wrapped format: { type:'platform', data:{...}, summary }
  else if (data && typeof data === 'object' && 'data' in data && (data as any).type === 'platform') {
    effective = { ...(data as any).data, summary: (data as any).summary ?? (data as any).data?.summary };
    console.log('✅ Using wrapped platform format');
  }
  // Path 4: Direct platform data (legacy format with summary)
  else if (data?.summary || data?.platform_identity) {
    effective = data;
    console.log('✅ Using direct data as effective');
  }

  console.log('📊 Final effective data:', effective);

  // For new normalized format from parser, build a legacy-compatible summary
  if (effective && !effective.summary && effective.platform_identity) {
    effective.summary = {
      hostId: effective.platform_identity.host_id || '',
      model: effective.platform_identity.model || 'Unknown',
      product: effective.platform_identity.product || 'Unknown',
      ipAddress: effective.platform_identity.ip,
      niagaraRuntime: effective.system?.niagara_version || '',
      operatingSystem: `${effective.system?.os_name || ''} ${effective.system?.os_build || ''}`.trim(),
      architecture: effective.system?.architecture || '',
      cpuCount: effective.system?.cpu_count || 0,
      javaVirtualMachine: effective.system?.jvm_version || '',
      enabledRuntimeProfiles: effective.system?.enabled_profiles || [],
      platformTlsSupport: effective.security?.tls_support || '',
      ramTotal: effective.memory?.total_ram_gb ? `${effective.memory.total_ram_gb} GB` : '',
      ramFree: effective.memory?.free_ram_gb ? `${effective.memory.free_ram_gb} GB` : ''
    };
    // Map other fields
    effective.modules = effective.modules || [];
    effective.licenses = effective.licenses || [];
    effective.certificates = effective.certificates || [];
    effective.filesystems = effective.storage?.disks || [];
    effective.applications = effective.applications || [];
    console.log('🔧 Built legacy summary from normalized data');
  }

  if (!effective || (!effective.summary && !effective.platform_identity)) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Server className="h-12 w-12 mx-auto mb-4 text-gray-300" />
        <p>Platform data not available</p>
        <details className="mt-4 text-xs text-left max-w-2xl mx-auto">
          <summary className="cursor-pointer">Debug Info</summary>
          <pre className="mt-2 p-2 bg-gray-100 rounded overflow-auto max-h-60">
            {JSON.stringify(data, null, 2)}
          </pre>
        </details>
      </div>
    );
  }

  const summary = effective.summary;
  // Normalize arrays in case parser returns objects keyed by name
  const modulesRaw = effective.modules ?? [];
  const modules = Array.isArray(modulesRaw) ? modulesRaw : Object.values(modulesRaw || {});
  const licensesRaw = effective.licenses ?? [];
  const licenses = Array.isArray(licensesRaw) ? licensesRaw : Object.values(licensesRaw || {});
  const filesystems = effective.filesystems || [];
  const applicationsRaw = effective.applications ?? [];
  const applications = Array.isArray(applicationsRaw) ? applicationsRaw : Object.values(applicationsRaw || {});
  const certificatesRaw = effective.certificates ?? [];
  const certificates = Array.isArray(certificatesRaw) ? certificatesRaw : Object.values(certificatesRaw || {});
  const performance = effective.performance || {};
  const analysis = effective.analysis || {};

  // Interactive tables state for modules
  const initialModuleRows = useMemo(() => 
    modules.map((m: any, i: number) => ({
      key: `mod-${i}-${m.name || 'unknown'}`, // Ensure unique keys by combining index and name
      include: false,
      comment: '',
      name: m.name,
      vendor: m.vendor,
      version: m.version
    }))
  , [JSON.stringify(modules)]);
  const [moduleRows, setModuleRows] = useState(initialModuleRows);
  const [moduleFilter, setModuleFilter] = useState('');
  const [moduleEditMode, setModuleEditMode] = useState(false);

  // Interactive tables state for licenses
  const initialLicenseRows = useMemo(() => 
    licenses.map((l: any, i: number) => ({
      key: `lic-${i}-${l.name || 'unknown'}`, // Ensure unique keys
      include: false,
      comment: '',
      name: l.name,
      vendor: l.vendor,
      expires: l.expires
    }))
  , [JSON.stringify(licenses)]);
  const [licenseRows, setLicenseRows] = useState(initialLicenseRows);
  const [licenseFilter, setLicenseFilter] = useState('');
  const [licenseEditMode, setLicenseEditMode] = useState(false);

  // Interactive tables state for filesystems
  const initialFilesystemRows = useMemo(() => 
    filesystems.map((f: any, i: number) => {
      const usage = typeof f.usage === 'number' ? f.usage : (f.total ? Math.round(((f.total - f.free) / f.total) * 100) : 0);
      return ({
        key: `fs-${i}-${f.path || 'unknown'}`, // Ensure unique keys
        include: false,
        comment: '',
        path: f.path,
        free: f.free,
        total: f.total,
        usage
      });
    })
  , [JSON.stringify(filesystems)]);
  const [filesystemRows, setFilesystemRows] = useState(initialFilesystemRows);
  const [filesystemFilter, setFilesystemFilter] = useState('');
  const [filesystemEditMode, setFilesystemEditMode] = useState(false);

  // Interactive tables state for applications
  const initialApplicationRows = useMemo(() => 
    applications.map((a: any, i: number) => ({
      key: `app-${i}-${a.name || 'unknown'}`, // Ensure unique keys
      include: false,
      comment: '',
      name: a.name,
      status: a.status,
      autostart: a.autostart,
      fox: a.fox,
      foxs: a.foxs,
      http: a.http,
      https: a.https
    }))
  , [JSON.stringify(applications)]);
  const [applicationRows, setApplicationRows] = useState(initialApplicationRows);
  const [applicationFilter, setApplicationFilter] = useState('');
  const [applicationEditMode, setApplicationEditMode] = useState(false);

  // Interactive tables state for certificates
  const initialCertificateRows = useMemo(() => 
    certificates.map((c: any, i: number) => ({
      key: `cert-${i}-${c.name || 'unknown'}`, // Ensure unique keys
      include: false,
      comment: '',
      name: c.name,
      vendor: c.vendor,
      expires: c.expires
    }))
  , [JSON.stringify(certificates)]);
  const [certificateRows, setCertificateRows] = useState(initialCertificateRows);
  const [certificateFilter, setCertificateFilter] = useState('');
  const [certificateEditMode, setCertificateEditMode] = useState(false);

  // Filters
  const filteredModules = useMemo(() => {
    if (!moduleFilter) return moduleRows;
    const f = moduleFilter.toLowerCase();
    return moduleRows.filter(r => JSON.stringify(r).toLowerCase().includes(f));
  }, [moduleRows, moduleFilter]);

  const filteredLicenses = useMemo(() => {
    if (!licenseFilter) return licenseRows;
    const f = licenseFilter.toLowerCase();
    return licenseRows.filter(r => JSON.stringify(r).toLowerCase().includes(f));
  }, [licenseRows, licenseFilter]);

  const filteredFilesystems = useMemo(() => {
    if (!filesystemFilter) return filesystemRows;
    const f = filesystemFilter.toLowerCase();
    return filesystemRows.filter(r => JSON.stringify(r).toLowerCase().includes(f));
  }, [filesystemRows, filesystemFilter]);

  const filteredApplications = useMemo(() => {
    if (!applicationFilter) return applicationRows;
    const f = applicationFilter.toLowerCase();
    return applicationRows.filter(r => JSON.stringify(r).toLowerCase().includes(f));
  }, [applicationRows, applicationFilter]);

  const filteredCertificates = useMemo(() => {
    if (!certificateFilter) return certificateRows;
    const f = certificateFilter.toLowerCase();
    return certificateRows.filter(r => JSON.stringify(r).toLowerCase().includes(f));
  }, [certificateRows, certificateFilter]);

  const saveEdits = async () => {
    if (!onSaveEdited) return;
    const selectedModules = moduleRows.filter(r => r.include).map(r => ({ name: r.name, vendor: r.vendor, version: r.version, comment: r.comment }));
    const selectedLicenses = licenseRows.filter(r => r.include).map(r => ({ name: r.name, vendor: r.vendor, expires: r.expires, comment: r.comment }));
    const selectedFilesystems = filesystemRows.filter(r => r.include).map(r => ({ path: r.path, free: r.free, total: r.total, usage: r.usage, comment: r.comment }));
    const selectedApplications = applicationRows.filter(r => r.include).map(r => ({ name: r.name, status: r.status, autostart: r.autostart, comment: r.comment }));
    const selectedCertificates = certificateRows.filter(r => r.include).map(r => ({ name: r.name, vendor: r.vendor, expires: r.expires, comment: r.comment }));
    
    const editedPayload = {
      ...data,
      review: {
        selectedModules,
        selectedLicenses,
        selectedFilesystems,
        selectedApplications,
        selectedCertificates
      },
      editedAt: new Date().toISOString()
    };
    await onSaveEdited(editedPayload);
    setModuleEditMode(false);
    setLicenseEditMode(false);
    setFilesystemEditMode(false);
    setApplicationEditMode(false);
    setCertificateEditMode(false);
  };

  const scrollToAnalysis = () => {
    // Prefer provided handler to switch to analysis tab where the Platform summary now lives
    if (onViewAnalysis) {
      onViewAnalysis();
      return;
    }
    // Fallback: try to scroll to analysis section anchor if present
    const el = document.getElementById('system-health-analysis');
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="space-y-4">
      {/* Success banner with next-step actions */}
      <div className="border-2 border-green-300 bg-green-50 rounded-lg p-6">
        <div className="flex items-center gap-3 mb-2">
          <CheckCircle2 className="h-6 w-6 text-green-600" />
          <div>
            <h4 className="font-medium text-green-800">Platform Details Imported</h4>
            <p className="text-sm text-green-600">{fileName}</p>
          </div>
        </div>
        <div className="text-sm text-gray-700 mb-4">
          The data has been saved. Review the full, professional summary below in the Saved Data card.
        </div>
        <div className="flex gap-3">
          <Button size="sm" className="gap-2" onClick={scrollToAnalysis}>
            <Eye className="h-4 w-4" />
            View in Analysis
          </Button>
          {onViewAnalysis && (
            <Button onClick={onViewAnalysis} variant="outline" size="sm" className="gap-2">
              <Activity className="h-4 w-4" />
              View in Analysis
            </Button>
          )}
          {onRemove && (
            <Button onClick={onRemove} variant="ghost" size="sm" className="gap-2">
              <Trash2 className="h-4 w-4" />
              Remove File
            </Button>
          )}
        </div>
      </div>

      {/* Full saved dataset card directly under the banner */}
      {effective?.summary && (
        <PlatformStoredCard
          title={/supervisor/i.test(fileName) ? 'Supervisor Platform' : 'Platform Details'}
          data={effective}
        />
      )}

      {/* Interactive Modules Table */}
      {modules.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-600" />
                Installed Modules ({modules.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-2 py-1 text-sm"
                  placeholder="Filter modules..."
                  value={moduleFilter}
                  onChange={(e) => setModuleFilter(e.target.value)}
                />
                <Button size="sm" variant="outline" onClick={() => setModuleEditMode(!moduleEditMode)}>
                  {moduleEditMode ? 'View' : 'Edit'}
                </Button>
                <Button size="sm" onClick={saveEdits} disabled={!moduleEditMode || !onSaveEdited}>
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[26rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Include</th>
                    <th className="text-left p-2">Module Name</th>
                    <th className="text-left p-2">Vendor</th>
                    <th className="text-left p-2">Version</th>
                    <th className="text-left p-2">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModules.map((r, idx) => (
                    <tr key={r.key} className="border-t">
                      <td className="p-2">
                        <input 
                          type="checkbox" 
                          checked={!!r.include} 
                          onChange={(e) => {
                            const copy = [...moduleRows];
                            const actualIdx = moduleRows.findIndex(x => x.key === r.key);
                            copy[actualIdx] = { ...copy[actualIdx], include: e.target.checked };
                            setModuleRows(copy);
                          }} 
                        />
                      </td>
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2">{r.vendor}</td>
                      <td className="p-2">
                        <Badge variant="secondary" className="text-xs">{r.version}</Badge>
                      </td>
                      <td className="p-2">
                        {moduleEditMode ? (
                          <input
                            className="w-full border rounded px-1 py-0.5"
                            placeholder="Optional note"
                            value={r.comment}
                            onChange={(e) => {
                              const copy = [...moduleRows];
                              const actualIdx = moduleRows.findIndex(x => x.key === r.key);
                              copy[actualIdx] = { ...copy[actualIdx], comment: e.target.value };
                              setModuleRows(copy);
                            }}
                          />
                        ) : (
                          <span className="text-gray-600 text-xs">{r.comment || '—'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Licenses Table */}
      {licenses.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-600" />
                License Information ({licenses.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-2 py-1 text-sm"
                  placeholder="Filter licenses..."
                  value={licenseFilter}
                  onChange={(e) => setLicenseFilter(e.target.value)}
                />
                <Button size="sm" variant="outline" onClick={() => setLicenseEditMode(!licenseEditMode)}>
                  {licenseEditMode ? 'View' : 'Edit'}
                </Button>
                <Button size="sm" onClick={saveEdits} disabled={!licenseEditMode || !onSaveEdited}>
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[26rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Include</th>
                    <th className="text-left p-2">License Name</th>
                    <th className="text-left p-2">Vendor</th>
                    <th className="text-left p-2">Expires</th>
                    <th className="text-left p-2">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLicenses.map((r) => (
                    <tr key={r.key} className="border-t">
                      <td className="p-2">
                        <input 
                          type="checkbox" 
                          checked={!!r.include} 
                          onChange={(e) => {
                            const copy = [...licenseRows];
                            const actualIdx = licenseRows.findIndex(x => x.key === r.key);
                            copy[actualIdx] = { ...copy[actualIdx], include: e.target.checked };
                            setLicenseRows(copy);
                          }} 
                        />
                      </td>
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2">{r.vendor}</td>
                      <td className="p-2">
                        <Badge variant={r.expires?.toLowerCase().includes('never') ? 'default' : 'outline'} className="text-xs">
                          {r.expires}
                        </Badge>
                      </td>
                      <td className="p-2">
                        {licenseEditMode ? (
                          <input
                            className="w-full border rounded px-1 py-0.5"
                            placeholder="Optional note"
                            value={r.comment}
                            onChange={(e) => {
                              const copy = [...licenseRows];
                              const actualIdx = licenseRows.findIndex(x => x.key === r.key);
                              copy[actualIdx] = { ...copy[actualIdx], comment: e.target.value };
                              setLicenseRows(copy);
                            }}
                          />
                        ) : (
                          <span className="text-gray-600 text-xs">{r.comment || '—'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Certificates Table */}
      {certificates.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Shield className="h-5 w-5 text-gray-600" />
                Certificates ({certificates.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-2 py-1 text-sm"
                  placeholder="Filter certificates..."
                  value={certificateFilter}
                  onChange={(e) => setCertificateFilter(e.target.value)}
                />
                <Button size="sm" variant="outline" onClick={() => setCertificateEditMode(!certificateEditMode)}>
                  {certificateEditMode ? 'View' : 'Edit'}
                </Button>
                <Button size="sm" onClick={saveEdits} disabled={!certificateEditMode || !onSaveEdited}>
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[26rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Include</th>
                    <th className="text-left p-2">Name</th>
                    <th className="text-left p-2">Vendor</th>
                    <th className="text-left p-2">Expires</th>
                    <th className="text-left p-2">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCertificates.map((r, idx) => (
                    <tr key={r.key} className="border-t">
                      <td className="p-2">
                        <input type="checkbox" checked={!!r.include} onChange={(e)=>{
                          const copy = [...certificateRows];
                          copy[idx] = { ...copy[idx], include: e.target.checked };
                          setCertificateRows(copy);
                        }} />
                      </td>
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2">
                        <Badge variant="secondary" className="text-xs">{r.vendor}</Badge>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">{r.expires}</Badge>
                      </td>
                      <td className="p-2">
                        {certificateEditMode ? (
                          <input
                            className="w-full border rounded px-1 py-0.5"
                            placeholder="Optional note"
                            value={r.comment}
                            onChange={(e)=>{
                              const copy = [...certificateRows];
                              copy[idx] = { ...copy[idx], comment: e.target.value };
                              setCertificateRows(copy);
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-500">{r.comment}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Filesystems Table */}
      {filesystems.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <HardDrive className="h-5 w-5 text-gray-600" />
                Filesystem Storage ({filesystems.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-2 py-1 text-sm"
                  placeholder="Filter filesystems..."
                  value={filesystemFilter}
                  onChange={(e) => setFilesystemFilter(e.target.value)}
                />
                <Button size="sm" variant="outline" onClick={() => setFilesystemEditMode(!filesystemEditMode)}>
                  {filesystemEditMode ? 'View' : 'Edit'}
                </Button>
                <Button size="sm" onClick={saveEdits} disabled={!filesystemEditMode || !onSaveEdited}>
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[26rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Include</th>
                    <th className="text-left p-2">Path</th>
                    <th className="text-left p-2">Free</th>
                    <th className="text-left p-2">Total</th>
                    <th className="text-left p-2">Usage</th>
                    <th className="text-left p-2">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFilesystems.map((r) => (
                    <tr key={r.key} className="border-t">
                      <td className="p-2">
                        <input 
                          type="checkbox" 
                          checked={!!r.include} 
                          onChange={(e) => {
                            const copy = [...filesystemRows];
                            const actualIdx = filesystemRows.findIndex(x => x.key === r.key);
                            copy[actualIdx] = { ...copy[actualIdx], include: e.target.checked };
                            setFilesystemRows(copy);
                          }} 
                        />
                      </td>
                      <td className="p-2 font-mono text-xs">{r.path}</td>
                      <td className="p-2">{r.free}</td>
                      <td className="p-2">{r.total}</td>
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Progress value={r.usage || 0} className="w-16 h-2" />
                          <span className="text-xs">{r.usage}%</span>
                        </div>
                      </td>
                      <td className="p-2">
                        {filesystemEditMode ? (
                          <input
                            className="w-full border rounded px-1 py-0.5"
                            placeholder="Optional note"
                            value={r.comment}
                            onChange={(e) => {
                              const copy = [...filesystemRows];
                              const actualIdx = filesystemRows.findIndex(x => x.key === r.key);
                              copy[actualIdx] = { ...copy[actualIdx], comment: e.target.value };
                              setFilesystemRows(copy);
                            }}
                          />
                        ) : (
                          <span className="text-gray-600 text-xs">{r.comment || '—'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interactive Applications Table */}
      {applications.length > 0 && (
        <Card className="border-gray-200">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-600" />
                Applications/Stations ({applications.length})
              </CardTitle>
              <div className="flex items-center gap-2">
                <input
                  className="border rounded px-2 py-1 text-sm"
                  placeholder="Filter applications..."
                  value={applicationFilter}
                  onChange={(e) => setApplicationFilter(e.target.value)}
                />
                <Button size="sm" variant="outline" onClick={() => setApplicationEditMode(!applicationEditMode)}>
                  {applicationEditMode ? 'View' : 'Edit'}
                </Button>
                <Button size="sm" onClick={saveEdits} disabled={!applicationEditMode || !onSaveEdited}>
                  Save
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="max-h-[26rem] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left p-2">Include</th>
                    <th className="text-left p-2">Application</th>
                    <th className="text-left p-2">Status</th>
                    <th className="text-left p-2">Ports</th>
                    <th className="text-left p-2">Autostart</th>
                    <th className="text-left p-2">Comment</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.map((r) => (
                    <tr key={r.key} className="border-t">
                      <td className="p-2">
                        <input 
                          type="checkbox" 
                          checked={!!r.include} 
                          onChange={(e) => {
                            const copy = [...applicationRows];
                            const actualIdx = applicationRows.findIndex(x => x.key === r.key);
                            copy[actualIdx] = { ...copy[actualIdx], include: e.target.checked };
                            setApplicationRows(copy);
                          }} 
                        />
                      </td>
                      <td className="p-2 font-medium">{r.name}</td>
                      <td className="p-2">
                        <Badge 
                          variant={r.status?.toLowerCase() === 'running' ? 'default' : 'secondary'} 
                          className="text-xs"
                        >
                          {r.status}
                        </Badge>
                      </td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-1">
                          {r.fox && <Badge variant="outline" className="text-xs">Fox: {r.fox}</Badge>}
                          {r.foxs && <Badge variant="outline" className="text-xs">FoxS: {r.foxs}</Badge>}
                          {r.http && <Badge variant="outline" className="text-xs">HTTP: {r.http}</Badge>}
                          {r.https && <Badge variant="outline" className="text-xs">HTTPS: {r.https}</Badge>}
                          {!r.fox && !r.foxs && !r.http && !r.https && <span className="text-xs text-gray-400">—</span>}
                        </div>
                      </td>
                      <td className="p-2">
                        <Badge variant="outline" className="text-xs">
                          {r.autostart ? 'Yes' : 'No'}
                        </Badge>
                      </td>
                      <td className="p-2">
                        {applicationEditMode ? (
                          <input
                            className="w-full border rounded px-1 py-0.5"
                            placeholder="Optional note"
                            value={r.comment}
                            onChange={(e) => {
                              const copy = [...applicationRows];
                              const actualIdx = applicationRows.findIndex(x => x.key === r.key);
                              copy[actualIdx] = { ...copy[actualIdx], comment: e.target.value };
                              setApplicationRows(copy);
                            }}
                          />
                        ) : (
                          <span className="text-gray-600 text-xs">{r.comment || '—'}</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
