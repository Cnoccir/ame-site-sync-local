import React, { useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchableCombobox, ComboboxOption } from '@/components/ui/searchable-combobox';
import { Button } from '@/components/ui/button';
import {
  Search,
  Building,
  Plus,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { AMECustomerService, AMECustomer } from '@/services/ameCustomerService';
import { NewCustomerWizard } from '@/components/customers/NewCustomerWizard';
import { useToast } from '@/hooks/use-toast';
import { debounce } from 'lodash';

export const QuickSearch = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<AMECustomer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewCustomerWizard, setShowNewCustomerWizard] = useState(false);

  // Debounced search function
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (!query || query.length < 2) {
        setCustomers([]);
        return;
      }

      try {
        setLoading(true);
        const results = await AMECustomerService.searchCustomers(query);
        setCustomers(results.slice(0, 20)); // Limit to 20 results
      } catch (error) {
        console.error('Search error:', error);
        toast({
          title: 'Search Error',
          description: 'Failed to search customers',
          variant: 'destructive'
        });
      } finally {
        setLoading(false);
      }
    }, 300),
    [toast]
  );

  // Convert customers to combobox options
  const customerOptions: ComboboxOption[] = useMemo(() => {
    return customers.map(customer => ({
      id: customer.id,
      name: customer.company_name,
      description: customer.site_name,
      subtitle: `${customer.service_tier} • ${customer.system_type || 'BMS'}`
    }));
  }, [customers]);

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    debouncedSearch(query);
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomerId(customerId);
  };

  const handleVisitCustomer = () => {
    if (selectedCustomerId) {
      navigate(`/visit/${selectedCustomerId}`);
    }
  };

  const handleNewCustomer = () => {
    setShowNewCustomerWizard(true);
  };

  const handleCustomerCreated = () => {
    toast({
      title: 'Customer Created',
      description: 'New customer has been added successfully'
    });
    // Optionally refresh search results if there's an active search
    if (searchQuery) {
      debouncedSearch(searchQuery);
    }
  };

  const handleViewAllCustomers = () => {
    navigate('/customers');
  };

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  return (
    <div className="space-y-6">
      {/* Quick search header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Quick Customer Search
        </h2>
        <p className="text-sm text-gray-600">
          Find customers, sites, and equipment for PM visits
        </p>
      </div>

      {/* Search interface */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Search className="w-4 h-4 text-blue-600" />
            Search Customers & Sites
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search combobox */}
          <SearchableCombobox
            options={customerOptions}
            value={selectedCustomerId}
            onValueChange={handleCustomerSelect}
            placeholder="Search by company name, site name, or location..."
            searchPlaceholder="Type to search customers..."
            emptyText={searchQuery.length < 2 ? "Type at least 2 characters to search" : "No customers found"}
            loading={loading}
            allowClear
            className="w-full"
          />

          {/* Selected customer details */}
          {selectedCustomer && (
            <Card className="bg-blue-50/50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Building className="w-4 h-4 text-blue-600" />
                      <h4 className="font-medium text-gray-900">
                        {selectedCustomer.company_name}
                      </h4>
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
                        {selectedCustomer.service_tier}
                      </span>
                    </div>

                    {selectedCustomer.site_name && (
                      <div className="flex items-center gap-1 text-sm text-gray-600 mb-1">
                        <MapPin className="w-3 h-3" />
                        {selectedCustomer.site_name}
                      </div>
                    )}

                    {selectedCustomer.site_address && (
                      <p className="text-sm text-gray-600 mb-2">
                        {selectedCustomer.site_address}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      {selectedCustomer.system_type && (
                        <span>System: {selectedCustomer.system_type}</span>
                      )}
                      {selectedCustomer.last_service && (
                        <span>
                          Last service: {new Date(selectedCustomer.last_service).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>

                  <Button
                    onClick={handleVisitCustomer}
                    className="ml-4 shrink-0"
                  >
                    Visit Site
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Quick actions */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t">
            <Button
              variant="outline"
              onClick={handleNewCustomer}
              className="flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Customer
            </Button>

            <Button
              variant="outline"
              onClick={handleViewAllCustomers}
              className="flex items-center gap-2"
            >
              <Building className="w-4 h-4" />
              View All Customers
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent searches or shortcuts could go here */}
      <div className="text-center">
        <p className="text-xs text-gray-500">
          Tip: Use keywords like company name, site nickname, or location to find customers quickly
        </p>
      </div>

      {/* New Customer Wizard */}
      <NewCustomerWizard
        isOpen={showNewCustomerWizard}
        onClose={() => setShowNewCustomerWizard(false)}
        onCustomerCreated={handleCustomerCreated}
      />
    </div>
  );
};