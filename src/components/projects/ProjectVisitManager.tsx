import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { AMEService } from '@/services/ameService';
import { Customer, Visit } from '@/types';
import { Play, Clock, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

interface ProjectVisitManagerProps {
  customer: Customer;
}

export const ProjectVisitManager = ({ customer }: ProjectVisitManagerProps) => {
  const [activeVisits, setActiveVisits] = useState<Visit[]>([]);
  const [customerActiveVisit, setCustomerActiveVisit] = useState<Visit | null>(null);
  const [showActiveVisitDialog, setShowActiveVisitDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  // Get technician ID from authenticated user
  const technicianId = user?.id;

  useEffect(() => {
    if (technicianId) {
      loadActiveVisits();
      checkCustomerActiveVisit();
    }
  }, [customer.id, technicianId]);

  const loadActiveVisits = async () => {
    if (!technicianId) return;
    
    try {
      const visits = await AMEService.getActiveVisits(technicianId);
      setActiveVisits(visits);
    } catch (error) {
      console.error('Failed to load active visits:', error);
    }
  };

  const checkCustomerActiveVisit = async () => {
    if (!technicianId) return;
    
    try {
      const activeVisit = await AMEService.getActiveVisitForCustomer(customer.id, technicianId);
      setCustomerActiveVisit(activeVisit);
    } catch (error) {
      console.error('Failed to check customer active visit:', error);
    }
  };

  const startNewVisit = async () => {
    if (!technicianId) {
      toast({
        title: "Authentication Required",
        description: "Please log in to start a visit.",
        variant: "destructive"
      });
      return;
    }

    // Check if technician has too many active visits
    if (activeVisits.length >= 3) {
      toast({
        title: "Too Many Active Visits",
        description: "You can only have 3 active visits at a time. Please complete an existing visit first.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Creating visit with session for customer:', customer.id, 'service tier:', customer.service_tier);
      
      const { visit, sessionToken } = await AMEService.createVisitWithSession(customer.id, technicianId);
      
      // Store session token in localStorage for recovery
      localStorage.setItem(`visit_session_${visit.id}`, sessionToken);
      
      toast({
        title: "Visit Started",
        description: `Visit ${visit.visit_id} created for ${customer.company_name}. Loading ${customer.service_tier} tier tasks and SOPs.`,
        variant: "default"
      });

      // Navigate to visit workflow with visitId
      navigate(`/visit/${customer.id}?visitId=${visit.id}`);
      
    } catch (error) {
      console.error('Failed to start visit:', error);
      toast({
        title: "Error",
        description: "Failed to start visit. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resumeExistingVisit = () => {
    if (customerActiveVisit) {
      navigate(`/visit/${customer.id}?visitId=${customerActiveVisit.id}`);
      setShowActiveVisitDialog(false);
    }
  };

  const handleStartVisit = async () => {
    if (customerActiveVisit) {
      setShowActiveVisitDialog(true);
    } else {
      await startNewVisit();
    }
  };

  const formatDuration = (startedAt: string) => {
    const start = new Date(startedAt);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  return (
    <>
      <div className="flex items-center gap-2">
        {!isAuthenticated ? (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
            Login Required
          </Badge>
        ) : customerActiveVisit ? (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
            <AlertCircle className="w-3 h-3 mr-1" />
            Active Visit
          </Badge>
        ) : null}
        
        <Button
          size="sm"
          onClick={handleStartVisit}
          disabled={loading || !isAuthenticated}
          className="bg-primary hover:bg-primary-hover text-white"
        >
          <Play className="w-3 h-3 mr-1" />
          {customerActiveVisit ? 'Resume Visit' : loading ? 'Starting...' : 'Start Visit'}
        </Button>
      </div>

      <Dialog open={showActiveVisitDialog} onOpenChange={setShowActiveVisitDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Active Visit Found</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p>
              You already have an active visit for {customer.company_name}. 
              Would you like to resume the existing visit or start a new one?
            </p>
            
            {customerActiveVisit && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="outline">{customerActiveVisit.visit_id}</Badge>
                        <Badge variant="secondary">Phase {customerActiveVisit.current_phase}/4</Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {customerActiveVisit.started_at ? formatDuration(customerActiveVisit.started_at) : 'Not started'}
                        </span>
                        <span>Status: {customerActiveVisit.visit_status}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
            
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setShowActiveVisitDialog(false)}
              >
                Cancel
              </Button>
              <Button 
                variant="secondary" 
                onClick={resumeExistingVisit}
              >
                Resume Existing Visit
              </Button>
              <Button 
                onClick={() => {
                  setShowActiveVisitDialog(false);
                  startNewVisit();
                }}
              >
                Start New Visit
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};