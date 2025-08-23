import { useState } from 'react';
import { MoreHorizontal, Search, Plus, RefreshCw, Edit, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Customer } from '@/types';
import { cn } from '@/lib/utils';

interface CustomerTableProps {
  customers: Customer[];
  onCustomerSelect?: (customer: Customer) => void;
}

export const CustomerTable = ({ customers, onCustomerSelect }: CustomerTableProps) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState<string>('All Tiers');
  const [statusFilter, setStatusFilter] = useState<string>('All Status');

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.site_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.customer_id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesService = serviceFilter === 'All Tiers' || customer.service_tier === serviceFilter;
    const matchesStatus = statusFilter === 'All Status' || customer.contract_status === statusFilter;
    
    return matchesSearch && matchesService && matchesStatus;
  });

  const getServiceTierBadge = (tier: Customer['service_tier']) => {
    const variants = {
      CORE: 'bg-tier-core text-white',
      ASSURE: 'bg-tier-assure text-white',
      GUARDIAN: 'bg-tier-guardian text-white'
    };
    
    return (
      <Badge className={cn('font-medium', variants[tier])}>
        {tier}
      </Badge>
    );
  };

  const getStatusBadge = (status: Customer['contract_status']) => {
    const variants = {
      Active: 'bg-success text-success-foreground',
      Inactive: 'bg-muted text-muted-foreground',
      Pending: 'bg-warning text-warning-foreground',
      Expired: 'bg-danger text-danger-foreground'
    };
    
    return (
      <Badge variant="outline" className={cn(variants[status])}>
        {status}
      </Badge>
    );
  };

  const formatNextDue = (date?: string) => {
    if (!date) return 'Not scheduled';
    
    const dueDate = new Date(date);
    const today = new Date();
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return <span className="text-danger font-medium">Overdue</span>;
    } else if (diffDays === 0) {
      return <span className="text-warning font-medium">Due Today</span>;
    } else if (diffDays <= 7) {
      return <span className="text-warning font-medium">Due in {diffDays} days</span>;
    } else {
      return dueDate.toLocaleDateString();
    }
  };

  return (
    <Card className="border-card-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-semibold">Customer Management</CardTitle>
          </div>
          <div className="flex items-center space-x-2">
            <Button variant="outline" size="sm">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button size="sm" className="bg-primary hover:bg-primary-hover">
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
              className="px-3 py-2 border border-input rounded-md text-sm bg-background"
            >
              <option>All Tiers</option>
              <option>CORE</option>
              <option>ASSURE</option>
              <option>GUARDIAN</option>
            </select>
            
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-input rounded-md text-sm bg-background"
            >
              <option>All Status</option>
              <option>Active</option>
              <option>Inactive</option>
              <option>Pending</option>
              <option>Expired</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="border border-table-border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-table-header">
                <TableHead className="font-semibold text-foreground">COMPANY</TableHead>
                <TableHead className="font-semibold text-foreground">SITE</TableHead>
                <TableHead className="font-semibold text-foreground">SERVICE TIER</TableHead>
                <TableHead className="font-semibold text-foreground">CONTACT</TableHead>
                <TableHead className="font-semibold text-foreground">SYSTEM</TableHead>
                <TableHead className="font-semibold text-foreground">NEXT DUE</TableHead>
                <TableHead className="font-semibold text-foreground">STATUS</TableHead>
                <TableHead className="font-semibold text-foreground">ACTIONS</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCustomers.map((customer) => (
                <TableRow 
                  key={customer.id}
                  className="hover:bg-table-row-hover cursor-pointer"
                  onClick={() => onCustomerSelect?.(customer)}
                >
                  <TableCell>
                    <div>
                      <div className="font-medium text-foreground">{customer.company_name}</div>
                      <div className="text-sm text-muted-foreground">{customer.customer_id}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">{customer.site_name}</div>
                  </TableCell>
                  <TableCell>
                    {getServiceTierBadge(customer.service_tier)}
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="text-sm font-medium text-foreground">{customer.primary_contact}</div>
                      <div className="text-xs text-muted-foreground">{customer.contact_phone}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-foreground">{customer.system_type}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{formatNextDue(customer.next_due)}</div>
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(customer.contract_status)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Edit className="w-4 h-4 mr-2" />
                          Edit Customer
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredCustomers.length === 0 && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">No customers found matching your criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};