import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Download, Save, FileText, Database, Merge } from "lucide-react";
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
  const { toast } = useToast();

  // Calculate summary statistics
  const summary = React.useMemo(() => {
    const totalDevices = datasets.reduce((sum, dataset) => sum + dataset.rows.length, 0);
    const protocols = [...new Set(datasets.map(dataset => 
      DeviceInventoryService['detectProtocol'](dataset.type, dataset.filename)
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
    <div className="space-y-6">
      {/* Aggregation Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Merge className="h-5 w-5" />
            Multi-File Device Aggregation
          </CardTitle>
          <CardDescription>
            Combine multiple driver exports into a unified site inventory with deduplication
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="aggregation-name">Aggregation Name</Label>
            <Input
              id="aggregation-name"
              value={aggregationName}
              onChange={(e) => setAggregationName(e.target.value)}
              placeholder="Enter a name for this device aggregation"
            />
          </div>

          {/* Summary Information */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-muted rounded-lg">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">{summary.totalDevices}</div>
              <div className="text-sm text-muted-foreground">Total Devices</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{datasets.length}</div>
              <div className="text-sm text-muted-foreground">Source Files</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.protocols.length}</div>
              <div className="text-sm text-muted-foreground">Protocols</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{aggregatedDevices.length}</div>
              <div className="text-sm text-muted-foreground">Unique Devices</div>
            </div>
          </div>

          {/* Source Files */}
          <div>
            <Label>Source Files ({datasets.length})</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {summary.files.map((filename, index) => (
                <Badge key={index} variant="outline">{filename}</Badge>
              ))}
            </div>
          </div>

          {/* Protocols */}
          <div>
            <Label>Detected Protocols ({summary.protocols.length})</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {summary.protocols.map((protocol, index) => (
                <Badge key={index} variant="secondary">{protocol}</Badge>
              ))}
            </div>
          </div>

          {/* Status Breakdown */}
          <div>
            <Label>Status Overview</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {Object.entries(summary.statusBreakdown).map(([status, count]) => (
                <Badge 
                  key={status} 
                  variant={status === 'ok' ? 'default' : status === 'down' ? 'destructive' : 'secondary'}
                >
                  {status.toUpperCase()}: {count}
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleAggregateDevices} 
            disabled={isProcessing || datasets.length === 0}
            className="w-full"
          >
            <Database className="h-4 w-4 mr-2" />
            {isProcessing ? 'Processing...' : 'Aggregate Devices'}
          </Button>
        </CardContent>
      </Card>

      {/* Inventory Report Generation */}
      {aggregatedDevices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Simple Inventory Report
            </CardTitle>
            <CardDescription>
              Generate and manage device inventory reports
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-2">
              <Button onClick={handleGenerateInventoryReport} variant="outline">
                <FileText className="h-4 w-4 mr-2" />
                Generate Report
              </Button>
              
              {inventoryReport && (
                <>
                  <Button onClick={handleSaveReport} variant="outline">
                    <Save className="h-4 w-4 mr-2" />
                    Save Report
                  </Button>
                  <Button onClick={handleDownloadReport} variant="outline">
                    <Download className="h-4 w-4 mr-2" />
                    Download
                  </Button>
                </>
              )}
            </div>

            {inventoryReport && (
              <div className="space-y-2">
                <Label>Generated Report Preview</Label>
                <Textarea
                  value={inventoryReport}
                  readOnly
                  className="min-h-[300px] font-mono text-sm"
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}