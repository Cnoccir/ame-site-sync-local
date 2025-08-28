import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Progress } from '../ui/progress';
import { Separator } from '../ui/separator';
import { 
  Settings, 
  FolderOpen, 
  TestTube, 
  CheckCircle, 
  XCircle, 
  Loader2,
  Search,
  Eye,
  Trash2,
  Download,
  Upload,
  RefreshCw,
  Activity
} from 'lucide-react';
import { GoogleDriveService, type DriveFolder, type IndexingProgress } from '../../services/googleDriveService';
import { supabase } from '@/integrations/supabase/client';

interface FolderMapping {
  id: string;
  customer_id: string;
  folder_id: string;
  folder_name: string;
  folder_url: string;
  last_indexed?: string;
  is_active: boolean;
  customer_name?: string;
}

interface ConnectivityStatus {
  success: boolean;
  message: string;
  details?: any;
  lastTested?: Date;
}

export function GoogleDriveAdminPanel() {
  const [activeTab, setActiveTab] = useState('config');
  const [connectivity, setConnectivity] = useState<ConnectivityStatus | null>(null);
  const [folderMappings, setFolderMappings] = useState<FolderMapping[]>([]);
  const [indexingProgress, setIndexingProgress] = useState<IndexingProgress[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newFolderData, setNewFolderData] = useState({
    folderId: '',
    folderName: '',
    customerId: ''
  });

  // Load folder mappings on component mount
  useEffect(() => {
    loadFolderMappings();
    loadIndexingProgress();
    
    // Set up interval to refresh indexing progress
    const interval = setInterval(() => {
      loadIndexingProgress();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadFolderMappings = async () => {
    try {
      const { data, error } = await supabase
        .from('customer_drive_folders')
        .select(`
          *,
          customers (
            company_name
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading folder mappings:', error);
        return;
      }

      const mappings = (data || []).map(mapping => ({
        ...mapping,
        customer_name: mapping.customers?.company_name || 'Unknown Customer'
      }));

      setFolderMappings(mappings);
    } catch (error) {
      console.error('Error loading folder mappings:', error);
    }
  };

  const loadIndexingProgress = () => {
    const progress = GoogleDriveService.getAllIndexingProgress();
    setIndexingProgress(progress);
  };

  const testConnectivity = async () => {
    setIsLoading(true);
    try {
      await GoogleDriveService.initializeConfig();
      const result = await GoogleDriveService.testConnectivity();
      setConnectivity({
        ...result,
        lastTested: new Date()
      });
    } catch (error) {
      setConnectivity({
        success: false,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        lastTested: new Date()
      });
    } finally {
      setIsLoading(false);
    }
  };

  const addFolderMapping = async () => {
    if (!newFolderData.folderId || !newFolderData.customerId) {
      alert('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    try {
      await GoogleDriveService.associateFolderWithCustomer(
        newFolderData.customerId,
        newFolderData.folderId,
        newFolderData.folderName || 'Customer Folder'
      );

      setNewFolderData({
        folderId: '',
        folderName: '',
        customerId: ''
      });

      await loadFolderMappings();
    } catch (error) {
      console.error('Error adding folder mapping:', error);
      alert(`Failed to add folder mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const removeFolderMapping = async (mapping: FolderMapping) => {
    if (!confirm(`Are you sure you want to remove the folder mapping for ${mapping.customer_name}?`)) {
      return;
    }

    setIsLoading(true);
    try {
      await supabase
        .from('customer_drive_folders')
        .update({ is_active: false })
        .eq('id', mapping.id);

      await loadFolderMappings();
    } catch (error) {
      console.error('Error removing folder mapping:', error);
      alert(`Failed to remove folder mapping: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const indexFolder = async (mapping: FolderMapping) => {
    try {
      // Start indexing in background
      GoogleDriveService.indexFolder(mapping.folder_id, mapping.folder_name);
      
      // Update last indexed timestamp
      await supabase
        .from('customer_drive_folders')
        .update({ last_indexed: new Date().toISOString() })
        .eq('id', mapping.id);

      await loadFolderMappings();
    } catch (error) {
      console.error('Error starting folder indexing:', error);
      alert(`Failed to start indexing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const ConfigurationPanel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Google Drive API Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <Settings className="h-4 w-4" />
            <AlertDescription>
              Google Drive configuration is managed through Supabase system settings.
              Ensure the following settings are configured:
              <ul className="mt-2 space-y-1 text-sm">
                <li>• <strong>google_drive_api_key</strong> - Your Google Drive API key</li>
                <li>• <strong>google_drive_client_id</strong> - OAuth client ID</li>
                <li>• <strong>google_drive_client_secret</strong> - OAuth client secret</li>
                <li>• <strong>google_drive_refresh_token</strong> - OAuth refresh token</li>
              </ul>
            </AlertDescription>
          </Alert>
          
          <div className="flex items-center gap-4">
            <Button 
              onClick={testConnectivity}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <TestTube className="h-4 w-4" />
              )}
              Test Connectivity
            </Button>
            
            {connectivity && (
              <div className="flex items-center gap-2">
                {connectivity.success ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <XCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={`text-sm ${connectivity.success ? 'text-green-600' : 'text-red-600'}`}>
                  {connectivity.message}
                </span>
                {connectivity.lastTested && (
                  <span className="text-xs text-gray-500">
                    (Tested: {connectivity.lastTested.toLocaleTimeString()})
                  </span>
                )}
              </div>
            )}
          </div>

          {connectivity?.details && (
            <div className="p-3 bg-gray-50 rounded text-sm">
              <strong>Details:</strong>
              <pre className="mt-1 text-xs">{JSON.stringify(connectivity.details, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const FolderManagementPanel = () => (
    <div className="space-y-6">
      {/* Add New Folder Mapping */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            Add Folder Mapping
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="folderId">Google Drive Folder ID *</Label>
              <Input
                id="folderId"
                value={newFolderData.folderId}
                onChange={(e) => setNewFolderData({...newFolderData, folderId: e.target.value})}
                placeholder="1ABc2DEfghI3JKlmnoPQRstuVwxY4Z"
              />
              <p className="text-xs text-gray-500 mt-1">
                Extract from folder URL: drive.google.com/drive/folders/[FOLDER_ID]
              </p>
            </div>
            
            <div>
              <Label htmlFor="folderName">Folder Name</Label>
              <Input
                id="folderName"
                value={newFolderData.folderName}
                onChange={(e) => setNewFolderData({...newFolderData, folderName: e.target.value})}
                placeholder="Customer Project Folder"
              />
            </div>
            
            <div>
              <Label htmlFor="customerId">Customer ID *</Label>
              <Input
                id="customerId"
                value={newFolderData.customerId}
                onChange={(e) => setNewFolderData({...newFolderData, customerId: e.target.value})}
                placeholder="Customer UUID"
              />
            </div>
          </div>
          
          <Button 
            onClick={addFolderMapping}
            disabled={isLoading || !newFolderData.folderId || !newFolderData.customerId}
            className="w-full md:w-auto"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            Add Folder Mapping
          </Button>
        </CardContent>
      </Card>

      {/* Existing Folder Mappings */}
      <Card>
        <CardHeader>
          <CardTitle>Folder Mappings</CardTitle>
        </CardHeader>
        <CardContent>
          {folderMappings.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No folder mappings configured yet.
            </div>
          ) : (
            <div className="space-y-4">
              {folderMappings.map((mapping) => (
                <div key={mapping.id} className="border rounded p-4 space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium">{mapping.customer_name}</h4>
                        <Badge variant={mapping.is_active ? 'default' : 'secondary'}>
                          {mapping.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600">{mapping.folder_name}</p>
                      <p className="text-xs text-gray-400 font-mono">{mapping.folder_id}</p>
                      {mapping.last_indexed && (
                        <p className="text-xs text-green-600">
                          Last indexed: {new Date(mapping.last_indexed).toLocaleString()}
                        </p>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(mapping.folder_url, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => indexFolder(mapping)}
                        disabled={isLoading}
                      >
                        <RefreshCw className="h-3 w-3" />
                      </Button>
                      
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeFolderMapping(mapping)}
                        disabled={isLoading}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  const IndexingStatusPanel = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Indexing Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {indexingProgress.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No active indexing operations.
            </div>
          ) : (
            <div className="space-y-4">
              {indexingProgress.map((progress) => (
                <div key={progress.folderId} className="border rounded p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">{progress.folderName}</h4>
                    <Badge variant={
                      progress.status === 'completed' ? 'default' :
                      progress.status === 'error' ? 'destructive' : 
                      'secondary'
                    }>
                      {progress.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>{progress.processedFiles} / {progress.totalFiles} files</span>
                    </div>
                    
                    <Progress 
                      value={progress.totalFiles > 0 ? (progress.processedFiles / progress.totalFiles) * 100 : 0}
                      className="w-full"
                    />
                    
                    {progress.currentFile && (
                      <p className="text-xs text-gray-600">
                        Current: {progress.currentFile}
                      </p>
                    )}
                    
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Started: {progress.startTime.toLocaleTimeString()}</span>
                      {progress.estimatedCompletion && progress.status === 'indexing' && (
                        <span>ETA: {progress.estimatedCompletion.toLocaleTimeString()}</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Google Drive Management</h2>
        <Button
          variant="outline"
          onClick={() => {
            loadFolderMappings();
            loadIndexingProgress();
          }}
          disabled={isLoading}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="config">
            <Settings className="h-4 w-4 mr-2" />
            Configuration
          </TabsTrigger>
          <TabsTrigger value="folders">
            <FolderOpen className="h-4 w-4 mr-2" />
            Folder Management
          </TabsTrigger>
          <TabsTrigger value="indexing">
            <Activity className="h-4 w-4 mr-2" />
            Indexing Status
          </TabsTrigger>
        </TabsList>

        <TabsContent value="config">
          <ConfigurationPanel />
        </TabsContent>

        <TabsContent value="folders">
          <FolderManagementPanel />
        </TabsContent>

        <TabsContent value="indexing">
          <IndexingStatusPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
