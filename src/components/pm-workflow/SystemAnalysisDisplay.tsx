import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Info,
  TrendingUp,
  TrendingDown,
  Activity,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  Network,
  Calendar,
  Shield,
  Download,
  Eye,
  Save,
  Database
} from 'lucide-react';

import { NiagaraPlatformSummary } from './NiagaraPlatformSummary';
import { PlatformDataService } from '@/services/PlatformDataService';

interface SystemAnalysisDisplayProps {
  analysisData: any;
  sessionId?: string;
  onSaveBaseline?: () => void;
  onExportReport?: () => void;
  onViewDetails?: (section: string, data: any) => void;
}

export const SystemAnalysisDisplay: React.FC<SystemAnalysisDisplayProps> = ({
  analysisData,
  sessionId,
  onSaveBaseline,
  onExportReport,
  onViewDetails
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [supervisorPlatform, setSupervisorPlatform] = useState<any | null>(null);
  // Platform tab pagination & dataset selection state
  const [platformDatasetKey, setPlatformDatasetKey] = useState<string>('');
  const [modPage, setModPage] = useState(1);
  const [licPage, setLicPage] = useState(1);
  const [appPage, setAppPage] = useState(1);
  const [fsPage, setFsPage] = useState(1);

  // Resource tab dataset selection & pagination
  const [resourceDatasetKey, setResourceDatasetKey] = useState<string>('');
  const [kvPage, setKvPage] = useState(1);

  // Inventory tab state
  const [inventoryJaceKey, setInventoryJaceKey] = useState<string>('');
  const [invPages, setInvPages] = useState<{ bacnet: number; n2: number }>({ bacnet: 1, n2: 1 });
  const [invExpanded, setInvExpanded] = useState<Record<string, boolean>>({});
  const [invPagesPerJace, setInvPagesPerJace] = useState<Record<string, { bacnet: number; n2: number }>>({});
  const [invDeviceCols, setInvDeviceCols] = useState<Record<string, boolean>>({
    name: true,
    id: true,
    vendor: true,
    model: true,
    status: true,
    addr: true
  });

  // Initialize inventory selection when data arrives or tab opens
  React.useEffect(() => {
    if (activeTab !== 'inventory') return;
    const keys = Object.keys(analysisData?.jaces || {});
    if (keys.length > 0 && !inventoryJaceKey) {
      setInventoryJaceKey(keys[0]);
      setInvPages({ bacnet: 1, n2: 1 });
    }
  }, [activeTab, analysisData?.jaces, inventoryJaceKey]);

  // Debug logging to see what data we're receiving
  React.useEffect(() => {
    const firstJaceName = Object.keys(analysisData?.jaces || {})[0];
    const firstJaceData = analysisData?.jaces?.[firstJaceName];
    
    console.log('🎨 SystemAnalysisDisplay received data:', {
      hasAnalysisData: !!analysisData,
      keys: Object.keys(analysisData || {}),
      jaces: analysisData?.jaces ? Object.keys(analysisData.jaces) : [],
      firstJaceName,
      firstJaceData: {
        hasPlatform: !!firstJaceData?.platform,
        hasResources: !!firstJaceData?.resources,
        platformKeys: firstJaceData?.platform ? Object.keys(firstJaceData.platform) : [],
        resourceKeys: firstJaceData?.resources ? Object.keys(firstJaceData.resources) : [],
        platformAnalysis: firstJaceData?.platform?.analysis,
        resourceAnalysis: firstJaceData?.resources?.analysis,
        platformAnalysisKeys: firstJaceData?.platform?.analysis ? Object.keys(firstJaceData.platform.analysis) : [],
        resourceAnalysisKeys: firstJaceData?.resources?.analysis ? Object.keys(firstJaceData.resources.analysis) : []
      },
      fullStructure: JSON.stringify(analysisData, null, 2).substring(0, 1000) + '...' // First 1000 chars
    });
  }, [analysisData]);

  // Attempt to load persisted supervisor platform if not present in analysisData
  React.useEffect(() => {
    const loadPersisted = async () => {
      if (!sessionId) return;
      if (analysisData?.supervisor?.platform) return;
      try {
        const result = await PlatformDataService.getTridiumSystemData(sessionId);
        if (result.data?.supervisor?.platform) {
          setSupervisorPlatform(result.data.supervisor.platform);
        }
      } catch (e) {}
    };
    loadPersisted();
  }, [sessionId, analysisData?.supervisor?.platform]);

  // Extract platform and resource analysis - Enhanced to handle real data structures
  const firstJaceName = Object.keys(analysisData?.jaces || {})[0];
  const firstJaceData = analysisData?.jaces?.[firstJaceName];

  // Find any available platform data: supervisor-level, any JACE with platform, or persisted supervisorPlatform
  const findAnyPlatform = (): any | null => {
    if (analysisData?.supervisor?.platform) return analysisData.supervisor.platform;
    // Prefer a JACE named 'Supervisor' if present
    const jaceKeys = Object.keys(analysisData?.jaces || {});
    const supervisorKey = jaceKeys.find(k => /supervisor/i.test(k));
    if (supervisorKey && analysisData.jaces[supervisorKey]?.platform) {
      return analysisData.jaces[supervisorKey].platform;
    }
    // Otherwise first JACE that has a platform
    for (const k of jaceKeys) {
      const p = analysisData.jaces[k]?.platform;
      if (p) return p;
    }
    return supervisorPlatform || null;
  };

  const rawPlatform = findAnyPlatform();
  // Normalize platform shape: some sources wrap data under { type, data: { summary, modules, ... } }
  const platformDataPrimary = rawPlatform?.data ? rawPlatform.data : rawPlatform;

  // Build Supervisor + JACE platform dataset list for Platform tab
  const platformCandidates: { key: string; label: string; data: any }[] = React.useMemo(() => {
    const list: { key: string; label: string; data: any }[] = [];
    const pushIf = (key: string, label: string, data: any) => {
      if (!data) return;
      const normalized = data?.data ? data.data : data;
      list.push({ key, label, data: normalized });
    };
    pushIf('supervisor', 'Supervisor', analysisData?.supervisor?.platform || supervisorPlatform);
    Object.entries(analysisData?.jaces || {}).forEach(([k, v]: [string, any]) => pushIf(`jace:${k}`, k, (v as any)?.platform));
    return list;
  }, [analysisData?.supervisor?.platform, supervisorPlatform, JSON.stringify(Object.keys(analysisData?.jaces || {}))]);

  // Build Supervisor + JACE resource dataset list for Resources tab
  const resourceCandidates: { key: string; label: string; data: any }[] = React.useMemo(() => {
    const list: { key: string; label: string; data: any }[] = [];
    const pushIf = (key: string, label: string, data: any) => { if (data) list.push({ key, label, data }); };
    pushIf('supervisor', 'Supervisor', analysisData?.supervisor?.resources);
    Object.entries(analysisData?.jaces || {}).forEach(([k, v]: [string, any]) => pushIf(`jace:${k}`, k, (v as any)?.resources));
    return list;
  }, [analysisData?.supervisor?.resources, JSON.stringify(Object.keys(analysisData?.jaces || {}))]);

  // Select first dataset by default and reset pages when dataset changes
  React.useEffect(() => {
    if (platformCandidates.length > 0 && !platformDatasetKey) {
      setPlatformDatasetKey(platformCandidates[0].key);
    }
  }, [platformCandidates, platformDatasetKey]);

  React.useEffect(() => {
    setModPage(1); setLicPage(1); setAppPage(1); setFsPage(1);
  }, [platformDatasetKey]);

  // Default resource dataset selection when candidates become available
  React.useEffect(() => {
    if (resourceCandidates.length > 0 && !resourceDatasetKey) {
      setResourceDatasetKey(resourceCandidates[0].key);
    }
  }, [resourceCandidates, resourceDatasetKey]);

  // Reset resource pagination when dataset changes
  React.useEffect(() => {
    setKvPage(1);
  }, [resourceDatasetKey]);

  const platformAnalysis = platformDataPrimary?.analysis;
  const resourceAnalysis = firstJaceData?.resources?.analysis;
  
  // If no analysis data exists, create basic analysis from the raw data
  const extractBasicAnalysis = (data: any, type: 'platform' | 'resource') => {
    if (!data) return null;
    
    const baseScore = 85; // Default healthy score
    const alerts: any[] = [];
    const recommendations: string[] = [];
    
    if (type === 'platform' && data.summary) {
      // Check Niagara version for recommendations
      if (data.summary.daemonVersion && data.summary.daemonVersion < '4.12') {
        alerts.push({ severity: 'warning', message: `Niagara ${data.summary.daemonVersion} should be upgraded` });
        recommendations.push('Consider upgrading to latest Niagara version');
      }
      
      return { healthScore: baseScore, alerts, recommendations };
    }
    
    if (type === 'resource' && (data.metrics || data.performance)) {
      const metrics = data.metrics || data.performance || data;
      const cpuUsage = metrics.cpu?.usage || metrics.cpuUsage || 0;
      const memoryUsage = metrics.memory?.usage || metrics.memoryUsage || 0;
      
      let score = baseScore;
      
      if (cpuUsage > 80) {
        alerts.push({ severity: 'warning', message: `High CPU usage: ${cpuUsage}%` });
        recommendations.push('Monitor CPU usage and optimize processes');
        score -= 10;
      }
      
      if (memoryUsage > 80) {
        alerts.push({ severity: 'warning', message: `High memory usage: ${memoryUsage}%` });
        recommendations.push('Review memory usage patterns');
        score -= 10;
      }
      
      return { healthScore: Math.max(score, 0), alerts, recommendations };
    }
    
    return { healthScore: baseScore, alerts, recommendations };
  };
  
  // Use existing analysis or generate basic analysis from raw data
  const effectivePlatformAnalysis = platformAnalysis || extractBasicAnalysis(platformDataPrimary, 'platform');
  const effectiveResourceAnalysis = resourceAnalysis || extractBasicAnalysis(firstJaceData?.resources, 'resource');

  // Combine all alerts from different sources
  const allAlerts = [
    ...(effectivePlatformAnalysis?.alerts || []),
    ...(effectiveResourceAnalysis?.alerts || [])
  ];

  // Get overall health score (weighted average)
  const overallHealthScore = effectivePlatformAnalysis?.healthScore && effectiveResourceAnalysis?.healthScore
    ? Math.round((effectivePlatformAnalysis.healthScore * 0.4 + effectiveResourceAnalysis.healthScore * 0.6))
    : effectivePlatformAnalysis?.healthScore || effectiveResourceAnalysis?.healthScore || 0;

  // Get all recommendations
  const allRecommendations = [
    ...(effectivePlatformAnalysis?.recommendations || []),
    ...(effectiveResourceAnalysis?.recommendations || [])
  ];

  // Categorize alerts by severity
  const criticalAlerts = allAlerts.filter(alert => alert.severity === 'critical');
  const warningAlerts = allAlerts.filter(alert => alert.severity === 'warning');
  const infoAlerts = allAlerts.filter(alert => alert.severity === 'info');

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 70) return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    if (score >= 50) return 'text-orange-600 bg-orange-50 border-orange-200';
    return 'text-red-600 bg-red-50 border-red-200';
  };

  const getHealthScoreIcon = (score: number) => {
    if (score >= 90) return <CheckCircle2 className="h-5 w-5" />;
    if (score >= 70) return <AlertTriangle className="h-5 w-5" />;
    return <AlertCircle className="h-5 w-5" />;
  };

  // Fallback for when no data is available yet (allow supervisor-only platform display)
  if ((!analysisData || !analysisData.jaces || Object.keys(analysisData.jaces).length === 0) && !supervisorPlatform && !analysisData?.supervisor?.platform) {
    return (
      <div className="space-y-6">
        <Card className="border-2 border-gray-200 bg-gray-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-gray-400" />
              <div>
                <CardTitle className="text-xl text-gray-600">No Analysis Data Available</CardTitle>
                <p className="text-sm text-gray-500">
                  Upload Tridium export files to begin system analysis
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <Database className="h-16 w-16 mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500 mb-4">Start by uploading platform details, resource exports, or network files</p>
              <div className="flex justify-center gap-2">
                <Badge variant="outline">Platform Details (.txt)</Badge>
                <Badge variant="outline">Resource Export (.csv)</Badge>
                <Badge variant="outline">Network Export (.csv)</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div id="system-health-analysis" className="space-y-6">
      {/* Overall System Health Header */}
      <Card className={`border-2 ${getHealthScoreColor(overallHealthScore)}`}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {getHealthScoreIcon(overallHealthScore)}
              <div>
                <CardTitle className="text-xl">System Health Score: {overallHealthScore}/100</CardTitle>
                <p className="text-sm opacity-80">
                  Based on platform configuration, resource utilization, and capacity analysis
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {onSaveBaseline && (
                <Button onClick={onSaveBaseline} variant="outline" size="sm" className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Baseline
                </Button>
              )}
              {onExportReport && (
                <Button onClick={onExportReport} variant="outline" size="sm" className="gap-2">
                  <Download className="h-4 w-4" />
                  Export PDF
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Progress value={overallHealthScore} className="mb-4" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{criticalAlerts.length}</div>
              <div className="text-sm text-muted-foreground">Critical Issues</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{warningAlerts.length}</div>
              <div className="text-sm text-muted-foreground">Warnings</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {allRecommendations.length}
              </div>
              <div className="text-sm text-muted-foreground">Recommendations</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Critical Alerts - Always Visible */}
      {criticalAlerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription>
            <div className="space-y-2">
              <div className="font-semibold text-red-800">
                {criticalAlerts.length} Critical Issue{criticalAlerts.length > 1 ? 's' : ''} Require Immediate Attention
              </div>
              {criticalAlerts.slice(0, 3).map((alert, index) => (
                <div key={index} className="text-sm text-red-700">
                  • {alert.message}
                </div>
              ))}
              {criticalAlerts.length > 3 && (
                <div className="text-sm text-red-600">
                  and {criticalAlerts.length - 3} more critical issue{criticalAlerts.length - 3 > 1 ? 's' : ''}...
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Analysis Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="platform">Platform</TabsTrigger>
          <TabsTrigger value="resources">Resources</TabsTrigger>
          <TabsTrigger value="inventory">Inventory</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="recommendations">Actions</TabsTrigger>
        </TabsList>

        {/* System Overview */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Platform Summary */}
            {effectivePlatformAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    Platform Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Health Score</span>
                    <Badge className={getHealthScoreColor(effectivePlatformAnalysis.healthScore)}>
                      {effectivePlatformAnalysis.healthScore}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Platform Type</span>
                    <Badge variant="outline">{effectivePlatformAnalysis.platformType || 'Standard'}</Badge>
                  </div>
                  {effectivePlatformAnalysis.memoryUtilization && (
                    <div className="flex justify-between items-center">
                      <span>Memory Usage</span>
                      <Badge variant={effectivePlatformAnalysis.memoryUtilization > 85 ? 'destructive' :
                                    effectivePlatformAnalysis.memoryUtilization > 75 ? 'secondary' : 'default'}>
                        {effectivePlatformAnalysis.memoryUtilization}%
                      </Badge>
                    </div>
                  )}
                  {effectivePlatformAnalysis.diskUtilization && (
                    <div className="flex justify-between items-center">
                      <span>Disk Usage</span>
                      <Badge variant={effectivePlatformAnalysis.diskUtilization > 85 ? 'destructive' :
                                    effectivePlatformAnalysis.diskUtilization > 75 ? 'secondary' : 'default'}>
                        {effectivePlatformAnalysis.diskUtilization}%
                      </Badge>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span>Version Status</span>
                    <Badge variant={effectivePlatformAnalysis.versionCompatibility?.isSupported !== false ? 'default' : 'destructive'}>
                      {effectivePlatformAnalysis.versionCompatibility?.isSupported !== false ? 'Supported' : 'Unsupported'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Resource Summary */}
            {effectiveResourceAnalysis && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Resource Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span>Health Score</span>
                    <Badge className={getHealthScoreColor(effectiveResourceAnalysis.healthScore)}>
                      {effectiveResourceAnalysis.healthScore}/100
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>CPU Status</span>
                    <Badge variant={effectiveResourceAnalysis.resourceUtilization?.cpu?.status === 'critical' ? 'destructive' :
                                  effectiveResourceAnalysis.resourceUtilization?.cpu?.status === 'high' ? 'secondary' : 'default'}>
                      {effectiveResourceAnalysis.resourceUtilization?.cpu?.percentage || 0}% - {effectiveResourceAnalysis.resourceUtilization?.cpu?.status || 'normal'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Memory Status</span>
                    <Badge variant={effectiveResourceAnalysis.resourceUtilization?.memory?.status === 'critical' ? 'destructive' :
                                  effectiveResourceAnalysis.resourceUtilization?.memory?.status === 'high' ? 'secondary' : 'default'}>
                      {effectiveResourceAnalysis.resourceUtilization?.memory?.percentage || 0}% - {effectiveResourceAnalysis.resourceUtilization?.memory?.status || 'normal'}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>System Status</span>
                    <Badge variant="default">
                      Healthy
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Capacity Projections */}
          {resourceAnalysis?.performanceInsights?.capacityProjection && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Capacity Projections
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {resourceAnalysis.performanceInsights.capacityProjection.pointsMonthsRemaining && (
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Points License</div>
                      <div className="text-lg font-semibold">
                        ~{resourceAnalysis.performanceInsights.capacityProjection.pointsMonthsRemaining} months remaining
                      </div>
                    </div>
                  )}
                  {resourceAnalysis.performanceInsights.capacityProjection.devicesMonthsRemaining && (
                    <div className="p-3 border rounded-lg">
                      <div className="text-sm text-muted-foreground">Device License</div>
                      <div className="text-lg font-semibold">
                        ~{resourceAnalysis.performanceInsights.capacityProjection.devicesMonthsRemaining} months remaining
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Platform Details (RAW, paginated) */}
        <TabsContent value="platform" className="space-y-4">
          {platformCandidates.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>No platform data available yet.</AlertDescription>
            </Alert>
          ) : (
            <>
              {/* Dataset Switcher */}
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Dataset:</span>
                <select className="border rounded px-2 py-1 text-sm" value={platformDatasetKey} onChange={e => setPlatformDatasetKey(e.target.value)}>
                  {platformCandidates.map(c => (
                    <option key={c.key} value={c.key}>{c.label}</option>
                  ))}
                </select>
              </div>

              {(() => {
                const selected = platformCandidates.find(c => c.key === platformDatasetKey)?.data || platformCandidates[0].data;
                const modules = Array.isArray(selected.modules) ? selected.modules : (selected.modules ? Object.values(selected.modules) : []);
                const licenses = Array.isArray(selected.licenses) ? selected.licenses : [];
                const apps = Array.isArray(selected.applications) ? selected.applications : [];
                const filesystems = Array.isArray(selected.filesystems) ? selected.filesystems : [];

                const pageSlice = (arr: any[], page: number, size: number) => arr.slice((page-1)*size, Math.min((page)*size, arr.length));

                return (
                  <>
                    {/* Summary */}
                    {selected.summary && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Server className="h-5 w-5" />
                            {platformDatasetKey === 'supervisor' ? 'Supervisor Platform' : `${platformDatasetKey.replace('jace:','')} Platform`}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <NiagaraPlatformSummary 
                            summary={selected.summary} 
                            filesystems={selected.filesystems || []} 
                            applications={apps}
                          />
                        </CardContent>
                      </Card>
                    )}

                    {/* Modules - paginated */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>Modules ({modules.length})</span>
                          <span className="text-xs text-muted-foreground">Page {modPage}/{Math.max(1, Math.ceil(modules.length/50))}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 max-h-[28rem] overflow-y-auto">
                          {pageSlice(modules, modPage, 50).map((m: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{m?.name || m}</span>
                                {m?.vendor && <Badge variant="secondary">{m.vendor}</Badge>}
                              </div>
                              <div className="flex items-center gap-2">
                                <span>{m?.version || ''}</span>
                                {Array.isArray(m?.profiles) && m.profiles.map((p: string) => (
                                  <Badge key={p} variant="outline" className="text-2xs">{p}</Badge>
                                ))}
                              </div>
                            </div>
                          ))}
                          {modules.length === 0 && <div className="text-sm text-muted-foreground">No modules listed.</div>}
                        </div>
                        {modules.length > 50 && (
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <Button size="sm" variant="outline" onClick={() => setModPage(p => Math.max(p-1,1))} disabled={modPage===1}>Prev</Button>
                            <Button size="sm" variant="outline" onClick={() => setModPage(p => p+1)} disabled={modPage>=Math.ceil(modules.length/50)}>Next</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Licenses - paginated */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>Licenses ({licenses.length})</span>
                          <span className="text-xs text-muted-foreground">Page {licPage}/{Math.max(1, Math.ceil(licenses.length/50))}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-1 max-h-[20rem] overflow-y-auto">
                          {pageSlice(licenses, licPage, 50).map((l: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs p-2 bg-gray-50 rounded">
                              <span>{l.name}</span>
                              <div className="flex items-center gap-2">
                                {l.vendor && <Badge variant="outline">{l.vendor}</Badge>}
                                <span>{l.version}</span>
                                <Badge variant="outline">{l.expires}</Badge>
                              </div>
                            </div>
                          ))}
                          {licenses.length === 0 && <div className="text-sm text-muted-foreground">No licenses listed.</div>}
                        </div>
                        {licenses.length > 50 && (
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <Button size="sm" variant="outline" onClick={() => setLicPage(p => Math.max(p-1,1))} disabled={licPage===1}>Prev</Button>
                            <Button size="sm" variant="outline" onClick={() => setLicPage(p => p+1)} disabled={licPage>=Math.ceil(licenses.length/50)}>Next</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Applications - Enhanced Table with Ports & Status */}
                    {apps.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Activity className="h-5 w-5" />
                              <span>Applications</span>
                              <Badge variant="secondary">{apps.length}</Badge>
                            </div>
                            {apps.length > 50 && (
                              <span className="text-xs text-muted-foreground">Page {appPage}/{Math.ceil(apps.length/50)}</span>
                            )}
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
                                  <th className="text-left py-2 px-3 font-medium">FOX</th>
                                  <th className="text-left py-2 px-3 font-medium">FOXS</th>
                                  <th className="text-left py-2 px-3 font-medium">HTTP</th>
                                  <th className="text-left py-2 px-3 font-medium">HTTPS</th>
                                </tr>
                              </thead>
                              <tbody>
                                {pageSlice(apps, appPage, 50).map((a: any, i: number) => {
                                  const statusLower = (a.status || '').toLowerCase();
                                  const statusColor = statusLower.includes('running') || statusLower.includes('ok')
                                    ? 'bg-green-500 text-white'
                                    : statusLower.includes('stopped') || statusLower.includes('disabled')
                                    ? 'bg-gray-400 text-white'
                                    : statusLower.includes('error') || statusLower.includes('fault')
                                    ? 'bg-red-500 text-white'
                                    : 'border';
                                  
                                  return (
                                    <tr key={i} className="border-b hover:bg-gray-50">
                                      <td className="py-2 px-3 font-medium">{a.name || '-'}</td>
                                      <td className="py-2 px-3">
                                        <Badge variant="outline" className="text-xs">{a.type || 'station'}</Badge>
                                      </td>
                                      <td className="py-2 px-3">
                                        {a.status && (
                                          <Badge className={`text-xs ${statusColor}`}>
                                            {a.status}
                                          </Badge>
                                        )}
                                        {!a.status && <span className="text-gray-400">—</span>}
                                      </td>
                                      <td className="py-2 px-3">
                                        <Badge variant={a.autostart ? 'default' : 'secondary'} className="text-xs">
                                          {a.autostart ? 'Yes' : 'No'}
                                        </Badge>
                                      </td>
                                      <td className="py-2 px-3 text-xs">
                                        {a.fox ? <Badge variant="outline">{a.fox}</Badge> : <span className="text-gray-400">—</span>}
                                      </td>
                                      <td className="py-2 px-3 text-xs">
                                        {a.foxs ? <Badge variant="outline">{a.foxs}</Badge> : <span className="text-gray-400">—</span>}
                                      </td>
                                      <td className="py-2 px-3 text-xs">
                                        {a.http ? <Badge variant="outline">{a.http}</Badge> : <span className="text-gray-400">—</span>}
                                      </td>
                                      <td className="py-2 px-3 text-xs">
                                        {a.https ? <Badge variant="outline">{a.https}</Badge> : <span className="text-gray-400">—</span>}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          {apps.length > 50 && (
                            <div className="flex items-center justify-end gap-2 mt-4">
                              <Button size="sm" variant="outline" onClick={() => setAppPage(p => Math.max(p-1,1))} disabled={appPage===1}>Previous</Button>
                              <span className="text-sm text-muted-foreground">Page {appPage} of {Math.ceil(apps.length/50)}</span>
                              <Button size="sm" variant="outline" onClick={() => setAppPage(p => p+1)} disabled={appPage>=Math.ceil(apps.length/50)}>Next</Button>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Filesystems - paginated */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base flex items-center justify-between">
                          <span>Filesystems ({filesystems.length})</span>
                          <span className="text-xs text-muted-foreground">Page {fsPage}/{Math.max(1, Math.ceil(filesystems.length/50))}</span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="max-h-[20rem] overflow-y-auto">
                          <div className="grid grid-cols-5 gap-2 text-xs font-medium mb-2">
                            <div>Path</div><div>Free (KB)</div><div>Total (KB)</div><div>Files</div><div>Max Files</div>
                          </div>
                          {pageSlice(filesystems, fsPage, 50).map((fs: any, i: number) => (
                            <div key={i} className="grid grid-cols-5 gap-2 text-xs p-1 border-b">
                              <div>{fs.path}</div>
                              <div>{fs.free}</div>
                              <div>{fs.total}</div>
                              <div>{fs.files}</div>
                              <div>{fs.maxFiles}</div>
                            </div>
                          ))}
                        </div>
                        {filesystems.length > 50 && (
                          <div className="flex items-center justify-end gap-2 mt-2">
                            <Button size="sm" variant="outline" onClick={() => setFsPage(p => Math.max(p-1,1))} disabled={fsPage===1}>Prev</Button>
                            <Button size="sm" variant="outline" onClick={() => setFsPage(p => p+1)} disabled={fsPage>=Math.ceil(filesystems.length/50)}>Next</Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </>
                );
              })()}
            </>
          )}
        </TabsContent>

        {/* Inventory (by JACE, paginated tables per driver) */}
        <TabsContent value="inventory" className="space-y-4">
          {(() => {
            const jaceKeys = Object.keys(analysisData?.jaces || {});
            if (jaceKeys.length === 0) {
              return (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>No JACE inventory available. Import driver exports (BACnet, N2, etc.).</AlertDescription>
                </Alert>
              );
            }

            const selectedKey = inventoryJaceKey || jaceKeys[0];
            const selected = analysisData?.jaces?.[selectedKey] || {};
            const bacnet = selected?.drivers?.bacnet?.devices || [];
            const n2 = selected?.drivers?.n2?.devices || [];
            
            const cols = invDeviceCols;

            // simple column toggles
            const [showBac, setShowBac] = [true, () => {}]; // placeholders for static render
            

            const pageSize = 50;
            const slice = (arr: any[], page: number) => arr.slice((page-1)*pageSize, Math.min(page*pageSize, arr.length));
            const statusText = (s: any) => Array.isArray(s) ? s.join(', ') : (s || '');

            return (
              <>
                {/* JACE index summary */}
                <Card>
                  <CardHeader><CardTitle className="text-base">JACE Index</CardTitle></CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="text-left p-2">JACE</th>
                            <th className="text-left p-2">Platform</th>
                            <th className="text-left p-2">Version</th>
                            <th className="text-left p-2">BACnet Devices</th>
                            <th className="text-left p-2">N2 Devices</th>
                            <th className="text-left p-2">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {jaceKeys.map(k => {
                            const j = (analysisData?.jaces || {})[k] || {};
                            return (
                              <tr key={k} className="border-t">
                                <td className="p-2 font-medium">{k}</td>
                                <td className="p-2">{j.platform?.summary?.model || '—'}</td>
                                <td className="p-2">{j.platform?.summary?.niagaraRuntime || j.platform?.system?.niagara_version || '—'}</td>
                                <td className="p-2">{j.drivers?.bacnet?.devices?.length || 0}</td>
                                <td className="p-2">{j.drivers?.n2?.devices?.length || 0}</td>
                                <td className="p-2">
                                  <Button size="sm" variant="outline" onClick={() => setInvExpanded(prev => ({...prev, [k]: !prev[k]}))}>
                                    {invExpanded[k] ? 'Hide' : 'Show'} Devices
                                  </Button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </CardContent>
                </Card>

                {/* Expanded JACE device sections */}
                {jaceKeys.filter(k => invExpanded[k]).map(k => {
                  const j = (analysisData?.jaces || {})[k] || {};
                  const bacnetDevices = j.drivers?.bacnet?.devices || [];
                  const n2Devices = j.drivers?.n2?.devices || [];
                  const pages = invPagesPerJace[k] || { bacnet: 1, n2: 1 };
                  const pageSizeLocal = 50;
                  const sliceLocal = (arr: any[], page: number) => arr.slice((page-1)*pageSizeLocal, Math.min(page*pageSizeLocal, arr.length));

                  return (
                    <div key={`${k}-devices`} className="space-y-4">
                      <div className="flex flex-wrap gap-3 text-xs">
                        <span className="font-medium">Columns:</span>
                        {(['name','id','vendor','model','status','addr'] as const).map(c => (
                          <label key={c} className="flex items-center gap-1">
                            <input type="checkbox" checked={!!cols[c]} onChange={(e)=>setInvDeviceCols(prev=>({ ...prev, [c]: e.target.checked }))} /> {c}
                          </label>
                        ))}
                      </div>

                      {/* BACnet devices */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            <span>{k} — BACnet Devices ({bacnetDevices.length})</span>
                            {bacnetDevices.length > pageSizeLocal && (
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={()=> setInvPagesPerJace(p=>({ ...p, [k]: { ...(p[k]||{bacnet:1,n2:1}), bacnet: Math.max(1, (p[k]?.bacnet||1)-1) } }))} disabled={(pages.bacnet||1)===1}>Prev</Button>
                                <span className="text-xs text-muted-foreground">Page {pages.bacnet||1}/{Math.max(1, Math.ceil(bacnetDevices.length/pageSizeLocal))}</span>
                                <Button size="sm" variant="outline" onClick={()=> setInvPagesPerJace(p=>({ ...p, [k]: { ...(p[k]||{bacnet:1,n2:1}), bacnet: Math.min(Math.max(1, Math.ceil(bacnetDevices.length/pageSizeLocal)), (p[k]?.bacnet||1)+1) } }))} disabled={(pages.bacnet||1) >= Math.ceil(bacnetDevices.length/pageSizeLocal)}>Next</Button>
                              </div>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {bacnetDevices.length === 0 ? (
                            <div className="text-xs text-muted-foreground">No BACnet devices.</div>
                          ) : (
                            <div className="max-h-[24rem] overflow-y-auto border rounded">
                              <div className="grid grid-cols-6 gap-2 text-xs font-medium p-2 bg-white sticky top-0">
                                {cols.name && <div>Name</div>}
                                {cols.id && <div>Device ID</div>}
                                {cols.vendor && <div>Vendor</div>}
                                {cols.model && <div>Model/FW</div>}
                                {cols.status && <div>Status</div>}
                                {cols.addr && <div>MAC/Net</div>}
                              </div>
                              {sliceLocal(bacnetDevices, pages.bacnet||1).map((d:any,i:number)=> (
                                <div key={i} className="grid grid-cols-6 gap-2 text-xs p-2 border-t bg-white">
                                  {cols.name && <div className="truncate">{d.name}</div>}
                                  {cols.id && <div>{d.id ?? d.deviceId}</div>}
                                  {cols.vendor && <div>{d.vendor}</div>}
                                  {cols.model && <div>{d.model}{d.firmwareRev?` / ${d.firmwareRev}`:''}</div>}
                                  {cols.status && <div>{Array.isArray(d.status)? d.status.join(', '): (d.status||'')}</div>}
                                  {cols.addr && <div>{d.macAddress}{d.networkId?` / ${d.networkId}`:''}</div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>

                      {/* N2 devices */}
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base flex items-center justify-between">
                            <span>{k} — N2 Devices ({n2Devices.length})</span>
                            {n2Devices.length > pageSizeLocal && (
                              <div className="flex items-center gap-2">
                                <Button size="sm" variant="outline" onClick={()=> setInvPagesPerJace(p=>({ ...p, [k]: { ...(p[k]||{bacnet:1,n2:1}), n2: Math.max(1, (p[k]?.n2||1)-1) } }))} disabled={(pages.n2||1)===1}>Prev</Button>
                                <span className="text-xs text-muted-foreground">Page {pages.n2||1}/{Math.max(1, Math.ceil(n2Devices.length/pageSizeLocal))}</span>
                                <Button size="sm" variant="outline" onClick={()=> setInvPagesPerJace(p=>({ ...p, [k]: { ...(p[k]||{bacnet:1,n2:1}), n2: Math.min(Math.max(1, Math.ceil(n2Devices.length/pageSizeLocal)), (p[k]?.n2||1)+1) } }))} disabled={(pages.n2||1) >= Math.ceil(n2Devices.length/pageSizeLocal)}>Next</Button>
                              </div>
                            )}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {n2Devices.length === 0 ? (
                            <div className="text-xs text-muted-foreground">No N2 devices.</div>
                          ) : (
                            <div className="max-h-[24rem] overflow-y-auto border rounded">
                              <div className="grid grid-cols-6 gap-2 text-xs font-medium p-2 bg-white sticky top-0">
                                {cols.name && <div>Name</div>}
                                {cols.id && <div>Address</div>}
                                {cols.vendor && <div>Type</div>}
                                {cols.model && <div>—</div>}
                                {cols.status && <div>Status</div>}
                                {cols.addr && <div>Notes</div>}
                              </div>
                              {sliceLocal(n2Devices, pages.n2||1).map((d:any,i:number)=> (
                                <div key={i} className="grid grid-cols-6 gap-2 text-xs p-2 border-t bg-white">
                                  {cols.name && <div className="truncate">{d.name}</div>}
                                  {cols.id && <div>{d.address}</div>}
                                  {cols.vendor && <div>{d.controllerType || d.type}</div>}
                                  {cols.model && <div></div>}
                                  {cols.status && <div>{Array.isArray(d.status)? d.status.join(', '): (d.status||'')}</div>}
                                  {cols.addr && <div></div>}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </>
            );
          })()}
        </TabsContent>

        {/* Resource Details (RAW, paginated with dataset selector) */}
        <TabsContent value="resources" className="space-y-4">
          {resourceCandidates.length === 0 ? (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>No resource data available yet. Upload ResourceExport.csv.</AlertDescription>
            </Alert>
          ) : (() => {
            const selected = resourceCandidates.find(c => c.key === resourceDatasetKey)?.data || resourceCandidates[0].data;

            // Normalize
            const metrics = selected.metrics || selected.performance || selected;
            const capacities = metrics.capacities || {};
            const perf = metrics.performance || metrics;

            // Build raw entries from parsed raw[] if available; otherwise flatten primitive metrics
            const rawKV: Array<[string, any]> = Array.isArray((selected as any).raw)
              ? (selected as any).raw.map((r: any) => [r.name ?? '', r.value])
              : Object.entries(metrics).filter(([k, v]) => typeof v !== 'object');
            const entries = rawKV;
            const pageSize = 50;
            const pageSlice = (arr: any[], page: number) => arr.slice((page-1)*pageSize, Math.min(page*pageSize, arr.length));

            return (
              <>
                {/* Dataset switcher */}
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Dataset:</span>
                  <select className="border rounded px-2 py-1 text-sm" value={resourceDatasetKey} onChange={e => setResourceDatasetKey(e.target.value)}>
                    {resourceCandidates.map(c => (<option key={c.key} value={c.key}>{c.label}</option>))}
                  </select>
                </div>

                {/* Quick Metrics */}
                <Card>
                  <CardHeader><CardTitle>Performance Metrics</CardTitle></CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-3 bg-white rounded border">
                        <div className="text-sm text-gray-500">CPU Usage</div>
                        <div className="text-2xl font-bold">{perf.cpuUsage ?? perf.cpu?.usage ?? 0}%</div>
                        <Progress value={perf.cpuUsage ?? perf.cpu?.usage ?? 0} className="mt-2" />
                      </div>
                      <div className="text-center p-3 bg-white rounded border">
                        <div className="text-sm text-gray-500">Memory Usage</div>
                        {(() => { const memPct = (perf.memory?.usage ?? (perf.memory?.total ? Math.round((perf.memory.used / perf.memory.total) * 100) : 0)); return (
                          <>
                            <div className="text-2xl font-bold">{memPct}%</div>
                            <Progress value={memPct} className="mt-2" />
                          </>
                        ); })()}
                      </div>
                      <div className="text-center p-3 bg-white rounded border">
                        <div className="text-sm text-gray-500">Uptime</div>
                        <div className="text-2xl font-bold">{perf.uptime || metrics.uptime || '—'}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Capacities */}
                {capacities && (
                  <Card>
                    <CardHeader><CardTitle>Capacities</CardTitle></CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                        {Object.entries(capacities).map(([name, cap]: [string, any]) => (
                          <div key={name} className="p-2 bg-gray-50 rounded border">
                            <div className="font-medium capitalize">{name}</div>
                            <div className="text-xs text-gray-600">{(cap as any).current ?? (cap as any).used ?? 0} / {(cap as any).limit ?? (cap as any).max ?? '∞'}</div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Raw key-value metrics table (paginated) */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center justify-between">
                      <span>Raw Metrics</span>
                      <span className="text-xs text-muted-foreground">Page {kvPage}/{Math.max(1, Math.ceil(entries.length/pageSize))}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="max-h-[26rem] overflow-y-auto">
                      {pageSlice(entries, kvPage).map(([k, v]) => (
                        <div key={k} className="grid grid-cols-3 gap-2 text-xs p-2 border-b">
                          <div className="font-medium">{k}</div>
                          <div className="col-span-2 text-gray-700 break-all">{String(v)}</div>
                        </div>
                      ))}
                      {entries.length === 0 && <div className="text-sm text-muted-foreground">No primitive metrics to display.</div>}
                    </div>
                    {entries.length > pageSize && (
                      <div className="flex items-center justify-end gap-2 mt-2">
                        <Button size="sm" variant="outline" onClick={() => setKvPage(p => Math.max(p-1,1))} disabled={kvPage===1}>Prev</Button>
                        <Button size="sm" variant="outline" onClick={() => setKvPage(p => p+1)} disabled={kvPage>=Math.ceil(entries.length/pageSize)}>Next</Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            );
          })()}
        </TabsContent>

        {/* All Alerts */}
        <TabsContent value="alerts" className="space-y-4">
          {allAlerts.length > 0 ? (
            <>
              {criticalAlerts.length > 0 && (
                <Card className="border-red-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-red-600">
                      <AlertCircle className="h-5 w-5" />
                      Critical Issues ({criticalAlerts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {criticalAlerts.map((alert, index) => (
                        <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                          <div className="font-medium text-red-800">{alert.message}</div>
                          {alert.threshold && alert.value && (
                            <div className="text-sm text-red-600 mt-1">
                              Threshold: {alert.threshold}% | Current: {alert.value}%
                            </div>
                          )}
                          <div className="text-xs text-red-500 capitalize mt-1">
                            Category: {alert.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {warningAlerts.length > 0 && (
                <Card className="border-yellow-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-600">
                      <AlertTriangle className="h-5 w-5" />
                      Warnings ({warningAlerts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {warningAlerts.map((alert, index) => (
                        <div key={index} className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div className="font-medium text-yellow-800">{alert.message}</div>
                          {alert.threshold && alert.value && (
                            <div className="text-sm text-yellow-600 mt-1">
                              Threshold: {alert.threshold}% | Current: {alert.value}%
                            </div>
                          )}
                          <div className="text-xs text-yellow-500 capitalize mt-1">
                            Category: {alert.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {infoAlerts.length > 0 && (
                <Card className="border-blue-200">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-blue-600">
                      <Info className="h-5 w-5" />
                      Information ({infoAlerts.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {infoAlerts.map((alert, index) => (
                        <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                          <div className="font-medium text-blue-800">{alert.message}</div>
                          <div className="text-xs text-blue-500 capitalize mt-1">
                            Category: {alert.category}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                No alerts found. System appears to be operating within normal parameters.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Recommendations */}
        <TabsContent value="recommendations" className="space-y-4">
          {allRecommendations.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recommended Actions ({allRecommendations.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {allRecommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 border rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium">{recommendation}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Alert>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription>
                No specific recommendations at this time. System appears to be well-configured.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};