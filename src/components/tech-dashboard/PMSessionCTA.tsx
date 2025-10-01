import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Play, ArrowRight } from 'lucide-react';
import { SessionManagementModal } from '@/components/pm-workflow/SessionManagementModal';

export const PMSessionCTA = () => {
  const navigate = useNavigate();
  const [showSessionModal, setShowSessionModal] = useState(false);

  const handleSessionStart = (sessionId: string, workflowData: any) => {
    navigate(`/pm-workflow/${sessionId}`, {
      state: {
        sessionId,
        workflowData
      }
    });
  };

  return (
    <>
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-white shadow-sm">
        <CardContent className="p-8 text-center">
          {/* Primary action icon and header */}
          <div className="mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
              <Play className="w-8 h-8 text-blue-600" />
            </div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Start PM Session
            </h2>
            <p className="text-gray-600 max-w-md mx-auto">
              Begin a systematic 4-phase preventive maintenance workflow
            </p>
          </div>

          {/* Process overview - compact */}
          <div className="flex items-center justify-center gap-4 mb-8 text-sm">
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <span className="text-gray-700">Site Intel</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-gray-700">System Discovery</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <span className="text-gray-700">Service Tasks</span>
            </div>
            <ArrowRight className="w-4 h-4 text-gray-400" />
            <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg border">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <span className="text-gray-700">Documentation</span>
            </div>
          </div>

          {/* Primary action button */}
          <Button
            size="lg"
            onClick={() => setShowSessionModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-200"
            data-pm-cta-button
          >
            <Play className="w-5 h-5 mr-2" />
            Start PM Session
          </Button>

          <p className="text-sm text-gray-500 mt-4">
            Duration: 90-180 minutes • Professional PDF report generated
          </p>
        </CardContent>
      </Card>

      {/* Session management modal */}
      <SessionManagementModal
        isOpen={showSessionModal}
        onClose={() => setShowSessionModal(false)}
        onSessionStart={handleSessionStart}
      />
    </>
  );
};