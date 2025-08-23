import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CSVImportService } from '@/services/csvImportService';
import { Loader2, Upload, Database, Users, Wrench, BookOpen, FileText, CheckCircle, AlertCircle } from 'lucide-react';

interface ImportResult {
  success: number;
  errors: string[];
}

interface ImportResults {
  customers: ImportResult;
  tasks: ImportResult;
  tools: ImportResult;
  sops: ImportResult;
}

export const DataImportPanel = () => {
  const [importing, setImporting] = useState(false);
  const [importingItem, setImportingItem] = useState<string | null>(null);
  const [results, setResults] = useState<ImportResults | null>(null);
  const { toast } = useToast();

  const importSingleDataset = async (type: 'customers' | 'tasks' | 'tools' | 'sops') => {
    setImportingItem(type);
    try {
      let result: ImportResult;
      
      switch (type) {
        case 'customers':
          result = await CSVImportService.importCustomers();
          break;
        case 'tasks':
          result = await CSVImportService.importTasks();
          break;
        case 'tools':
          result = await CSVImportService.importTools();
          break;
        case 'sops':
          result = await CSVImportService.importSOPs();
          break;
      }

      setResults(prev => ({
        ...prev,
        [type]: result
      } as ImportResults));

      toast({
        title: `${type.charAt(0).toUpperCase() + type.slice(1)} Import Complete`,
        description: `Successfully imported ${result.success} records. ${result.errors.length} errors.`,
        variant: result.errors.length > 0 ? 'destructive' : 'default'
      });
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: `Failed to import ${type}: ${error}`,
        variant: 'destructive'
      });
    } finally {
      setImportingItem(null);
    }
  };

  const importAllData = async () => {
    setImporting(true);
    try {
      const allResults = await CSVImportService.importAllData();
      setResults(allResults);
      
      const totalSuccess = Object.values(allResults).reduce((sum, result) => sum + result.success, 0);
      const totalErrors = Object.values(allResults).reduce((sum, result) => sum + result.errors.length, 0);

      toast({
        title: 'Data Import Complete',
        description: `Successfully imported ${totalSuccess} records. ${totalErrors} errors.`,
        variant: totalErrors > 0 ? 'destructive' : 'default'
      });
    } catch (error) {
      toast({
        title: 'Import Failed',
        description: `Failed to import data: ${error}`,
        variant: 'destructive'
      });
    } finally {
      setImporting(false);
    }
  };

  const getStatusIcon = (result?: ImportResult) => {
    if (!result) return <Database className="w-4 h-4 text-muted-foreground" />;
    if (result.errors.length > 0) return <AlertCircle className="w-4 h-4 text-yellow-500" />;
    return <CheckCircle className="w-4 h-4 text-green-500" />;
  };

  const getStatusBadge = (result?: ImportResult) => {
    if (!result) return <Badge variant="outline">Not Imported</Badge>;
    if (result.errors.length > 0) {
      return <Badge variant="destructive">{result.success} success, {result.errors.length} errors</Badge>;
    }
    return <Badge variant="default">{result.success} imported</Badge>;
  };

  const datasets = [
    {
      key: 'customers' as const,
      name: 'Customers',
      description: 'Import customer data from Google Sheets',
      icon: Users,
      color: 'text-purple-600'
    },
    {
      key: 'tasks' as const,
      name: 'Tasks',
      description: 'Import task library from Google Sheets',
      icon: FileText,
      color: 'text-green-600'
    },
    {
      key: 'tools' as const,
      name: 'Tools',
      description: 'Import tool library from Google Sheets',
      icon: Wrench,
      color: 'text-orange-600'
    },
    {
      key: 'sops' as const,
      name: 'SOPs',
      description: 'Import SOP library from Google Sheets',
      icon: BookOpen,
      color: 'text-blue-600'
    }
  ];

  return (
    <Card className="border-card-border shadow-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Data Import from Google Sheets
            </CardTitle>
            <CardDescription>
              Import data from linked Google Sheets into the database
            </CardDescription>
          </div>
          <Button 
            onClick={importAllData}
            disabled={importing || importingItem !== null}
            className="gap-2"
          >
            {importing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Database className="w-4 h-4" />
            )}
            Import All Data
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {datasets.map((dataset) => (
            <div 
              key={dataset.key}
              className="flex items-center justify-between p-4 rounded-lg border border-card-border hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-muted ${dataset.color}`}>
                  <dataset.icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-medium">{dataset.name}</h4>
                    {getStatusIcon(results?.[dataset.key])}
                  </div>
                  <p className="text-xs text-muted-foreground">{dataset.description}</p>
                  {results?.[dataset.key] && (
                    <div className="mt-1">
                      {getStatusBadge(results[dataset.key])}
                    </div>
                  )}
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => importSingleDataset(dataset.key)}
                disabled={importing || importingItem === dataset.key}
                className="gap-2"
              >
                {importingItem === dataset.key ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Upload className="w-3 h-3" />
                )}
                Import
              </Button>
            </div>
          ))}
        </div>

        {results && (
          <div className="mt-6 p-4 bg-muted rounded-lg">
            <h4 className="text-sm font-medium mb-2">Import Summary</h4>
            {Object.entries(results).map(([key, result]) => (
              <div key={key} className="text-xs text-muted-foreground">
                <strong>{key}:</strong> {result.success} imported
                {result.errors.length > 0 && (
                  <span className="text-red-500"> ({result.errors.length} errors)</span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};