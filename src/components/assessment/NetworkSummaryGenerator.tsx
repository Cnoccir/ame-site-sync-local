import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  Download, 
  Copy, 
  CheckCircle, 
  AlertTriangle, 
  BarChart3,
  Network,
  Activity,
  Clock
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

type SummaryTemplate = 'comprehensive' | 'executive' | 'technical' | 'issues-focused' | 'custom';

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
      {/* Summary Statistics */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Analysis Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold">{analysisStats.totalDevices}</div>
            <div className="text-sm text-muted-foreground">Total Devices</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{analysisStats.onlineDevices}</div>
            <div className="text-sm text-muted-foreground">Online</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{analysisStats.offlineDevices}</div>
            <div className="text-sm text-muted-foreground">Offline</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{analysisStats.alarmDevices}</div>
            <div className="text-sm text-muted-foreground">Alarms</div>
          </div>
        </div>
        
        <div className="mt-4 text-center">
          <Badge variant={analysisStats.healthPercentage >= 90 ? 'default' : 'destructive'} className="text-lg px-4 py-2">
            Network Health: {analysisStats.healthPercentage.toFixed(1)}%
          </Badge>
        </div>
      </Card>

      {/* Template Selection */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Summary Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          {Object.entries(summaryTemplates).map(([key, template]) => (
            <Card 
              key={key}
              className={`p-4 cursor-pointer transition-colors ${
                selectedTemplate === key ? 'border-primary bg-primary/5' : 'hover:border-primary/50'
              }`}
              onClick={() => setSelectedTemplate(key as SummaryTemplate)}
            >
              <h4 className="font-medium">{template.name}</h4>
              <p className="text-sm text-muted-foreground mt-1">{template.description}</p>
              <div className="mt-2">
                <Badge variant="outline" className="text-xs">
                  {template.sections.length} sections
                </Badge>
              </div>
            </Card>
          ))}
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium">Additional Notes (Optional)</label>
            <Textarea
              placeholder="Add any custom observations or additional context..."
              value={customNotes}
              onChange={(e) => setCustomNotes(e.target.value)}
              rows={3}
            />
          </div>

          <Button 
            onClick={generateSummary} 
            size="lg" 
            className="w-full"
            disabled={isGenerating || analysisStats.totalDevices === 0}
          >
            <FileText className="w-4 h-4 mr-2" />
            {isGenerating ? 'Generating Summary...' : 'Generate Network Analysis Summary'}
          </Button>
        </div>
      </Card>

      {/* Generated Summary Preview */}
      {generatedSummary && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold">Generated Summary</h3>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                <Copy className="w-4 h-4 mr-2" />
                Copy
              </Button>
              <Button variant="outline" size="sm" onClick={handleDownload}>
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </div>
          
          <div className="bg-muted p-4 rounded-md max-h-96 overflow-y-auto">
            <pre className="text-sm whitespace-pre-wrap font-mono">{generatedSummary}</pre>
          </div>
        </Card>
      )}

      {/* Usage Tips */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start gap-2">
          <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-blue-900">Summary Generation Tips</h4>
            <ul className="text-sm text-blue-700 mt-2 space-y-1">
              <li>• Select devices using the inventory table filters and checkboxes</li>
              <li>• Choose template based on your audience (Executive, Technical, etc.)</li>
              <li>• Add custom notes for site-specific observations</li>
              <li>• Generated summary will be included in the final assessment report</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
};