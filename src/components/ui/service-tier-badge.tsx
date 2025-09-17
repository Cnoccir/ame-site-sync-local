import { Badge } from '@/components/ui/badge';

interface ServiceTierBadgeProps {
  tier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  className?: string;
}

export const ServiceTierBadge = ({ tier, className }: ServiceTierBadgeProps) => {
  const getVariant = () => {
    switch (tier) {
      case 'CORE':
        return 'default';
      case 'ASSURE':
        return 'secondary';
      case 'GUARDIAN':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <Badge variant={getVariant()} className={className}>
      {tier}
    </Badge>
  );
};
