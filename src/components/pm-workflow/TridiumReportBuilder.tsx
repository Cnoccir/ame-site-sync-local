import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { 
  Download, 
  FileText, 
  Settings,
  Eye,
  Mail,
  Printer,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  PieChart,
  FileImage,
  RefreshCw
} from 'lucide-react';
import { ProcessedTridiumData } from '@/services/TridiumExportProcessor';
import { TridiumReportGenerator, ReportConfig } from '@/services/TridiumReportGenerator';

interface TridiumReportBuilderProps {
  data: ProcessedTridiumData;
  onClose?: () => void;
}

interface ReportPreview {
  pages: number;
  sections: string[];
  estimatedSize: string;
  generationTime: number;
}

export const TridiumReportBuilder: React.FC<TridiumReportBuilderProps> = ({
  data,
  onClose
}) => {
  const [config, setConfig] = useState<Partial<ReportConfig>>({
    template: 'comprehensive',
    sections: {
      executiveSummary: true,
      systemOverview: true,
      deviceInventory: true,
      performanceMetrics: true,
      recommendations: true,
      rawDataAppendix: false
    },
    branding: {
      companyName: 'AME Controls',
      primaryColor: '#1e40af',
      secondaryColor: '#64748b'
    },
    format: {
      pageSize: 'letter',
      orientation: 'portrait',
      margins: { top: 72, right: 54, bottom: 72, left: 54 }
    }
  });

  const [generating, setGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [lastReport, setLastReport] = useState<Blob | null>(null);
  const [preview, setPreview] = useState<ReportPreview | null>(null);

  // Calculate report preview info
  const calculatePreview = useCallback((): ReportPreview => {
    const sections = Object.entries(config.sections || {})
      .filter(([_, enabled]) => enabled)
      .map(([section, _]) => section);
    
    const estimatedPages = sections.length + (data.devices.length > 50 ? 2 : 1);
    const estimatedSize = `${Math.round((estimatedPages * 150 + data.devices.length * 2) / 1024)} KB`;
    
    return {
      pages: estimatedPages,
      sections: sections.map(s => s.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())),
      estimatedSize,
      generationTime: Math.round(estimatedPages * 0.5)
    };
  }, [config.sections, data.devices.length]);

  // Update preview when config changes
  React.useEffect(() => {
    setPreview(calculatePreview());
  }, [calculatePreview]);

  const handleConfigChange = (key: string, value: any) => {
    setConfig(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleSectionToggle = (section: string, enabled: boolean) => {
    setConfig(prev => ({
      ...prev,
      sections: {
        ...prev.sections,
        [section]: enabled
      }
    }));
  };

  const handleBrandingChange = (key: string, value: string) => {
    setConfig(prev => ({
      ...prev,
      branding: {
        ...prev.branding,
        [key]: value
      }
    }));
  };

  const generateReport = useCallback(async () => {
    setGenerating(true);
    setGenerationProgress(0);

    try {
      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => Math.min(prev + 20, 90));
      }, 500);

      const reportBlob = await TridiumReportGenerator.generateReport(data, config);
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      
      setLastReport(reportBlob);
      
      // Auto-download
      const url = URL.createObjectURL(reportBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Tridium_System_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

    } catch (error) {
      console.error('Report generation failed:', error);
      alert(`Report generation failed: ${error.message}`);
    } finally {
      setTimeout(() => {
        setGenerating(false);
        setGenerationProgress(0);
      }, 1000);
    }
  }, [data, config]);

  const previewReport = useCallback(async () => {
    if (lastReport) {
      const url = URL.createObjectURL(lastReport);
      window.open(url, '_blank');
      URL.revokeObjectURL(url);
    } else {
      // Generate preview version
      await generateReport();
    }
  }, [lastReport, generateReport]);

  const emailReport = useCallback(() => {
    if (lastReport) {
      // In a real implementation, this would integrate with an email service
      alert('Email integration would be implemented here. For now, the report has been downloaded.');
    } else {
      alert('Please generate a report first.');
    }
  }, [lastReport]);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Professional Report Generator
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Generate comprehensive system documentation from your Tridium data
              </p>
            </div>
            {onClose && (
              <Button variant="outline" onClick={onClose}>
                ← Back to Wizard
              </Button>
            )}
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Configuration Panel */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Report Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="template" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="template">Template</TabsTrigger>
                  <TabsTrigger value="sections">Sections</TabsTrigger>
                  <TabsTrigger value="branding">Branding</TabsTrigger>
                  <TabsTrigger value="format">Format</TabsTrigger>
                </TabsList>
                
                {/* Template Selection */}
                <TabsContent value="template" className="space-y-4">
                  <div className="space-y-3">
                    <Label>Report Template</Label>
                    <Select 
                      value={config.template} 
                      onValueChange={(value) => handleConfigChange('template', value)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="executive">Executive Summary</SelectItem>
                        <SelectItem value="technical">Technical Report</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Template Description</Label>
                    <div className="text-sm text-muted-foreground p-3 bg-gray-50 rounded">
                      {config.template === 'executive' && 
                        "Focused on high-level system health and business impact. Ideal for management presentations. ~3-4 pages."
                      }
                      {config.template === 'technical' && 
                        "Detailed technical analysis with device specifications and performance metrics. Perfect for engineering reviews. ~6-8 pages."
                      }
                      {config.template === 'comprehensive' && 
                        "Complete system documentation including executive summary, technical details, and full device inventory. ~8-12 pages."
                      }
                    </div>
                  </div>
                </TabsContent>
                
                {/* Section Selection */}
                <TabsContent value="sections" className="space-y-4">
                  <div className="space-y-3">
                    <Label>Report Sections</Label>
                    <div className="space-y-3">
                      {[
                        { key: 'executiveSummary', label: 'Executive Summary', icon: <BarChart3 className="h-4 w-4" />, description: 'High-level system overview and key findings' },
                        { key: 'systemOverview', label: 'System Overview', icon: <Settings className="h-4 w-4" />, description: 'Architecture details and component analysis' },
                        { key: 'deviceInventory', label: 'Device Inventory', icon: <PieChart className="h-4 w-4" />, description: 'Complete device listing with status and metrics' },
                        { key: 'performanceMetrics', label: 'Performance Metrics', icon: <BarChart3 className="h-4 w-4" />, description: 'System performance analysis and trends' },
                        { key: 'recommendations', label: 'Recommendations', icon: <CheckCircle2 className="h-4 w-4" />, description: 'Action items and improvement suggestions' },
                        { key: 'rawDataAppendix', label: 'Raw Data Appendix', icon: <FileImage className="h-4 w-4" />, description: 'Complete data tables for reference' }
                      ].map(section => (
                        <div key={section.key} className="flex items-start space-x-3 p-3 border rounded">
                          <Checkbox
                            id={section.key}
                            checked={config.sections?.[section.key] || false}
                            onCheckedChange={(checked) => handleSectionToggle(section.key, !!checked)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              {section.icon}
                              <Label htmlFor={section.key} className="font-medium">
                                {section.label}
                              </Label>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {section.description}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>
                
                {/* Branding */}
                <TabsContent value="branding" className="space-y-4">
                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="companyName">Company Name</Label>
                      <Input
                        id="companyName"
                        value={config.branding?.companyName || ''}
                        onChange={(e) => handleBrandingChange('companyName', e.target.value)}
                        placeholder="Enter company name"
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label htmlFor="primaryColor">Primary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="primaryColor"
                            type="color"
                            value={config.branding?.primaryColor || '#1e40af'}
                            onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                            className="w-16"
                          />
                          <Input
                            value={config.branding?.primaryColor || '#1e40af'}
                            onChange={(e) => handleBrandingChange('primaryColor', e.target.value)}
                            placeholder="#1e40af"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="secondaryColor">Secondary Color</Label>
                        <div className="flex gap-2">
                          <Input
                            id="secondaryColor"
                            type="color"
                            value={config.branding?.secondaryColor || '#64748b'}
                            onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                            className="w-16"
                          />
                          <Input
                            value={config.branding?.secondaryColor || '#64748b'}
                            onChange={(e) => handleBrandingChange('secondaryColor', e.target.value)}
                            placeholder="#64748b"
                            className="flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                
                {/* Format Options */}
                <TabsContent value="format" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Page Size</Label>
                      <Select 
                        value={config.format?.pageSize || 'letter'} 
                        onValueChange={(value) => handleConfigChange('format', {...config.format, pageSize: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="letter">Letter (8.5" × 11")</SelectItem>
                          <SelectItem value="a4">A4 (210mm × 297mm)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Orientation</Label>
                      <Select 
                        value={config.format?.orientation || 'portrait'} 
                        onValueChange={(value) => handleConfigChange('format', {...config.format, orientation: value})}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Portrait</SelectItem>
                          <SelectItem value="landscape">Landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Preview & Actions Panel */}
        <div className="space-y-6">
          {/* Report Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Report Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {preview && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="font-medium">{preview.pages}</div>
                      <div className="text-muted-foreground">Pages</div>
                    </div>
                    <div>
                      <div className="font-medium">{preview.estimatedSize}</div>
                      <div className="text-muted-foreground">File Size</div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div>
                    <Label className="text-sm font-medium">Included Sections</Label>
                    <div className="mt-2 space-y-1">
                      {preview.sections.map((section, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-sm">
                          <CheckCircle2 className="h-3 w-3 text-green-600" />
                          {section}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-xs text-muted-foreground">
                    Estimated generation time: {preview.generationTime} seconds
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Data Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Data Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-medium">{data.processedFiles.length}</div>
                  <div className="text-muted-foreground">Files Processed</div>
                </div>
                <div>
                  <div className="font-medium">{data.devices.length}</div>
                  <div className="text-muted-foreground">Total Devices</div>
                </div>
                <div>
                  <div className="font-medium">{data.resources.length}</div>
                  <div className="text-muted-foreground">System Resources</div>
                </div>
                <div>
                  <div className="font-medium">{data.networks.length}</div>
                  <div className="text-muted-foreground">Network Stations</div>
                </div>
              </div>

              {data.errors.length > 0 && (
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {data.errors.length} processing error{data.errors.length !== 1 ? 's' : ''} will be noted in the report
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Generation Progress */}
          {generating && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-sm font-medium">Generating Report...</span>
                  </div>
                  <Progress value={generationProgress} className="w-full" />
                  <div className="text-xs text-muted-foreground">
                    {generationProgress < 30 && "Processing system data..."}
                    {generationProgress >= 30 && generationProgress < 60 && "Building report sections..."}
                    {generationProgress >= 60 && generationProgress < 90 && "Generating charts and tables..."}
                    {generationProgress >= 90 && "Finalizing PDF..."}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <Card>
            <CardContent className="p-4">
              <div className="space-y-3">
                <Button 
                  onClick={generateReport} 
                  disabled={generating}
                  className="w-full gap-2"
                >
                  <Download className="h-4 w-4" />
                  Generate PDF Report
                </Button>
                
                <div className="grid grid-cols-2 gap-2">
                  <Button 
                    variant="outline" 
                    onClick={previewReport}
                    disabled={generating}
                    className="gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Preview
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    onClick={emailReport}
                    disabled={generating || !lastReport}
                    className="gap-2"
                  >
                    <Mail className="h-4 w-4" />
                    Email
                  </Button>
                </div>

                {lastReport && (
                  <div className="text-xs text-green-600 text-center">
                    ✓ Report generated successfully
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};