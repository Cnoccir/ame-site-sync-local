import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { 
  ChevronDown, 
  ChevronRight, 
  Edit2, 
  Check, 
  X,
  ExternalLink,
  FileText,
  FolderOpen,
  AlertTriangle,
  CheckCircle,
  Users,
  Clock,
  Star,
  Archive
} from 'lucide-react';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';

interface ProjectDocumentationCardProps {
  customer: Customer;
  onUpdate: (updates: Partial<Customer>) => void;
  projectFolderUrl: string;
  setProjectFolderUrl: (url: string) => void;
  documentationChecks: any;
  setDocumentationChecks: (checks: any) => void;
  isReadOnly?: boolean;
}

export const ProjectDocumentationCard = ({ 
  customer, 
  onUpdate,
  projectFolderUrl,
  setProjectFolderUrl,
  documentationChecks,
  setDocumentationChecks,
  isReadOnly = false 
}: ProjectDocumentationCardProps) => {
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    project: true,
    documentation: true,
    team: true
  });
  const [editingFields, setEditingFields] = useState<Record<string, boolean>>({});
  const [tempValues, setTempValues] = useState<Record<string, any>>({});

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const startEditing = (field: string, currentValue: any = '') => {
    if (isReadOnly) return;
    setEditingFields(prev => ({ ...prev, [field]: true }));
    setTempValues(prev => ({ ...prev, [field]: currentValue }));
  };

  const cancelEditing = (field: string) => {
    setEditingFields(prev => ({ ...prev, [field]: false }));
    setTempValues(prev => {
      const { [field]: removed, ...rest } = prev;
      return rest;
    });
  };

  const saveField = (field: string) => {
    const value = tempValues[field];
    onUpdate({ [field]: value });
    setEditingFields(prev => ({ ...prev, [field]: false }));
    setTempValues(prev => {
      const { [field]: removed, ...rest } = prev;
      return rest;
    });
  };

  const saveArrayField = (field: string) => {
    const value = tempValues[field];
    const arrayValue = typeof value === 'string' 
      ? value.split(',').map(item => item.trim()).filter(item => item.length > 0)
      : value;
    onUpdate({ [field]: arrayValue });
    setEditingFields(prev => ({ ...prev, [field]: false }));
    setTempValues(prev => {
      const { [field]: removed, ...rest } = prev;
      return rest;
    });
  };

  // Calculate documentation score based on completed checks
  const calculateDocumentationScore = () => {
    const totalChecks = Object.keys(documentationChecks).length;
    const completedChecks = Object.values(documentationChecks).filter(Boolean).length;
    return totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
  };

  const updateDocumentationScore = () => {
    const newScore = calculateDocumentationScore();
    onUpdate({ documentation_score: newScore });
  };

  const handleDocumentationCheck = (checkName: string, checked: boolean) => {
    const newChecks = { ...documentationChecks, [checkName]: checked };
    setDocumentationChecks(newChecks);
    
    // Update the score in customer data
    const totalChecks = Object.keys(newChecks).length;
    const completedChecks = Object.values(newChecks).filter(Boolean).length;
    const newScore = totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0;
    onUpdate({ documentation_score: newScore });
  };

  const getCompletionStatusColor = (status?: string) => {
    switch (status) {
      case 'Operational':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Commissioning':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'Construction':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'Design':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'Warranty':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const renderEditableField = (
    field: string,
    currentValue: any = '',
    placeholder: string = '',
    multiline: boolean = false
  ) => {
    const isEditing = editingFields[field];
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          {multiline ? (
            <Textarea
              value={tempValues[field] || ''}
              onChange={(e) => setTempValues(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={placeholder}
              className="flex-1 min-h-[80px]"
              rows={3}
            />
          ) : (
            <Input
              value={tempValues[field] || ''}
              onChange={(e) => setTempValues(prev => ({ ...prev, [field]: e.target.value }))}
              placeholder={placeholder}
              className="flex-1"
            />
          )}
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => saveField(field)}
              className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => cancelEditing(field)}
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-2 group">
        <span className={cn(
          "flex-1",
          !currentValue && "text-muted-foreground italic"
        )}>
          {currentValue || placeholder}
        </span>
        {!isReadOnly && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => startEditing(field, currentValue)}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  const renderArrayField = (
    field: string,
    currentValue: string[] = [],
    placeholder: string = ''
  ) => {
    const isEditing = editingFields[field];
    
    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={tempValues[field] || ''}
            onChange={(e) => setTempValues(prev => ({ ...prev, [field]: e.target.value }))}
            placeholder={placeholder}
            className="flex-1"
          />
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => saveArrayField(field)}
              className="h-8 w-8 p-0 text-green-600 hover:bg-green-100"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => cancelEditing(field)}
              className="h-8 w-8 p-0 text-red-600 hover:bg-red-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-start gap-2 group">
        <div className="flex-1">
          {currentValue && currentValue.length > 0 ? (
            <div className="flex flex-wrap gap-1">
              {currentValue.map((item, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="text-xs px-2 py-1"
                >
                  {item}
                </Badge>
              ))}
            </div>
          ) : (
            <span className="text-muted-foreground italic">{placeholder}</span>
          )}
        </div>
        {!isReadOnly && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => startEditing(field, currentValue?.join(', ') || '')}
            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <Edit2 className="h-4 w-4" />
          </Button>
        )}
      </div>
    );
  };

  const currentScore = customer.documentation_score || calculateDocumentationScore();

  const documentationItems = [
    { key: 'asBuiltDrawings', label: 'As-Built Drawings', icon: FileText },
    { key: 'floorPlans', label: 'Floor Plans', icon: FolderOpen },
    { key: 'sequenceOfOperations', label: 'Sequence of Operations', icon: Archive },
    { key: 'submittals', label: 'Equipment Submittals', icon: CheckCircle },
    { key: 'networkDiagram', label: 'Network Diagram', icon: Star }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Project Documentation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Project Folder Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <FolderOpen className="w-4 h-4 text-green-600" />
              Project Folder
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('project')}
              className="h-8 w-8 p-0"
            >
              {expandedSections.project ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {expandedSections.project && (
            <div className="grid grid-cols-1 gap-4">
              {/* Project Folder URL */}
              <div>
                <label className="text-sm font-medium text-muted-foreground">
                  Project Folder URL
                </label>
                <div className="flex gap-2 mt-1">
                  <Input
                    placeholder="SharePoint, Google Drive, or Network Drive URL"
                    value={projectFolderUrl}
                    onChange={(e) => setProjectFolderUrl(e.target.value)}
                    className="flex-1"
                    readOnly={isReadOnly}
                  />
                  {projectFolderUrl && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="px-3"
                      onClick={() => window.open(projectFolderUrl, '_blank')}
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Completion Status & Documentation Score */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Project Status
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline"
                      className={cn("border", getCompletionStatusColor(customer.completion_status))}
                    >
                      {customer.completion_status || 'Unknown'}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Documentation Score
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <Progress value={currentScore} className="flex-1 h-2" />
                    <span className="text-sm font-medium min-w-[3rem]">{currentScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Documentation Checklist Section */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              Documentation Checklist
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('documentation')}
              className="h-8 w-8 p-0"
            >
              {expandedSections.documentation ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {expandedSections.documentation && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground mb-4">
                Verify project folder contains:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {documentationItems.map((item) => (
                  <label key={item.key} className="flex items-center space-x-3 text-sm p-2 rounded hover:bg-muted/50 transition-colors">
                    <Checkbox
                      checked={documentationChecks[item.key] || false}
                      onCheckedChange={(checked) => handleDocumentationCheck(item.key, checked as boolean)}
                      disabled={isReadOnly}
                    />
                    <item.icon className="w-4 h-4 text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                    {documentationChecks[item.key] && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Project Team Intelligence Section */}
        <div className="space-y-4 border-t pt-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-base flex items-center gap-2">
              <Users className="w-4 h-4 text-orange-600" />
              Project Team Intelligence
            </h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toggleSection('team')}
              className="h-8 w-8 p-0"
            >
              {expandedSections.team ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </Button>
          </div>
          
          {expandedSections.team && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* First Column */}
              <div className="space-y-4">
                {/* Original Team Contact */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Original Team Contact
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'original_team_contact',
                      customer.original_team_contact || '',
                      'Original team contact name...'
                    )}
                  </div>
                </div>

                {/* Original Team Role */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Contact Role
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'original_team_role',
                      customer.original_team_role || '',
                      'PM, Lead Tech, Commissioning Agent...'
                    )}
                  </div>
                </div>

                {/* Contact Info */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Contact Information
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'original_team_info',
                      customer.original_team_info || '',
                      'Phone, email, or other contact info...',
                      true
                    )}
                  </div>
                </div>
              </div>

              {/* Second Column */}
              <div className="space-y-4">
                {/* When to Contact Original */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    When to Contact
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'when_to_contact_original',
                      customer.when_to_contact_original || '',
                      'Complex issues, system modifications, commissioning...',
                      true
                    )}
                  </div>
                </div>

                {/* Commissioning Notes */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground">
                    Commissioning Notes
                  </label>
                  <div className="mt-1">
                    {renderEditableField(
                      'commissioning_notes',
                      customer.commissioning_notes || '',
                      'Commissioning status and notes...',
                      true
                    )}
                  </div>
                </div>

                {/* Known Issues */}
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    Known Issues
                  </label>
                  <div className="mt-1">
                    {renderArrayField(
                      'known_issues',
                      customer.known_issues || [],
                      'Enter issues separated by commas...'
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
