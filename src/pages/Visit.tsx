import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { WorkflowDashboard } from '@/components/visit/WorkflowDashboard';
import { AMEService } from '@/services/ameService';
import { Customer } from '@/types';
import { Loader2 } from 'lucide-react';

export const Visit = () => {
  const { customerId } = useParams<{ customerId: string }>();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCustomer = async () => {
      if (!customerId) return;
      
      try {
        setLoading(true);
        const customerData = await AMEService.getCustomer(customerId);
        setCustomer(customerData);
      } catch (error) {
        console.error('Failed to load customer:', error);
      } finally {
        setLoading(false);
      }
    };

    loadCustomer();
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading customer information...</p>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Customer Not Found</h2>
          <p className="text-muted-foreground">The requested customer could not be found.</p>
        </div>
      </div>
    );
  }

  return <WorkflowDashboard customer={customer} />;
};