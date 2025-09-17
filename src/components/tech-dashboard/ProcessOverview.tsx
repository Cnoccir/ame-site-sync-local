import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle2, 
  FileText, 
  Upload, 
  Settings, 
  TrendingUp 
} from 'lucide-react';

export const ProcessOverview = () => {
  const processSteps = [
    {
      icon: <CheckCircle2 className="h-5 w-5 text-blue-600" />,
      title: 'Automatic Data Collection',
      description: 'Customer and site information auto-populated from database with smart search'
    },
    {
      icon: <Upload className="h-5 w-5 text-blue-600" />,
      title: 'System Assessment',
      description: 'Upload Tridium exports for automated device inventory and performance analysis'
    },
    {
      icon: <Settings className="h-5 w-5 text-blue-600" />,
      title: 'SOP-Guided Tasks',
      description: 'Systematic task execution based on service tier with built-in guidance'
    },
    {
      icon: <TrendingUp className="h-5 w-5 text-blue-600" />,
      title: 'Issues & Recommendations',
      description: 'Document findings and provide professional improvement recommendations'
    },
    {
      icon: <FileText className="h-5 w-5 text-blue-600" />,
      title: 'Professional Reports',
      description: '8.5×11 PDF reports with charts, tables, and executive summaries'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-center">
          What Happens in a PM Visit?
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {processSteps.map((step, index) => (
            <div key={index} className="text-center p-4 hover:bg-gray-50 rounded-lg transition-colors">
              <div className="mb-3 flex justify-center">
                {step.icon}
              </div>
              <h4 className="font-medium text-gray-900 mb-2">
                {step.title}
              </h4>
              <p className="text-sm text-gray-600">
                {step.description}
              </p>
            </div>
          ))}
        </div>
        
        <div className="mt-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
          <div className="text-center">
            <h4 className="font-medium text-blue-900 mb-2">
              Professional Documentation Delivered
            </h4>
            <p className="text-sm text-blue-700">
              Every PM visit produces a comprehensive report suitable for customer presentation, 
              including executive summaries, technical findings, and actionable recommendations.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};