import { useState, useCallback } from 'react';
import { Upload, X, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface FileUploaderProps {
  files: File[];
  onFilesChange: (files: File[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
}

export const FileUploader = ({ 
  files, 
  onFilesChange, 
  maxFiles = 10,
  acceptedTypes = ['.csv', '.xlsx', '.xls']
}: FileUploaderProps) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = droppedFiles.filter(file => 
      acceptedTypes.some(type => file.name.toLowerCase().endsWith(type.toLowerCase()))
    );

    if (validFiles.length > 0) {
      const newFiles = [...files, ...validFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    }
  }, [files, onFilesChange, acceptedTypes, maxFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []);
    const validFiles = selectedFiles.filter(file => 
      acceptedTypes.some(type => file.name.toLowerCase().endsWith(type.toLowerCase()))
    );

    if (validFiles.length > 0) {
      const newFiles = [...files, ...validFiles].slice(0, maxFiles);
      onFilesChange(newFiles);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Drop Zone */}
      <Card
        className={`p-8 border-2 border-dashed transition-colors cursor-pointer ${
          dragActive ? 'border-primary bg-primary/10' : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => document.getElementById('file-input')?.click()}
      >
        <div className="text-center">
          <Upload className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="font-medium mb-2">Upload Network Export Files</h3>
          <p className="text-sm text-muted-foreground mb-4">
            Drag and drop your CSV or Excel files here, or click to browse
          </p>
          <Button variant="outline" size="sm">
            Choose Files
          </Button>
          <input
            id="file-input"
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileInput}
            className="hidden"
          />
        </div>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card className="p-4">
          <h4 className="font-medium mb-3">Uploaded Files ({files.length})</h4>
          <div className="space-y-2">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-muted rounded">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-muted-foreground" />
                  <div>
                    <div className="text-sm font-medium">{file.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatFileSize(file.size)}
                    </div>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFile(index)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* File Limit Warning */}
      {files.length >= maxFiles && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Maximum of {maxFiles} files can be uploaded. Remove files to add more.
          </AlertDescription>
        </Alert>
      )}

      {/* Accepted File Types */}
      <div className="text-xs text-muted-foreground">
        Accepted file types: {acceptedTypes.join(', ')}
      </div>
    </div>
  );
};