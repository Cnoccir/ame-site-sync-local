import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  FolderOpen, 
  CheckCircle, 
  Clock, 
  ExternalLink, 
  Loader2,
  AlertCircle,
  MapPin,
  Building2,
  Phone,
  Mail,
  Sparkles
} from 'lucide-react';
import { EnhancedGoogleDriveFolderSearch } from '@/components/customers/EnhancedGoogleDriveFolderSearch';
import { AMEService } from '@/services/ameService';
import { useToast } from '@/hooks/use-toast';

const customerSchema = z.object({
  company_name: z.string().min(1, 'Company name is required'),
  site_name: z.string().optional(),
  site_address: z.string().min(1, 'Site address is required'),
  service_tier: z.enum(['CORE', 'ASSURE', 'GUARDIAN']),
  system_type: z.string().optional(),
  primary_contact: z.string().min(1, 'Primary contact is required'),
  contact_phone: z.string().min(1, 'Contact phone is required'),
  contact_email: z.string().email('Invalid email format'),
  building_type: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  notes: z.string().optional(),
});

type CustomerFormData = z.infer<typeof customerSchema>;

interface ProjectFolderStructure {
  mainFolderId: string;
  mainFolderUrl: string;
  subfolders: {
    backups: { id: string; url: string };
    projectDocs: { id: string; url: string };
    sitePhotos: { id: string; url: string };
    maintenance: { id: string; url: string };
    reports: { id: string; url: string };
    correspondence: { id: string; url: string };
  };
}

interface EnhancedCustomerFormProps {
  onSubmit: (data: CustomerFormData & { 
    selectedFolderId?: string;
    selectedFolderUrl?: string;
    folderStructure?: ProjectFolderStructure;
  }) => void;
  onCancel: () => void;
  initialData?: Partial<CustomerFormData>;
  isLoading?: boolean;
}

export const EnhancedCustomerForm: React.FC<EnhancedCustomerFormProps> = ({
  onSubmit,
  onCancel,
  initialData,
  isLoading = false
}) => {
  const [selectedFolderId, setSelectedFolderId] = useState<string>('');
  const [selectedFolderUrl, setSelectedFolderUrl] = useState<string>('');
  const [folderStructure, setFolderStructure] = useState<ProjectFolderStructure | undefined>();

  const { toast } = useToast();

  const form = useForm<CustomerFormData>({
    resolver: zodResolver(customerSchema),
    defaultValues: {
      service_tier: 'CORE',
      ...initialData
    }
  });

  const { watch } = form;
  const companyName = watch('company_name');
  const siteAddress = watch('site_address');

  // Watch for form data to pass to Google Drive component
  const customerData = {
    company_name: companyName || '',
    site_address: siteAddress || '',
    customer_id: '', // New customer, no ID yet
    service_tier: watch('service_tier'),
    contact_name: watch('primary_contact'),
    phone: watch('contact_phone')
  };

  const handleSubmit = (data: CustomerFormData) => {
    onSubmit({
      ...data,
      selectedFolderId: selectedFolderId || undefined,
      selectedFolderUrl: selectedFolderUrl || undefined,
      folderStructure: folderStructure
    });
  };

  const handleFolderSelected = (folderId: string, folderUrl: string, structure?: ProjectFolderStructure) => {
    setSelectedFolderId(folderId);
    setSelectedFolderUrl(folderUrl);
    setFolderStructure(structure);
  };

  const handleFolderStructureCreated = (structure: ProjectFolderStructure) => {
    setFolderStructure(structure);
    toast({
      title: 'Project Folder Created',
      description: `Structured project folder created successfully with ${Object.keys(structure.subfolders).length} subfolders.`,
    });
  };

  // Removed old folder matching code - now handled by EnhancedGoogleDriveFolderSearch component

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            Customer Information
          </CardTitle>
          <CardDescription>
            Enter customer details and we'll automatically search for existing project folders
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            
            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name *</Label>
                <Input
                  id="company_name"
                  {...form.register('company_name')}
                  placeholder="e.g., Metro General Hospital"
                />
                {form.formState.errors.company_name && (
                  <p className="text-sm text-red-600">{form.formState.errors.company_name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="site_name">Site Name</Label>
                <Input
                  id="site_name"
                  {...form.register('site_name')}
                  placeholder="e.g., Main Campus, Building A"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="site_address" className="flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                Site Address *
              </Label>
              <Textarea
                id="site_address"
                {...form.register('site_address')}
                placeholder="123 Main St, City, State 12345"
                rows={2}
              />
              {form.formState.errors.site_address && (
                <p className="text-sm text-red-600">{form.formState.errors.site_address.message}</p>
              )}
            </div>

            {/* Service Configuration */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_tier">Service Tier *</Label>
                <Select 
                  onValueChange={(value) => form.setValue('service_tier', value as any)}
                  defaultValue={form.getValues('service_tier')}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select service tier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORE">CORE - Basic Service</SelectItem>
                    <SelectItem value="ASSURE">ASSURE - Enhanced Service</SelectItem>
                    <SelectItem value="GUARDIAN">GUARDIAN - Premium Service</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="system_type">System Type</Label>
                <Input
                  id="system_type"
                  {...form.register('system_type')}
                  placeholder="e.g., Tridium Niagara N4"
                />
              </div>
            </div>

            {/* Contact Information */}
            <Separator />
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Phone className="w-5 h-5" />
              Contact Information
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="primary_contact">Primary Contact *</Label>
                <Input
                  id="primary_contact"
                  {...form.register('primary_contact')}
                  placeholder="John Smith"
                />
                {form.formState.errors.primary_contact && (
                  <p className="text-sm text-red-600">{form.formState.errors.primary_contact.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_phone">Contact Phone *</Label>
                <Input
                  id="contact_phone"
                  {...form.register('contact_phone')}
                  placeholder="(555) 123-4567"
                />
                {form.formState.errors.contact_phone && (
                  <p className="text-sm text-red-600">{form.formState.errors.contact_phone.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email *
                </Label>
                <Input
                  id="contact_email"
                  type="email"
                  {...form.register('contact_email')}
                  placeholder="john@company.com"
                />
                {form.formState.errors.contact_email && (
                  <p className="text-sm text-red-600">{form.formState.errors.contact_email.message}</p>
                )}
              </div>
            </div>

            {/* Additional Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="building_type">Building Type</Label>
                <Input
                  id="building_type"
                  {...form.register('building_type')}
                  placeholder="e.g., Hospital, Office, School"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="emergency_contact">Emergency Contact</Label>
                <Input
                  id="emergency_contact"
                  {...form.register('emergency_contact')}
                  placeholder="Emergency contact name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                {...form.register('notes')}
                placeholder="Any additional information about the customer or site..."
                rows={3}
              />
            </div>

            <Separator />
            
            {/* Enhanced Google Drive Integration */}
            <EnhancedGoogleDriveFolderSearch
              customerData={customerData}
              onFolderSelected={handleFolderSelected}
              onFolderStructureCreated={handleFolderStructureCreated}
              disabled={isLoading}
            />

            {/* Form Actions */}
            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Customer'
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
