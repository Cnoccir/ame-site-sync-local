import { CheckCircle, Clipboard, Search, Wrench, FileText } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Phase {
  id: number;
  name: string;
  icon: any;
  status: 'pending' | 'active' | 'completed';
}

interface WorkflowPhaseTrackerProps {
  currentPhase: number;
  completedPhases: number[];
  onPhaseClick: (phaseId: number) => void;
}

export const WorkflowPhaseTracker = ({ currentPhase, completedPhases, onPhaseClick }: WorkflowPhaseTrackerProps) => {
  const phases: Phase[] = [
    {
      id: 1,
      name: 'Pre-Visit Preparation',
      icon: Clipboard,
      status: completedPhases.includes(1) ? 'completed' : currentPhase === 1 ? 'active' : 'pending'
    },
    {
      id: 2,
      name: 'Initial Assessment',
      icon: Search,
      status: completedPhases.includes(2) ? 'completed' : currentPhase === 2 ? 'active' : 'pending'
    },
    {
      id: 3,
      name: 'Service Execution',
      icon: Wrench,
      status: completedPhases.includes(3) ? 'completed' : currentPhase === 3 ? 'active' : 'pending'
    },
    {
      id: 4,
      name: 'Post-Visit Activities',
      icon: FileText,
      status: completedPhases.includes(4) ? 'completed' : currentPhase === 4 ? 'active' : 'pending'
    }
  ];

  const getPhaseStyles = (phase: Phase) => {
    switch (phase.status) {
      case 'completed':
        return 'bg-green-50 border-green-200 text-green-800';
      case 'active':
        return 'bg-yellow-50 border-yellow-200 text-yellow-800';
      default:
        return 'bg-gray-50 border-gray-200 text-gray-500';
    }
  };

  const getIconStyles = (phase: Phase) => {
    switch (phase.status) {
      case 'completed':
        return 'bg-green-500 text-white';
      case 'active':
        return 'bg-yellow-500 text-white';
      default:
        return 'bg-gray-300 text-gray-600';
    }
  };

  return (
    <div className="w-56 bg-white border-r border-gray-200 h-full">
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-900">Workflow Progress</h3>
        <p className="text-sm text-gray-600">Phase {currentPhase} of 4</p>
      </div>
      
      <div className="p-4 space-y-3">
        {phases.map((phase, index) => (
          <div key={phase.id} className="relative">
            <button
              onClick={() => onPhaseClick(phase.id)}
              className={cn(
                'w-full p-3 rounded-lg border-2 transition-all duration-200 text-left cursor-pointer hover:shadow-md',
                getPhaseStyles(phase)
              )}
            >
              <div className="flex items-center space-x-3">
                <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', getIconStyles(phase))}>
                  {phase.status === 'completed' ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <phase.icon className="w-4 h-4" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{phase.name}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <div className={cn(
                      'w-2 h-2 rounded-full',
                      phase.status === 'completed' ? 'bg-green-500' :
                      phase.status === 'active' ? 'bg-yellow-500' : 'bg-gray-300'
                    )} />
                    <span className="text-xs">
                      {phase.status === 'completed' ? 'Completed' :
                       phase.status === 'active' ? 'In Progress' : 'Pending'}
                    </span>
                  </div>
                </div>
              </div>
            </button>
            
            {index < phases.length - 1 && (
              <div className={cn(
                'absolute left-7 top-full w-0.5 h-3 -mt-1',
                phase.status === 'completed' ? 'bg-green-300' : 'bg-gray-200'
              )} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};