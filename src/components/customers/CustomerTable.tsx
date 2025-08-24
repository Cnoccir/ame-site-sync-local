import { useState } from 'react';
import { Search, Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Customer } from '@/types';
import { NewCustomerWizard } from './NewCustomerWizard';
import { CustomerCard } from './CustomerCard';

interface CustomerTableProps {
  customers: Customer[];
  onCustomerSelect?: (customer: Customer) => void;
  onCustomersChanged?: () => void;
}

export const CustomerTable = ({ customers, onCustomerSelect, onCustomersChanged }: CustomerTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('All Tiers');
  const [statusFilter, setStatusFilter] = useState<string>('All Status');
  const [showNewCustomerWizard, setShowNewCustomerWizard] = useState(false);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesService = serviceFilter === 'All Tiers' || customer.service_tier === serviceFilter;
    const matchesStatus = statusFilter === 'All Status' || customer.contract_status === statusFilter;
    
    return matchesSearch && matchesService && matchesStatus;
  });


  return (
    <Card className="border-card-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm" onClick={() => onCustomersChanged?.()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button 
              size="sm" 
              className="bg-primary hover:bg-primary-hover"
              onClick={() => setShowNewCustomerWizard(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add New Customer
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search by company name, ID, or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <select 
              value={serviceFilter}
              onChange={(e) => setServiceFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
            >
              <option>All Tiers</option>
              <option>CORE</option>
              <option>ASSURE</option>
              <option>GUARDIAN</option>
            </select>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm bg-background text-foreground"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Pending</option>
              <option>Expired</option>
            </select>
          </div>
        </div>

        {/* Customer Cards */}
        <div className="space-y-4">
          {filteredCustomers.map((customer) => (
            <CustomerCard
              key={customer.id}
              customer={customer}
              onCustomerUpdated={() => onCustomersChanged?.()}
            />
          ))}
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No customers found matching your criteria.</p>
          </div>
        )}

        {/* New Customer Wizard */}
        <NewCustomerWizard
          isOpen={showNewCustomerWizard}
          onClose={() => setShowNewCustomerWizard(false)}
          onCustomerCreated={() => onCustomersChanged?.()}
        />
      </CardContent>
    </Card>
  );
};