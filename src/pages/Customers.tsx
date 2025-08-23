import { useState, useEffect } from 'react';
import { CustomerTable } from '@/components/customers/CustomerTable';
import { sampleCustomers } from '@/data/sampleData';
import { Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';

export const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    // In a real app, this would fetch from an API
    setCustomers(sampleCustomers);
  }, []);

  const handleCustomerSelect = (customer: Customer) => {
    toast({
      title: "Customer Selected",
      description: `Selected ${customer.company_name} - ${customer.site_name}`,
    });
  };

  const handleStartVisit = (customer: Customer) => {
    toast({
      title: "Starting Visit",
      description: `Initiating maintenance visit for ${customer.company_name}`,
    });
    // In a real app, this would navigate to the visit workflow
  };

  return (
    <div className="space-y-6">
      <CustomerTable 
        customers={customers}
        onCustomerSelect={handleCustomerSelect}
        onStartVisit={handleStartVisit}
      />
    </div>
  );
};