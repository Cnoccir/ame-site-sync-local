import { useEffect, useState } from 'react';
import { TridiumDataset } from '@/types/tridium';
import { TridiumDatasetStore } from '@/services/tridiumDatasetStore';
import { logger } from '@/utils/logger';

export function useImportedDatasets(projectId?: string) {
  const [datasets, setDatasets] = useState<TridiumDataset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await TridiumDatasetStore.getAll(projectId);
        setDatasets(data);
      } catch (err) {
        logger.error('Error loading datasets', { error: err, projectId });
        setError(err instanceof Error ? err.message : 'Failed to load datasets');
        setDatasets([]); // Fallback to empty array
      } finally {
        setLoading(false);
      }
    };
    
    load();

    const onUpdate = () => {
      // Reload data when update event is triggered
      load();
    };
    
    window.addEventListener(TridiumDatasetStore.UPDATE_EVENT, onUpdate as EventListener);
    window.addEventListener('storage', onUpdate as EventListener);

    return () => {
      window.removeEventListener(TridiumDatasetStore.UPDATE_EVENT, onUpdate as EventListener);
      window.removeEventListener('storage', onUpdate as EventListener);
    };
  }, [projectId]);

  return { 
    datasets, 
    loading, 
    error,
    reload: async () => {
      try {
        setLoading(true);
        const data = await TridiumDatasetStore.getAll(projectId);
        setDatasets(data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to reload datasets');
      } finally {
        setLoading(false);
      }
    }
  };
}
