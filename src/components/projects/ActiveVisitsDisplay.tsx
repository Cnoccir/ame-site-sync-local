import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AMEService } from '@/services/ameService';
import { Visit } from '@/types';
import { AlertCircle, Clock, User, Play } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const ActiveVisitsDisplay = () => {
  const [activeVisits, setActiveVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Use proper UUID format for technician - in real app this would come from auth
  const technicianId = '00000000-0000-0000-0000-000000000001';

  useEffect(() => {
    loadActiveVisits();
    // Refresh every 30 seconds
    const interval = setInterval(loadActiveVisits, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadActiveVisits = async () => {
    try {
      setLoading(true);
      const visits = await AMEService.getActiveVisits(technicianId);
      setActiveVisits(visits);
    } catch (error) {
      console.error('Failed to load active visits:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-3 h-3 bg-muted rounded-full animate-pulse"></div>
        <span className="text-muted-foreground font-medium">Loading visits...</span>
      </div>
    );
  }

  return (
    <>
      {/* Active Visits Banner */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className={`w-3 h-3 rounded-full ${activeVisits.length > 0 ? 'bg-success animate-pulse' : 'bg-muted'}`}></div>
          <span className={`font-medium ${activeVisits.length > 0 ? 'text-success' : 'text-muted-foreground'}`}>
            Active Visits
          </span>
        </div>
        <Badge variant="outline" className={activeVisits.length > 0 ? 'bg-success/10 text-success border-success' : 'bg-muted/10 text-muted-foreground border-muted'}>
          {activeVisits.length} active
        </Badge>
        {activeVisits.length >= 3 && (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
            <AlertCircle className="w-3 h-3 mr-1" />
            At Limit
          </Badge>
        )}
      </div>

      {/* Active Visits Cards */}
      {activeVisits.length > 0 && (
        <Card className="mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Your Active Visits ({activeVisits.length}/3)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeVisits.map((visit) => (
              <div key={visit.id} className="flex items-center justify-between p-3 border rounded-lg bg-card">
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
                  <Play className="w-3 h-3 mr-1" />
                  Resume
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </>
  );
};