import { useState, useEffect, useCallback } from 'react';
import { TridiumDataset, NetworkTopology, NetworkNode } from '@/types/tridium';
import { NetworkTopologyService } from '@/services/networkTopologyService';
import { TridiumAssociationService } from '@/services/tridiumAssociationService';

interface DeviceDataState {
  topology: NetworkTopology | null;
  loading: boolean;
  error: string | null;
  selectedNode: NetworkNode | null;
  lastUpdated: Date;
}

export const useDeviceDataUpdates = (initialDatasets: TridiumDataset[]) => {
  const [state, setState] = useState<DeviceDataState>({
    topology: null,
    loading: true,
    error: null,
    selectedNode: null,
    lastUpdated: new Date()
  });

  // Rebuild topology when datasets change
  const updateTopology = useCallback((datasets: TridiumDataset[]) => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const newTopology = NetworkTopologyService.buildTopology(datasets);
      
      setState(prev => {
        // If we had a selected node, try to find it in the new topology
        let updatedSelectedNode = null;
        if (prev.selectedNode) {
          updatedSelectedNode = NetworkTopologyService.findNodeById(newTopology, prev.selectedNode.id);
        }

        return {
          ...prev,
          topology: newTopology,
          selectedNode: updatedSelectedNode,
          loading: false,
          lastUpdated: new Date()
        };
      });
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Failed to build topology',
        loading: false
      }));
    }
  }, []);

  // Initialize topology
  useEffect(() => {
    updateTopology(initialDatasets);
  }, [initialDatasets, updateTopology]);

  // Watch for association changes and rebuild topology
  useEffect(() => {
    const handleAssociationChange = (event?: CustomEvent) => {
      // Longer delay to ensure all association changes are complete
      // and datasets have been properly updated
      setTimeout(() => {
        console.log('Rebuilding topology after association change', { 
          datasetCount: initialDatasets.length,
          eventDetail: event?.detail 
        });
        updateTopology(initialDatasets);
      }, 250); // Increased delay
    };

    // Listen for storage events (cross-tab updates)
    window.addEventListener('storage', handleAssociationChange);
    
    // Custom event for same-tab updates
    window.addEventListener('tridiumAssociationUpdate', handleAssociationChange);

    return () => {
      window.removeEventListener('storage', handleAssociationChange);
      window.removeEventListener('tridiumAssociationUpdate', handleAssociationChange);
    };
  }, [initialDatasets, updateTopology]);

  const selectNode = useCallback((node: NetworkNode | null) => {
    setState(prev => ({ ...prev, selectedNode: node }));
  }, []);

  const refreshTopology = useCallback(() => {
    updateTopology(initialDatasets);
  }, [initialDatasets, updateTopology]);

  // Enhanced node selection with auto-association
  const selectNodeWithAutoAssociation = useCallback((node: NetworkNode) => {
    setState(prev => ({ ...prev, selectedNode: node }));
    
    // Auto-associate datasets if none are currently associated
    const currentAssociations = TridiumAssociationService.getMappings();
    const hasAssociations = Object.values(currentAssociations).includes(node.id);
    
    if (!hasAssociations) {
      autoAssociateNode(node, initialDatasets);
    }
  }, [initialDatasets]);

  return {
    topology: state.topology,
    selectedNode: state.selectedNode,
    loading: state.loading,
    error: state.error,
    lastUpdated: state.lastUpdated,
    selectNode,
    selectNodeWithAutoAssociation,
    refreshTopology,
    // Expose individual node enhancement
    enhanceNodeWithDataset: useCallback((nodeId: string, dataset: TridiumDataset) => {
      if (!state.topology) return;
      
      const node = NetworkTopologyService.findNodeById(state.topology, nodeId);
      if (node) {
        // Set association and refresh
        TridiumAssociationService.setMapping(dataset.id, nodeId);
        refreshTopology();
      }
    }, [state.topology, refreshTopology])
  };
};

// Helper function for auto-association
const autoAssociateNode = (node: NetworkNode, datasets: TridiumDataset[]) => {
  const nodeName = node.name.toLowerCase();
  const nodeType = node.type;

  datasets.forEach(dataset => {
    // Check if dataset is already associated
    const existingAssociation = TridiumAssociationService.getNodeIdForDataset(dataset.id);
    if (existingAssociation) return;

    const filename = dataset.filename.toLowerCase();
    const format = dataset.format;

    // Association heuristics
    let shouldAssociate = false;

    if (format === 'PlatformDetails' || format === 'ResourceExport') {
      // Associate with supervisor nodes if filename contains 'supervisor'
      if (nodeType === 'supervisor' && filename.includes('supervisor')) {
        shouldAssociate = true;
      }
      
      // Associate if filename contains node name
      if (nodeName && filename.includes(nodeName)) {
        shouldAssociate = true;
      }

      // Check first row for station name match
      if (dataset.rows.length > 0) {
        const firstRow = dataset.rows[0].data;
        const stationName = String(firstRow['Station Name'] || firstRow['Name'] || '').toLowerCase();
        if (stationName === nodeName) {
          shouldAssociate = true;
        }
      }
    }

    if (shouldAssociate) {
      TridiumAssociationService.setMapping(dataset.id, node.id);
      // Dispatch custom event to trigger updates
      window.dispatchEvent(new CustomEvent('tridiumAssociationUpdate'));
    }
  });
};

// Enhanced association service wrapper
export const useEnhancedAssociations = () => {
  const [associations, setAssociations] = useState(TridiumAssociationService.getMappings());

  useEffect(() => {
    const handleUpdate = () => {
      setAssociations(TridiumAssociationService.getMappings());
    };

    window.addEventListener('storage', handleUpdate);
    window.addEventListener('tridiumAssociationUpdate', handleUpdate);

    return () => {
      window.removeEventListener('storage', handleUpdate);
      window.removeEventListener('tridiumAssociationUpdate', handleUpdate);
    };
  }, []);

  const setAssociation = useCallback((datasetId: string, nodeId: string) => {
    TridiumAssociationService.setMapping(datasetId, nodeId);
    setAssociations(TridiumAssociationService.getMappings());
    window.dispatchEvent(new CustomEvent('tridiumAssociationUpdate'));
  }, []);

  const removeAssociation = useCallback((datasetId: string) => {
    TridiumAssociationService.removeMapping(datasetId);
    setAssociations(TridiumAssociationService.getMappings());
    window.dispatchEvent(new CustomEvent('tridiumAssociationUpdate'));
  }, []);

  const getNodeDatasets = useCallback((nodeId: string, datasets: TridiumDataset[]) => {
    const associatedDatasetIds = Object.entries(associations)
      .filter(([, nId]) => nId === nodeId)
      .map(([dsId]) => dsId);
    
    return datasets.filter(ds => associatedDatasetIds.includes(ds.id));
  }, [associations]);

  return {
    associations,
    setAssociation,
    removeAssociation,
    getNodeDatasets
  };
};

export default useDeviceDataUpdates;
