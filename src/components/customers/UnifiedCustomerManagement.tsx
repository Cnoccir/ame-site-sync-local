import React, { useState, useEffect } from 'react';
import { Search, Plus, RefreshCw, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AMEService } from '@/services/ameService';
import { Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { EnhancedCustomerDisplayCard } from './EnhancedCustomerDisplayCard';
import { UnifiedCustomerEditor } from './UnifiedCustomerEditor';
import { NewCustomerWizard } from './NewCustomerWizard';

export const UnifiedCustomerManagement: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTier, setFilterTier] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);
  
  // Editor states
  const [showNewCustomerWizard, setShowNewCustomerWizard] = useState(false);
  const [showCustomerEditor, setShowCustomerEditor] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [editorMode, setEditorMode] = useState<'view' | 'edit'>('view');
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [customerToDelete, setCustomerToDelete] = useState<Customer | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    filterCustomers();
  }, [customers, searchQuery, filterTier, filterStatus]);

  const loadCustomers = async () => {
    try {
      setIsLoading(true);
      const customerData = await AMEService.getCustomers();
      setCustomers(customerData);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: 'Error',
        description: 'Failed to load customers',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filterCustomers = () => {
    let filtered = [...customers];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(customer =>
        customer.company_name?.toLowerCase().includes(query) ||
        customer.site_name?.toLowerCase().includes(query) ||
        customer.customer_id?.toLowerCase().includes(query) ||
        customer.site_address?.toLowerCase().includes(query) ||
        customer.primary_contact?.toLowerCase().includes(query)
      );
    }

    // Service tier filter
    if (filterTier !== 'all') {
      filtered = filtered.filter(customer => customer.service_tier === filterTier);
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(customer => customer.contract_status === filterStatus);
    }

    setFilteredCustomers(filtered);
  };

  const handleNewCustomer = () => {
    setShowNewCustomerWizard(true);
  };

  const handleCustomerCreated = () => {
    loadCustomers();
    setShowNewCustomerWizard(false);
    toast({
      title: 'Success',
      description: 'Customer created successfully',
    });
  };

  const handleEditCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditorMode('edit');
    setShowCustomerEditor(true);
  };

  const handleViewCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setEditorMode('view');
    setShowCustomerEditor(true);
  };

  const handleCustomerUpdated = (updatedCustomer: Customer) => {
    setCustomers(prev => 
      prev.map(customer => 
        customer.id === updatedCustomer.id ? updatedCustomer : customer
      )
    );
    setShowCustomerEditor(false);
    setSelectedCustomer(null);
    toast({
      title: 'Success',
      description: 'Customer updated successfully',
    });
  };

  const handleExpandToggle = (customerId: string) => {
    setExpandedCustomer(expandedCustomer === customerId ? null : customerId);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setFilterTier('all');
    setFilterStatus('all');
  };

  const handleDeleteCustomer = (customer: Customer) => {
    setCustomerToDelete(customer);
    setShowDeleteConfirmation(true);
  };

  const confirmDeleteCustomer = async () => {
    if (!customerToDelete) return;

    try {
      setIsDeleting(true);
      await AMEService.deleteCustomer(customerToDelete.id!);
      
      setCustomers(prev => prev.filter(customer => customer.id !== customerToDelete.id));
      
      toast({
        title: 'Customer Deleted',
        description: `${customerToDelete.company_name} has been successfully deleted.`,
      });
      
      setShowDeleteConfirmation(false);
      setCustomerToDelete(null);
    } catch (error) {
      console.error('Error deleting customer:', error);
      toast({
        title: 'Delete Failed',
        description: 'Failed to delete customer. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteCustomer = () => {
    setShowDeleteConfirmation(false);
    setCustomerToDelete(null);
  };


  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Customer Management</h1>
          <p className="text-gray-600 mt-1">
            Manage customers, access information, and project folders
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={loadCustomers} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={handleNewCustomer} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>


      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">Search</label>
              <Input
                placeholder="Search customers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Service Tier</label>
              <Select value={filterTier} onValueChange={setFilterTier}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tiers</SelectItem>
                  <SelectItem value="CORE">CORE</SelectItem>
                  <SelectItem value="ASSURE">ASSURE</SelectItem>
                  <SelectItem value="GUARDIAN">GUARDIAN</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Contract Status</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer List */}
      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">Loading customers...</p>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search className="w-16 h-16 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {customers.length === 0 ? 'No customers found' : 'No customers match your filters'}
              </h3>
              <p className="text-gray-600 mb-4">
                {customers.length === 0 
                  ? 'Get started by adding your first customer.'
                  : 'Try adjusting your search terms or filters.'
                }
              </p>
              {customers.length === 0 && (
                <Button onClick={handleNewCustomer} className="bg-blue-600 hover:bg-blue-700">
                  <Plus className="w-4 h-4 mr-2" />
                  Add First Customer
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredCustomers.map((customer) => (
            <EnhancedCustomerDisplayCard
              key={customer.id}
              customer={customer}
              onEdit={() => handleEditCustomer(customer)}
              onViewDetails={() => handleViewCustomer(customer)}
              onDelete={() => handleDeleteCustomer(customer)}
              isExpanded={expandedCustomer === customer.id}
              onExpandToggle={() => handleExpandToggle(customer.id)}
            />
          ))
        )}
      </div>

      {/* New Customer Wizard */}
      <NewCustomerWizard
        isOpen={showNewCustomerWizard}
        onClose={() => setShowNewCustomerWizard(false)}
        onCustomerCreated={handleCustomerCreated}
      />

      {/* Unified Customer Editor */}
      {selectedCustomer && (
        <UnifiedCustomerEditor
          isOpen={showCustomerEditor}
          onClose={() => {
            setShowCustomerEditor(false);
            setSelectedCustomer(null);
          }}
          customer={selectedCustomer}
          onCustomerUpdated={handleCustomerUpdated}
          mode={editorMode}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteConfirmation} onOpenChange={setShowDeleteConfirmation}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Delete Customer</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            {customerToDelete && (
              <>
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete the following customer?
                </p>
                <div className="bg-gray-50 p-3 rounded-lg mb-4">
                  <div className="font-medium">{customerToDelete.company_name}</div>
                  <div className="text-sm text-gray-600">{customerToDelete.customer_id}</div>
                  <div className="text-sm text-gray-600">{customerToDelete.site_address}</div>
                </div>
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg">
                  <p className="text-sm text-red-800">
                    <strong>Warning:</strong> This action cannot be undone. All customer data, 
                    including project files, service history, and credentials will be permanently deleted.
                  </p>
                </div>
              </>
            )}
          </div>
          <div className="flex justify-end space-x-2">
            <Button 
              variant="outline" 
              onClick={cancelDeleteCustomer}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={confirmDeleteCustomer}
              disabled={isDeleting}
            >
              {isDeleting ? 'Deleting...' : 'Delete Customer'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
