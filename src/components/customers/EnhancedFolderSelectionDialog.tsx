import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  AlertCircle, 
  Folder, 
  FolderPlus, 
  Link2, 
  ExternalLink, 
  Search, 
  Check, 
  FileText,
  Calendar,
  Users,
  Loader2,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  EnhancedProjectFolderService, 
  ProjectFolderDetectionResult,
  FolderCreationStrategy,
  EnhancedProjectFolder
} from '@/services/enhancedProjectFolderService';

interface EnhancedFolderSelectionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  customerData: {
    customer_id: string;
    company_name: string;
    site_name?: string;
    site_nickname?: string;
    site_address?: string;
    service_tier?: string;
    contact_name?: string;
    phone?: string;
  };
  onComplete: (result: EnhancedProjectFolder) => void;
  onError?: (error: string) => void;
}

export const EnhancedFolderSelectionDialog: React.FC<EnhancedFolderSelectionDialogProps> = ({
  isOpen,
  onClose,
  customerData,
  onComplete,
  onError
}) => {
  const [step, setStep] = useState<'detecting' | 'selecting' | 'processing' | 'complete'>('detecting');
  const [detectionResult, setDetectionResult] = useState<ProjectFolderDetectionResult | null>(null);
  const [selectedStrategy, setSelectedStrategy] = useState<'use_existing' | 'create_new' | 'link_both'>('create_new');
  const [selectedFolder, setSelectedFolder] = useState<any>(null);
  const [notes, setNotes] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && customerData.company_name) {
      performFolderDetection();
    }
  }, [isOpen, customerData.company_name]);

  const performFolderDetection = async () => {
    console.log('🔍 Starting folder detection for:', customerData.company_name);
    setStep('detecting');
    setError(null);
    
    try {
      const result = await EnhancedProjectFolderService.detectExistingProjectFolders(
        customerData.company_name,
        {
          site_name: customerData.site_name,
          site_nickname: customerData.site_nickname,
          site_address: customerData.site_address,
          customer_id: customerData.customer_id
        }
      );
      
      console.log('📊 Detection result:', result);
      setDetectionResult(result);
      setSelectedStrategy(result.recommendedAction === 'ask_user' ? 'create_new' : result.recommendedAction);
      
      if (result.existingFolder) {
        setSelectedFolder(result.existingFolder);
      }
      
      setStep('selecting');
      
    } catch (error) {
      console.error('❌ Folder detection failed:', error);
      setError(`Folder detection failed: ${error.message}`);
      // Allow user to proceed with creating a new folder
      setDetectionResult({
        hasExistingFolder: false,
        recommendedAction: 'create_new',
        searchDuration: 0
      });
      setSelectedStrategy('create_new');
      setStep('selecting');
    }
  };

  const handleStrategyChange = (strategy: 'use_existing' | 'create_new' | 'link_both') => {
    setSelectedStrategy(strategy);
    
    // Auto-select the best existing folder if using existing or linking
    if ((strategy === 'use_existing' || strategy === 'link_both') && detectionResult?.existingFolder) {
      setSelectedFolder(detectionResult.existingFolder);
    }
  };

  const handleComplete = async () => {
    if (!detectionResult) {
      setError('No detection result available');
      return;
    }
    
    setIsProcessing(true);
    setStep('processing');
    setError(null);
    
    try {
      const strategy: FolderCreationStrategy = {
        strategy: selectedStrategy,
        primaryFolderId: selectedFolder?.folderId || '',
        primaryFolderUrl: selectedFolder?.folderUrl || '',
        notes
      };
      
      // Add associated folders for link_both strategy
      if (selectedStrategy === 'link_both' && detectionResult.alternativeFolders) {
        strategy.associatedFolders = detectionResult.alternativeFolders.map(folder => ({
          folderId: folder.folderId,
          folderUrl: folder.folderUrl,
          associationType: 'reference' as const
        }));
      }
      
      console.log('🏗️ Creating/associating folders with strategy:', strategy);
      
      const result = await EnhancedProjectFolderService.createOrAssociateProjectFolder(
        customerData.company_name,
        customerData.customer_id,
        customerData,
        strategy
      );
      
      console.log('✅ Folder management completed:', result);
      setStep('complete');
      
      toast({
        title: "Project Folder Setup Complete",
        description: `Successfully ${result.isNewlyCreated ? 'created' : 'associated'} project folder with ${result.associatedFolders.length} linked folder${result.associatedFolders.length > 1 ? 's' : ''}.`,
      });
      
      onComplete(result);
      
      // Auto-close after a brief delay
      setTimeout(() => {
        onClose();
      }, 2000);
      
    } catch (error) {
      console.error('❌ Folder creation/association failed:', error);
      const errorMessage = `Failed to setup project folder: ${error.message}`;
      setError(errorMessage);
      setStep('selecting');
      
      if (onError) {
        onError(errorMessage);
      }
      
      toast({
        title: "Folder Setup Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getConfidenceBadgeVariant = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'default';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getMatchTypeBadgeVariant = (matchType: string) => {
    switch (matchType) {
      case 'exact': return 'default';
      case 'partial': return 'secondary';
      case 'fuzzy': return 'outline';
      default: return 'outline';
    }
  };

  const renderDetectionStep = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Detecting Existing Folders</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Searching for existing project folders for <strong>{customerData.company_name}</strong>...
        </p>
      </div>
    </div>
  );

  const renderSelectionStep = () => {
    if (!detectionResult) return null;
    
    return (
      <div className="space-y-6">
        {/* Detection Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Search className="h-5 w-5" />
              Folder Detection Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {detectionResult.hasExistingFolder ? (
                  <CheckCircle className="h-5 w-5 text-green-500" />
                ) : (
                  <XCircle className="h-5 w-5 text-gray-400" />
                )}
                <span className="text-sm">
                  {detectionResult.hasExistingFolder
                    ? `Found ${(detectionResult.alternativeFolders?.length || 0) + 1} potential folder match${(detectionResult.alternativeFolders?.length || 0) > 0 ? 'es' : ''}`
                    : 'No existing folders found'
                  }
                </span>
              </div>
              <Badge variant="outline" className="text-xs">
                {detectionResult.searchDuration}ms
              </Badge>
            </div>
            
            {error && (
              <Alert className="mt-3">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">
                  {error}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Existing Folder Details */}
        {detectionResult.hasExistingFolder && detectionResult.existingFolder && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Best Match Found</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3">
                  <Folder className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{detectionResult.existingFolder.folderName}</h4>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={getConfidenceBadgeVariant(detectionResult.existingFolder.confidence)}>
                        {detectionResult.existingFolder.confidence} confidence
                      </Badge>
                      <Badge variant={getMatchTypeBadgeVariant(detectionResult.existingFolder.matchType)}>
                        {detectionResult.existingFolder.matchType} match
                      </Badge>
                    </div>
                    {detectionResult.existingFolder.lastModified && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <Calendar className="h-3 w-3" />
                        Modified: {new Date(detectionResult.existingFolder.lastModified).toLocaleDateString()}
                      </div>
                    )}
                    {detectionResult.existingFolder.fileCount !== undefined && (
                      <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        {detectionResult.existingFolder.fileCount} files
                      </div>
                    )}
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <a href={detectionResult.existingFolder.folderUrl} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Alternative Folders */}
        {detectionResult.alternativeFolders && detectionResult.alternativeFolders.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Alternative Matches</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {detectionResult.alternativeFolders.map((folder, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-gray-500" />
                      <span className="text-sm truncate flex-1">{folder.folderName}</span>
                      <Badge variant={getConfidenceBadgeVariant(folder.confidence)} className="text-xs">
                        {folder.confidence}
                      </Badge>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <a href={folder.folderUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Strategy Selection */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Choose Action</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={selectedStrategy} onValueChange={handleStrategyChange}>
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="create_new" id="create_new" />
                  <Label htmlFor="create_new" className="flex items-center gap-2 cursor-pointer flex-1">
                    <FolderPlus className="h-4 w-4" />
                    <div>
                      <div className="font-medium">Create new structured project folder</div>
                      <div className="text-xs text-muted-foreground">Creates a new folder with organized subfolders for different project types</div>
                    </div>
                  </Label>
                </div>
                
                {detectionResult.hasExistingFolder && (
                  <>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="use_existing" id="use_existing" />
                      <Label htmlFor="use_existing" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Folder className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Use existing folder</div>
                          <div className="text-xs text-muted-foreground">Link to the existing folder without creating a new one</div>
                        </div>
                      </Label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="link_both" id="link_both" />
                      <Label htmlFor="link_both" className="flex items-center gap-2 cursor-pointer flex-1">
                        <Link2 className="h-4 w-4" />
                        <div>
                          <div className="font-medium">Create new folder and link existing</div>
                          <div className="text-xs text-muted-foreground">Create structured folder and reference existing folders for historical data</div>
                        </div>
                      </Label>
                    </div>
                  </>
                )}
              </div>
            </RadioGroup>
            
            <Separator className="my-4" />
            
            <div className="space-y-2">
              <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any notes about this folder selection..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="text-sm"
              />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderProcessingStep = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Setting Up Project Folder</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {selectedStrategy === 'create_new' && 'Creating new structured project folder...'}
          {selectedStrategy === 'use_existing' && 'Linking to existing folder...'}
          {selectedStrategy === 'link_both' && 'Creating new folder and linking existing folders...'}
        </p>
      </div>
    </div>
  );

  const renderCompleteStep = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-4">
      <CheckCircle className="h-12 w-12 text-green-500" />
      <div className="text-center">
        <h3 className="text-lg font-semibold">Project Folder Setup Complete!</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Your project folder has been successfully configured.
        </p>
      </div>
    </div>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Folder className="h-5 w-5" />
            Project Folder Setup - {customerData.company_name}
          </DialogTitle>
        </DialogHeader>
        
        <div className="mt-4">
          {step === 'detecting' && renderDetectionStep()}
          {step === 'selecting' && renderSelectionStep()}
          {step === 'processing' && renderProcessingStep()}
          {step === 'complete' && renderCompleteStep()}
        </div>
        
        {/* Action Buttons */}
        {step === 'selecting' && (
          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={onClose} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={handleComplete} disabled={isProcessing}>
              {isProcessing && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {selectedStrategy === 'create_new' && 'Create Folder'}
              {selectedStrategy === 'use_existing' && 'Use Existing'}
              {selectedStrategy === 'link_both' && 'Create & Link'}
            </Button>
          </div>
        )}
        
        {step === 'complete' && (
          <div className="flex justify-end pt-4 border-t">
            <Button onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
