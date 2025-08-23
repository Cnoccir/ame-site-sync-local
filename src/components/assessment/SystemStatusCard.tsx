import { LucideIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface SystemStatusCardProps {
  icon: LucideIcon;
  title: string;
  value: string | number;
  subtitle?: string;
  onClick?: () => void;
  variant?: 'default' | 'warning' | 'success' | 'destructive';
}

export const SystemStatusCard = ({ 
  icon: Icon, 
  title, 
  value, 
  subtitle, 
  onClick,
  variant = 'default'
}: SystemStatusCardProps) => {
  const getVariantStyles = () => {
    switch (variant) {
      case 'warning':
        return 'border-warning text-warning';
      case 'success':
        return 'border-success text-success';
      case 'destructive':
        return 'border-destructive text-destructive';
      default:
        return 'border-primary text-primary';
    }
  };

  return (
    <Card 
      className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 ${onClick ? 'hover:bg-muted/50' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center gap-3 mb-2">
        <Icon className={`w-5 h-5 ${getVariantStyles()}`} />
        <h3 className="font-medium text-sm">{title}</h3>
      </div>
      
      <div className="text-2xl font-bold mb-1">{value}</div>
      
      {subtitle && (
        <div className="text-xs text-muted-foreground">{subtitle}</div>
      )}
    </Card>
  );
};