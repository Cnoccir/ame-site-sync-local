import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Download, Save, FileText, Database, Merge, ChevronDown, ChevronUp } from "lucide-react";
import { DeviceInventoryService, type DeviceRecord } from "@/services/deviceInventoryService";
import type { TridiumDataset } from "@/types/tridium";
import { useToast } from "@/hooks/use-toast";

interface DeviceInventoryAggregatorProps {
  datasets: TridiumDataset[];
  visitId?: string;
  onAggregationComplete?: (aggregationId: string, devices: DeviceRecord[]) => void;
}

export function DeviceInventoryAggregator({ 
  datasets, 
  visitId, 
  onAggregationComplete 
}: DeviceInventoryAggregatorProps) {
  const [aggregationName, setAggregationName] = useState(`Site Inventory - ${new Date().toLocaleDateString()}`);
  const [isProcessing, setIsProcessing] = useState(false);
  const [aggregatedDevices, setAggregatedDevices] = useState<DeviceRecord[]>([]);
  const [currentAggregationId, setCurrentAggregationId] = useState<string>("");
  const [inventoryReport, setInventoryReport] = useState<string>("");
  const [isDetailsOpen, setIsDetailsOpen] = useState(true);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const { toast } = useToast();

  // Calculate summary statistics
  const summary = React.useMemo(() => {
    const totalDevices = datasets.reduce((sum, dataset) => sum + dataset.rows.length, 0);
    const protocols = [...new Set(datasets.map(dataset => 
      DeviceInventoryService['detectProtocol'](dataset.format as any, dataset.filename)
    ))];
    const files = datasets.map(d => d.filename);
    
    const statusBreakdown: Record<string, number> = {};
    datasets.forEach(dataset => {
      dataset.rows.forEach(row => {
        const status = row.parsedStatus?.status || 'unknown';
        statusBreakdown[status] = (statusBreakdown[status] || 0) + 1;
      });
    });

    return { totalDevices, protocols, files, statusBreakdown };
  }, [datasets]);

  const handleAggregateDevices = useCallback(async () => {
    if (!aggregationName.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide an aggregation name",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      // Create aggregation
      const { success, aggregationId, error } = await DeviceInventoryService.createAggregation(
        aggregationName,
        datasets,
        visitId
      );

      if (!success || !aggregationId) {
        throw new Error(error || 'Failed to create aggregation');
      }

      // Convert all datasets to device records
      const allDevices: DeviceRecord[] = [];
      datasets.forEach(dataset => {
        const devices = DeviceInventoryService.convertDatasetToDevices(dataset, visitId, aggregationId);
        allDevices.push(...devices);
      });

      // Deduplicate devices
      const deduplicatedDevices = DeviceInventoryService.deduplicateDevices(allDevices);

      // Save devices
      const saveResult = await DeviceInventoryService.saveDevices(deduplicatedDevices);
      if (!saveResult.success) {
        throw new Error(saveResult.error || 'Failed to save devices');
      }

      setAggregatedDevices(deduplicatedDevices);
      setCurrentAggregationId(aggregationId);
      
      toast({
        title: "Aggregation Complete",
        description: `Successfully aggregated ${deduplicatedDevices.length} unique devices from ${datasets.length} files`
      });

      onAggregationComplete?.(aggregationId, deduplicatedDevices);
    } catch (error) {
      console.error('Aggregation error:', error);
      toast({
        title: "Aggregation Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  }, [aggregationName, datasets, visitId, onAggregationComplete, toast]);

  const handleGenerateInventoryReport = useCallback(() => {
    if (aggregatedDevices.length === 0) {
      toast({
        title: "No Data",
        description: "Please aggregate devices first",
        variant: "destructive"
      });
      return;
    }

    const report = DeviceInventoryService.generateSimpleInventory(
      aggregatedDevices,
      aggregationName
    );
    setInventoryReport(report);
    
    toast({
      title: "Inventory Report Generated",
      description: "Simple inventory report has been created"
    });
  }, [aggregatedDevices, aggregationName, toast]);

  const handleSaveReport = useCallback(async () => {
    if (!inventoryReport) {
      toast({
        title: "No Report",
        description: "Please generate an inventory report first",
        variant: "destructive"
      });
      return;
    }

    try {
      const { success, reportId, error } = await DeviceInventoryService.saveInventoryReport(
        aggregationName,
        inventoryReport,
        currentAggregationId,
        visitId
      );

      if (!success) {
        throw new Error(error || 'Failed to save report');
      }

      toast({
        title: "Report Saved",
        description: `Inventory report saved with ID: ${reportId}`
      });
    } catch (error) {
      console.error('Save report error:', error);
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  }, [inventoryReport, aggregationName, currentAggregationId, visitId, toast]);

  const handleDownloadReport = useCallback(() => {
    if (!inventoryReport) {
      toast({
        title: "No Report",
        description: "Please generate an inventory report first",
        variant: "destructive"
      });
      return;
    }

    const blob = new Blob([inventoryReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${aggregationName.replace(/[^a-z0-9]/gi, '_')}_inventory.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Inventory report download initiated"
    });
  }, [inventoryReport, aggregationName, toast]);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Network Inventory Analysis
            </CardTitle>
            <CardDescription>
              Multi-file device aggregation with deduplication
            </CardDescription>
          </div>
          <Badge variant="outline">
            {summary.totalDevices} devices from {datasets.length} files
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-4 bg-primary/5 rounded-lg">
            <div className="text-2xl font-bold text-primary">{summary.totalDevices}</div>
            <div className="text-sm text-muted-foreground">Total Devices</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{datasets.length}</div>
            <div className="text-sm text-muted-foreground">Source Files</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{summary.protocols.length}</div>
            <div className="text-sm text-muted-foreground">Protocols</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{aggregatedDevices.length}</div>
            <div className="text-sm text-muted-foreground">Unique Devices</div>
          </div>
        </div>

        {/* Aggregation Controls */}
        <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <Merge className="h-4 w-4" />
                Aggregate & Analyze Devices
              </span>
              {isDetailsOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="aggregation-name">Aggregation Name</Label>
                <Input
                  id="aggregation-name"
                  value={aggregationName}
                  onChange={(e) => setAggregationName(e.target.value)}
                  placeholder="Enter aggregation name..."
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleAggregateDevices} disabled={isProcessing} className="w-full">
                  {isProcessing ? 'Processing...' : 'Aggregate & Analyze Devices'}
                </Button>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Network Device Review - Integrated as collapsible section */}
        {aggregatedDevices.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <Database className="h-4 w-4" />
                  Network Device Review
                </span>
                <Badge variant="secondary">
                  {aggregatedDevices.length} of {summary.totalDevices} devices • 0 selected for report
                </Badge>
                <ChevronDown className="h-4 w-4" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="font-medium">Device Selection</h4>
                    <p className="text-sm text-muted-foreground">Select devices to include in inventory report</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline">Select All (0)</Button>
                    <Button size="sm" variant="outline">Clear Selection</Button>
                    <Button size="sm" variant="outline">Critical Issues (1)</Button>
                    <Button size="sm" variant="outline">Controllers (0)</Button>
                  </div>
                </div>
                
                {/* Device Table */}
                <div className="overflow-x-auto max-h-96 overflow-y-auto">
                  <table className="w-full border-collapse border border-gray-200">
                    <thead className="sticky top-0 bg-gray-50">
                      <tr>
                        <th className="border border-gray-300 px-2 py-1 text-left w-12">Select</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Device Name</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Status</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Type/Protocol</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Address/ID</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Fox Port</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Host Model</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Version</th>
                        <th className="border border-gray-300 px-2 py-1 text-left">Source File</th>
                      </tr>
                    </thead>
                    <tbody>
                      {aggregatedDevices.slice(0, 50).map((device, index) => (
                        <tr key={device.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                          <td className="border border-gray-300 px-2 py-1">
                            <input type="checkbox" className="rounded" />
                          </td>
                          <td className="border border-gray-300 px-2 py-1 font-medium">
                            {(device as any)?.deviceName || (device as any)?.name || 'Unknown'}
                          </td>
                          <td className="border border-gray-300 px-2 py-1">
                            <Badge
                              variant={device.status === 'Online' ? 'default' : device.status === 'Alarm' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {device.status || 'Unknown'}
                            </Badge>
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-sm">
                            {(device as any)?.deviceType || (device as any)?.protocol || 'Unknown'}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-sm font-mono">
                            {(device as any)?.address || (device as any)?.deviceId || 'N/A'}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-sm">
                            {(device as any)?.metadata?.foxPort || 'N/A'}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-sm">
                            {(device as any)?.metadata?.hostModel || (device as any)?.deviceModel || 'N/A'}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-sm">
                            {device.version || 'N/A'}
                          </td>
                          <td className="border border-gray-300 px-2 py-1 text-xs text-muted-foreground">
                            {(device as any)?.sourceFile || 'N/A'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                {aggregatedDevices.length > 50 && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Showing first 50 devices of {aggregatedDevices.length} total.
                  </p>
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Inventory Report Generation */}
        {aggregatedDevices.length > 0 && (
          <Collapsible open={isReportOpen} onOpenChange={setIsReportOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between">
                <span className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Generate Analysis Summary
                </span>
                {isReportOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={handleGenerateInventoryReport} variant="outline">
                  <FileText className="w-4 h-4 mr-2" />
                  Generate Report
                </Button>
                <Button onClick={handleSaveReport} disabled={!inventoryReport} variant="outline">
                  <Save className="w-4 h-4 mr-2" />
                  Save to Database
                </Button>
                <Button onClick={handleDownloadReport} disabled={!inventoryReport} variant="outline">
                  <Download className="w-4 h-4 mr-2" />
                  Download Report
                </Button>
              </div>
              
              {inventoryReport && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Generated Inventory Report</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea
                      value={inventoryReport}
                      onChange={(e) => setInventoryReport(e.target.value)}
                      className="min-h-[300px] font-mono text-sm"
                      placeholder="Generated report will appear here..."
                    />
                  </CardContent>
                </Card>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}
      </CardContent>
    </Card>
  );
}