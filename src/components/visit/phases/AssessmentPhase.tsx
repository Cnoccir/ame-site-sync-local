import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Network, BarChart3, Search, Save } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { AMEService } from '@/services/ameService';
import { useAutoSave } from '@/hooks/useAutoSave';
import { RequiredField } from '@/components/ui/required-field';

// Import assessment components

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
import { TridiumDataImporter } from '@/components/assessment/TridiumDataImporter';

interface AssessmentPhaseProps {
  onPhaseComplete: () => void;
  visitId: string;
  sessionData?: any;
  updateAutoSaveData?: (data: any) => void;
}

export const AssessmentPhase: React.FC<AssessmentPhaseProps> = ({ onPhaseComplete, visitId, sessionData, updateAutoSaveData }) => {
  const { toast } = useToast();
  
  const [currentStep, setCurrentStep] = useState(1);
  const [expandedStep, setExpandedStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  
  // Step completion states
  const [stepStatuses, setStepStatuses] = useState<Record<number, 'pending' | 'active' | 'completed' | 'skipped'>>({
    1: 'pending',
    2: 'pending', 
    3: 'pending',
    4: 'pending',
    5: 'pending',
    6: 'pending'
  });

  // Track skipped steps
  const [skippedSteps, setSkippedSteps] = useState<number[]>([]);

  // Completion tracking for reactive updates
  const [completionTriggers, setCompletionTriggers] = useState({
    4: 0, // Connection tests completion counter
    5: 0, // Network analysis completion counter  
    6: 0  // System status completion counter
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
    tridiumAnalysis: '' as string,
    generatedSummary: '' as string
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

  // Auto-save with debouncing
  const { debouncedSave, setLoading } = useAutoSave({
    delay: 2000,
    onSave: (data) => {
      if (updateAutoSaveData) {
        setIsSaving(true);
        updateAutoSaveData(data);
        setTimeout(() => setIsSaving(false), 500);
      }
    },
    enabled: true
  });

  // Load saved data on component mount
  useEffect(() => {
    if (sessionData?.autoSaveData?.assessmentPhase) {
      setLoading(true);
      const savedData = sessionData.autoSaveData.assessmentPhase;
      
      if (savedData.stepStatuses) {
        setStepStatuses(savedData.stepStatuses);
      }
      
      if (savedData.skippedSteps) {
        setSkippedSteps(savedData.skippedSteps);
      }
      
      if (savedData.currentStep) {
        setCurrentStep(savedData.currentStep);
        setExpandedStep(savedData.currentStep);
      }
      
      // Load step data
      if (savedData.step1Data) setStep1Data(savedData.step1Data);
      if (savedData.step2Data) setStep2Data(savedData.step2Data);
      if (savedData.step3Data) setStep3Data(savedData.step3Data);
      if (savedData.step4Data) setStep4Data(savedData.step4Data);
      if (savedData.step5Data) setStep5Data(savedData.step5Data);
      if (savedData.step6Data) setStep6Data(savedData.step6Data);
      if (savedData.priorityData) setPriorityData(savedData.priorityData);
      if (savedData.systemStatusData) setSystemStatusData(savedData.systemStatusData);
      
      setTimeout(() => setLoading(false), 100);
    }
  }, [sessionData, setLoading]);

  // Trigger auto-save when data changes
  useEffect(() => {
    debouncedSave({
      assessmentPhase: {
        currentStep,
        expandedStep,
        stepStatuses,
        skippedSteps,
        step1Data,
        step2Data,
        step3Data,
        step4Data,
        step5Data,
        step6Data,
        priorityData,
        systemStatusData,
        lastUpdated: new Date().toISOString()
      }
    });
  }, [
    currentStep, expandedStep, stepStatuses, skippedSteps,
    step1Data, step2Data, step3Data, step4Data, step5Data, step6Data,
    priorityData, systemStatusData, debouncedSave
  ]);

  const handleStepStart = (stepNumber: number) => {
    setStepStatuses(prev => ({
      ...prev,
      [stepNumber]: 'active'
    }));
    setCurrentStep(stepNumber);
    setExpandedStep(stepNumber);
  };

  const handleStepToggle = (stepNumber: number) => {
    if (expandedStep === stepNumber) {
      setExpandedStep(0); // Collapse if already expanded
    } else {
      setExpandedStep(stepNumber);
    }
  };

  const handleStepComplete = async (stepNumber: number) => {
    const newSkippedSteps = skippedSteps.filter(num => num !== stepNumber);
    
    setStepStatuses(prev => ({
      ...prev,
      [stepNumber]: 'completed'
    }));
    
    setSkippedSteps(newSkippedSteps);
    
    // Save to database if there were skipped steps changes
    if (newSkippedSteps.length !== skippedSteps.length) {
      try {
        await AMEService.saveSkippedSteps(visitId, newSkippedSteps);
      } catch (error) {
        console.error('Failed to save skipped steps:', error);
      }
    }
    
    // Auto-advance to next step
    if (stepNumber < 6) {
      setCurrentStep(stepNumber + 1);
      setExpandedStep(stepNumber + 1);
    }
  };

  const canStartStep = (stepNumber: number) => {
    // Allow free navigation - users can start any step
    return true;
  };
  
  const handleStepSkip = async (stepNumber: number) => {
    const newSkippedSteps = [...skippedSteps.filter(num => num !== stepNumber), stepNumber];
    
    setStepStatuses(prev => ({
      ...prev,
      [stepNumber]: 'skipped'
    }));
    
    setSkippedSteps(newSkippedSteps);
    
    // Save to database
    try {
      await AMEService.saveSkippedSteps(visitId, newSkippedSteps);
    } catch (error) {
      console.error('Failed to save skipped steps:', error);
    }
    
    // Update current step to next available step
    const nextStep = stepNumber + 1;
    if (nextStep <= 6) {
      setCurrentStep(nextStep);
      setExpandedStep(nextStep);
    }
    
    toast({
      title: "Step Skipped",
      description: `Step ${stepNumber} has been skipped. You can return to complete it later if needed.`,
      variant: "default"
    });
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
        // Allow completion with warnings if tests are run (success or failed)
        return step4Data.supervisorStatus !== 'not_tested' || step4Data.workbenchStatus !== 'not_tested';
      case 5:
        return step5Data.analysisData !== null || Boolean(step5Data.generatedSummary);
      case 6:
        return step6Data.activeAlarms !== '' && step6Data.criticalAlarms !== '';
      default:
        return false;
    }
  };

  const canSkipStep = (stepNumber: number): boolean => {
    // All steps can be skipped - this is a learning tool
    return stepStatuses[stepNumber] === 'active';
  };

  // Reactive completion checking for steps 4-6
  useEffect(() => {
    // Step 4: Auto-complete when connection tests are attempted (regardless of result)
    if (stepStatuses[4] === 'active' && canCompleteStep(4) && 
        (step4Data.supervisorStatus !== 'not_tested' || step4Data.workbenchStatus !== 'not_tested')) {
      
      // Show warning if all tests failed
      if (step4Data.supervisorStatus === 'failed' && step4Data.workbenchStatus === 'failed') {
        toast({
          title: "Warning: System Access Issues",
          description: "All connection tests failed, but step completed. Review system access before proceeding.",
          variant: "destructive"
        });
      }
      
      handleStepComplete(4);
    }
  }, [step4Data.supervisorStatus, step4Data.workbenchStatus, stepStatuses]);

  useEffect(() => {
    // Step 5: Auto-complete when analysis is done
    if (stepStatuses[5] === 'active' && canCompleteStep(5)) {
      handleStepComplete(5);
    }
  }, [step5Data.analysisData, step5Data.generatedSummary, stepStatuses]);

  useEffect(() => {
    // Step 6: Auto-complete when system status is collected
    if (stepStatuses[6] === 'active' && canCompleteStep(6)) {
      handleStepComplete(6);
    }
  }, [step6Data.activeAlarms, step6Data.criticalAlarms, stepStatuses]);


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
  
  // Warning about skipped steps
  const hasSkippedSteps = skippedSteps.length > 0;
  
  const handlePhaseComplete = () => {
    if (hasSkippedSteps) {
      toast({
        title: "Warning: Skipped Steps",
        description: `You have ${skippedSteps.length} skipped step(s). Consider completing them before moving to the next phase.`,
        variant: "destructive"
      });
    }
    onPhaseComplete();
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
    // Assessment is complete if all steps are either completed or skipped
    return Object.values(stepStatuses).every(status => status === 'completed' || status === 'skipped');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-orange-100 flex items-center justify-center">
            <Search className="w-5 h-5 text-orange-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Phase 2: Initial Assessment</h2>
            <p className="text-muted-foreground">Systematic arrival protocol</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Save className="w-4 h-4 animate-pulse" />
              Saving...
            </div>
          )}
        </div>
      </div>

      {/* Warning about skipped steps */}
      {hasSkippedSteps && (
        <Card className="p-4 border-warning bg-warning/5">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-warning" />
            <div>
              <h4 className="font-medium text-warning">Skipped Steps</h4>
              <p className="text-sm text-muted-foreground">
                Steps {skippedSteps.join(', ')} were skipped. Consider completing them for thorough assessment.
              </p>
            </div>
          </div>
        </Card>
      )}


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
            onToggle={() => handleStepToggle(step.number)}
            onStart={() => handleStepStart(step.number)}
            onComplete={() => handleStepComplete(step.number)}
            onSkip={() => handleStepSkip(step.number)}
            canStart={canStartStep(step.number)}
            canComplete={canCompleteStep(step.number)}
            canSkip={canSkipStep(step.number)}
          >
            {/* Step Content */}
            {step.number === 1 && (
              <div className="space-y-4">
                <RequiredField required={true} completed={step1Data.contactPerson.trim() !== ''}>
                  <div>
                    <label className="text-sm font-medium">Contact Person *</label>
                    <Input
                      placeholder="Primary contact on-site"
                      value={step1Data.contactPerson}
                      onChange={(e) => setStep1Data(prev => ({ ...prev, contactPerson: e.target.value }))}
                    />
                  </div>
                </RequiredField>
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
                onChange={(newData) => {
                  setStep4Data(newData);
                  // Trigger completion check when status changes
                  if (newData.supervisorStatus === 'success' || newData.workbenchStatus === 'success') {
                    setCompletionTriggers(prev => ({ ...prev, 4: prev[4] + 1 }));
                  }
                }}
                visitId={visitId}
              />
            )}

            {step.number === 5 && (
              <div className="space-y-4">
                <h5 className="font-medium mb-3">Network Inventory Analysis</h5>
                <p className="text-sm text-muted-foreground mb-4">
                  Upload Tridium CSV exports and follow the 4-step curation workflow.
                </p>
                
                <TridiumDataImporter
                  visitId={visitId}
                  onAnalysisComplete={(result) => {
                    setStep5Data(prev => ({ 
                      ...prev, 
                      analysisResult: result,
                      analysisData: {
                        totalStations: result.datasets.reduce((sum, ds) => sum + ds.rows.length, 0),
                        onlineCount: result.datasets.reduce((sum, ds) => sum + ds.summary.statusBreakdown.ok, 0),
                        downCount: result.datasets.reduce((sum, ds) => sum + ds.summary.statusBreakdown.down, 0),
                        alarmCount: result.datasets.reduce((sum, ds) => sum + ds.summary.statusBreakdown.alarm, 0),
                        protocolsFound: [...new Set(result.datasets.map(ds => ds.type))],
                        devices: result.datasets.flatMap(ds => ds.rows.map(row => ({
                          ...row.data,
                          sourceFile: ds.filename,
                          format: ds.type,
                          statusBadge: row.parsedStatus?.badge.variant || 'secondary'
                        })))
                      }
                    }));
                    // Trigger completion check
                    setCompletionTriggers(prev => ({ ...prev, 5: prev[5] + 1 }));
                  }}
                  onDataSelected={(summaryText) => {
                    setStep5Data(prev => ({ 
                      ...prev, 
                      generatedSummary: summaryText 
                    }));
                    // Trigger completion check
                    setCompletionTriggers(prev => ({ ...prev, 5: prev[5] + 1 }));
                  }}
                />
              </div>
            )}

            {step.number === 6 && (
              <div className="space-y-4">
                <h5 className="font-medium">System Status Grid</h5>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <RequiredField required={true} completed={step6Data.activeAlarms !== ''}>
                    <div>
                      <label className="text-sm font-medium">Active Alarms *</label>
                      <Input
                        type="number"
                        placeholder="Count"
                        value={step6Data.activeAlarms}
                        onChange={(e) => {
                          setStep6Data(prev => ({ ...prev, activeAlarms: e.target.value }));
                          setCompletionTriggers(prev => ({ ...prev, 6: prev[6] + 1 }));
                        }}
                      />
                    </div>
                  </RequiredField>
                  <RequiredField required={true} completed={step6Data.criticalAlarms !== ''}>
                    <div>
                      <label className="text-sm font-medium">Critical Alarms *</label>
                      <Input
                        type="number"
                        placeholder="Count"
                        value={step6Data.criticalAlarms}
                        onChange={(e) => {
                          setStep6Data(prev => ({ ...prev, criticalAlarms: e.target.value }));
                          setCompletionTriggers(prev => ({ ...prev, 6: prev[6] + 1 }));
                        }}
                      />
                    </div>
                  </RequiredField>
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
          <Button onClick={handlePhaseComplete} size="lg" className="min-w-[200px]">
            Complete Assessment
          </Button>
        </div>
      )}
    </div>
  );
};