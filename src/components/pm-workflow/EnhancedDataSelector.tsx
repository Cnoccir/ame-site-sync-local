import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Search,
  Check,
  X,
  AlertTriangle,
  Info,
  Database,
  Server,
  Activity,
  Shield,
  Calendar,
  Download,
  Eye,
  ChevronRight,
  Filter
} from 'lucide-react';

interface DataField {
  key: string;
  label: string;
  type: 'string' | 'number' | 'boolean' | 'date' | 'object' | 'array';
  value: any;
  category: string;
  critical: boolean;
  description?: string;
  source?: string; // Which file/parser this came from
}

interface EnhancedDataSelectorProps {
  analysisData: any;
  onFieldsSelected: (selectedFields: string[], customMappings: Record<string, string>) => void;
  onCancel: () => void;
  isOpen: boolean;
}

export const EnhancedDataSelector: React.FC<EnhancedDataSelectorProps> = ({
  analysisData,
  onFieldsSelected,
  onCancel,
  isOpen
}) => {
  const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [customMappings, setCustomMappings] = useState<Record<string, string>>({});
  const [showPreview, setShowPreview] = useState(false);

  // Extract all available fields from the analysis data
  const allFields = useMemo(() => {
    const fields: DataField[] = [];

    // Extract platform analysis fields
    const platformAnalysis = analysisData?.jaces?.[Object.keys(analysisData.jaces || {})[0]]?.platform?.analysis;
    if (platformAnalysis) {
      // Health and utilization fields
      fields.push({
        key: 'platform.healthScore',
        label: 'Platform Health Score',
        type: 'number',
        value: platformAnalysis.healthScore,
        category: 'Health Metrics',
        critical: true,
        description: 'Overall platform health score (0-100)',
        source: 'Platform Details'
      });

      fields.push({
        key: 'platform.memoryUtilization',
        label: 'Memory Utilization (%)',
        type: 'number',
        value: platformAnalysis.memoryUtilization,
        category: 'Performance',
        critical: platformAnalysis.memoryUtilization > 75,
        description: 'Current memory usage percentage',
        source: 'Platform Details'
      });

      if (platformAnalysis.diskUtilization) {
        fields.push({
          key: 'platform.diskUtilization',
          label: 'Disk Utilization (%)',
          type: 'number',
          value: platformAnalysis.diskUtilization,
          category: 'Performance',
          critical: platformAnalysis.diskUtilization > 80,
          description: 'Current disk usage percentage',
          source: 'Platform Details'
        });
      }

      fields.push({
        key: 'platform.platformType',
        label: 'Platform Type',
        type: 'string',
        value: platformAnalysis.platformType,
        category: 'Configuration',
        critical: true,
        description: 'Type of platform (JACE, Supervisor, etc.)',
        source: 'Platform Details'
      });

      // Alerts
      platformAnalysis.alerts?.forEach((alert: any, index: number) => {
        fields.push({
          key: `platform.alerts.${index}`,
          label: `Alert: ${alert.message}`,
          type: 'object',
          value: alert,
          category: 'Alerts',
          critical: alert.severity === 'critical',
          description: `${alert.severity} alert in ${alert.category}`,
          source: 'Platform Details'
        });
      });

      // Recommendations
      platformAnalysis.recommendations?.forEach((rec: string, index: number) => {
        fields.push({
          key: `platform.recommendations.${index}`,
          label: `Recommendation ${index + 1}`,
          type: 'string',
          value: rec,
          category: 'Recommendations',
          critical: false,
          description: 'Maintenance recommendation',
          source: 'Platform Analysis'
        });
      });

      // Version compatibility
      fields.push({
        key: 'platform.versionSupported',
        label: 'Version Supported',
        type: 'boolean',
        value: platformAnalysis.versionCompatibility?.isSupported,
        category: 'Configuration',
        critical: !platformAnalysis.versionCompatibility?.isSupported,
        description: 'Whether current version is supported',
        source: 'Platform Details'
      });

      // Module analysis
      if (platformAnalysis.moduleAnalysis) {
        fields.push({
          key: 'platform.moduleCount',
          label: 'Total Modules',
          type: 'number',
          value: platformAnalysis.moduleAnalysis.total,
          category: 'Configuration',
          critical: false,
          description: 'Total number of installed modules',
          source: 'Platform Details'
        });

        fields.push({
          key: 'platform.thirdPartyModules',
          label: 'Third Party Modules',
          type: 'number',
          value: platformAnalysis.moduleAnalysis.thirdPartyCount,
          category: 'Configuration',
          critical: false,
          description: 'Number of third-party modules',
          source: 'Platform Details'
        });

        fields.push({
          key: 'platform.unsupportedModules',
          label: 'Unsupported Modules',
          type: 'array',
          value: platformAnalysis.moduleAnalysis.unsupportedModules,
          category: 'Configuration',
          critical: platformAnalysis.moduleAnalysis.unsupportedModules.length > 0,
          description: 'List of potentially unsupported modules',
          source: 'Platform Details'
        });
      }

      // License status
      if (platformAnalysis.licenseStatus) {
        fields.push({
          key: 'platform.expiredLicenses',
          label: 'Expired Licenses',
          type: 'number',
          value: platformAnalysis.licenseStatus.expired,
          category: 'Licensing',
          critical: platformAnalysis.licenseStatus.expired > 0,
          description: 'Number of expired licenses',
          source: 'Platform Details'
        });

        fields.push({
          key: 'platform.expiringLicenses',
          label: 'Licenses Expiring Soon',
          type: 'number',
          value: platformAnalysis.licenseStatus.expiring,
          category: 'Licensing',
          critical: platformAnalysis.licenseStatus.expiring > 0,
          description: 'Number of licenses expiring within 30 days',
          source: 'Platform Details'
        });
      }
    }

    // Extract resource analysis fields
    const resourceAnalysis = analysisData?.jaces?.[Object.keys(analysisData.jaces || {})[0]]?.resources?.analysis;
    if (resourceAnalysis) {
      fields.push({
        key: 'resources.healthScore',
        label: 'Resource Health Score',
        type: 'number',
        value: resourceAnalysis.healthScore,
        category: 'Health Metrics',
        critical: true,
        description: 'Overall resource health score (0-100)',
        source: 'Resource Export'
      });

      // Resource utilization
      if (resourceAnalysis.resourceUtilization) {
        Object.entries(resourceAnalysis.resourceUtilization).forEach(([resource, data]: [string, any]) => {
          fields.push({
            key: `resources.${resource}Usage`,
            label: `${resource.charAt(0).toUpperCase() + resource.slice(1)} Usage (%)`,
            type: 'number',
            value: data.percentage,
            category: 'Performance',
            critical: data.status === 'critical',
            description: `${resource} usage percentage - status: ${data.status}`,
            source: 'Resource Export'
          });
        });
      }

      // Capacity analysis
      if (resourceAnalysis.capacityAnalysis) {
        Object.entries(resourceAnalysis.capacityAnalysis).forEach(([capacity, data]: [string, any]) => {
          fields.push({
            key: `resources.${capacity}Capacity`,
            label: `${capacity.charAt(0).toUpperCase() + capacity.slice(1)} Capacity (%)`,
            type: 'number',
            value: data.riskLevel,
            category: 'Capacity',
            critical: data.status === 'critical',
            description: `${capacity} capacity usage - status: ${data.status}`,
            source: 'Resource Export'
          });
        });
      }

      // Performance insights
      if (resourceAnalysis.performanceInsights) {
        fields.push({
          key: 'resources.engineScanEfficiency',
          label: 'Engine Scan Efficiency',
          type: 'string',
          value: resourceAnalysis.performanceInsights.engineScanEfficiency,
          category: 'Performance',
          critical: resourceAnalysis.performanceInsights.engineScanEfficiency === 'poor',
          description: 'Engine scan performance rating',
          source: 'Resource Export'
        });

        fields.push({
          key: 'resources.queueBacklog',
          label: 'Queue Backlog Level',
          type: 'string',
          value: resourceAnalysis.performanceInsights.queueBacklog,
          category: 'Performance',
          critical: resourceAnalysis.performanceInsights.queueBacklog === 'high',
          description: 'Engine queue backlog status',
          source: 'Resource Export'
        });

        fields.push({
          key: 'resources.memoryLeaks',
          label: 'Memory Leaks Detected',
          type: 'boolean',
          value: resourceAnalysis.performanceInsights.memoryLeaks,
          category: 'Performance',
          critical: resourceAnalysis.performanceInsights.memoryLeaks,
          description: 'Whether potential memory leaks were detected',
          source: 'Resource Export'
        });

        // Capacity projections
        if (resourceAnalysis.performanceInsights.capacityProjection) {
          const projection = resourceAnalysis.performanceInsights.capacityProjection;
          if (projection.pointsMonthsRemaining) {
            fields.push({
              key: 'resources.pointsProjection',
              label: 'Points License Months Remaining',
              type: 'number',
              value: projection.pointsMonthsRemaining,
              category: 'Capacity',
              critical: projection.pointsMonthsRemaining <= 6,
              description: 'Estimated months until points license capacity is reached',
              source: 'Resource Export'
            });
          }

          if (projection.devicesMonthsRemaining) {
            fields.push({
              key: 'resources.devicesProjection',
              label: 'Device License Months Remaining',
              type: 'number',
              value: projection.devicesMonthsRemaining,
              category: 'Capacity',
              critical: projection.devicesMonthsRemaining <= 6,
              description: 'Estimated months until device license capacity is reached',
              source: 'Resource Export'
            });
          }
        }
      }
    }

    // Extract device inventory data
    if (analysisData?.jaces) {
      Object.values(analysisData.jaces).forEach((jace: any) => {
        // BACnet devices
        if (jace.drivers?.bacnet?.devices) {
          fields.push({
            key: `devices.bacnet.total`,
            label: 'BACnet Devices Count',
            type: 'number',
            value: jace.drivers.bacnet.devices.length,
            category: 'Device Inventory',
            critical: false,
            description: 'Total number of BACnet devices',
            source: 'BACnet Export'
          });

          fields.push({
            key: `devices.bacnet.healthy`,
            label: 'Healthy BACnet Devices',
            type: 'number',
            value: jace.drivers.bacnet.summary?.ok || 0,
            category: 'Device Inventory',
            critical: false,
            description: 'Number of healthy BACnet devices',
            source: 'BACnet Export'
          });

          fields.push({
            key: `devices.bacnet.faulty`,
            label: 'Faulty BACnet Devices',
            type: 'number',
            value: jace.drivers.bacnet.summary?.faulty || 0,
            category: 'Device Inventory',
            critical: (jace.drivers.bacnet.summary?.faulty || 0) > 0,
            description: 'Number of faulty BACnet devices',
            source: 'BACnet Export'
          });
        }

        // N2 devices
        if (jace.drivers?.n2?.devices) {
          fields.push({
            key: `devices.n2.total`,
            label: 'N2 Devices Count',
            type: 'number',
            value: jace.drivers.n2.devices.length,
            category: 'Device Inventory',
            critical: false,
            description: 'Total number of N2 devices',
            source: 'N2 Export'
          });

          fields.push({
            key: `devices.n2.healthy`,
            label: 'Healthy N2 Devices',
            type: 'number',
            value: jace.drivers.n2.summary?.ok || 0,
            category: 'Device Inventory',
            critical: false,
            description: 'Number of healthy N2 devices',
            source: 'N2 Export'
          });

          fields.push({
            key: `devices.n2.faulty`,
            label: 'Faulty N2 Devices',
            type: 'number',
            value: jace.drivers.n2.summary?.faulty || 0,
            category: 'Device Inventory',
            critical: (jace.drivers.n2.summary?.faulty || 0) > 0,
            description: 'Number of faulty N2 devices',
            source: 'N2 Export'
          });
        }
      });
    }

    return fields;
  }, [analysisData]);

  // Filter fields based on search and category
  const filteredFields = useMemo(() => {
    return allFields.filter(field => {
      const matchesSearch = searchTerm === '' ||
        field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        field.key.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesCategory = activeCategory === 'all' || field.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [allFields, searchTerm, activeCategory]);

  // Get unique categories
  const categories = useMemo(() => {
    const cats = Array.from(new Set(allFields.map(field => field.category)));
    return ['all', ...cats.sort()];
  }, [allFields]);

  // Auto-select critical fields
  React.useEffect(() => {
    const criticalFields = allFields.filter(field => field.critical).map(field => field.key);
    setSelectedFields(new Set(criticalFields));
  }, [allFields]);

  const handleFieldToggle = (fieldKey: string) => {
    const newSelected = new Set(selectedFields);
    if (newSelected.has(fieldKey)) {
      newSelected.delete(fieldKey);
    } else {
      newSelected.add(fieldKey);
    }
    setSelectedFields(newSelected);
  };

  const handleSelectAll = () => {
    setSelectedFields(new Set(filteredFields.map(field => field.key)));
  };

  const handleDeselectAll = () => {
    setSelectedFields(new Set());
  };

  const handleSelectCritical = () => {
    const criticalFields = filteredFields.filter(field => field.critical).map(field => field.key);
    setSelectedFields(new Set(criticalFields));
  };

  const handleCustomMappingChange = (fieldKey: string, customName: string) => {
    setCustomMappings(prev => ({
      ...prev,
      [fieldKey]: customName
    }));
  };

  const handleSubmit = () => {
    onFieldsSelected(Array.from(selectedFields), customMappings);
  };

  const selectedFieldsData = useMemo(() => {
    return allFields.filter(field => selectedFields.has(field.key));
  }, [allFields, selectedFields]);

  return (
    <Dialog open={isOpen} onOpenChange={onCancel}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Select Data Fields for Import
          </DialogTitle>
          <DialogDescription>
            Choose which analyzed system data fields to import and store for future reference.
            Critical fields are pre-selected.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="selection" className="h-full flex flex-col">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="selection">Field Selection</TabsTrigger>
              <TabsTrigger value="preview" className="gap-2">
                Preview ({selectedFields.size} selected)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="selection" className="flex-1 overflow-hidden flex flex-col space-y-4">
              {/* Controls */}
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                    <Input
                      placeholder="Search fields..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <select
                    value={activeCategory}
                    onChange={(e) => setActiveCategory(e.target.value)}
                    className="border rounded px-3 py-2 text-sm"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? 'All Categories' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleSelectCritical}>
                    Select Critical
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    Select All
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDeselectAll}>
                    Deselect All
                  </Button>
                </div>
              </div>

              {/* Summary */}
              <div className="grid grid-cols-4 gap-4">
                <Card className="p-3">
                  <div className="text-sm text-muted-foreground">Total Fields</div>
                  <div className="text-2xl font-bold">{allFields.length}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-sm text-muted-foreground">Critical Fields</div>
                  <div className="text-2xl font-bold text-red-600">
                    {allFields.filter(f => f.critical).length}
                  </div>
                </Card>
                <Card className="p-3">
                  <div className="text-sm text-muted-foreground">Selected</div>
                  <div className="text-2xl font-bold text-blue-600">{selectedFields.size}</div>
                </Card>
                <Card className="p-3">
                  <div className="text-sm text-muted-foreground">Categories</div>
                  <div className="text-2xl font-bold">{categories.length - 1}</div>
                </Card>
              </div>

              {/* Fields Table */}
              <div className="flex-1 overflow-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12">Select</TableHead>
                      <TableHead>Field</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Critical</TableHead>
                      <TableHead>Custom Name</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredFields.map(field => (
                      <TableRow key={field.key}>
                        <TableCell>
                          <Checkbox
                            checked={selectedFields.has(field.key)}
                            onCheckedChange={() => handleFieldToggle(field.key)}
                          />
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{field.label}</div>
                            <div className="text-sm text-muted-foreground">{field.description}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-48 truncate">
                            {typeof field.value === 'object' ?
                              JSON.stringify(field.value).substring(0, 50) + '...' :
                              String(field.value)
                            }
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{field.category}</Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">{field.source}</Badge>
                        </TableCell>
                        <TableCell>
                          {field.critical && (
                            <Badge variant="destructive" className="gap-1">
                              <AlertTriangle className="h-3 w-3" />
                              Critical
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {selectedFields.has(field.key) && (
                            <Input
                              placeholder="Custom field name"
                              value={customMappings[field.key] || ''}
                              onChange={(e) => handleCustomMappingChange(field.key, e.target.value)}
                              className="w-40"
                            />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>

            <TabsContent value="preview" className="flex-1 overflow-auto space-y-4">
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Preview of selected fields that will be imported and stored for future analysis.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedFieldsData.map(field => (
                  <Card key={field.key}>
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm">
                          {customMappings[field.key] || field.label}
                        </CardTitle>
                        {field.critical && (
                          <Badge variant="destructive" className="text-xs">Critical</Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="text-lg font-mono">
                          {typeof field.value === 'object' ?
                            JSON.stringify(field.value, null, 2) :
                            String(field.value)
                          }
                        </div>
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{field.category}</span>
                          <span>{field.source}</span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {field.description}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground">
            {selectedFields.size} field{selectedFields.size !== 1 ? 's' : ''} selected
            {selectedFields.size > 0 && (
              <span className="ml-2">
                • {selectedFieldsData.filter(f => f.critical).length} critical
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={selectedFields.size === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Import Selected Fields ({selectedFields.size})
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};