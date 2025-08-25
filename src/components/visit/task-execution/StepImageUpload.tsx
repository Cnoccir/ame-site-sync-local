import { useState } from 'react';
import { Camera, Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface StepImageUploadProps {
  stepNumber: number;
  currentImageUrl?: string;
  onImageUpdated: (imageUrl: string | null) => void;
  isCompact?: boolean;
}

export const StepImageUpload = ({ 
  stepNumber, 
  currentImageUrl, 
  onImageUpdated,
  isCompact = false
}: StepImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  // Resize image with better compression
  const resizeImage = (file: File): Promise<File> => {
    return new Promise((resolve) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Target dimensions for step images
        const maxWidth = isCompact ? 400 : 600;
        const maxHeight = isCompact ? 300 : 400;
        
        let { width, height } = img;
        
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width *= ratio;
          height *= ratio;
        }
        
        canvas.width = width;
        canvas.height = height;
        
        // Use better image rendering
        if (ctx) {
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
        }
        
        canvas.toBlob((blob) => {
          if (blob) {
            const resizedFile = new File([blob], `step-${stepNumber}-screenshot.jpg`, {
              type: 'image/jpeg',
              lastModified: Date.now()
            });
            resolve(resizedFile);
          } else {
            resolve(file);
          }
        }, 'image/jpeg', 0.85);
      };
      
      img.src = URL.createObjectURL(file);
    });
  };

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid File',
        description: 'Please select an image file',
        variant: 'destructive'
      });
      return;
    }

    if (file.size > 10 * 1024 * 1024) { // 10MB limit
      toast({
        title: 'File Too Large',
        description: 'Please choose an image smaller than 10MB',
        variant: 'destructive'
      });
      return;
    }

    setUploading(true);
    try {
      // Resize image
      const resizedFile = await resizeImage(file);
      
      // Generate filename
      const timestamp = Date.now();
      const fileName = `visit-screenshots/step-${stepNumber}-${timestamp}.jpg`;

      // Upload to storage
      const { data, error } = await supabase.storage
        .from('sop-images')
        .upload(fileName, resizedFile, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) throw error;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('sop-images')
        .getPublicUrl(fileName);

      const imageUrl = urlData.publicUrl;
      onImageUpdated(imageUrl);

      toast({
        title: 'Screenshot Updated',
        description: `Step ${stepNumber} image uploaded successfully`,
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: 'Upload Failed',
        description: error.message || 'Failed to upload image',
        variant: 'destructive'
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveImage = () => {
    onImageUpdated(null);
    toast({
      title: 'Screenshot Removed',
      description: `Step ${stepNumber} image removed`,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  };

  if (isCompact) {
    return (
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => document.getElementById(`step-file-${stepNumber}`)?.click()}
          disabled={uploading}
          className="gap-2"
        >
          <Camera className="w-4 h-4" />
          {currentImageUrl ? 'Update' : 'Add'} Screenshot
        </Button>
        
        {currentImageUrl && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveImage}
            disabled={uploading}
            className="text-muted-foreground hover:text-red-600"
          >
            <X className="w-4 h-4" />
          </Button>
        )}

        <input
          id={`step-file-${stepNumber}`}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>
    );
  }

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-sm">Update Screenshot</h4>
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
            <div className="relative rounded-lg overflow-hidden bg-muted border">
              <img 
                src={currentImageUrl} 
                alt={`Step ${stepNumber} screenshot`}
                className="w-full h-32 object-cover"
              />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => document.getElementById(`step-file-${stepNumber}`)?.click()}
              disabled={uploading}
              className="w-full gap-2"
            >
              <Upload className="w-4 h-4" />
              {uploading ? 'Uploading...' : 'Replace Screenshot'}
            </Button>
          </div>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => document.getElementById(`step-file-${stepNumber}`)?.click()}
            disabled={uploading}
            className="w-full gap-2"
          >
            <Camera className="w-4 h-4" />
            {uploading ? 'Uploading...' : 'Add Screenshot'}
          </Button>
        )}

        <input
          id={`step-file-${stepNumber}`}
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
        />
      </CardContent>
    </Card>
  );
};