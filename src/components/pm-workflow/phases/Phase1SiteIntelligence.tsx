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
  Search
} from 'lucide-react';
import { PhaseHeader, SectionCard } from '../shared';
import { logger } from '@/utils/logger';

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

  const calculateProgress = (): number => {
    const sections = ['customer', 'contacts', 'access', 'safety'];
    const completed = sections.filter(section => validateSection(section)).length;
    return (completed / sections.length) * 100;
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
    return ['customer', 'contacts', 'access', 'safety'].every(section => validateSection(section));
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
        requiredTasks={['Customer Information', 'Primary Contacts', 'Site Access', 'Safety Requirements']}
        completedTasks={['customer', 'contacts', 'access', 'safety'].filter(validateSection)}
        estimatedTime={20}
        actualTime={0}
      />

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="m-4 grid grid-cols-4">
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
                  <div className="space-y-2">
                    <Label>Customer Search</Label>
                    <div className="relative">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                          <Input
                            value={customerSearch}
                            onChange={(e) => {
                              setCustomerSearch(e.target.value);
                              setShowCustomerSuggestions(e.target.value.length > 1);
                            }}
                            placeholder="Search existing customers..."
                            className="pl-10"
                          />
                        </div>
                        <Button variant="outline" onClick={() => setShowCustomerSuggestions(!showCustomerSuggestions)}>
                          <Search className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {showCustomerSuggestions && filteredCustomers.length > 0 && (
                        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                          {filteredCustomers.map(customer => (
                            <button
                              key={customer.id}
                              onClick={() => selectCustomer(customer)}
                              className="w-full text-left p-3 hover:bg-gray-50 border-b last:border-b-0"
                            >
                              <div className="font-medium">{customer.companyName}</div>
                              <div className="text-sm text-gray-500">{customer.siteName}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="outline" size="sm">{customer.serviceTier}</Badge>
                                <span className="text-xs text-gray-400">{customer.contractNumber}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
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
                      <Input
                        value={data.customer.accountManager}
                        onChange={(e) => updateCustomer('accountManager', e.target.value)}
                        placeholder="Manager name"
                      />
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
          </div>

          {/* Phase Completion Footer */}
          <div className="border-t bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Progress: {Math.round(progress)}%</span>
                <span className="text-muted-foreground ml-2">
                  ({['customer', 'contacts', 'access', 'safety'].filter(validateSection).length} of 4 sections completed)
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
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};
