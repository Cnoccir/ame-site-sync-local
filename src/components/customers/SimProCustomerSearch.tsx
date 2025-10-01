import React, { useState, useEffect, useRef } from 'react';
import { Search, Building, MapPin, Sparkles, CheckCircle, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  SupabaseSimProService, 
  SimProCustomerSuggestion, 
  SimProCustomerAutoFill 
} from '@/services/supabaseSimProService';

interface SimProCustomerSearchProps {
  onAutofill: (data: Partial<any>) => void;
  currentCompanyName?: string;
  disabled?: boolean;
}

export const SimProCustomerSearch: React.FC<SimProCustomerSearchProps> = ({
  onAutofill,
  currentCompanyName = '',
  disabled = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<SimProCustomerSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState<SimProCustomerSuggestion | null>(null);
  const [autofillData, setAutofillData] = useState<SimProCustomerAutoFill | null>(null);
  const [showAutofillPreview, setShowAutofillPreview] = useState(false);
  
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Initialize search with current company name
  useEffect(() => {
    if (currentCompanyName && !searchQuery) {
      setSearchQuery(currentCompanyName);
    }
  }, [currentCompanyName]);

  // Handle search as user types
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch(searchQuery.trim());
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  // Handle clicks outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const performSearch = async (query: string) => {
    if (disabled) return;
    
    try {
      setIsSearching(true);
      const results = await SupabaseSimProService.searchCustomersCombined(query);
      setSuggestions(results);
      setShowSuggestions(results.length > 0);
    } catch (error) {
      console.error('Error searching SimPro customers:', error);
      toast({
        title: 'Search Error',
        description: 'Failed to search SimPro customers. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionSelect = async (suggestion: SimProCustomerSuggestion) => {
    setSelectedSuggestion(suggestion);
    setShowSuggestions(false);
    setSearchQuery(suggestion.company_name);
    
    try {
      setIsLoadingDetails(true);
      const details = await SupabaseSimProService.getCustomerAutofill(suggestion.id);
      
      if (details) {
        setAutofillData(details);
        setShowAutofillPreview(true);
      } else {
        toast({
          title: 'No Details Available',
          description: 'Could not retrieve detailed information for this customer.',
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error loading customer details:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customer details. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const handleAutofillConfirm = () => {
    if (autofillData) {
      const formData = SupabaseSimProService.mapToFormData(autofillData);
      onAutofill(formData);
      setShowAutofillPreview(false);
      toast({
        title: 'Autofill Complete',
        description: 'Customer information has been filled from SimPro data.',
      });
    }
  };

  const handleAutofillCancel = () => {
    setShowAutofillPreview(false);
    setSelectedSuggestion(null);
    setAutofillData(null);
  };

  const formatSimilarityScore = (score?: number) => {
    if (!score) return '';
    return `${Math.round(score * 100)}% match`;
  };

  return (
    <div className="space-y-4">
      {/* Search Input */}
      <div className="relative" ref={searchRef}>
<Label htmlFor="simpro-search" className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-500" />
          Customer Lookup
        </Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            id="simpro-search"
            ref={inputRef}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
placeholder="Search AME customers to autofill data..."
            className="pl-10 pr-10"
            disabled={disabled}
          />
          {isSearching && (
            <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
          )}
        </div>
        
        {/* Search Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-64 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <div
                key={`${suggestion.id}-${index}`}
                className="p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                onClick={() => handleSuggestionSelect(suggestion)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span className="font-medium text-gray-900">{suggestion.company_name}</span>
                      {suggestion.service_tier && (
                        <Badge variant="outline" className="text-xs">
                          {suggestion.service_tier}
                        </Badge>
                      )}
                    </div>
                    {(suggestion.mailing_address || suggestion.mailing_city) && (
                      <div className="flex items-center gap-1 mt-1 text-sm text-gray-600">
                        <MapPin className="w-3 h-3 text-gray-400" />
                        <span>{SupabaseSimProService.formatAddress(suggestion)}</span>
                      </div>
                    )}
                    {suggestion.email && (
                      <div className="text-sm text-gray-600 mt-1">
                        {suggestion.email}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {suggestion.similarity_score && (
                      <div className="text-xs text-green-600 font-medium">
                        {formatSimilarityScore(suggestion.similarity_score)}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Loading State */}
      {isLoadingDetails && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
              <span className="text-gray-600">Loading customer details...</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Autofill Preview */}
      {showAutofillPreview && autofillData && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-yellow-600" />
                <h4 className="font-semibold text-gray-900">Autofill Preview</h4>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAutofillCancel}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Company:</span>
                  <div className="text-gray-900">{autofillData.company_name}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Service Tier:</span>
                  <div className="text-gray-900">
                    <Badge className="ml-1">{autofillData.service_tier}</Badge>
                  </div>
                </div>
                <div className="col-span-2">
                  <span className="font-medium text-gray-700">Address:</span>
                  <div className="text-gray-900">
                    {SupabaseSimProService.formatAddress({
                      id: '',
                      company_name: '',
                      mailing_address: autofillData.mailing_address,
                      mailing_city: autofillData.mailing_city,
                      mailing_state: autofillData.mailing_state,
                      mailing_zip: autofillData.mailing_zip
                    })}
                  </div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <div className="text-gray-900">{autofillData.email || autofillData.latest_contract_email || 'N/A'}</div>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Contract Status:</span>
                  <div className="text-gray-900">
                    {autofillData.has_active_contracts ? (
                      <Badge className="bg-green-100 text-green-800 ml-1">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="ml-1">Inactive</Badge>
                    )}
                  </div>
                </div>
                {autofillData.total_contract_value && autofillData.total_contract_value > 0 && (
                  <div className="col-span-2">
                    <span className="font-medium text-gray-700">Contract Value:</span>
                    <div className="text-gray-900">
                      ${autofillData.total_contract_value.toLocaleString()}
                      {autofillData.active_contract_count && (
                        <span className="text-gray-600 ml-2">
                          ({autofillData.active_contract_count} active contract{autofillData.active_contract_count !== 1 ? 's' : ''})
                        </span>
                      )}
                    </div>
                  </div>
                )}
                {autofillData.latest_contract_number && (
                  <div>
                    <span className="font-medium text-gray-700">Latest Contract:</span>
                    <div className="text-gray-900">{autofillData.latest_contract_number}</div>
                  </div>
                )}
                {autofillData.latest_contract_name && (
                  <div>
                    <span className="font-medium text-gray-700">Contract Name:</span>
                    <div className="text-gray-900 text-sm">{autofillData.latest_contract_name}</div>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-yellow-200">
                <div className="text-xs text-gray-600">
                  This will autofill available fields with SimPro data
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleAutofillCancel}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleAutofillConfirm}
                    className="bg-yellow-600 hover:bg-yellow-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Autofill Form
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
