import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wrench, ArrowRight, Target, Database, Settings, FileText } from 'lucide-react';
import { SessionManagementModal } from '@/components/pm-workflow/SessionManagementModal';

export const StartPMCard = () => {
  const navigate = useNavigate();
  const [showSessionModal, setShowSessionModal] = useState(false);

  const handleSessionStart = (sessionId: string, workflowData: any) => {
    // Navigate to PM workflow with session data
    navigate(`/pm-guidance/${sessionId}`, {
      state: {
        sessionId,
        workflowData
      }
    });
  };

  return (
    <Card className="border border-gray-200 bg-white shadow-sm">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              Preventive Maintenance Workflow
            </h2>
            <p className="text-gray-600">
              Systematic 4-phase technical process
            </p>
          </div>
          <Wrench className="h-8 w-8 text-blue-600" />
        </div>

        <div className="grid grid-cols-4 gap-3 mb-6">
          <div className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <Target className="h-5 w-5 text-blue-600 mx-auto mb-1" />
            <div className="text-xs font-medium text-gray-900">Site Intel</div>
            <div className="text-xs text-gray-600">Contacts & Access</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <Database className="h-5 w-5 text-green-600 mx-auto mb-1" />
            <div className="text-xs font-medium text-gray-900">System Discovery</div>
            <div className="text-xs text-gray-600">BMS Analysis</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <Settings className="h-5 w-5 text-purple-600 mx-auto mb-1" />
            <div className="text-xs font-medium text-gray-900">Service Tasks</div>
            <div className="text-xs text-gray-600">SOP-Guided</div>
          </div>
          <div className="text-center p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
            <FileText className="h-5 w-5 text-orange-600 mx-auto mb-1" />
            <div className="text-xs font-medium text-gray-900">Reports</div>
            <div className="text-xs text-gray-600">PDF Output</div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            <span className="font-medium text-gray-900">Duration:</span> 90-180 min
            <span className="mx-2">•</span>
            <span className="font-medium text-gray-900">Output:</span> Professional PDF
          </div>

          <Button
            onClick={() => setShowSessionModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white gap-2"
          >
            Start PM Session
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>

        <SessionManagementModal
          isOpen={showSessionModal}
          onClose={() => setShowSessionModal(false)}
          onSessionStart={handleSessionStart}
        />
      </CardContent>
    </Card>
  );
};