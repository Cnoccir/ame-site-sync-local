import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { AlertCircle, Folder, FolderPlus, Link2, ExternalLink, Search, Check } from 'lucide-react';
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { FolderAssociationService, ExistingFolderMatch, FolderAssociation } from '@/services/folderAssociationService';

export interface FolderSelectionProps {
  customerName: string;
  existingFolders: ExistingFolderMatch[];
  onSelectionComplete: (selection: {
    associationType: 'use_existing' | 'create_new' | 'link_both';
    existingFolder?: ExistingFolderMatch;
    notes?: string;
  }) => void;
  onCancel?: () => void;
}

export const FolderSelection: React.FC<FolderSelectionProps> = ({
  customerName,
  existingFolders,
  onSelectionComplete,
  onCancel
}) => {
  const [selectedAction, setSelectedAction] = useState<'use_existing' | 'create_new' | 'link_both'>('create_new');
  const [selectedFolders, setSelectedFolders] = useState<ExistingFolderMatch[]>([]);
  const [notes, setNotes] = useState('');
  const [previousAssociations, setPreviousAssociations] = useState<FolderAssociation[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPreviousAssociations();
  }, [customerName]);

  const loadPreviousAssociations = async () => {
    try {
      const relevant = await FolderAssociationService.getRelevantFolders(customerName);
      setPreviousAssociations(relevant.associated);
    } catch (error) {
      console.warn('Failed to load previous associations:', error);
    }
  };

  const handleFolderToggle = (folder: ExistingFolderMatch, checked: boolean) => {
    if (checked) {
      setSelectedFolders(prev => [...prev, folder]);
      if (selectedAction === 'create_new') {
        setSelectedAction('use_existing');
      }
    } else {
      setSelectedFolders(prev => prev.filter(f => f.folderId !== folder.folderId));
    }
    
    // Update notes
    const allSelected = checked 
      ? [...selectedFolders, folder]
      : selectedFolders.filter(f => f.folderId !== folder.folderId);
    
    if (allSelected.length > 0) {
      setNotes(`Selected ${allSelected.length} folder${allSelected.length > 1 ? 's' : ''}: ${allSelected.map(f => f.folderName).join(', ')}`);
    } else {
      setNotes('');
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    
    try {
      // Cache the search results for future reference
      if (existingFolders.length > 0) {
        await FolderAssociationService.cacheSearchResults(customerName, existingFolders);
      }

      onSelectionComplete({
        associationType: selectedAction,
        existingFolder: selectedAction === 'use_existing' && selectedFolders.length > 0 ? selectedFolders[0] : undefined,
        notes
      });
    } catch (error) {
      console.error('Failed to process folder selection:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getConfidenceBadgeColor = (confidence: string) => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMatchTypeBadgeColor = (matchType: string) => {
    switch (matchType) {
      case 'exact': return 'bg-blue-100 text-blue-800';
      case 'partial': return 'bg-purple-100 text-purple-800';
      case 'fuzzy': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Folder Setup for {customerName}
          </CardTitle>
          <CardDescription>
            {existingFolders.length > 0 
              ? `Found ${existingFolders.length} existing folder${existingFolders.length > 1 ? 's' : ''} that might be related to this customer. Choose how to proceed.`
              : 'No existing folders found. A new project folder will be created.'
            }
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          
          {/* Previous Associations */}
          {previousAssociations.length > 0 && (
            <div>
              <Label className="text-sm font-medium">Previous Folder Associations</Label>
              <div className="mt-2 space-y-2">
                {previousAssociations.map((assoc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <Folder className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">{assoc.existing_folder_name || 'New Folder'}</span>
                      <Badge variant="outline">{assoc.association_type.replace('_', ' ')}</Badge>
                    </div>
                    {assoc.existing_folder_url && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={assoc.existing_folder_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Separator className="mt-4" />
            </div>
          )}

          {/* Folder Selection Options */}
          <div>
            <Label className="text-sm font-medium">Choose Action</Label>
            <RadioGroup value={selectedAction} onValueChange={(value: any) => setSelectedAction(value)} className="mt-3">
              
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="create_new" id="create_new" />
                <Label htmlFor="create_new" className="flex items-center gap-2 cursor-pointer">
                  <FolderPlus className="h-4 w-4" />
                  Create new structured project folder
                </Label>
              </div>
              
              {existingFolders.length > 0 && (
                <>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="use_existing" id="use_existing" />
                    <Label htmlFor="use_existing" className="flex items-center gap-2 cursor-pointer">
                      <Folder className="h-4 w-4" />
                      Use existing folder
                    </Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="link_both" id="link_both" />
                    <Label htmlFor="link_both" className="flex items-center gap-2 cursor-pointer">
                      <Link2 className="h-4 w-4" />
                      Create new folder and link to existing
                    </Label>
                  </div>
                </>
              )}
            </RadioGroup>
          </div>

          {/* Existing Folders List */}
          {existingFolders.length > 0 && selectedAction !== 'create_new' && (
            <div>
              <Label className="text-sm font-medium">Available Existing Folders (select multiple)</Label>
              <div className="mt-3 space-y-3 max-h-64 overflow-y-auto">
                {existingFolders.map((folder, index) => {
                  const isSelected = selectedFolders.some(f => f.folderId === folder.folderId);
                  return (
                    <div 
                      key={index} 
                      className={`p-4 border rounded-lg transition-colors ${
                        isSelected 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={(checked) => handleFolderToggle(folder, !!checked)}
                          className="mt-1"
                        />
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Folder className="h-4 w-4 text-gray-500" />
                            <span className="font-medium">{folder.folderName}</span>
                          </div>
                          
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getConfidenceBadgeColor(folder.confidence)}>
                              {folder.confidence} confidence
                            </Badge>
                            <Badge className={getMatchTypeBadgeColor(folder.matchType)}>
                              {folder.matchType} match
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {Math.round(folder.matchScore * 100)}% similarity
                            </span>
                          </div>
                          
                          {folder.parentFolderName && (
                            <div className="text-sm text-gray-500">
                              in {folder.parentFolderName}
                            </div>
                          )}
                          
                          {folder.fileCount && (
                            <div className="text-sm text-gray-500">
                              {folder.fileCount} files
                            </div>
                          )}
                        </div>
                        
                        <Button variant="ghost" size="sm" asChild>
                          <a href={folder.folderUrl} target="_blank" rel="noopener noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <Label htmlFor="notes" className="text-sm font-medium">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add any notes about this folder selection..."
              className="mt-2"
              rows={3}
            />
          </div>

          {/* Validation Warning */}
          {selectedAction === 'use_existing' && selectedFolders.length === 0 && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please select at least one existing folder to use.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t">
            {onCancel && (
              <Button variant="outline" onClick={onCancel} disabled={isLoading}>
                Cancel
              </Button>
            )}
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || (selectedAction === 'use_existing' && selectedFolders.length === 0)}
            >
              {isLoading ? 'Processing...' : 'Continue'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
