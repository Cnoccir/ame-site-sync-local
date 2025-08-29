import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronLeft, ChevronRight, Save, X, RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { AMEService } from '@/services/ameService';
import { TechnicianService } from '@/services/technicianService';
import { CustomerIdService } from '@/services/customerIdService';
import { DropdownDataService, DropdownOption, GroupedDropdownOption } from '@/services/dropdownDataService';
import { Technician } from '@/types/technician';
import { SimProCustomerSearch } from './SimProCustomerSearch';
import { EnhancedGoogleDriveFolderSearch } from './EnhancedGoogleDriveFolderSearch';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { AMEContactService } from '@/services/ameContactService';
import { RemoteAccessCredentialsManager } from '../remote-access/RemoteAccessCredentialsManager';
import { SystemCredentialsManager } from '../system-access/SystemCredentialsManager';
import { useGoogleDriveAuth } from '@/hooks/useGoogleDriveAuth';
import { FormDataPersistence } from '@/utils/formDataPersistence';
import { GoogleDriveAuthPrompt } from '../GoogleDriveAuthPrompt';
import { FolderSelection } from '../FolderSelection';
import { FolderAssociationService, ExistingFolderMatch } from '@/services/folderAssociationService';
import { EnhancedFolderSelectionDialog } from './EnhancedFolderSelectionDialog';
import { EnhancedProjectFolder } from '@/services/enhancedProjectFolderService';

interface NewCustomerWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onCustomerCreated?: () => void;
  onComplete?: (customerData: CustomerFormData) => void;
  editMode?: {
    isEdit: boolean;
    initialData: any;
    title?: string;
  };
  embedded?: boolean;
}

interface CustomerFormData {
  // Basic Information
  customer_id: string;
  company_name: string;
  site_name: string;
  site_nickname?: string;
  site_address: string;
  service_tier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  system_type: string;
  contract_status: 'Active' | 'Inactive' | 'Pending' | 'Expired';
  building_type: string;
  
  // Enhanced Basic Information
  system_architecture: string;
  primary_bas_platform: string;
  
  // Primary Site Contact
  primary_contact: string;
  contact_phone: string;
  contact_email: string;
  primary_contact_role: string;
  
  // Site Access & Logistics
  access_procedure: string;
  parking_instructions: string;
  equipment_access_notes: string;
  
  // Safety & PPE Requirements
  site_hazards: string[];
  other_hazards_notes: string;
  safety_notes: string;
  
  // Secondary Contact (Optional)
  secondary_contact_name: string;
  secondary_contact_phone: string;
  secondary_contact_email: string;
  secondary_contact_role: string;
  
  // Technician Assignment
  primary_technician_id: string;
  primary_technician_name: string;
  primary_technician_phone: string;
  primary_technician_email: string;
  secondary_technician_id: string;
  secondary_technician_name: string;
  secondary_technician_phone: string;
  secondary_technician_email: string;
  
  // Access & Security
  building_access_type: string;
  building_access_details: string;
  access_hours: string;
  safety_requirements: string;
  ppe_required: boolean;
  badge_required: boolean;
  training_required: boolean;
  
  // System Access - legacy fields kept for backward compatibility
  web_supervisor_url: string;
  workbench_username: string;
  workbench_password: string;
  platform_username: string;
  platform_password: string;
  pc_username?: string;
  pc_password?: string;
  bms_supervisor_ip: string;
  remote_access: boolean;
  remote_access_type: string;
  vpn_required: boolean;
  vpn_details: string;
  different_platform_station_creds: boolean;
  
  // Enhanced credentials system
  access_credentials?: any[];
  system_credentials?: any;
  windows_credentials?: any;
  service_credentials?: any;
  
  // Service Information
  technician_assigned: string;
  service_frequency: string;
  next_due: string;
  last_service: string;
  special_instructions: string;
  
  // Administrative
  account_manager_id: string;
  account_manager_name: string;
  account_manager_phone: string;
  account_manager_email: string;
  escalation_contact: string;
  escalation_phone: string;
  drive_folder_id: string;
  drive_folder_url: string;
}

const initialFormData: CustomerFormData = {
  customer_id: '',
  company_name: '',
  site_name: '',
  site_nickname: '',
  site_address: '',
  service_tier: 'CORE',
  system_type: '',
  contract_status: 'Active',
  building_type: '',
  system_architecture: '',
  primary_bas_platform: '',
  primary_contact: '',
  contact_phone: '',
  contact_email: '',
  primary_contact_role: '',
  access_procedure: '',
  parking_instructions: '',
  equipment_access_notes: '',
  site_hazards: [],
  other_hazards_notes: '',
  safety_notes: '',
  secondary_contact_name: '',
  secondary_contact_phone: '',
  secondary_contact_email: '',
  secondary_contact_role: '',
  primary_technician_id: '',
  primary_technician_name: '',
  primary_technician_phone: '',
  primary_technician_email: '',
  secondary_technician_id: '',
  secondary_technician_name: '',
  secondary_technician_phone: '',
  secondary_technician_email: '',
  building_access_type: '',
  building_access_details: '',
  access_hours: '',
  safety_requirements: '',
  ppe_required: true,
  badge_required: false,
  training_required: false,
  web_supervisor_url: '',
  workbench_username: '',
  workbench_password: '',
  platform_username: '',
  platform_password: '',
  pc_username: '',
  pc_password: '',
  bms_supervisor_ip: '',
  remote_access: false,
  remote_access_type: '',
  vpn_required: false,
  vpn_details: '',
  different_platform_station_creds: false,
  technician_assigned: '',
  service_frequency: '',
  next_due: '',
  last_service: '',
  special_instructions: '',
  account_manager_id: '',
  account_manager_name: '',
  account_manager_phone: '',
  account_manager_email: '',
  escalation_contact: '',
  escalation_phone: '',
  drive_folder_id: '',
  drive_folder_url: ''
};

export const NewCustomerWizard: React.FC<NewCustomerWizardProps> = ({
  isOpen,
  onClose,
  onCustomerCreated,
  onComplete,
  editMode,
  embedded = false
}) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CustomerFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(false);
  const [dropdownData, setDropdownData] = useState<{
    buildingTypes: DropdownOption[];
    systemArchitectures: DropdownOption[];
    basPlatforms: DropdownOption[];
    basPlatformsGrouped: GroupedDropdownOption[];
    contactRoles: DropdownOption[];
    accessMethods: DropdownOption[];
    technicians: DropdownOption[];
  } | null>(null);
  const [technicianOptions, setTechnicianOptions] = useState<any[]>([]);
  const [accountManagerOptions, setAccountManagerOptions] = useState<any[]>([]);
  const [showCloseConfirmation, setShowCloseConfirmation] = useState(false);
  const [showSecondaryContact, setShowSecondaryContact] = useState(false);
  const [selectedHazards, setSelectedHazards] = useState<string[]>([]);
  const [showAuthPrompt, setShowAuthPrompt] = useState(false);
  const [folderSearchResults, setFolderSearchResults] = useState<any[]>([]);
  const [showFolderMigration, setShowFolderMigration] = useState(false);
  const [hasMigrationPlan, setHasMigrationPlan] = useState(false);
  const [folderSelection, setFolderSelection] = useState<any>(null);
  const [showEnhancedFolderDialog, setShowEnhancedFolderDialog] = useState(false);
  const [enhancedFolderResult, setEnhancedFolderResult] = useState<EnhancedProjectFolder | null>(null);
  const { toast } = useToast();
  
  // Google Drive authentication hook
  const googleAuth = useGoogleDriveAuth();

  const totalSteps = 4;
  const FORM_STORAGE_KEY = 'new-customer-wizard-form';
  const STEP_STORAGE_KEY = 'new-customer-wizard-step';

  // Track initialization to prevent re-runs
  const initRef = React.useRef({
    dropdownLoaded: false,
    customerIdGenerated: false,
    formInitialized: false
  });

  // Load dropdown data ONCE when form opens
  useEffect(() => {
    if (isOpen && !initRef.current.dropdownLoaded) {
      initRef.current.dropdownLoaded = true;
      loadDropdownData();
    }
  }, [isOpen]);

  // Initialize form data based on mode - allow re-initialization for edit mode
  useEffect(() => {
    if (!isOpen) return;
    
    if (editMode?.isEdit && editMode.initialData) {
      // Edit mode - always reload data (don't use formInitialized flag)
      console.log('📝 Edit mode: Loading existing customer data', editMode.initialData.customer_id);
      const mappedData = mapDatabaseToFormData(editMode.initialData);
      setFormData({ ...initialFormData, ...mappedData });
      setCurrentStep(1);
      
      // Show secondary contact if data exists
      if (mappedData.secondary_contact_name) {
        setShowSecondaryContact(true);
      }
    } else {
      // New customer mode - only initialize once
      if (initRef.current.formInitialized) return;
      initRef.current.formInitialized = true;
      
      console.log('🆕 New customer mode: Initializing form');
      // Try to restore saved form data
      const savedFormData = FormDataPersistence.restoreFormData(FORM_STORAGE_KEY);
      const savedStep = FormDataPersistence.restoreFormStep(STEP_STORAGE_KEY);
      
      if (savedFormData && Object.keys(savedFormData).length > 0) {
        setFormData({ ...initialFormData, ...savedFormData });
        if (savedStep && savedStep > 1) {
          setCurrentStep(savedStep);
        }
        toast({
          title: "Form Data Restored",
          description: "Your previous progress has been restored.",
        });
      } else {
        // Generate new customer ID for truly new customers
        if (!initRef.current.customerIdGenerated) {
          initRef.current.customerIdGenerated = true;
          generateCustomerId();
        }
      }
    }
  }, [isOpen, editMode?.isEdit, editMode?.initialData?.id]); // Add initialData.id to dependencies

  // Save form data ONLY on explicit step changes or after delay
  // NOT on every single change
  const saveFormData = React.useCallback(() => {
    if (!editMode?.isEdit) {
      FormDataPersistence.saveFormData(FORM_STORAGE_KEY, formData);
      FormDataPersistence.saveFormStep(STEP_STORAGE_KEY, currentStep);
    }
  }, [formData, currentStep, editMode?.isEdit]);

  // Clear persisted data when form is successfully submitted
  const clearPersistedData = () => {
    FormDataPersistence.clearFormData(FORM_STORAGE_KEY);
    localStorage.removeItem(`ame_form_data_${STEP_STORAGE_KEY}`);
    console.log('🗑️ Cleared all form persistence data');
  };

  // Initialize selected hazards when form data changes
  useEffect(() => {
    if (formData.site_hazards && Array.isArray(formData.site_hazards)) {
      setSelectedHazards(formData.site_hazards);
    }
  }, [formData.site_hazards]);

  // Map database fields to form data structure
  const mapDatabaseToFormData = (databaseRecord: any): Partial<CustomerFormData> => {
    console.log('🔄 Mapping database record to form data:', databaseRecord);
    
    // Convert site_hazards from text/string to array if needed
    let siteHazards: string[] = [];
    if (databaseRecord.site_hazards) {
      if (typeof databaseRecord.site_hazards === 'string') {
        try {
          siteHazards = JSON.parse(databaseRecord.site_hazards);
        } catch {
          siteHazards = databaseRecord.site_hazards.split(/[,\n]/).map((h: string) => h.trim()).filter(Boolean);
        }
      } else if (Array.isArray(databaseRecord.site_hazards)) {
        siteHazards = databaseRecord.site_hazards;
      }
    }
    
    // Handle date fields - ensure they're in YYYY-MM-DD format for form inputs
    const formatDateForInput = (dateValue: any) => {
      if (!dateValue) return '';
      try {
        const date = new Date(dateValue);
        return date.toISOString().split('T')[0];
      } catch {
        return '';
      }
    };
    
    // Direct field mapping with proper handling
    const mappedData: Partial<CustomerFormData> = {
      customer_id: databaseRecord.customer_id || '',
      company_name: databaseRecord.company_name || '',
      site_name: databaseRecord.site_name || '',
      site_nickname: databaseRecord.site_nickname || '',
      site_address: databaseRecord.site_address || '',
      service_tier: databaseRecord.service_tier || 'CORE',
      system_type: databaseRecord.system_type || '',
      contract_status: databaseRecord.contract_status || 'Active',
      building_type: databaseRecord.building_type || '',
      system_architecture: databaseRecord.system_architecture || '',
      primary_bas_platform: databaseRecord.primary_bas_platform || '',
      
      // Primary Contact
      primary_contact: databaseRecord.primary_contact || '',
      contact_phone: databaseRecord.contact_phone || '',
      contact_email: databaseRecord.contact_email || '',
      primary_contact_role: databaseRecord.primary_contact_role || '',
      
      // Site Access & Logistics
      access_procedure: databaseRecord.access_procedure || '',
      parking_instructions: databaseRecord.parking_instructions || '',
      equipment_access_notes: databaseRecord.equipment_access_notes || '',
      
      // Safety & PPE
      site_hazards: siteHazards,
      other_hazards_notes: databaseRecord.other_hazards_notes || '',
      safety_notes: databaseRecord.safety_notes || '',
      ppe_required: databaseRecord.ppe_required ?? true,
      badge_required: databaseRecord.badge_required ?? false,
      training_required: databaseRecord.training_required ?? false,
      
      // Secondary Contact
      secondary_contact_name: databaseRecord.secondary_contact_name || databaseRecord.emergency_contact || '',
      secondary_contact_phone: databaseRecord.secondary_contact_phone || databaseRecord.emergency_phone || '',
      secondary_contact_email: databaseRecord.secondary_contact_email || databaseRecord.emergency_email || '',
      secondary_contact_role: databaseRecord.secondary_contact_role || '',
      
      // Technician Assignment
      primary_technician_id: databaseRecord.primary_technician_id || '',
      primary_technician_name: databaseRecord.primary_technician_name || '',
      primary_technician_phone: databaseRecord.primary_technician_phone || '',
      primary_technician_email: databaseRecord.primary_technician_email || '',
      secondary_technician_id: databaseRecord.secondary_technician_id || '',
      secondary_technician_name: databaseRecord.secondary_technician_name || '',
      secondary_technician_phone: databaseRecord.secondary_technician_phone || '',
      secondary_technician_email: databaseRecord.secondary_technician_email || '',
      
      // System Access
      building_access_type: databaseRecord.building_access_type || '',
      building_access_details: databaseRecord.building_access_details || '',
      access_hours: databaseRecord.access_hours || '',
      safety_requirements: databaseRecord.safety_requirements || '',
      web_supervisor_url: databaseRecord.web_supervisor_url || '',
      workbench_username: databaseRecord.workbench_username || '',
      workbench_password: databaseRecord.workbench_password || '',
      platform_username: databaseRecord.platform_username || '',
      platform_password: databaseRecord.platform_password || '',
      pc_username: databaseRecord.pc_username || '',
      pc_password: databaseRecord.pc_password || '',
      bms_supervisor_ip: databaseRecord.bms_supervisor_ip ? String(databaseRecord.bms_supervisor_ip) : '',
      remote_access: databaseRecord.remote_access ?? false,
      remote_access_type: databaseRecord.remote_access_type || '',
      vpn_required: databaseRecord.vpn_required ?? false,
      vpn_details: databaseRecord.vpn_details || '',
      different_platform_station_creds: databaseRecord.different_platform_station_creds ?? false,
      
      // Service Information
      technician_assigned: databaseRecord.technician_assigned || '',
      service_frequency: databaseRecord.service_frequency || '',
      next_due: formatDateForInput(databaseRecord.next_due),
      last_service: formatDateForInput(databaseRecord.last_service),
      special_instructions: databaseRecord.special_instructions || '',
      
      // Administrative
      account_manager_id: databaseRecord.account_manager_id || '',
      account_manager_name: databaseRecord.account_manager_name || databaseRecord.account_manager || '',
      account_manager_phone: databaseRecord.account_manager_phone || '',
      account_manager_email: databaseRecord.account_manager_email || '',
      escalation_contact: databaseRecord.escalation_contact || '',
      escalation_phone: databaseRecord.escalation_phone || '',
      drive_folder_id: databaseRecord.drive_folder_id || '',
      drive_folder_url: databaseRecord.drive_folder_url || ''
    };
    
    // CRITICAL: Load existing credentials for edit mode
    // First try to load structured credentials if they exist
    mappedData.access_credentials = databaseRecord.access_credentials || [];
    mappedData.system_credentials = databaseRecord.system_credentials || null;
    mappedData.windows_credentials = databaseRecord.windows_credentials || null;
    mappedData.service_credentials = databaseRecord.service_credentials || null;
    
    // If no structured credentials exist, fall back to loading from legacy fields
    if (!mappedData.access_credentials || mappedData.access_credentials.length === 0) {
      if (databaseRecord.has_remote_access_credentials || databaseRecord.remote_access) {
        // Create initial remote access credentials from legacy data if available
        const remoteCredentials = [];
        if (databaseRecord.remote_access_type || databaseRecord.vpn_required) {
          remoteCredentials.push({
            vendor: databaseRecord.remote_access_type || 'Remote Access',
            connection_type: databaseRecord.vpn_required ? 'VPN' : 'Direct',
            vpn_required: databaseRecord.vpn_required || false,
            vpn_details: databaseRecord.vpn_details || '',
            is_active: true
          });
        }
        mappedData.access_credentials = remoteCredentials;
      }
    }
    
    // Load BMS credentials from legacy fields if not already loaded
    if (!mappedData.system_credentials) {
      if (databaseRecord.has_bms_credentials || databaseRecord.platform_username || databaseRecord.bms_supervisor_ip) {
        mappedData.system_credentials = {
          system_type: 'tridium_n4' as const,
          platform_host: databaseRecord.bms_supervisor_ip || '',
          platform_port: 4911,
          platform_username: databaseRecord.platform_username || '',
          platform_password: databaseRecord.platform_password || '',
          station_username: databaseRecord.workbench_username || databaseRecord.platform_username || '',
          station_password: databaseRecord.workbench_password || databaseRecord.platform_password || '',
          same_credentials: (databaseRecord.workbench_username || '') === (databaseRecord.platform_username || '')
        };
      }
    }
    
    // Load Windows credentials from legacy fields if not already loaded
    if (!mappedData.windows_credentials) {
      if (databaseRecord.has_windows_credentials || databaseRecord.pc_username) {
        mappedData.windows_credentials = {
          computer_name: databaseRecord.computer_name || '',
          local_admin_username: databaseRecord.pc_username || '',
          local_admin_password: databaseRecord.pc_password || ''
        };
      }
    }
    
    // Load service credentials if not already loaded
    if (!mappedData.service_credentials && databaseRecord.has_service_credentials) {
      mappedData.service_credentials = {
        custom_services: []
      };
    }
    
    console.log('✅ Mapped data result with enhanced fields and credentials:', {
      ...mappedData,
      hasCredentialFlags: {
        has_bms_credentials: databaseRecord.has_bms_credentials,
        has_windows_credentials: databaseRecord.has_windows_credentials,
        has_service_credentials: databaseRecord.has_service_credentials,
        has_remote_access_credentials: databaseRecord.has_remote_access_credentials
      },
      loadedCredentials: {
        access: mappedData.access_credentials?.length || 0,
        system: !!mappedData.system_credentials,
        windows: !!mappedData.windows_credentials,
        service: !!mappedData.service_credentials
      }
    });
    return mappedData;
  };

  const loadDropdownData = async () => {
    try {
      setIsLoadingDropdowns(true);
      console.log('Loading dropdown data...');
      
      const [data, technicians, accountManagers] = await Promise.all([
        DropdownDataService.getCachedDropdownData(),
        AMEContactService.getTechnicians(),
        AMEContactService.getAccountManagers()
      ]);
      
      console.log('Dropdown data loaded:', data);
      console.log('Technicians loaded:', technicians);
      
      setDropdownData(data);
      
      if (!technicians || technicians.length === 0) {
        console.warn('No technicians found in database');
        toast({
          title: "Warning",
          description: "No technicians found. Please check database connection.",
          variant: "destructive",
        });
        setTechnicianOptions([]);
        return;
      }
      
      // Format technicians for SearchableCombobox
      const formattedTechnicians = technicians.map(tech => ({
        id: tech.id,
        name: tech.name,
        description: `${(tech as any)?.phone ? `📱 ${(tech as any).phone}` : ''}${(tech as any)?.email ? ` 📧 ${(tech as any).email}` : ''}${(tech as any)?.extension ? ` ☎️ Ext: ${(tech as any).extension}` : ''}`.trim(),
        subtitle: tech.role || 'Technician',
        phone: tech.phone,
        email: tech.email,
        extension: (tech as any)?.extension,
        direct_line: (tech as any)?.direct_line
      }));
      
      console.log('Formatted technicians:', formattedTechnicians);
      setTechnicianOptions(formattedTechnicians);
      
      // Format account managers for SearchableCombobox
      const formattedAccountManagers = accountManagers.map(mgr => ({
        id: mgr.id,
        name: mgr.name,
        description: `${mgr.phone ? `📱 ${mgr.phone}` : ''}${mgr.email ? ` 📧 ${mgr.email}` : ''}`.trim(),
        subtitle: mgr.role || 'Account Manager',
        phone: mgr.phone,
        email: mgr.email
      }));
      
      console.log('Formatted account managers:', formattedAccountManagers);
      setAccountManagerOptions(formattedAccountManagers);
      
      toast({
        title: "Success",
        description: `Loaded ${technicians.length} technicians and ${accountManagers.length} account managers successfully`,
      });
      
    } catch (error) {
      console.error('Error loading dropdown data:', error);
      toast({
        title: "Error",
        description: `Failed to load data: ${error.message}. Please check your connection.`,
        variant: "destructive",
      });
    } finally {
      setIsLoadingDropdowns(false);
    }
  };

  const generateCustomerId = async () => {
    try {
      const customerId = await CustomerIdService.generateNextCustomerId();
      updateFormData('customer_id', customerId);
    } catch (error) {
      console.error('Error generating customer ID:', error);
      // Fallback to manual entry if auto-generation fails
    }
  };

  const updateFormData = (field: keyof CustomerFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleTechnicianSelection = (technicianId: string, isPrimary: boolean = true) => {
    const selectedTech = technicianOptions.find(tech => tech.id === technicianId);
    if (selectedTech) {
      if (isPrimary) {
        updateFormData('primary_technician_id', technicianId);
        updateFormData('primary_technician_name', selectedTech.name);
        updateFormData('primary_technician_phone', selectedTech.phone || '');
        updateFormData('primary_technician_email', selectedTech.email || '');
      } else {
        updateFormData('secondary_technician_id', technicianId);
        updateFormData('secondary_technician_name', selectedTech.name);
        updateFormData('secondary_technician_phone', selectedTech.phone || '');
        updateFormData('secondary_technician_email', selectedTech.email || '');
      }
    }
  };

  const handleAccountManagerSelection = (managerId: string) => {
    const selectedMgr = accountManagerOptions.find(mgr => mgr.id === managerId);
    if (selectedMgr) {
      updateFormData('account_manager_id', managerId);
      updateFormData('account_manager_name', selectedMgr.name);
      updateFormData('account_manager_phone', selectedMgr.phone || '');
      updateFormData('account_manager_email', selectedMgr.email || '');
    }
  };

  const handleHazardChange = (hazard: string, checked: boolean) => {
    const newHazards = checked 
      ? [...selectedHazards, hazard]
      : selectedHazards.filter(h => h !== hazard);
    setSelectedHazards(newHazards);
    updateFormData('site_hazards', newHazards);
  };

  const handleSimProAutofill = (autofillData: Partial<CustomerFormData>) => {
    setFormData(prev => ({ ...prev, ...autofillData }));
  };

  const handleGoogleDriveFolder = (folderId: string, folderUrl: string, folderStructure?: any) => {
    updateFormData('drive_folder_id', folderId);
    updateFormData('drive_folder_url', folderUrl);
    // Store the folder structure information if provided
    if (folderStructure) {
      // You can store this in a separate field if needed
      console.log('Folder structure created:', folderStructure);
    }
  };

  const handleFolderSearchResults = (searchResults: any) => {
    console.log('Received folder search results:', searchResults);
    
    // Extract the existingFolders array from CustomerSearchResult
    const results = searchResults.existingFolders || [];
    
    // Convert to ExistingFolderMatch format
    const convertedResults: ExistingFolderMatch[] = results.map((result: any) => ({
      folderId: result.folderId,
      folderName: result.folderName,
      folderUrl: result.webViewLink || `https://drive.google.com/drive/folders/${result.folderId}`,
      matchScore: result.matchScore || 0.5,
      matchType: result.matchType as 'exact' | 'partial' | 'fuzzy',
      confidence: result.confidence as 'high' | 'medium' | 'low',
      parentFolderId: result.parentFolder,
      parentFolderName: result.parentFolderType,
      lastModified: result.lastModified,
      fileCount: result.fileCount
    }));
    
    setFolderSearchResults(convertedResults);
    
    // Open selection dialog only once per wizard session
    if (convertedResults.length > 0 && !showFolderMigration && !hasMigrationPlan) {
      setShowFolderMigration(true);
    }
  };

  const handleFolderSelectionComplete = async (selection: {
    associationType: 'use_existing' | 'create_new' | 'link_both';
    existingFolder?: ExistingFolderMatch;
    notes?: string;
  }) => {
    console.log('Folder selection completed:', selection);
    setShowFolderMigration(false);

    // Remember final plan for post-create processing
    setFolderSelection(selection);
    setHasMigrationPlan(true);

    // If the user chose to use an existing folder (or link both), reflect that immediately in the form
    if (selection.existingFolder && (selection.associationType === 'use_existing' || selection.associationType === 'link_both')) {
      updateFormData('drive_folder_id', selection.existingFolder.folderId);
      updateFormData('drive_folder_url', selection.existingFolder.folderUrl);
    }

    toast({
      title: 'Folder Selection Saved',
      description: selection.associationType === 'create_new'
        ? 'A new structured project folder will be created after the customer is saved.'
        : selection.associationType === 'use_existing'
          ? 'The selected existing folder will be linked to this customer.'
          : 'A new structured folder will be created and the selected existing folder will be linked.'
    });
  };

  const handleFolderSelectionCancel = () => {
    setShowFolderMigration(false);
    // User can still proceed without selection
  };

  const handleFolderStructureCreated = (structure: any) => {
    console.log('New structured folder created:', structure);
    // Optional: show success notification
    toast({
      title: 'Project Folder Created',
      description: `Structured project folder created with ${Object.keys(structure.subfolders).length} subfolders.`,
    });
  };

  // Enhanced folder dialog handlers
  const handleEnhancedFolderDialogComplete = (result: EnhancedProjectFolder) => {
    console.log('✅ Enhanced folder setup completed:', result);
    setEnhancedFolderResult(result);
    
    // Update form data with folder information
    updateFormData('drive_folder_id', result.mainFolderId);
    updateFormData('drive_folder_url', result.mainFolderUrl);
    
    setShowEnhancedFolderDialog(false);
    
    toast({
      title: 'Project Folder Setup Complete',
      description: `Successfully ${result.isNewlyCreated ? 'created' : 'linked'} project folder with ${result.associatedFolders.length} associated folder${result.associatedFolders.length > 1 ? 's' : ''}.`,
    });
  };

  const handleEnhancedFolderDialogError = (error: string) => {
    console.error('❌ Enhanced folder setup failed:', error);
    setShowEnhancedFolderDialog(false);
    
    // Show user-friendly error message
    toast({
      title: 'Folder Setup Failed',
      description: `Failed to set up project folder: ${error}. You can set up the folder manually later.`,
      variant: 'destructive',
    });
    
    // Optionally fall back to legacy folder selection dialog if available
    console.log('Enhanced folder setup failed, proceeding without folder setup');
  };

  const openEnhancedFolderDialog = () => {
    if (!formData.company_name || !formData.customer_id) {
      toast({
        title: 'Missing Information',
        description: 'Please provide company name and customer ID before setting up project folders.',
        variant: 'destructive',
      });
      return;
    }
    setShowEnhancedFolderDialog(true);
  };

  const nextStep = () => {
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      saveFormData(); // Save on step change
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      saveFormData(); // Save on step change
    }
  };

  const resetForm = () => {
    setFormData(initialFormData);
    setCurrentStep(1);
    setSelectedHazards([]);
    setShowSecondaryContact(false);
    setFolderSelection(null);
    setHasMigrationPlan(false);
    setShowFolderMigration(false);
    setFolderSearchResults([]);
    
    // Reset initialization flags
    initRef.current = {
      dropdownLoaded: false,
      customerIdGenerated: false,
      formInitialized: false
    };
    
    clearPersistedData();
    console.log('🔄 Form completely reset to initial state');
  };

  const handleClose = () => {
    // Check if form has any data before closing
    const hasData = Object.values(formData).some(value => {
      if (typeof value === 'boolean') return false; // Ignore boolean defaults
      if (typeof value === 'string') return value.trim() !== '';
      return value !== null && value !== undefined;
    });
    
    if (hasData && !isSubmitting) {
      setShowCloseConfirmation(true);
    } else {
      resetForm();
      onClose();
    }
  };
  
  const confirmClose = () => {
    setShowCloseConfirmation(false);
    resetForm();
    onClose();
  };
  
  const cancelClose = () => {
    setShowCloseConfirmation(false);
  };

  // Prepare form data for database with enhanced credential system
  const prepareFormDataForDatabase = (formData: CustomerFormData) => {
    console.log('🔄 Preparing enhanced form data for database with credentials:', formData);
    
    // Create a clean copy of form data - preserve ALL fields
    const cleanedData: any = {};
    
    // Explicitly copy ALL fields to ensure nothing is lost
    Object.keys(formData).forEach((key) => {
      const value = (formData as any)[key];
      
      // Skip credential fields - they will be handled separately
      if (['system_credentials', 'windows_credentials', 'service_credentials', 'access_credentials'].includes(key)) {
        return; // Skip - will be added to credentials object
      }
      
      // Always include the field, even if empty string, but skip undefined/null
      if (value !== undefined && value !== null) {
        // Special handling for site_hazards array
        if (key === 'site_hazards' && Array.isArray(value)) {
          cleanedData[key] = value.join(', ');
        } else {
          cleanedData[key] = value;
        }
      } else if (value === '' || value === false || value === 0) {
        // Preserve empty strings, false booleans, and zeros
        cleanedData[key] = value;
      }
    });
    
    // Ensure all text fields have at least empty string (not null)
    const textFields = [
      'customer_id', 'company_name', 'site_name', 'site_nickname', 'site_address',
      'system_type', 'building_type', 'system_architecture', 'primary_bas_platform',
      'primary_contact', 'contact_phone', 'contact_email', 'primary_contact_role',
      'access_procedure', 'parking_instructions', 'equipment_access_notes',
      'other_hazards_notes', 'safety_notes',
      'secondary_contact_name', 'secondary_contact_phone', 'secondary_contact_email', 'secondary_contact_role',
      'primary_technician_name', 'primary_technician_phone', 'primary_technician_email',
      'secondary_technician_name', 'secondary_technician_phone', 'secondary_technician_email',
      'building_access_type', 'building_access_details', 'access_hours', 'safety_requirements',
      'web_supervisor_url', 'workbench_username', 'workbench_password',
      'platform_username', 'platform_password', 'pc_username', 'pc_password',
      'bms_supervisor_ip', 'remote_access_type', 'vpn_details',
      'technician_assigned', 'service_frequency', 'special_instructions',
      'account_manager_name', 'account_manager_phone', 'account_manager_email',
      'escalation_contact', 'escalation_phone',
      'drive_folder_id', 'drive_folder_url'
    ];
    
    textFields.forEach(field => {
      if (!(field in cleanedData)) {
        cleanedData[field] = '';
      }
    });
    
    // Handle JSON fields properly
    if (formData.equipment_locations && typeof formData.equipment_locations === 'string') {
      try {
        cleanedData.equipment_locations = JSON.parse(formData.equipment_locations);
      } catch {
        cleanedData.equipment_locations = [];
      }
    } else if (Array.isArray(formData.equipment_locations)) {
      cleanedData.equipment_locations = formData.equipment_locations;
    } else {
      cleanedData.equipment_locations = [];
    }
    
    // Ensure boolean fields are properly set
    const booleanFields = [
      'ppe_required', 'badge_required', 'training_required',
      'remote_access', 'vpn_required', 'different_platform_station_creds', 'service_address_different'
    ];
    
    booleanFields.forEach(field => {
      if (typeof cleanedData[field] !== 'boolean') {
        // Set defaults based on field
        cleanedData[field] = field === 'ppe_required' ? true : false;
      }
    });
    
    // Ensure required fields have values
    if (!cleanedData.service_tier) {
      cleanedData.service_tier = 'CORE';
    }
    if (!cleanedData.contract_status) {
      cleanedData.contract_status = 'Active';
    }
    
    // Prepare enhanced credentials object
    const credentials = {
      system_credentials: formData.system_credentials || null,
      windows_credentials: formData.windows_credentials || null,
      service_credentials: formData.service_credentials || null,
      access_credentials: formData.access_credentials || null
    };
    
    // Only add credentials if they exist
    if (Object.values(credentials).some(cred => cred && (Array.isArray(cred) ? cred.length > 0 : Object.keys(cred).length > 0))) {
      cleanedData.system_credentials = credentials.system_credentials;
      cleanedData.windows_credentials = credentials.windows_credentials;
      cleanedData.service_credentials = credentials.service_credentials;
      cleanedData.access_credentials = credentials.access_credentials;
    }
    
    // Remove any UI-only fields that don't exist in database
    delete cleanedData.id; // Will be generated by database
    
    // Set timestamp
    cleanedData.updated_at = new Date().toISOString();
    
    console.log('✅ Prepared enhanced form data for database:');
    console.log('   - Total fields:', Object.keys(cleanedData).length);
    console.log('   - Has credentials:', Object.values(credentials).some(c => c != null));
    console.log('   - Equipment locations:', cleanedData.equipment_locations);
    
    return cleanedData;
  };

  const handleSubmit = async () => {
    try {
      setIsSubmitting(true);
      
      // Validate required fields before submission
      if (!formData.customer_id || !formData.company_name || !formData.site_name) {
        toast({
          title: "Validation Error",
          description: "Please fill in all required fields: Customer ID, Company Name, and Site Name",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      // Prepare form data for database - ensure ALL fields are included
      const cleanedFormData = prepareFormDataForDatabase(formData);
      
      console.log('📤 Submitting form data to database');
      console.log('   - Total fields:', Object.keys(cleanedFormData).length);
      console.log('   - Customer ID:', cleanedFormData.customer_id);
      console.log('   - Company:', cleanedFormData.company_name);
      console.log('   - Full payload:', JSON.stringify(cleanedFormData, null, 2));
      
      if (editMode?.isEdit) {
        // Edit mode - call completion callback with cleaned data
        if (onComplete) {
          onComplete(cleanedFormData);
        }
        handleClose();
      } else {
        // Create mode - create new customer with enhanced credential system
        console.log('📤 Submitting to enhanced AMEService.createCustomer with credentials');
        
        const createdCustomer = await AMEService.createCustomer(cleanedFormData);
        
        console.log('✅ Customer created successfully with enhanced schema:', {
          customerId: createdCustomer.id,
          companyName: createdCustomer.company_name,
          hasCredentials: !!(createdCustomer.has_bms_credentials || createdCustomer.has_windows_credentials)
        });
        
        // Clear persisted data on successful submission
        clearPersistedData();
        
        toast({
          title: "Success",
          description: "Customer created successfully with all information and credentials saved",
        });
        
        if (onCustomerCreated) {
          onCustomerCreated();
        }
        
        // Reset form state
        setFormData(initialFormData);
        
        handleClose();
      }
    } catch (error: any) {
      console.error('❌ Error processing customer data:', error);
      
      // Provide more detailed error messages
      let errorMessage = "Failed to create customer";
      if (error?.message) {
        errorMessage += ": " + error.message;
      }
      if (error?.details) {
        console.error('Error details:', error.details);
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-6">
      {/* SimPro Customer Search */}
      <SimProCustomerSearch
        onAutofill={handleSimProAutofill}
        currentCompanyName={formData.company_name}
        disabled={isSubmitting}
      />
      
      {/* Divider */}
      <div className="border-t border-gray-200 my-6" />
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="customer_id">Customer ID *</Label>
          <Input
            id="customer_id"
            value={formData.customer_id}
            onChange={(e) => updateFormData('customer_id', e.target.value)}
            placeholder="e.g., AME001"
          />
        </div>
        <div>
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => updateFormData('company_name', e.target.value)}
            placeholder="Company Name"
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="site_name">Site Name *</Label>
          <Input
            id="site_name"
            value={formData.site_name}
            onChange={(e) => updateFormData('site_name', e.target.value)}
            placeholder="Building/Site Name"
          />
        </div>
        <div>
          <Label htmlFor="site_nickname">Site Nickname/Alias</Label>
          <Input
            id="site_nickname"
            value={formData.site_nickname}
            onChange={(e) => updateFormData('site_nickname', e.target.value)}
            placeholder="Short name or alias for easy search"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Helps with Google Drive folder search and internal references
          </div>
        </div>
        <div>
          <Label htmlFor="building_type">Building Type</Label>
          <Select value={formData.building_type} onValueChange={(value) => updateFormData('building_type', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select building type" />
            </SelectTrigger>
            <SelectContent>
              {dropdownData?.buildingTypes?.map((type) => (
                <SelectItem key={type.id} value={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="site_address">Site Address *</Label>
        <Textarea
          id="site_address"
          value={formData.site_address}
          onChange={(e) => updateFormData('site_address', e.target.value)}
          placeholder="Full address including city, state, zip"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="service_tier">Service Tier *</Label>
          <Select value={formData.service_tier} onValueChange={(value) => updateFormData('service_tier', value)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="CORE">CORE</SelectItem>
              <SelectItem value="ASSURE">ASSURE</SelectItem>
              <SelectItem value="GUARDIAN">GUARDIAN</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="primary_bas_platform">Primary BAS Platform *</Label>
          <Select value={formData.primary_bas_platform} onValueChange={(value) => updateFormData('primary_bas_platform', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Select BAS platform" />
            </SelectTrigger>
            <SelectContent>
              {dropdownData?.basPlatformsGrouped?.map((group) => (
                <div key={group.category}>
                  <div className="px-2 py-1 text-sm font-semibold text-muted-foreground">{group.category}</div>
                  {group.options.map((platform) => (
                    <SelectItem key={platform.id} value={platform.name} className="pl-6">
                      {platform.name}
                    </SelectItem>
                  ))}
                </div>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="system_type">Version *</Label>
          <Input
            id="system_type"
            value={formData.system_type}
            onChange={(e) => updateFormData('system_type', e.target.value)}
            placeholder="e.g., N4.12, AX3.8, Metasys 11.0.2, EBI R800.1"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Enter the specific version number for the selected platform
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="system_architecture">Server Architecture</Label>
        <Select value={formData.system_architecture} onValueChange={(value) => updateFormData('system_architecture', value)}>
          <SelectTrigger>
            <SelectValue placeholder="Select server architecture" />
          </SelectTrigger>
          <SelectContent>
            {dropdownData?.systemArchitectures?.map((arch) => (
              <SelectItem key={arch.id} value={arch.name}>
                {arch.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="contract_status">Contract Status</Label>
        <Select value={formData.contract_status} onValueChange={(value) => updateFormData('contract_status', value)}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Active">Active</SelectItem>
            <SelectItem value="Inactive">Inactive</SelectItem>
            <SelectItem value="Pending">Pending</SelectItem>
            <SelectItem value="Expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderStep2 = () => {
    const siteHazardOptions = [
      'Arc flash gear required',
      'Fall protection required',
      'Confined space protocols',
      'Asbestos awareness required', 
      'High noise areas',
      'Chemical hazards present',
      'Other hazards'
    ];

    return (
      <div className="space-y-6">
        {/* Primary Site Contact */}
        <div>
          <h4 className="font-semibold text-foreground mb-3">Primary Site Contact</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="primary_contact">Contact Name *</Label>
              <Input
                id="primary_contact"
                value={formData.primary_contact}
                onChange={(e) => updateFormData('primary_contact', e.target.value)}
                placeholder="John Smith"
              />
            </div>
            <div>
              <Label htmlFor="primary_contact_role">Role/Title *</Label>
              <Select value={formData.primary_contact_role} onValueChange={(value) => updateFormData('primary_contact_role', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select contact role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Facilities Manager">Facilities Manager</SelectItem>
                  <SelectItem value="Plant Engineer">Plant Engineer</SelectItem>
                  <SelectItem value="Maintenance Supervisor">Maintenance Supervisor</SelectItem>
                  <SelectItem value="IT Manager">IT Manager</SelectItem>
                  <SelectItem value="Property Manager">Property Manager</SelectItem>
                  <SelectItem value="Building Engineer">Building Engineer</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <Label htmlFor="contact_phone">Direct Phone *</Label>
              <Input
                id="contact_phone"
                value={formData.contact_phone}
                onChange={(e) => updateFormData('contact_phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
            <div>
              <Label htmlFor="contact_email">Email *</Label>
              <Input
                id="contact_email"
                type="email"
                value={formData.contact_email}
                onChange={(e) => updateFormData('contact_email', e.target.value)}
                placeholder="john.smith@company.com"
              />
            </div>
          </div>
        </div>

        {/* Site Access & Security */}
        <div>
          <h4 className="font-semibold text-foreground mb-3">Site Access & Security</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="access_procedure">Access Procedure *</Label>
              <Select value={formData.access_procedure} onValueChange={(value) => updateFormData('access_procedure', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select access procedure" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Walk-in (No restrictions)">Walk-in (No restrictions)</SelectItem>
                  <SelectItem value="Check in at front desk">Check in at front desk</SelectItem>
                  <SelectItem value="Call contact for escort">Call contact for escort</SelectItem>
                  <SelectItem value="Keycard/FOB required">Keycard/FOB required</SelectItem>
                  <SelectItem value="Security escort required">Security escort required</SelectItem>
                  <SelectItem value="After-hours access available">After-hours access available</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="access_hours">Access Hours</Label>
              <Input
                id="access_hours"
                value={formData.access_hours}
                onChange={(e) => updateFormData('access_hours', e.target.value)}
                placeholder="8:00 AM - 5:00 PM, Weekdays only"
              />
            </div>
          </div>
          
          <div className="mt-4">
            <Label htmlFor="parking_instructions">Parking & Access Instructions</Label>
            <Textarea
              id="parking_instructions"
              value={formData.parking_instructions}
              onChange={(e) => updateFormData('parking_instructions', e.target.value)}
              placeholder="Parking location, building entry, equipment access notes..."
              rows={3}
            />
          </div>
        </div>

        {/* Safety Requirements */}
        <div>
          <h4 className="font-semibold text-foreground mb-3">Safety & PPE Requirements</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="ppe_required"
                checked={formData.ppe_required}
                onCheckedChange={(checked) => updateFormData('ppe_required', checked)}
              />
              <Label htmlFor="ppe_required">PPE Required</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="badge_required"
                checked={formData.badge_required}
                onCheckedChange={(checked) => updateFormData('badge_required', checked)}
              />
              <Label htmlFor="badge_required">Badge/ID Required</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="training_required"
                checked={formData.training_required}
                onCheckedChange={(checked) => updateFormData('training_required', checked)}
              />
              <Label htmlFor="training_required">Special Training Required</Label>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            {siteHazardOptions.map((hazard) => (
              <div key={hazard} className="flex items-center space-x-2">
                <Checkbox
                  id={`hazard_${hazard}`}
                  checked={selectedHazards.includes(hazard)}
                  onCheckedChange={(checked) => handleHazardChange(hazard, !!checked)}
                />
                <Label htmlFor={`hazard_${hazard}`} className="text-sm">{hazard}</Label>
              </div>
            ))}
          </div>
          
          {selectedHazards.includes('Other hazards') && (
            <div className="mt-3">
              <Label htmlFor="other_hazards_notes">Specify Other Hazards</Label>
              <Input
                id="other_hazards_notes"
                value={formData.other_hazards_notes}
                onChange={(e) => updateFormData('other_hazards_notes', e.target.value)}
                placeholder="Describe other hazards..."
              />
            </div>
          )}
          
          <div className="mt-4">
            <Label htmlFor="safety_notes">Safety Notes</Label>
            <Textarea
              id="safety_notes"
              value={formData.safety_notes}
              onChange={(e) => updateFormData('safety_notes', e.target.value)}
              placeholder="Hard hats required in mechanical areas, safety glasses mandatory"
              rows={2}
            />
          </div>
        </div>

        {/* Secondary Contact */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold text-foreground">Backup Contact (Optional)</h4>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowSecondaryContact(!showSecondaryContact)}
            >
              {showSecondaryContact ? 'Remove' : 'Add'} Backup Contact
            </Button>
          </div>
          
          {showSecondaryContact && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="secondary_contact_name">Contact Name</Label>
                <Input
                  id="secondary_contact_name"
                  value={formData.secondary_contact_name}
                  onChange={(e) => updateFormData('secondary_contact_name', e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div>
                <Label htmlFor="secondary_contact_role">Role</Label>
                <Input
                  id="secondary_contact_role"
                  value={formData.secondary_contact_role}
                  onChange={(e) => updateFormData('secondary_contact_role', e.target.value)}
                  placeholder="Assistant Facilities Manager"
                />
              </div>
              <div>
                <Label htmlFor="secondary_contact_phone">Phone</Label>
                <Input
                  id="secondary_contact_phone"
                  value={formData.secondary_contact_phone}
                  onChange={(e) => updateFormData('secondary_contact_phone', e.target.value)}
                  placeholder="(555) 987-6543"
                />
              </div>
              <div>
                <Label htmlFor="secondary_contact_email">Email</Label>
                <Input
                  id="secondary_contact_email"
                  type="email"
                  value={formData.secondary_contact_email}
                  onChange={(e) => updateFormData('secondary_contact_email', e.target.value)}
                  placeholder="jane.doe@company.com"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderStep3 = () => {
    // Handle credential changes from RemoteAccessCredentialsManager
    const handleRemoteAccessChange = (credentials: any[], vpnConfig?: any) => {
      updateFormData('access_credentials', credentials);
      
      // Update VPN settings
      if (vpnConfig) {
        updateFormData('vpn_required', vpnConfig.vpn_required || false);
        updateFormData('vpn_details', vpnConfig.connection_instructions || '');
        updateFormData('remote_access', vpnConfig.vpn_required || false);
        updateFormData('remote_access_type', vpnConfig.vpn_profile_name || 'VPN');
      }
      
      // For backward compatibility with legacy fields, extract common credential data
      if (credentials && credentials.length > 0) {
        // Look for TeamViewer or similar remote access
        const remoteAccessCred = credentials[0];
        if (remoteAccessCred) {
          updateFormData('remote_access', true);
          updateFormData('remote_access_type', remoteAccessCred.vendor || 'Remote Access');
        }
      }
    };

    // Handle system credentials changes
    const handleSystemCredentialsChange = (data: any) => {
      updateFormData('system_credentials', data.bms);
      updateFormData('windows_credentials', data.windows);
      updateFormData('service_credentials', data.services);
      
      // For backward compatibility, also update legacy fields
      if (data.bms) {
        updateFormData('bms_supervisor_ip', data.bms.platform_host || '');
        updateFormData('platform_username', data.bms.platform_username || '');
        updateFormData('platform_password', data.bms.platform_password || '');
        updateFormData('workbench_username', data.bms.station_username || data.bms.platform_username || '');
        updateFormData('workbench_password', data.bms.station_password || data.bms.platform_password || '');
      }
      
      if (data.windows) {
        updateFormData('pc_username', data.windows.local_admin_username || '');
        updateFormData('pc_password', data.windows.local_admin_password || '');
      }
    };
    
    // Create initial VPN config from legacy data
    const createInitialVpnConfig = () => {
      if (!formData.vpn_required) return undefined;
      
      return {
        customer_id: '',
        vpn_required: formData.vpn_required,
        vpn_profile_name: formData.remote_access_type || '',
        connection_instructions: formData.vpn_details || '',
        is_active: true
      };
    };
    
    // Create initial system credentials from legacy data
    const createInitialSystemCredentials = () => ({
      bms: {
        system_type: 'tridium_n4' as const,
        platform_host: formData.bms_supervisor_ip || '',
        platform_port: 4911,
        platform_username: formData.platform_username || '',
        platform_password: formData.platform_password || '',
        station_username: formData.workbench_username || '',
        station_password: formData.workbench_password || '',
        same_credentials: true
      },
      windows: {
        computer_name: '',
        local_admin_username: formData.pc_username || '',
        local_admin_password: formData.pc_password || ''
      },
      services: {
        custom_services: []
      }
    });
    
    return (
      <Tabs defaultValue="remote-access" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="remote-access">Remote Access</TabsTrigger>
          <TabsTrigger value="system-access">System Access</TabsTrigger>
        </TabsList>
        
        <TabsContent value="remote-access" className="mt-6">
          <RemoteAccessCredentialsManager
            initialCredentials={formData.access_credentials || []}
            initialVpnConfig={createInitialVpnConfig()}
            onChange={handleRemoteAccessChange}
            mode="form"
            showVpnConfig={true}
          />
        </TabsContent>
        
        <TabsContent value="system-access" className="mt-6">
          <SystemCredentialsManager
            initialBmsCredentials={formData.system_credentials}
            initialWindowsCredentials={formData.windows_credentials}
            initialServiceCredentials={formData.service_credentials}
            onChange={handleSystemCredentialsChange}
            mode="form"
          />
        </TabsContent>
      </Tabs>
    );
  };


  const renderStep4 = () => (
    <div className="space-y-6">
      {/* Technician Assignment */}
      <div>
        <h4 className="font-semibold text-foreground mb-3">Technician Assignment</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="primary_technician_id">Primary Technician</Label>
            <SearchableCombobox
              options={technicianOptions}
              value={formData.primary_technician_id}
              onValueChange={(value) => handleTechnicianSelection(value, true)}
              placeholder="Select primary technician"
              searchPlaceholder="Search technicians by name..."
              emptyText="No technicians found. Check your connection."
              loading={isLoadingDropdowns}
            />
            {formData.primary_technician_name && (
              <div className="mt-2 text-sm text-muted-foreground">
                <div className="font-medium">{formData.primary_technician_name}</div>
                {formData.primary_technician_phone && (
                  <div>📱 {formData.primary_technician_phone}</div>
                )}
                {formData.primary_technician_email && (
                  <div>📧 {formData.primary_technician_email}</div>
                )}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="secondary_technician_id">Secondary Technician</Label>
            <SearchableCombobox
              options={technicianOptions}
              value={formData.secondary_technician_id}
              onValueChange={(value) => handleTechnicianSelection(value, false)}
              placeholder="Select secondary technician"
              searchPlaceholder="Search technicians by name..."
              emptyText="No technicians found. Check your connection."
              loading={isLoadingDropdowns}
            />
            {formData.secondary_technician_name && (
              <div className="mt-2 text-sm text-muted-foreground">
                <div className="font-medium">{formData.secondary_technician_name}</div>
                {formData.secondary_technician_phone && (
                  <div>📱 {formData.secondary_technician_phone}</div>
                )}
                {formData.secondary_technician_email && (
                  <div>📧 {formData.secondary_technician_email}</div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Service Information */}
      <div>
        <h4 className="font-semibold text-foreground mb-3">Service Information</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="technician_assigned">Legacy Assigned Technician</Label>
            <Input
              id="technician_assigned"
              value={formData.technician_assigned}
              onChange={(e) => updateFormData('technician_assigned', e.target.value)}
              placeholder="Technician name (legacy field)"
            />
          </div>
          <div>
            <Label htmlFor="service_frequency">Service Frequency</Label>
            <Select value={formData.service_frequency} onValueChange={(value) => updateFormData('service_frequency', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Quarterly">Quarterly</SelectItem>
                <SelectItem value="Semi-Annual">Semi-Annual</SelectItem>
                <SelectItem value="Annual">Annual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <Label htmlFor="last_service">Last Service Date</Label>
            <Input
              id="last_service"
              type="date"
              value={formData.last_service}
              onChange={(e) => updateFormData('last_service', e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="next_due">Next Service Due</Label>
            <Input
              id="next_due"
              type="date"
              value={formData.next_due}
              onChange={(e) => updateFormData('next_due', e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4">
          <Label htmlFor="special_instructions">Special Instructions</Label>
          <Textarea
            id="special_instructions"
            value={formData.special_instructions}
            onChange={(e) => updateFormData('special_instructions', e.target.value)}
            placeholder="Any special instructions for service visits..."
            rows={4}
          />
        </div>
      </div>

      {/* Account Manager Selection */}
      <div>
        <h4 className="font-semibold text-foreground mb-3">Account Management</h4>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="account_manager_id">Account Manager</Label>
            <SearchableCombobox
              options={accountManagerOptions}
              value={formData.account_manager_id}
              onValueChange={handleAccountManagerSelection}
              placeholder="Select account manager"
              searchPlaceholder="Search account managers..."
              emptyText="No account managers found."
              loading={isLoadingDropdowns}
            />
            {formData.account_manager_name && (
              <div className="mt-2 text-sm text-muted-foreground">
                <div className="font-medium">{formData.account_manager_name}</div>
                {formData.account_manager_phone && (
                  <div>📱 {formData.account_manager_phone}</div>
                )}
                {formData.account_manager_email && (
                  <div>📧 {formData.account_manager_email}</div>
                )}
              </div>
            )}
          </div>
          <div>
            <Label htmlFor="escalation_contact">Escalation Contact</Label>
            <Input
              id="escalation_contact"
              value={formData.escalation_contact}
              onChange={(e) => updateFormData('escalation_contact', e.target.value)}
              placeholder="Escalation contact name"
            />
            <div className="mt-2">
              <Label htmlFor="escalation_phone">Escalation Phone</Label>
              <Input
                id="escalation_phone"
                value={formData.escalation_phone}
                onChange={(e) => updateFormData('escalation_phone', e.target.value)}
                placeholder="(555) 123-4567"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Google Drive Integration with Authentication */}
      <div className="space-y-6">
        <h4 className="font-semibold text-foreground mb-3">Google Drive Project Folder</h4>
        
        {!googleAuth.isAuthenticated ? (
          <GoogleDriveAuthPrompt
            title="Google Drive Access Required"
            description="To create and manage customer folders, please authenticate with Google Drive first."
            onAuthSuccess={() => {
              toast({
                title: "Authentication Successful",
                description: "You can now create and manage Google Drive folders.",
              });
            }}
            onAuthError={(error) => {
              toast({
                title: "Authentication Failed",
                description: error,
                variant: "destructive",
              });
            }}
            size="lg"
          />
        ) : (
          <EnhancedGoogleDriveFolderSearch
            customerData={{
              company_name: formData.company_name,
              site_name: formData.site_name,
              site_nickname: formData.site_nickname,
              site_address: formData.site_address,
              customer_id: formData.customer_id,
              service_tier: formData.service_tier,
              contact_name: formData.primary_contact,
              phone: formData.contact_phone
            }}
            onFolderSelected={handleGoogleDriveFolder}
            onFolderStructureCreated={handleFolderStructureCreated}
            onFolderSearchResults={handleFolderSearchResults}
            initialFolderId={formData.drive_folder_id}
            initialFolderUrl={formData.drive_folder_url}
            disabled={isSubmitting}
            showMigrationOption={true}
          />
        )}
      </div>
      
      {/* Manual folder input as fallback */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="drive_folder_id">Drive Folder ID (Manual Entry)</Label>
          <Input
            id="drive_folder_id"
            value={formData.drive_folder_id}
            onChange={(e) => updateFormData('drive_folder_id', e.target.value)}
            placeholder="Google Drive folder ID"
            disabled={isSubmitting}
          />
        </div>
        <div>
          <Label htmlFor="drive_folder_url">Drive Folder URL (Manual Entry)</Label>
          <Input
            id="drive_folder_url"
            value={formData.drive_folder_url}
            onChange={(e) => updateFormData('drive_folder_url', e.target.value)}
            placeholder="https://drive.google.com/..."
            disabled={isSubmitting}
          />
        </div>
      </div>

      {/* Summary Section */}
      <div className="mt-6 p-4 bg-muted rounded-lg">
        <h4 className="font-semibold mb-3">Review Information</h4>
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div><strong>Company:</strong> {formData.company_name}</div>
          <div><strong>Site:</strong> {formData.site_name}</div>
          <div><strong>Service Tier:</strong> <Badge className="ml-1">{formData.service_tier}</Badge></div>
          <div><strong>System:</strong> {formData.system_type}</div>
          <div><strong>Primary Contact:</strong> {formData.primary_contact}</div>
          <div><strong>Phone:</strong> {formData.contact_phone}</div>
          <div><strong>Primary Tech:</strong> {formData.primary_technician_name}</div>
          <div><strong>Account Mgr:</strong> {formData.account_manager_name}</div>
        </div>
      </div>
    </div>
  );


  const getStepTitle = () => {
    const titles = [
      'Basic Information',
      'Site Access & Contacts',
      'System Access',
      'Administrative & Review'
    ];
    return titles[currentStep - 1];
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return renderStep1();
    }
  };

  return (
    <>
      {/* Close Confirmation Dialog */}
      <Dialog open={showCloseConfirmation} onOpenChange={setShowCloseConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Close</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              You have unsaved changes. Are you sure you want to close the wizard? All progress will be lost.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={cancelClose}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmClose}>
              Close & Lose Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Folder Selection Dialog */}
      <Dialog open={showFolderMigration} onOpenChange={setShowFolderMigration}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Folder Setup</DialogTitle>
          </DialogHeader>
          {showFolderMigration && (
            <FolderSelection
              customerName={formData.company_name}
              existingFolders={folderSearchResults}
              onSelectionComplete={handleFolderSelectionComplete}
              onCancel={handleFolderSelectionCancel}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Enhanced Folder Selection Dialog */}
      <EnhancedFolderSelectionDialog
        isOpen={showEnhancedFolderDialog}
        onClose={() => setShowEnhancedFolderDialog(false)}
        customerData={{
          customer_id: formData.customer_id,
          company_name: formData.company_name,
          site_name: formData.site_name,
          site_nickname: formData.site_nickname,
          site_address: formData.site_address,
          service_tier: formData.service_tier,
          contact_name: formData.primary_contact,
          phone: formData.contact_phone
        }}
        onComplete={handleEnhancedFolderDialogComplete}
        onError={handleEnhancedFolderDialogError}
      />

      {/* Main Wizard Dialog - conditionally render when not embedded */}
      {!embedded && (
        <Dialog open={isOpen} onOpenChange={(open) => {
          // Prevent closing by clicking outside - user must explicitly close
          if (!open) return;
          handleClose();
        }}>
        <DialogContent 
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          onPointerDownOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => e.preventDefault()}
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle>
                {editMode?.isEdit 
                  ? (editMode.title || `Edit Customer - ${getStepTitle()}`) 
                  : `New Customer - ${getStepTitle()}`
                }
              </DialogTitle>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2 mt-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded ${
                  i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground">
            Step {currentStep} of {totalSteps}
          </div>
        </DialogHeader>

        <div className="py-6">
          {renderCurrentStep()}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>

          <div className="flex space-x-2">
            {currentStep < totalSteps ? (
              <Button onClick={nextStep}>
                Next
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="bg-primary hover:bg-primary-hover"
              >
                <Save className="w-4 h-4 mr-2" />
                {isSubmitting ? 
                  (editMode?.isEdit ? 'Processing...' : 'Creating...') : 
                  (editMode?.isEdit ? 'Save Changes' : 'Create Customer')
                }
              </Button>
            )}
          </div>
        </div>
        </DialogContent>
        </Dialog>
      )}
      
      {/* Embedded Mode Content */}
      {embedded && (
        <div className="h-full flex flex-col">
          {/* Progress Indicator */}
          <div className="flex items-center space-x-2 mb-4">
            {Array.from({ length: totalSteps }, (_, i) => (
              <div
                key={i}
                className={`h-2 flex-1 rounded ${
                  i + 1 <= currentStep ? 'bg-primary' : 'bg-muted'
                }`}
              />
            ))}
          </div>
          <div className="text-sm text-muted-foreground mb-6">
            Step {currentStep} of {totalSteps}: {getStepTitle()}
          </div>

          <div className="flex-1 overflow-y-auto">
            {renderCurrentStep()}
          </div>

          <div className="flex justify-between pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              <ChevronLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            <div className="flex space-x-2">
              {currentStep < totalSteps ? (
                <Button onClick={nextStep}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-primary hover:bg-primary-hover"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {isSubmitting ? 
                    (editMode?.isEdit ? 'Processing...' : 'Creating...') : 
                    (editMode?.isEdit ? 'Save Changes' : 'Create Customer')
                  }
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};
