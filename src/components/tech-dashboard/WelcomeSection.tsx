import React from 'react';
import { CheckCircle, Clock, Target } from 'lucide-react';

interface WelcomeSectionProps {
  firstName: string;
}

export const WelcomeSection: React.FC<WelcomeSectionProps> = ({ firstName }) => {
  return (
    <section className="text-center">
      <h1 className="text-3xl font-semibold text-gray-900 mb-2">
        Welcome Back, {firstName}
      </h1>
      <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-4">
        Systematic preventive maintenance with professional documentation
      </p>
      <p className="text-sm text-gray-500 max-w-3xl mx-auto mb-6">
        Follow the 4-phase PM workflow to ensure consistent service delivery and generate 
        professional reports that demonstrate value to your customers.
      </p>
      
      <div className="mt-6 flex items-center justify-center space-x-8 text-sm">
        <div className="flex items-center space-x-2 text-green-600">
          <CheckCircle className="w-4 h-4" />
          <span className="font-medium">System Online</span>
        </div>
        <div className="text-gray-300">|</div>
        <div className="flex items-center space-x-2 text-blue-600">
          <Target className="w-4 h-4" />
          <span className="font-medium">Tech Mode Active</span>
        </div>
        <div className="text-gray-300">|</div>
        <div className="flex items-center space-x-2 text-purple-600">
          <Clock className="w-4 h-4" />
          <span className="font-medium">Ready for PM Visits</span>
        </div>
      </div>
    </section>
  );
};