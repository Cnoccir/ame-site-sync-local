import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Settings, 
  MapPin, 
  Clock, 
  CheckCircle2,
  Circle,
  AlertTriangle,
  FileText,
  Play,
  X
} from 'lucide-react';
import { sampleCustomers } from '@/data/sampleData';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';

export const Visit = () => {
  const { customerId } = useParams();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [currentPhase, setCurrentPhase] = useState('Pre-Visit');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading customer data
    const foundCustomer = sampleCustomers.find(c => c.id === customerId);
    setCustomer(foundCustomer || null);
    setLoading(false);
  }, [customerId]);

  const phases = [
    {
      id: 'Pre-Visit',
      title: 'Pre-Visit Preparation',
      description: 'Review site access, prepare tools, verify system requirements and safety protocols before arriving on-site.',
      icon: Settings,
      status: 'current',
      progress: 100
    },
    {
      id: 'Initial',
      title: 'Initial Assessment', 
      description: 'Perform initial system assessment and documentation.',
      icon: AlertTriangle,
      status: 'pending',
      progress: 0
    },
    {
      id: 'Execution',
      title: 'Service Tier Execution',
      description: 'Execute maintenance tasks based on service tier requirements.',
      icon: Play,
      status: 'pending', 
      progress: 0
    },
    {
      id: 'Post-Visit',
      title: 'Post-Visit Activities',
      description: 'Complete documentation, generate reports, and close visit.',
      icon: FileText,
      status: 'pending',
      progress: 0
    }
  ];

  const activeVisits = [
    {
      id: '1',
      company: 'Unknown Company',
      phase: 'PRE_VISIT',
      progress: '0%',
      status: 'In Progress',
      technician: 'tech@subdomaincontrols.com'
    },
    {
      id: '2', 
      company: 'Unknown Company',
      phase: 'PRE_VISIT',
      progress: '0%',
      status: 'In Progress',
      technician: 'tech@subdomaincontrols.com'
    }
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center space-x-4 mb-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <span className="text-muted-foreground">Loading...</span>
          <div className="text-sm text-muted-foreground">Loading address...</div>
          <div className="text-sm text-muted-foreground">Loading...</div>
          <div className="text-sm text-muted-foreground">Last Service Loading...</div>
          <div className="text-sm bg-muted text-muted-foreground px-2 py-1 rounded">LOADING...</div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Customer not found</h2>
          <Button onClick={() => navigate('/projects')}>Back to Projects</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Active Visits Sidebar */}
      <div className="flex gap-6">
        <div className="w-80 space-y-4">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-3 h-3 bg-success rounded-full animate-pulse"></div>
            <span className="text-success font-medium">Active Visits</span>
            <Badge variant="outline" className="bg-success/10 text-success border-success">
              6 active
            </Badge>
          </div>

          {activeVisits.map((visit) => (
            <Card key={visit.id} className="border-card-border">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{visit.company}</h4>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground mb-2">
                  Phase: {visit.phase} • Progress: {visit.progress} • 
                </div>
                <div className="text-xs text-muted-foreground mb-3">
                  {visit.technician}
                </div>
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 h-8 text-xs bg-success hover:bg-success/80 text-white border-success"
                  >
                    Resume
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="flex-1 h-8 text-xs bg-danger hover:bg-danger/80 text-white border-danger"
                  >
                    End
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="flex-1">
          {/* Workflow Progress */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Workflow Progress</CardTitle>
                <Button 
                  variant="outline"
                  onClick={() => navigate('/projects')}
                  className="text-muted-foreground"
                >
                  ← Back to Projects
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                {phases.map((phase, index) => (
                  <div key={phase.id} className="text-center">
                    <div className={cn(
                      "w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2",
                      phase.status === 'current' ? 'bg-warning text-warning-foreground' :
                      phase.status === 'completed' ? 'bg-success text-success-foreground' :
                      'bg-muted text-muted-foreground'
                    )}>
                      <phase.icon className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-medium">{phase.title.replace(' ', '\n')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Phase Tabs */}
          <Tabs value={currentPhase} onValueChange={setCurrentPhase} className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted">
              <TabsTrigger 
                value="Pre-Visit" 
                className="data-[state=active]:bg-warning data-[state=active]:text-warning-foreground"
              >
                Pre-Visit Preparation
              </TabsTrigger>
              <TabsTrigger value="Initial">Initial Assessment</TabsTrigger>
              <TabsTrigger value="Execution">Service Tier Execution</TabsTrigger>
              <TabsTrigger value="Post-Visit">Post-Visit Activities</TabsTrigger>
            </TabsList>

            <TabsContent value="Pre-Visit" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="w-5 h-5" />
                    <span>Pre-Visit Preparation</span>
                  </CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Review site access, prepare tools, verify system requirements and safety protocols before arriving on-site.
                  </p>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Card className="border-blue-200 bg-blue-50">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium flex items-center space-x-2">
                            <Settings className="w-4 h-4" />
                            <span>Tools & Equipment</span>
                          </h4>
                          <Button 
                            size="sm"
                            className="bg-primary hover:bg-primary-hover text-primary-foreground"
                          >
                            Generate Full Recommended List
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-0">
                        <p className="text-sm text-muted-foreground mb-4">Essential Tools (Default)</p>
                        <div className="flex items-center justify-center py-8">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                          <span className="ml-2 text-sm text-muted-foreground">Loading essential tools...</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="Initial" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Initial Assessment</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Perform initial system assessment and documentation.
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Assessment tasks will be loaded here...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="Execution" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Service Tier Execution</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Execute maintenance tasks based on service tier requirements.
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Service tier tasks will be loaded here...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="Post-Visit" className="mt-4">
              <Card>
                <CardHeader>
                  <CardTitle>Post-Visit Activities</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Complete documentation, generate reports, and close visit.
                  </p>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Post-visit tasks will be loaded here...</p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};