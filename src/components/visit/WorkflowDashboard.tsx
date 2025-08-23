import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowPhaseTracker } from './WorkflowPhaseTracker';
import { CustomerInfoCard } from './CustomerInfoCard';
import { PreVisitPhase } from './phases/PreVisitPhase';
import { AssessmentPhase } from './phases/AssessmentPhase';
import { useVisitSession } from '@/hooks/useVisitSession';
import { Customer } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Clock } from 'lucide-react';

interface WorkflowDashboardProps {
  customer: Customer;
}

export const WorkflowDashboard = ({ customer }: WorkflowDashboardProps) => {
  const [searchParams] = useSearchParams();
  const visitId = searchParams.get('visitId');
  console.log('🔍 WorkflowDashboard - visitId from URL params:', visitId);
  console.log('🔍 WorkflowDashboard - customer ID:', customer.id);
  
  const { 
    sessionData, 
    isAutoSaving, 
    saveProgress, 
    completePhase, 
    updateAutoSaveData 
  } = useVisitSession(visitId || undefined);

  const [currentPhase, setCurrentPhase] = useState(1);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const [noActiveVisit, setNoActiveVisit] = useState(false);

  // If no visitId in URL, try to find an active visit for this customer
  useEffect(() => {
    const checkForActiveVisit = async () => {
      if (!visitId) {
        console.log('🔍 No visitId in URL, checking for active visits for customer');
        try {
          // TODO: We need the technician ID - for now let's show a message
          setNoActiveVisit(true);
        } catch (error) {
          console.error('Error checking for active visits:', error);
          setNoActiveVisit(true);
        }
      }
    };

    checkForActiveVisit();
  }, [visitId, customer.id]);

  // Sync with session data
  useEffect(() => {
    if (sessionData) {
      setCurrentPhase(sessionData.currentPhase);
      
      // Calculate completed phases based on current phase
      const completed = [];
      for (let i = 1; i < sessionData.currentPhase; i++) {
        completed.push(i);
      }
      setCompletedPhases(completed);
    }
  }, [sessionData]);

  const handlePhaseComplete = async (phaseId: number) => {
    setCompletedPhases(prev => [...prev, phaseId]);
    
    // Complete phase in database
    if (sessionData) {
      await completePhase(phaseId);
    }
    
    // Auto-advance to next phase
    if (phaseId < 4) {
      setCurrentPhase(phaseId + 1);
    }
  };

  const handlePhaseClick = (phaseId: number) => {
    // Allow clicking on completed phases or current phase
    if (completedPhases.includes(phaseId) || phaseId === currentPhase) {
      setCurrentPhase(phaseId);
    }
  };

  const handleFormDataChange = (phaseData: any) => {
    if (sessionData) {
      updateAutoSaveData({ [`phase_${currentPhase}`]: phaseData });
    }
  };

  if (noActiveVisit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">No Active Visit</h2>
          <p className="text-muted-foreground mb-4">
            No active visit found for this customer. Please start a new visit from the customer management page.
          </p>
          <p className="text-sm text-muted-foreground mb-4">
            Customer: {customer.company_name} - {customer.site_name}
          </p>
          <div className="space-x-2">
            <button 
              onClick={() => window.location.href = '/customers'}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Go to Customer Management
            </button>
            <button 
              onClick={() => window.location.href = '/projects'}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
            >
              Go to Projects
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Loading Visit Session...</h2>
          <p className="text-muted-foreground">Please wait while we prepare your visit workflow.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Visit ID: {visitId || 'Not provided'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Customer Info Card */}
      <CustomerInfoCard customer={customer} />
      
      {/* Visit Status Bar */}
      <div className="bg-muted/50 border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline">Visit ID: {sessionData.visitId}</Badge>
            <Badge variant="secondary">Phase {currentPhase}/4</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {isAutoSaving ? 'Saving...' : `Last saved: ${sessionData.lastSaved.toLocaleTimeString()}`}
          </div>
        </div>
      </div>
      
      {/* Main Workflow Container */}
      <div className="flex">
        {/* Sidebar with Progress Tracker */}
        <div className="w-64 p-6 border-r bg-card">
          <WorkflowPhaseTracker
            currentPhase={currentPhase}
            completedPhases={completedPhases}
            onPhaseClick={handlePhaseClick}
          />
        </div>
        
        {/* Main Content Area */}
        <div className="flex-1 p-6">
          <Tabs value={`phase-${currentPhase}`} className="space-y-6">
            {/* Hide default tabs list since we use custom tracker */}
            <TabsList className="hidden">
              <TabsTrigger value="phase-1">Phase 1</TabsTrigger>
              <TabsTrigger value="phase-2">Phase 2</TabsTrigger>
              <TabsTrigger value="phase-3">Phase 3</TabsTrigger>
              <TabsTrigger value="phase-4">Phase 4</TabsTrigger>
            </TabsList>
            
            <TabsContent value="phase-1" className="space-y-6">
              <PreVisitPhase 
                customer={customer}
                onPhaseComplete={() => handlePhaseComplete(1)}
              />
            </TabsContent>
            
            <TabsContent value="phase-2" className="space-y-6">
              <AssessmentPhase 
                onPhaseComplete={() => handlePhaseComplete(2)}
              />
            </TabsContent>
            
            <TabsContent value="phase-3" className="space-y-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Phase 3: Service Execution</h3>
                <p className="text-muted-foreground">Coming soon...</p>
              </div>
            </TabsContent>
            
            <TabsContent value="phase-4" className="space-y-6">
              <div className="text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Phase 4: Post-Visit Activities</h3>
                <p className="text-muted-foreground">Coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};