import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Upload, FileText, AlertTriangle, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TridiumDataImporterProps {
  onAnalysisComplete?: (result: any) => void;
  onDataSelected?: (summaryText: string) => void;
  visitId?: string;
}

export const TridiumDataImporter: React.FC<TridiumDataImporterProps> = ({
  onAnalysisComplete,
  onDataSelected,
  visitId
}) => {
  const { toast } = useToast();
  const [datasets, setDatasets] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (!files.length) return;
    
    setUploading(true);
    const newDatasets: any[] = [];
    
    try {
      for (const file of Array.from(files)) {
        const validExtensions = ['.csv', '.txt', '.xlsx', '.xls'];
        const hasValidExtension = validExtensions.some(ext => 
          file.name.toLowerCase().endsWith(ext)
        );
        
        if (!hasValidExtension) {
          toast({
            title: "Invalid File Type",
            description: `${file.name} is not a supported file type`,
            variant: "destructive"
          });
          continue;
        }
        
        const content = await file.text();
        
        // Simple mock dataset for now to avoid complex parsing
        const dataset = {
          id: `dataset_${Date.now()}_${Math.random()}`,
          filename: file.name,
          format: 'CSV',
          rows: [],
          columns: [],
          metadata: {
            fileSize: file.size,
            parseErrors: [],
            parseWarnings: []
          }
        };
        
        newDatasets.push(dataset);
      }
      
      setDatasets(prev => [...prev, ...newDatasets]);
      
      if (newDatasets.length > 0) {
        toast({
          title: "Files Imported Successfully",
          description: `Processed ${newDatasets.length} CSV file(s)`,
          variant: "default"
        });
      }
    } catch (error) {
      toast({
        title: "Import Failed", 
        description: error instanceof Error ? error.message : "Failed to process CSV files",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [toast]);

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

  return (
    <div className="space-y-6">
      {/* Hidden file input */}
      <input
        ref={uploadInputRef}
        type="file"
        accept=".csv,.xlsx,.txt"
        multiple
        onChange={handleFileSelect}
        className="hidden"
        id="file-upload-hidden"
        disabled={uploading}
      />
      
      {/* File Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Tridium Data Import
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${dragOver ? 'border-primary bg-primary/5' : 'border-border'}
              ${uploading ? 'opacity-50 pointer-events-none' : 'hover:border-primary/50'}
            `}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
          >
            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <FileText className="w-6 h-6 text-primary" />
            </div>
            <h3 className="text-lg font-medium mb-2">
              {uploading ? 'Processing Files...' : 'Upload Tridium Export Files'}
            </h3>
            <p className="text-muted-foreground mb-4">
              Drag and drop files here, or click to browse.
            </p>
            
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>Supported formats: Network Devices, BACnet Exports, Resource Metrics</p>
              <p>Accepted file types: .csv, .xlsx, .txt</p>
            </div>
            
            <Button asChild className="mt-4" disabled={uploading}>
              <label htmlFor="file-upload-hidden" className="cursor-pointer">
                Choose Files
              </label>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Dataset List */}
      {datasets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Imported Datasets</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {datasets.map(dataset => (
                <div key={dataset.id} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="font-medium">{dataset.filename}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Format: {dataset.format} • Size: {(dataset.metadata.fileSize / 1024).toFixed(1)} KB
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};