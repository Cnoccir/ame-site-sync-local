import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AMEService } from '@/services/ameService';
import { Customer, Visit } from '@/types';
import { Clock, MapPin, User, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

interface VisitManagerProps {
  customer: Customer;
  onVisitStarted?: (visitId: string) => void;
}

export const VisitManager = ({ customer, onVisitStarted }: VisitManagerProps) => {
  const [activeVisits, setActiveVisits] = useState<Visit[]>([]);
  const [showActiveVisitDialog, setShowActiveVisitDialog] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  // Mock technician ID - in real app this would come from auth
  const technicianId = 'temp-tech-id';

  useEffect(() => {
    loadActiveVisits();
  }, []);

  const loadActiveVisits = async () => {
    try {
      const visits = await AMEService.getActiveVisits(technicianId);
      setActiveVisits(visits);
    } catch (error) {
      console.error('Failed to load active visits:', error);
    }
  };

  const checkForExistingVisit = async () => {
    try {
      const existingVisit = await AMEService.getActiveVisitForCustomer(customer.id, technicianId);
      if (existingVisit) {
        setShowActiveVisitDialog(true);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking for existing visit:', error);
      return false;
    }
  };

  const startNewVisit = async () => {
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
      const { visit, sessionToken } = await AMEService.createVisitWithSession(customer.id, technicianId);
      
      // Store session token in localStorage for recovery
      localStorage.setItem(`visit_session_${visit.id}`, sessionToken);
      
      toast({
        title: "Visit Started",
        description: `Visit ${visit.visit_id} has been created and is ready for Phase 1.`,
        variant: "default"
      });

      // Navigate to visit workflow
      navigate(`/visit/${customer.id}?visitId=${visit.id}`);
      
      if (onVisitStarted) {
        onVisitStarted(visit.id);
      }
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

  const resumeExistingVisit = async () => {
    try {
      const existingVisit = await AMEService.getActiveVisitForCustomer(customer.id, technicianId);
      if (existingVisit) {
        navigate(`/visit/${customer.id}?visitId=${existingVisit.id}`);
        if (onVisitStarted) {
          onVisitStarted(existingVisit.id);
        }
      }
    } catch (error) {
      console.error('Failed to resume visit:', error);
      toast({
        title: "Error",
        description: "Failed to resume visit. Please try again.",
        variant: "destructive"
      });
    }
    setShowActiveVisitDialog(false);
  };

  const handleStartVisit = async () => {
    const hasExisting = await checkForExistingVisit();
    if (!hasExisting) {
      await startNewVisit();
    }
  };

  const getPhaseLabel = (phase: number) => {
    const phases = {
      1: 'Pre-Visit',
      2: 'Assessment', 
      3: 'Execution',
      4: 'Reporting'
    };
    return phases[phase as keyof typeof phases] || 'Unknown';
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
      <div className="space-y-4">
        <Button 
          onClick={handleStartVisit}
          disabled={loading}
          className="w-full"
        >
          {loading ? 'Starting Visit...' : 'Start Visit'}
        </Button>

        {activeVisits.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Active Visits ({activeVisits.length}/3)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {activeVisits.map((visit) => (
                <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{visit.visit_id}</Badge>
                      <Badge variant="secondary">
                        Phase {visit.current_phase}: {getPhaseLabel(visit.current_phase)}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {visit.started_at ? formatDuration(visit.started_at) : 'Not started'}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {visit.visit_status}
                      </span>
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate(`/visit/${visit.customer_id}?visitId=${visit.id}`)}
                  >
                    Resume
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
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
                Resume Existing
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