import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Network, BarChart3, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

// Import assessment components
import { AssessmentTimer } from '@/components/assessment/AssessmentTimer';
import { ProtocolStep } from '@/components/assessment/ProtocolStep';
import { SafetyChecklist } from '@/components/assessment/SafetyChecklist';
import { LocationMapping } from '@/components/assessment/LocationMapping';
import { ConnectionTester } from '@/components/assessment/ConnectionTester';
import { FileUploader } from '@/components/assessment/FileUploader';
import { NetworkAnalysisResults } from '@/components/assessment/NetworkAnalysisResults';
import { SystemStatusCard } from '@/components/assessment/SystemStatusCard';
import { PriorityDiscussion } from '@/components/assessment/PriorityDiscussion';
import { NetworkHealthDashboard } from '@/components/assessment/NetworkHealthDashboard';
import { DeviceInventoryTable } from '@/components/assessment/DeviceInventoryTable';
import { NetworkSummaryGenerator } from '@/components/assessment/NetworkSummaryGenerator';

interface AssessmentPhaseProps {
  onPhaseComplete: () => void;
  visitId: string;
}

export const AssessmentPhase: React.FC<AssessmentPhaseProps> = ({ onPhaseComplete, visitId }) => {
  const { toast } = useToast();
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedStep, setExpandedStep] = useState(1);
  
  // Step completion states
  const [stepStatuses, setStepStatuses] = useState({
    1: 'pending',
    2: 'pending', 
    3: 'pending',
    4: 'pending',
    5: 'pending',
    6: 'pending'
  });

  // Form data for each step
  const [step1Data, setStep1Data] = useState({
    contactPerson: '',
    specialRequests: ''
  });

  const [step2Data, setStep2Data] = useState({
    ppeAvailable: false,
    hazardsReviewed: false,
    emergencyProcedures: false,
    notes: ''
  });

  const [step3Data, setStep3Data] = useState({
    supervisorLocation: '',
    supervisorAccess: '',
    jaceLocations: '',
    jaceAccess: '',
    controllerDetails: '',
    controllerChallenges: '',
    panelsAccessible: false,
    wiringCondition: false,
    environmentalOk: false,
    issuesFound: ''
  });

  const [step4Data, setStep4Data] = useState({
    supervisorIp: '',
    supervisorUsername: '',
    supervisorPassword: '',
    supervisorStatus: 'not_tested' as 'not_tested' | 'testing' | 'success' | 'failed',
    workbenchUsername: '',
    workbenchPassword: '',
    workbenchStatus: 'not_tested' as 'not_tested' | 'testing' | 'success' | 'failed',
    systemVersion: '',
    connectionNotes: ''
  });

  const [step5Data, setStep5Data] = useState({
    uploadedFiles: [] as File[],
    analysisData: null as any,
    manualStationCount: '',
    manualComponents: '',
    manualProtocols: '',
    analysisMode: 'upload',
    tridiumAnalysis: '' as string
  });

  const [step6Data, setStep6Data] = useState({
    activeAlarms: '',
    criticalAlarms: '',
    cpuUsage: '',
    memoryUsage: '',
    criticalIssues: ''
  });

  const [priorityData, setPriorityData] = useState({
    comfortIssues: '',
    equipmentProblems: '',
    energyConcerns: '',
    operationalRequests: ''
  });

  const [systemStatusData, setSystemStatusData] = useState({
    activeAlarms: 0,
    commHealth: 95,
    overridePoints: 3,
    performance: 87
  });

  const protocolSteps = [
    { number: 1, title: 'Customer Check-In', duration: 5 },
    { number: 2, title: 'Safety Assessment', duration: 5 },
    { number: 3, title: 'Physical System Walk', duration: 10 },
    { number: 4, title: 'System Access Test', duration: 15 },
    { number: 5, title: 'Network Inventory Analysis', duration: 15 },
    { number: 6, title: 'Initial System Status', duration: 10 }
  ];

  // Auto-save functionality
  useEffect(() => {
    const interval = setInterval(() => {
      // Auto-save logic here
      
    }, 15000);

    return () => clearInterval(interval);
  }, []);

  const handleStepStart = (stepNumber: number) => {
    if (!isTimerRunning && stepNumber === 1) {
      setIsTimerRunning(true);
    }
    
    setStepStatuses(prev => ({
      ...prev,
      [stepNumber]: 'active'
    }));
    setCurrentStep(stepNumber);
    setExpandedStep(stepNumber);
  };

  const handleStepComplete = (stepNumber: number) => {
    setStepStatuses(prev => ({
      ...prev,
      [stepNumber]: 'completed'
    }));
    
    // Auto-advance to next step
    if (stepNumber < 6) {
      setCurrentStep(stepNumber + 1);
      setExpandedStep(stepNumber + 1);
    }
  };

  const canStartStep = (stepNumber: number) => {
    if (stepNumber === 1) return true;
    return stepStatuses[stepNumber - 1] === 'completed';
  };

  const canCompleteStep = (stepNumber: number) => {
    switch (stepNumber) {
      case 1:
        return step1Data.contactPerson.trim() !== '';
      case 2:
        return step2Data.ppeAvailable && step2Data.hazardsReviewed && step2Data.emergencyProcedures;
      case 3:
        return step3Data.panelsAccessible && step3Data.wiringCondition && step3Data.environmentalOk;
      case 4:
        return step4Data.supervisorStatus === 'success' || step4Data.workbenchStatus === 'success';
      case 5:
        return step5Data.analysisMode === 'upload' 
          ? step5Data.uploadedFiles.length > 0 
          : step5Data.manualStationCount.trim() !== '';
      case 6:
        return step6Data.activeAlarms !== '' && step6Data.criticalAlarms !== '';
      default:
        return false;
    }
  };

  const handleTimeWarning = () => {
    toast({
      title: "Time Warning",
      description: "Assessment approaching 25 minutes. Consider wrapping up current step.",
      variant: "destructive"
    });
  };

  const handleTimeUp = () => {
    toast({
      title: "Time Exceeded",
      description: "30-minute assessment period has elapsed.",
      variant: "destructive"
    });
  };

  const parseCSVFile = async (file: File) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
          
          // Detect format
          let format = 'unknown';
          if (headers.includes('Controller Type')) format = 'n2Export';
          else if (headers.includes('Device ID') && headers.includes('Vendor')) format = 'bacnetExport';
          else if (headers.length === 2 && headers.includes('Name') && headers.includes('Value')) format = 'resourceExport';
          else if (headers.includes('Fox Port')) format = 'niagaraNetExport';
          
          const devices = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const device: any = { id: `${file.name}-${index}`, sourceFile: file.name, format };
            
            headers.forEach((header, i) => {
              device[header] = values[i] || '';
            });
            
            // Parse status for different formats
            if (format === 'n2Export' && device.Status) {
              const statusMatch = device.Status.match(/\{([^}]+)\}/);
              if (statusMatch) {
                const statuses = statusMatch[1].split(',');
                device.isOnline = statuses.includes('ok');
                device.isDown = statuses.includes('down');
                device.hasAlarm = statuses.includes('alarm') || statuses.includes('unackedAlarm');
                device.statusBadge = device.isDown ? 'error' : device.hasAlarm ? 'warning' : 'success';
              }
            }
            
            return device;
          });
          
          resolve({ format, devices, fileName: file.name });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const handleNetworkAnalysis = async () => {
    if (step5Data.uploadedFiles.length === 0) return;

    try {
      toast({
        title: "Processing Files",
        description: "Analyzing CSV files...",
      });

      const parseResults = await Promise.all(
        step5Data.uploadedFiles.map(file => parseCSVFile(file))
      );

      const allDevices = parseResults.flatMap((result: any) => result.devices);
      const formats = [...new Set(parseResults.map((result: any) => result.format))];
      const protocols = [...new Set(allDevices.map(device => {
        if (device.format === 'bacnetExport') return 'BACnet';
        if (device.format === 'n2Export') return 'N2';
        if (device.format === 'niagaraNetExport') return 'Niagara';
        return 'Unknown';
      }))];

      const onlineDevices = allDevices.filter(d => d.isOnline);
      const downDevices = allDevices.filter(d => d.isDown);
      const alarmDevices = allDevices.filter(d => d.hasAlarm);

      const analysisResults = {
        totalStations: allDevices.length,
        totalNetworks: formats.length,
        protocolsFound: protocols,
        filesProcessed: step5Data.uploadedFiles.length,
        onlineCount: onlineDevices.length,
        downCount: downDevices.length,
        alarmCount: alarmDevices.length,
        devices: allDevices,
        networkSegments: [
          '192.168.1.0/24 - Main Building Network',
          '192.168.10.0/24 - HVAC Controllers', 
          '192.168.20.0/24 - Lighting Systems'
        ],
        recommendations: [
          downDevices.length > 0 ? `${downDevices.length} devices are offline - check network connectivity` : null,
          alarmDevices.length > 0 ? `${alarmDevices.length} devices have active alarms - review system status` : null,
          'Review BACnet device priorities for optimal performance',
          'Consider network segmentation for improved security'
        ].filter(Boolean)
      };

      setStep5Data(prev => ({ 
        ...prev, 
        analysisData: analysisResults,
        currentTask: 2 
      }));

      // Store analysis results in network_inventory table
      const { error } = await supabase
        .from('network_inventory')
        .upsert({
          visit_id: visitId,
          analysis_data: analysisResults,
          total_stations: analysisResults.totalStations,
          file_names: step5Data.uploadedFiles.map(f => f.name),
          protocols_found: analysisResults.protocolsFound,
          analysis_completed_at: new Date().toISOString()
        });

      if (error) {
        console.error('Database save error:', error);
        toast({
          title: "Warning",
          description: "Analysis completed but couldn't save to database.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Analysis Complete",
          description: `Processed ${allDevices.length} devices from ${step5Data.uploadedFiles.length} files. Continue to review data.`,
        });
      }
    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Error", 
        description: "Failed to parse CSV files.",
        variant: "destructive"
      });
    }
  };

  const runDiagnostics = () => {
    setSystemStatusData({
      activeAlarms: Math.floor(Math.random() * 20),
      commHealth: Math.floor(Math.random() * 20) + 80,
      overridePoints: Math.floor(Math.random() * 10),
      performance: Math.floor(Math.random() * 30) + 70
    });
  };

  const isAssessmentComplete = () => {
    return Object.values(stepStatuses).every(status => status === 'completed');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
          <Search className="w-5 h-5 text-orange-600" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Phase 2: Initial Assessment</h2>
          <p className="text-muted-foreground">30-minute systematic arrival protocol</p>
        </div>
      </div>

      {/* Assessment Timer */}
      <AssessmentTimer 
        isRunning={isTimerRunning}
        onTimeWarning={handleTimeWarning}
        onTimeUp={handleTimeUp}
      />

      {/* Protocol Steps */}
      <div className="space-y-4">
        {protocolSteps.map(step => (
          <ProtocolStep
            key={step.number}
            stepNumber={step.number}
            title={step.title}
            duration={step.duration}
            status={stepStatuses[step.number]}
            isExpanded={expandedStep === step.number}
            onToggle={() => setExpandedStep(expandedStep === step.number ? 0 : step.number)}
            onStart={() => handleStepStart(step.number)}
            onComplete={() => handleStepComplete(step.number)}
            canStart={canStartStep(step.number)}
            canComplete={canCompleteStep(step.number)}
          >
            {/* Step Content */}
            {step.number === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Contact Person</label>
                  <Input
                    placeholder="Primary contact on-site"
                    value={step1Data.contactPerson}
                    onChange={(e) => setStep1Data(prev => ({ ...prev, contactPerson: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Special Requests</label>
                  <Textarea
                    placeholder="Any special requests or considerations..."
                    value={step1Data.specialRequests}
                    onChange={(e) => setStep1Data(prev => ({ ...prev, specialRequests: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            )}

            {step.number === 2 && (
              <SafetyChecklist
                value={step2Data}
                onChange={setStep2Data}
              />
            )}

            {step.number === 3 && (
              <LocationMapping
                value={step3Data}
                onChange={setStep3Data}
              />
            )}

            {step.number === 4 && (
              <ConnectionTester
                value={step4Data}
                onChange={setStep4Data}
              />
            )}

            {step.number === 5 && (
              <div className="space-y-4">
                <h5 className="font-medium mb-3">Network Inventory Analysis</h5>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload Tridium CSV exports or enter network information manually.
                </p>
                
                <Tabs value={step5Data.analysisMode || 'upload'} onValueChange={(mode) => 
                  setStep5Data(prev => ({ ...prev, analysisMode: mode }))
                }>
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="upload">Upload CSV Files</TabsTrigger>
                    <TabsTrigger value="manual">Manual Entry</TabsTrigger>
                  </TabsList>

                  <TabsContent value="upload" className="space-y-4">
                    <FileUploader
                      files={step5Data.uploadedFiles}
                      onFilesChange={(files) => {
                        setStep5Data(prev => ({ ...prev, uploadedFiles: files }));
                        if (files.length > 0) {
                          handleNetworkAnalysis();
                        }
                      }}
                      acceptedTypes={['.csv']}
                      maxFiles={5}
                    />
                    
                    {step5Data.analysisData && (
                      <div className="space-y-4">
                        <Card className="p-4 bg-green-50">
                          <h6 className="font-medium text-green-800 mb-2">Analysis Complete</h6>
                          <div className="text-sm text-green-700 space-y-1">
                            <p>• {step5Data.analysisData.totalStations} devices discovered</p>
                            <p>• {step5Data.analysisData.onlineCount} online, {step5Data.analysisData.downCount} offline</p>
                            <p>• {step5Data.analysisData.alarmCount} devices with alarms</p>
                            <p>• Protocols: {step5Data.analysisData.protocolsFound.join(', ')}</p>
                          </div>
                        </Card>
                        
                        {step5Data.analysisData.devices && step5Data.analysisData.devices.length > 0 && (
                          <Card className="p-4">
                            <h6 className="font-medium mb-3">Device Inventory</h6>
                            <div className="overflow-x-auto">
                              <table className="w-full text-sm">
                                <thead>
                                  <tr className="border-b">
                                    <th className="text-left p-2">Device Name</th>
                                    <th className="text-left p-2">Status</th>
                                    <th className="text-left p-2">Type</th>
                                    <th className="text-left p-2">Source File</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {step5Data.analysisData.devices.slice(0, 10).map((device: any, index: number) => (
                                    <tr key={index} className="border-b">
                                      <td className="p-2">{device.Name || device.name || `Device ${index + 1}`}</td>
                                      <td className="p-2">
                                        <Badge variant={device.statusBadge || 'secondary'}>
                                          {device.Status || device.status || 'Unknown'}
                                        </Badge>
                                      </td>
                                      <td className="p-2">{device['Controller Type'] || device.Type || device.format}</td>
                                      <td className="p-2">{device.sourceFile}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                              {step5Data.analysisData.devices.length > 10 && (
                                <p className="text-xs text-muted-foreground mt-2">
                                  Showing 10 of {step5Data.analysisData.devices.length} devices
                                </p>
                              )}
                            </div>
                          </Card>
                        )}
                      </div>
                    )}
                  </TabsContent>

                  <TabsContent value="manual" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <label className="text-sm font-medium">Station Count</label>
                        <Input
                          type="number"
                          placeholder="Number of stations"
                          value={step5Data.manualStationCount}
                          onChange={(e) => setStep5Data(prev => ({ ...prev, manualStationCount: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="text-sm font-medium">Network Protocols</label>
                        <Input
                          placeholder="e.g., BACnet, Modbus, LON"
                          value={step5Data.manualProtocols || ''}
                          onChange={(e) => setStep5Data(prev => ({ ...prev, manualProtocols: e.target.value }))}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium">Key Components</label>
                      <Textarea
                        placeholder="Main system components, controllers, network details..."
                        value={step5Data.manualComponents}
                        onChange={(e) => setStep5Data(prev => ({ ...prev, manualComponents: e.target.value }))}
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                </Tabs>
              </div>
            )}

            {step.number === 6 && (
              <div className="space-y-4">
                <h5 className="font-medium">System Status Grid</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <label className="text-sm font-medium">Active Alarms</label>
                    <Input
                      type="number"
                      placeholder="Count"
                      value={step6Data.activeAlarms}
                      onChange={(e) => setStep6Data(prev => ({ ...prev, activeAlarms: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Critical Alarms</label>
                    <Input
                      type="number"
                      placeholder="Count"
                      value={step6Data.criticalAlarms}
                      onChange={(e) => setStep6Data(prev => ({ ...prev, criticalAlarms: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">CPU Usage %</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      value={step6Data.cpuUsage}
                      onChange={(e) => setStep6Data(prev => ({ ...prev, cpuUsage: e.target.value }))}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Memory Usage %</label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      placeholder="0-100"
                      value={step6Data.memoryUsage}
                      onChange={(e) => setStep6Data(prev => ({ ...prev, memoryUsage: e.target.value }))}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">Critical Issues</label>
                  <Textarea
                    placeholder="Document any critical issues found..."
                    value={step6Data.criticalIssues}
                    onChange={(e) => setStep6Data(prev => ({ ...prev, criticalIssues: e.target.value }))}
                    rows={3}
                  />
                </div>
              </div>
            )}
          </ProtocolStep>
        ))}
      </div>

      {/* System Status Cards */}
      {isAssessmentComplete() && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">System Diagnostics</h3>
            <Button onClick={runDiagnostics} variant="outline">
              Run Diagnostics
            </Button>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SystemStatusCard
              icon={AlertTriangle}
              title="Active Alarms"
              value={systemStatusData.activeAlarms}
              variant={systemStatusData.activeAlarms > 10 ? 'warning' : 'default'}
            />
            <SystemStatusCard
              icon={Network}
              title="Communication Health"
              value={`${systemStatusData.commHealth}%`}
              variant={systemStatusData.commHealth > 90 ? 'success' : 'warning'}
            />
            <SystemStatusCard
              icon={AlertTriangle}
              title="Override Points"
              value={systemStatusData.overridePoints}
              variant={systemStatusData.overridePoints > 5 ? 'warning' : 'default'}
            />
            <SystemStatusCard
              icon={BarChart3}
              title="System Performance"
              value={`${systemStatusData.performance}%`}
              variant={systemStatusData.performance > 85 ? 'success' : 'warning'}
            />
          </div>
        </Card>
      )}

      {/* Customer Priority Discussion */}
      {isAssessmentComplete() && (
        <Card className="p-6">
          <PriorityDiscussion
            value={priorityData}
            onChange={setPriorityData}
          />
        </Card>
      )}

      {/* Complete Assessment Button */}
      {isAssessmentComplete() && (
        <div className="flex justify-end pt-4">
          <Button onClick={onPhaseComplete} size="lg" className="min-w-[200px]">
            Complete Assessment
          </Button>
        </div>
      )}
    </div>
  );
};