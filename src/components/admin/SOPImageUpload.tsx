import { useState } from 'react';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { SOPImageService } from '@/services/sopImageService';

interface SOPImageUploadProps {
  sopId: string;
  stepNumber: number;
  currentImageUrl?: string;
  onImageUpdated: (imageUrl: string | null) => void;
}

export const SOPImageUpload = ({ 
  sopId, 
  stepNumber, 
  currentImageUrl, 
  onImageUpdated 
}: SOPImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File Type',
        description: 'Please upload an image file (PNG, JPG, GIF, etc.)',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: 'File Too Large',
        description: 'Please upload an image smaller than 10MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await SOPImageService.uploadStepImage(sopId, stepNumber, file);
      onImageUpdated(imageUrl);
      toast({
        title: 'Image Uploaded',
        description: `Step ${stepNumber} image uploaded and optimized successfully`,
      });
    } catch (error: any) {
      console.error('Admin image upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    setUploading(true);
    try {
      await SOPImageService.removeStepImage(sopId, stepNumber);
      onImageUpdated(null);
      toast({
        title: 'Image Removed',
        description: `Step ${stepNumber} image removed successfully`,
        variant: 'default'
      });
    } catch (error: any) {
      toast({
        title: 'Remove Failed',
        description: error.message || 'Failed to remove image',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium">Step {stepNumber} Visual Guide</h4>
          {currentImageUrl && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveImage}
              disabled={uploading}
              className="text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>

        {currentImageUrl ? (
          <div className="space-y-3">
            <div className="relative rounded-lg overflow-hidden bg-muted">
              <img 
                src={currentImageUrl} 
                alt={`Step ${stepNumber} visual guide`}
                className="w-full max-h-64 object-contain"
              />
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => document.getElementById(`file-${sopId}-${stepNumber}`)?.click()}
                disabled={uploading}
                className="flex-1"
              >
                <Upload className="w-4 h-4 mr-2" />
                Replace Image
              </Button>
            </div>
          </div>
        ) : (
          <div
            className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
              dragOver 
                ? 'border-primary bg-primary/5' 
                : 'border-muted-foreground/25 hover:border-muted-foreground/50'
            }`}
            onDrop={handleDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
          >
            <ImageIcon className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-2">
              Drag & drop an image or click to upload
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`file-${sopId}-${stepNumber}`)?.click()}
              disabled={uploading}
            >
              {uploading ? 'Uploading...' : 'Choose Image'}
            </Button>
          </div>
        )}

        <input
          id={`file-${sopId}-${stepNumber}`}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};