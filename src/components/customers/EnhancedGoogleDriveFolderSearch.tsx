import React, { useState, useEffect, useRef } from 'react';
import { 
  Search, Folder, FolderOpen, Plus, ExternalLink, Loader2, CheckCircle, X, 
  AlertCircle, Eye, Clock, Star, Archive, FileText, Camera, Wrench, BarChart3, Mail 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { EnhancedGoogleDriveService } from '@/services/enhancedGoogleDriveService';

interface CustomerFolderMatch {
  folderId: string;
  folderName: string;
  folderPath: string;
  webViewLink: string;
  matchScore: number;
  matchType: 'exact' | 'fuzzy' | 'contains' | 'alias' | 'partial';
  confidence: 'high' | 'medium' | 'low';
  parentFolder: string;
  parentFolderType: string;
  yearFolder?: string;
  fileCount?: number;
  lastModified?: string;
  createdDate?: string;
}

interface ProjectFolderStructure {
  mainFolderId: string;
  mainFolderUrl: string;
  subfolders: {
    backups: { id: string; url: string };
    projectDocs: { id: string; url: string };
    sitePhotos: { id: string; url: string };
    maintenance: { id: string; url: string };
    reports: { id: string; url: string };
    correspondence: { id: string; url: string };
  };
}

interface CustomerSearchResult {
  existingFolders: CustomerFolderMatch[];
  recommendedActions: {
    action: 'use_existing' | 'create_new' | 'link_multiple';
    primaryFolder?: CustomerFolderMatch;
    alternativeFolders?: CustomerFolderMatch[];
    reason: string;
  };
  searchDuration: number;
  totalFoldersScanned: number;
}

interface EnhancedGoogleDriveFolderSearchProps {
  customerData: {
    company_name: string;
    site_address?: string;
    customer_id?: string;
    service_tier?: string;
    contact_name?: string;
    phone?: string;
  };
  onFolderSelected: (folderId: string, folderUrl: string, folderStructure?: ProjectFolderStructure) => void;
  onFolderStructureCreated?: (structure: ProjectFolderStructure) => void;
  initialFolderId?: string;
  initialFolderUrl?: string;
  disabled?: boolean;
}

export const EnhancedGoogleDriveFolderSearch: React.FC<EnhancedGoogleDriveFolderSearchProps> = ({
  customerData,
  onFolderSelected,
  onFolderStructureCreated,
  initialFolderId = '',
  initialFolderUrl = '',
  disabled = false
}) => {
  const [isSearching, setIsSearching] = useState(false);
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);
  const [searchResults, setSearchResults] = useState<CustomerSearchResult | null>(null);
  const [selectedFolder, setSelectedFolder] = useState<CustomerFolderMatch | null>(null);
  const [selectedStructure, setSelectedStructure] = useState<ProjectFolderStructure | null>(null);
  const [activeTab, setActiveTab] = useState<'search' | 'create' | 'structure'>('search');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'connected' | 'disconnected'>('unknown');
  
  const { toast } = useToast();

  // Initialize with existing folder data
  useEffect(() => {
    if (initialFolderId && initialFolderUrl && customerData?.company_name) {
      setSelectedFolder({
        folderId: initialFolderId,
        folderName: `${customerData.company_name} Project Folder`,
        folderPath: '',
        webViewLink: initialFolderUrl,
        matchScore: 1.0,
        matchType: 'exact',
        confidence: 'high',
        parentFolder: '',
        parentFolderType: 'EXISTING'
      });
      setActiveTab('structure');
    }
  }, [initialFolderId, initialFolderUrl, customerData]);

  // Auto-search when component loads
  useEffect(() => {
    if (customerData?.company_name && !selectedFolder) {
      handleAutoSearch();
    }
  }, [customerData?.company_name]);

  const handleSearch = async (isManualSearch = false) => {
    if (!customerData?.company_name || isSearching) return;

    try {
      setIsSearching(true);
      console.log(`🔍 ${isManualSearch ? 'Manual' : 'Auto'}-searching folders for: ${customerData.company_name}`);
      
      const results = await EnhancedGoogleDriveService.searchExistingCustomerFolders(
        customerData.company_name,
        customerData.site_address
      );
      
      setSearchResults(results);
      setActiveTab('search'); // Always show search results when searching
      
      // Show notification about search results
      if (results.existingFolders.length > 0) {
        const highConfidenceCount = results.existingFolders.filter(f => f.confidence === 'high').length;
        toast({
          title: 'Folder Search Complete',
          description: `Found ${results.existingFolders.length} potential matches (${highConfidenceCount} high confidence) in ${results.searchDuration}ms`,
        });
      } else {
        // Check if this was due to Edge Function issues
        if (results.searchDuration < 500 && results.totalFoldersScanned === 0) {
          toast({
            title: 'Search Service Temporarily Unavailable',
            description: 'Google Drive search functions are currently offline. You can still create new project folders.',
            variant: 'default'
          });
        } else {
          toast({
            title: 'No Existing Folders Found',
            description: 'No matching folders found. You can create a new structured project folder.',
          });
        }
      }
      
    } catch (error) {
      console.error('Search failed:', error);
      
      // Provide user-friendly error messages based on the error type
      let errorTitle = 'Search Error';
      let errorDescription = 'An unexpected error occurred while searching for folders.';
      
      if (error.message && error.message.includes('Edge Function')) {
        errorTitle = 'Search Service Temporarily Unavailable';
        errorDescription = 'The Google Drive search service is currently offline. You can still create new project folders, and search will be available when the service is restored.';
      } else if (error.message && error.message.includes('FunctionsFetchError')) {
        errorTitle = 'Connection Issue';
        errorDescription = 'Unable to connect to the search service. Please check your internet connection and try again.';
      } else if (error.message) {
        errorDescription = `Search failed: ${error.message}`;
      }
      
      toast({
        title: errorTitle,
        description: errorDescription,
        variant: error.message && error.message.includes('Edge Function') ? 'default' : 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleAutoSearch = () => handleSearch(false);
  const handleManualSearch = () => handleSearch(true);

  const handleFolderSelect = (folder: CustomerFolderMatch) => {
    setSelectedFolder(folder);
    setActiveTab('structure');
    onFolderSelected(folder.folderId, folder.webViewLink);
    
    toast({
      title: 'Folder Selected',
      description: `Linked to "${folder.folderName}" (${folder.confidence} confidence match).`,
    });
  };

  const handleCreateStructuredFolder = async () => {
    if (!customerData?.company_name || disabled || isCreatingFolder) return;

    try {
      setIsCreatingFolder(true);
      
      const folderStructure = await EnhancedGoogleDriveService.createStructuredProjectFolder(
        customerData.company_name,
        customerData
      );
      
      setSelectedStructure(folderStructure);
      setSelectedFolder({
        folderId: folderStructure.mainFolderId,
        folderName: `${customerData.company_name} - ${new Date().getFullYear()}`,
        folderPath: '',
        webViewLink: folderStructure.mainFolderUrl,
        matchScore: 1.0,
        matchType: 'exact',
        confidence: 'high',
        parentFolder: '',
        parentFolderType: 'CREATED'
      });
      
      setActiveTab('structure');
      onFolderSelected(folderStructure.mainFolderId, folderStructure.mainFolderUrl, folderStructure);
      
      if (onFolderStructureCreated) {
        onFolderStructureCreated(folderStructure);
      }

      toast({
        title: 'Project Folder Created',
        description: `Successfully created structured project folder for ${customerData.company_name}.`,
      });
      
    } catch (error) {
      console.error('Error creating structured folder:', error);
      toast({
        title: 'Creation Failed',
        description: `Failed to create project folder: ${error.message}`,
        variant: 'destructive'
      });
    } finally {
      setIsCreatingFolder(false);
    }
  };

  const clearSelection = () => {
    setSelectedFolder(null);
    setSelectedStructure(null);
    setActiveTab('search');
    onFolderSelected('', '');
  };

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getFolderTypeIcon = (folderType: string) => {
    switch (folderType) {
      case 'SITE_BACKUPS': return <Archive className="w-4 h-4" />;
      case 'SERVICE_MAINTENANCE': return <Wrench className="w-4 h-4" />;
      case 'ENGINEERING_2025':
      case 'ENGINEERING_2024':
      case 'ENGINEERING_2023': return <FileText className="w-4 h-4" />;
      default: return <Folder className="w-4 h-4" />;
    }
  };

  const renderSearchResults = () => {
    if (!searchResults) return null;

    const { existingFolders, recommendedActions, searchDuration, totalFoldersScanned } = searchResults;

    return (
      <div className="space-y-4">
        {/* Search Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 text-blue-700">
                <CheckCircle className="w-4 h-4" />
                <span className="font-medium">Search Complete</span>
              </div>
              <span className="text-gray-600">Scanned {totalFoldersScanned} folders in {searchDuration}ms</span>
            </div>
            <div className="text-blue-800 font-medium">
              {existingFolders.length} potential matches found
            </div>
          </div>
        </div>

        {/* Recommendations */}
        {recommendedActions && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Star className="w-5 h-5 text-blue-600" />
                <CardTitle className="text-lg">Recommendation</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700 mb-3">{recommendedActions.reason}</p>
              
              {recommendedActions.primaryFolder && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Primary Recommendation:</Label>
                  <div 
                    className="p-3 border rounded-lg cursor-pointer hover:bg-white transition-colors"
                    onClick={() => handleFolderSelect(recommendedActions.primaryFolder!)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getFolderTypeIcon(recommendedActions.primaryFolder.parentFolderType)}
                        <div>
                          <div className="font-medium">{recommendedActions.primaryFolder.folderName}</div>
                          <div className="text-xs text-gray-500">
                            {recommendedActions.primaryFolder.parentFolderType} • Score: {Math.round(recommendedActions.primaryFolder.matchScore * 100)}%
                          </div>
                        </div>
                      </div>
                      <Badge className={getConfidenceBadgeColor(recommendedActions.primaryFolder.confidence)}>
                        {recommendedActions.primaryFolder.confidence}
                      </Badge>
                    </div>
                  </div>
                </div>
              )}
              
              {recommendedActions.alternativeFolders && recommendedActions.alternativeFolders.length > 0 && (
                <div className="mt-4">
                  <Label className="text-sm font-medium mb-2 block">Alternative Options:</Label>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {recommendedActions.alternativeFolders.map((folder, index) => (
                      <div 
                        key={folder.folderId}
                        className="p-2 border rounded cursor-pointer hover:bg-white transition-colors text-sm"
                        onClick={() => handleFolderSelect(folder)}
                      >
                        <div className="flex items-center justify-between">
                          <span className="truncate">{folder.folderName}</span>
                          <Badge size="sm" className={getConfidenceBadgeColor(folder.confidence)}>
                            {folder.confidence}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* All Results */}
        {existingFolders.length > 0 ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">All Discovered Folders ({existingFolders.length}):</Label>
              <div className="text-xs text-gray-500">
                Click any folder to select and link it to this customer
              </div>
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {existingFolders.map((folder, index) => (
                <div 
                  key={folder.folderId}
                  className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 hover:border-blue-300 transition-all group"
                  onClick={() => handleFolderSelect(folder)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="text-sm text-gray-400 font-mono w-6">{index + 1}</div>
                      {getFolderTypeIcon(folder.parentFolderType)}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate group-hover:text-blue-700">{folder.folderName}</div>
                        <div className="text-xs text-gray-500 flex items-center gap-2 mt-1">
                          <span className="font-medium">{folder.parentFolderType.replace('_', ' ')}</span>
                          <span>•</span>
                          <span className="font-medium text-green-600">{Math.round(folder.matchScore * 100)}% match</span>
                          {folder.lastModified && (
                            <>
                              <span>•</span>
                              <span>Modified: {new Date(folder.lastModified).toLocaleDateString()}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge className={getConfidenceBadgeColor(folder.confidence)}>
                        {folder.confidence} confidence
                      </Badge>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(folder.webViewLink, '_blank');
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : searchResults && (
          <div className="text-center py-8 text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <h3 className="font-medium text-gray-900 mb-2">No Matching Folders Found</h3>
            <p className="text-sm mb-4">We searched all AME Drive locations but couldn't find folders matching "{customerData.company_name}".</p>
            <div className="flex justify-center gap-3">
              <Button variant="outline" size="sm" onClick={handleManualSearch}>
                <Search className="w-4 h-4 mr-2" />
                Search Again
              </Button>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setActiveTab('create')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create New Folder
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCreateSection = () => {
    return (
      <div className="space-y-4">
        <div className="text-center py-6">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Create New Project Folder
          </h3>
          <p className="text-gray-600 mb-6">
            Create a professionally structured project folder for <strong>{customerData.company_name}</strong> 
            with organized subfolders for all your project needs.
          </p>
          
          <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
            <div className="flex items-center gap-2 text-gray-700">
              <Archive className="w-4 h-4 text-blue-500" />
              <span>Site Backups</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <FileText className="w-4 h-4 text-green-500" />
              <span>Project Docs</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Camera className="w-4 h-4 text-purple-500" />
              <span>Site Photos</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Wrench className="w-4 h-4 text-orange-500" />
              <span>Maintenance</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <BarChart3 className="w-4 h-4 text-red-500" />
              <span>Reports</span>
            </div>
            <div className="flex items-center gap-2 text-gray-700">
              <Mail className="w-4 h-4 text-indigo-500" />
              <span>Correspondence</span>
            </div>
          </div>
          
          <Button
            onClick={handleCreateStructuredFolder}
            disabled={isCreatingFolder || disabled}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isCreatingFolder ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Creating Folder Structure...
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 mr-2" />
                Create Project Folder
              </>
            )}
          </Button>
        </div>
      </div>
    );
  };

  const renderFolderStructure = () => {
    if (!selectedFolder && !selectedStructure) return null;

    return (
      <div className="space-y-4">
        {/* Main Folder Display */}
        <Card className="border-green-200 bg-green-50">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-6 h-6 text-green-600" />
                <div>
                  <div className="font-semibold text-gray-900">{selectedFolder?.folderName}</div>
                  <div className="text-sm text-gray-600">
                    {selectedFolder?.parentFolderType === 'CREATED' 
                      ? 'Newly created structured project folder' 
                      : 'Linked existing Google Drive folder'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <a href={selectedFolder?.webViewLink} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  disabled={disabled}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Folder Structure (if available) */}
        {selectedStructure && (
          <div className="space-y-3">
            <Label className="text-sm font-medium">Project Folder Structure:</Label>
            <div className="grid grid-cols-1 gap-2">
              {Object.entries(selectedStructure.subfolders).map(([key, folder]) => {
                const icons = {
                  backups: <Archive className="w-4 h-4 text-blue-500" />,
                  projectDocs: <FileText className="w-4 h-4 text-green-500" />,
                  sitePhotos: <Camera className="w-4 h-4 text-purple-500" />,
                  maintenance: <Wrench className="w-4 h-4 text-orange-500" />,
                  reports: <BarChart3 className="w-4 h-4 text-red-500" />,
                  correspondence: <Mail className="w-4 h-4 text-indigo-500" />
                };
                
                const names = {
                  backups: 'Site Backups',
                  projectDocs: 'Project Documentation', 
                  sitePhotos: 'Site Photos & Media',
                  maintenance: 'Maintenance Records',
                  reports: 'Reports & Analytics',
                  correspondence: 'Client Correspondence'
                };

                return (
                  <div key={key} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {icons[key as keyof typeof icons]}
                      <span className="text-sm font-medium">{names[key as keyof typeof names]}</span>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={folder.url} target="_blank" rel="noopener noreferrer">
                        <Eye className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <Label className="flex items-center gap-2">
        <Folder className="w-4 h-4 text-blue-500" />
        Google Drive Project Folder Management
      </Label>

      {/* Loading State */}
      {isSearching && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <div>
                <div className="font-medium">Searching AME Drive Folders...</div>
                <div className="text-sm text-gray-600">Scanning all company folders for potential matches</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Interface */}
      {!isSearching && (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="search" className="flex items-center gap-2">
              <Search className="w-4 h-4" />
              Search Results
              {searchResults?.existingFolders && searchResults.existingFolders.length > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {searchResults.existingFolders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="create" className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Create New
            </TabsTrigger>
            <TabsTrigger value="structure" className="flex items-center gap-2" disabled={!selectedFolder}>
              <FolderOpen className="w-4 h-4" />
              Folder Structure
              {selectedFolder && <CheckCircle className="w-4 h-4 text-green-500" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="mt-4">
            {/* Search Control Bar */}
            <div className="flex items-center justify-between mb-4 p-3 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="text-sm text-gray-700">
                  {customerData?.company_name ? (
                    <span>Searching for: <strong>"{customerData.company_name}"</strong></span>
                  ) : (
                    <span className="text-gray-500">Enter a company name to search</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleManualSearch}
                  disabled={!customerData?.company_name || isSearching}
                >
                  {isSearching ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="w-4 h-4 mr-2" />
                      {searchResults ? 'Search Again' : 'Search Folders'}
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* Search Results Content */}
            {searchResults ? renderSearchResults() : (
              <div className="text-center py-12 text-gray-500">
                <Search className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Ready to Search</h3>
                <p className="mb-4">Click "Search Folders" above to find existing project folders for this customer.</p>
                <p className="text-sm text-gray-400 mb-4">We'll search across all your AME Drive locations automatically.</p>
                
                {/* Service Status Indicator */}
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 border border-amber-200 rounded-full text-sm text-amber-700">
                  <AlertCircle className="w-4 h-4" />
                  <span>Search service may be temporarily limited</span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="create" className="mt-4">
            {renderCreateSection()}
          </TabsContent>

          <TabsContent value="structure" className="mt-4">
            {selectedFolder ? renderFolderStructure() : (
              <div className="text-center py-8 text-gray-500">
                <FolderOpen className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <p>Select an existing folder or create a new one to view the folder structure.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};
