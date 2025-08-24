import { useState, useEffect } from 'react';
import { Search, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { AMEService } from '@/services/ameService';
import { ProjectVisitManager } from '@/components/projects/ProjectVisitManager';
import { ActiveVisitsDisplay } from '@/components/projects/ActiveVisitsDisplay';

export const Projects = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [serviceFilter, setServiceFilter] = useState('All Tiers');
  const [statusFilter, setStatusFilter] = useState('All Status');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const data = await AMEService.getCustomers();
        setCustomers(data);
      } catch (error) {
        console.error('Failed to load customers:', error);
        toast({
          title: "Error",
          description: "Failed to load customer data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, [toast]);

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


  return (
    <div className="space-y-6">
      <Card className="border-card-border shadow-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
          
          <ActiveVisitsDisplay />
        </CardHeader>
        
        <CardContent>
          {/* Search and Filters */}
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

          {/* Projects Table */}
          <div className="border border-table-border rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="w-8 h-8 animate-spin border-4 border-primary border-t-transparent rounded-full"></div>
              </div>
            ) : (
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
                      className="hover:bg-table-row-hover"
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
                        <div className="text-sm text-foreground">
                          {customer.next_due ? new Date(customer.next_due).toLocaleDateString() : 'Not scheduled'}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(customer.contract_status)}
                      </TableCell>
                      <TableCell>
                        <ProjectVisitManager customer={customer} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>

          {!loading && filteredCustomers.length === 0 && (
            <div className="text-center py-12">
              <div className="text-muted-foreground space-y-2">
                <p className="text-lg font-medium">No customers found</p>
                <p className="text-sm">Try adjusting your search filters or import customer data</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};