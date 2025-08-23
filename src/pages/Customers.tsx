import { useState, useEffect } from 'react';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { AMEService } from '@/services/ameService';

export const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
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

  const handleCustomerSelect = (customer: Customer) => {
    toast({
      title: "Customer Selected",
      description: `Selected ${customer.company_name} - ${customer.site_name}`,
    });
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 animate-spin border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading customers...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <CustomerTable 
        customers={customers}
        onCustomerSelect={handleCustomerSelect}
      />
    </div>
  );
};