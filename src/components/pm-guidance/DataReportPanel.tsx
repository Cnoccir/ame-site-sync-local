import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Customer } from '@/types';
import { 
  Upload, 
  FileText, 
  Download, 
  Eye, 
  Send,
  Database,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  Target
} from 'lucide-react';

interface DataReportPanelProps {
  customer: Customer;
  collectedData: any;
  completedTasks: string[];
  progress: number;
  canGenerateReport: boolean;
  onDataUpdate: (data: any) => void;
}

export const DataReportPanel = ({
  customer,
  collectedData,
  completedTasks,
  progress,
  canGenerateReport,
  onDataUpdate
}: DataReportPanelProps) => {
  const [activeTab, setActiveTab] = useState('data');
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    setProcessing(true);
    const newFiles = Array.from(files);
    setUploadedFiles(prev => [...prev, ...newFiles]);

    // TODO: Process Tridium export files
    setTimeout(() => {
      // Simulate processing
      onDataUpdate({
        tridiumData: {
          cpu: '12%',
          memory: '67%',
          devices: 84,
          timestamp: new Date().toISOString()
        }
      });
      setProcessing(false);
    }, 2000);
  };

  return (
    <div className="h-full bg-gray-50 dark:bg-gray-900/50">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
        <TabsList className="m-4 grid grid-cols-3">
          <TabsTrigger value="data" className="gap-2">
            <Database className="h-4 w-4" />
            Data
          </TabsTrigger>
          <TabsTrigger value="preview" className="gap-2">
            <Eye className="h-4 w-4" />
            Live Preview
          </TabsTrigger>
          <TabsTrigger value="export" className="gap-2">
            <Download className="h-4 w-4" />
            Generate PDF
          </TabsTrigger>
        </TabsList>

        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <TabsContent value="data" className="space-y-4 mt-0">
            {/* Progress Indicator */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Service Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tasks Completed</span>
                    <span>{completedTasks.length} tasks</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Report Readiness</span>
                    <span>{Math.round(progress)}%</span>
                  </div>
                  <div className="mt-2">
                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${
                      canGenerateReport 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200'
                    }`}>
                      {canGenerateReport ? '✓ Ready for Report' : 'Complete more tasks for report'}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <DataCollectionTab
              uploadedFiles={uploadedFiles}
              processing={processing}
              collectedData={collectedData}
              onFileUpload={handleFileUpload}
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <ReportPreviewTab
              customer={customer}
              collectedData={collectedData}
              completedTasks={completedTasks}
              progress={progress}
            />
          </TabsContent>

          <TabsContent value="export" className="mt-0">
            <ExportTab
              customer={customer}
              collectedData={collectedData}
              completedTasks={completedTasks}
              canGenerate={canGenerateReport}
            />
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
};

// Data Collection Tab Component
const DataCollectionTab = ({ uploadedFiles, processing, collectedData, onFileUpload }: any) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tridium Export Upload</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground mb-2">
                Drop Tridium export files here or click to browse
              </p>
              <input
                type="file"
                multiple
                accept=".csv,.txt"
                onChange={onFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload">
                <Button variant="outline" size="sm" asChild>
                  <span>Select Files</span>
                </Button>
              </label>
            </div>

            {uploadedFiles.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Uploaded Files:</h4>
                {uploadedFiles.map((file, idx) => (
                  <div key={idx} className="flex items-center gap-2 text-sm">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span>{file.name}</span>
                    <CheckCircle2 className="h-4 w-4 text-green-500 ml-auto" />
                  </div>
                ))}
              </div>
            )}

            {processing && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>Processing export files...</AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {collectedData.tridiumData && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">System Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">CPU Usage</p>
                <p className="text-2xl font-semibold">{collectedData.tridiumData.cpu}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Memory</p>
                <p className="text-2xl font-semibold">{collectedData.tridiumData.memory}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Devices</p>
                <p className="text-2xl font-semibold">{collectedData.tridiumData.devices}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-sm font-medium text-green-600">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

// Report Preview Tab Component
const ReportPreviewTab = ({ customer, collectedData, completedTasks, progress }: any) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="h-4 w-4" />
          Live Report Preview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="border rounded-lg p-4 bg-white dark:bg-gray-950">
            <div className="flex items-center gap-2 mb-3">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold">Service Value Report</h3>
            </div>
            <div className="space-y-2 text-sm">
              <p><span className="font-medium">Customer:</span> {customer.company_name}</p>
              <p><span className="font-medium">Site:</span> {customer.site_name}</p>
              <p><span className="font-medium">Service Tier:</span> {customer.service_tier}</p>
              <p><span className="font-medium">Date:</span> {new Date().toLocaleDateString()}</p>
              <p><span className="font-medium">Completion:</span> {Math.round(progress)}%</p>
              <p><span className="font-medium">Tasks Completed:</span> {completedTasks.length}</p>
            </div>
          </div>

          {collectedData.tridiumData && (
            <div className="border rounded-lg p-4 bg-white dark:bg-gray-950">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4 text-green-600" />
                <h4 className="font-medium">System Performance Assessment</h4>
              </div>
              <div className="space-y-1 text-sm">
                <p>• System performance within normal parameters</p>
                <p>• {collectedData.tridiumData.devices} devices monitored and healthy</p>
                <p>• CPU utilization optimized: {collectedData.tridiumData.cpu}</p>
                <p>• Memory usage efficient: {collectedData.tridiumData.memory}</p>
              </div>
            </div>
          )}

          <div className="border rounded-lg p-4 bg-white dark:bg-gray-950">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle2 className="h-4 w-4 text-blue-600" />
              <h4 className="font-medium">Service Value Delivered</h4>
            </div>
            <div className="space-y-1 text-sm">
              <p>• Preventive maintenance completed to {customer.service_tier} standards</p>
              <p>• System reliability enhanced through proactive care</p>
              <p>• Documentation updated for future reference</p>
              {completedTasks.length >= 5 && <p>• Operational efficiency optimized</p>}
            </div>
          </div>

          <Button className="w-full" variant="outline" disabled={progress < 50}>
            <Eye className="h-4 w-4 mr-2" />
            {progress < 50 ? 'Complete More Tasks for Full Preview' : 'Generate Full Preview'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// Export Tab Component
const ExportTab = ({ customer, collectedData, completedTasks, canGenerate }: any) => {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Professional Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button 
            className="w-full justify-start" 
            variant="outline"
            disabled={!canGenerate}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export Customer Report (Visual)
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline"
            disabled={!canGenerate}
          >
            <FileText className="h-4 w-4 mr-2" />
            Export Technical Report (Detailed)
          </Button>
          <Button 
            className="w-full justify-start" 
            variant="outline"
            disabled={!canGenerate}
          >
            <Download className="h-4 w-4 mr-2" />
            Download Complete Package
          </Button>
          
          {!canGenerate && (
            <p className="text-xs text-muted-foreground mt-2">
              Complete more tasks to enable report generation
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Send className="h-4 w-4" />
            Deliver Report
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <input
              type="email"
              placeholder="customer@example.com"
              className="w-full px-3 py-2 border rounded-md"
              defaultValue={customer.contact_email}
            />
            <Button className="w-full" disabled={!canGenerate}>
              <Send className="h-4 w-4 mr-2" />
              Email Service Report
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
