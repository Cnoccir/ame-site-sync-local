import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  ArrowLeft, 
  Save, 
  Target, 
  CheckCircle2, 
  Clock,
  AlertTriangle,
  FileText,
  Database,
  Wrench,
  BarChart3
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { UnifiedCustomerDataService } from '@/services/unifiedCustomerDataService';
import { PMWorkflowPersistenceService } from '@/services/pmWorkflowPersistenceService';
import { useToast } from '@/hooks/use-toast';

// Import shared components
import { PhaseNavigation, ProgressTracker, PhaseReviewModal, generatePhaseModalSections, getPhaseTitle, PhaseOverviewBar, generatePhaseSummary } from './shared';

// Import Phase Components  
import { Phase1SiteIntelligence } from './phases/Phase1SiteIntelligence';
import { Phase2SystemDiscovery } from './phases/Phase2SystemDiscovery';
import { UnifiedSystemDiscovery } from './UnifiedSystemDiscovery';
import { DiscoveryFoundation } from './DiscoveryFoundation';
import { FeatureFlagService } from '@/config/featureFlags';
import { Phase3ServiceActivities } from './phases/Phase3ServiceActivities';
import { Phase4Documentation } from './phases/Phase4Documentation';

// Import types
import { 
  PMWorkflowData, 
  PMWorkflowSession, 
  PhaseProgress, 
  NavigationState,
  SiteIntelligenceData,
  SystemDiscoveryData,
  ServiceActivitiesData,
  DocumentationData
} from '@/types/pmWorkflow';

// ===== MOCK DATA FOR DEVELOPMENT =====
const createMockWorkflowData = (serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN' = 'CORE'): PMWorkflowData => {
  const session: PMWorkflowSession = {
    id: `WF-${Date.now()}`,
    customerId: 'MOCK-001',
    customerName: 'Sample Customer',
    serviceTier,
    currentPhase: 1,
    startTime: new Date(),
    lastSaved: new Date(),
    status: 'In Progress',
    technicianName: 'Test Technician',
    technicianId: 'TECH-001'
  };

  const siteIntelligence: SiteIntelligenceData = {
    customer: {
      companyName: '',
      siteName: '',
      address: '',
      serviceTier: serviceTier,
      contractNumber: '',
      accountManager: ''
    },
    contacts: [],
    access: {
      method: '',
      parkingInstructions: '',
      badgeRequired: false,
      escortRequired: false,
      bestArrivalTime: '',
      specialInstructions: ''
    },
    safety: {
      requiredPPE: [],
      knownHazards: [],
      safetyContact: '',
      safetyPhone: '',
      specialNotes: ''
    },
    projectHandoff: {
      hasSubmittals: false,
      hasAsBuilts: false,
      hasFloorPlans: false,
      hasSOO: false,
      completenessScore: 0,
      notes: ''
    }
  };

  const systemDiscovery: SystemDiscoveryData = {
    bmsSystem: {
      platform: '',
      softwareVersion: '',
      supervisorLocation: '',
      supervisorIP: '',
      networkMethod: '',
      credentialsLocation: '',
      notes: ''
    },
    tridiumExports: {
      processed: false
    },
    manualInventory: {
      totalDeviceCount: 0,
      majorEquipment: [],
      controllerTypes: [],
      networkSegments: [],
      notes: ''
    },
    photos: [],
    systemAccess: {
      bmsCredentials: undefined,
      windowsCredentials: undefined,
      serviceCredentials: undefined
    },
    remoteAccess: {
      credentials: [],
      hasCredentials: false,
      vpnRequired: false
    },
    projectFolder: undefined
  };

  const serviceActivities: ServiceActivitiesData = {
    customerPriorities: {
      primaryConcerns: [],
      energyGoals: [],
      operationalChallenges: [],
      timeline: '',
      budgetConstraints: ''
    },
    tasks: [],
    issues: [],
    recommendations: [],
    serviceMetrics: {
      systemHealthScore: 0,
      performanceImprovement: 0,
      energyOptimization: 0,
      reliabilityEnhancement: 0,
      issuesResolved: 0,
      tasksCompleted: 0,
      timeOnSite: 0
    }
  };

  const documentation: DocumentationData = {
    serviceSummary: {
      executiveSummary: '',
      keyFindings: [],
      valueDelivered: [],
      systemImprovements: [],
      nextSteps: [],
      followupRequired: false,
      followupActions: []
    },
    reportConfig: {
      template: 'Customer',
      includeSections: {
        executiveSummary: true,
        systemOverview: true,
        workPerformed: true,
        issues: true,
        recommendations: true,
        appendix: false
      },
      includePhotos: true,
      includeCharts: true,
      includeDataTables: true,
      brandingLevel: 'Full',
      confidentiality: 'Confidential'
    },
    deliveryInfo: {
      method: 'Email',
      primaryRecipient: '',
      ccRecipients: [],
      deliveryNotes: '',
      signatureRequired: false
    }
  };

  return {
    session,
    phase1: siteIntelligence,
    phase2: systemDiscovery,
    phase3: serviceActivities,
    phase4: documentation
  };
};

interface PMWorkflowGuideProps {
  sessionId?: string;
  mockMode?: boolean;
}

export const PMWorkflowGuide: React.FC<PMWorkflowGuideProps> = ({
  sessionId,
  mockMode = false
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { sessionId: urlSessionId } = useParams();
  const { toast } = useToast();

  // Get session ID from props, URL params, or location state
  const activeSessionId = sessionId || urlSessionId || location.state?.sessionId;

  // Core State
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Workflow State
  const [workflowData, setWorkflowData] = useState<PMWorkflowData | null>(null);
  const [currentPhase, setCurrentPhase] = useState<1 | 2 | 3 | 4>(1);
  const [phaseProgress, setPhaseProgress] = useState<PhaseProgress[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date>(new Date());
  const [recentlyCompletedPhase, setRecentlyCompletedPhase] = useState<number | null>(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewModalPhase, setReviewModalPhase] = useState<number | null>(null);

  // Initialize workflow
  useEffect(() => {
    initializeWorkflow();
  }, [activeSessionId]);

  // Update phase progress when workflow data changes
  useEffect(() => {
    if (workflowData) {
      [1, 2, 3, 4].forEach(phase => {
        updatePhaseProgress(phase as 1 | 2 | 3 | 4);
      });
    }
  }, [workflowData]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      Object.values(saveTimersRef.current).forEach(timer => {
        if (timer) clearTimeout(timer);
      });
    };
  }, []);

  const initializeWorkflow = async () => {
    try {
      setLoading(true);
      setError(null);

      if (activeSessionId && !mockMode) {
        // Load existing session
        logger.info('Loading existing PM session', { sessionId: activeSessionId });

        const result = await UnifiedCustomerDataService.loadSession(activeSessionId);
        setWorkflowData(result.workflowData);
        setCurrentPhase(result.session.current_phase || 1);

        toast({
          title: 'Session Loaded',
          description: 'PM workflow session loaded successfully',
        });
      } else if (location.state?.workflowData) {
        // Use workflow data from session management modal
        logger.info('Using workflow data from session creation');
        setWorkflowData(location.state.workflowData);
        setCurrentPhase(1);
      } else {
        // Create mock workflow data
        logger.info('Initializing with mock data');
        const data = createMockWorkflowData('CORE');
        setWorkflowData(data);
        setCurrentPhase(1);
      }
      
      // Initialize phase progress
      const initialProgress: PhaseProgress[] = [
        {
          phase: 1,
          completed: false,
          percentage: 0,
          requiredTasks: ['Customer Info', 'Contacts', 'Access', 'Safety'],
          completedTasks: [],
          canProceed: false,
          estimatedTime: 20,
          actualTime: 0
        },
        {
          phase: 2,
          completed: false,
          percentage: 0,
          requiredTasks: ['BMS Overview', 'System Discovery'],
          completedTasks: [],
          canProceed: false,
          estimatedTime: 30,
          actualTime: 0
        },
        {
          phase: 3,
          completed: false,
          percentage: 0,
          requiredTasks: ['Customer Priorities', 'Service Tasks'],
          completedTasks: [],
          canProceed: false,
          estimatedTime: 90,
          actualTime: 0
        },
        {
          phase: 4,
          completed: false,
          percentage: 0,
          requiredTasks: ['Service Summary', 'Report Generation'],
          completedTasks: [],
          canProceed: false,
          estimatedTime: 15,
          actualTime: 0
        }
      ];
      
      setPhaseProgress(initialProgress);
      logger.info('PM Workflow initialized with mock data');
      
    } catch (err) {
      logger.error('Failed to initialize PM workflow:', err);
      setError('Failed to initialize workflow');
    } finally {
      setLoading(false);
    }
  };

  // Debounce timers for each phase to prevent spam
  const saveTimersRef = useRef<{ [key: number]: NodeJS.Timeout | null }>({});

  const handleDataUpdate = async (phase: 1 | 2 | 3 | 4, data: any) => {
    if (!workflowData) return;
    
    const updatedData = { ...workflowData };
    
    switch (phase) {
      case 1:
        updatedData.phase1 = { ...updatedData.phase1, ...data };
        break;
      case 2:
        updatedData.phase2 = { ...updatedData.phase2, ...data };
        break;
      case 3:
        updatedData.phase3 = { ...updatedData.phase3, ...data };
        break;
      case 4:
        updatedData.phase4 = { ...updatedData.phase4, ...data };
        break;
    }
    
    setWorkflowData(updatedData);
    setHasUnsavedChanges(true);

    // Update progress
    updatePhaseProgress(phase);

    // Save to database if we have an active session (with debouncing)
    if (activeSessionId && !mockMode) {
      // Clear existing timer for this phase
      if (saveTimersRef.current[phase]) {
        clearTimeout(saveTimersRef.current[phase]!);
      }

      // Set new debounced save with 1 second delay
      saveTimersRef.current[phase] = setTimeout(async () => {
        try {
          await UnifiedCustomerDataService.updatePhaseData(phase, updatedData[`phase${phase}`], activeSessionId);
          setHasUnsavedChanges(false);
          setLastSaved(new Date());

          logger.info(`Phase ${phase} data saved to database`);
        } catch (error) {
          logger.error('Failed to save phase data:', error);
          toast({
            title: 'Save Error',
            description: 'Failed to save changes. Please try again.',
            variant: 'destructive'
          });
        }
      }, 1000); // 1 second debounce
    }

    logger.debug(`Phase ${phase} data updated locally (save pending)`);
  };

  const validatePhaseCompletion = (phase: 1 | 2 | 3 | 4, data: any): { completed: boolean; completedTasks: string[]; percentage: number } => {
    switch (phase) {
      case 1: {
        const sections = ['customer', 'contacts', 'access', 'safety', 'team'];
        const completedSections = sections.filter(section => {
          switch (section) {
            case 'customer':
              return !!(data.customer?.companyName && data.customer?.siteName && data.customer?.address);
            case 'contacts':
              return data.contacts?.length > 0;
            case 'access':
              return !!(data.access?.method && data.access?.parkingInstructions);
            case 'safety':
              return data.safety?.requiredPPE?.length > 0;
            case 'team':
              return !!(data.customer?.primaryTechnicianId && data.customer?.primaryTechnicianName);
            default:
              return false;
          }
        });
        const percentage = (completedSections.length / sections.length) * 100;
        return {
          completed: completedSections.length === sections.length,
          completedTasks: ['Customer Info', 'Contacts', 'Access', 'Safety', 'Team Assignment'].filter((_, i) => completedSections.includes(sections[i])),
          percentage
        };
      }
      case 2: {
        const sections = ['bms', 'discovery'];
        const completedSections = sections.filter(section => {
          switch (section) {
            case 'bms':
              return !!(data.bmsSystem?.platform && data.bmsSystem?.supervisorLocation);
            case 'discovery':
              const hasAutomatedData = data.tridiumExports?.processed;
              const hasManualData = data.manualInventory?.majorEquipment?.length > 0 ||
                                   data.manualInventory?.networkSegments?.length > 0 ||
                                   data.manualInventory?.totalDeviceCount > 0;
              return hasAutomatedData || hasManualData;
            default:
              return false;
          }
        });
        const percentage = (completedSections.length / sections.length) * 100;
        return {
          completed: completedSections.length === sections.length,
          completedTasks: ['BMS Overview', 'System Discovery'].filter((_, i) => completedSections.includes(sections[i])),
          percentage
        };
      }
      case 3: {
        const sections = ['priorities', 'tasks'];
        const completedSections = sections.filter(section => {
          switch (section) {
            case 'priorities':
              return data.customerPriorities?.primaryConcerns?.length > 0;
            case 'tasks':
              return data.tasks?.length > 0 || data.serviceMetrics?.tasksCompleted > 0;
            default:
              return false;
          }
        });
        const percentage = (completedSections.length / sections.length) * 100;
        return {
          completed: completedSections.length === sections.length,
          completedTasks: ['Customer Priorities', 'Service Tasks'].filter((_, i) => completedSections.includes(sections[i])),
          percentage
        };
      }
      case 4: {
        const sections = ['summary', 'report'];
        const completedSections = sections.filter(section => {
          switch (section) {
            case 'summary':
              return !!(data.serviceSummary?.executiveSummary && data.serviceSummary?.keyFindings?.length > 0);
            case 'report':
              return !!(data.reportConfig?.template);
            default:
              return false;
          }
        });
        const percentage = (completedSections.length / sections.length) * 100;
        return {
          completed: completedSections.length === sections.length,
          completedTasks: ['Service Summary', 'Report Generation'].filter((_, i) => completedSections.includes(sections[i])),
          percentage
        };
      }
      default:
        return { completed: false, completedTasks: [], percentage: 0 };
    }
  };

  const updatePhaseProgress = (phase: 1 | 2 | 3 | 4) => {
    if (!workflowData) return;

    const phaseData = {
      1: workflowData.phase1,
      2: workflowData.phase2,
      3: workflowData.phase3,
      4: workflowData.phase4
    }[phase];

    const validation = validatePhaseCompletion(phase, phaseData);

    setPhaseProgress(prev => prev.map(p => {
      if (p.phase === phase) {
        const wasCompleted = p.completed;
        const newCompleted = validation.completed;

        // Show review modal if phase just became complete
        if (!wasCompleted && newCompleted) {
          setRecentlyCompletedPhase(phase);
          setShowReviewModal(true);
          logger.info(`Phase ${phase} completed`, { completedTasks: validation.completedTasks });
        }

        return {
          ...p,
          percentage: validation.percentage,
          completed: validation.completed,
          completedTasks: validation.completedTasks,
          canProceed: validation.percentage >= 80 || validation.completed // Can proceed with 80% completion or full completion
        };
      }
      return p;
    }));
  };

  const handlePhaseChange = (targetPhase: 1 | 2 | 3 | 4) => {
    // Check if can navigate to target phase
    if (targetPhase > 1) {
      const previousPhase = phaseProgress.find(p => p.phase === targetPhase - 1);
      if (!previousPhase?.canProceed && !mockMode) {
        toast({
          title: 'Cannot proceed',
          description: `Please complete Phase ${targetPhase - 1} before proceeding to Phase ${targetPhase}`,
          variant: 'destructive'
        });
        return; // Can't proceed if previous phase isn't ready
      }
    }

    setCurrentPhase(targetPhase);
    logger.info(`Navigated to Phase ${targetPhase}`);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      // TODO: Save to database
      logger.info('Saving workflow data...');
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    } catch (err) {
      logger.error('Failed to save workflow:', err);
      setError('Failed to save workflow');
    } finally {
      setLoading(false);
    }
  };

  const getPhaseIcon = (phase: number) => {
    switch (phase) {
      case 1: return <Target className="h-5 w-5" />;
      case 2: return <Database className="h-5 w-5" />;
      case 3: return <Wrench className="h-5 w-5" />;
      case 4: return <FileText className="h-5 w-5" />;
      default: return null;
    }
  };

  const getPhaseTitle = (phase: number) => {
    switch (phase) {
      case 1: return 'Site Intelligence';
      case 2: return 'System Discovery';
      case 3: return 'Service Activities';
      case 4: return 'Documentation';
      default: return 'Unknown Phase';
    }
  };

  if (loading && !workflowData) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p>Initializing PM Workflow...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <Alert className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!workflowData) return null;

  const currentPhaseData = phaseProgress.find(p => p.phase === currentPhase);
  const overallProgress = phaseProgress.reduce((acc, phase) => acc + phase.percentage, 0) / 4;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="border-b bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-xl font-semibold">PM Workflow Guide</h1>
              <p className="text-sm text-muted-foreground">
                {workflowData.session.serviceTier} Service Tier • Session: {workflowData.session.id}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">{Math.round(overallProgress)}% Complete</span>
              {hasUnsavedChanges && (
                <span className="text-orange-600 ml-2">• Unsaved changes</span>
              )}
            </div>
            <Button onClick={handleSave} disabled={loading} className="gap-2">
              <Save className="h-4 w-4" />
              Save Progress
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4">
          <Progress value={overallProgress} className="h-2" />
        </div>


        {/* Show compact phase overview bars for completed phases */}
        {workflowData && (
          <div className="mt-3 space-y-2">
            {[1, 2, 3, 4].map((phase) => {
              const phaseProgressData = phaseProgress.find(p => p.phase === phase);
              if (!phaseProgressData || phaseProgressData.percentage < 10) return null;

              const phaseData = {
                1: workflowData.phase1,
                2: workflowData.phase2,
                3: workflowData.phase3,
                4: workflowData.phase4
              }[phase];

              return (
                <PhaseOverviewBar
                  key={phase}
                  phase={phase}
                  phaseTitle={getPhaseTitle(phase)}
                  isComplete={phaseProgressData.completed}
                  completionPercentage={phaseProgressData.percentage}
                  summaryText={generatePhaseSummary(phase, phaseData)}
                  onViewDetails={() => {
                    setReviewModalPhase(phase);
                    setShowReviewModal(true);
                  }}
                  className={phase === currentPhase ? 'border-blue-400 bg-blue-50' : ''}
                />
              );
            })}
          </div>
        )}
      </div>

      {/* Phase Navigation */}
      <div className="border-b bg-gray-50 p-4">
        <Tabs value={currentPhase.toString()} onValueChange={(value) => handlePhaseChange(parseInt(value) as 1 | 2 | 3 | 4)}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            {[1, 2, 3, 4].map((phase) => {
              const progress = phaseProgress.find(p => p.phase === phase);
              return (
                <TabsTrigger key={phase} value={phase.toString()} className="gap-2">
                  {progress?.completed ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    getPhaseIcon(phase)
                  )}
                  <span className="hidden sm:inline">Phase {phase}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>
        </Tabs>
      </div>

      {/* Phase Content */}
      <div className="flex-1 overflow-hidden">
        {currentPhase === 1 && (
          <Phase1SiteIntelligence
            data={workflowData.phase1}
            onDataUpdate={(data) => handleDataUpdate(1, data)}
            onPhaseComplete={() => handlePhaseChange(2)}
          />
        )}
        
        {currentPhase === 2 && (
          <Phase2SystemDiscovery
            data={workflowData.phase2}
            onDataUpdate={(data) => handleDataUpdate(2, data)}
            onPhaseComplete={() => handlePhaseChange(3)}
            sessionId={activeSessionId}
            customerId={workflowData.session.customerId}
            siteName={workflowData.phase1?.customer?.siteName || workflowData.session.customerName}
          />
        )}
        
        {currentPhase === 3 && (
          <Phase3ServiceActivities
            data={workflowData.phase3}
            serviceTier={workflowData.session.serviceTier}
            onDataUpdate={(data) => handleDataUpdate(3, data)}
            onPhaseComplete={() => handlePhaseChange(4)}
          />
        )}
        
        {currentPhase === 4 && (
          <Phase4Documentation
            data={workflowData.phase4}
            workflowData={workflowData}
            onDataUpdate={(data) => handleDataUpdate(4, data)}
            onPhaseComplete={() => {
              logger.info('PM Workflow completed');
              navigate('/', { 
                state: { message: 'PM Workflow completed successfully!' }
              });
            }}
          />
        )}
      </div>

      {/* Phase Info Footer */}
      <div className="border-t bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {getPhaseIcon(currentPhase)}
              <span className="font-medium">Phase {currentPhase}: {getPhaseTitle(currentPhase)}</span>
            </div>
            <div className="text-sm text-muted-foreground">
              {currentPhaseData?.percentage.toFixed(0)}% Complete
            </div>
            <div className="text-sm text-muted-foreground">
              <Clock className="h-4 w-4 inline mr-1" />
              Est. {currentPhaseData?.estimatedTime}min
            </div>
          </div>
          
          <div className="flex gap-2">
            {currentPhase > 1 && (
              <Button variant="outline" onClick={() => handlePhaseChange((currentPhase - 1) as 1 | 2 | 3)}>
                Previous Phase
              </Button>
            )}
            {currentPhase < 4 && (
              <Button 
                onClick={() => handlePhaseChange((currentPhase + 1) as 2 | 3 | 4)}
              >
                Next Phase
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Phase Review Modal */}
      {showReviewModal && (reviewModalPhase || recentlyCompletedPhase) && workflowData && (
        <PhaseReviewModal
          open={showReviewModal}
          phase={reviewModalPhase || recentlyCompletedPhase!}
          phaseTitle={getPhaseTitle(reviewModalPhase || recentlyCompletedPhase!)}
          sections={generatePhaseModalSections(
            reviewModalPhase || recentlyCompletedPhase!,
            {
              1: workflowData.phase1,
              2: workflowData.phase2,
              3: workflowData.phase3,
              4: workflowData.phase4
            }[reviewModalPhase || recentlyCompletedPhase!]
          )}
          onClose={() => {
            setShowReviewModal(false);
            setRecentlyCompletedPhase(null);
            setReviewModalPhase(null);
          }}
          onContinue={() => {
            const currentModalPhase = reviewModalPhase || recentlyCompletedPhase!;
            const nextPhase = currentModalPhase < 4 ? (currentModalPhase + 1) as 1 | 2 | 3 | 4 : null;
            if (nextPhase) {
              handlePhaseChange(nextPhase);
            }
            setShowReviewModal(false);
            setRecentlyCompletedPhase(null);
            setReviewModalPhase(null);
          }}
          onSave={(sectionId: string, fieldKey: string, value: string) => {
            // Handle saving edited values back to workflow data
            if (!workflowData) return;

            const updatedData = { ...workflowData };
            const currentModalPhase = reviewModalPhase || recentlyCompletedPhase!;
            const currentPhaseData = {
              1: updatedData.phase1,
              2: updatedData.phase2,
              3: updatedData.phase3,
              4: updatedData.phase4
            }[currentModalPhase];

            // Update the field based on section and field key
            // This is a simplified implementation - you'd want more specific mapping
            if (sectionId === 'customer' && currentPhaseData.customer) {
              (currentPhaseData.customer as any)[fieldKey] = value;
            } else if (sectionId === 'contact' && currentPhaseData.contacts?.[0]) {
              (currentPhaseData.contacts[0] as any)[fieldKey] = value;
            } else if (sectionId === 'access' && currentPhaseData.access) {
              (currentPhaseData.access as any)[fieldKey] = value;
            } else if (sectionId === 'safety' && currentPhaseData.safety) {
              if (fieldKey === 'requiredPPE' || fieldKey === 'knownHazards') {
                (currentPhaseData.safety as any)[fieldKey] = value.split(', ').filter(Boolean);
              } else {
                (currentPhaseData.safety as any)[fieldKey] = value;
              }
            }

            setWorkflowData(updatedData);
            setHasUnsavedChanges(true);

            logger.info(`Updated ${sectionId}.${fieldKey}`, { value });
          }}
        />
      )}
    </div>
  );
};
