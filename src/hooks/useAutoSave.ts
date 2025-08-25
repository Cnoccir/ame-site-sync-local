import { useCallback, useRef, useEffect } from 'react';

interface UseAutoSaveOptions {
  delay?: number;
  onSave?: (data: any) => void;
  enabled?: boolean;
}

export const useAutoSave = ({ delay = 2000, onSave, enabled = true }: UseAutoSaveOptions = {}) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingDataRef = useRef<any>(null);
  const isLoadingRef = useRef(false);

  const debouncedSave = useCallback((data: any) => {
    if (!enabled || isLoadingRef.current || !onSave) return;

    pendingDataRef.current = data;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      if (pendingDataRef.current && onSave) {
        onSave(pendingDataRef.current);
        pendingDataRef.current = null;
      }
    }, delay);
  }, [delay, onSave, enabled]);

  const setLoading = useCallback((loading: boolean) => {
    isLoadingRef.current = loading;
  }, []);

  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    if (pendingDataRef.current && onSave) {
      onSave(pendingDataRef.current);
      pendingDataRef.current = null;
    }
  }, [onSave]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return { debouncedSave, setLoading, forceSave };
};