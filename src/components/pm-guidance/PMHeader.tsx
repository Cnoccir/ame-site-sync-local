import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ServiceTierBadge } from '@/components/ui/service-tier-badge';
import { Customer } from '@/types';
import { ArrowLeft, Building2, Calendar, CheckCircle2, MapPin } from 'lucide-react';
import { format } from 'date-fns';

interface PMHeaderProps {
  customer: Customer;
  progress: number;
  completedTasks: number;
  totalTasks: number;
  onBack: () => void;
}

export const PMHeader = ({ 
  customer, 
  progress, 
  completedTasks, 
  totalTasks,
  onBack 
}: PMHeaderProps) => {
  return (
    <div className="border-b bg-white dark:bg-gray-950">
      <div className="px-6 py-4">
        {/* Top Row - Navigation and Basic Info */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <div>
                <h1 className="text-xl font-semibold">{customer.company_name}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  {customer.site_name || customer.site_address}
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ServiceTierBadge tier={customer.service_tier} />
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(), 'MMM d, yyyy')}</span>
            </div>
          </div>
        </div>

        {/* Progress Row */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="font-medium">PM Progress</span>
            </div>
            <span className="text-muted-foreground">
              {completedTasks} of {totalTasks} tasks completed
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
    </div>
  );
};
