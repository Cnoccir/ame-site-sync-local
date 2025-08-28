import React, { useState, useEffect, useRef } from 'react';
import { Search, Folder, FolderOpen, Plus, ExternalLink, Loader2, CheckCircle, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { GoogleDriveFolderService } from '@/services/googleDriveFolderService';

interface DriveFolder {
  id: string;
  name: string;
  webViewLink: string;
  createdTime: string;
  modifiedTime: string;
  parentId?: string;
  description?: string;
}

interface GoogleDriveFolderSearchProps {
  customerData: any;
  onFolderSelected: (folderId: string, folderUrl: string) => void;
  initialFolderId?: string;
  initialFolderUrl?: string;
  disabled?: boolean;
}

export const GoogleDriveFolderSearch: React.FC<GoogleDriveFolderSearchProps> = ({
  customerData,
  onFolderSelected,
  initialFolderId = '',
  initialFolderUrl = '',
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [folders, setFolders] = useState<DriveFolder[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [showFolders, setShowFolders] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<DriveFolder | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize with existing folder data
  useEffect(() => {
    if (initialFolderId && initialFolderUrl && customerData?.company_name) {
      setSelectedFolder({
        id: initialFolderId,
        name: `${customerData.company_name} Project Folder`,
        webViewLink: initialFolderUrl,
        createdTime: '',
        modifiedTime: ''
      });
    }
  }, [initialFolderId, initialFolderUrl, customerData]);

  // Test Google Drive connection on mount
  useEffect(() => {
    testConnection();
  }, []);

  // Handle clicks outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowFolders(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle search as user types
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        searchFolders(searchQuery.trim());
      } else {
        setFolders([]);
        setShowFolders(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  const testConnection = async () => {
    try {
      const isConnected = await GoogleDriveFolderService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'disconnected');
    } catch (error) {
      setConnectionStatus('disconnected');
    }
  };

  const searchFolders = async (query: string) => {
    if (disabled || connectionStatus !== 'connected') return;

    try {
      setIsSearching(true);
      // This would call the actual Google Drive API to search folders
      // For now, we'll simulate with project folders list
      const projectFolders = await GoogleDriveFolderService.listProjectFolders();
      
      // Filter folders based on search query
      const filteredFolders = projectFolders
        .filter(folder => 
          folder.name.toLowerCase().includes(query.toLowerCase()) ||
          (folder.description && folder.description.toLowerCase().includes(query.toLowerCase()))
        )
        .map(folder => ({
          id: folder.id,
          name: folder.name,
          webViewLink: folder.webViewLink || `https://drive.google.com/drive/folders/${folder.id}`,
          createdTime: folder.createdTime || '',
          modifiedTime: folder.modifiedTime || '',
          description: folder.description
        }));

      setFolders(filteredFolders);
      setShowFolders(filteredFolders.length > 0);
    } catch (error) {
      console.error('Error searching folders:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search Google Drive folders. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleFolderSelect = (folder: DriveFolder) => {
    setSelectedFolder(folder);
    setSearchQuery(folder.name);
    setShowFolders(false);
    onFolderSelected(folder.id, folder.webViewLink);
    
    toast({
      title: 'Folder Selected',
      description: `Linked to "${folder.name}" in Google Drive.`,
    });
  };

  const handleCreateProjectFolder = async () => {
    if (!customerData?.company_name || disabled) return;

    try {
      setIsCreatingFolder(true);
      
      const folderInfo = await GoogleDriveFolderService.createProjectFolder({
        company_name: customerData.company_name,
        customer_id: customerData.customer_id || 'NEW',
        site_address: customerData.site_address || '',
        service_tier: customerData.service_tier || 'CORE'
      });

      const newFolder: DriveFolder = {
        id: folderInfo.folderId,
        name: `${customerData.company_name} Project Folder`,
        webViewLink: folderInfo.folderUrl,
        createdTime: new Date().toISOString(),
        modifiedTime: new Date().toISOString(),
        description: 'Auto-created project folder'
      };

      setSelectedFolder(newFolder);
      setSearchQuery(newFolder.name);
      onFolderSelected(newFolder.id, newFolder.webViewLink);

      toast({
        title: 'Folder Created',
        description: `Created and linked new project folder for ${customerData.company_name}.`,
      });
    } catch (error) {
      console.error('Error creating project folder:', error);
      toast({
        title: 'Creation Failed',
        description: 'Failed to create project folder. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const clearSelection = () => {
    setSelectedFolder(null);
    setSearchQuery('');
    onFolderSelected('', '');
  };

  if (connectionStatus === 'disconnected') {
    return (
      <div className="space-y-4">
        <Label className="flex items-center gap-2">
          <Folder className="w-4 h-4 text-gray-400" />
          Google Drive Integration
        </Label>
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <h4 className="font-semibold text-gray-900 mb-1">Google Drive Not Connected</h4>
                <p className="text-sm text-gray-600">
                  Google Drive integration is not configured. Contact your administrator to set up 
                  Google Drive access for automatic project folder creation.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <Label className="flex items-center gap-2">
        <Folder className="w-4 h-4 text-blue-500" />
        Google Drive Project Folder
      </Label>

      {/* Selected Folder Display */}
      {selectedFolder && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                <div>
                  <div className="font-medium text-gray-900">{selectedFolder.name}</div>
                  <div className="text-sm text-gray-600">Linked Google Drive folder</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="text-blue-600 hover:text-blue-700"
                >
                  <a href={selectedFolder.webViewLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-gray-500 hover:text-gray-700"
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search and Create Interface */}
      {!selectedFolder && (
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative" ref={searchRef}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={inputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search existing folders..."
                className="pl-10 pr-10"
                disabled={disabled}
              />
              {isSearching && (
                <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
              )}
            </div>
            
            {/* Folder Suggestions Dropdown */}
            {showFolders && folders.length > 0 && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
                {folders.map((folder) => (
                  <div
                    key={folder.id}
                    className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                    onClick={() => handleFolderSelect(folder)}
                  >
                    <div className="flex items-center gap-3">
                      <Folder className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-gray-900 truncate">{folder.name}</div>
                        {folder.description && (
                          <div className="text-sm text-gray-600 truncate">{folder.description}</div>
                        )}
                        <div className="text-xs text-gray-500">
                          Created {new Date(folder.createdTime).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Create New Folder Option */}
          {customerData?.company_name && (
            <div className="flex items-center justify-between p-3 border border-dashed border-gray-300 rounded-lg">
              <div className="flex items-center gap-3">
                <Plus className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="font-medium text-gray-900">Create Project Folder</div>
                  <div className="text-sm text-gray-600">
                    Create a new organized folder structure for "{customerData.company_name}"
                  </div>
                </div>
              </div>
              <Button
                onClick={handleCreateProjectFolder}
                disabled={isCreatingFolder || disabled}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isCreatingFolder ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Folder
                  </>
                )}
              </Button>
            </div>
          )}

          {/* No Results */}
          {searchQuery.length >= 2 && !isSearching && folders.length === 0 && (
            <div className="text-center py-4 text-gray-600">
              <Folder className="w-8 h-8 text-gray-400 mx-auto mb-2" />
              <div className="text-sm">No folders found matching "{searchQuery}"</div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
