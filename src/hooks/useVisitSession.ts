import { useState, useEffect, useCallback } from 'react';
import { AMEService } from '@/services/ameService';
import { useToast } from '@/hooks/use-toast';

interface VisitSessionData {
  visitId: string;
  sessionToken: string;
  currentPhase: number;
  autoSaveData: any;
  lastSaved: Date;
}

export const useVisitSession = (visitId?: string) => {
  const [sessionData, setSessionData] = useState<VisitSessionData | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const { toast } = useToast();

  // Auto-save interval (30 seconds)
  const AUTO_SAVE_INTERVAL = 30000;

  const initializeSession = useCallback(async (visitId: string) => {
    try {
      // Try to get session token from localStorage first
      const storedToken = localStorage.getItem(`visit_session_${visitId}`);
      
      if (storedToken) {
        const sessionInfo = await AMEService.getVisitSession(storedToken);
        if (sessionInfo) {
          setSessionData({
            visitId: sessionInfo.visit.id,
            sessionToken: storedToken,
            currentPhase: sessionInfo.visit.current_phase || 1,
            autoSaveData: sessionInfo.auto_save_data || {},
            lastSaved: new Date()
          });
          return;
        }
      }

      // If no valid session found, show recovery message
      toast({
        title: "Session Recovery",
        description: "Previous session data not found. Starting fresh.",
        variant: "default"
      });

    } catch (error) {
      console.error('Failed to initialize session:', error);
      toast({
        title: "Session Error",
        description: "Could not restore previous session. Starting fresh.",
        variant: "destructive"
      });
    }
  }, [toast]);

  const saveProgress = useCallback(async (progressData: any) => {
    if (!sessionData) return;

    setIsAutoSaving(true);
    try {
      await AMEService.saveVisitProgress(
        sessionData.visitId,
        sessionData.sessionToken,
        {
          currentPhase: progressData.currentPhase || sessionData.currentPhase,
          autoSaveData: progressData.autoSaveData || {}
        }
      );

      setSessionData(prev => prev ? {
        ...prev,
        currentPhase: progressData.currentPhase || prev.currentPhase,
        autoSaveData: progressData.autoSaveData || prev.autoSaveData,
        lastSaved: new Date()
      } : null);

    } catch (error) {
      console.error('Auto-save failed:', error);
      toast({
        title: "Auto-save Failed",
        description: "Your progress may not be saved. Please check your connection.",
        variant: "destructive"
      });
    } finally {
      setIsAutoSaving(false);
    }
  }, [sessionData, toast]);

  const completePhase = useCallback(async (phase: number) => {
    if (!sessionData) return;

    try {
      await AMEService.completeVisitPhase(sessionData.visitId, phase);
      
      // Update local session data
      setSessionData(prev => prev ? {
        ...prev,
        currentPhase: phase === 4 ? phase : phase + 1,
        lastSaved: new Date()
      } : null);

      toast({
        title: "Phase Completed",
        description: `Phase ${phase} has been completed successfully.`,
        variant: "default"
      });

      // If final phase, clean up session
      if (phase === 4) {
        localStorage.removeItem(`visit_session_${sessionData.visitId}`);
      }

    } catch (error) {
      console.error('Failed to complete phase:', error);
      toast({
        title: "Error",
        description: "Failed to complete phase. Please try again.",
        variant: "destructive"
      });
    }
  }, [sessionData, toast]);

  // Auto-save effect
  useEffect(() => {
    if (!sessionData) return;

    const interval = setInterval(() => {
      if (sessionData.autoSaveData && Object.keys(sessionData.autoSaveData).length > 0) {
        saveProgress({ autoSaveData: sessionData.autoSaveData });
      }
    }, AUTO_SAVE_INTERVAL);

    return () => clearInterval(interval);
  }, [sessionData, saveProgress]);

  // Initialize session on mount
  useEffect(() => {
    if (visitId) {
      initializeSession(visitId);
    }
  }, [visitId, initializeSession]);

  return {
    sessionData,
    isAutoSaving,
    saveProgress,
    completePhase,
    updateAutoSaveData: (data: any) => {
      setSessionData(prev => prev ? {
        ...prev,
        autoSaveData: { ...prev.autoSaveData, ...data }
      } : null);
    }
  };
};