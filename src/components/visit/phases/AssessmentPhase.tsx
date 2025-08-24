import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Network, BarChart3, Search } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Import assessment components
import { AssessmentTimer } from '@/components/assessment/AssessmentTimer';
import { ProtocolStep } from '@/components/assessment/ProtocolStep';
import { SafetyChecklist } from '@/components/assessment/SafetyChecklist';
import { LocationMapping } from '@/components/assessment/LocationMapping';
import { ConnectionTester } from '@/components/assessment/ConnectionTester';
import { FileUploader } from '@/components/assessment/FileUploader';
import { NetworkAnalysisResults } from '@/components/assessment/NetworkAnalysisResults';
import { TridiumDataImporter } from '@/components/assessment/TridiumDataImporter';
import { SystemStatusCard } from '@/components/assessment/SystemStatusCard';
import { PriorityDiscussion } from '@/components/assessment/PriorityDiscussion';

interface AssessmentPhaseProps {
  onPhaseComplete: () => void;
}

export const AssessmentPhase: React.FC<AssessmentPhaseProps> = ({ onPhaseComplete }) => {
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
        return step5Data.uploadedFiles.length > 0 || step5Data.manualStationCount.trim() !== '' || step5Data.tridiumAnalysis.trim() !== '';
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

  const handleNetworkAnalysis = () => {
    if (step5Data.uploadedFiles.length === 0) return;

    // Simulate network analysis
    const analysisResults = {
      totalStations: Math.floor(Math.random() * 500) + 100,
      totalNetworks: Math.floor(Math.random() * 20) + 5,
      protocolsFound: ['BACnet', 'Modbus', 'LON', 'Ethernet IP'],
      filesProcessed: step5Data.uploadedFiles.length,
      networkSegments: [
        '192.168.1.0/24 - Main Building Network',
        '192.168.10.0/24 - HVAC Controllers',
        '192.168.20.0/24 - Lighting Systems'
      ],
      recommendations: [
        'Review BACnet device priorities for optimal performance',
        'Consider network segmentation for improved security',
        'Update firmware on legacy controllers identified'
      ]
    };

    setStep5Data(prev => ({ ...prev, analysisData: analysisResults }));
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
              <div className="space-y-6">
                <TridiumDataImporter
                  onDataSelected={(summaryText) => setStep5Data(prev => ({ ...prev, tridiumAnalysis: summaryText }))}
                />
                
                {step5Data.tridiumAnalysis && (
                  <Card className="p-4">
                    <h5 className="font-medium mb-3">Generated Analysis Summary</h5>
                    <div className="bg-muted p-3 rounded-md text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                      {step5Data.tridiumAnalysis}
                    </div>
                  </Card>
                )}

                  <Card className="p-4">
                    <h5 className="font-medium mb-3">Network Analysis (Optional)</h5>
                  <FileUploader
                    files={step5Data.uploadedFiles}
                    onFilesChange={(files) => setStep5Data(prev => ({ ...prev, uploadedFiles: files }))}
                  />
                  
                  {step5Data.uploadedFiles.length > 0 && (
                    <Button onClick={handleNetworkAnalysis} className="w-full mt-3">
                      Analyze Network Files
                    </Button>
                  )}

                  {step5Data.analysisData && (
                    <NetworkAnalysisResults data={step5Data.analysisData} />
                  )}
                </Card>

                <Card className="p-4">
                  <h5 className="font-medium mb-3">Manual Entry Alternative</h5>
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
                      <label className="text-sm font-medium">Key Components</label>
                      <Textarea
                        placeholder="Main system components..."
                        value={step5Data.manualComponents}
                        onChange={(e) => setStep5Data(prev => ({ ...prev, manualComponents: e.target.value }))}
                        rows={2}
                      />
                    </div>
                  </div>
                </Card>
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