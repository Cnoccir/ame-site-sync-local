import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  CheckCircle, 
  AlertTriangle, 
  XCircle, 
  Folder, 
  FolderOpen, 
  ArrowRight, 
  Settings,
  ExternalLink,
  Clock,
  Shield,
  FileText,
  Archive
} from 'lucide-react';
import { 
  FolderAssociation, 
  MigrationPlan, 
  FolderStructureTemplate,
  FolderMigrationService 
} from '@/services/folderMigrationService';

interface FolderMigrationReviewProps {
  customerId: string;
  customerName: string;
  serviceTier: string;
  existingFolders: any[];
  onMigrationComplete?: (result: any) => void;
  onCancel?: () => void;
}

export const FolderMigrationReview: React.FC<FolderMigrationReviewProps> = ({
  customerId,
  customerName,
  serviceTier,
  existingFolders,
  onMigrationComplete,
  onCancel
}) => {
  const [associations, setAssociations] = useState<FolderAssociation[]>([]);
  const [migrationPlan, setMigrationPlan] = useState<MigrationPlan | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState('standard_project');
  const [loading, setLoading] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [activeTab, setActiveTab] = useState('review');

  const templates = FolderMigrationService.getFolderStructureTemplates();
  const currentTemplate = templates.find(t => t.templateId === selectedTemplate);

  // Initialize analysis when component mounts
  useEffect(() => {
    if (existingFolders.length > 0 && !analysisComplete) {
      handleAnalyzeFolders();
    }
  }, [existingFolders, analysisComplete]);

  const handleAnalyzeFolders = async () => {
    setLoading(true);
    try {
      const folderAssociations = await FolderMigrationService.analyzeFoldersForMigration(
        customerId,
        customerName,
        serviceTier,
        existingFolders,
        selectedTemplate
      );

      const plan = await FolderMigrationService.createMigrationPlan(
        customerId,
        customerName,
        folderAssociations,
        selectedTemplate
      );

      setAssociations(folderAssociations);
      setMigrationPlan(plan);
      setAnalysisComplete(true);
    } catch (error) {
      console.error('Failed to analyze folders:', error);
      // Could add error state here
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateAssociation = (
    folderId: string, 
    updates: Partial<FolderAssociation>
  ) => {
    setAssociations(prev => prev.map(assoc => 
      assoc.existingFolderId === folderId 
        ? { ...assoc, ...updates, userConfirmed: true }
        : assoc
    ));

    // Regenerate migration plan with updated associations
    if (migrationPlan) {
      FolderMigrationService.createMigrationPlan(
        customerId,
        customerName,
        associations.map(assoc => 
          assoc.existingFolderId === folderId 
            ? { ...assoc, ...updates, userConfirmed: true }
            : assoc
        ),
        selectedTemplate
      ).then(setMigrationPlan);
    }
  };

  const handleExecuteMigration = async () => {
    if (!migrationPlan) return;

    setLoading(true);
    try {
      const result = await FolderMigrationService.executeMigrationPlan(migrationPlan);
      onMigrationComplete?.(result);
    } catch (error) {
      console.error('Migration failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const getConfidenceColor = (confidence: 'high' | 'medium' | 'low') => {
    switch (confidence) {
      case 'high': return 'bg-green-100 text-green-800 border-green-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-red-100 text-red-800 border-red-200';
    }
  };

  const getAssociationTypeIcon = (type: FolderAssociation['associationType']) => {
    switch (type) {
      case 'link': return <ArrowRight className="w-4 h-4" />;
      case 'move': return <FolderOpen className="w-4 h-4" />;
      case 'copy': return <FileText className="w-4 h-4" />;
      case 'archive': return <Archive className="w-4 h-4" />;
      case 'ignore': return <XCircle className="w-4 h-4" />;
    }
  };

  const getRiskLevelColor = (risk: 'low' | 'medium' | 'high') => {
    switch (risk) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
    }
  };

  if (loading && !analysisComplete) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <div className="text-center">
            <Settings className="w-8 h-8 animate-spin mx-auto mb-4 text-blue-500" />
            <p>Analyzing {existingFolders.length} found folders...</p>
            <p className="text-sm text-gray-500 mt-2">This may take a moment</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Folder className="w-5 h-5" />
            Folder Migration Plan for {customerName}
          </CardTitle>
          <CardDescription>
            Review how {existingFolders.length} found folders will be organized into a clean structure
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="review">Review Associations</TabsTrigger>
          <TabsTrigger value="plan">Migration Plan</TabsTrigger>
          <TabsTrigger value="templates">Template Options</TabsTrigger>
        </TabsList>

        <TabsContent value="review" className="space-y-4">
          <div className="grid gap-4">
            {associations.map((association) => (
              <Card key={association.existingFolderId} className="relative">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Folder className="w-4 h-4 text-blue-500" />
                        <h4 className="font-medium">{association.existingFolderName}</h4>
                        <Badge 
                          variant="outline"
                          className={getConfidenceColor(association.confidence)}
                        >
                          {association.confidence} confidence
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                        <span className="flex items-center gap-1">
                          {getAssociationTypeIcon(association.associationType)}
                          {association.associationType}
                        </span>
                        <span>→ {association.folderType.replace('_', ' ')}</span>
                        <a 
                          href={association.existingFolderUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-blue-500 hover:text-blue-700"
                        >
                          <ExternalLink className="w-3 h-3" />
                          View
                        </a>
                      </div>

                      {association.notes && (
                        <p className="text-sm text-gray-600 mb-3">{association.notes}</p>
                      )}

                      <div className="flex gap-2 flex-wrap">
                        {['link', 'move', 'copy', 'archive', 'ignore'].map((type) => (
                          <Button
                            key={type}
                            variant={association.associationType === type ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => handleUpdateAssociation(
                              association.existingFolderId,
                              { associationType: type as FolderAssociation['associationType'] }
                            )}
                            className="text-xs"
                          >
                            {getAssociationTypeIcon(type as FolderAssociation['associationType'])}
                            {type}
                          </Button>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center">
                      {association.confidence === 'high' && (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      )}
                      {association.confidence === 'medium' && (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      )}
                      {association.confidence === 'low' && (
                        <XCircle className="w-5 h-5 text-red-500" />
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="plan" className="space-y-4">
          {migrationPlan && (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    Migration Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-blue-500" />
                      <div>
                        <p className="text-sm text-gray-600">Estimated Duration</p>
                        <p className="font-medium">{migrationPlan.estimatedDuration} minutes</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Shield className={`w-4 h-4 ${getRiskLevelColor(migrationPlan.riskLevel)}`} />
                      <div>
                        <p className="text-sm text-gray-600">Risk Level</p>
                        <p className={`font-medium ${getRiskLevelColor(migrationPlan.riskLevel)}`}>
                          {migrationPlan.riskLevel}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-sm text-gray-600">Actions</p>
                        <p className="font-medium">{migrationPlan.migrationActions.length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {migrationPlan.recommendations.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <p className="font-medium">Recommendations:</p>
                      <ul className="list-disc list-inside space-y-1 text-sm">
                        {migrationPlan.recommendations.map((rec, index) => (
                          <li key={index}>{rec}</li>
                        ))}
                      </ul>
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Migration Actions</CardTitle>
                  <CardDescription>
                    Actions will be executed in priority order
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {migrationPlan.migrationActions.map((action, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm font-medium">
                          {action.priority}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {getAssociationTypeIcon(action.action.replace('_', '') as any)}
                            <span className="font-medium capitalize">
                              {action.action.replace('_', ' ')}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600">{action.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card 
                key={template.templateId}
                className={selectedTemplate === template.templateId ? 'ring-2 ring-blue-500' : ''}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-medium">{template.templateName}</h4>
                      <p className="text-sm text-gray-600">{template.description}</p>
                      <div className="flex gap-1 mt-2">
                        {template.applicableServiceTiers.map(tier => (
                          <Badge key={tier} variant="outline" className="text-xs">
                            {tier}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <Button
                      variant={selectedTemplate === template.templateId ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTemplate(template.templateId)}
                    >
                      {selectedTemplate === template.templateId ? 'Selected' : 'Select'}
                    </Button>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-2 text-xs">
                    {template.folders.map((folder) => (
                      <div key={folder.type} className="flex items-center gap-2 text-gray-600">
                        <Folder className="w-3 h-3" />
                        <span>{folder.name}</span>
                        {folder.required && (
                          <Badge variant="outline" className="text-xs">required</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        
        <div className="flex gap-2">
          {selectedTemplate !== (migrationPlan?.templateId || 'standard_project') && (
            <Button variant="outline" onClick={handleAnalyzeFolders}>
              Re-analyze with Template
            </Button>
          )}
          
          <Button 
            onClick={handleExecuteMigration}
            disabled={loading || !migrationPlan}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {loading ? (
              <>
                <Settings className="w-4 h-4 animate-spin mr-2" />
                Executing...
              </>
            ) : (
              'Execute Migration'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};
