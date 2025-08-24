import { cn } from "@/lib/utils";
import { TIER_CONFIGS } from "@/types/serviceTiers";

interface ServiceTierBadgeProps {
  tier: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const ServiceTierBadge = ({ tier, size = 'md', className }: ServiceTierBadgeProps) => {
  const config = TIER_CONFIGS[tier];
  
  if (!config) {
    return null;
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <div 
      className={cn(
        "inline-flex items-center rounded-full font-medium text-white",
        sizeClasses[size],
        className
      )}
      style={{ backgroundColor: config.color }}
    >
      {config.displayName}
    </div>
  );
};