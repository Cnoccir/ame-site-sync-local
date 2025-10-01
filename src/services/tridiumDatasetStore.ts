// Persistent store for parsed Tridium datasets
// Uses Supabase database with localStorage fallback for offline support

import { TridiumDataset } from '@/types/tridium';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/logger';
import { tridiumDatabaseService } from './TridiumDatabaseService';

const FALLBACK_STORAGE_KEY = 'tridiumDatasets';
const UPDATE_EVENT = 'tridiumDatasetsUpdate';

// Fallback localStorage functions for offline support
function loadFromLocalStorage(): TridiumDataset[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(FALLBACK_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as TridiumDataset[];
  } catch {
    logger.warn('Failed to load datasets from localStorage');
  }
  return [];
}

function saveToLocalStorage(datasets: TridiumDataset[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(FALLBACK_STORAGE_KEY, JSON.stringify(datasets));
  } catch {
    logger.warn('Failed to save datasets to localStorage');
  }
}

function emitUpdateEvent() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(UPDATE_EVENT));
  }
}

// Main dataset store with database integration
export const TridiumDatasetStore = {
  /**
   * Get all datasets for the current user's projects
   */
  async getAll(projectId?: string): Promise<TridiumDataset[]> {
    try {
      if (projectId) {
        // Get datasets for specific project from system baselines
        const baselines = await tridiumDatabaseService.getSystemBaselinesForProject(projectId);
        return baselines.map(baseline => this.baselineToDataset(baseline));
      } else {
        // Get all recent baselines for user's projects
        const { data: projects, error: projectError } = await supabase
          .from('pm_projects')
          .select('id')
          .eq('created_by', (await supabase.auth.getUser()).data.user?.id || '');

        if (projectError || !projects) {
          logger.warn('Failed to fetch user projects, falling back to localStorage');
          return loadFromLocalStorage();
        }

        const allBaselines = await Promise.all(
          projects.map(p => tridiumDatabaseService.getSystemBaselinesForProject(p.id))
        );

        return allBaselines.flat().map(baseline => this.baselineToDataset(baseline));
      }
    } catch (error) {
      logger.error('Error fetching datasets from database', { error });
      return loadFromLocalStorage();
    }
  },

  /**
   * Add a single dataset (saves to database if possible)
   */
  async add(dataset: TridiumDataset, projectId?: string): Promise<boolean> {
    try {
      // Save to localStorage for immediate availability
      const current = loadFromLocalStorage();
      const idx = current.findIndex(d => d.id === dataset.id);
      if (idx >= 0) current[idx] = dataset; else current.push(dataset);
      saveToLocalStorage(current);

      // Try to save to database if projectId provided
      if (projectId && dataset.metadata?.normalizedData) {
        // This would be handled by the EnhancedTridiumParsingService
        // when parsing files with proper project context
        logger.info('Dataset added to localStorage, database save requires project context');
      }

      emitUpdateEvent();
      return true;
    } catch (error) {
      logger.error('Error adding dataset', { error, datasetId: dataset.id });
      return false;
    }
  },

  /**
   * Add multiple datasets
   */
  async addMany(datasets: TridiumDataset[], projectId?: string): Promise<boolean> {
    try {
      // Update localStorage
      const current = loadFromLocalStorage();
      const byId = new Map<string, TridiumDataset>(current.map(d => [d.id, d]));
      datasets.forEach(ds => byId.set(ds.id, ds));
      saveToLocalStorage(Array.from(byId.values()));

      // Database saves would be handled by EnhancedTridiumParsingService
      // when processing files with project context
      if (projectId) {
        logger.info('Multiple datasets added to localStorage, database save requires enhanced parsing service');
      }

      emitUpdateEvent();
      return true;
    } catch (error) {
      logger.error('Error adding multiple datasets', { error, count: datasets.length });
      return false;
    }
  },

  /**
   * Remove dataset by ID
   */
  async removeById(id: string): Promise<boolean> {
    try {
      // Remove from localStorage
      const current = loadFromLocalStorage().filter(d => d.id !== id);
      saveToLocalStorage(current);

      // Try to remove from database if it's a system baseline
      if (id.includes('baseline-')) {
        const baselineId = id.replace('baseline-', '');
        await tridiumDatabaseService.deleteSystemBaseline(baselineId);
      }

      emitUpdateEvent();
      return true;
    } catch (error) {
      logger.error('Error removing dataset', { error, id });
      return false;
    }
  },

  /**
   * Clear all datasets
   */
  async clear(): Promise<boolean> {
    try {
      saveToLocalStorage([]);
      emitUpdateEvent();
      return true;
    } catch (error) {
      logger.error('Error clearing datasets', { error });
      return false;
    }
  },

  /**
   * Get dataset by ID (checks database first, then localStorage)
   */
  async getById(id: string): Promise<TridiumDataset | null> {
    try {
      // Check if it's a database baseline
      if (id.includes('baseline-')) {
        const baselineId = id.replace('baseline-', '');
        const baseline = await tridiumDatabaseService.getSystemBaseline(baselineId);
        if (baseline) {
          return this.baselineToDataset(baseline);
        }
      }

      // Fallback to localStorage
      const localDatasets = loadFromLocalStorage();
      return localDatasets.find(d => d.id === id) || null;
    } catch (error) {
      logger.error('Error getting dataset by ID', { error, id });
      return null;
    }
  },

  /**
   * Convert system baseline to TridiumDataset format for compatibility
   */
  baselineToDataset(baseline: any): TridiumDataset {
    return {
      id: `baseline-${baseline.id}`,
      filename: `${baseline.site_name}-${baseline.baseline_date}`,
      format: 'SystemBaseline',
      category: 'systemBaseline',
      columns: [],
      rows: [],
      summary: {
        totalDevices: baseline.total_devices,
        healthScore: baseline.health_score,
        systemArchitecture: baseline.system_architecture,
        niagaraVersion: baseline.niagara_version,
        criticalFindings: [],
        recommendations: []
      },
      formatSpec: {
        format: 'SystemBaseline',
        displayName: 'System Baseline',
        description: 'Comprehensive system inventory baseline',
        fileTypes: ['.baseline'],
        requiredColumns: [],
        optionalColumns: [],
        identifierColumns: ['id'],
        keyColumn: 'id'
      },
      metadata: {
        totalRows: baseline.total_devices,
        totalColumns: 0,
        parseErrors: baseline.parsing_errors || [],
        parseWarnings: [],
        uploadedAt: new Date(baseline.created_at),
        fileSize: 0,
        processingTime: 0,
        isValid: true,
        confidence: baseline.data_confidence,
        normalizedData: baseline,
        baselineId: baseline.id,
        projectId: baseline.project_id,
        customerId: baseline.customer_id
      },
      rawContent: JSON.stringify(baseline)
    };
  },

  UPDATE_EVENT
};
