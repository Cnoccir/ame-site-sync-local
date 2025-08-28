import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, HelpCircle, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { RemoteAccessVendorType, RemoteAccessCredential } from '@/types/remote-access';
import { getVendorConfig, validateField, formatFieldValue } from '@/config/remote-access-vendors';

interface VendorCredentialFormProps {
  vendor: RemoteAccessVendorType;
  initialData?: Partial<RemoteAccessCredential>;
  onSave: (data: Partial<RemoteAccessCredential>) => void;
  onCancel: () => void;
  mode: 'create' | 'edit';
}

export const VendorCredentialForm: React.FC<VendorCredentialFormProps> = ({
  vendor,
  initialData = {},
  onSave,
  onCancel,
  mode
}) => {
  const [formData, setFormData] = useState<Record<string, any>>({
    display_name: '',
    connection_notes: '',
    ...initialData
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  const vendorConfig = getVendorConfig(vendor);
  
  if (!vendorConfig) {
    return (
      <Alert>
        <AlertDescription>
          Unknown vendor configuration. Please contact support.
        </AlertDescription>
      </Alert>
    );
  }

  // Initialize form data when vendor or initial data changes
  useEffect(() => {
    if (Object.keys(initialData).length === 0) {
      // Only set defaults if no initial data provided
      setFormData({
        display_name: `${vendorConfig.label} Access`,
        connection_notes: '',
        ...initialData
      });
    } else {
      // Use initial data as-is to prevent overwriting
      setFormData({
        display_name: initialData.display_name || `${vendorConfig.label} Access`,
        connection_notes: initialData.connection_notes || '',
        ...initialData
      });
    }
  }, [vendor]); // Remove initialData and vendorConfig.label from dependencies

  const updateField = (field: string, value: any) => {
    // Format value if applicable
    const formattedValue = formatFieldValue(vendor, field, value);
    
    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate required fields
    vendorConfig.fields.forEach(fieldConfig => {
      if (fieldConfig.required && !formData[fieldConfig.key]) {
        newErrors[fieldConfig.key] = `${fieldConfig.label} is required`;
      }

      // Run field-specific validation
      if (formData[fieldConfig.key] && fieldConfig.validation) {
        const error = fieldConfig.validation(formData[fieldConfig.key]);
        if (error) {
          newErrors[fieldConfig.key] = error;
        }
      }
    });

    // Validate display name
    if (!formData.display_name?.trim()) {
      newErrors.display_name = 'Display name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: 'Validation Error',
        description: 'Please fix the errors before saving',
        variant: 'destructive'
      });
      return;
    }

    // Prepare data for saving
    const saveData: Partial<RemoteAccessCredential> = {
      vendor,
      display_name: formData.display_name,
      connection_notes: formData.connection_notes || undefined,
      is_active: true,
      priority: 1,
    };

    // Add vendor-specific fields
    vendorConfig.fields.forEach(fieldConfig => {
      const value = formData[fieldConfig.key];
      if (value !== undefined && value !== '') {
        (saveData as any)[fieldConfig.key] = value;
      }
    });

    onSave(saveData);
  };

  const togglePasswordVisibility = (field: string) => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: 'Copied',
        description: `${label} copied to clipboard`
      });
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const renderField = (fieldConfig: any) => {
    const value = formData[fieldConfig.key] || '';
    const error = errors[fieldConfig.key];
    const isPassword = fieldConfig.type === 'password';
    const showPassword = isPassword ? showPasswords[fieldConfig.key] : false;

    return (
      <div key={fieldConfig.key} className="space-y-2">
        <div className="flex items-center gap-2">
          <Label htmlFor={fieldConfig.key}>
            {fieldConfig.label}
            {fieldConfig.required && <span className="text-destructive">*</span>}
          </Label>
          {fieldConfig.helpText && (
            <div className="group relative">
              <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-popover text-popover-foreground text-xs rounded-md shadow-md border invisible group-hover:visible z-10 w-64">
                {fieldConfig.helpText}
                {fieldConfig.example && (
                  <div className="mt-1 text-muted-foreground">
                    Example: {fieldConfig.example}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {fieldConfig.type === 'select' ? (
          <Select value={value} onValueChange={(newValue) => updateField(fieldConfig.key, newValue)}>
            <SelectTrigger className={error ? 'border-destructive' : ''}>
              <SelectValue placeholder={`Select ${fieldConfig.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {fieldConfig.options?.map((option: any) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : fieldConfig.type === 'textarea' ? (
          <Textarea
            id={fieldConfig.key}
            value={value}
            onChange={(e) => updateField(fieldConfig.key, e.target.value)}
            placeholder={fieldConfig.placeholder}
            className={error ? 'border-destructive' : ''}
            rows={3}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Input
              id={fieldConfig.key}
              type={isPassword && !showPassword ? 'password' : fieldConfig.type}
              value={value}
              onChange={(e) => updateField(fieldConfig.key, e.target.value)}
              placeholder={fieldConfig.placeholder}
              className={`flex-1 ${error ? 'border-destructive' : ''}`}
              maxLength={fieldConfig.maxLength}
            />
            
            {isPassword && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => togglePasswordVisibility(fieldConfig.key)}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            )}
            
            {value && !isPassword && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => copyToClipboard(value, fieldConfig.label)}
              >
                <Copy className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}

        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <span className="text-primary font-semibold text-sm">
            {vendorConfig.label.charAt(0)}
          </span>
        </div>
        <div>
          <h3 className="font-semibold text-lg">{vendorConfig.label} Configuration</h3>
          <p className="text-sm text-muted-foreground">{vendorConfig.description}</p>
        </div>
      </div>

      {/* General Fields */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="display_name">
            Display Name <span className="text-destructive">*</span>
          </Label>
          <Input
            id="display_name"
            value={formData.display_name}
            onChange={(e) => updateField('display_name', e.target.value)}
            placeholder={`e.g., ${vendorConfig.label} - Main Server`}
            className={errors.display_name ? 'border-destructive' : ''}
          />
          {errors.display_name && (
            <p className="text-sm text-destructive">{errors.display_name}</p>
          )}
        </div>

        {/* Vendor-specific fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {vendorConfig.fields.map(renderField)}
        </div>

        <div className="space-y-2">
          <Label htmlFor="connection_notes">Connection Notes</Label>
          <Textarea
            id="connection_notes"
            value={formData.connection_notes}
            onChange={(e) => updateField('connection_notes', e.target.value)}
            placeholder="Additional notes about this connection (optional)"
            rows={2}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {mode === 'create' ? 'Add Credential' : 'Update Credential'}
        </Button>
      </div>
    </form>
  );
};
