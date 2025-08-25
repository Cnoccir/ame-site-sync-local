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
      {/* Network Inventory Analysis */}
      <Card className="border-l-4 border-l-primary">
        <Collapsible open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal">
                <div className="flex items-center gap-2">
                  <Merge className="h-5 w-5 text-primary" />
                  <div className="text-left">
                    <CardTitle className="text-lg">Network Inventory Analysis</CardTitle>
                    <CardDescription className="text-sm">
                      Multi-file device aggregation with deduplication
                    </CardDescription>
                  </div>
                </div>
                {isDetailsOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-6">
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
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg border">
                <div className="text-center">
                  <div className="text-3xl font-bold text-primary">{summary.totalDevices}</div>
                  <div className="text-sm text-muted-foreground font-medium">Total Devices</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{datasets.length}</div>
                  <div className="text-sm text-muted-foreground font-medium">Source Files</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{summary.protocols.length}</div>
                  <div className="text-sm text-muted-foreground font-medium">Protocols</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-purple-600">{aggregatedDevices.length}</div>
                  <div className="text-sm text-muted-foreground font-medium">Unique Devices</div>
                </div>
              </div>

              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger asChild>
                  <Button variant="outline" size="sm" className="mb-3">
                    <FileText className="h-4 w-4 mr-2" />
                    View Source Details
                    <ChevronDown className="h-4 w-4 ml-2" />
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-4">
                  {/* Source Files */}
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <Label className="text-sm font-semibold">Source Files ({datasets.length})</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {summary.files.map((filename, index) => (
                        <Badge key={index} variant="outline" className="text-xs">{filename}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Protocols */}
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <Label className="text-sm font-semibold">Detected Protocols ({summary.protocols.length})</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {summary.protocols.map((protocol, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">{protocol}</Badge>
                      ))}
                    </div>
                  </div>

                  {/* Status Breakdown */}
                  <div className="p-4 border rounded-lg bg-muted/30">
                    <Label className="text-sm font-semibold">Status Overview</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {Object.entries(summary.statusBreakdown).map(([status, count]) => (
                        <Badge 
                          key={status} 
                          variant={status === 'ok' ? 'default' : status === 'down' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {status.toUpperCase()}: {count}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <Button 
                onClick={handleAggregateDevices} 
                disabled={isProcessing || datasets.length === 0}
                className="w-full h-12 text-base"
                size="lg"
              >
                <Database className="h-5 w-5 mr-2" />
                {isProcessing ? 'Processing Devices...' : 'Aggregate & Analyze Devices'}
              </Button>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Inventory Report Generation */}
      {aggregatedDevices.length > 0 && (
        <Card className="border-l-4 border-l-green-500">
          <Collapsible open={isReportOpen} onOpenChange={setIsReportOpen}>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div className="text-left">
                      <CardTitle className="text-lg">Simple Inventory Report</CardTitle>
                      <CardDescription className="text-sm">
                        Generate and manage device inventory reports
                      </CardDescription>
                    </div>
                  </div>
                  {isReportOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>

            <CollapsibleContent>
              <CardContent className="space-y-6">
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleGenerateInventoryReport} 
                    variant="default"
                    size="lg"
                    className="flex-1 min-w-[200px]"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </Button>
                  
                  {inventoryReport && (
                    <>
                      <Button onClick={handleSaveReport} variant="outline" size="lg">
                        <Save className="h-4 w-4 mr-2" />
                        Save Report
                      </Button>
                      <Button onClick={handleDownloadReport} variant="outline" size="lg">
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                    </>
                  )}
                </div>

                {inventoryReport && (
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Generated Report Preview</Label>
                    <div className="border rounded-lg bg-muted/30">
                      <Textarea
                        value={inventoryReport}
                        readOnly
                        className="min-h-[400px] font-mono text-sm border-0 bg-transparent resize-none"
                      />
                    </div>
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}
    </div>
  );
}