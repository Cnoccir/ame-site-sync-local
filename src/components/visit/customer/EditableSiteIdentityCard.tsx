import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import { Badge } from '../../ui/badge';
import { Textarea } from '../../ui/textarea';
import { Building2, Edit2, Check, X, Calculator, Sparkles, AlertTriangle } from 'lucide-react';
import { SmartAutoCompleteService, type CustomerSuggestion, type ValidationResult } from '../../../services/smartAutoCompleteService';
import { supabase } from '../../../lib/supabase';

interface Customer {
  id?: string;
  company_name: string;
  site_nickname: string;
  site_number: string;
  service_tier: 'CORE' | 'ASSURE' | 'GUARDIAN';
  system_platform?: string;
  total_contract_value?: number;
  has_active_contracts?: boolean;
}

interface Props {
  customer: Customer;
  onUpdate: (updatedCustomer: Customer) => void;
  isNewCustomer?: boolean;
}

interface AutoCompleteInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  suggestions: CustomerSuggestion[];
  onSuggestionSelect: (suggestion: CustomerSuggestion) => void;
  placeholder: string;
}

const AutoCompleteInput: React.FC<AutoCompleteInputProps> = ({
  id,
  value,
  onChange,
  suggestions,
  onSuggestionSelect,
  placeholder
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);

  return (
    <div className="relative">
      <Input
        id={id}
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setShowSuggestions(true);
        }}
        onFocus={() => setShowSuggestions(true)}
        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
        onKeyDown={(e) => {
          if (!showSuggestions || suggestions.length === 0) return;
          
          if (e.key === 'ArrowDown') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.min(prev + 1, suggestions.length - 1));
          } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setHighlightedIndex(prev => Math.max(prev - 1, -1));
          } else if (e.key === 'Enter' && highlightedIndex >= 0) {
            e.preventDefault();
            onSuggestionSelect(suggestions[highlightedIndex]);
            setShowSuggestions(false);
          } else if (e.key === 'Escape') {
            setShowSuggestions(false);
            setHighlightedIndex(-1);
          }
        }}
        placeholder={placeholder}
      />
      
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 rounded-md shadow-lg z-50 max-h-60 overflow-y-auto">
          {suggestions.map((suggestion, index) => (
            <div
              key={suggestion.id}
              className={`px-4 py-2 cursor-pointer hover:bg-gray-100 ${
                index === highlightedIndex ? 'bg-gray-100' : ''
              }`}
              onClick={() => {
                onSuggestionSelect(suggestion);
                setShowSuggestions(false);
              }}
            >
              <div className="font-medium">{suggestion.label}</div>
              <div className="text-sm text-gray-500">{suggestion.sublabel}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const EditableSiteIdentityCard: React.FC<Props> = ({ 
  customer, 
  onUpdate, 
  isNewCustomer = false 
}) => {
  const [editMode, setEditMode] = useState(isNewCustomer);
  const [formData, setFormData] = useState<Customer>(customer);
  const [suggestions, setSuggestions] = useState<CustomerSuggestion[]>([]);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [suggestedTier, setSuggestedTier] = useState<'CORE' | 'ASSURE' | 'GUARDIAN' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (editMode) {
      validateData();
    }
  }, [formData, editMode]);

  const validateData = async () => {
    const result = await SmartAutoCompleteService.validateCustomerData(formData);
    setValidation(result);
  };

  const handleCompanyNameChange = async (value: string) => {
    setFormData({ ...formData, company_name: value });
    
    if (value.length >= 2) {
      const customerSuggestions = await SmartAutoCompleteService.getCustomerSuggestions(value);
      setSuggestions(customerSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionSelect = async (suggestion: CustomerSuggestion) => {
    const autoFill = await SmartAutoCompleteService.autoPopulateCustomerFields(suggestion.value.id);
    if (autoFill) {
      setFormData({
        id: suggestion.value.id,
        company_name: autoFill.siteIdentity.company_name,
        site_nickname: autoFill.siteIdentity.site_nickname,
        site_number: autoFill.siteIdentity.site_number,
        service_tier: autoFill.siteIdentity.service_tier as 'CORE' | 'ASSURE' | 'GUARDIAN',
        system_platform: autoFill.siteIdentity.system_platform,
        total_contract_value: autoFill.contractInfo.total_value,
        has_active_contracts: autoFill.contractInfo.active_contracts.length > 0
      });
    }
    setSuggestions([]);
  };

  const generateNickname = () => {
    if (formData.company_name) {
      const suggestedNickname = SmartAutoCompleteService.generateSuggestedNickname(formData.company_name);
      setFormData({ ...formData, site_nickname: suggestedNickname });
    }
  };

  const calculateTierFromContracts = async () => {
    if (formData.id) {
      setIsLoading(true);
      try {
        const suggestedServiceTier = await SmartAutoCompleteService.calculateSuggestedServiceTier(formData.id);
        setSuggestedTier(suggestedServiceTier);
      } catch (error) {
        console.error('Error calculating service tier:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const applySuggestion = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSave = async () => {
    if (!validation?.isValid) {
      return;
    }

    setIsLoading(true);
    try {
      let savedCustomer = { ...formData };

      if (isNewCustomer || !formData.id) {
        // Create new customer
        const { data, error } = await supabase
          .from('customers')
          .insert({
            company_name: formData.company_name,
            site_nickname: formData.site_nickname,
            site_number: formData.site_number,
            service_tier: formData.service_tier,
            system_platform: formData.system_platform
          })
          .select()
          .single();

        if (error) throw error;
        savedCustomer = { ...formData, id: data.id };
      } else {
        // Update existing customer
        const { error } = await supabase
          .from('customers')
          .update({
            company_name: formData.company_name,
            site_nickname: formData.site_nickname,
            site_number: formData.site_number,
            service_tier: formData.service_tier,
            system_platform: formData.system_platform,
            updated_at: new Date().toISOString()
          })
          .eq('id', formData.id);

        if (error) throw error;
      }

      onUpdate(savedCustomer);
      setEditMode(false);
    } catch (error) {
      console.error('Error saving customer:', error);
      // You might want to show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData(customer);
    setEditMode(false);
    setValidation(null);
    setSuggestedTier(null);
  };

  if (editMode) {
    return (
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5" />
            {isNewCustomer ? 'New Site Identity' : 'Edit Site Identity'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
            {/* Company Name with Auto-complete */}
            <div>
              <Label htmlFor="company_name">Company Name *</Label>
              <AutoCompleteInput
                id="company_name"
                value={formData.company_name}
                onChange={handleCompanyNameChange}
                suggestions={suggestions}
                onSuggestionSelect={handleSuggestionSelect}
                placeholder="Start typing company name..."
              />
              {validation?.errors.find(e => e.field === 'company_name') && (
                <p className="text-sm text-red-600 mt-1">
                  {validation.errors.find(e => e.field === 'company_name')?.message}
                </p>
              )}
            </div>
            
            {/* Site Nickname with Auto-generation */}
            <div>
              <Label htmlFor="site_nickname">Site Nickname</Label>
              <div className="flex gap-2">
                <Input
                  id="site_nickname"
                  value={formData.site_nickname}
                  onChange={(e) => setFormData({...formData, site_nickname: e.target.value})}
                  placeholder="Quick reference name"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateNickname}
                  disabled={!formData.company_name}
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Site Number */}
            <div>
              <Label htmlFor="site_number">Site Number</Label>
              <Input
                id="site_number"
                value={formData.site_number}
                onChange={(e) => setFormData({...formData, site_number: e.target.value})}
                placeholder="SITE-XXXX"
              />
              {validation?.errors.find(e => e.field === 'site_number') && (
                <p className="text-sm text-red-600 mt-1">
                  {validation.errors.find(e => e.field === 'site_number')?.message}
                </p>
              )}
            </div>
            
            {/* Service Tier with Auto-calculation */}
            <div>
              <Label htmlFor="service_tier">Service Tier</Label>
              <div className="flex items-center gap-2">
                <Select 
                  value={formData.service_tier} 
                  onValueChange={(value) => setFormData({...formData, service_tier: value as 'CORE' | 'ASSURE' | 'GUARDIAN'})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CORE">CORE - Basic Service</SelectItem>
                    <SelectItem value="ASSURE">ASSURE - Enhanced Service</SelectItem>
                    <SelectItem value="GUARDIAN">GUARDIAN - Premium Service</SelectItem>
                  </SelectContent>
                </Select>
                {formData.id && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={calculateTierFromContracts}
                    disabled={isLoading}
                  >
                    <Calculator className="w-4 h-4" />
                  </Button>
                )}
              </div>
              {suggestedTier && suggestedTier !== formData.service_tier && (
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-blue-600">
                    Suggested: {suggestedTier} (based on contract value: ${formData.total_contract_value?.toLocaleString()})
                  </p>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFormData({...formData, service_tier: suggestedTier})}
                  >
                    Apply
                  </Button>
                </div>
              )}
            </div>
            
            {/* System Platform */}
            <div>
              <Label htmlFor="system_platform">System Platform</Label>
              <Select 
                value={formData.system_platform} 
                onValueChange={(value) => setFormData({...formData, system_platform: value})}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select platform" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Niagara-N4">Niagara N4</SelectItem>
                  <SelectItem value="Niagara-FX">Facility Explorer (FX)</SelectItem>
                  <SelectItem value="Niagara-WEBs">Honeywell WEBs</SelectItem>
                  <SelectItem value="Mixed-Platform">Mixed Platform</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Validation Messages */}
            {validation && (
              <div className="space-y-2">
                {validation.errors.map((error, index) => (
                  <div key={index} className="flex items-center gap-2 text-sm text-red-600">
                    <AlertTriangle className="w-4 h-4" />
                    {error.message}
                  </div>
                ))}
                
                {validation.suggestions.map((suggestion, index) => (
                  <div key={index} className="flex items-center justify-between bg-blue-50 p-2 rounded">
                    <div className="text-sm">
                      <strong>{suggestion.field}:</strong> {suggestion.suggestion}
                      <div className="text-xs text-gray-600">{suggestion.reason}</div>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => applySuggestion(suggestion.field, suggestion.suggestion)}
                    >
                      Apply
                    </Button>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={!validation?.isValid || isLoading}
              >
                <Check className="w-4 h-4 mr-1" />
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-1" />
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    );
  }

  // Display mode
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Building2 className="w-5 h-5" />
          Site Identity
        </CardTitle>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setEditMode(true)}
        >
          <Edit2 className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <div className="font-medium text-lg">{customer.company_name}</div>
          {customer.site_nickname && (
            <div className="text-sm text-gray-600">"{customer.site_nickname}"</div>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          {customer.site_number && (
            <Badge variant="secondary">{customer.site_number}</Badge>
          )}
          <Badge 
            variant={
              customer.service_tier === 'GUARDIAN' ? 'default' : 
              customer.service_tier === 'ASSURE' ? 'secondary' : 
              'outline'
            }
          >
            {customer.service_tier}
          </Badge>
        </div>

        {customer.system_platform && (
          <div className="text-sm">
            <span className="font-medium">Platform:</span> {customer.system_platform}
          </div>
        )}

        {customer.has_active_contracts && customer.total_contract_value && (
          <div className="text-sm text-green-600">
            <span className="font-medium">Contract Value:</span> ${customer.total_contract_value.toLocaleString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
