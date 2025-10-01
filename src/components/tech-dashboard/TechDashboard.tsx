import React from 'react';
import { useUserRole } from '@/services/userRoleService';
import { PMSessionCTA } from './PMSessionCTA';
import { ResumeWork } from './ResumeWork';
import { RecentReports } from './RecentReports';
import { QuickSearch } from './QuickSearch';

export const TechDashboard = () => {
  const { firstName } = useUserRole();

  return (
    <div className="min-h-screen" style={{ background: 'hsl(var(--ame-light))' }}>
      {/* Above the fold - Primary content */}
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
        {/* Welcome header - minimal */}
        <div className="mb-8">
          <h1 className="text-2xl font-semibold" style={{ color: 'hsl(var(--ame-primary))' }}>
            Welcome back, {firstName || 'Technician'}
          </h1>
          <p className="text-sm text-gray-600 mt-1">Preventive maintenance dashboard</p>
        </div>

        {/* Primary CTA - Start PM Session */}
        <PMSessionCTA />

        {/* Above the fold content - Resume Work and Recent Reports */}
        <div className="grid lg:grid-cols-2 gap-6">
          <ResumeWork />
          <RecentReports />
        </div>
      </div>

      {/* Below the fold - Secondary content */}
      <div className="border-t border-gray-200 bg-white/50">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <QuickSearch />
        </div>
      </div>
    </div>
  );
};