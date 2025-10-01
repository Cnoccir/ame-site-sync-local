import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Cpu,
  HardDrive,
  Settings,
  CheckCircle2,
  Database,
  BarChart3
} from 'lucide-react';
import { NiagaraPlatformSummary } from './NiagaraPlatformSummary';

interface PlatformTextPreviewProps {
  file: File;
  onDataReady: (data: any) => void;
  onCancel: () => void;
}

interface PlatformData {
  summary: {
    daemonVersion: string;
    daemonHttpPort: string;
    hostId: string;
    hostIdStatus: string;
    niagaraRuntime: string;
    architecture: string;
    cpuCount: number;
    model: string;
    product: string;
    enabledRuntimeProfiles: string[];
    operatingSystem: string;
    javaVirtualMachine: string;
    niagaraStationsEnabled: string;
    platformTlsSupport: string;
    port: string;
    certificate: string;
    protocol: string;
    systemHome: string;
    userHome: string;
    ramTotal?: string;
    ramFree?: string;
    ipAddress?: string;
  };
  modules: Array<{
    name: string;
    vendor: string;
    version: string;
    profiles: string[];
  }>;
  licenses: Array<{
    name: string;
    vendor: string;
    expires: string;
  }>;
  filesystems: Array<{
    path: string;
    free: string;
    total: string;
    files: number;
    maxFiles: number;
  }>;
  applications: Array<{
    name: string;
    type: string;
    status: string;
    autostart: boolean;
    autorestart?: boolean;
    fox?: number;
    foxs?: number;
    http?: number;
    https?: number;
  }>;
}

interface SectionConfig {
  name: string;
  enabled: boolean;
  key: keyof PlatformData;
  icon: React.ReactNode;
  description: string;
}

export const PlatformTextPreview: React.FC<PlatformTextPreviewProps> = ({
  file,
  onDataReady,
  onCancel
}) => {
  const [platformData, setPlatformData] = useState<PlatformData | null>(null);
  const [sectionConfigs, setSectionConfigs] = useState<SectionConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');

  useEffect(() => {
    parsePlatformFile();
  }, [file]);

  const parsePlatformFile = async () => {
    try {
      setIsLoading(true);
      const content = await file.text();

      // Clean content - remove BOM and normalize line endings
      let cleanContent = content.replace(/^\uFEFF/, '');
      cleanContent = cleanContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

      const parsed = parsePlatformDetails(cleanContent);
      setPlatformData(parsed);

      // Initialize section configurations
      const configs: SectionConfig[] = [
        {
          name: 'Platform Summary',
          enabled: true,
          key: 'summary',
          icon: <Cpu className="h-4 w-4" />,
          description: 'Core system information, hardware specs, and Niagara version'
        },
        {
          name: 'Modules',
          enabled: true,
          key: 'modules',
          icon: <Database className="h-4 w-4" />,
          description: 'Installed Niagara modules and their versions'
        },
        {
          name: 'Filesystems',
          enabled: true,
          key: 'filesystems',
          icon: <HardDrive className="h-4 w-4" />,
          description: 'Storage information and disk usage'
        },
        {
          name: 'Applications',
          enabled: false,
          key: 'applications',
          icon: <Settings className="h-4 w-4" />,
          description: 'Third-party applications and integrations'
        },
        {
          name: 'Licenses',
          enabled: false,
          key: 'licenses',
          icon: <CheckCircle2 className="h-4 w-4" />,
          description: 'License information and expiration dates'
        }
      ];

      setSectionConfigs(configs);
    } catch (error) {
      console.error('Error parsing platform file:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const parsePlatformDetails = (content: string): PlatformData => {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0);

    // Extract IP from first line
    const ipMatch = lines[0].match(/(\d+\.\d+\.\d+\.\d+)/);
    const ipAddress = ipMatch ? ipMatch[1] : '';

    // Parse summary section
    const summary = {
      daemonVersion: extractValue(lines, 'Daemon Version:'),
      daemonHttpPort: extractValue(lines, 'Daemon HTTP Port:'),
      hostId: extractValue(lines, 'Host ID:'),
      hostIdStatus: extractValue(lines, 'Host ID Status:'),
      niagaraRuntime: extractValue(lines, 'Niagara Runtime:'),
      architecture: extractValue(lines, 'Architecture:'),
      cpuCount: parseInt(extractValue(lines, 'Number of CPUs:')) || 0,
      model: extractValue(lines, 'Model:'),
      product: extractValue(lines, 'Product:'),
      enabledRuntimeProfiles: extractValue(lines, 'Enabled Runtime Profiles:').split(',').map(s => s.trim()).filter(Boolean),
      operatingSystem: extractValue(lines, 'Operating System:'),
      javaVirtualMachine: extractValue(lines, 'Java Virtual Machine:'),
      niagaraStationsEnabled: extractValue(lines, 'Niagara Stations Enabled:'),
      platformTlsSupport: extractValue(lines, 'Platform TLS Support:'),
      port: extractValue(lines, 'Port:'),
      certificate: extractValue(lines, 'Certificate:'),
      protocol: extractValue(lines, 'Protocol:'),
      systemHome: extractValue(lines, 'System Home:'),
      userHome: extractValue(lines, 'User Home:'),
      // Optional fields from older versions or different platforms
      ramTotal: extractRamValue(lines, 'Total'),
      ramFree: extractRamValue(lines, 'Free'),
      ipAddress
    };

    // Parse modules section
    const modules: PlatformData['modules'] = [];
    const modulesStartIndex = lines.findIndex(line => line === 'Modules');
    if (modulesStartIndex !== -1) {
      for (let i = modulesStartIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('Licenses') || line.startsWith('Applications') || line === '') {
          break;
        }

        const moduleMatch = line.match(/^(\S+)\s+\(([^)]+)\s+([^)]+)\)$/);
        if (moduleMatch) {
          const [, name, vendor, version] = moduleMatch;
          const profiles = name.split('-').slice(1); // rt, ux, wb
          modules.push({
            name: name.split('-')[0], // Remove profile suffix
            vendor: vendor.trim(),
            version: version.trim(),
            profiles
          });
        }
      }
    }

    // Parse filesystems section
    const filesystems: PlatformData['filesystems'] = [];
    const filesystemStartIndex = lines.findIndex(line => line.startsWith('Filesystem'));
    if (filesystemStartIndex !== -1) {
      for (let i = filesystemStartIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        if (line.startsWith('Modules') || line === '') break;

        const parts = line.trim().split(/\s+/);
        if (parts.length >= 5) {
          filesystems.push({
            path: parts[0],
            free: parts[1] + ' ' + parts[2],
            total: parts[3] + ' ' + parts[4],
            files: parseInt(parts[5]) || 0,
            maxFiles: parseInt(parts[6]) || 0
          });
        }
      }
    }

    // Parse licenses (if present)
    const licenses: PlatformData['licenses'] = [];

    // Parse applications section
    const applications: PlatformData['applications'] = [];
    const applicationsStartIndex = lines.findIndex(line => line === 'Applications' || line.toLowerCase().startsWith('applications'));
    if (applicationsStartIndex !== -1) {
      for (let i = applicationsStartIndex + 1; i < lines.length; i++) {
        const line = lines[i];
        // Stop at next section
        if (line === 'Modules' || line === 'Licenses' || line === 'Certificates' || line === '') {
          break;
        }

        // Parse application line: "station <name> <details>"
        // Example: "station StationName autostart=true autorestart=true fox=1911 foxs=4911 http=80 https=443 status=running"
        const appMatch = line.match(/^station\s+(\S+)\s+(.+)$/);
        if (appMatch) {
          const [, name, details] = appMatch;
          const app: any = {
            name,
            type: 'station',
            autostart: details.includes('autostart=true'),
            autorestart: details.includes('autorestart=true'),
            status: 'Unknown'
          };

          // Extract ports if present
          const foxMatch = details.match(/fox=(\d+)/);
          const foxsMatch = details.match(/foxs=(\d+)/);
          const httpMatch = details.match(/http=(\d+)/);
          const httpsMatch = details.match(/https=(\d+)/);

          if (foxMatch) app.fox = parseInt(foxMatch[1]);
          if (foxsMatch) app.foxs = parseInt(foxsMatch[1]);
          if (httpMatch) app.http = parseInt(httpMatch[1]);
          if (httpsMatch) app.https = parseInt(httpsMatch[1]);

          // Extract status
          const statusMatch = details.match(/status=(\w+)/);
          if (statusMatch) app.status = statusMatch[1];

          applications.push(app);
        }
      }
    }

    return {
      summary,
      modules,
      filesystems,
      licenses,
      applications
    };
  };

  const extractValue = (lines: string[], key: string): string => {
    const line = lines.find(l => l.startsWith(key));
    if (!line) return '';
    return line.substring(key.length).trim();
  };

  const extractRamValue = (lines: string[], type: 'Free' | 'Total'): string => {
    const ramLineIndex = lines.findIndex(l => l.startsWith('Physical RAM'));
    if (ramLineIndex === -1) return '';

    const dataLine = lines[ramLineIndex + 1];
    if (!dataLine) return '';

    const parts = dataLine.trim().split(/\s+/);
    if (type === 'Free') return parts[0] + ' ' + parts[1];
    if (type === 'Total') return parts[2] + ' ' + parts[3];
    return '';
  };

  const updateSectionConfig = (index: number, enabled: boolean) => {
    setSectionConfigs(prev =>
      prev.map((config, i) =>
        i === index ? { ...config, enabled } : config
      )
    );
  };

  const processData = () => {
    if (!platformData) return;

    const enabledSections = sectionConfigs.filter(s => s.enabled);
    const result = {
      type: 'platform',
      totalSections: sectionConfigs.length,
      enabledSections: enabledSections.length,
      data: enabledSections.reduce((acc, section) => {
        acc[section.key] = platformData[section.key];
        return acc;
      }, {} as any),
      summary: {
        ...platformData.summary,
        moduleCount: platformData.modules.length,
        filesystemCount: platformData.filesystems.length,
        enabledSections: enabledSections.map(s => s.name)
      }
    };

    onDataReady(result);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            <span>Parsing platform details...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!platformData) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-red-600">
            Failed to parse platform file. Please check the file format.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* File Info Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Cpu className="h-5 w-5 text-blue-500" />
              <div>
                <CardTitle className="text-lg">{file.name}</CardTitle>
                <div className="text-sm text-gray-600">
                  <span className="mr-1">Platform:</span>
                  <Badge variant="outline" className="mr-2">{platformData.summary.model} {platformData.summary.product}</Badge>
                  <span className="mr-1">Niagara:</span>
                  <Badge variant="outline" className="mr-2">{platformData.summary.daemonVersion}</Badge>
                  <span className="mr-1">License:</span>
                  <Badge variant="outline" className="mr-2">{platformData.summary.hostIdStatus}</Badge>
                  <span className="mr-1">TLS:</span>
                  <Badge variant="outline" className="mr-2">{platformData.summary.platformTlsSupport}</Badge>
                  {platformData.summary.enabledRuntimeProfiles.length > 0 && (
                    <span className="inline-flex items-center ml-1">
                      <span className="mr-1">Profiles:</span>
                      <span className="flex flex-wrap gap-1">
                        {platformData.summary.enabledRuntimeProfiles.map(profile => (
                          <Badge key={profile} variant="secondary" className="text-xs">{profile}</Badge>
                        ))}
                      </span>
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex space-x-2">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button onClick={processData} disabled={!sectionConfigs.some(s => s.enabled)}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Import Data
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabbed Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview">📊 Data Preview</TabsTrigger>
          <TabsTrigger value="sections">⚙️ Section Selection</TabsTrigger>
          <TabsTrigger value="summary">📈 Summary</TabsTrigger>
        </TabsList>

        {/* Data Preview Tab */}
        <TabsContent value="preview">
          <div className="space-y-4">
            {/* Quick Summary (Professional) */}
            {/* Using our concise summary component for key metrics */}
            <NiagaraPlatformSummary 
              summary={platformData.summary} 
              filesystems={platformData.filesystems}
              applications={platformData.applications}
            />

            {/* Detailed Platform Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center space-x-2">
                  <Cpu className="h-4 w-4" />
                  <span>Detailed Platform Summary</span>
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
                      <div>TLS Support: <Badge variant="outline">{platformData.summary.platformTlsSupport}</Badge></div>
                      <div>Protocol: <Badge variant="outline">{platformData.summary.protocol}</Badge></div>
                      <div>Certificate: <Badge variant="outline">{platformData.summary.certificate}</Badge></div>
                      <div>Stations: <Badge variant="outline">{platformData.summary.niagaraStationsEnabled}</Badge></div>
                    </div>
                  </div>
                  <div>
                    <div className="font-medium mb-2">System Environment</div>
                    <div className="space-y-1">
                      <div>OS: <Badge variant="outline" className="text-xs">{platformData.summary.operatingSystem}</Badge></div>
                      <div>Java: <Badge variant="outline" className="text-xs">{platformData.summary.javaVirtualMachine}</Badge></div>
                      <div>
                        <span>Profiles:</span>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {platformData.summary.enabledRuntimeProfiles.map(profile => (
                            <Badge key={profile} variant="secondary" className="text-xs">{profile}</Badge>
                          ))}
                        </div>
                      </div>
                      <div className="text-xs">
                        <div>System: <span className="text-gray-500 break-all">{platformData.summary.systemHome}</span></div>
                        <div>User: <span className="text-gray-500 break-all">{platformData.summary.userHome}</span></div>
                      </div>
                      {platformData.summary.ramTotal && (
                        <div>RAM: <Badge variant="outline">{platformData.summary.ramTotal} total, {platformData.summary.ramFree} free</Badge></div>
                      )}
                      {platformData.summary.ipAddress && (
                        <div>IP: <Badge variant="outline">{platformData.summary.ipAddress}</Badge></div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Modules */}
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
                    {platformData.modules.slice(0, 20).map((module, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{module.name}</span>
                          <Badge variant="secondary" className="text-xs">{module.vendor}</Badge>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-gray-600">{module.version}</span>
                          {module.profiles.length > 0 && (
                            <div className="flex space-x-1">
                              {module.profiles.map(profile => (
                                <Badge key={profile} variant="outline" className="text-xs">
                                  {profile}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                    {platformData.modules.length > 20 && (
                      <div className="text-center text-sm text-gray-500 p-2">
                        ... and {platformData.modules.length - 20} more modules
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Filesystems */}
            {platformData.filesystems.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center space-x-2">
                    <HardDrive className="h-4 w-4" />
                    <span>Filesystems</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2">Path</th>
                          <th className="text-left p-2">Free</th>
                          <th className="text-left p-2">Total</th>
                          <th className="text-left p-2">Files</th>
                          <th className="text-left p-2">Max Files</th>
                        </tr>
                      </thead>
                      <tbody>
                        {platformData.filesystems.map((fs, idx) => (
                          <tr key={idx} className="border-b">
                            <td className="p-2 font-mono">{fs.path}</td>
                            <td className="p-2">{fs.free}</td>
                            <td className="p-2">{fs.total}</td>
                            <td className="p-2">{fs.files}</td>
                            <td className="p-2">{fs.maxFiles}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {/* Section Selection Tab */}
        <TabsContent value="sections">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Select Data Sections to Import</CardTitle>
              <p className="text-sm text-gray-600">
                Choose which sections of the platform data to include in your PM report.
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {sectionConfigs.map((config, index) => (
                  <div key={index} className="flex items-start space-x-4 p-3 border rounded-lg">
                    <Checkbox
                      checked={config.enabled}
                      onCheckedChange={(checked) =>
                        updateSectionConfig(index, !!checked)
                      }
                    />
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        {config.icon}
                        <span className="font-medium">{config.name}</span>
                        <Badge variant="outline" className="text-xs">
                          {Array.isArray(platformData[config.key])
                            ? (platformData[config.key] as any[]).length + ' items'
                            : 'Summary data'
                          }
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{config.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Summary Tab */}
        <TabsContent value="summary">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Import Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold mb-3">Platform Information</h4>
                  <div className="space-y-2 text-sm">
                    <div>File: <Badge variant="outline">{file.name}</Badge></div>
                    <div>Model: <Badge variant="outline">{platformData.summary.model} {platformData.summary.product}</Badge></div>
                    <div>Niagara: <Badge variant="outline">{platformData.summary.daemonVersion}</Badge></div>
                    <div>Modules: <Badge variant="outline">{platformData.modules.length}</Badge></div>
                  </div>
                </div>
                <div>
                  <h4 className="font-semibold mb-3">Import Configuration</h4>
                  <div className="space-y-2 text-sm">
                    <div>Selected Sections: <Badge variant="outline">{sectionConfigs.filter(s => s.enabled).length}</Badge></div>
                    <div>Total Sections: <Badge variant="outline">{sectionConfigs.length}</Badge></div>
                  </div>
                  <div className="mt-3">
                    <h5 className="font-medium text-sm mb-2">Enabled Sections:</h5>
                    <div className="space-y-1">
                      {sectionConfigs.filter(s => s.enabled).map(section => (
                        <Badge key={section.name} variant="secondary" className="mr-1 mb-1">
                          {section.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};