import React, { useMemo, useState } from 'react';
import { NetworkTopologyService } from '@/services/networkTopologyService';
import { TridiumDataset, NetworkNode } from '@/types/tridium';
import { TridiumAssociationService } from '@/services/tridiumAssociationService';
import DeviceDetailsPanel from '@/components/DeviceDetailsPanel';
import { useDeviceDataUpdates, useEnhancedAssociations } from '@/hooks/useDeviceDataUpdates';

interface SiteTreeProps {
  datasets: TridiumDataset[];
  onRequestUpload?: (node: NetworkNode, kind: 'platform' | 'resource' | 'driver') => void;
}

export const SiteTree: React.FC<SiteTreeProps> = ({ datasets, onRequestUpload }) => {
  // Use enhanced data updating hook
  const {
    topology,
    selectedNode,
    loading,
    error,
    lastUpdated,
    selectNodeWithAutoAssociation,
    refreshTopology
  } = useDeviceDataUpdates(datasets);

  // Use enhanced associations hook
  const { associations, getNodeDatasets, setAssociation } = useEnhancedAssociations();
  const [previewDatasetId, setPreviewDatasetId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Building topology...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-destructive">
          <p className="font-medium">Error building topology</p>
          <p className="text-sm mt-1">{error}</p>
          <button 
            onClick={refreshTopology}
            className="mt-3 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!topology) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center text-muted-foreground">
          <p>No topology data available</p>
          <p className="text-sm mt-1">Upload some datasets to begin</p>
        </div>
      </div>
    );
  }

  // Simple association heuristics for platform/resource datasets
  const platformDatasets = datasets.filter(d => d.format === 'PlatformDetails');
  const resourceDatasets = datasets.filter(d => d.format === 'ResourceExport');

  const nodeHasPlatform = (node: NetworkNode) => {
    // Debug logging
    console.log(`Checking platform for node ${node.name}:`, {
      nodeId: node.id,
      nodeMetadata: node.metadata?.associatedDatasets,
      associations: associations,
      platformDatasets: platformDatasets.map(d => d.filename)
    });
    
    // Check node metadata first (embedded during topology building)
    if (node.metadata?.associatedDatasets?.some(ds => ds.format === 'PlatformDetails')) {
      console.log(`✓ Found platform in node metadata for ${node.name}`);
      return true;
    }
    
    // Check association service mappings
    const mapped = getAssociatedDatasets(node).some(ds => ds.format === 'PlatformDetails');
    if (mapped) {
      console.log(`✓ Found platform in associations for ${node.name}`);
      return true;
    }
    
    // Fallback to heuristic matching
    const name = node.name?.toLowerCase() || '';
    const heuristicMatch = platformDatasets.some(ds => {
      const fn = ds.filename.toLowerCase();
      const row = ds.rows[0]?.data || {};
      const station = String(row['Station Name'] || '').toLowerCase();
      if (node.type === 'supervisor' && fn.includes('supervisor')) return true;
      if (station && station === name) return true;
      if (name && fn.includes(name)) return true;
      return false;
    });
    
    if (heuristicMatch) {
      console.log(`✓ Found platform via heuristic for ${node.name}`);
    } else {
      console.log(`✗ No platform found for ${node.name}`);
    }
    
    return heuristicMatch;
  };

  const nodeHasResources = (node: NetworkNode) => {
    // Check node metadata first (embedded during topology building)
    if (node.metadata?.associatedDatasets?.some(ds => ds.format === 'ResourceExport')) {
      return true;
    }
    
    // Check association service mappings
    const mapped = getAssociatedDatasets(node).some(ds => ds.format === 'ResourceExport');
    if (mapped) return true;
    
    // Fallback to heuristic matching
    const name = node.name?.toLowerCase() || '';
    return resourceDatasets.some(ds => {
      const fn = ds.filename.toLowerCase();
      if (node.type === 'supervisor' && fn.includes('supervisor')) return true;
      if (name && fn.includes(name)) return true;
      return false;
    });
  };

  const renderNode = (node: NetworkNode, depth: number = 0) => {
    const badge = node.status?.badge?.text || 'UNKNOWN';
    const variant = node.status?.badge?.variant || 'default';
    const isSelected = selectedNode?.id === node.id;

    return (
      <li key={node.id} style={{ 
        marginLeft: depth > 0 ? 24 : 0, 
        marginBottom: 12,
        padding: '8px 12px',
        borderRadius: 8,
        border: isSelected ? '2px solid #2563eb' : '1px solid #e5e7eb',
        background: isSelected ? '#f0f9ff' : '#fafafa',
        transition: 'all 0.2s ease'
      }}>
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: 8
        }}>
          {/* Main node info row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button 
              onClick={() => selectNodeWithAutoAssociation(node)} 
              style={{ 
                background: 'transparent', 
                border: 'none', 
                padding: '4px 0', 
                margin: 0, 
                cursor: 'pointer',
                fontSize: 16,
                fontWeight: 600,
                color: isSelected ? '#1d4ed8' : '#374151'
              }}
            >
              {node.name}
            </button>
            
            <span style={{ 
              fontSize: 12, 
              color: '#6b7280',
              textTransform: 'uppercase',
              fontWeight: 500,
              letterSpacing: '0.05em'
            }}>
              {node.type}
            </span>
            
            <span
              style={{
                fontSize: 11,
                padding: '4px 8px',
                borderRadius: 12,
                fontWeight: 500,
                background: variant === 'success' ? '#dcfce7' : 
                           variant === 'warning' ? '#fef3c7' : 
                           variant === 'destructive' ? '#fee2e2' : '#f3f4f6',
                color: variant === 'success' ? '#166534' : 
                       variant === 'warning' ? '#92400e' : 
                       variant === 'destructive' ? '#b91c1c' : '#374151',
                border: '1px solid ' + (variant === 'success' ? '#bbf7d0' : 
                        variant === 'warning' ? '#fde68a' : 
                        variant === 'destructive' ? '#fecaca' : '#e5e7eb')
              }}
            >
              {badge}
            </span>
          </div>

          {/* Data availability indicators */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: 16, 
            fontSize: 12, 
            color: '#6b7280' 
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                background: nodeHasPlatform(node) ? '#10b981' : '#ef4444'
              }}></span>
              Platform {nodeHasPlatform(node) ? '✓' : '✗'}
            </span>
            
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ 
                width: 6, 
                height: 6, 
                borderRadius: '50%', 
                background: nodeHasResources(node) ? '#10b981' : '#ef4444'
              }}></span>
              Resources {nodeHasResources(node) ? '✓' : '✗'}
            </span>
            
            {node.metadata?.grouping && typeof node.metadata?.count === 'number' && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  background: '#3b82f6'
                }}></span>
                Devices: {node.metadata.count}
              </span>
            )}
            
            {node.metadata?.grouping && typeof node.metadata?.alarms === 'number' && node.metadata.alarms > 0 && (
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ 
                  width: 6, 
                  height: 6, 
                  borderRadius: '50%', 
                  background: '#f59e0b'
                }}></span>
                Alarms: {node.metadata.alarms}
              </span>
            )}
          </div>

          {/* Upload buttons with visual feedback */}
          {onRequestUpload && (
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              flexWrap: 'wrap', 
              marginTop: 8
            }}>
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Platform upload clicked for node:', node.name);
                  
                  // Visual feedback - temporarily change button text
                  const button = e.target as HTMLButtonElement;
                  const originalText = button.innerHTML;
                  button.innerHTML = nodeHasPlatform(node) ? '⏳ Opening...' : '📁 Opening...';
                  button.disabled = true;
                  
                  // Restore button after timeout
                  setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                  }, 2000);
                  
                  onRequestUpload?.(node, 'platform');
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: nodeHasPlatform(node) ? '2px solid #10b981' : '2px solid #d1d5db',
                  borderRadius: 8,
                  background: nodeHasPlatform(node) ? '#dcfce7' : '#ffffff',
                  color: nodeHasPlatform(node) ? '#065f46' : '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                onMouseOver={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'translateY(-1px)';
                  target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  if (!nodeHasPlatform(node)) {
                    target.style.background = '#f9fafb';
                    target.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseOut={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'translateY(0)';
                  target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                  if (!nodeHasPlatform(node)) {
                    target.style.background = '#ffffff';
                    target.style.borderColor = '#d1d5db';
                  }
                }}
              >
                {nodeHasPlatform(node) ? '✅' : '📊'} Platform
                {nodeHasPlatform(node) && <span style={{ fontSize: 10, opacity: 0.7 }}>(.txt)</span>}
              </button>
              
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Resource upload clicked for node:', node.name);
                  
                  // Visual feedback - temporarily change button text
                  const button = e.target as HTMLButtonElement;
                  const originalText = button.innerHTML;
                  button.innerHTML = nodeHasResources(node) ? '⏳ Opening...' : '📁 Opening...';
                  button.disabled = true;
                  
                  // Restore button after timeout
                  setTimeout(() => {
                    button.innerHTML = originalText;
                    button.disabled = false;
                  }, 2000);
                  
                  onRequestUpload?.(node, 'resource');
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: nodeHasResources(node) ? '2px solid #10b981' : '2px solid #d1d5db',
                  borderRadius: 8,
                  background: nodeHasResources(node) ? '#dcfce7' : '#ffffff',
                  color: nodeHasResources(node) ? '#065f46' : '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                onMouseOver={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'translateY(-1px)';
                  target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  if (!nodeHasResources(node)) {
                    target.style.background = '#f9fafb';
                    target.style.borderColor = '#9ca3af';
                  }
                }}
                onMouseOut={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'translateY(0)';
                  target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                  if (!nodeHasResources(node)) {
                    target.style.background = '#ffffff';
                    target.style.borderColor = '#d1d5db';
                  }
                }}
              >
                {nodeHasResources(node) ? '✅' : '📈'} Resources
                {nodeHasResources(node) && <span style={{ fontSize: 10, opacity: 0.7 }}>(.csv)</span>}
              </button>
              
              <button 
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  console.log('Driver upload clicked for node:', node.name);
                  
                  // Visual feedback - temporarily change button text
                  const button = e.target as HTMLButtonElement;
                  const originalText = button.innerHTML;
                  button.innerHTML = '📁 Opening...';
                  button.disabled = true;
                  
                  try {
                    onRequestUpload(node, 'driver');
                    
                    // Add debug log to track if we get here
                    console.log('Driver upload request completed for node:', node.name);
                  } catch (error) {
                    console.error('Error in driver upload:', error);
                  }
                  
                  // Restore button after timeout
                  setTimeout(() => {
                    console.log('Re-enabling driver upload button');
                    button.innerHTML = originalText;
                    button.disabled = false;
                  }, 2000);
                }}
                style={{
                  padding: '8px 16px',
                  fontSize: 12,
                  fontWeight: 600,
                  border: '2px solid #d1d5db',
                  borderRadius: 8,
                  background: '#ffffff',
                  color: '#374151',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)'
                }}
                onMouseOver={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'translateY(-1px)';
                  target.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
                  target.style.background = '#f9fafb';
                  target.style.borderColor = '#9ca3af';
                }}
                onMouseOut={(e) => {
                  const target = e.target as HTMLButtonElement;
                  target.style.transform = 'translateY(0)';
                  target.style.boxShadow = '0 1px 2px 0 rgba(0, 0, 0, 0.05)';
                  target.style.background = '#ffffff';
                  target.style.borderColor = '#d1d5db';
                }}
              >
                🔌 Drivers
                <span style={{ fontSize: 10, opacity: 0.7 }}>(.csv)</span>
              </button>
            </div>
          )}
        </div>
        
        {/* Child container */}
        {node.children && node.children.length > 0 && (
          <div style={{ marginTop: 12 }}>
            <ul style={{ listStyle: 'none', paddingLeft: 0, margin: 0 }}>
              {node.children.map(child => renderNode(child, depth + 1))}
            </ul>
          </div>
        )}
      </li>
    );
  };

  // Node details: collect associated datasets for selected node
  const getAssociatedDatasets = (node: NetworkNode) => {
    return getNodeDatasets(node.id, datasets);
  };

  const autoAssociate = (node: NetworkNode) => {
    // Heuristic: map first matching platform or resource dataset to the node if not already mapped
    const currentMappings = { ...associations };
    const needPlatform = !Object.values(currentMappings).includes(node.id);

    // Scan datasets for potential matches
    datasets.forEach(ds => {
      if (currentMappings[ds.id]) return; // Already mapped
      const fn = ds.filename.toLowerCase();
      const nodeName = node.name.toLowerCase();
      const isPlatform = ds.format === 'PlatformDetails';
      const isResource = ds.format === 'ResourceExport';

      if (isPlatform || isResource) {
        if ((node.type === 'supervisor' && fn.includes('supervisor')) || fn.includes(nodeName)) {
          // Use the proper setAssociation method from the hook
          setAssociation(ds.id, node.id);
        }
      }
    });
  };

  const renderDatasetPreview = (ds: TridiumDataset) => {
    const headers = ds.columns?.map(c => c.label) || (ds.rows[0] ? Object.keys(ds.rows[0].data) : []);
    const firstCols = headers.slice(0, 4);
    const previewRows = ds.rows.slice(0, 5);
    return (
      <div style={{ overflowX: 'auto' }}>
        <div style={{ fontSize: 12, color: '#555', marginBottom: 6 }}>Rows: {ds.rows.length} • Columns: {headers.length}</div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              {firstCols.map(h => (
                <th key={h} style={{ textAlign: 'left', borderBottom: '1px solid #eee', padding: '4px 6px' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {previewRows.map((r, idx) => (
              <tr key={r.id || idx}>
                {firstCols.map((h) => (
                  <td key={h} style={{ padding: '4px 6px', borderBottom: '1px solid #f5f5f5' }}>{String(r.data[h] ?? '')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Site Hierarchy Tree */}
      <div className="site-tree-container">
        <div className="flex items-center justify-between mb-4">
          <h3 style={{ 
            margin: '0', 
            fontSize: '20px', 
            fontWeight: '600', 
            color: '#111827' 
          }}>Site Hierarchy</h3>
          <div className="text-xs text-muted-foreground">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>
        <div className="border rounded-lg p-4 bg-background">
          <ul style={{ listStyle: 'none', paddingLeft: 0 }}>
            {renderNode(topology.rootNode)}
          </ul>
        </div>
      </div>

      {/* Device Details Panel */}
      <div className="device-details-container min-h-[600px]">
        <DeviceDetailsPanel node={selectedNode} />
      </div>
    </div>
  );
};

