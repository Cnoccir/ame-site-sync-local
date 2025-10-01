import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Play,
  Clock,
  User,
  Building,
  Calendar,
  ArrowRight,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UnifiedCustomerDataService } from '@/services/unifiedCustomerDataService';
import { PMWorkflowPersistenceService, PMWorkflowSession } from '@/services/pmWorkflowPersistenceService';
import { AMECustomerService, AMECustomer } from '@/services/ameCustomerService';

interface SessionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSessionStart: (sessionId: string, workflowData: any) => void;
}

export const SessionManagementModal: React.FC<SessionManagementModalProps> = ({
  isOpen,
  onClose,
  onSessionStart
}) => {
  const [activeTab, setActiveTab] = useState('new');
  const [isLoading, setIsLoading] = useState(false);
  const [inProgressSessions, setInProgressSessions] = useState<PMWorkflowSession[]>([]);
  const [recentCustomers, setRecentCustomers] = useState<AMECustomer[]>([]);

  // New session form
  const [sessionName, setSessionName] = useState('');
  const [serviceTier, setServiceTier] = useState<'CORE' | 'ASSURE' | 'GUARDIAN'>('CORE');
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');

  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadData();
      generateDefaultSessionName();
    }
  }, [isOpen]);

  const loadData = async () => {
    try {
      setIsLoading(true);

      const [sessions, customers] = await Promise.all([
        PMWorkflowPersistenceService.getAllSessions(),
        AMECustomerService.getAllCustomers()
      ]);

      // Filter in-progress sessions
      const inProgress = sessions.filter(session =>
        session.status === 'Draft' || session.status === 'In Progress'
      );

      setInProgressSessions(inProgress);
      setRecentCustomers(customers.slice(0, 10)); // Recent 10 customers
    } catch (error) {
      console.error('Error loading session data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load session data',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const generateDefaultSessionName = () => {
    const now = new Date();
    const dateStr = now.toLocaleDateString();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setSessionName(`PM Visit - ${dateStr} ${timeStr}`);
  };

  const handleStartNewSession = async () => {
    if (!sessionName.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please enter a session name',
        variant: 'destructive'
      });
      return;
    }

    try {
      setIsLoading(true);

      let result;

      if (selectedCustomerId && selectedCustomerId !== 'new-customer') {
        // Start session from existing customer
        result = await UnifiedCustomerDataService.loadSession(selectedCustomerId);

        // Create new session for this customer
        const newSessionResult = await UnifiedCustomerDataService.initializePMSession(
          serviceTier,
          result.customer || undefined
        );

        // Update session name
        await PMWorkflowPersistenceService.updateSession(newSessionResult.sessionId, {
          session_name: sessionName
        });

        onSessionStart(newSessionResult.sessionId, newSessionResult.workflowData);
      } else {
        // Start completely new session
        result = await UnifiedCustomerDataService.initializePMSession(serviceTier);

        // Update session name
        await PMWorkflowPersistenceService.updateSession(result.sessionId, {
          session_name: sessionName
        });

        onSessionStart(result.sessionId, result.workflowData);
      }

      toast({
        title: 'Session Started',
        description: `PM workflow session "${sessionName}" has been started successfully`,
      });

      onClose();
    } catch (error) {
      console.error('Error starting session:', error);
      toast({
        title: 'Error',
        description: 'Failed to start PM session',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueSession = async (session: PMWorkflowSession) => {
    try {
      setIsLoading(true);

      const result = await UnifiedCustomerDataService.loadSession(session.id);

      onSessionStart(session.id, result.workflowData);

      toast({
        title: 'Session Resumed',
        description: `Continuing session "${session.session_name || 'Unnamed Session'}"`,
      });

      onClose();
    } catch (error) {
      console.error('Error continuing session:', error);
      toast({
        title: 'Error',
        description: 'Failed to continue PM session',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (minutes?: number) => {
    if (!minutes) return 'Unknown';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Unknown';
    return new Date(dateString).toLocaleDateString();
  };

  const getServiceTierColor = (tier: string) => {
    switch (tier) {
      case 'CORE': return 'bg-blue-100 text-blue-800';
      case 'ASSURE': return 'bg-green-100 text-green-800';
      case 'GUARDIAN': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Play className="h-5 w-5 text-blue-600" />
            PM Workflow Session Management
          </DialogTitle>
          <DialogDescription>
            Start a new PM workflow session or continue working on an existing session.
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="new" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Start New Session
            </TabsTrigger>
            <TabsTrigger value="continue" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Continue Session ({inProgressSessions.length})
            </TabsTrigger>
          </TabsList>

          {/* New Session Tab */}
          <TabsContent value="new" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Create New PM Session</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="session-name">Session Name *</Label>
                    <Input
                      id="session-name"
                      value={sessionName}
                      onChange={(e) => setSessionName(e.target.value)}
                      placeholder="Enter session name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="service-tier">Service Tier *</Label>
                    <Select value={serviceTier} onValueChange={(value: 'CORE' | 'ASSURE' | 'GUARDIAN') => setServiceTier(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CORE">CORE - Basic Service</SelectItem>
                        <SelectItem value="ASSURE">ASSURE - Enhanced Service</SelectItem>
                        <SelectItem value="GUARDIAN">GUARDIAN - Premium Service</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Start with Existing Customer (Optional)</Label>
                  <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select existing customer or start fresh" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new-customer">Start with new customer</SelectItem>
                      {recentCustomers.map(customer => (
                        <SelectItem key={customer.id} value={customer.id}>
                          {customer.company_name} - {customer.site_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedCustomerId && selectedCustomerId !== 'new-customer' && (
                  <Alert>
                    <Building className="h-4 w-4" />
                    <AlertDescription>
                      This will pre-populate the PM workflow with existing customer data and create a new session.
                    </AlertDescription>
                  </Alert>
                )}

                <div className="flex justify-end pt-4">
                  <Button
                    onClick={handleStartNewSession}
                    disabled={isLoading || !sessionName.trim()}
                    className="flex items-center gap-2"
                  >
                    {isLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4" />
                    )}
                    Start Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Continue Session Tab */}
          <TabsContent value="continue" className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin mr-2" />
                Loading sessions...
              </div>
            ) : inProgressSessions.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center text-muted-foreground">
                    <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No in-progress sessions found</p>
                    <p className="text-sm">Start a new session to begin</p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {inProgressSessions.map(session => (
                  <Card key={session.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">
                              {session.session_name || 'Unnamed Session'}
                            </h3>
                            <Badge className={getServiceTierColor(session.service_tier)}>
                              {session.service_tier}
                            </Badge>
                            <Badge variant="outline">
                              {session.status}
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {formatDate(session.started_at)}
                            </div>

                            <div className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              Est. {formatDuration(session.estimated_duration)}
                            </div>

                            {session.primary_technician_name && (
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3" />
                                {session.primary_technician_name}
                              </div>
                            )}

                            {session.customer_data?.companyName && (
                              <div className="flex items-center gap-1">
                                <Building className="h-3 w-3" />
                                {session.customer_data.companyName}
                              </div>
                            )}
                          </div>
                        </div>

                        <Button
                          onClick={() => handleContinueSession(session)}
                          disabled={isLoading}
                          className="flex items-center gap-2"
                        >
                          <ArrowRight className="h-4 w-4" />
                          Continue
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};