import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ServiceTierBadge } from "@/components/ui/service-tier-badge";
import { TIER_CONFIGS } from "@/types/serviceTiers";

interface ServiceTierSelectorProps {
  value: string;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export const ServiceTierSelector = ({ value, onValueChange, disabled }: ServiceTierSelectorProps) => {
  return (
    <Select value={value} onValueChange={onValueChange} disabled={disabled}>
      <SelectTrigger>
        <SelectValue>
          {value ? <ServiceTierBadge tier={value} size="sm" /> : "Select service tier"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {Object.values(TIER_CONFIGS).map((config) => (
          <SelectItem key={config.name} value={config.name}>
            <div className="flex items-center justify-between w-full">
              <ServiceTierBadge tier={config.name} size="sm" />
              <span className="ml-2 text-muted-foreground">
                {config.taskCount} tasks
              </span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};