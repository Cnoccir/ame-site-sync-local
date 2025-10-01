// React components for feature flag conditional rendering
import React, { ReactNode } from 'react';
import { FeatureFlagKey, FeatureFlagService } from '@/config/featureFlags';

// Hook for using feature flags in components
export const useFeatureFlag = (flag: FeatureFlagKey): boolean => {
  return FeatureFlagService.isEnabled(flag);
};

// Conditional component wrapper
export interface ConditionalFeatureProps {
  flag: FeatureFlagKey;
  children: ReactNode;
  fallback?: ReactNode;
}

export const ConditionalFeature: React.FC<ConditionalFeatureProps> = ({ 
  flag, 
  children, 
  fallback = null 
}) => {
  const isEnabled = useFeatureFlag(flag);
  return isEnabled ? <React.Fragment>{children}</React.Fragment> : <React.Fragment>{fallback}</React.Fragment>;
};

// Multiple feature flags wrapper (AND logic)
export interface ConditionalMultipleFeatureProps {
  flags: FeatureFlagKey[];
  mode?: 'AND' | 'OR';
  children: ReactNode;
  fallback?: ReactNode;
}

export const ConditionalMultipleFeatures: React.FC<ConditionalMultipleFeatureProps> = ({ 
  flags, 
  mode = 'AND',
  children, 
  fallback = null 
}) => {
  const isEnabled = mode === 'AND' 
    ? FeatureFlagService.areAllEnabled(flags)
    : FeatureFlagService.isAnyEnabled(flags);
    
  return isEnabled ? <React.Fragment>{children}</React.Fragment> : <React.Fragment>{fallback}</React.Fragment>;
};

// Utility component for feature-based conditional rendering
export const FeatureGate: React.FC<{
  feature: FeatureFlagKey;
  children: ReactNode;
}> = ({ feature, children }) => {
  return <ConditionalFeature flag={feature}>{children}</ConditionalFeature>;
};
