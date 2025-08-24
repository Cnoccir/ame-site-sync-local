import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Network, AlertTriangle, CheckCircle, XCircle, Activity, FileUp, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import network analysis components
import { TridiumDataImporter } from '@/components/assessment/TridiumDataImporter';
import { NetworkHealthDashboard } from '@/components/assessment/NetworkHealthDashboard';
import { DeviceInventoryTable } from '@/components/assessment/DeviceInventoryTable';
import { NetworkSummaryGenerator } from '@/components/assessment/NetworkSummaryGenerator';

interface NetworkAnalysisPhaseProps {
  onPhaseComplete: () => void;
  visitId: string;
}

interface NetworkAnalysisData {
  uploadedFiles: File[];
  parsedData: any[];
  selectedDevices: Set<string>;
  selectedColumns: Set<string>;
  healthMetrics: any;
  generatedSummary: string;
}

export const NetworkAnalysisPhase: React.FC<NetworkAnalysisPhaseProps> = ({ 
  onPhaseComplete, 
  visitId 
}) => {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upload');
  const [analysisData, setAnalysisData] = useState<NetworkAnalysisData>({
    uploadedFiles: [],
    parsedData: [],
    selectedDevices: new Set(),
    selectedColumns: new Set(),
    healthMetrics: null,
    generatedSummary: ''
  });

  const [taskStatuses, setTaskStatuses] = useState({
    upload: 'pending',
    inventory: 'pending',
    health: 'pending',
    summary: 'pending'
  });

  const tasks = [
    {
      id: 'upload',
      name: 'Upload System Exports',
      description: 'Upload Tridium CSV exports (BACnet, N2, Resources, etc.)',
      icon: FileUp,
      requiredForCompletion: true
    },
    {
      id: 'inventory',
      name: 'Review Device Inventory',
      description: 'Review parsed device list and select items for report',
      icon: BarChart3,
      requiredForCompletion: true
    },
    {
      id: 'health',
      name: 'System Health Analysis',
      description: 'Review system performance and identify issues',
      icon: Activity,
      requiredForCompletion: false
    },
    {
      id: 'summary',
      name: 'Generate Network Summary',
      description: 'Create summary findings for final report',
      icon: CheckCircle,
      requiredForCompletion: true
    }
  ];

  const handleFileUpload = (files: File[]) => {
    setAnalysisData(prev => ({ ...prev, uploadedFiles: files }));
    if (files.length > 0) {
      setTaskStatuses(prev => ({ ...prev, upload: 'completed' }));
      setActiveTab('inventory');
    }
  };

  const handleDataParsed = (data: any[]) => {
    setAnalysisData(prev => ({ ...prev, parsedData: data }));
    
    // Auto-advance to health analysis if we have system resource data
    const hasResourceData = data.some(dataset => 
      dataset.type === 'resourceMetrics' || 
      dataset.filename.toLowerCase().includes('resource')
    );
    
    if (hasResourceData) {
      setActiveTab('health');
    }
  };

  const handleInventoryReview = (selectedDevices: Set<string>, selectedColumns: Set<string>) => {
    setAnalysisData(prev => ({ 
      ...prev, 
      selectedDevices, 
      selectedColumns 
    }));
    setTaskStatuses(prev => ({ ...prev, inventory: 'completed' }));
  };

  const handleHealthAnalysis = (healthMetrics: any) => {
    setAnalysisData(prev => ({ ...prev, healthMetrics }));
    setTaskStatuses(prev => ({ ...prev, health: 'completed' }));
    setActiveTab('summary');
  };

  const handleSummaryGenerated = (summary: string) => {
    setAnalysisData(prev => ({ ...prev, generatedSummary: summary }));
    setTaskStatuses(prev => ({ ...prev, summary: 'completed' }));
    
    toast({
      title: "Network Analysis Complete",
      description: "Summary generated successfully. Ready to proceed to next phase.",
    });
  };

  const canCompletePhase = () => {
    const requiredTasks = tasks.filter(task => task.requiredForCompletion);
    return requiredTasks.every(task => taskStatuses[task.id] === 'completed');
  };

  const getTaskStatusIcon = (taskId: string) => {
    const status = taskStatuses[taskId];
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'active':
        return <Activity className="w-5 h-5 text-blue-600 animate-pulse" />;
      case 'error':
        return <XCircle className="w-5 h-5 text-red-600" />;
      default:
        return <div className="w-5 h-5 rounded-full border-2 border-muted-foreground" />;
    }
  };

  const getCompletionProgress = () => {
    const totalTasks = tasks.length;
    const completedTasks = Object.values(taskStatuses).filter(status => status === 'completed').length;
    return Math.round((completedTasks / totalTasks) * 100);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <Network className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Network Analysis</h2>
          <p className="text-muted-foreground">
            Analyze building automation network health and device inventory
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-muted-foreground">Progress</div>
          <div className="flex items-center gap-2">
            <Progress value={getCompletionProgress()} className="w-24" />
            <span className="text-sm font-medium">{getCompletionProgress()}%</span>
          </div>
        </div>
      </div>

      {/* Task Overview */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Analysis Tasks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                activeTab === task.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              }`}
              onClick={() => setActiveTab(task.id)}
            >
              <div className="flex items-center gap-3 mb-2">
                {getTaskStatusIcon(task.id)}
                <task.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <h4 className="font-medium text-sm">{task.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
              {task.requiredForCompletion && (
                <Badge variant="outline" className="mt-2 text-xs">Required</Badge>
              )}
            </div>
          ))}
        </div>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">Upload Data</TabsTrigger>
          <TabsTrigger value="inventory" disabled={taskStatuses.upload !== 'completed'}>
            Device Inventory
          </TabsTrigger>
          <TabsTrigger value="health" disabled={analysisData.parsedData.length === 0}>
            Health Analysis
          </TabsTrigger>
          <TabsTrigger value="summary" disabled={taskStatuses.inventory !== 'completed'}>
            Generate Summary
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileUp className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Upload Tridium System Exports</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Upload CSV files exported from Tridium Niagara systems. Supported formats include 
              N2 Network exports, BACnet device lists, system resources, and Niagara station data.
            </p>
            
            <TridiumDataImporter
              onAnalysisComplete={(result) => {
                handleDataParsed(result.datasets);
                if (result.datasets.length > 0) {
                  toast({
                    title: "Files Processed",
                    description: `Successfully parsed ${result.datasets.length} dataset(s)`,
                  });
                }
              }}
              onDataSelected={handleSummaryGenerated}
            />

            {analysisData.uploadedFiles.length > 0 && (
              <div className="mt-4 p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle className="w-4 h-4" />
                  <span className="font-medium">Files Uploaded Successfully</span>
                </div>
                <p className="text-sm text-green-600 mt-1">
                  {analysisData.uploadedFiles.length} file(s) processed. 
                  Proceed to Device Inventory review.
                </p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="inventory" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Device Inventory & Selection</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Review discovered devices and select items to include in the final report. 
              Use filters to focus on critical issues or specific device types.
            </p>

            {analysisData.parsedData.length > 0 ? (
              <DeviceInventoryTable
                datasets={analysisData.parsedData}
                onSelectionChange={handleInventoryReview}
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No device data available. Please upload CSV files first.</p>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="health" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5" />
              <h3 className="text-lg font-semibold">System Health Analysis</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Monitor system performance metrics, resource utilization, and identify 
              potential issues affecting building automation performance.
            </p>

            <NetworkHealthDashboard
              datasets={analysisData.parsedData}
              onAnalysisComplete={handleHealthAnalysis}
            />
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckCircle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Network Analysis Summary</h3>
            </div>
            <p className="text-muted-foreground mb-6">
              Generate comprehensive summary of network analysis findings for inclusion 
              in the final assessment report.
            </p>

            <NetworkSummaryGenerator
              datasets={analysisData.parsedData}
              selectedDevices={analysisData.selectedDevices}
              selectedColumns={analysisData.selectedColumns}
              healthMetrics={analysisData.healthMetrics}
              onSummaryGenerated={handleSummaryGenerated}
            />

            {analysisData.generatedSummary && (
              <Card className="mt-6 p-4">
                <h4 className="font-medium mb-3">Generated Summary Preview</h4>
                <div className="bg-muted p-4 rounded-md text-sm whitespace-pre-wrap max-h-80 overflow-y-auto">
                  {analysisData.generatedSummary}
                </div>
              </Card>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Complete Phase Button */}
      {canCompletePhase() && (
        <div className="flex justify-end pt-4">
          <Button onClick={onPhaseComplete} size="lg" className="min-w-[200px]">
            Complete Network Analysis
          </Button>
        </div>
      )}

      {/* Critical Issues Alert */}
      {analysisData.healthMetrics?.criticalIssues?.length > 0 && (
        <Card className="border-red-200 bg-red-50">
          <div className="p-4">
            <div className="flex items-center gap-2 text-red-700 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <span className="font-semibold">Critical Issues Detected</span>
            </div>
            <ul className="text-sm text-red-600 space-y-1">
              {analysisData.healthMetrics.criticalIssues.map((issue: string, index: number) => (
                <li key={index}>• {issue}</li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
};