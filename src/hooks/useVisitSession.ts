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
    console.log('🔍 Initializing session for visitId:', visitId);
    try {
      // Try to get session token from localStorage first
      const storedToken = localStorage.getItem(`visit_session_${visitId}`);
      console.log('🔍 Stored token found:', !!storedToken);
      
      if (storedToken) {
        try {
          console.log('🔍 Attempting to get session with stored token');
          const sessionInfo = await AMEService.getVisitSession(storedToken);
          console.log('🔍 Session info retrieved:', !!sessionInfo);
          if (sessionInfo) {
            setSessionData({
              visitId: sessionInfo.visit.id,
              sessionToken: storedToken,
              currentPhase: sessionInfo.visit.current_phase || 1,
              autoSaveData: sessionInfo.auto_save_data || {},
              lastSaved: new Date()
            });
            console.log('✅ Session restored from localStorage');
            return;
          }
        } catch (sessionError) {
          console.log('❌ Stored session invalid, will try to recover visit:', sessionError);
        }
      }

      // If no valid session found, try to recover or create a new session for the visit
      console.log('🔍 Attempting to create session for visit:', visitId);
      try {
        const sessionData = await AMEService.createSessionForVisit(visitId);
        console.log('🔍 Session creation result:', !!sessionData);
        if (sessionData) {
          // Store new session token
          localStorage.setItem(`visit_session_${visitId}`, sessionData.sessionToken);
          
          setSessionData({
            visitId: sessionData.visit.id,
            sessionToken: sessionData.sessionToken,
            currentPhase: sessionData.visit.current_phase || 1,
            autoSaveData: sessionData.visit.auto_save_data || {},
            lastSaved: new Date()
          });

          toast({
            title: "Session Restored",
            description: "Visit session has been restored successfully.",
            variant: "default"
          });
          console.log('✅ Session created and restored successfully');
          return;
        }
      } catch (visitError) {
        console.log('❌ Could not find or restore visit:', visitError);
      }

      // If all recovery attempts fail, show error
      console.log('❌ All recovery attempts failed');
      toast({
        title: "Session Error",
        description: "Could not restore visit session. The visit may have expired or been completed.",
        variant: "destructive"
      });

    } catch (error) {
      console.error('❌ Failed to initialize session:', error);
      toast({
        title: "Session Error",
        description: "Could not restore previous session. Please try starting a new visit.",
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
    console.log('🔍 useVisitSession effect triggered with visitId:', visitId);
    if (visitId) {
      initializeSession(visitId);
    } else {
      console.log('❌ No visitId provided');
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