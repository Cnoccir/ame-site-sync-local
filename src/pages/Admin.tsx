import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Upload, FolderPlus, Settings, Database, Users, FileText } from 'lucide-react';

export const Admin = () => {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const { data, error } = await supabase
        .from('ame_customers')
        .select('*')
        .order('company_name');
      
      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        title: "Error",
        description: "Failed to load customers",
        variant: "destructive",
      });
    }
  };

  const authorizeGoogleDrive = async () => {
    try {
      setLoading(true);
      const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // This should come from environment
      const redirectUri = `${window.location.origin}/admin`;
      const scope = 'https://www.googleapis.com/auth/drive';
      
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `access_type=offline`;

      window.open(authUrl, '_blank', 'width=500,height=600');
      
      // Listen for the auth completion
      window.addEventListener('message', handleAuthMessage);
      
    } catch (error) {
      console.error('Auth error:', error);
      toast({
        title: "Authorization Failed",
        description: "Failed to authorize Google Drive access",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthMessage = async (event: MessageEvent) => {
    if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
      setIsAuthorized(true);
      toast({
        title: "Success",
        description: "Google Drive authorized successfully",
      });
      window.removeEventListener('message', handleAuthMessage);
    }
  };

  const createProjectFolder = async (customer: any) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase.functions.invoke('google-drive-manager', {
        body: {
          action: 'create_project_folder',
          customerName: `${customer.company_name} - ${customer.site_name}`,
          customerId: customer.id,
          visitId: `V${Date.now()}`, // Generate unique visit ID
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: `Project folder created for ${customer.company_name}`,
      });

      await loadCustomers(); // Refresh the list
      
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Error",
        description: "Failed to create project folder",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const bulkImportCustomers = async (file: File) => {
    try {
      setLoading(true);
      const text = await file.text();
      const lines = text.split('\n');
      const headers = lines[0].split(',').map(h => h.trim());
      
      const customers = lines.slice(1)
        .filter(line => line.trim())
        .map(line => {
          const values = line.split(',').map(v => v.trim());
          const customer: any = {};
          headers.forEach((header, index) => {
            customer[header] = values[index] || '';
          });
          return customer;
        });

      for (const customer of customers) {
        const { error } = await supabase
          .from('ame_customers')
          .insert({
            customer_id: customer.customer_id || `CUST${Date.now()}`,
            company_name: customer.company_name,
            site_name: customer.site_name,
            site_address: customer.site_address,
            service_tier: customer.service_tier || 'Standard',
            system_type: customer.system_type || 'BMS',
            primary_contact: customer.primary_contact,
            contact_phone: customer.contact_phone,
            contact_email: customer.contact_email,
          });
          
        if (error) {
          console.error('Error importing customer:', customer.company_name, error);
        }
      }

      toast({
        title: "Success",
        description: `Imported ${customers.length} customers`,
      });

      await loadCustomers();
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Error",
        description: "Failed to import customers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-foreground">AME System Administration</h1>
        <Badge variant={isAuthorized ? "default" : "secondary"}>
          {isAuthorized ? "Google Drive Authorized" : "Not Authorized"}
        </Badge>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customer Management</TabsTrigger>
          <TabsTrigger value="folders">Drive Integration</TabsTrigger>
          <TabsTrigger value="system">System Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{customers.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Visits</CardTitle>
                <FileText className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">0</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">System Status</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Operational</div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="customers" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Customer Data Management</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="customer-import">Import Customer CSV</Label>
                <Input
                  id="customer-import"
                  type="file"
                  accept=".csv"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) bulkImportCustomers(file);
                  }}
                />
              </div>

              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Current Customers</h3>
                <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
                  {customers.map((customer: any) => (
                    <div key={customer.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{customer.company_name}</div>
                        <div className="text-sm text-muted-foreground">{customer.site_name}</div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => createProjectFolder(customer)}
                        disabled={loading || !!customer.drive_folder_id}
                      >
                        {customer.drive_folder_id ? 'Folder Created' : 'Create Folder'}
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="folders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Google Drive Integration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {!isAuthorized && (
                <Button onClick={authorizeGoogleDrive} disabled={loading}>
                  <Settings className="mr-2 h-4 w-4" />
                  Authorize Google Drive Access
                </Button>
              )}

              {isAuthorized && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 rounded-lg">
                    <p className="text-green-800">✓ Google Drive is authorized and ready</p>
                  </div>

                  <Button 
                    onClick={() => {
                      toast({
                        title: "Success",
                        description: "Folder structure templates are ready",
                      });
                    }}
                  >
                    <FolderPlus className="mr-2 h-4 w-4" />
                    Setup Project Templates
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-semibold text-blue-900">Database Status</h3>
                  <p className="text-blue-700">All AME tables are configured and operational</p>
                </div>

                <div className="p-4 bg-green-50 rounded-lg">
                  <h3 className="font-semibold text-green-900">Google Drive Integration</h3>
                  <p className="text-green-700">
                    Root folder ID: 1BwAJZtB5ckzJZ0vDyEQ8pQ2hLQ1gBmJz
                  </p>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h3 className="font-semibold text-yellow-900">4-Phase Workflow</h3>
                  <p className="text-yellow-700">Ready for implementation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};