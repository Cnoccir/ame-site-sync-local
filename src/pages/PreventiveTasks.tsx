import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { AMEService } from '@/services/ameService';
import { Customer } from '@/types';
import { 
  Search, 
  Target, 
  Building2, 
  MapPin, 
  Clock,
  CheckCircle2,
  ArrowRight,
  FileBarChart
} from 'lucide-react';
import { logger } from '@/utils/logger';

export function PreventiveTasks() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Load customers on mount
  useEffect(() => {
    const loadCustomers = async () => {
      try {
        setLoading(true);
        const customerList = await AMEService.getCustomers();
        setCustomers(customerList);
      } catch (err) {
        logger.error('Failed to load customers:', err);
        setError('Failed to load customers');
      } finally {
        setLoading(false);
      }
    };

    loadCustomers();
  }, []);

  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer =>
    customer.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.site_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.site_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.service_tier?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleStartPM = (customerId: string) => {
    // Navigate to PM workflow with pre-filled customer data
    navigate(`/pm-workflow?preloadCustomer=${customerId}`);
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'CORE': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'ASSURE': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'GUARDIAN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTaskCount = (tier: string) => {
    switch (tier) {
      case 'CORE': return 8;
      case 'ASSURE': return 15;
      case 'GUARDIAN': return 21;
      default: return 8;
    }
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-red-600">Error: {error}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Target className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">PM Workflow Guide</h1>
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            NEW SYSTEM
          </Badge>
        </div>
        <p className="text-lg text-muted-foreground">
          Quick-start PM workflow with pre-filled customer data, or{' '}
          <button 
            onClick={() => navigate('/pm-workflow')} 
            className="text-primary hover:underline font-medium"
          >
            start a blank workflow here
          </button>
        </p>
        <div className="mt-3 text-sm text-blue-600 bg-blue-50 dark:bg-blue-950 dark:text-blue-400 p-3 rounded-lg">
          <strong>✨ New Features:</strong> Step-by-step SOP guidance • Real-time task tracking • Professional PDF reports • Service tier optimization
        </div>
      </div>

      {/* Search */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search customers by name, site, or service tier..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4 w-2/3"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Customer Grid */}
      {!loading && (
        <>
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} available
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileBarChart className="h-3 w-3" />
              <span>Ready for professional report generation</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCustomers.map((customer) => (
              <Card 
                key={customer.id} 
                className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary/20 hover:border-l-primary cursor-pointer group"
                onClick={() => handleStartPM(customer.id)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate group-hover:text-primary transition-colors">
                        {customer.company_name}
                      </CardTitle>
                      {customer.site_name && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Building2 className="h-3 w-3" />
                          <span className="truncate">{customer.site_name}</span>
                        </div>
                      )}
                    </div>
                    <Badge className={getTierColor(customer.service_tier)}>
                      {customer.service_tier}
                    </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-0">
                  {customer.site_address && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground mb-3">
                      <MapPin className="h-3 w-3" />
                      <span className="truncate">{customer.site_address}</span>
                    </div>
                  )}

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="h-4 w-4 text-primary" />
                      <span>{getTaskCount(customer.service_tier)} PM tasks included</span>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>Est. {Math.round(getTaskCount(customer.service_tier) * 2.5)} min completion</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <FileBarChart className="h-4 w-4" />
                      <span>Professional report generated</span>
                    </div>
                  </div>

                  <Button 
                    className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all"
                    variant="outline"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Start PM Workflow
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCustomers.length === 0 && !loading && (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No customers found</h3>
                <p className="text-muted-foreground mb-4">
                  {searchTerm 
                    ? `No customers match "${searchTerm}". Try a different search term.`
                    : 'No customers available for PM services.'
                  }
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear search
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </>
      )}

      {/* Footer Info */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/5 rounded-full text-sm text-primary">
          <Target className="h-4 w-4" />
          <span>PM Workflow Guide - Systematic 4-phase process with professional reporting</span>
        </div>
      </div>
    </div>
  );
}

export { PreventiveTasks as default };
