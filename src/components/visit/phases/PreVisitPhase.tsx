import { useState, useEffect } from 'react';
import { CheckCircle, Clock, Shield, Wrench, FileText, Save, ExternalLink, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ToolManagement } from '@/components/ToolManagement';
import { useAutoSave } from '@/hooks/useAutoSave';
import { generateToolRecommendations } from '@/services/toolLibraryService';
// import { EnhancedSiteIntelligenceCard } from '@/components/phases/pre-visit/EnhancedSiteIntelligenceCard';

interface PreVisitPhaseProps {
  customer: Customer;
  onPhaseComplete: () => void;
  sessionData?: any;
  updateAutoSaveData?: (data: any) => void;
}

export const PreVisitPhase = ({ customer, onPhaseComplete, sessionData, updateAutoSaveData }: PreVisitPhaseProps) => {
  const [reviewItems, setReviewItems] = useState({
    customerInfo: false,
    siteAccess: false,
    safetyRequirements: false,
    toolsChecklist: false,
    documentation: false
  });
  
  // Project handoff documentation state
  const [projectFolderUrl, setProjectFolderUrl] = useState(customer.drive_folder_url || '');
  const [projectManager, setProjectManager] = useState('');
  const [leadTechnician, setLeadTechnician] = useState('');
  const [documentationChecks, setDocumentationChecks] = useState({
    asBuiltDrawings: false,
    floorPlans: false,
    sequenceOfOperations: false,
    submittals: false,
    networkDiagram: false
  });
  
  const [safetyAcknowledgment, setSafetyAcknowledgment] = useState(false);
  const [selectedTools, setSelectedTools] = useState<string[]>([]);
  const [toolRecommendations, setToolRecommendations] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Auto-save with debouncing
  const { debouncedSave, setLoading } = useAutoSave({
    delay: 2000,
    onSave: (data) => {
      if (updateAutoSaveData) {
        setIsSaving(true);
        updateAutoSaveData(data);
        setTimeout(() => setIsSaving(false), 500);
      }
    },
    enabled: true
  });

  // Load saved data on component mount
  useEffect(() => {
    if (sessionData?.autoSaveData?.preVisitPhase) {
      setLoading(true);
      const savedData = sessionData.autoSaveData.preVisitPhase;
      
      if (savedData.reviewItems) {
        setReviewItems(savedData.reviewItems);
      }
      
      if (savedData.safetyAcknowledgment !== undefined) {
        setSafetyAcknowledgment(savedData.safetyAcknowledgment);
      }
      
      if (savedData.selectedTools) {
        setSelectedTools(savedData.selectedTools);
      }
      
      if (savedData.projectFolderUrl) {
        setProjectFolderUrl(savedData.projectFolderUrl);
      }
      
      if (savedData.projectManager) {
        setProjectManager(savedData.projectManager);
      }
      
      if (savedData.leadTechnician) {
        setLeadTechnician(savedData.leadTechnician);
      }
      
      if (savedData.documentationChecks) {
        setDocumentationChecks(savedData.documentationChecks);
      }
      
      setTimeout(() => setLoading(false), 100);
    }
  }, [sessionData, setLoading]);

  // Trigger auto-save when data changes
  useEffect(() => {
    debouncedSave({
      preVisitPhase: {
        reviewItems,
        safetyAcknowledgment,
        selectedTools,
        projectFolderUrl,
        projectManager,
        leadTechnician,
        documentationChecks,
        lastUpdated: new Date().toISOString()
      }
    });
  }, [reviewItems, safetyAcknowledgment, selectedTools, projectFolderUrl, projectManager, leadTechnician, documentationChecks, debouncedSave]);

  const allItemsChecked = Object.values(reviewItems).every(Boolean) && safetyAcknowledgment;

  const handleItemChange = (item: keyof typeof reviewItems, checked: boolean) => {
    setReviewItems(prev => ({ ...prev, [item]: checked }));
  };

  const handleCompletePhase = () => {
    // Allow completion even if not all items are checked - this is a learning tool
    if (!allItemsChecked) {
      toast({
        title: 'Phase 1 Complete',
        description: 'Moving to next phase. Consider completing remaining items as they help ensure successful visits.',
        variant: 'default'
      });
    } else {
      toast({
        title: 'Phase 1 Complete',
        description: 'Pre-visit preparation completed successfully.',
        variant: 'default'
      });
    }
    onPhaseComplete();
  };

  const reviewItemsList = [
    {
      key: 'customerInfo' as const,
      label: 'Review customer information and service history',
      icon: FileText,
      description: 'Verify contact details, service tier, and previous visit notes'
    },
    {
      key: 'siteAccess' as const,
      label: 'Confirm site access requirements',
      icon: Shield,
      description: 'Check building access hours, badge requirements, and contact procedures'
    },
    {
      key: 'safetyRequirements' as const,
      label: 'Review safety requirements and site hazards',
      icon: Shield,
      description: 'Understand PPE requirements, site-specific safety protocols, and emergency procedures'
    },
    {
      key: 'toolsChecklist' as const,
      label: 'Verify required tools and equipment',
      icon: Wrench,
      description: 'Ensure all necessary tools and spare parts are available for service tier'
    },
    {
      key: 'documentation' as const,
      label: 'Prepare service documentation',
      icon: FileText,
      description: 'Review SOPs, previous reports, and prepare visit checklist'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Phase 1: Pre-Visit Preparation</h2>
          <p className="text-muted-foreground">Complete preparation steps to ensure a successful visit</p>
        </div>
        <div className="flex items-center gap-2">
          {isSaving && (
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Save className="w-4 h-4 animate-pulse" />
              Saving...
            </div>
          )}
          <Badge variant={allItemsChecked ? 'default' : 'secondary'} className="px-3 py-1">
            {Object.values(reviewItems).filter(Boolean).length + (safetyAcknowledgment ? 1 : 0)} of {reviewItemsList.length + 1} Complete
          </Badge>
        </div>
      </div>

      {/* Site Intelligence placeholder */}
      <Card>
        <CardHeader>
          <CardTitle>Site Intelligence</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Site intelligence functionality is being updated.</p>
        </CardContent>
      </Card>
      
      {/* Service Overview */}
      <Card>
          <CardHeader>
            <CardTitle className="text-base">Service Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 text-sm">
              <div>
                <span className="font-medium">Service Tier:</span>
                <Badge className="ml-2">{customer.service_tier}</Badge>
              </div>
              <div>
                <span className="font-medium">System Type:</span>
                <span className="ml-2">{customer.system_type}</span>
              </div>
              <div>
                <span className="font-medium">Last Service:</span>
                <span className="ml-2">{customer.last_service || 'Unknown'}</span>
              </div>
              <div>
                <span className="font-medium">Next Due:</span>
                <span className="ml-2">{customer.next_due || 'TBD'}</span>
              </div>
            </div>
          </CardContent>
        </Card>

      {/* Project Handoff Documentation */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <ExternalLink className="w-5 h-5" />
            Project Folder & Documentation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Project Folder URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Project Folder Link</label>
              <div className="flex gap-2">
                <Input 
                  placeholder="SharePoint, Google Drive, or Network Drive URL" 
                  value={projectFolderUrl}
                  onChange={(e) => setProjectFolderUrl(e.target.value)}
                  className="flex-1"
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
            
            {/* Project Team */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Project Manager</label>
                <Input 
                  placeholder="PM Name" 
                  value={projectManager}
                  onChange={(e) => setProjectManager(e.target.value)}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Lead Technician</label>
                <Input 
                  placeholder="Lead Tech Name" 
                  value={leadTechnician}
                  onChange={(e) => setLeadTechnician(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
            
            {/* Documentation Checklist */}
            <div className="pt-2 border-t">
              <h4 className="text-sm font-medium mb-3">Verify Project Folder Contains:</h4>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center space-x-2 text-sm">
                  <Checkbox 
                    checked={documentationChecks.asBuiltDrawings}
                    onCheckedChange={(checked) => 
                      setDocumentationChecks(prev => ({...prev, asBuiltDrawings: checked as boolean}))
                    }
                  />
                  <span>As-Built Drawings</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <Checkbox 
                    checked={documentationChecks.floorPlans}
                    onCheckedChange={(checked) => 
                      setDocumentationChecks(prev => ({...prev, floorPlans: checked as boolean}))
                    }
                  />
                  <span>Floor Plans</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <Checkbox 
                    checked={documentationChecks.sequenceOfOperations}
                    onCheckedChange={(checked) => 
                      setDocumentationChecks(prev => ({...prev, sequenceOfOperations: checked as boolean}))
                    }
                  />
                  <span>Sequence of Operations</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <Checkbox 
                    checked={documentationChecks.submittals}
                    onCheckedChange={(checked) => 
                      setDocumentationChecks(prev => ({...prev, submittals: checked as boolean}))
                    }
                  />
                  <span>Equipment Submittals</span>
                </label>
                <label className="flex items-center space-x-2 text-sm">
                  <Checkbox 
                    checked={documentationChecks.networkDiagram}
                    onCheckedChange={(checked) => 
                      setDocumentationChecks(prev => ({...prev, networkDiagram: checked as boolean}))
                    }
                  />
                  <span>Network Diagram</span>
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preparation Checklist */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Preparation Checklist</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {reviewItemsList.map((item) => (
              <div key={item.key} className="flex items-start space-x-3 p-3 rounded-lg border border-card-border hover:bg-muted/50 transition-colors">
                <Checkbox
                  id={item.key}
                  checked={reviewItems[item.key]}
                  onCheckedChange={(checked) => handleItemChange(item.key, checked as boolean)}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <item.icon className="w-4 h-4 text-primary" />
                    <label htmlFor={item.key} className="font-medium text-foreground cursor-pointer">
                      {item.label}
                    </label>
                    {reviewItems[item.key] && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Tool Management */}
      <ToolManagement onToolSelectionChange={setSelectedTools} />

      {/* Safety Acknowledgment */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base text-orange-600">Safety Acknowledgment</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3 p-4 bg-orange-50 rounded-lg border border-orange-200">
            <Checkbox
              id="safety-acknowledgment"
              checked={safetyAcknowledgment}
              onCheckedChange={(checked) => setSafetyAcknowledgment(checked as boolean)}
              className="mt-1"
            />
            <div className="flex-1">
              <label htmlFor="safety-acknowledgment" className="font-medium text-orange-900 cursor-pointer">
                I acknowledge that I have reviewed all safety requirements and understand the site-specific hazards and procedures.
              </label>
              <p className="text-sm text-orange-700 mt-1">
                This includes PPE requirements, access procedures, emergency contacts, and any site-specific safety protocols.
              </p>
              {safetyAcknowledgment && (
                <div className="flex items-center space-x-2 mt-2">
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-700 font-medium">Safety acknowledgment confirmed</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Complete Phase Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleCompletePhase}
          size="lg"
          className="px-8"
          variant={allItemsChecked ? "default" : "outline"}
        >
          <CheckCircle className="w-5 h-5 mr-2" />
          {allItemsChecked ? "Complete Phase 1" : "Continue to Phase 2"}
        </Button>
      </div>
    </div>
  );
};