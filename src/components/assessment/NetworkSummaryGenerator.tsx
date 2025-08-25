import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { 
  FileText, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  Network,
  Activity,
  Clock,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TridiumDataset } from '@/types/tridium';

interface NetworkSummaryGeneratorProps {
  datasets: TridiumDataset[];
  selectedDevices: Set<string>;
  selectedColumns: Set<string>;
  healthMetrics?: any;
  onSummaryGenerated: (summary: string) => void;
}

type SummaryTemplate = 'comprehensive' | 'executive' | 'technical' | 'issues-focused' | 'simple-inventory' | 'custom';

const summaryTemplates = {
  comprehensive: {
    name: 'Comprehensive Report',
    description: 'Full network analysis with all sections',
    sections: ['header', 'overview', 'device-breakdown', 'health-metrics', 'critical-findings', 'recommendations']
  },
  executive: {
    name: 'Executive Summary', 
    description: 'High-level overview for management',
    sections: ['header', 'overview', 'critical-findings', 'recommendations']
  },
  technical: {
    name: 'Technical Details',
    description: 'Detailed technical analysis',
    sections: ['header', 'device-breakdown', 'health-metrics', 'performance-analysis', 'detailed-findings']
  },
  'issues-focused': {
    name: 'Issues & Problems',
    description: 'Focus on problems and required actions',
    sections: ['header', 'critical-findings', 'offline-devices', 'recommendations', 'action-items']
  },
  custom: {
    name: 'Custom Template',
    description: 'User-defined sections and content',
    sections: []
  }
};

export const NetworkSummaryGenerator: React.FC<NetworkSummaryGeneratorProps> = ({
  datasets,
  selectedDevices,
  selectedColumns,
  healthMetrics,
  onSummaryGenerated
}) => {
  const { toast } = useToast();
  const [selectedTemplate, setSelectedTemplate] = useState<SummaryTemplate>('comprehensive');
  const [customNotes, setCustomNotes] = useState('');
  const [generatedSummary, setGeneratedSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(true);
  const [isTemplateOpen, setIsTemplateOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // Calculate statistics from selected data
  const analysisStats = useMemo(() => {
    let totalDevices = 0;
    let onlineDevices = 0;
    let offlineDevices = 0;
    let alarmDevices = 0;
    let unknownDevices = 0;
    const deviceTypes: Record<string, number> = {};
    const criticalDevices: string[] = [];
    const offlineDevicesList: string[] = [];
    const alarmDevicesList: string[] = [];

    datasets.forEach(dataset => {
      dataset.rows.forEach(row => {
        if (selectedDevices.has(row.id)) {
          totalDevices++;
          
          if (row.parsedStatus) {
            switch (row.parsedStatus.status) {
              case 'ok':
                onlineDevices++;
                break;
              case 'down':
                offlineDevices++;
                offlineDevicesList.push(row.data.Name || 'Unknown Device');
                criticalDevices.push(`${row.data.Name} - OFFLINE`);
                break;
              case 'alarm':
                alarmDevices++;
                alarmDevicesList.push(row.data.Name || 'Unknown Device');
                criticalDevices.push(`${row.data.Name} - ALARM`);
                break;
              case 'fault':
                offlineDevices++;
                offlineDevicesList.push(row.data.Name || 'Unknown Device');
                criticalDevices.push(`${row.data.Name} - FAULT`);
                break;
              default:
                unknownDevices++;
            }
          }

          // Count device types
          const deviceType = row.data['Controller Type'] || row.data.Type || row.data['Device Type'] || 'Unknown';
          deviceTypes[deviceType] = (deviceTypes[deviceType] || 0) + 1;
        }
      });
    });

    const healthPercentage = totalDevices > 0 ? ((onlineDevices / totalDevices) * 100) : 0;

    return {
      totalDevices,
      onlineDevices,
      offlineDevices,
      alarmDevices,
      unknownDevices,
      deviceTypes,
      criticalDevices,
      offlineDevicesList,
      alarmDevicesList,
      healthPercentage,
      exportDate: new Date().toLocaleDateString(),
      analysisTime: new Date().toLocaleString()
    };
  }, [datasets, selectedDevices]);

  const generateSummary = () => {
    setIsGenerating(true);
    setIsPreviewOpen(true);
    
    try {
      const template = summaryTemplates[selectedTemplate];
      let summary = '';

      if (template.sections.includes('header')) {
        summary += generateHeader();
      }

      if (template.sections.includes('overview')) {
        summary += generateOverview();
      }

      if (template.sections.includes('device-breakdown')) {
        summary += generateDeviceBreakdown();
      }

      if (template.sections.includes('health-metrics')) {
        summary += generateHealthMetrics();
      }

      if (template.sections.includes('critical-findings')) {
        summary += generateCriticalFindings();
      }

      if (template.sections.includes('offline-devices')) {
        summary += generateOfflineDevices();
      }

      if (template.sections.includes('performance-analysis')) {
        summary += generatePerformanceAnalysis();
      }

      if (template.sections.includes('detailed-findings')) {
        summary += generateDetailedFindings();
      }

      if (template.sections.includes('recommendations')) {
        summary += generateRecommendations();
      }

      if (template.sections.includes('action-items')) {
        summary += generateActionItems();
      }

      if (customNotes.trim()) {
        summary += '\n\nADDITIONAL NOTES:\n';
        summary += '═'.repeat(50) + '\n';
        summary += customNotes + '\n';
      }

      setGeneratedSummary(summary);
      onSummaryGenerated(summary);
      
      toast({
        title: "Summary Generated",
        description: "Network analysis summary has been created successfully.",
      });
    } catch (error) {
      console.error('Summary generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate summary. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const generateHeader = () => {
    return `NETWORK ANALYSIS SUMMARY REPORT
${'═'.repeat(60)}
Generated: ${analysisStats.analysisTime}
Datasets Analyzed: ${datasets.length}
Devices Reviewed: ${analysisStats.totalDevices}

`;
  };

  const generateOverview = () => {
    return `SYSTEM OVERVIEW
${'═'.repeat(30)}
Total Devices Analyzed: ${analysisStats.totalDevices}

OPERATIONAL STATUS:
• Online (Operational): ${analysisStats.onlineDevices} devices (${(analysisStats.onlineDevices / analysisStats.totalDevices * 100).toFixed(1)}%)
• Offline (Down): ${analysisStats.offlineDevices} devices (${(analysisStats.offlineDevices / analysisStats.totalDevices * 100).toFixed(1)}%)
• Alarm Conditions: ${analysisStats.alarmDevices} devices (${(analysisStats.alarmDevices / analysisStats.totalDevices * 100).toFixed(1)}%)
• Unknown Status: ${analysisStats.unknownDevices} devices (${(analysisStats.unknownDevices / analysisStats.totalDevices * 100).toFixed(1)}%)

NETWORK HEALTH SCORE: ${analysisStats.healthPercentage.toFixed(1)}% ${getHealthStatus(analysisStats.healthPercentage)}

`;
  };

  const generateDeviceBreakdown = () => {
    let section = `DEVICE TYPE BREAKDOWN
${'═'.repeat(30)}
`;
    
    Object.entries(analysisStats.deviceTypes)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        const percentage = (count / analysisStats.totalDevices * 100).toFixed(1);
        section += `• ${type}: ${count} devices (${percentage}%)\n`;
      });

    return section + '\n';
  };

  const generateHealthMetrics = () => {
    if (!healthMetrics || !healthMetrics.metrics) {
      return '';
    }

    let section = `SYSTEM PERFORMANCE METRICS
${'═'.repeat(35)}
`;

    healthMetrics.metrics.forEach((metric: any) => {
      const statusIndicator = metric.status === 'good' ? '✓' : 
                             metric.status === 'warning' ? '⚠' : '✗';
      section += `${statusIndicator} ${metric.name}: ${metric.value}${metric.unit || ''} (${metric.status.toUpperCase()})\n`;
      if (metric.description) {
        section += `   ${metric.description}\n`;
      }
    });

    return section + '\n';
  };

  const generateCriticalFindings = () => {
    if (analysisStats.criticalDevices.length === 0) {
      return `CRITICAL FINDINGS
${'═'.repeat(20)}
✓ No critical issues identified in the analyzed devices.

`;
    }

    let section = `CRITICAL FINDINGS
${'═'.repeat(20)}
${analysisStats.criticalDevices.length} CRITICAL ISSUES IDENTIFIED:

`;

    analysisStats.criticalDevices.slice(0, 20).forEach((device, index) => {
      section += `${index + 1}. ${device}\n`;
    });

    if (analysisStats.criticalDevices.length > 20) {
      section += `... and ${analysisStats.criticalDevices.length - 20} additional critical issues\n`;
    }

    return section + '\n';
  };

  const generateOfflineDevices = () => {
    if (analysisStats.offlineDevicesList.length === 0) {
      return '';
    }

    let section = `OFFLINE DEVICES
${'═'.repeat(20)}
${analysisStats.offlineDevicesList.length} devices are currently offline:

`;

    analysisStats.offlineDevicesList.forEach((device, index) => {
      section += `${index + 1}. ${device}\n`;
    });

    return section + '\n';
  };

  const generatePerformanceAnalysis = () => {
    if (!healthMetrics) return '';

    return `PERFORMANCE ANALYSIS
${'═'.repeat(25)}
• Network Communication Health: ${analysisStats.healthPercentage.toFixed(1)}%
• Total System Load: Analyzed across ${datasets.length} data exports
• Device Response: ${analysisStats.onlineDevices}/${analysisStats.totalDevices} devices responding

CAPACITY UTILIZATION:
${healthMetrics.metrics
  ?.filter((m: any) => m.name.includes('Capacity') || m.name.includes('Usage'))
  ?.map((m: any) => `• ${m.name}: ${m.value}${m.unit || ''} (${m.status.toUpperCase()})`)
  ?.join('\n') || 'No capacity metrics available'}

`;
  };

  const generateDetailedFindings = () => {
    let section = `DETAILED ANALYSIS FINDINGS
${'═'.repeat(35)}
`;

    datasets.forEach((dataset, index) => {
      section += `Dataset ${index + 1}: ${dataset.filename}\n`;
      section += `• Type: ${dataset.type}\n`;
      section += `• Total Records: ${dataset.rows.length}\n`;
      section += `• Selected for Report: ${dataset.rows.filter(r => selectedDevices.has(r.id)).length}\n`;
      
      if (dataset.summary) {
        section += `• Status Summary: ${Object.entries(dataset.summary.statusBreakdown)
          .map(([status, count]) => `${status}: ${count}`)
          .join(', ')}\n`;
      }
      
      section += '\n';
    });

    return section;
  };

  const generateRecommendations = () => {
    const recommendations: string[] = [];

    if (analysisStats.offlineDevices > 0) {
      recommendations.push('Investigate communication issues with offline devices');
      recommendations.push('Verify network infrastructure and device power status');
    }

    if (analysisStats.alarmDevices > 0) {
      recommendations.push('Review and acknowledge active alarms in the system');
      recommendations.push('Investigate root causes of alarm conditions');
    }

    if (analysisStats.healthPercentage < 90) {
      recommendations.push('Improve overall network health - target >95% device availability');
    }

    if (healthMetrics?.alerts?.some((a: any) => a.type === 'critical')) {
      recommendations.push('Address critical system performance issues immediately');
    }

    // Add capacity-based recommendations
    if (healthMetrics?.metrics) {
      healthMetrics.metrics.forEach((metric: any) => {
        if (metric.status === 'critical' && metric.name.includes('Capacity')) {
          recommendations.push(`Upgrade ${metric.name.toLowerCase()} - current utilization critical`);
        } else if (metric.status === 'warning' && metric.name.includes('Capacity')) {
          recommendations.push(`Monitor ${metric.name.toLowerCase()} - approaching limits`);
        }
      });
    }

    if (recommendations.length === 0) {
      recommendations.push('System appears to be operating within normal parameters');
      recommendations.push('Continue regular monitoring and maintenance schedule');
    }

    let section = `RECOMMENDATIONS
${'═'.repeat(20)}
`;

    recommendations.forEach((rec, index) => {
      section += `${index + 1}. ${rec}\n`;
    });

    return section + '\n';
  };

  const generateActionItems = () => {
    const actions: string[] = [];

    if (analysisStats.offlineDevices > 0) {
      actions.push(`IMMEDIATE: Restore communication to ${analysisStats.offlineDevices} offline devices`);
    }

    if (analysisStats.alarmDevices > 0) {
      actions.push(`HIGH: Clear ${analysisStats.alarmDevices} active alarm conditions`);
    }

    if (healthMetrics?.alerts?.filter((a: any) => a.type === 'critical').length > 0) {
      actions.push('CRITICAL: Address system performance alerts');
    }

    actions.push('ROUTINE: Schedule follow-up network analysis in 30 days');
    actions.push('ROUTINE: Update network documentation with current findings');

    let section = `ACTION ITEMS
${'═'.repeat(15)}
`;

    actions.forEach((action, index) => {
      section += `${index + 1}. ${action}\n`;
    });

    return section + '\n';
  };

  const getHealthStatus = (percentage: number): string => {
    if (percentage >= 95) return '(EXCELLENT)';
    if (percentage >= 90) return '(GOOD)';
    if (percentage >= 80) return '(FAIR)';
    return '(POOR)';
  };

  const handleCopyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedSummary);
      toast({
        title: "Copied to Clipboard",
        description: "Summary has been copied to your clipboard.",
      });
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive"
      });
    }
  };

  const handleDownload = () => {
    const blob = new Blob([generatedSummary], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `network-analysis-summary-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Started",
      description: "Summary file has been downloaded.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Analysis Summary Statistics */}
      <Card className="border-l-4 border-l-blue-500">
        <Collapsible open={isStatsOpen} onOpenChange={setIsStatsOpen}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                  <div className="text-left">
                    <CardTitle className="text-lg">Analysis Summary Generator</CardTitle>
                    <CardDescription className="text-sm">
                      Current selection: {analysisStats.totalDevices} devices from {datasets.length} files
                    </CardDescription>
                  </div>
                </div>
                {isStatsOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600">{analysisStats.totalDevices}</div>
                  <div className="text-sm text-muted-foreground font-medium">Total Selected</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600">{analysisStats.onlineDevices}</div>
                  <div className="text-sm text-muted-foreground font-medium">Online</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600">{analysisStats.offlineDevices}</div>
                  <div className="text-sm text-muted-foreground font-medium">Offline</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-yellow-600">{analysisStats.alarmDevices}</div>
                  <div className="text-sm text-muted-foreground font-medium">Alarms</div>
                </div>
              </div>
              
              <div className="text-center">
                <Badge 
                  variant={analysisStats.healthPercentage >= 90 ? 'default' : 'destructive'} 
                  className="text-base px-6 py-2 font-semibold"
                >
                  Network Health: {analysisStats.healthPercentage.toFixed(1)}% {getHealthStatus(analysisStats.healthPercentage)}
                </Badge>
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Template Selection & Generation */}
      <Card className="border-l-4 border-l-orange-500">
        <Collapsible open={isTemplateOpen} onOpenChange={setIsTemplateOpen}>
          <CardHeader className="pb-3">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-orange-600" />
                  <div className="text-left">
                    <CardTitle className="text-lg">Summary Template & Generation</CardTitle>
                    <CardDescription className="text-sm">
                      Configure and generate network analysis reports
                    </CardDescription>
                  </div>
                </div>
                {isTemplateOpen ? (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </CollapsibleTrigger>
          </CardHeader>

          <CollapsibleContent>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(summaryTemplates).map(([key, template]) => (
                  <Card 
                    key={key}
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      selectedTemplate === key 
                        ? 'border-primary bg-primary/10 shadow-md scale-105' 
                        : 'hover:border-primary/50 hover:shadow-sm hover:scale-102'
                    }`}
                    onClick={() => setSelectedTemplate(key as SummaryTemplate)}
                  >
                    <h4 className="font-semibold text-sm">{template.name}</h4>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{template.description}</p>
                    <div className="mt-3">
                      <Badge variant="outline" className="text-xs px-2 py-1">
                        {template.sections.length} sections
                      </Badge>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-semibold">Additional Notes (Optional)</label>
                  <Textarea
                    placeholder="Add any custom observations, site-specific details, or additional context..."
                    value={customNotes}
                    onChange={(e) => setCustomNotes(e.target.value)}
                    rows={3}
                    className="mt-2"
                  />
                </div>

                <Button 
                  onClick={generateSummary} 
                  size="lg" 
                  className="w-full h-12 text-base font-semibold"
                  disabled={isGenerating || analysisStats.totalDevices === 0}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  {isGenerating ? 'Generating Summary...' : 'Generate Network Analysis Summary'}
                </Button>

                {analysisStats.totalDevices === 0 && (
                  <p className="text-sm text-muted-foreground text-center">
                    Select devices from the inventory table above to enable summary generation
                  </p>
                )}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>

      {/* Generated Summary Preview */}
      {generatedSummary && (
        <Card className="border-l-4 border-l-green-500">
          <Collapsible open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
            <CardHeader className="pb-3">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" className="w-full justify-between p-0 h-auto font-normal">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <div className="text-left">
                      <CardTitle className="text-lg">Generated Summary</CardTitle>
                      <CardDescription className="text-sm">
                        Review and export your network analysis report
                      </CardDescription>
                    </div>
                  </div>
                  {isPreviewOpen ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </CardHeader>

            <CollapsibleContent>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-3">
                  <Button variant="default" size="lg" onClick={handleCopyToClipboard}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy to Clipboard
                  </Button>
                  <Button variant="outline" size="lg" onClick={handleDownload}>
                    <Download className="w-4 h-4 mr-2" />
                    Download Report
                  </Button>
                </div>
                
                <div className="border rounded-lg bg-muted/30 p-4">
                  <div className="max-h-[500px] overflow-y-auto">
                    <pre className="text-sm whitespace-pre-wrap font-mono leading-relaxed">{generatedSummary}</pre>
                  </div>
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      )}

      {/* Usage Tips */}
      <Card className="border-blue-200 bg-blue-50/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-semibold text-blue-900 text-sm">Summary Generation Tips</h4>
              <ul className="text-sm text-blue-700 mt-2 space-y-1">
                <li>• First select devices using checkboxes in the inventory table above</li>
                <li>• Choose the appropriate template for your audience (Executive, Technical, etc.)</li>
                <li>• Add custom notes for site-specific observations or requirements</li>
                <li>• Generated summaries are automatically saved with your visit assessment</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};