import React from 'react';
import { useUserRole } from '@/services/userRoleService';
import { WelcomeSection } from './WelcomeSection';
import { StartPMCard } from './StartPMCard';
import { ServiceTierGuide } from './ServiceTierGuide';
import { RecentSessions } from './RecentSessions';
import { ProcessOverview } from './ProcessOverview';

export const TechDashboard = () => {
  const { role, firstName } = useUserRole();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">AME CONTROLS</h1>
            <p className="text-sm text-gray-600">PM Workflow Guide</p>
          </div>
          <div className="text-sm text-gray-700">
            Welcome, {firstName || 'Tech'}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <WelcomeSection firstName={firstName || 'Tech'} />
        <StartPMCard />
        
        <div className="grid md:grid-cols-2 gap-8">
          <ServiceTierGuide />
          <RecentSessions />
        </div>
        
        <ProcessOverview />
      </main>
    </div>
  );
};