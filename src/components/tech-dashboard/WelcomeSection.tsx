import React from 'react';

interface WelcomeSectionProps {
  firstName: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ firstName }) => {
  return (
    <section className="text-center">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">
        Welcome Back, {firstName}
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto">
        Complete systematic PM visits with professional documentation
      </p>
      <div className="mt-4 flex items-center justify-center space-x-6 text-sm text-gray-500">
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-green-500"></div>
          <span>System Status: ONLINE</span>
        </div>
        <div className="text-gray-300">|</div>
        <div className="flex items-center space-x-2">
          <span>TECH Mode</span>
        </div>
      </div>
    </section>
  );
};