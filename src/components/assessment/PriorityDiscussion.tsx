import { Thermometer, Wrench, Zap, Settings } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface PriorityDiscussionProps {
  value: {
    comfortIssues: string;
    equipmentProblems: string;
    energyConcerns: string;
    operationalRequests: string;
  };
  onChange: (value: any) => void;
}

export const PriorityDiscussion = ({ value, onChange }: PriorityDiscussionProps) => {
  const updateField = (field: string, newValue: string) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const priorityTopics = [
    {
      id: 'comfortIssues',
      title: 'Current Comfort Issues',
      icon: Thermometer,
      placeholder: 'Temperature complaints, humidity issues, air quality concerns...',
      value: value.comfortIssues,
      color: 'text-blue-600'
    },
    {
      id: 'equipmentProblems',
      title: 'Recent Equipment Problems',
      icon: Wrench,
      placeholder: 'Equipment failures, maintenance issues, performance problems...',
      value: value.equipmentProblems,
      color: 'text-orange-600'
    },
    {
      id: 'energyConcerns',
      title: 'Energy Concerns',
      icon: Zap,
      placeholder: 'High energy costs, efficiency issues, consumption patterns...',
      value: value.energyConcerns,
      color: 'text-yellow-600'
    },
    {
      id: 'operationalRequests',
      title: 'Operational Requests',
      icon: Settings,
      placeholder: 'Schedule changes, setpoint adjustments, system modifications...',
      value: value.operationalRequests,
      color: 'text-green-600'
    }
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-medium mb-4">Customer Priority Discussion</h4>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {priorityTopics.map((topic) => (
          <Card 
            key={topic.id} 
            className="p-4 transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2"
          >
            <div className="flex items-center gap-2 mb-3">
              <topic.icon className={`w-5 h-5 ${topic.color}`} />
              <Label htmlFor={topic.id} className="font-medium cursor-pointer">
                {topic.title}
              </Label>
            </div>
            
            <Textarea
              id={topic.id}
              placeholder={topic.placeholder}
              value={topic.value}
              onChange={(e) => updateField(topic.id, e.target.value)}
              rows={4}
              className="resize-none"
            />
          </Card>
        ))}
      </div>
    </div>
  );
};