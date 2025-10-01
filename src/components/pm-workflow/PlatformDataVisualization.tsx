import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Cpu,
  HardDrive,
  Settings,
  Database,
  Shield,
  Clock,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Info
} from 'lucide-react';
import { PlatformDataService, type PlatformData, type TridiumSystemData } from '@/services/PlatformDataService';
import { PlatformBenchmarkDashboard } from './PlatformBenchmarkDashboard';

interface PlatformDataVisualizationProps {
  sessionId: string;
  showComparison?: boolean;
  customerId?: string; // For benchmarking dashboard
}

export const PlatformDataVisualization: React.FC<PlatformDataVisualizationProps> = ({
  sessionId,
  showComparison = true,
  customerId
}) => {
  const [platformData, setPlatformData] = useState<PlatformData | null>(null);
  const [tridiumSystemData, setTridiumSystemData] = useState<TridiumSystemData | null>(null);
  const [comparison, setComparison] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPlatformData();
  }, [sessionId]);

  const loadPlatformData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Load platform data (legacy format)
      const dataResult = await PlatformDataService.getPlatformData(sessionId);
      if (!dataResult.error && dataResult.data) {
        setPlatformData(dataResult.data);
      }

      // Load comprehensive Tridium system data
      const systemDataResult = await PlatformDataService.getTridiumSystemData(sessionId);
      if (!systemDataResult.error && systemDataResult.data) {
        setTridiumSystemData(systemDataResult.data);
      }

      // If no data found from either source, set error
      if ((dataResult.error || !dataResult.data) && (systemDataResult.error || !systemDataResult.data)) {
        setError('No system data found for this session');
        return;
      }

      // Load comparison data if requested and we have platform data
      if (showComparison && (dataResult.data || systemDataResult.data)) {
        const comparisonResult = await PlatformDataService.comparePlatformData(sessionId);
        if (!comparisonResult.error) {
          setComparison(comparisonResult.comparison);
        }
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load system data');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Loading platform data...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 text-amber-600">
            <AlertTriangle className="h-5 w-5" />
            <span>No platform data available</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Platform data will appear here after importing a platform details file.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (!platformData && !tridiumSystemData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3 text-gray-600">
            <Info className="h-5 w-5" />
            <span>No system data found for this session</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderSystemChanges = () => {
    if (!comparison || !comparison.changes) return null;

    const changes = comparison.changes;
    const hasChanges = Object.values(changes).some(Boolean);

    if (!hasChanges) {
      return (
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle2 className="h-4 w-4" />
          <span className="text-sm">No system changes detected</span>
        </div>
      );
    }

    return (
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-amber-600">
          <AlertTriangle className="h-4 w-4" />
          <span className="text-sm font-medium">System changes detected:</span>
        </div>
        <div className="space-y-1 text-sm">
          {changes.versionChanged && (
            <div className="text-amber-700">• Niagara version changed</div>
          )}
          {changes.hardwareChanged && (
            <div className="text-amber-700">• Hardware configuration changed</div>
          )}
          {changes.tlsChanged && (
            <div className="text-amber-700">• TLS configuration changed</div>
          )}
          {changes.profilesChanged && (
            <div className="text-amber-700">• Runtime profiles changed</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with System Status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cpu className="h-6 w-6 text-blue-500" />
              <div>
                <CardTitle className="text-lg">Platform Overview</CardTitle>
                <p className="text-sm text-gray-600">
                  {platformData?.summary.model || 'Unknown Model'} {platformData?.summary.product || ''} •
                  Niagara {platformData?.summary.daemonVersion || 'Unknown Version'} •
                  {tridiumSystemData ? `${tridiumSystemData.architecture} Architecture` : (platformData?.summary.hostIdStatus + ' License' || 'Unknown License')}
                </p>
              </div>
            </div>
            {comparison && (
              <div className="text-right">
                <Badge variant="outline" className="text-xs">
                  {comparison.previousVisits} previous visits
                </Badge>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showComparison && comparison && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg">
              {renderSystemChanges()}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Platform Information */}
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-7">
          <TabsTrigger value="summary">📊 Summary</TabsTrigger>
          <TabsTrigger value="jaces">🖥️ JACEs</TabsTrigger>
          <TabsTrigger value="drivers">🔌 Drivers</TabsTrigger>
          <TabsTrigger value="devices">📱 Devices</TabsTrigger>
          <TabsTrigger value="security">🔒 Security</TabsTrigger>
          <TabsTrigger value="system">💻 System</TabsTrigger>
          <TabsTrigger value="benchmark">📈 Benchmark</TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Cpu className="h-4 w-4" />
                <span>Platform Summary</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <div className="font-medium mb-2">Hardware Platform</div>
                  <div className="space-y-1">
                    <div>Model: <Badge variant="outline">{platformData.summary.model}</Badge></div>
                    <div>Product: <Badge variant="outline">{platformData.summary.product}</Badge></div>
                    <div>Architecture: <Badge variant="outline">{platformData.summary.architecture}</Badge></div>
                    <div>CPUs: <Badge variant="outline">{platformData.summary.cpuCount}</Badge></div>
                    <div>Host ID: <Badge variant="outline" className="text-xs">{platformData.summary.hostId}</Badge></div>
                    <div>License: <Badge variant="outline">{platformData.summary.hostIdStatus}</Badge></div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2">Niagara Platform</div>
                  <div className="space-y-1">
                    <div>Version: <Badge variant="outline">{platformData.summary.daemonVersion}</Badge></div>
                    <div>Runtime: <Badge variant="outline" className="text-xs">{platformData.summary.niagaraRuntime}</Badge></div>
                    <div>HTTP Port: <Badge variant="outline">{platformData.summary.daemonHttpPort}</Badge></div>
                    <div>TLS Port: <Badge variant="outline">{platformData.summary.port}</Badge></div>
                    <div>Stations: <Badge variant="outline">{platformData.summary.niagaraStationsEnabled}</Badge></div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-2">System Environment</div>
                  <div className="space-y-1">
                    <div>OS: <Badge variant="outline" className="text-xs">{platformData.summary.operatingSystem}</Badge></div>
                    <div>Java: <Badge variant="outline" className="text-xs">{platformData.summary.javaVirtualMachine}</Badge></div>
                    <div>Profiles: <div className="flex flex-wrap gap-1 mt-1">{platformData.summary.enabledRuntimeProfiles.map(profile => (
                      <Badge key={profile} variant="secondary" className="text-xs">{profile}</Badge>
                    ))}</div></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Shield className="h-4 w-4" />
                <span>Security Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="font-medium mb-3">TLS Configuration</div>
                  <div className="space-y-2 text-sm">
                    <div>Support: <Badge variant="outline">{platformData.summary.platformTlsSupport}</Badge></div>
                    <div>Protocol: <Badge variant="outline">{platformData.summary.protocol}</Badge></div>
                    <div>Certificate: <Badge variant="outline">{platformData.summary.certificate}</Badge></div>
                    <div>TLS Port: <Badge variant="outline">{platformData.summary.port}</Badge></div>
                  </div>
                </div>
                <div>
                  <div className="font-medium mb-3">System Access</div>
                  <div className="space-y-2 text-sm">
                    <div>HTTP Port: <Badge variant="outline">{platformData.summary.daemonHttpPort}</Badge></div>
                    <div>Host ID Status: <Badge variant="outline">{platformData.summary.hostIdStatus}</Badge></div>
                    <div>Niagara Stations: <Badge variant="outline">{platformData.summary.niagaraStationsEnabled}</Badge></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="modules">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Installed Modules ({platformData.modules.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="max-h-64 overflow-y-auto">
                <div className="grid gap-2">
                  {platformData.modules.map((module, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 border rounded-lg">
                      <div>
                        <div className="font-medium text-sm">{module.name}</div>
                        <div className="text-xs text-gray-600">{module.vendor}</div>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline" className="text-xs">{module.version}</Badge>
                        {module.profiles.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {module.profiles.map(profile => (
                              <Badge key={profile} variant="secondary" className="text-xs">{profile}</Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <HardDrive className="h-4 w-4" />
                <span>System Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <div className="font-medium mb-2">System Paths</div>
                  <div className="space-y-1 text-sm">
                    <div>System Home: <code className="text-xs bg-gray-100 px-1 rounded">{platformData.summary.systemHome}</code></div>
                    <div>User Home: <code className="text-xs bg-gray-100 px-1 rounded">{platformData.summary.userHome}</code></div>
                  </div>
                </div>

                {platformData.filesystems.length > 0 && (
                  <div>
                    <div className="font-medium mb-2">Filesystem Information</div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full text-xs border">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="p-2 text-left border">Path</th>
                            <th className="p-2 text-left border">Free</th>
                            <th className="p-2 text-left border">Total</th>
                            <th className="p-2 text-left border">Files</th>
                          </tr>
                        </thead>
                        <tbody>
                          {platformData.filesystems.map((fs, idx) => (
                            <tr key={idx} className="border">
                              <td className="p-2 border font-mono">{fs.path}</td>
                              <td className="p-2 border">{fs.free}</td>
                              <td className="p-2 border">{fs.total}</td>
                              <td className="p-2 border">{fs.files.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {platformData.summary.ramTotal && (
                  <div>
                    <div className="font-medium mb-2">Memory Information</div>
                    <div className="space-y-1 text-sm">
                      <div>Total RAM: <Badge variant="outline">{platformData.summary.ramTotal}</Badge></div>
                      <div>Free RAM: <Badge variant="outline">{platformData.summary.ramFree}</Badge></div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="jaces">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Cpu className="h-4 w-4" />
                <span>JACE Controllers ({tridiumSystemData ? Object.keys(tridiumSystemData.jaces).length : 0})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!tridiumSystemData || Object.keys(tridiumSystemData.jaces).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Cpu className="h-12 w-12 mx-auto mb-4" />
                  <p>No JACE data available</p>
                  <p className="text-sm">Import Tridium exports to see JACE information</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(tridiumSystemData.jaces).map(([jaceName, jaceData]) => (
                    <Card key={jaceName} className="border-green-200">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Cpu className="h-4 w-4 text-green-500" />
                            <CardTitle className="text-sm">{jaceName}</CardTitle>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {Object.keys(jaceData.drivers).filter(driver => jaceData.drivers[driver]).length} Drivers
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <div className="font-medium mb-2">Platform Info</div>
                            {jaceData.platform ? (
                              <div className="space-y-1">
                                <div>Model: <Badge variant="outline">{jaceData.platform.summary?.model || 'Unknown'}</Badge></div>
                                <div>Version: <Badge variant="outline">{jaceData.platform.summary?.daemonVersion || 'Unknown'}</Badge></div>
                                <div>CPUs: <Badge variant="outline">{jaceData.platform.summary?.cpuCount || 'Unknown'}</Badge></div>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-xs">No platform data</p>
                            )}
                          </div>
                          <div>
                            <div className="font-medium mb-2">Resources</div>
                            {jaceData.resources ? (
                              <div className="space-y-1">
                                <div>CPU: <Badge variant="outline">{jaceData.resources.metrics?.cpu?.usage || 0}%</Badge></div>
                                <div>Memory: <Badge variant="outline">{jaceData.resources.metrics?.memory?.used || 0}MB</Badge></div>
                                <div>Points: <Badge variant="outline">{jaceData.resources.metrics?.capacities?.points?.current || 0}</Badge></div>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-xs">No resource data</p>
                            )}
                          </div>
                          <div>
                            <div className="font-medium mb-2">Network Info</div>
                            {jaceData.networkInfo ? (
                              <div className="space-y-1">
                                <div>IP: <Badge variant="outline" className="text-xs">{jaceData.networkInfo.ip || 'Unknown'}</Badge></div>
                                <div>Status: <Badge variant="outline">{jaceData.networkInfo.status || 'Unknown'}</Badge></div>
                              </div>
                            ) : (
                              <p className="text-gray-500 text-xs">No network data</p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="drivers">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Network className="h-4 w-4" />
                <span>Drivers & Networks</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!tridiumSystemData || Object.keys(tridiumSystemData.jaces).length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Network className="h-12 w-12 mx-auto mb-4" />
                  <p>No driver data available</p>
                  <p className="text-sm">Import driver exports to see network information</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {Object.entries(tridiumSystemData.jaces).map(([jaceName, jaceData]) => (
                    <div key={jaceName}>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        {jaceName} Drivers
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* BACnet Driver */}
                        <Card className={`border-2 ${jaceData.drivers.bacnet ? 'border-blue-200 bg-blue-50' : 'border-gray-200'}`}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs flex items-center gap-2">
                              <Database className="h-3 w-3" />
                              BACnet
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {jaceData.drivers.bacnet ? (
                              <div className="space-y-1 text-xs">
                                <div>Devices: <Badge variant="outline">{jaceData.drivers.bacnet.devices?.length || 0}</Badge></div>
                                <div>Healthy: <Badge variant="outline" className="text-green-600">
                                  {Math.round((jaceData.drivers.bacnet.summary?.healthyPercentage || 0))}%
                                </Badge></div>
                                <div>Vendors: <Badge variant="outline">{Object.keys(jaceData.drivers.bacnet.summary?.byVendor || {}).length}</Badge></div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">Not configured</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* N2 Driver */}
                        <Card className={`border-2 ${jaceData.drivers.n2 ? 'border-orange-200 bg-orange-50' : 'border-gray-200'}`}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs flex items-center gap-2">
                              <Database className="h-3 w-3" />
                              N2
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {jaceData.drivers.n2 ? (
                              <div className="space-y-1 text-xs">
                                <div>Devices: <Badge variant="outline">{jaceData.drivers.n2.devices?.length || 0}</Badge></div>
                                <div>OK: <Badge variant="outline" className="text-green-600">{jaceData.drivers.n2.summary?.ok || 0}</Badge></div>
                                <div>Faulty: <Badge variant="outline" className="text-red-600">{jaceData.drivers.n2.summary?.faulty || 0}</Badge></div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">Not configured</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* Modbus Driver */}
                        <Card className={`border-2 ${jaceData.drivers.modbus ? 'border-green-200 bg-green-50' : 'border-gray-200'}`}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs flex items-center gap-2">
                              <Database className="h-3 w-3" />
                              Modbus
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {jaceData.drivers.modbus ? (
                              <div className="space-y-1 text-xs">
                                <div>Status: <Badge variant="outline" className="text-green-600">Configured</Badge></div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">Not configured</p>
                            )}
                          </CardContent>
                        </Card>

                        {/* LON Driver */}
                        <Card className={`border-2 ${jaceData.drivers.lon ? 'border-purple-200 bg-purple-50' : 'border-gray-200'}`}>
                          <CardHeader className="pb-2">
                            <CardTitle className="text-xs flex items-center gap-2">
                              <Database className="h-3 w-3" />
                              LON
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            {jaceData.drivers.lon ? (
                              <div className="space-y-1 text-xs">
                                <div>Status: <Badge variant="outline" className="text-green-600">Configured</Badge></div>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-500">Not configured</p>
                            )}
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="devices">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center space-x-2">
                <Database className="h-4 w-4" />
                <span>Device Inventory</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!tridiumSystemData ? (
                <div className="text-center py-8 text-gray-500">
                  <Database className="h-12 w-12 mx-auto mb-4" />
                  <p>No device data available</p>
                  <p className="text-sm">Import device exports to see inventory</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {tridiumSystemData.importSummary?.totalDevices || 0}
                        </div>
                        <div className="text-xs text-blue-800">Total Devices</div>
                      </CardContent>
                    </Card>
                    <Card className="border-green-200 bg-green-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {Object.keys(tridiumSystemData.jaces).length}
                        </div>
                        <div className="text-xs text-green-800">JACEs</div>
                      </CardContent>
                    </Card>
                    <Card className="border-purple-200 bg-purple-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          {Object.values(tridiumSystemData.jaces).reduce((total, jace) =>
                            total + Object.keys(jace.drivers).filter(driver => jace.drivers[driver]).length, 0)}
                        </div>
                        <div className="text-xs text-purple-800">Active Drivers</div>
                      </CardContent>
                    </Card>
                    <Card className="border-orange-200 bg-orange-50">
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {tridiumSystemData.importSummary?.networkCount || 0}
                        </div>
                        <div className="text-xs text-orange-800">Networks</div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Device Details by JACE */}
                  {Object.entries(tridiumSystemData.jaces).map(([jaceName, jaceData]) => (
                    <div key={jaceName}>
                      <h4 className="font-medium mb-3 flex items-center gap-2">
                        <Cpu className="h-4 w-4" />
                        {jaceName} Device Summary
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {jaceData.drivers.bacnet && (
                          <Card className="border-blue-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">BACnet Devices ({jaceData.drivers.bacnet.devices?.length || 0})</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span>Healthy:</span>
                                  <Badge variant="outline" className="text-green-600">
                                    {jaceData.drivers.bacnet.summary?.ok || 0}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>With Issues:</span>
                                  <Badge variant="outline" className="text-red-600">
                                    {jaceData.drivers.bacnet.summary?.faulty || 0}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Top Vendor:</span>
                                  <Badge variant="outline">
                                    {Object.entries(jaceData.drivers.bacnet.summary?.byVendor || {})
                                      .sort(([,a], [,b]) => (b as number) - (a as number))[0]?.[0] || 'None'}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {jaceData.drivers.n2 && (
                          <Card className="border-orange-200">
                            <CardHeader className="pb-2">
                              <CardTitle className="text-sm">N2 Devices ({jaceData.drivers.n2.devices?.length || 0})</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-2 text-xs">
                                <div className="flex justify-between">
                                  <span>OK:</span>
                                  <Badge variant="outline" className="text-green-600">
                                    {jaceData.drivers.n2.summary?.ok || 0}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Faulty:</span>
                                  <Badge variant="outline" className="text-red-600">
                                    {jaceData.drivers.n2.summary?.faulty || 0}
                                  </Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Down:</span>
                                  <Badge variant="outline" className="text-gray-600">
                                    {jaceData.drivers.n2.summary?.down || 0}
                                  </Badge>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="benchmark">
          {customerId ? (
            <PlatformBenchmarkDashboard
              customerId={customerId}
              currentSessionId={sessionId}
            />
          ) : (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center space-x-3 text-amber-600">
                  <AlertTriangle className="h-5 w-5" />
                  <span>Customer ID required for benchmarking</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  Benchmarking requires a customer context to compare platform data across visits.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};