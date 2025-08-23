import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowPhaseTracker } from './WorkflowPhaseTracker';
import { CustomerInfoCard } from './CustomerInfoCard';
import { PreVisitPhase } from './phases/PreVisitPhase';
import { AssessmentPhase } from './phases/AssessmentPhase';
import { Customer } from '@/types';

interface WorkflowDashboardProps {
  customer: Customer;
}

export const WorkflowDashboard = ({ customer }: WorkflowDashboardProps) => {
  const [currentPhase, setCurrentPhase] = useState(1);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);

  const handlePhaseComplete = (phaseId: number) => {
    if (!completedPhases.includes(phaseId)) {
      setCompletedPhases(prev => [...prev, phaseId]);
    }
    
    // Auto-advance to next phase
    if (phaseId < 4) {
      setCurrentPhase(phaseId + 1);
    }
  };

  const handlePhaseClick = (phaseId: number) => {
    // Only allow navigation to completed phases or current phase
    if (phaseId <= Math.max(currentPhase, ...completedPhases)) {
      setCurrentPhase(phaseId);
    }
  };

  const getTabValue = (phase: number) => `phase-${phase}`;

  // Auto-save progress every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      // Auto-save logic would go here
      console.log('Auto-saving workflow progress...');
    }, 30000);

    return () => clearInterval(interval);
  }, [currentPhase, completedPhases]);

  return (
    <div className="min-h-screen bg-background">
      {/* Customer Info Card */}
      <div className="sticky top-0 z-40 bg-background border-b border-card-border">
        <div className="container mx-auto px-4 py-4">
          <CustomerInfoCard customer={customer} />
        </div>
      </div>

      {/* Main Workflow Area */}
      <div className="flex">
        {/* Phase Tracker Sidebar */}
        <WorkflowPhaseTracker
          currentPhase={currentPhase}
          completedPhases={completedPhases}
          onPhaseClick={handlePhaseClick}
        />

        {/* Main Content Area */}
        <div className="flex-1">
          <Tabs value={getTabValue(currentPhase)} className="h-full">
            <TabsList className="hidden" />
            
            <TabsContent value={getTabValue(1)} className="m-0 p-6">
              <PreVisitPhase
                customer={customer}
                onPhaseComplete={() => handlePhaseComplete(1)}
              />
            </TabsContent>

            <TabsContent value={getTabValue(2)} className="m-0 p-6">
              <AssessmentPhase
                onPhaseComplete={() => handlePhaseComplete(2)}
              />
            </TabsContent>

            <TabsContent value={getTabValue(3)} className="m-0 p-6">
              <div className="text-center py-20">
                <h2 className="text-xl font-semibold mb-4">Phase 3: Service Execution</h2>
                <p className="text-muted-foreground">Task management interface coming soon...</p>
              </div>
            </TabsContent>

            <TabsContent value={getTabValue(4)} className="m-0 p-6">
              <div className="text-center py-20">
                <h2 className="text-xl font-semibold mb-4">Phase 4: Post-Visit Activities</h2>
                <p className="text-muted-foreground">Report generation interface coming soon...</p>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};