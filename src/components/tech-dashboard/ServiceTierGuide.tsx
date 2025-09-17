import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Clock } from 'lucide-react';

export const ServiceTierGuide = () => {
  const serviceTiers = [
    {
      name: 'CORE',
      color: 'bg-green-100 text-green-800 border-green-200',
      tasks: 8,
      duration: '60-90 min',
      description: 'Essential PM activities',
      features: [
        'System backup & performance check',
        'Active alarm resolution',
        'Schedule & setpoint verification',
        'Critical sensor validation',
        'Basic documentation update'
      ]
    },
    {
      name: 'ASSURE',
      color: 'bg-blue-100 text-blue-800 border-blue-200',
      tasks: '8+7',
      duration: '90-120 min',
      description: 'Enhanced diagnostics & analysis',
      features: [
        'All CORE tasks included',
        'Device communication health',
        'Temperature sensor calibration',
        'Control loop performance',
        'Energy trend analysis'
      ]
    },
    {
      name: 'GUARDIAN',
      color: 'bg-purple-100 text-purple-800 border-purple-200',
      tasks: '8+7+6',
      duration: '120-180 min',
      description: 'Premium optimization service',
      features: [
        'All ASSURE tasks included',
        'PID loop tuning & optimization',
        'Advanced analytics configuration',
        'Network performance optimization',
        'Security vulnerability assessment'
      ]
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-blue-600" />
          Service Tier Guide
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {serviceTiers.map((tier) => (
          <div key={tier.name} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <Badge className={tier.color}>{tier.name}</Badge>
                <span className="text-sm text-gray-600">
                  {typeof tier.tasks === 'string' ? tier.tasks : tier.tasks} tasks
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                {tier.duration}
              </div>
            </div>
            
            <div className="mb-2">
              <span className="font-medium text-gray-900">{tier.description}</span>
            </div>
            
            <ul className="text-sm text-gray-600 space-y-1">
              {tier.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-gray-400 mt-2 flex-shrink-0"></div>
                  {feature}
                </li>
              ))}
              {tier.features.length > 3 && (
                <li className="text-xs text-gray-500 pl-3.5">
                  +{tier.features.length - 3} more activities...
                </li>
              )}
            </ul>
          </div>
        ))}
        
        <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded">
          <strong>Note:</strong> Service tier is determined by customer contract. 
          Tasks are automatically loaded based on site configuration.
        </div>
      </CardContent>
    </Card>
  );
};