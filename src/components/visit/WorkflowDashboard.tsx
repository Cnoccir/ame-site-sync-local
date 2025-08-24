import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowPhaseTracker } from './WorkflowPhaseTracker';
import { CustomerInfoCard } from './CustomerInfoCard';
import { PreVisitPhase } from './phases/PreVisitPhase';
import { AssessmentPhase } from './phases/AssessmentPhase';
import { ServiceExecutionPhase } from './phases/ServiceExecutionPhase';
import { PostVisitPhase } from './phases/PostVisitPhase';
import { useVisitSession } from '@/hooks/useVisitSession';
import { Customer } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Clock, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { AMEService } from '@/services/ameService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';

interface WorkflowDashboardProps {
  customer: Customer;
}

export const WorkflowDashboard = ({ customer }: WorkflowDashboardProps) => {
  const [searchParams] = useSearchParams();
  const visitId = searchParams.get('visitId');
  const { user, isAuthenticated } = useAuth();
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
  const [activeVisits, setActiveVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Get technician ID from authenticated user
  const technicianId = user?.id;

  // If no visitId in URL, check for active visits for this customer
  useEffect(() => {
    const checkForActiveVisits = async () => {
      if (!visitId && technicianId) {
        console.log('🔍 No visitId in URL, checking for active visits for customer');
        setLoading(true);
        try {
          // Get all active visits for this customer
          const { data, error } = await supabase
            .from('ame_visits')
            .select('*')
            .eq('customer_id', customer.id)
            .eq('technician_id', technicianId)
            .eq('is_active', true)
            .in('visit_status', ['Scheduled', 'In Progress']);

          if (error) throw error;

          console.log('🔍 Found active visits:', data?.length || 0);
          
          if (data && data.length > 0) {
            setActiveVisits(data);
          } else {
            setNoActiveVisit(true);
          }
        } catch (error) {
          console.error('Error checking for active visits:', error);
          setNoActiveVisit(true);
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    checkForActiveVisits();
  }, [visitId, customer.id, technicianId]);

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
    // DEV MODE: Remove progress locks for testing - allow any phase
    setCurrentPhase(phaseId);
    // ORIGINAL: Allow clicking on completed phases or current phase
    // if (completedPhases.includes(phaseId) || phaseId === currentPhase) {
    //   setCurrentPhase(phaseId);
    // }
  };

  const handleContinueVisit = (visit: any) => {
    console.log('🔍 Continuing visit:', visit.id);
    // Navigate with the correct visitId parameter
    window.location.href = `/visit/${customer.id}?visitId=${visit.id}`;
  };

  const handleStartNewVisit = async () => {
    console.log('🔍 Starting new visit for customer:', customer.id);
    
    if (!technicianId) {
      console.error('No technician ID available');
      window.location.href = `/customers`;
      return;
    }
    
    try {
      setLoading(true);
      
      const { visit, sessionToken } = await AMEService.createVisitWithSession(customer.id, technicianId);
      
      // Store session token in localStorage for recovery
      localStorage.setItem(`visit_session_${visit.id}`, sessionToken);
      
      // Navigate with the new visitId
      window.location.href = `/visit/${customer.id}?visitId=${visit.id}`;
    } catch (error) {
      console.error('Failed to start visit:', error);
      // Fallback to customers page
      window.location.href = `/customers`;
    } finally {
      setLoading(false);
    }
  };

  const handleFormDataChange = (phaseData: any) => {
    if (sessionData) {
      updateAutoSaveData({ [`phase_${currentPhase}`]: phaseData });
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Authentication Required</CardTitle>
            <p className="text-muted-foreground">
              Please log in to access the visit workflow.
            </p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => window.location.href = '/auth'}>
              Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Checking for Active Visits...</h2>
          <p className="text-muted-foreground">Please wait while we check for existing visits.</p>
        </div>
      </div>
    );
  }

  if (activeVisits.length > 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Active Visits Found</CardTitle>
            <p className="text-muted-foreground">
              We found {activeVisits.length} active visit(s) for {customer.company_name}. 
              Please choose to continue an existing visit or start a new one.
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeVisits.map((visit) => (
              <div key={visit.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h3 className="font-semibold">Visit {visit.visit_id}</h3>
                  <p className="text-sm text-muted-foreground">
                    Started: {new Date(visit.started_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Phase: {visit.current_phase}/4 • Status: {visit.visit_status}
                  </p>
                </div>
                <div className="space-x-2">
                  <Button 
                    onClick={() => handleContinueVisit(visit)}
                    className="bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    Continue Visit
                  </Button>
                </div>
              </div>
            ))}
            <div className="pt-4 border-t">
              <Button 
                onClick={handleStartNewVisit}
                variant="outline"
                className="w-full"
              >
                Start New Visit Instead
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (noActiveVisit) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>No Active Visit Found</CardTitle>
            <p className="text-muted-foreground">
              No active visit was found for {customer.company_name}. Would you like to start a new visit?
            </p>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex gap-3">
              <Button 
                onClick={handleStartNewVisit}
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Start New Visit
              </Button>
              <Button 
                onClick={() => window.location.href = '/customers'}
                variant="outline"
              >
                Back to Customers
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
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
              <ServiceExecutionPhase 
                customer={customer}
                onPhaseComplete={() => handlePhaseComplete(3)}
              />
            </TabsContent>
            
            <TabsContent value="phase-4" className="space-y-6">
              <PostVisitPhase 
                customer={customer}
                visitId={sessionData.visitId}
                onPhaseComplete={() => handlePhaseComplete(4)}
              />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};