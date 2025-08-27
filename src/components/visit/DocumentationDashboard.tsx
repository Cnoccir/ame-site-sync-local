import { useState } from 'react';
import { 
  FileText, 
  ExternalLink, 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock,
  FolderOpen,
  Download,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DocumentStatus } from '@/types';

interface DocumentationDashboardProps {
  documents: DocumentStatus[];
  projectFolderUrl?: string;
  onDocumentAccess: (documentType: string) => void;
}

export const DocumentationDashboard = ({
  documents,
  projectFolderUrl,
  onDocumentAccess
}: DocumentationDashboardProps) => {
  const [accessingDoc, setAccessingDoc] = useState<string | null>(null);

  const getDocumentTypeDisplay = (type: string) => {
    switch (type) {
      case 'submittals': return 'Submittals';
      case 'as_built': return 'As-Built Drawings';
      case 'floor_plans': return 'Floor Plans';
      case 'sop': return 'Sequence of Operations';
      case 'project_folder': return 'Project Folder';
      default: return type;
    }
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'submittals': return FileText;
      case 'as_built': return FileText;
      case 'floor_plans': return FileText;
      case 'sop': return FileText;
      case 'project_folder': return FolderOpen;
      default: return FileText;
    }
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-50 border-green-200';
      case 'good': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'fair': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'poor': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'missing': return 'text-red-600 bg-red-50 border-red-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getStatusIcon = (available: boolean, quality: string) => {
    if (!available || quality === 'missing') {
      return <XCircle className="w-4 h-4 text-red-500" />;
    }
    if (quality === 'poor' || quality === 'fair') {
      return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    }
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const calculateDocumentationScore = () => {
    if (documents.length === 0) return 0;
    
    let totalScore = 0;
    documents.forEach(doc => {
      if (!doc.available || doc.quality === 'missing') {
        totalScore += 0;
      } else if (doc.quality === 'poor') {
        totalScore += 20;
      } else if (doc.quality === 'fair') {
        totalScore += 40;
      } else if (doc.quality === 'good') {
        totalScore += 70;
      } else if (doc.quality === 'excellent') {
        totalScore += 100;
      }
    });
    
    return Math.round(totalScore / documents.length);
  };

  const handleDocumentAccess = async (documentType: string, url?: string) => {
    setAccessingDoc(documentType);
    
    if (url) {
      window.open(url, '_blank');
    }
    
    onDocumentAccess(documentType);
    
    setTimeout(() => {
      setAccessingDoc(null);
    }, 1000);
  };

  const documentationScore = calculateDocumentationScore();
  const availableCount = documents.filter(doc => doc.available && doc.quality !== 'missing').length;
  const totalCount = documents.length;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Documentation Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {availableCount}/{totalCount} Available
            </Badge>
            <Badge 
              variant={documentationScore >= 80 ? 'default' : documentationScore >= 60 ? 'secondary' : 'destructive'}
              className="text-xs"
            >
              {documentationScore}% Complete
            </Badge>
          </div>
        </div>
        <Progress value={documentationScore} className="w-full h-2" />
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Critical Documents Notice */}
        {documentationScore < 60 && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <span className="text-sm font-medium text-yellow-800">
                Documentation Incomplete
              </span>
            </div>
            <p className="text-xs text-yellow-700 mt-1">
              Critical documentation is missing or outdated. This may impact service quality and efficiency.
            </p>
          </div>
        )}

        {/* Project Folder Access */}
        {projectFolderUrl && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-5 h-5 text-blue-600" />
                <div>
                  <h4 className="font-medium text-blue-900">Project Folder</h4>
                  <p className="text-sm text-blue-700">Central document repository</p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDocumentAccess('project_folder', projectFolderUrl)}
                disabled={accessingDoc === 'project_folder'}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                {accessingDoc === 'project_folder' ? 'Opening...' : 'Open'}
              </Button>
            </div>
          </div>
        )}

        {/* Document List */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-muted-foreground">Essential Documents</h4>
          {documents.map((doc) => {
            const Icon = getDocumentIcon(doc.type);
            return (
              <div key={doc.type} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(doc.available, doc.quality)}
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {getDocumentTypeDisplay(doc.type)}
                      </span>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge 
                              variant="outline" 
                              className={`text-xs ${getQualityColor(doc.quality)}`}
                            >
                              {doc.quality.toUpperCase()}
                            </Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="space-y-1">
                              <p className="font-medium">Document Quality: {doc.quality}</p>
                              {doc.lastUpdated && (
                                <p className="text-xs">
                                  Last updated: {new Date(doc.lastUpdated).toLocaleDateString()}
                                </p>
                              )}
                              <p className="text-xs">
                                {doc.quality === 'excellent' && 'Complete, current, and accurate'}
                                {doc.quality === 'good' && 'Complete with minor outdated sections'}
                                {doc.quality === 'fair' && 'Partially complete or somewhat outdated'}
                                {doc.quality === 'poor' && 'Incomplete or significantly outdated'}
                                {doc.quality === 'missing' && 'Document not available'}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                    {doc.lastUpdated && (
                      <p className="text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 inline mr-1" />
                        Updated {new Date(doc.lastUpdated).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {doc.available && doc.url ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDocumentAccess(doc.type, doc.url)}
                      disabled={accessingDoc === doc.type}
                    >
                      {accessingDoc === doc.type ? (
                        <Clock className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </Button>
                  ) : (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="sm" disabled>
                            <XCircle className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Document not available</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Documentation Quality Summary */}
        <div className="mt-4 p-3 bg-muted/50 rounded-lg">
          <h5 className="text-sm font-medium mb-2">Documentation Impact on Visit</h5>
          <div className="text-xs text-muted-foreground space-y-1">
            {documentationScore >= 90 && (
              <p className="text-green-700">✅ Excellent documentation will support efficient service delivery</p>
            )}
            {documentationScore >= 70 && documentationScore < 90 && (
              <p className="text-blue-700">ℹ️ Good documentation available with minor gaps</p>
            )}
            {documentationScore >= 50 && documentationScore < 70 && (
              <p className="text-yellow-700">⚠️ Fair documentation - may require additional discovery time</p>
            )}
            {documentationScore < 50 && (
              <p className="text-red-700">🚨 Poor documentation - expect longer assessment and potential delays</p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
