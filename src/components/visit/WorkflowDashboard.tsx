import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkflowPhaseTracker } from './WorkflowPhaseTracker';
import { CustomerInfoCard } from './CustomerInfoCard';
import { PreVisitWorkflowEnhanced } from './phases/PreVisitWorkflowEnhanced';
import { AssessmentPhase } from './phases/AssessmentPhase';
import { ServiceExecutionPhase } from './phases/ServiceExecutionPhase';
import { PostVisitPhase } from './phases/PostVisitPhase';
import { useVisitSession } from '@/hooks/useVisitSession';
import { Customer } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Clock, Loader2, X, RefreshCw, Edit, MapPin, Phone, Mail, User, Shield } from 'lucide-react';
import { CustomerDetailsModalEnhanced } from '@/components/customers/CustomerDetailsModalEnhanced';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { AMEService } from '@/services/ameService';
import { ActivityService } from '@/services/activityService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks/useAuth';
import { ServiceTierBadge } from '@/components/ui/service-tier-badge';

interface WorkflowDashboardProps {
  customer: Customer;
}

export const WorkflowDashboard = ({ customer: initialCustomer }: WorkflowDashboardProps) => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const visitId = searchParams.get('visitId');
  const { user, isAuthenticated } = useAuth();
  
  const { 
    sessionData, 
    isAutoSaving, 
    saveProgress, 
    completePhase, 
    updateAutoSaveData,
    endVisit,
    resetVisit
  } = useVisitSession(visitId || undefined);

  const [currentPhase, setCurrentPhase] = useState(1);
  const [completedPhases, setCompletedPhases] = useState<number[]>([]);
  const [noActiveVisit, setNoActiveVisit] = useState(false);
  const [activeVisits, setActiveVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Customer state that can be updated
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerModalMode, setCustomerModalMode] = useState<'view' | 'edit'>('view');

  // Get technician ID from authenticated user
  const technicianId = user?.id;

  // If no visitId in URL, check for active visits for this customer
  useEffect(() => {
    const checkForActiveVisits = async () => {
      if (!visitId && technicianId) {
        
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

          
          
          if (data && data.length > 0) {
            setActiveVisits(data);
          } else {
            setNoActiveVisit(true);
          }
        } catch (error) {
          
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

  // Initialize from session data only on first load
  useEffect(() => {
    if (sessionData && currentPhase === 1) {
      // Only set current phase from session data if we're still on the default phase
      setCurrentPhase(sessionData.currentPhase);
      
      // Calculate completed phases based on current phase
      const completed = [];
      for (let i = 1; i < sessionData.currentPhase; i++) {
        completed.push(i);
      }
      setCompletedPhases(completed);
    }
  }, [sessionData]); // Removed currentPhase dependency to prevent bounce back

  const handlePhaseComplete = async (phaseId: number) => {
    setCompletedPhases(prev => [...prev, phaseId]);
    
    // Complete phase in database
    if (sessionData) {
      await completePhase(phaseId);
      
      // Log phase completion activity
      await ActivityService.logPhaseCompletion(
        phaseId, 
        sessionData.visitId, 
        customer.company_name
      );
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
    // Navigate using React Router to prevent page reload
    navigate(`/visit/${customer.id}?visitId=${visit.id}`);
  };

  const handleStartNewVisit = async () => {
    
    
    if (!technicianId) {
      console.error('No technician ID available');
      navigate('/customers');
      return;
    }
    
    try {
      setLoading(true);
      
      const { visit, sessionToken } = await AMEService.createVisitWithSession(customer.id, technicianId);
      
      // Store session token in localStorage for recovery
      localStorage.setItem(`visit_session_${visit.id}`, sessionToken);
      
      // Log visit start activity
      await ActivityService.logVisitStart(visit.id, customer.company_name);
      
      // Navigate with the new visitId using React Router
      navigate(`/visit/${customer.id}?visitId=${visit.id}`);
    } catch (error) {
      console.error('Failed to start visit:', error);
      // Fallback to customers page
      navigate('/customers');
    } finally {
      setLoading(false);
    }
  };

  const handleFormDataChange = (phaseData: any) => {
    if (sessionData) {
      updateAutoSaveData({ [`phase_${currentPhase}`]: phaseData });
    }
  };
  
  // Handle customer update from modal
  const handleCustomerUpdated = async () => {
    // Refresh customer data from database
    try {
      const { data } = await supabase
        .from('ame_customers')
        .select('*')
        .eq('id', customer.id)
        .single();
        
      if (data) {
        setCustomer(data);
      }
    } catch (error) {
      console.error('Error refreshing customer data:', error);
    }
  };
  
  // Open customer edit modal
  const handleEditCustomer = () => {
    setCustomerModalMode('edit');
    setShowCustomerModal(true);
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
            <Button onClick={() => navigate('/auth')}>
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
                onClick={() => navigate('/customers')}
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
      {/* Enhanced Customer Header with Site Intelligence */}
      <div className="bg-card border-b">
        {/* Main Header */}
        <div className="px-6 py-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold">
                  {customer.site_nickname || customer.company_name}
                </h1>
                {customer.site_number && (
                  <Badge variant="outline" className="font-mono">
                    {customer.site_number}
                  </Badge>
                )}
                <ServiceTierBadge tier={customer.service_tier} size="md" />
                {customer.system_platform && (
                  <Badge variant="secondary">{customer.system_platform}</Badge>
                )}
              </div>
              
              {/* Quick Info Grid */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 mt-3 text-sm">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Address:</span>
                  <span className="font-medium">{customer.address || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Primary Contact:</span>
                  <span className="font-medium">{customer.primary_contact || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{customer.contact_phone || 'Not set'}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span className="text-muted-foreground">Email:</span>
                  <span className="font-medium">{customer.contact_email || 'Not set'}</span>
                </div>
              </div>

              {/* Access Requirements Alert */}
              {(customer.badge_required || customer.ppe_required || customer.escort_required) && (
                <div className="flex items-center gap-3 mt-3 p-2 bg-orange-50 border border-orange-200 rounded-lg">
                  <Shield className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900">Access Requirements:</span>
                  <div className="flex gap-2">
                    {customer.badge_required && (
                      <Badge variant="outline" className="text-xs border-orange-300">Badge Required</Badge>
                    )}
                    {customer.ppe_required && (
                      <Badge variant="outline" className="text-xs border-orange-300">PPE Required</Badge>
                    )}
                    {customer.escort_required && (
                      <Badge variant="outline" className="text-xs border-orange-300">Escort Required</Badge>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Actions */}
            <div className="flex flex-col gap-2 ml-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleEditCustomer}
              >
                <Edit className="w-4 h-4 mr-2" />
                Edit Customer
              </Button>
              
              {/* Technician Assignment Display */}
              {(customer.primary_technician_name || customer.secondary_technician_name) && (
                <div className="text-right text-xs space-y-1 mt-2">
                  {customer.primary_technician_name && (
                    <div>
                      <span className="text-muted-foreground">Primary: </span>
                      <span className="font-medium">{customer.primary_technician_name}</span>
                    </div>
                  )}
                  {customer.secondary_technician_name && (
                    <div>
                      <span className="text-muted-foreground">Secondary: </span>
                      <span className="font-medium">{customer.secondary_technician_name}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Visit Status Bar */}
      <div className="bg-muted/50 border-b px-6 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Badge variant="outline">Visit ID: {sessionData.visitId}</Badge>
            <Badge variant="secondary">Phase {currentPhase}/4</Badge>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              {isAutoSaving ? 'Saving...' : `Last saved: ${sessionData.lastSaved.toLocaleTimeString()}`}
            </div>
            
            {/* Visit Controls */}
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-orange-500/10 text-orange-600 border-orange-200 hover:bg-orange-500/20"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Reset Visit
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reset Visit Progress?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will clear all progress and restart the visit from Phase 1. 
                      All completed tasks and assessment data will be lost. This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                      onClick={() => {
                        resetVisit();
                        setCurrentPhase(1);
                        setCompletedPhases([]);
                      }}
                      className="bg-orange-600 hover:bg-orange-700"
                    >
                      Reset Visit
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="bg-red-500/10 text-red-600 border-red-200 hover:bg-red-500/20"
                  >
                    <X className="w-4 h-4 mr-2" />
                    End Visit
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>End Visit?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will permanently end the current visit and mark it as abandoned. 
                      All progress will be lost and you'll be returned to the customers page. 
                      This action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction 
                    onClick={() => {
                        endVisit().then(() => {
                          navigate('/customers');
                        });
                      }}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      End Visit
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
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
            
            <TabsContent value="phase-1" className="h-full">
                    <PreVisitWorkflowEnhanced 
                      customer={customer} 
                      onPhaseComplete={() => handlePhaseComplete(1)}
                      updateCustomerData={(updates) => {
                        // Update customer data and auto-save
                        updateAutoSaveData({ customerUpdates: updates });
                      }}
                      autoSaveEnabled={true}
                    />
            </TabsContent>
            
            <TabsContent value="phase-2" className="space-y-6">
              <AssessmentPhase 
                onPhaseComplete={() => handlePhaseComplete(2)}
                visitId={visitId!}
                sessionData={sessionData}
                updateAutoSaveData={updateAutoSaveData}
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
      
      {/* Customer Details Modal */}
      <CustomerDetailsModalEnhanced
        isOpen={showCustomerModal}
        onClose={() => setShowCustomerModal(false)}
        customer={customer}
        onCustomerUpdated={handleCustomerUpdated}
        mode={customerModalMode}
      />
    </div>
  );
};
