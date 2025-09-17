import { useState, useEffect, useMemo } from 'react';
import { 
  Building2, Phone, FileText, Package, CheckCircle, ChevronRight, 
  ChevronDown, ChevronUp, ExternalLink, Sparkles, AlertTriangle,
  Users, Shield, Save, User, Edit, Wrench, MapPin, Calendar, HardHat
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Customer, PreVisitFormData, ToolCatalogItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { 
  loadPreVisitData, 
  savePreVisitData, 
  completePreVisitPreparation,
  createDebouncedAutoSave 
} from '@/services/previsit-service';
import { 
  calculateFormProgress,
  validatePreVisitForm,
  getSectionCompletionStatus
} from '@/utils/previsit-data-transforms';

interface PreVisitWorkflowEnhancedProps {
  customer: Customer;
  visitId?: string;
  onPhaseComplete: () => void;
  updateCustomerData?: (updates: Partial<Customer>) => void;
  autoSaveEnabled?: boolean;
}

interface WorkflowSection {
  id: string;
  title: string;
  description: string;
  icon: any;
  status: 'complete' | 'in-progress' | 'pending';
  required: boolean;
}

export const PreVisitWorkflowEnhanced = ({ 
  customer, 
  visitId,
  onPhaseComplete, 
  updateCustomerData,
  autoSaveEnabled = true
}: PreVisitWorkflowEnhancedProps) => {
  // State for expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['site-intelligence']));
  
  // State for PreVisit form data
  const [formData, setFormData] = useState<PreVisitFormData>({
    customerId: customer.id!,
    visitId: visitId,
    siteIntelligence: {
      siteNickname: customer.site_nickname || customer.site_name || '',
      systemPlatform: customer.system_platform || '',
      siteNumber: customer.site_number || '',
      primaryTechnicianId: customer.primary_technician_id,
      secondaryTechnicianId: customer.secondary_technician_id,
      primaryTechnicianName: customer.primary_technician_name || '',
      secondaryTechnicianName: customer.secondary_technician_name || '',
      siteExperience: customer.site_experience || 'first_time',
      lastVisitDate: customer.last_visit_date,
      lastVisitBy: customer.last_visit_by,
      handoffNotes: customer.handoff_notes || '',
      knownIssues: customer.known_issues || []
    },
    contactAccess: {
      primaryContact: customer.primary_contact || '',
      contactPhone: customer.contact_phone || '',
      contactEmail: customer.contact_email || '',
      secondaryContactName: customer.secondary_contact_name,
      secondaryContactPhone: customer.secondary_contact_phone,
      pocName: customer.poc_name,
      pocPhone: customer.poc_phone,
      pocAvailableHours: customer.poc_available_hours || '',
      bestArrivalTimes: customer.best_arrival_times || [],
      address: customer.address || '',
      accessApproach: customer.access_approach || '',
      parkingInstructions: customer.parking_instructions || '',
      badgeRequired: customer.badge_required || false,
      escortRequired: customer.escort_required || false,
      ppeRequired: customer.ppe_required || false,
      safetyRequirements: customer.safety_requirements
    },
    documentation: {
      driveFolderUrl: customer.drive_folder_url || '',
      hasSubmittals: customer.has_submittals || false,
      hasFloorPlans: customer.has_floor_plans || false,
      hasAsBuilt: customer.has_as_built || false,
      hasSequence: customer.has_sequence || false,
      hasNetworkDiagram: customer.has_network_diagram || false,
      documentationScore: customer.documentation_score,
      originalTeamContact: customer.original_team_contact || '',
      originalTeamRole: customer.original_team_role || '',
      whenToContactOriginal: customer.when_to_contact_original || ''
    },
    toolPreparation: {
      selectedTools: [],
      additionalToolsNeeded: customer.additional_tools_needed || ''
    },
    checklist: {
      contactConfirmed: false,
      accessPlanReviewed: false,
      credentialsVerified: false,
      toolsLoaded: false,
      notesReviewed: false,
      safetyReviewed: customer.ppe_required || customer.badge_required || false
    }
  });
  
  // Tool catalog and loading state
  const [toolCatalog, setToolCatalog] = useState<ToolCatalogItem[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  
  // Auto-save state
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);
  
  const { toast } = useToast();
  
  // Create debounced auto-save function
  const debouncedAutoSave = useMemo(
    () => createDebouncedAutoSave(customer.id!, 1000),
    [customer.id]
  );
  
  // Load PreVisit data on mount
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingData(true);
        const data = await loadPreVisitData(customer.id!, visitId);
        
        if (data.preparation) {
          // Update form data with loaded preparation data
          setFormData(prev => ({
            ...prev,
            siteIntelligence: {
              ...prev.siteIntelligence,
              ...data.preparation.site_intelligence_data
            },
            contactAccess: {
              ...prev.contactAccess,
              ...data.preparation.contact_access_data
            },
            documentation: {
              ...prev.documentation,
              ...data.preparation.documentation_data
            },
            toolPreparation: {
              ...prev.toolPreparation,
              selectedTools: data.selectedTools?.map(st => st.toolId) || []
            },
            checklist: {
              ...prev.checklist,
              ...data.preparation.checklist_data
            }
          }));
        }
        
        // Set tool catalog with fallback
        setToolCatalog(data.toolCatalog || []);
        
        // Auto-select required tools if no tools selected yet
        if (!data.selectedTools || data.selectedTools.length === 0) {
          if (data.toolCatalog && Array.isArray(data.toolCatalog)) {
            const requiredTools = data.toolCatalog
              .filter(tool => tool.isRequired && (tool.platforms?.length === 0 || tool.platforms?.includes(customer.system_platform || '')))
              .map(tool => tool.id);
            
            setFormData(prev => ({
              ...prev,
              toolPreparation: {
                ...prev.toolPreparation,
                selectedTools: requiredTools
              }
            }));
          }
        }
      } catch (error) {
        console.error('Failed to load PreVisit data:', error);
        toast({
          title: 'Data Load Error',
          description: 'Failed to load preparation data. Using defaults.',
          variant: 'destructive'
        });
      } finally {
        setIsLoadingData(false);
      }
    };
    
    loadData();
  }, [customer.id, visitId, customer.system_platform, toast]);

  // Get filtered tools by category and platform
  const standardTools = useMemo(() => {
    if (!toolCatalog || toolCatalog.length === 0) return [];
    return toolCatalog.filter(tool => 
      tool.category === 'standard' && 
      (tool.platforms?.length === 0 || tool.platforms?.includes(formData.siteIntelligence.systemPlatform))
    );
  }, [toolCatalog, formData.siteIntelligence.systemPlatform]);
  
  const systemSpecificTools = useMemo(() => {
    if (!toolCatalog || toolCatalog.length === 0) return [];
    return toolCatalog.filter(tool => 
      tool.category === 'system_specific' && 
      tool.platforms?.includes(formData.siteIntelligence.systemPlatform)
    );
  }, [toolCatalog, formData.siteIntelligence.systemPlatform]);
  
  const sparePartsTools = useMemo(() => {
    if (!toolCatalog || toolCatalog.length === 0) return [];
    return toolCatalog.filter(tool => tool.category === 'spare_parts');
  }, [toolCatalog]);

  // Define workflow sections with their completion status
  const sections: WorkflowSection[] = [
    {
      id: 'site-intelligence',
      title: 'Site Intelligence Review',
      description: 'Verify and enhance site information',
      icon: Building2,
      status: (formData.siteIntelligence.siteNickname && formData.siteIntelligence.systemPlatform && 
               (formData.siteIntelligence.primaryTechnicianId || formData.siteIntelligence.secondaryTechnicianId)) 
               ? 'complete' : 'in-progress',
      required: true
    },
    {
      id: 'contact-access',
      title: 'Contact & Access Planning',
      description: 'Confirm contact details and plan site access',
      icon: Phone,
      status: (formData.contactAccess.primaryContact && formData.contactAccess.contactPhone && 
               formData.contactAccess.accessApproach) ? 'complete' : 'pending',
      required: true
    },
    {
      id: 'documentation',
      title: 'Project Documentation Review',
      description: 'Locate and verify availability of key documents',
      icon: FileText,
      status: (formData.documentation.driveFolderUrl && (
                formData.documentation.hasSubmittals || formData.documentation.hasFloorPlans ||
                formData.documentation.hasAsBuilt || formData.documentation.hasSequence ||
                formData.documentation.hasNetworkDiagram
               )) ? 'complete' : 'pending',
      required: false
    },
    {
      id: 'tools',
      title: 'Tool Preparation',
      description: 'Select appropriate tools for the visit',
      icon: Package,
      status: formData.toolPreparation.selectedTools.length >= 3 ? 'complete' : 'in-progress',
      required: true
    },
    {
      id: 'checklist',
      title: 'Pre-Visit Checklist',
      description: 'Final preparation steps',
      icon: CheckCircle,
      status: Object.values(formData.checklist).filter(Boolean).length >= 4 ? 'complete' : 'pending',
      required: true
    }
  ];

  // Calculate overall progress
  const calculateProgress = () => {
    const completedSections = sections.filter(s => s.status === 'complete').length;
    return Math.round((completedSections / sections.length) * 100);
  };

  // Update nested form field
  const updateFormSection = (section: keyof PreVisitFormData, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
    
    // Auto-save with debounce (no .catch needed since debounced function doesn't return Promise)
    if (autoSaveEnabled) {
      debouncedAutoSave(formData, visitId);
    }
  };

  // Update tool selection
  const updateToolSelection = (toolId: string, selected: boolean) => {
    setFormData(prev => ({
      ...prev,
      toolPreparation: {
        ...prev.toolPreparation,
        selectedTools: selected 
          ? [...prev.toolPreparation.selectedTools, toolId]
          : prev.toolPreparation.selectedTools.filter(id => id !== toolId)
      }
    }));
  };

  // Update checklist item
  const updateChecklistItem = (item: keyof PreVisitFormData['checklist'], value: boolean) => {
    setFormData(prev => ({
      ...prev,
      checklist: {
        ...prev.checklist,
        [item]: value
      }
    }));
  };

  // Toggle section expansion
  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  // Check if phase can be completed
  const canCompletePhase = () => {
    const requiredSections = sections.filter(s => s.required);
    return requiredSections.every(s => s.status === 'complete');
  };

  // Handle phase completion
  const handlePhaseComplete = async () => {
    if (!canCompletePhase()) {
      toast({
        title: 'Incomplete Preparation',
        description: 'Please complete all required sections before proceeding.',
        variant: 'destructive'
      });
      return;
    }

    try {
      await completePreVisitPreparation(customer.id!, formData);
      toast({
        title: 'Pre-Visit Preparation Complete',
        description: 'All preparation tasks completed. Ready for site visit.'
      });
      onPhaseComplete();
    } catch (error) {
      console.error('Failed to complete preparation:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preparation completion.',
        variant: 'destructive'
      });
    }
  };

  // Save progress manually
  const handleSaveProgress = async () => {
    try {
      setIsSaving(true);
      await savePreVisitData(customer.id!, formData);
      setLastSaveTime(new Date());
      toast({
        title: 'Progress Saved',
        description: 'Your preparation progress has been saved.'
      });
    } catch (error) {
      console.error('Failed to save progress:', error);
      toast({
        title: 'Save Error',
        description: 'Failed to save your progress.',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingData) {
    return (
      <div className="pre-visit-workflow h-full flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading preparation data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pre-visit-workflow h-full flex flex-col">
      {/* Phase Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b">
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold">Phase 1: Pre-Visit Preparation</h1>
          </div>
          <p className="text-muted-foreground">Review and enhance site information to ensure visit success</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Progress value={calculateProgress()} className="w-32" />
            <span className="text-sm font-medium">{calculateProgress()}%</span>
          </div>
          {isSaving && (
            <Badge variant="outline" className="gap-1">
              <Save className="w-3 h-3 animate-pulse" />
              Saving...
            </Badge>
          )}
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="px-6 py-4 space-y-4">
          
          {/* Section 1: Site Intelligence Review */}
          <Card className={cn(
            "workflow-section",
            expandedSections.has('site-intelligence') && "ring-2 ring-primary"
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  <h3 className="font-semibold">Site Intelligence Review</h3>
                  {sections[0].status === 'complete' && (
                    <Badge variant="secondary" className="ml-2">Complete</Badge>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSection('site-intelligence')}
                >
                  {expandedSections.has('site-intelligence') ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {expandedSections.has('site-intelligence') && (
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 xl:grid-cols-3 gap-4">
                  <div>
                    <Label>Site Nickname</Label>
                    <Input 
                      value={formData.siteIntelligence.siteNickname}
                      placeholder="Easy reference name"
                      onChange={(e) => updateFormSection('siteIntelligence', 'siteNickname', e.target.value)}
                    />
                  </div>
                  
                  <div>
                    <Label>System Platform</Label>
                    <Select 
                      value={formData.siteIntelligence.systemPlatform}
                      onValueChange={(value) => updateFormSection('siteIntelligence', 'systemPlatform', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select system type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="N4">Niagara N4</SelectItem>
                        <SelectItem value="FX">Johnson FX</SelectItem>
                        <SelectItem value="WEBs">Honeywell WEBs</SelectItem>
                        <SelectItem value="Mixed-ALC">Mixed ALC</SelectItem>
                        <SelectItem value="EBI-Honeywell">EBI Honeywell</SelectItem>
                        <SelectItem value="Other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Site Number</Label>
                    <Input 
                      value={formData.siteIntelligence.siteNumber}
                      placeholder="AME-2024-###"
                      onChange={(e) => updateFormSection('siteIntelligence', 'siteNumber', e.target.value)}
                    />
                  </div>
                </div>

                <Separator />

                {/* Site Experience */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Your Experience with This Site</Label>
                    <RadioGroup 
                      value={formData.siteIntelligence.siteExperience}
                      onValueChange={(value) => updateFormSection('siteIntelligence', 'siteExperience', value)}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="first_time" id="first_time" />
                        <label htmlFor="first_time" className="text-sm">First time visiting</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="familiar" id="familiar" />
                        <label htmlFor="familiar" className="text-sm">Familiar with site</label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="expert" id="expert" />
                        <label htmlFor="expert" className="text-sm">Site expert</label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label>Last Visit Information</Label>
                    {formData.siteIntelligence.lastVisitDate && (
                      <div className="text-sm space-y-1 mt-2">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{new Date(formData.siteIntelligence.lastVisitDate).toLocaleDateString()}</span>
                        </div>
                        {formData.siteIntelligence.lastVisitBy && (
                          <div className="flex items-center gap-2">
                            <User className="w-4 h-4 text-muted-foreground" />
                            <span>{formData.siteIntelligence.lastVisitBy}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Handoff Notes from Previous Visit</Label>
                  <Textarea 
                    value={formData.siteIntelligence.handoffNotes}
                    placeholder="Important information for next technician..."
                    rows={3}
                    onChange={(e) => updateFormSection('siteIntelligence', 'handoffNotes', e.target.value)}
                    className="font-mono text-sm"
                  />
                </div>

                {formData.siteIntelligence.knownIssues.length > 0 && (
                  <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <AlertTriangle className="w-4 h-4 text-orange-600" />
                      <span className="font-medium text-orange-900">Known Issues</span>
                    </div>
                    <ul className="text-sm text-orange-700 space-y-1">
                      {formData.siteIntelligence.knownIssues.map((issue, idx) => (
                        <li key={idx}>• {issue}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Section 2: Contact & Access Planning */}
          <Card className={cn(
            "workflow-section",
            expandedSections.has('contact-access') && "ring-2 ring-primary"
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  <h3 className="font-semibold">Contact & Access Planning</h3>
                  {sections[1].status === 'complete' && (
                    <Badge variant="secondary" className="ml-2">Complete</Badge>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSection('contact-access')}
                >
                  {expandedSections.has('contact-access') ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {expandedSections.has('contact-access') && (
              <CardContent className="space-y-4">
                {/* Primary Contact */}
                <div className="p-4 border rounded-lg bg-muted/50">
                  <h4 className="font-medium mb-3">Primary Contact</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs">Name</Label>
                      <Input 
                        value={formData.contactAccess.primaryContact}
                        placeholder="Contact name"
                        onChange={(e) => updateFormSection('contactAccess', 'primaryContact', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Phone</Label>
                      <Input 
                        value={formData.contactAccess.contactPhone}
                        placeholder="(555) 123-4567"
                        onChange={(e) => updateFormSection('contactAccess', 'contactPhone', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Email</Label>
                      <Input 
                        value={formData.contactAccess.contactEmail}
                        placeholder="contact@example.com"
                        onChange={(e) => updateFormSection('contactAccess', 'contactEmail', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {/* Access Planning */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Contact Available Hours</Label>
                    <Input 
                      value={formData.contactAccess.pocAvailableHours}
                      placeholder="Mon-Fri 8AM-4PM, best after 9AM"
                      onChange={(e) => updateFormSection('contactAccess', 'pocAvailableHours', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Best Arrival Times</Label>
                    <Input 
                      value={formData.contactAccess.bestArrivalTimes.join(', ')}
                      placeholder="9-10AM, after 2PM"
                      onChange={(e) => updateFormSection('contactAccess', 'bestArrivalTimes', e.target.value.split(', '))}
                    />
                  </div>
                </div>

                <div>
                  <Label>Access Approach</Label>
                  <Textarea 
                    value={formData.contactAccess.accessApproach}
                    placeholder="Call 30 min ahead, meet at loading dock, badge required..."
                    rows={2}
                    onChange={(e) => updateFormSection('contactAccess', 'accessApproach', e.target.value)}
                  />
                </div>

                {/* Access Requirements */}
                <div>
                  <Label>Access Requirements</Label>
                  <div className="grid grid-cols-3 gap-4 mt-2">
                    <label className="flex items-center space-x-2">
                      <Checkbox 
                        checked={formData.contactAccess.badgeRequired}
                        onCheckedChange={(checked) => updateFormSection('contactAccess', 'badgeRequired', checked)}
                      />
                      <span className="text-sm">Badge/ID required</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <Checkbox 
                        checked={formData.contactAccess.escortRequired}
                        onCheckedChange={(checked) => updateFormSection('contactAccess', 'escortRequired', checked)}
                      />
                      <span className="text-sm">Escort required</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <Checkbox 
                        checked={formData.contactAccess.ppeRequired}
                        onCheckedChange={(checked) => updateFormSection('contactAccess', 'ppeRequired', checked)}
                      />
                      <span className="text-sm">PPE required</span>
                    </label>
                  </div>
                </div>

                {formData.contactAccess.safetyRequirements && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Shield className="w-4 h-4 text-red-600" />
                      <span className="font-medium text-red-900">Safety Requirements</span>
                    </div>
                    <p className="text-sm text-red-700">{formData.contactAccess.safetyRequirements}</p>
                  </div>
                )}
              </CardContent>
            )}
          </Card>

          {/* Section 3: Project Documentation */}
          <Card className={cn(
            "workflow-section",
            expandedSections.has('documentation') && "ring-2 ring-primary"
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  <h3 className="font-semibold">Project Documentation Review</h3>
                  {sections[2].status === 'complete' && (
                    <Badge variant="secondary" className="ml-2">Complete</Badge>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSection('documentation')}
                >
                  {expandedSections.has('documentation') ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {expandedSections.has('documentation') && (
              <CardContent className="space-y-4">
                <div>
                  <Label>Project Folder Location</Label>
                  <div className="flex gap-2">
                    <Input 
                      value={formData.documentation.driveFolderUrl}
                      placeholder="SharePoint, Google Drive, or network folder URL"
                      onChange={(e) => updateFormSection('documentation', 'driveFolderUrl', e.target.value)}
                      className="flex-1"
                    />
                    {formData.documentation.driveFolderUrl && (
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.open(formData.documentation.driveFolderUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Open
                      </Button>
                    )}
                  </div>
                </div>

                <div>
                  <Label>Document Availability Check</Label>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    {[
                      { key: 'hasSubmittals', label: 'Equipment Submittals', priority: 'high' },
                      { key: 'hasFloorPlans', label: 'Floor Plans', priority: 'high' },
                      { key: 'hasAsBuilt', label: 'As-Built Drawings', priority: 'medium' },
                      { key: 'hasSequence', label: 'Sequence of Operations', priority: 'medium' },
                      { key: 'hasNetworkDiagram', label: 'Network Diagram', priority: 'low' }
                    ].map(doc => (
                      <label key={doc.key} className="flex items-center space-x-2">
                        <Checkbox 
                          checked={formData.documentation[doc.key as keyof typeof formData.documentation] as boolean}
                          onCheckedChange={(checked) => updateFormSection('documentation', doc.key, checked)}
                        />
                        <span className="text-sm">{doc.label}</span>
                        {doc.priority === 'high' && (
                          <Badge variant="destructive" className="text-xs">Priority</Badge>
                        )}
                      </label>
                    ))}
                  </div>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Section 4: Tool Preparation */}
          <Card className={cn(
            "workflow-section",
            expandedSections.has('tools') && "ring-2 ring-primary"
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  <h3 className="font-semibold">Tool Preparation</h3>
                  {sections[3].status === 'complete' && (
                    <Badge variant="secondary" className="ml-2">Complete</Badge>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSection('tools')}
                >
                  {expandedSections.has('tools') ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {expandedSections.has('tools') && (
              <CardContent className="space-y-4">
                {/* Smart Recommendations */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    <span className="font-medium text-blue-900">
                      Recommendations for {formData.siteIntelligence.systemPlatform || 'this system'}
                    </span>
                  </div>
                  <p className="text-sm text-blue-700">
                    {formData.siteIntelligence.siteExperience === 'first_time' 
                      ? 'Extra diagnostic tools recommended for first-time site visit'
                      : 'Standard tools selected based on system platform'
                    }
                  </p>
                </div>

                {/* Standard Tools */}
                {standardTools.length > 0 && (
                  <div>
                    <Label className="mb-3 flex items-center gap-2">
                      <Wrench className="w-4 h-4" />
                      Standard Tools
                    </Label>
                    <div className="grid grid-cols-2 gap-3">
                      {standardTools.map(tool => (
                        <label key={tool.id} className="flex items-center space-x-2">
                          <Checkbox 
                            checked={formData.toolPreparation.selectedTools.includes(tool.id)}
                            disabled={tool.isRequired}
                            onCheckedChange={(checked) => updateToolSelection(tool.id, checked as boolean)}
                          />
                          <span className="text-sm">{tool.name}</span>
                          {tool.isRequired && (
                            <Badge variant="outline" className="text-xs ml-auto">Required</Badge>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                )}

                {/* System-Specific Tools */}
                {systemSpecificTools.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label className="mb-3">
                        {formData.siteIntelligence.systemPlatform} Specific Tools
                      </Label>
                      <div className="grid grid-cols-2 gap-3">
                        {systemSpecificTools.map(tool => (
                          <label key={tool.id} className="flex items-center space-x-2">
                            <Checkbox 
                              checked={formData.toolPreparation.selectedTools.includes(tool.id)}
                              onCheckedChange={(checked) => updateToolSelection(tool.id, checked as boolean)}
                            />
                            <span className="text-sm">{tool.name}</span>
                            {tool.isRequired && (
                              <Badge variant="outline" className="text-xs ml-auto">Required</Badge>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {/* Spare Parts */}
                {sparePartsTools.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <Label className="mb-3">Spare Parts & Consumables</Label>
                      <div className="grid grid-cols-2 gap-3">
                        {sparePartsTools.map(tool => (
                          <label key={tool.id} className="flex items-center space-x-2">
                            <Checkbox 
                              checked={formData.toolPreparation.selectedTools.includes(tool.id)}
                              onCheckedChange={(checked) => updateToolSelection(tool.id, checked as boolean)}
                            />
                            <span className="text-sm">{tool.name}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <div>
                  <Label>Additional Tools/Parts Notes</Label>
                  <Textarea 
                    value={formData.toolPreparation.additionalToolsNeeded}
                    placeholder="Special tools or parts needed for this site..."
                    rows={2}
                    onChange={(e) => updateFormSection('toolPreparation', 'additionalToolsNeeded', e.target.value)}
                  />
                </div>

                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">Total Tools Selected:</span>
                  <Badge variant="secondary">{formData.toolPreparation.selectedTools.length} items</Badge>
                </div>
              </CardContent>
            )}
          </Card>

          {/* Section 5: Pre-Visit Checklist */}
          <Card className={cn(
            "workflow-section",
            expandedSections.has('checklist') && "ring-2 ring-primary"
          )}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  <h3 className="font-semibold">Pre-Visit Checklist</h3>
                  {sections[4].status === 'complete' && (
                    <Badge variant="secondary" className="ml-2">Complete</Badge>
                  )}
                </div>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => toggleSection('checklist')}
                >
                  {expandedSections.has('checklist') ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </Button>
              </div>
            </CardHeader>
            
            {expandedSections.has('checklist') && (
              <CardContent>
                <div className="space-y-3">
                  {[
                    {
                      key: 'contactConfirmed',
                      task: 'Contact availability confirmed',
                      description: 'Called/verified contact will be available',
                      icon: Phone,
                      required: true
                    },
                    {
                      key: 'accessPlanReviewed',
                      task: 'Site access plan reviewed', 
                      description: 'Know how to get in, where to park, who to meet',
                      icon: MapPin,
                      required: true
                    },
                    {
                      key: 'credentialsVerified',
                      task: 'System credentials verified',
                      description: 'Confirmed login information and network access',
                      icon: Shield,
                      required: true
                    },
                    {
                      key: 'safetyReviewed',
                      task: 'Safety requirements reviewed',
                      description: 'PPE, badges, and safety protocols understood',
                      icon: HardHat,
                      required: true
                    },
                    {
                      key: 'toolsLoaded',
                      task: 'Tools and equipment loaded',
                      description: 'Vehicle loaded with all selected tools',
                      icon: Package,
                      required: true
                    },
                    {
                      key: 'notesReviewed',
                      task: 'Previous visit notes reviewed',
                      description: 'Understand ongoing issues and handoff notes',
                      icon: FileText,
                      required: false
                    }
                  ].map((item) => (
                    <div key={item.key} className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/50">
                      <Checkbox
                        checked={formData.checklist[item.key as keyof PreVisitFormData['checklist']]}
                        onCheckedChange={(checked) => updateChecklistItem(item.key as keyof PreVisitFormData['checklist'], checked as boolean)}
                        className="mt-0.5"
                      />
                      <item.icon className="w-4 h-4 text-muted-foreground mt-0.5" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <label className="text-sm font-medium cursor-pointer">
                            {item.task}
                          </label>
                          {item.required && (
                            <Badge variant="outline" className="text-xs">Required</Badge>
                          )}
                          {formData.checklist[item.key as keyof PreVisitFormData['checklist']] && (
                            <CheckCircle className="w-4 h-4 text-green-500 ml-auto" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{item.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className="fixed bottom-0 left-64 right-0 bg-background border-t px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            {lastSaveTime && `Last saved: ${lastSaveTime.toLocaleTimeString()}`}
            {autoSaveEnabled && ' | Auto-saving enabled'}
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={handleSaveProgress}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Progress
            </Button>
            <Button 
              onClick={handlePhaseComplete}
              disabled={!canCompletePhase()}
              className="bg-green-600 hover:bg-green-700"
            >
              Complete Pre-Visit Preparation
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
