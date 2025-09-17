import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Customer } from '@/types';
import { sopTaskData, tasksByPhase, getTasksForTier } from '@/data/pm-tasks';
import { SOPService, EnhancedPMTask } from '@/services/sopService';
import { 
  ChevronDown, 
  ChevronRight, 
  FileText, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Wrench,
  BarChart3,
  TrendingUp,
  FileCheck,
  Shield,
  ExternalLink,
  Lightbulb,
  Timer,
  Target,
  Zap,
  Play,
  ArrowRight
} from 'lucide-react';

interface EnhancedTaskGuidancePanelProps {
  customer: Customer;
  completedTasks: string[];
  selectedTask: string | null;
  onTaskComplete: (taskId: string) => void;
  onTaskSelect: (taskId: string) => void;
}

export const EnhancedTaskGuidancePanel = ({
  customer,
  completedTasks,
  selectedTask,
  onTaskComplete,
  onTaskSelect
}: EnhancedTaskGuidancePanelProps) => {
  const [expandedPhases, setExpandedPhases] = useState<string[]>(['preparation']);
  const [expandedTasks, setExpandedTasks] = useState<string[]>([]);
  const [selectedSOPDialog, setSelectedSOPDialog] = useState<string | null>(null);

  // Get enhanced tasks based on customer's service tier
  const enhancedTasks = SOPService.getEnhancedTasksForTier(customer.service_tier);
  const phases = tasksByPhase(enhancedTasks);

  const togglePhase = (phase: string) => {
    setExpandedPhases(prev =>
      prev.includes(phase)
        ? prev.filter(p => p !== phase)
        : [...prev, phase]
    );
  };

  const toggleTask = (taskId: string) => {
    setExpandedTasks(prev =>
      prev.includes(taskId)
        ? prev.filter(t => t !== taskId)
        : [...prev, taskId]
    );
    onTaskSelect(taskId);
  };

  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'preparation': return <Wrench className="h-4 w-4" />;
      case 'assessment': return <AlertCircle className="h-4 w-4" />;
      case 'optimization': return <CheckCircle2 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getPhaseLabel = (phase: string) => {
    switch (phase) {
      case 'preparation': return 'Preparation Tasks';
      case 'assessment': return 'System Assessment';
      case 'optimization': return 'Optimization & Documentation';
      default: return phase;
    }
  };

  const getReportImpactIcon = (impact: string) => {
    switch (impact) {
      case 'foundation': return <FileCheck className="h-3 w-3" />;
      case 'metrics': return <BarChart3 className="h-3 w-3" />;
      case 'improvements': return <TrendingUp className="h-3 w-3" />;
      case 'documentation': return <FileText className="h-3 w-3" />;
      default: return <Target className="h-3 w-3" />;
    }
  };

  const getReportImpactColor = (impact: string) => {
    switch (impact) {
      case 'foundation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'metrics': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'improvements': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'documentation': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Target className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Service Value Builder</h2>
          <Badge variant="outline">{customer.service_tier}</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Each task builds your professional report. Complete systematically to demonstrate service value.
        </p>
      </div>

      {Object.entries(phases).map(([phase, tasks]) => (
        <Card key={phase} className="overflow-hidden border-l-4 border-l-primary/20">
          <CardHeader className="p-0">
            <Collapsible
              open={expandedPhases.includes(phase)}
              onOpenChange={() => togglePhase(phase)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="ghost"
                  className="w-full justify-between p-4 h-auto hover:bg-accent/50"
                >
                  <div className="flex items-center gap-3">
                    {getPhaseIcon(phase)}
                    <span className="font-medium">{getPhaseLabel(phase)}</span>
                    <Badge variant="outline" className="ml-2">
                      {tasks.filter(t => completedTasks.includes(t.id)).length}/{tasks.length}
                    </Badge>
                  </div>
                  {expandedPhases.includes(phase) ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <CardContent className="p-0">
                  {tasks.map((task) => (
                    <EnhancedTaskCard
                      key={task.id}
                      task={task}
                      customer={customer}
                      isCompleted={completedTasks.includes(task.id)}
                      isExpanded={expandedTasks.includes(task.id)}
                      isSelected={selectedTask === task.id}
                      onToggle={() => toggleTask(task.id)}
                      onComplete={() => onTaskComplete(task.id)}
                      onViewSOP={() => setSelectedSOPDialog(task.sopRef)}
                    />
                  ))}
                </CardContent>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>
        </Card>
      ))}

      {/* SOP Detail Dialog */}
      <Dialog open={!!selectedSOPDialog} onOpenChange={() => setSelectedSOPDialog(null)}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Standard Operating Procedure: {selectedSOPDialog}
            </DialogTitle>
          </DialogHeader>
          {selectedSOPDialog && (
            <SOPDetailView sopId={selectedSOPDialog} customerTier={customer.service_tier} />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Enhanced TaskCard Component with Report Impact Focus
interface EnhancedTaskCardProps {
  task: EnhancedPMTask;
  customer: Customer;
  isCompleted: boolean;
  isExpanded: boolean;
  isSelected: boolean;
  onToggle: () => void;
  onComplete: () => void;
  onViewSOP: () => void;
}

const EnhancedTaskCard = ({
  task,
  customer,
  isCompleted,
  isExpanded,
  isSelected,
  onToggle,
  onComplete,
  onViewSOP
}: EnhancedTaskCardProps) => {
  const getReportImpactIcon = (impact: string) => {
    switch (impact) {
      case 'foundation': return <FileCheck className="h-3 w-3" />;
      case 'metrics': return <BarChart3 className="h-3 w-3" />;
      case 'improvements': return <TrendingUp className="h-3 w-3" />;
      case 'documentation': return <FileText className="h-3 w-3" />;
      default: return <Target className="h-3 w-3" />;
    }
  };

  const getReportImpactColor = (impact: string) => {
    switch (impact) {
      case 'foundation': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'metrics': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'improvements': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'documentation': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  return (
    <div
      className={`border-b last:border-b-0 transition-colors ${
        isSelected ? 'bg-accent/50' : ''
      }`}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={onComplete}
            className="mt-0.5"
          />
          <div className="flex-1">
            <Button
              variant="ghost"
              className="w-full justify-start text-left p-0 h-auto"
              onClick={onToggle}
            >
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`font-medium ${isCompleted ? 'line-through text-muted-foreground' : ''}`}>
                    {task.name}
                  </span>
                  {task.sopRef && (
                    <Badge variant="secondary" className="text-xs">
                      {task.sopRef}
                    </Badge>
                  )}
                  {/* Report Impact Badge */}
                  <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${getReportImpactColor(task.reportImpact)}`}>
                    {getReportImpactIcon(task.reportImpact)}
                    <span className="capitalize">{task.reportImpact}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  {task.duration && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>{task.duration} min</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <ArrowRight className="h-3 w-3" />
                    <span>Builds {task.reportSection} section</span>
                  </div>
                </div>
              </div>
            </Button>

            {isExpanded && (
              <div className="mt-3 space-y-3 pl-2 border-l-2 border-primary/20">
                {/* Report Impact Preview */}
                <div className="bg-primary/5 p-3 rounded-md">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb className="h-4 w-4 text-primary" />
                    <span className="font-medium text-sm">Report Impact</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    This task contributes <strong>{task.reportImpact}</strong> data to your report's{' '}
                    <strong>{task.reportSection}</strong> section.
                    {task.dataCollected && task.dataCollected.length > 0 && (
                      <span> Collects: {task.dataCollected.join(', ')}</span>
                    )}
                  </p>
                </div>

                {task.steps && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <Play className="h-3 w-3" />
                      Quick Steps:
                    </h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      {task.steps.slice(0, 3).map((step: string, idx: number) => (
                        <li key={idx}>{step}</li>
                      ))}
                    </ol>
                  </div>
                )}
                
                {task.safety && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-2 rounded text-xs border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-1 mb-1">
                      <Shield className="h-3 w-3 text-amber-600" />
                      <span className="font-medium text-amber-700 dark:text-amber-400">Safety:</span>
                    </div>
                    <span className="text-amber-600 dark:text-amber-300">{task.safety}</span>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewSOP();
                    }}
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    View Full SOP
                  </Button>
                  
                  {task.tools && task.tools.length > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        // TODO: Open tools modal
                      }}
                    >
                      <Wrench className="h-3 w-3 mr-1" />
                      Tools ({task.tools.length})
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// SOP Detail Viewer Component
const SOPDetailView = ({ sopId, customerTier }: { sopId: string; customerTier: string }) => {
  const sopDetail = SOPService.getSOPDetails(sopId);
  const steps = SOPService.getSOPStepsForTier(sopId, customerTier);

  if (!sopDetail) {
    return <div>SOP details not found</div>;
  }

  return (
    <div className="space-y-6">
      {/* SOP Header */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
        <div>
          <h4 className="font-medium text-sm text-muted-foreground">Duration</h4>
          <p className="flex items-center gap-1">
            <Timer className="h-3 w-3" />
            {sopDetail.estimated_duration} minutes
          </p>
        </div>
        <div>
          <h4 className="font-medium text-sm text-muted-foreground">System</h4>
          <p>{sopDetail.system_family}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm text-muted-foreground">Navigation</h4>
          <p className="text-sm">{sopDetail.ui_navigation}</p>
        </div>
        <div>
          <h4 className="font-medium text-sm text-muted-foreground">Tier Coverage</h4>
          <div className="flex gap-1">
            {sopDetail.service_tiers.map(tier => (
              <Badge key={tier} variant={tier === customerTier ? "default" : "outline"} className="text-xs">
                {tier}
              </Badge>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Notice */}
      {sopDetail.safety && (
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-lg border border-amber-200 dark:border-amber-800">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="h-4 w-4 text-amber-600" />
            <h4 className="font-medium text-amber-700 dark:text-amber-400">Safety Requirements</h4>
          </div>
          <p className="text-amber-600 dark:text-amber-300 text-sm">{sopDetail.safety}</p>
        </div>
      )}

      {/* SOP Content Tabs */}
      <Tabs defaultValue="steps" className="w-full">
        <TabsList>
          <TabsTrigger value="steps">Step-by-Step</TabsTrigger>
          <TabsTrigger value="tools">Tools Required</TabsTrigger>
          <TabsTrigger value="links">References</TabsTrigger>
        </TabsList>
        
        <TabsContent value="steps" className="space-y-3">
          <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
            <h4 className="font-medium mb-1 flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              Goal
            </h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">{sopDetail.goal}</p>
          </div>
          
          <div>
            <h4 className="font-medium mb-3">Procedure Steps ({customerTier} Tier)</h4>
            <ol className="list-decimal list-inside space-y-2">
              {steps.map((step, idx) => (
                <li key={idx} className="text-sm leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </TabsContent>
        
        <TabsContent value="tools">
          <div className="space-y-2">
            {sopDetail.tools.map((tool, idx) => (
              <div key={idx} className="flex items-center gap-2 p-2 border rounded">
                <Wrench className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{tool}</span>
              </div>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="links">
          <div className="space-y-2">
            {sopDetail.hyperlinks?.map((link, idx) => (
              <div key={idx} className="flex items-start gap-2 p-2 border rounded">
                <ExternalLink className="h-4 w-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{link.split(':')[0]}</p>
                  <a 
                    href={link.split(': ')[1]} 
                    className="text-xs text-blue-600 hover:underline"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {link.split(': ')[1]}
                  </a>
                </div>
              </div>
            )) || <p className="text-sm text-muted-foreground">No reference links available</p>}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
