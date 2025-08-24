
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Upload, Loader2 } from 'lucide-react';

interface CsvFileUploadProps {
  onFileData: (csvData: string) => void;
  accept?: string;
  disabled?: boolean;
  label: string;
}

export const CsvFileUpload = ({ onFileData, accept = ".csv", disabled = false, label }: CsvFileUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      toast({
        title: "Invalid File Type",
        description: "Please select a CSV file",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      const text = await file.text();
      
      onFileData(text);
      
      toast({
        title: "File Uploaded",
        description: `Successfully loaded ${file.name}`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error reading file:', error);
      toast({
        title: "Upload Error",
        description: "Failed to read the CSV file",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
      // Reset the input
      event.target.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <Label htmlFor={`csv-upload-${label}`}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={`csv-upload-${label}`}
          type="file"
          accept={accept}
          onChange={handleFileChange}
          disabled={disabled || uploading}
          className="flex-1"
        />
        {uploading && (
          <div className="flex items-center gap-1 text-sm text-muted-foreground">
            <Loader2 className="w-3 h-3 animate-spin" />
            Reading...
          </div>
        )}
      </div>
    </div>
  );
};
