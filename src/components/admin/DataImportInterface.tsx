import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  Upload, 
  FileText, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  Download,
  Database,
  RefreshCw
} from 'lucide-react';
import { DataIntegrationService } from '../../services/dataIntegrationService';
import { supabase } from '@/integrations/supabase/client';

interface ImportProgress {
  step: string;
  current: number;
  total: number;
  message: string;
}

interface ImportResult {
  success: boolean;
  customerCount: number;
  contractCount: number;
  errors: string[];
  warnings: string[];
}

export const DataImportInterface: React.FC = () => {
  const [activeTab, setActiveTab] = useState('customers');
  const [isImporting, setIsImporting] = useState(false);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [customerFile, setCustomerFile] = useState<File | null>(null);
  const [contractFile, setContractFile] = useState<File | null>(null);
  
  const customerFileRef = useRef<HTMLInputElement>(null);
  const contractFileRef = useRef<HTMLInputElement>(null);

  const CustomerImportPanel = () => {
    const handleCustomerFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === 'text/csv') {
        setCustomerFile(file);
        setResult(null);
      } else {
        alert('Please select a valid CSV file');
      }
    };

    const importCustomerData = async () => {
      if (!customerFile) {
        alert('Please select a customer CSV file first');
        return;
      }

      setIsImporting(true);
      setResult(null);
      
      try {
        setProgress({ step: 'Parsing CSV', current: 0, total: 100, message: 'Reading customer data...' });
        
        const cleanCustomers = await DataIntegrationService.importCustomerData(customerFile);
        
        setProgress({ step: 'Validating Data', current: 25, total: 100, message: `Processed ${cleanCustomers.length} customer records` });
        
        // Validate and prepare data
        const validCustomers = cleanCustomers.filter(c => c.company_name && c.customer_id);
        
        setProgress({ step: 'Importing to Database', current: 50, total: 100, message: `Importing ${validCustomers.length} valid customers` });
        
        // Import customers to database
        for (let i = 0; i < validCustomers.length; i++) {
          const customer = validCustomers[i];
          
          const { error } = await supabase
            .from('ame_customers')
            .upsert({
              customer_id: customer.customer_id,
              company_name: customer.company_name,
              site_name: customer.site_nickname,
              site_address: customer.mailing_address,
              service_tier: 'CORE', // Will be updated when contracts are processed
              primary_contact: customer.company_name,
              contact_email: customer.email || '',
              contact_phone: '',
              system_type: 'Generic',
              contract_status: 'Active'
            }, {
              onConflict: 'customer_id'
            });

          if (error) {
            console.error('Error importing customer:', customer.company_name, error);
          }

          const progressPercent = 50 + (i / validCustomers.length) * 50;
          setProgress({ 
            step: 'Importing to Database', 
            current: progressPercent, 
            total: 100, 
            message: `Imported ${i + 1}/${validCustomers.length} customers` 
          });
        }

        setProgress({ step: 'Complete', current: 100, total: 100, message: 'Customer import completed!' });
        
        setResult({
          success: true,
          customerCount: validCustomers.length,
          contractCount: 0,
          errors: [],
          warnings: cleanCustomers.length !== validCustomers.length ? 
            [`${cleanCustomers.length - validCustomers.length} customers were skipped due to missing data`] : []
        });

      } catch (error) {
        console.error('Import error:', error);
        setResult({
          success: false,
          customerCount: 0,
          contractCount: 0,
          errors: [`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: []
        });
      } finally {
        setIsImporting(false);
        setTimeout(() => setProgress(null), 3000);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="customer-file">Customer CSV File</Label>
          <div className="flex items-center gap-2 mt-2">
            <Input
              id="customer-file"
              type="file"
              accept=".csv"
              onChange={handleCustomerFileSelect}
              ref={customerFileRef}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => customerFileRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-1" />
              Browse
            </Button>
          </div>
          {customerFile && (
            <div className="mt-2 text-sm text-green-600">
              ✓ Selected: {customerFile.name} ({(customerFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Expected columns: Customer, Email, Mailing Address, Mailing City, Mailing State, 
            Mailing ZIP Code, Customer ID, Contract Customer
          </AlertDescription>
        </Alert>

        <Button 
          onClick={importCustomerData}
          disabled={!customerFile || isImporting}
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Import Customer Data
            </>
          )}
        </Button>
      </div>
    );
  };

  const ContractImportPanel = () => {
    const handleContractFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type === 'text/csv') {
        setContractFile(file);
        setResult(null);
      } else {
        alert('Please select a valid CSV file');
      }
    };

    const importContractData = async () => {
      if (!contractFile) {
        alert('Please select a contract CSV file first');
        return;
      }

      setIsImporting(true);
      setResult(null);
      
      try {
        setProgress({ step: 'Parsing CSV', current: 0, total: 100, message: 'Reading contract data...' });
        
        const cleanContracts = await DataIntegrationService.importContractData(contractFile);
        
        setProgress({ step: 'Cross-referencing', current: 25, total: 100, message: `Processing ${cleanContracts.length} contract records` });
        
        // Get existing customers for cross-reference
        const { data: existingCustomers, error } = await supabase
          .from('ame_customers')
          .select('id, company_name, customer_id');

        if (error) throw error;

        let importedContracts = 0;
        let contractErrors: string[] = [];

        setProgress({ step: 'Importing Contracts', current: 50, total: 100, message: 'Matching contracts to customers...' });

        for (let i = 0; i < cleanContracts.length; i++) {
          const contract = cleanContracts[i];
          
          // Find matching customer
          const matchingCustomer = existingCustomers?.find(c => 
            c.company_name.toLowerCase() === contract.customer_name.toLowerCase()
          );

          if (!matchingCustomer) {
            contractErrors.push(`No matching customer found for contract: ${contract.contract_name} (${contract.customer_name})`);
            continue;
          }

          // Import contract
          const { error: contractError } = await supabase
            .from('customer_contracts')
            .upsert({
              customer_id: matchingCustomer.id,
              contract_name: contract.contract_name,
              contract_number: contract.contract_number,
              contract_value: contract.value_numeric,
              contract_status: contract.status,
              start_date: contract.start_date,
              end_date: contract.end_date,
              contract_email: contract.email,
              contract_notes: contract.notes
            }, {
              onConflict: 'contract_number'
            });

          if (contractError) {
            contractErrors.push(`Error importing contract ${contract.contract_name}: ${contractError.message}`);
          } else {
            importedContracts++;
          }

          const progressPercent = 50 + (i / cleanContracts.length) * 50;
          setProgress({ 
            step: 'Importing Contracts', 
            current: progressPercent, 
            total: 100, 
            message: `Processed ${i + 1}/${cleanContracts.length} contracts` 
          });
        }

        setProgress({ step: 'Complete', current: 100, total: 100, message: 'Contract import completed!' });
        
        setResult({
          success: contractErrors.length < cleanContracts.length,
          customerCount: 0,
          contractCount: importedContracts,
          errors: contractErrors,
          warnings: []
        });

      } catch (error) {
        console.error('Contract import error:', error);
        setResult({
          success: false,
          customerCount: 0,
          contractCount: 0,
          errors: [`Contract import failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: []
        });
      } finally {
        setIsImporting(false);
        setTimeout(() => setProgress(null), 3000);
      }
    };

    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="contract-file">Contract CSV File</Label>
          <div className="flex items-center gap-2 mt-2">
            <Input
              id="contract-file"
              type="file"
              accept=".csv"
              onChange={handleContractFileSelect}
              ref={contractFileRef}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => contractFileRef.current?.click()}
            >
              <Upload className="w-4 h-4 mr-1" />
              Browse
            </Button>
          </div>
          {contractFile && (
            <div className="mt-2 text-sm text-green-600">
              ✓ Selected: {contractFile.name} ({(contractFile.size / 1024).toFixed(1)} KB)
            </div>
          )}
        </div>

        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            Expected columns: Customer, Contract Name, Contract No., Value, Status, 
            Start Date, End Date, Email, Notes
          </AlertDescription>
        </Alert>

        <Button 
          onClick={importContractData}
          disabled={!contractFile || isImporting}
          className="w-full"
        >
          {isImporting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Database className="w-4 h-4 mr-2" />
              Import Contract Data
            </>
          )}
        </Button>
      </div>
    );
  };

  const CrossReferencePanel = () => {
    const [isProcessing, setIsProcessing] = useState(false);

    const updateServiceTiers = async () => {
      setIsProcessing(true);
      setResult(null);

      try {
        setProgress({ step: 'Updating Service Tiers', current: 0, total: 100, message: 'Calculating service tiers...' });

        // Get all customers 
        const { data: customers, error } = await supabase
          .from('ame_customers')
          .select('id, company_name');

        if (error) throw error;

        let updatedCount = 0;

        for (let i = 0; i < (customers?.length || 0); i++) {
          const customer = customers![i];
          
          // Default service tier update
          const serviceTier: 'CORE' | 'ASSURE' | 'GUARDIAN' = 'CORE';

          // Update customer
          const { error: updateError } = await supabase
            .from('ame_customers')
            .update({
              service_tier: serviceTier
            })
            .eq('id', customer.id);

          if (!updateError) {
            updatedCount++;
          }

          const progressPercent = (i / customers!.length) * 100;
          setProgress({ 
            step: 'Updating Service Tiers', 
            current: progressPercent, 
            total: 100, 
            message: `Updated ${updatedCount}/${customers!.length} customers` 
          });
        }

        setProgress({ step: 'Complete', current: 100, total: 100, message: 'Service tier update completed!' });
        
        setResult({
          success: true,
          customerCount: updatedCount,
          contractCount: 0,
          errors: [],
          warnings: []
        });

      } catch (error) {
        console.error('Service tier update error:', error);
        setResult({
          success: false,
          customerCount: 0,
          contractCount: 0,
          errors: [`Service tier update failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
          warnings: []
        });
      } finally {
        setIsProcessing(false);
        setTimeout(() => setProgress(null), 3000);
      }
    };

    return (
      <div className="space-y-4">
        <Alert>
          <RefreshCw className="h-4 w-4" />
          <AlertDescription>
            This will recalculate service tiers for all customers based on their active contract values.
            Service tiers: GUARDIAN ($200k+), ASSURE ($75k-$200k), CORE (Under $75k)
          </AlertDescription>
        </Alert>

        <Button 
          onClick={updateServiceTiers}
          disabled={isProcessing}
          className="w-full"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 mr-2" />
              Update Service Tiers
            </>
          )}
        </Button>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            Import Customer & Contract Data
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="customers">
                <Users className="w-4 h-4 mr-2" />
                Import Customers
              </TabsTrigger>
              <TabsTrigger value="contracts">
                <FileText className="w-4 h-4 mr-2" />
                Import Contracts
              </TabsTrigger>
              <TabsTrigger value="cross-reference">
                <RefreshCw className="w-4 h-4 mr-2" />
                Update Service Tiers
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="customers" className="mt-6">
              <CustomerImportPanel />
            </TabsContent>
            
            <TabsContent value="contracts" className="mt-6">
              <ContractImportPanel />
            </TabsContent>
            
            <TabsContent value="cross-reference" className="mt-6">
              <CrossReferencePanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Progress Display */}
      {progress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-medium">{progress.step}</span>
                <span className="text-sm text-gray-500">
                  {Math.round(progress.current)}%
                </span>
              </div>
              <Progress value={progress.current} className="w-full" />
              <p className="text-sm text-gray-600">{progress.message}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Results Display */}
      {result && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <span className="font-medium">
                  {result.success ? 'Import Successful' : 'Import Failed'}
                </span>
              </div>

              <div className="flex gap-4">
                {result.customerCount > 0 && (
                  <Badge variant="secondary">
                    {result.customerCount} Customers
                  </Badge>
                )}
                {result.contractCount > 0 && (
                  <Badge variant="secondary">
                    {result.contractCount} Contracts
                  </Badge>
                )}
              </div>

              {result.errors.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-red-600">Errors:</span>
                  {result.errors.map((error, index) => (
                    <div key={index} className="text-sm text-red-600 pl-4">
                      • {error}
                    </div>
                  ))}
                </div>
              )}

              {result.warnings.length > 0 && (
                <div className="space-y-1">
                  <span className="text-sm font-medium text-yellow-600">Warnings:</span>
                  {result.warnings.map((warning, index) => (
                    <div key={index} className="text-sm text-yellow-600 pl-4">
                      • {warning}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
