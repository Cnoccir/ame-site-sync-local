export interface ServiceTierConfig {
  name: 'CORE' | 'ASSURE' | 'GUARDIAN';
  color: string;
  displayName: string;
  includedTiers: string[];
  taskCount: number;
  description: string;
}

export const TIER_CONFIGS: Record<string, ServiceTierConfig> = {
  'CORE': {
    name: 'CORE',
    color: '#d9534f',
    displayName: 'Core Service',
    includedTiers: ['CORE'],
    taskCount: 8,
    description: 'Essential maintenance tasks and basic tools'
  },
  'ASSURE': {
    name: 'ASSURE', 
    color: '#f0ad4e',
    displayName: 'Assure Service',
    includedTiers: ['CORE', 'ASSURE'],
    taskCount: 15,
    description: 'Core plus advanced diagnostics and enhanced tools'
  },
  'GUARDIAN': {
    name: 'GUARDIAN',
    color: '#28a745', 
    displayName: 'Guardian Service',
    includedTiers: ['CORE', 'ASSURE', 'GUARDIAN'],
    taskCount: 21,
    description: 'Complete service package with all tasks and premium tools'
  }
};

export const validateTierAccess = (requiredTiers: string[], customerTier: string): boolean => {
  const config = TIER_CONFIGS[customerTier];
  if (!config) return false;
  
  return requiredTiers.some(tier => config.includedTiers.includes(tier));
};

export const filterContentByTier = <T extends { service_tiers?: string[] }>(
  content: T[], 
  customerTier: string
): T[] => {
  const config = TIER_CONFIGS[customerTier];
  if (!config) return content.filter(item => !item.service_tiers || item.service_tiers.includes('CORE'));
  
  return content.filter(item => {
    if (!item.service_tiers || item.service_tiers.length === 0) {
      return true; // Default to accessible for all tiers
    }
    return item.service_tiers.some(tier => config.includedTiers.includes(tier));
  });
};

export const getInheritedTiers = (tier: string): string[] => {
  const config = TIER_CONFIGS[tier];
  return config ? config.includedTiers : ['CORE'];
};