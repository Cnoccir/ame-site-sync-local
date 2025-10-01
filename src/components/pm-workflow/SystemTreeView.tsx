// SystemTreeView component - renders the hierarchical tree structure
import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronRight,
  ChevronDown,
  Plus,
  X,
  Upload,
  AlertCircle,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

// Use the global TreeNode type from TridiumSystemTreeWizard

interface SystemTreeViewProps {
  nodes: TreeNode[];
  selectedNodeId: string;
  onNodeSelect: (nodeId: string) => void;
  onNodeToggle: (nodeId: string) => void;
  onFileUpload: (files: FileList | File[], targetNodeId?: string) => void;
  onRemoveFile: (nodeId: string, fileIndex: number) => void;
  processing: boolean;
}

export const SystemTreeView: React.FC<SystemTreeViewProps> = ({
  nodes,
  selectedNodeId,
  onNodeSelect,
  onNodeToggle,
  onFileUpload,
  onRemoveFile,
  processing
}) => {
  
  const getNodeStatusIcon = (status: TreeNode['status']) => {
    switch (status) {
      case 'processed':
        return <CheckCircle2 className="h-3 w-3 text-green-600" />;
      case 'uploaded':
      case 'uploading':
        return <RefreshCw className="h-3 w-3 text-blue-600 animate-spin" />;
      case 'error':
        return <AlertCircle className="h-3 w-3 text-red-600" />;
      case 'empty':
      default:
        return null;
    }
  };

  const getNodeStatusColor = (status: TreeNode['status'], isSelected: boolean) => {
    if (isSelected) {
      return 'bg-blue-100 border-blue-300';
    }
    
    switch (status) {
      case 'processed':
        return 'bg-green-50 border-green-200 hover:bg-green-100';
      case 'uploaded':
      case 'uploading':
        return 'bg-blue-50 border-blue-200 hover:bg-blue-100';
      case 'error':
        return 'bg-red-50 border-red-200 hover:bg-red-100';
      case 'empty':
      default:
        return 'hover:bg-gray-50 border-gray-200';
    }
  };

  const renderTreeNode = (node: TreeNode) => {
    const hasChildren = nodes.some(n => n.parentId === node.id);
    const children = nodes.filter(n => n.parentId === node.id);
    const isSelected = node.id === selectedNodeId;
    
    return (
      <div key={node.id} className={`ml-${node.level * 4}`}>
        {/* Node Header */}
        <div 
          className={`
            flex items-center gap-2 p-2 border rounded cursor-pointer transition-colors
            ${getNodeStatusColor(node.status, isSelected)}
          `}
          onClick={() => onNodeSelect(node.id)}
        >
          {/* Expand/Collapse Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onNodeToggle(node.id);
            }}
            className="p-1 hover:bg-gray-200 rounded flex-shrink-0"
          >
            {hasChildren ? (
              node.isExpanded ? (
                <ChevronDown className="h-3 w-3" />
              ) : (
                <ChevronRight className="h-3 w-3" />
              )
            ) : (
              <div className="w-3 h-3" />
            )}
          </button>

          {/* Node Icon */}
          <div className="flex-shrink-0">
            {node.icon}
          </div>

          {/* Node Name */}
          <div className="flex-1 min-w-0">
            <div className="font-medium text-sm truncate">
              {node.name}
            </div>
            
            {/* File Count */}
            {node.uploadedFiles.length > 0 && (
              <div className="text-xs text-muted-foreground">
                {node.uploadedFiles.length} file{node.uploadedFiles.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>

          {/* Status Icon */}
          <div className="flex-shrink-0">
            {getNodeStatusIcon(node.status)}
          </div>

          {/* Upload Button for Empty Nodes */}
          {node.status === 'empty' && node.acceptedFiles && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 flex-shrink-0"
              onClick={(e) => {
                e.stopPropagation();
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = '.csv,.txt';
                input.onchange = (event) => {
                  const target = event.target as HTMLInputElement;
                  if (target.files) {
                    onFileUpload(target.files, node.id);
                  }
                };
                input.click();
              }}
            >
              <Plus className="h-3 w-3" />
            </Button>
          )}
        </div>

        {/* Expanded Content */}
        {node.isExpanded && (
          <div className="mt-2 ml-6 space-y-2">
            {/* Node Description */}
            {node.metadata?.description && (
              <div className="text-xs text-muted-foreground px-2">
                {node.metadata.description}
              </div>
            )}

            {/* Uploaded Files List */}
            {node.uploadedFiles.map((file, fileIndex) => (
              <div key={fileIndex} className="flex items-center gap-2 p-2 bg-gray-50 rounded border text-xs">
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate" title={file.file.name}>
                    {file.file.name}
                  </div>
                  <div className="text-muted-foreground">
                    {(file.file.size / 1024).toFixed(1)} KB • {file.category}
                  </div>
                  {file.error && (
                    <div className="text-red-600 text-xs mt-1">
                      Error: {file.error}
                    </div>
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  {getNodeStatusIcon(file.status)}
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-gray-500 hover:text-red-600"
                  onClick={() => onRemoveFile(node.id, fileIndex)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}

            {/* Drop Zone for Node */}
            <div
              className="border-2 border-dashed border-gray-300 rounded p-3 text-center hover:bg-gray-100 cursor-pointer transition-colors"
              onDrop={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onFileUpload(e.dataTransfer.files, node.id);
              }}
              onDragOver={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              onClick={() => {
                const input = document.createElement('input');
                input.type = 'file';
                input.multiple = true;
                input.accept = '.csv,.txt';
                input.onchange = (event) => {
                  const target = event.target as HTMLInputElement;
                  if (target.files) {
                    onFileUpload(target.files, node.id);
                  }
                };
                input.click();
              }}
            >
              <Upload className="h-4 w-4 mx-auto mb-1 text-gray-400" />
              <div className="text-xs text-muted-foreground">
                Drop files here or click to upload
              </div>
              {node.acceptedFiles && (
                <div className="text-xs text-muted-foreground mt-1">
                  Accepts: {node.acceptedFiles.map(cat => {
                    const type = cat.split('-').pop();
                    return type?.charAt(0).toUpperCase() + type?.slice(1);
                  }).join(', ')}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Render Children */}
        {node.isExpanded && children.map(child => renderTreeNode(child))}
      </div>
    );
  };

  // Get root nodes (nodes with no parent)
  const rootNodes = nodes.filter(node => node.parentId === null);

  return (
    <div className="space-y-2 p-3">
      {rootNodes.map(node => renderTreeNode(node))}
      
      {/* Global Drop Zone */}
      {nodes.length > 0 && (
        <div
          className="border-2 border-dashed border-blue-300 rounded-lg p-4 text-center hover:bg-blue-50 cursor-pointer transition-colors mt-4"
          onDrop={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onFileUpload(e.dataTransfer.files);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          onClick={() => {
            const input = document.createElement('input');
            input.type = 'file';
            input.multiple = true;
            input.accept = '.csv,.txt';
            input.onchange = (event) => {
              const target = event.target as HTMLInputElement;
              if (target.files) {
                onFileUpload(target.files);
              }
            };
            input.click();
          }}
        >
          <Upload className="h-5 w-5 mx-auto mb-2 text-blue-500" />
          <div className="text-sm font-medium text-blue-700">
            Drop any files here
          </div>
          <div className="text-xs text-muted-foreground">
            Files will be auto-assigned to the right nodes
          </div>
        </div>
      )}

      {/* Processing Status */}
      {processing && (
        <div className="flex items-center gap-2 p-2 bg-blue-50 rounded text-sm">
          <RefreshCw className="h-4 w-4 animate-spin text-blue-600" />
          <span>Processing uploads...</span>
        </div>
      )}
    </div>
  );
};

export default SystemTreeView;
