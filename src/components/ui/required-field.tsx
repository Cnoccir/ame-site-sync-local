import { cn } from '@/lib/utils';
import { AlertCircle } from 'lucide-react';

interface RequiredFieldProps {
  children: React.ReactNode;
  required?: boolean;
  completed?: boolean;
  className?: string;
}

export const RequiredField = ({ 
  children, 
  required = false, 
  completed = false, 
  className 
}: RequiredFieldProps) => {
  if (!required) return <>{children}</>;

  return (
    <div className={cn(
      "relative",
      !completed && "ring-2 ring-warning/50 rounded-md",
      className
    )}>
      {!completed && (
        <div className="absolute -top-1 -right-1 z-10">
          <AlertCircle className="w-4 h-4 text-warning fill-background" />
        </div>
      )}
      {children}
    </div>
  );
};