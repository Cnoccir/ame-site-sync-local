import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Building,
  Users,
  Key,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Plus,
  Minus,
  Phone,
  Mail,
  Clock,
  ArrowRight,
  Search,
  User
} from 'lucide-react';
import { PhaseHeader, SectionCard } from '../shared';
import { logger } from '@/utils/logger';
import { SimProCustomerSearch } from '@/components/customers/SimProCustomerSearch';
import { SearchableCombobox } from '@/components/ui/searchable-combobox';
import { AMEContactService, AMEContactSearchResult } from '@/services/ameContactService';
import { AMEEmployeeService } from '@/services/ameEmployeeService';
import { DropdownDataService, DropdownOption, GroupedDropdownOption } from '@/services/dropdownDataService';

// Import types
import type { SiteIntelligenceData } from '@/types/pmWorkflow';

interface Phase1SiteIntelligenceProps {
  data: SiteIntelligenceData;
  onDataUpdate: (data: Partial<SiteIntelligenceData>) => void;
  onPhaseComplete: () => void;
}

// Mock customer data for testing
const mockCustomers = [
  {
    id: '1',
    companyName: 'Acme Corporation',
    siteName: 'Main Office Building',
    address: '123 Business Ave, Suite 100, Business City, BC 12345',
    serviceTier: 'ASSURE',
    contractNumber: 'CON-2024-001',
    accountManager: 'John Smith'
  },
  {
    id: '2', 
    companyName: 'Tech Industries LLC',
    siteName: 'Manufacturing Plant',
    address: '456 Industrial Dr, Factory Town, FT 67890',
    serviceTier: 'GUARDIAN',
    contractNumber: 'CON-2024-002',
    accountManager: 'Jane Doe'
  },
  {
    id: '3',
    companyName: 'Healthcare Partners',
    siteName: 'Medical Center',
    address: '789 Health Blvd, Medical City, MC 54321',
    serviceTier: 'CORE',
    contractNumber: 'CON-2024-003',
    accountManager: 'Bob Johnson'
  }
];

export const Phase1SiteIntelligence: React.FC<Phase1SiteIntelligenceProps> = ({
  data,
  onDataUpdate,
  onPhaseComplete
}) => {
  const [activeTab, setActiveTab] = useState('customer');
  const [customerSearch, setCustomerSearch] = useState('');
  const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
  const [technicianOptions, setTechnicianOptions] = useState<any[]>([]);
  const [isLoadingTechnicians, setIsLoadingTechnicians] = useState(false);
  const [accountManagerOptions, setAccountManagerOptions] = useState<any[]>([]);
  const [isLoadingAccountManagers, setIsLoadingAccountManagers] = useState(false);
  const [dropdownData, setDropdownData] = useState<any>(null);
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState(true);

  // Load all data on component mount
  React.useEffect(() => {
    loadDropdownData();
  }, []);

  const loadDropdownData = async () => {
    setIsLoadingTechnicians(true);
    setIsLoadingAccountManagers(true);
    setIsLoadingDropdowns(true);
    try {
      // Fetch in parallel but don't fail everything if one call errors
      const [dd, techs, mgrs] = await Promise.allSettled([
        DropdownDataService.getCachedDropdownData(),
        AMEContactService.getTechnicians(),
        AMEEmployeeService.getAccountManagers()
      ]);

      if (dd.status === 'fulfilled') {
        setDropdownData(dd.value);
      } else {
        console.warn('Dropdown reference data unavailable; continuing without it:', dd.reason);
      }

      if (techs.status === 'fulfilled') {
        const formattedTechnicians = techs.value.map((tech: any) => ({
          id: tech.id,
          name: tech.name,
          description: `${tech.phone ? `📱 ${tech.phone}` : ''}${tech.email ? ` 📧 ${tech.email}` : ''}`.trim(),
          subtitle: tech.role || 'Technician',
          phone: tech.phone,
          email: tech.email,
          extension: (tech as any)?.extension,
          direct_line: (tech as any)?.direct_line
        }));
        setTechnicianOptions(formattedTechnicians);
      } else {
        console.error('Technician load failed:', techs.reason);
        setTechnicianOptions([]);
      }

      if (mgrs.status === 'fulfilled') {
        const formattedAccountManagers = mgrs.value.map((mgr: any) => ({
          id: mgr.id,
          name: AMEEmployeeService.getDisplayName(mgr),
          description: `${mgr.mobile_phone ? `📱 ${mgr.mobile_phone}` : ''}${mgr.email ? ` 📧 ${mgr.email}` : ''}`.trim(),
          subtitle: mgr.role || 'Account Manager',
          phone: mgr.mobile_phone || mgr.phone,
          email: mgr.email
        }));
        setAccountManagerOptions(formattedAccountManagers);
      } else {
        console.error('Account manager load failed:', mgrs.reason);
        setAccountManagerOptions([]);
      }
    } catch (error) {
      console.error('Unexpected error loading dropdown data:', error);
    } finally {
      setIsLoadingTechnicians(false);
      setIsLoadingAccountManagers(false);
      setIsLoadingDropdowns(false);
    }
  };

  const handleAccountManagerSelection = (managerId: string) => {
    if (!managerId) {
      // Clear selection
      onDataUpdate({
        customer: {
          ...data.customer,
          accountManager: '',
          accountManagerId: '',
          accountManagerPhone: '',
          accountManagerEmail: ''
        }
      });
      return;
    }

    const selectedMgr = accountManagerOptions.find(mgr => mgr.id === managerId);
    if (selectedMgr) {
      onDataUpdate({
        customer: {
          ...data.customer,
          accountManager: selectedMgr.name,
          accountManagerId: managerId,
          accountManagerPhone: selectedMgr.phone || '',
          accountManagerEmail: selectedMgr.email || ''
        }
      });
    }
  };

  const handleTechnicianSelection = (technicianId: string, isPrimary: boolean = true) => {
    if (!technicianId) {
      // Clear selection
      if (isPrimary) {
        onDataUpdate({
          customer: {
            ...data.customer,
            primaryTechnicianId: '',
            primaryTechnicianName: '',
            primaryTechnicianPhone: '',
            primaryTechnicianEmail: ''
          }
        });
      } else {
        onDataUpdate({
          customer: {
            ...data.customer,
            secondaryTechnicianId: '',
            secondaryTechnicianName: '',
            secondaryTechnicianPhone: '',
            secondaryTechnicianEmail: ''
          }
        });
      }
      return;
    }

    const selectedTech = technicianOptions.find(tech => tech.id === technicianId);
    if (selectedTech) {
      if (isPrimary) {
        onDataUpdate({
          customer: {
            ...data.customer,
            primaryTechnicianId: technicianId,
            primaryTechnicianName: selectedTech.name,
            primaryTechnicianPhone: selectedTech.phone || '',
            primaryTechnicianEmail: selectedTech.email || ''
          }
        });
      } else {
        onDataUpdate({
          customer: {
            ...data.customer,
            secondaryTechnicianId: technicianId,
            secondaryTechnicianName: selectedTech.name,
            secondaryTechnicianPhone: selectedTech.phone || '',
            secondaryTechnicianEmail: selectedTech.email || ''
          }
        });
      }
    }
  };

  const calculateProgress = (): number => {
    const sections = ['customer', 'contacts', 'access', 'safety', 'team'];
    const completed = sections.filter(section => validateSection(section)).length;
    return (completed / sections.length) * 100;
  };

  const handleSimProAutofill = (autofillData: any) => {
    onDataUpdate({
      customer: {
        ...data.customer,
        companyName: autofillData.companyName || autofillData.company_name || data.customer.companyName,
        siteName: autofillData.siteName || autofillData.site_name || autofillData.company_name || data.customer.siteName,
        address: autofillData.address || autofillData.site_address || data.customer.address,
        serviceTier: autofillData.serviceTier || autofillData.service_tier || data.customer.serviceTier,
        contractNumber: autofillData.contractNumber || autofillData.contract_number || data.customer.contractNumber,
        accountManager: autofillData.accountManager || autofillData.account_manager || data.customer.accountManager,
        // Enhanced mapping for new fields
        simproCustomerId: autofillData.simproCustomerId || autofillData.customer_id || data.customer.simproCustomerId
      }
    });

    // If we have contact email, populate the first contact
    if (autofillData.contact_email && data.contacts.length === 0) {
      onDataUpdate({
        contacts: [{
          id: 'contact_1',
          name: '',
          phone: '',
          email: autofillData.contact_email,
          role: 'Primary Contact',
          isPrimary: true,
          isEmergency: false
        }]
      });
    }

    logger.info('SimPro autofill completed', autofillData);
  };

  const validateSection = (section: string): boolean => {
    switch (section) {
      case 'customer':
        return !!(data.customer.companyName && data.customer.siteName && data.customer.address);
      case 'contacts':
        return data.contacts.length > 0;
      case 'access':
        return !!(data.access.method && data.access.parkingInstructions);
      case 'safety':
        return data.safety.requiredPPE.length > 0;
      case 'team':
        return !!(data.customer.primaryTechnicianId && data.customer.primaryTechnicianName); // Primary technician is required
      default:
        return false;
    }
  };

  const updateCustomer = (field: string, value: string) => {
    onDataUpdate({
      customer: { ...data.customer, [field]: value }
    });
  };

  const selectCustomer = (customer: any) => {
    onDataUpdate({
      customer: {
        companyName: customer.companyName,
        siteName: customer.siteName,
        address: customer.address,
        serviceTier: customer.serviceTier,
        contractNumber: customer.contractNumber,
        accountManager: customer.accountManager
      }
    });
    setCustomerSearch(customer.companyName);
    setShowCustomerSuggestions(false);
  };

  const addContact = () => {
    const newContact = {
      id: `contact-${Date.now()}`,
      name: '',
      phone: '',
      email: '',
      role: '',
      isPrimary: data.contacts.length === 0,
      isEmergency: false
    };
    
    onDataUpdate({
      contacts: [...data.contacts, newContact]
    });
  };

  const updateContact = (contactId: string, field: string, value: any) => {
    const updatedContacts = data.contacts.map(contact => 
      contact.id === contactId ? { ...contact, [field]: value } : contact
    );
    onDataUpdate({ contacts: updatedContacts });
  };

  const removeContact = (contactId: string) => {
    const updatedContacts = data.contacts.filter(contact => contact.id !== contactId);
    onDataUpdate({ contacts: updatedContacts });
  };

  const updateAccess = (field: string, value: any) => {
    onDataUpdate({
      access: { ...data.access, [field]: value }
    });
  };

  const updateSafety = (field: string, value: any) => {
    onDataUpdate({
      safety: { ...data.safety, [field]: value }
    });
  };

  const togglePPE = (ppe: string) => {
    const currentPPE = data.safety.requiredPPE;
    const updatedPPE = currentPPE.includes(ppe) 
      ? currentPPE.filter(item => item !== ppe)
      : [...currentPPE, ppe];
    updateSafety('requiredPPE', updatedPPE);
  };

  const toggleHazard = (hazard: string) => {
    const currentHazards = data.safety.knownHazards;
    const updatedHazards = currentHazards.includes(hazard)
      ? currentHazards.filter(item => item !== hazard)
      : [...currentHazards, hazard];
    updateSafety('knownHazards', updatedHazards);
  };

  const canCompletePhase = (): boolean => {
    return ['customer', 'contacts', 'access', 'safety', 'team'].every(section => validateSection(section));
  };

  const handlePhaseComplete = () => {
    if (canCompletePhase()) {
      logger.info('Phase 1 Site Intelligence completed');
      onPhaseComplete();
    }
  };

  const progress = calculateProgress();
  const filteredCustomers = mockCustomers.filter(customer =>
    customer.companyName.toLowerCase().includes(customerSearch.toLowerCase()) ||
    customer.siteName.toLowerCase().includes(customerSearch.toLowerCase())
  );

  return (
    <div className="h-full flex flex-col">
      <PhaseHeader
        phase={1}
        title="Site Intelligence & Setup"
        description="Gather essential customer, contact, and access information"
        progress={progress}
        requiredTasks={['Customer Information', 'Primary Contacts', 'Site Access', 'Safety Requirements', 'Team Assignment']}
        completedTasks={['customer', 'contacts', 'access', 'safety', 'team'].filter(validateSection)}
        estimatedTime={20}
        actualTime={0}
      />

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="m-4 grid grid-cols-5">
            <TabsTrigger value="customer" className="gap-2">
              <Building className="h-4 w-4" />
              Customer
              {validateSection('customer') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="contacts" className="gap-2">
              <Users className="h-4 w-4" />
              Contacts
              {validateSection('contacts') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="access" className="gap-2">
              <Key className="h-4 w-4" />
              Access
              {validateSection('access') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="safety" className="gap-2">
              <Shield className="h-4 w-4" />
              Safety
              {validateSection('safety') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="team" className="gap-2">
              <Users className="h-4 w-4" />
              Team
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Customer Information Tab */}
            <TabsContent value="customer" className="mt-0">
              <SectionCard
                title="Customer & Site Information"
                description="Basic information about the customer and service location"
                icon={<Building className="h-4 w-4" />}
                required
              >
                <div className="space-y-4">
                  <div className="space-y-4">
                    <SimProCustomerSearch
                      onAutofill={handleSimProAutofill}
                      currentCompanyName={data.customer.companyName}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Company Name *</Label>
                      <Input
                        value={data.customer.companyName}
                        onChange={(e) => updateCustomer('companyName', e.target.value)}
                        placeholder="Enter company name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Site Name *</Label>
                      <Input
                        value={data.customer.siteName}
                        onChange={(e) => updateCustomer('siteName', e.target.value)}
                        placeholder="e.g., Main Office, Building A"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Site Address *</Label>
                    <Textarea
                      value={data.customer.address}
                      onChange={(e) => updateCustomer('address', e.target.value)}
                      placeholder="Full site address including suite/unit numbers"
                      rows={2}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Service Tier *</Label>
                      <Select
                        value={data.customer.serviceTier}
                        onValueChange={(value) => updateCustomer('serviceTier', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select tier" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CORE">CORE - Basic Service</SelectItem>
                          <SelectItem value="ASSURE">ASSURE - Enhanced Service</SelectItem>
                          <SelectItem value="GUARDIAN">GUARDIAN - Premium Service</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Contract Number</Label>
                      <Input
                        value={data.customer.contractNumber}
                        onChange={(e) => updateCustomer('contractNumber', e.target.value)}
                        placeholder="CON-2024-XXX"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Account Manager</Label>
                      <SearchableCombobox
                        options={accountManagerOptions}
                        value={data.customer.accountManagerId || ''}
                        onValueChange={handleAccountManagerSelection}
                        placeholder="Select account manager"
                        searchPlaceholder="Search account managers..."
                        emptyText="No account managers found."
                        loading={isLoadingAccountManagers}
                        allowClear={true}
                      />
                      {data.customer.accountManager && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <div className="font-medium">{data.customer.accountManager}</div>
                          {data.customer.accountManagerPhone && (
                            <div>📱 {data.customer.accountManagerPhone}</div>
                          )}
                          {data.customer.accountManagerEmail && (
                            <div>📧 {data.customer.accountManagerEmail}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              </SectionCard>
            </TabsContent>

            {/* Contacts Tab */}
            <TabsContent value="contacts" className="mt-0">
              <SectionCard
                title="Site Contacts"
                description="Key personnel for coordination and emergency contact"
                icon={<Users className="h-4 w-4" />}
                required
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Add at least one primary contact for site coordination
                    </p>
                    <Button onClick={addContact} size="sm" className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Contact
                    </Button>
                  </div>

                  {data.contacts.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4" />
                      <p>No contacts added yet</p>
                      <p className="text-sm">Add a primary contact to proceed</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.contacts.map(contact => (
                        <Card key={contact.id} className="relative">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start mb-3">
                              <div className="flex gap-2">
                                {contact.isPrimary && <Badge>Primary</Badge>}
                                {contact.isEmergency && <Badge variant="destructive">Emergency</Badge>}
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeContact(contact.id)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <Minus className="h-4 w-4" />
                              </Button>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="space-y-2">
                                <Label>Name *</Label>
                                <Input
                                  value={contact.name}
                                  onChange={(e) => updateContact(contact.id, 'name', e.target.value)}
                                  placeholder="Contact name"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Role/Title *</Label>
                                <Input
                                  value={contact.role}
                                  onChange={(e) => updateContact(contact.id, 'role', e.target.value)}
                                  placeholder="Facilities Manager, Engineer, etc."
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Phone *</Label>
                                <Input
                                  value={contact.phone}
                                  onChange={(e) => updateContact(contact.id, 'phone', e.target.value)}
                                  placeholder="(555) 123-4567"
                                  type="tel"
                                />
                              </div>
                              <div className="space-y-2">
                                <Label>Email *</Label>
                                <Input
                                  value={contact.email}
                                  onChange={(e) => updateContact(contact.id, 'email', e.target.value)}
                                  placeholder="contact@company.com"
                                  type="email"
                                />
                              </div>
                            </div>

                            <div className="flex gap-4 mt-3">
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`primary-${contact.id}`}
                                  checked={contact.isPrimary}
                                  onCheckedChange={(checked) => {
                                    // Only one primary contact allowed
                                    if (checked) {
                                      const updatedContacts = data.contacts.map(c => ({
                                        ...c,
                                        isPrimary: c.id === contact.id
                                      }));
                                      onDataUpdate({ contacts: updatedContacts });
                                    } else {
                                      updateContact(contact.id, 'isPrimary', false);
                                    }
                                  }}
                                />
                                <Label htmlFor={`primary-${contact.id}`}>Primary Contact</Label>
                              </div>
                              <div className="flex items-center space-x-2">
                                <Checkbox
                                  id={`emergency-${contact.id}`}
                                  checked={contact.isEmergency}
                                  onCheckedChange={(checked) => updateContact(contact.id, 'isEmergency', checked)}
                                />
                                <Label htmlFor={`emergency-${contact.id}`}>Emergency Contact</Label>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              </SectionCard>
            </TabsContent>

            {/* Access Tab */}
            <TabsContent value="access" className="mt-0">
              <SectionCard
                title="Site Access & Logistics"
                description="Instructions for accessing the site and parking"
                icon={<Key className="h-4 w-4" />}
                required
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Access Method *</Label>
                      <Select 
                        value={data.access.method} 
                        onValueChange={(value) => updateAccess('method', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="How to access site" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="front-desk">Check in at front desk</SelectItem>
                          <SelectItem value="keycard">Keycard provided</SelectItem>
                          <SelectItem value="escort">Escort required</SelectItem>
                          <SelectItem value="call-contact">Call contact for entry</SelectItem>
                          <SelectItem value="self-access">Self access (unlocked)</SelectItem>
                          <SelectItem value="other">Other (specify in notes)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Best Arrival Time</Label>
                      <Input
                        value={data.access.bestArrivalTime}
                        onChange={(e) => updateAccess('bestArrivalTime', e.target.value)}
                        placeholder="e.g., 8:00 AM - 5:00 PM"
                        type="text"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Parking Instructions *</Label>
                    <Textarea
                      value={data.access.parkingInstructions}
                      onChange={(e) => updateAccess('parkingInstructions', e.target.value)}
                      placeholder="Where to park, any restrictions, visitor spaces, loading dock access..."
                      rows={3}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="badge-required"
                        checked={data.access.badgeRequired}
                        onCheckedChange={(checked) => updateAccess('badgeRequired', checked)}
                      />
                      <Label htmlFor="badge-required">Visitor badge/ID required</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="escort-required"
                        checked={data.access.escortRequired}
                        onCheckedChange={(checked) => updateAccess('escortRequired', checked)}
                      />
                      <Label htmlFor="escort-required">Escort required at all times</Label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Special Access Instructions</Label>
                    <Textarea
                      value={data.access.specialInstructions}
                      onChange={(e) => updateAccess('specialInstructions', e.target.value)}
                      placeholder="Any additional access notes, security procedures, etc."
                      rows={2}
                    />
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* Safety Tab */}
            <TabsContent value="safety" className="mt-0">
              <SectionCard
                title="Safety & PPE Requirements"
                description="Safety hazards and required personal protective equipment"
                icon={<Shield className="h-4 w-4" />}
                required
              >
                <div className="space-y-6">
                  <div>
                    <Label className="text-base font-medium mb-3 block">Required PPE *</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {['Hard Hat', 'Safety Glasses', 'Steel Toe Boots', 'High-Vis Vest', 'Gloves', 'Hearing Protection'].map(ppe => (
                        <div key={ppe} className="flex items-center space-x-2">
                          <Checkbox
                            id={`ppe-${ppe}`}
                            checked={data.safety.requiredPPE.includes(ppe)}
                            onCheckedChange={() => togglePPE(ppe)}
                          />
                          <Label htmlFor={`ppe-${ppe}`}>{ppe}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium mb-3 block">Known Hazards</Label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {['Asbestos', 'Arc Flash', 'Confined Spaces', 'Heights/Fall Risk', 'Chemical Exposure', 'High Voltage', 'Moving Equipment', 'Noise'].map(hazard => (
                        <div key={hazard} className="flex items-center space-x-2">
                          <Checkbox
                            id={`hazard-${hazard}`}
                            checked={data.safety.knownHazards.includes(hazard)}
                            onCheckedChange={() => toggleHazard(hazard)}
                          />
                          <Label htmlFor={`hazard-${hazard}`}>{hazard}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Safety Contact Name</Label>
                      <Input
                        value={data.safety.safetyContact}
                        onChange={(e) => updateSafety('safetyContact', e.target.value)}
                        placeholder="Emergency coordinator name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Safety Contact Phone</Label>
                      <Input
                        value={data.safety.safetyPhone}
                        onChange={(e) => updateSafety('safetyPhone', e.target.value)}
                        placeholder="Emergency contact number"
                        type="tel"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>Special Safety Notes</Label>
                    <Textarea
                      value={data.safety.specialNotes}
                      onChange={(e) => updateSafety('specialNotes', e.target.value)}
                      placeholder="Any additional safety considerations, emergency procedures, site-specific hazards..."
                      rows={3}
                    />
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* Team Assignment Tab */}
            <TabsContent value="team" className="mt-0">
              <SectionCard
                title="Team Assignment"
                description="Assign primary and secondary technicians for this visit"
                icon={<Users className="h-4 w-4" />}
                required
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="primary_technician" className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-500" />
                        Primary Technician *
                      </Label>
                      <SearchableCombobox
                        options={technicianOptions}
                        value={data.customer.primaryTechnicianId || ''}
                        onValueChange={(value) => handleTechnicianSelection(value, true)}
                        placeholder="Select primary technician"
                        searchPlaceholder="Search technicians by name..."
                        emptyText="No technicians found. Check your connection."
                        loading={isLoadingTechnicians}
                        allowClear={true}
                      />
                      {data.customer.primaryTechnicianName && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <div className="font-medium">{data.customer.primaryTechnicianName}</div>
                          {data.customer.primaryTechnicianPhone && (
                            <div>📱 {data.customer.primaryTechnicianPhone}</div>
                          )}
                          {data.customer.primaryTechnicianEmail && (
                            <div>📧 {data.customer.primaryTechnicianEmail}</div>
                          )}
                        </div>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="secondary_technician" className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-green-500" />
                        Secondary Technician
                      </Label>
                      <SearchableCombobox
                        options={technicianOptions.filter(tech => tech.id !== data.customer.primaryTechnicianId)}
                        value={data.customer.secondaryTechnicianId || ''}
                        onValueChange={(value) => handleTechnicianSelection(value, false)}
                        placeholder="Select secondary technician"
                        searchPlaceholder="Search technicians by name..."
                        emptyText="No technicians found. Check your connection."
                        loading={isLoadingTechnicians}
                        allowClear={true}
                      />
                      {data.customer.secondaryTechnicianName && (
                        <div className="mt-2 text-sm text-muted-foreground">
                          <div className="font-medium">{data.customer.secondaryTechnicianName}</div>
                          {data.customer.secondaryTechnicianPhone && (
                            <div>📱 {data.customer.secondaryTechnicianPhone}</div>
                          )}
                          {data.customer.secondaryTechnicianEmail && (
                            <div>📧 {data.customer.secondaryTechnicianEmail}</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {(data.customer.primaryTechnicianName || data.customer.secondaryTechnicianName) && (
                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-2">Team Summary</h4>
                      <div className="space-y-2 text-sm">
                        {data.customer.primaryTechnicianName && (
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-blue-600" />
                            <span className="font-medium">Primary:</span>
                            <span>{data.customer.primaryTechnicianName}</span>
                            <Badge variant="outline">Primary Technician</Badge>
                          </div>
                        )}
                        {data.customer.secondaryTechnicianName && (
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-green-600" />
                            <span className="font-medium">Secondary:</span>
                            <span>{data.customer.secondaryTechnicianName}</span>
                            <Badge variant="outline">Secondary Technician</Badge>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </SectionCard>
            </TabsContent>
          </div>

          {/* Phase Completion Footer */}
          <div className="border-t bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Progress: {Math.round(progress)}%</span>
                <span className="text-muted-foreground ml-2">
                  ({['customer', 'contacts', 'access', 'safety', 'team'].filter(validateSection).length} of 5 sections completed)
                </span>
              </div>
              <Button
                onClick={handlePhaseComplete}
                disabled={!canCompletePhase()}
                className="gap-2"
              >
                Complete Site Intelligence
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {!canCompletePhase() && (
              <Alert className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Complete all required sections to proceed to System Discovery.
                  {!validateSection('customer') && ' Fill in customer information.'}
                  {!validateSection('contacts') && ' Add at least one contact.'}
                  {!validateSection('access') && ' Specify access method and parking.'}
                  {!validateSection('safety') && ' Select required PPE.'}
                  {!validateSection('team') && ' Assign primary technician.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};
