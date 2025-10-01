import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw,
  X,
  Database,
  ServerCrash,
  Info
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { EnhancedTridiumParsingService, EnhancedParsingResult } from '@/services/EnhancedTridiumParsingService';
import { useImportedDatasets } from '@/hooks/useImportedDatasets';
import { logger } from '@/utils/logger';

interface DatabaseTridiumUploadProps {
  projectId: string;
  customerId?: string;
  siteName: string;
  onUploadComplete?: (result: EnhancedParsingResult) => void;
  onDataChange?: () => void;
}

interface UploadedFile {
  file: File;
  id: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
}

export const DatabaseTridiumUpload: React.FC<DatabaseTridiumUploadProps> = ({
  projectId,
  customerId,
  siteName,
  onUploadComplete,
  onDataChange
}) => {
  const { toast } = useToast();
  const { datasets, loading: datasetsLoading, error: datasetsError, reload } = useImportedDatasets(projectId);
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [processing, setProcessing] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [lastResult, setLastResult] = useState<EnhancedParsingResult | null>(null);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);
  const parsingService = new EnhancedTridiumParsingService();

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return;
    
    setProcessing(true);
    const newFiles: UploadedFile[] = Array.from(files).map(file => ({
      file,
      id: `${file.name}-${Date.now()}`,
      status: 'uploading' as const
    }));
    
    setUploadedFiles(newFiles);
    
    try {
      logger.info('Starting database-enabled file upload', {
        projectId,
        customerId,
        siteName,
        fileCount: files.length,
        fileNames: Array.from(files).map(f => f.name)
      });

      // Update status to processing
      setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'processing' as const })));

      // Use Enhanced Tridium Parsing Service with database persistence
      const result = await parsingService.parseFiles(
        Array.from(files),
        projectId,
        customerId,
        siteName
      );

      if (result.databaseSaved && result.systemBaselineId) {
        // Success - data saved to database
        setUploadedFiles(prev => prev.map(f => ({ ...f, status: 'completed' as const })));
        setLastResult(result);
        
        toast({
          title: "Files Uploaded Successfully",
          description: `Processed ${result.datasets.length} files and saved to database. System baseline ID: ${result.systemBaselineId}`,
          variant: "default"
        });

        logger.info('File upload completed successfully', {
          systemBaselineId: result.systemBaselineId,
          datasetCount: result.datasets.length,
          totalAlerts: result.totalAlerts,
          criticalAlerts: result.criticalAlerts
        });

        // Notify parent components
        onUploadComplete?.(result);
        onDataChange?.();
        
        // Reload datasets to show new data
        await reload();
        
      } else {
        // Failed to save to database
        const errorMessage = result.savingErrors.length > 0 
          ? result.savingErrors.join('; ')
          : 'Failed to save data to database';
          
        setUploadedFiles(prev => prev.map(f => ({ 
          ...f, 
          status: 'error' as const,
          error: errorMessage
        })));
        
        toast({
          title: "Database Save Failed",
          description: errorMessage,
          variant: "destructive"
        });

        logger.error('Failed to save parsed data to database', {
          errors: result.savingErrors,
          datasetCount: result.datasets.length
        });
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      setUploadedFiles(prev => prev.map(f => ({ 
        ...f, 
        status: 'error' as const,
        error: errorMessage
      })));
      
      toast({
        title: "Upload Failed", 
        description: errorMessage,
        variant: "destructive"
      });

      logger.error('File upload failed', { error, projectId, siteName });
    } finally {
      setProcessing(false);
    }
  }, [projectId, customerId, siteName, toast, onUploadComplete, onDataChange, reload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    handleFileUpload(e.dataTransfer.files);
  }, [handleFileUpload]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  }, []);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    await handleFileUpload(files);
    
    // Reset file input
    if (e.target) {
      e.target.value = '';
    }
  }, [handleFileUpload]);

  const clearFiles = () => {
    setUploadedFiles([]);
    setLastResult(null);
  };

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={uploadInputRef}
        type="file"
        accept=".csv,.txt"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        id="database-file-upload"
        disabled={processing}
      />
      
      {/* Project Context Info */}
      <Alert>
        <Database className="h-4 w-4" />
        <AlertDescription>
          <div className="space-y-1">
            <div><strong>Project:</strong> {projectId}</div>
            <div><strong>Site:</strong> {siteName}</div>
            {customerId && <div><strong>Customer:</strong> {customerId}</div>}
            <div className="text-xs text-muted-foreground mt-2">
              All uploaded data will be saved to the Supabase database for permanent storage and reporting.
            </div>
          </div>
        </AlertDescription>
      </Alert>

      {/* Current Datasets */}
      {datasetsLoading ? (
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      ) : datasetsError ? (
        <Alert variant="destructive">
          <ServerCrash className="h-4 w-4" />
          <AlertDescription>
            Error loading existing data: {datasetsError}
            <Button variant="outline" size="sm" onClick={reload} className="ml-2">
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : datasets.length > 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="w-5 h-5" />
              Existing System Data ({datasets.length})
            </CardTitle>
            <CardDescription>
              Previously uploaded and processed system baselines for this project
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {datasets.map(dataset => (
                <div key={dataset.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{dataset.filename}</span>
                    <Badge variant="outline">{dataset.format}</Badge>
                  </div>
                  <div className="text-sm text-muted-foreground grid grid-cols-2 gap-2">
                    <div>Uploaded: {new Date(dataset.metadata?.uploadedAt || '').toLocaleDateString()}</div>
                    <div>Health Score: {dataset.summary?.healthScore || 'N/A'}</div>
                    <div>Total Devices: {dataset.summary?.totalDevices || 'N/A'}</div>
                    <div>Confidence: {dataset.metadata?.confidence || 100}%</div>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" size="sm" onClick={reload} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Data
            </Button>
          </CardContent>
        </Card>
      ) : null}
      
      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Upload Tridium Export Files
          </CardTitle>
          <CardDescription>
            Upload system exports for database storage and analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}
              ${processing ? 'opacity-50 pointer-events-none' : 'hover:border-primary/50'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {processing ? 'Processing Files...' : 'Upload Tridium Export Files'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop files here, or click to browse.
            </p>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Supported files: PlatformDetails.txt, ResourceExport.csv, BACnetExport.csv, N2Export.csv</p>
              <p>Data will be automatically saved to database for reporting</p>
            </div>
            
            <Button asChild className="mt-4" disabled={processing}>
              <label htmlFor="database-file-upload" className="cursor-pointer">
                {processing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  'Choose Files'
                )}
              </label>
            </Button>
          </div>
          
          {processing && (
            <div className="mt-4">
              <div className="flex items-center gap-2 mb-2">
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span className="text-sm">Parsing files and saving to database...</span>
              </div>
              <Progress value={66} className="w-full" />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Upload Results */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Upload Status</CardTitle>
              <Button variant="ghost" size="sm" onClick={clearFiles}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map(file => (
                <div key={file.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    {file.status === 'completed' ? (
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                    ) : file.status === 'error' ? (
                      <AlertTriangle className="w-4 h-4 text-red-500" />
                    ) : (
                      <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
                    )}
                    <span className="font-medium">{file.file.name}</span>
                    <Badge variant={file.status === 'completed' ? 'default' : 
                                 file.status === 'error' ? 'destructive' : 'secondary'}>
                      {file.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Size: {(file.file.size / 1024).toFixed(1)} KB
                  </div>
                  {file.error && (
                    <div className="text-sm text-red-600">
                      Error: {file.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
            
            {lastResult && (
              <Alert className="mt-4">
                <Info className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div><strong>Database Saved:</strong> {lastResult.databaseSaved ? 'Yes' : 'No'}</div>
                    <div><strong>System Baseline ID:</strong> {lastResult.systemBaselineId || 'N/A'}</div>
                    <div><strong>Datasets:</strong> {lastResult.datasets.length}</div>
                    <div><strong>Total Alerts:</strong> {lastResult.totalAlerts} ({lastResult.criticalAlerts} critical)</div>
                    <div><strong>Processing Time:</strong> {lastResult.processingTime}ms</div>
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};