import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, ArrowRight, Target, Database, Settings, FileText } from 'lucide-react';

export const StartPMCard = () => {
  const navigate = useNavigate();

  return (
    <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-white shadow-lg">
      <CardContent className="p-8 text-center">
        <div className="mb-6">
          <Wrench className="h-16 w-16 text-blue-600 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            START PM VISIT
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Systematic 4-phase workflow for professional service delivery
          </p>
        </div>

        <div className="grid md:grid-cols-4 gap-4 mb-8 text-sm">
          <div className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <Target className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="font-medium text-blue-600">Phase 1</div>
            <div className="text-gray-600">Site Intelligence</div>
            <div className="text-xs text-gray-500 mt-1">Customer, contacts, access</div>
          </div>
          <div className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <Database className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="font-medium text-blue-600">Phase 2</div>
            <div className="text-gray-600">System Discovery</div>
            <div className="text-xs text-gray-500 mt-1">BMS overview, exports</div>
          </div>
          <div className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <Settings className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="font-medium text-blue-600">Phase 3</div>
            <div className="text-gray-600">Service Activities</div>
            <div className="text-xs text-gray-500 mt-1">Tasks, issues, recommendations</div>
          </div>
          <div className="bg-white p-4 rounded border shadow-sm hover:shadow-md transition-shadow">
            <FileText className="h-6 w-6 text-blue-600 mx-auto mb-2" />
            <div className="font-medium text-blue-600">Phase 4</div>
            <div className="text-gray-600">Documentation</div>
            <div className="text-xs text-gray-500 mt-1">Professional PDF reports</div>
          </div>
        </div>

        <Button 
          size="lg"
          onClick={() => navigate('/pm-workflow')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg shadow-lg hover:shadow-xl transition-shadow"
        >
          Start New PM Visit
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
        
        <p className="text-sm text-gray-500 mt-4">
          Estimated time: 2-3 hours • Professional PDF report generated automatically
        </p>
      </CardContent>
    </Card>
  );
};