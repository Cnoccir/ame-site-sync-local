import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, Copy, Download, AlertTriangle, CheckCircle, TrendingUp } from 'lucide-react';
import { TridiumDataset, GeneratedSummary } from '@/types/tridium';
import { useToast } from '@/hooks/use-toast';

interface TridiumSummaryGeneratorProps {
  dataset: TridiumDataset;
  onSummaryGenerated: (summary: string) => void;
}

export const TridiumSummaryGenerator: React.FC<TridiumSummaryGeneratorProps> = ({
  dataset,
  onSummaryGenerated
}) => {
  const { toast } = useToast();
  const [summaryTemplate, setSummaryTemplate] = useState<string>('comprehensive');
  const [customNotes, setCustomNotes] = useState<string>('');
  const [generatedSummary, setGeneratedSummary] = useState<GeneratedSummary | null>(null);

  const selectedRows = dataset.rows.filter(row => row.selected);
  const selectedCount = selectedRows.length;

  // Calculate statistics for selected data
  const statistics = useMemo(() => {
    if (selectedRows.length === 0) return null;

    const stats = {
      total: selectedRows.length,
      statusBreakdown: {
        ok: 0,
        down: 0,
        alarm: 0,
        fault: 0,
        unknown: 0
      },
      typeBreakdown: {} as Record<string, number>,
      criticalIssues: [] as string[],
      performanceMetrics: {} as Record<string, any>
    };

    selectedRows.forEach(row => {
      // Status analysis
      if (row.parsedStatus) {
        stats.statusBreakdown[row.parsedStatus.status]++;
        
        if (row.parsedStatus.severity === 'critical') {
          const deviceName = row.data['Name'] || 'Unknown Device';
          stats.criticalIssues.push(`${deviceName}: ${row.parsedStatus.details.join(', ')}`);
        }
      }

      // Type breakdown
      const type = row.data['Type'] || row.data['Controller Type'] || 'Unknown';
      stats.typeBreakdown[type] = (stats.typeBreakdown[type] || 0) + 1;

      // Performance metrics (for resource datasets)
      if (row.parsedValues) {
        Object.entries(row.parsedValues).forEach(([key, value]) => {
          if (value.type === 'percentage') {
            stats.performanceMetrics[key] = value;
          }
        });
      }
    });

    return stats;
  }, [selectedRows]);

  const generateSummary = () => {
    if (!statistics) return;

    const summary: GeneratedSummary = {
      title: '',
      overview: '',
      deviceBreakdown: '',
      criticalFindings: [],
      recommendations: [],
      detailedData: {
        headers: [],
        rows: []
      }
    };

    switch (summaryTemplate) {
      case 'comprehensive':
        summary.title = 'COMPREHENSIVE TRIDIUM SYSTEM ANALYSIS';
        summary.overview = generateComprehensiveOverview(statistics);
        break;
      case 'executive':
        summary.title = 'EXECUTIVE SUMMARY - SYSTEM STATUS';
        summary.overview = generateExecutiveOverview(statistics);
        break;
      case 'technical':
        summary.title = 'TECHNICAL ANALYSIS REPORT';
        summary.overview = generateTechnicalOverview(statistics);
        break;
      case 'issues':
        summary.title = 'CRITICAL ISSUES REPORT';
        summary.overview = generateIssuesOverview(statistics);
        break;
    }

    // Device breakdown
    summary.deviceBreakdown = generateDeviceBreakdown(statistics);

    // Critical findings
    summary.criticalFindings = statistics.criticalIssues.slice(0, 10); // Limit to top 10

    // Recommendations
    summary.recommendations = generateRecommendations(statistics);

    // Detailed data for selected rows
    const visibleColumns = dataset.columns.filter(col => col.visible);
    summary.detailedData.headers = visibleColumns.map(col => col.label);
    summary.detailedData.rows = selectedRows.map(row => 
      visibleColumns.map(col => String(row.data[col.key] || ''))
    );

    setGeneratedSummary(summary);

    // Format as text for callback
    const formattedText = formatSummaryAsText(summary, customNotes);
    onSummaryGenerated(formattedText);
  };

  const generateComprehensiveOverview = (stats: any): string => {
    return `
SYSTEM ANALYSIS OVERVIEW
Total Devices Analyzed: ${stats.total}

OPERATIONAL STATUS:
• Online (OK): ${stats.statusBreakdown.ok} devices (${Math.round((stats.statusBreakdown.ok / stats.total) * 100)}%)
• Offline/Down: ${stats.statusBreakdown.down} devices (${Math.round((stats.statusBreakdown.down / stats.total) * 100)}%)
• Alarm Conditions: ${stats.statusBreakdown.alarm} devices (${Math.round((stats.statusBreakdown.alarm / stats.total) * 100)}%)
• Fault Conditions: ${stats.statusBreakdown.fault} devices (${Math.round((stats.statusBreakdown.fault / stats.total) * 100)}%)
• Unknown Status: ${stats.statusBreakdown.unknown} devices (${Math.round((stats.statusBreakdown.unknown / stats.total) * 100)}%)

SYSTEM HEALTH SCORE: ${calculateHealthScore(stats)}%
    `.trim();
  };

  const generateExecutiveOverview = (stats: any): string => {
    const healthScore = calculateHealthScore(stats);
    const issueCount = stats.statusBreakdown.down + stats.statusBreakdown.alarm + stats.statusBreakdown.fault;
    
    return `
EXECUTIVE SUMMARY
${stats.total} system devices analyzed with ${healthScore}% overall health score.

KEY FINDINGS:
• ${stats.statusBreakdown.ok} devices operating normally
• ${issueCount} devices requiring attention
• ${stats.criticalIssues.length} critical issues identified

BUSINESS IMPACT: ${issueCount > 0 ? 'IMMEDIATE ACTION REQUIRED' : 'SYSTEM OPERATING OPTIMALLY'}
    `.trim();
  };

  const generateTechnicalOverview = (stats: any): string => {
    const performanceData = Object.entries(stats.performanceMetrics)
      .map(([key, value]: [string, any]) => `• ${key}: ${value.formatted}`)
      .join('\n');

    return `
TECHNICAL SYSTEM ANALYSIS
Device Count: ${stats.total}
Network Segments Analyzed: ${Object.keys(stats.typeBreakdown).length}

PERFORMANCE METRICS:
${performanceData || '• No performance data available in selected dataset'}

DEVICE DISTRIBUTION:
${Object.entries(stats.typeBreakdown)
  .sort(([,a], [,b]) => (b as number) - (a as number))
  .map(([type, count]) => `• ${type}: ${count} devices`)
  .join('\n')}
    `.trim();
  };

  const generateIssuesOverview = (stats: any): string => {
    const issueCount = stats.statusBreakdown.down + stats.statusBreakdown.alarm + stats.statusBreakdown.fault;
    
    return `
CRITICAL ISSUES ANALYSIS
Total Issues Found: ${issueCount}

SEVERITY BREAKDOWN:
• Critical (Down/Fault): ${stats.statusBreakdown.down + stats.statusBreakdown.fault}
• Warning (Alarms): ${stats.statusBreakdown.alarm}

IMMEDIATE ATTENTION REQUIRED:
${stats.criticalIssues.length > 0 ? stats.criticalIssues.slice(0, 5).map(issue => `• ${issue}`).join('\n') : '• No critical issues in selected data'}
    `.trim();
  };

  const generateDeviceBreakdown = (stats: any): string => {
    return Object.entries(stats.typeBreakdown)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .map(([type, count]) => `${type}: ${count} devices`)
      .join(' | ');
  };

  const generateRecommendations = (stats: any): string[] => {
    const recommendations: string[] = [];
    
    if (stats.statusBreakdown.down > 0) {
      recommendations.push(`Investigate ${stats.statusBreakdown.down} offline devices for communication or power issues`);
    }
    
    if (stats.statusBreakdown.alarm > 0) {
      recommendations.push(`Review and acknowledge ${stats.statusBreakdown.alarm} alarm conditions`);
    }
    
    if (stats.statusBreakdown.fault > 0) {
      recommendations.push(`Immediate service required for ${stats.statusBreakdown.fault} devices with fault conditions`);
    }
    
    if (stats.statusBreakdown.ok / stats.total > 0.95) {
      recommendations.push('System demonstrates excellent operational stability');
    }
    
    if (Object.keys(stats.typeBreakdown).length > 10) {
      recommendations.push('Consider network segmentation strategies for improved performance');
    }
    
    return recommendations;
  };

  const calculateHealthScore = (stats: any): number => {
    const okWeight = 100;
    const alarmWeight = 70;
    const downWeight = 0;
    const faultWeight = 0;
    const unknownWeight = 50;
    
    const totalWeight = 
      (stats.statusBreakdown.ok * okWeight) +
      (stats.statusBreakdown.alarm * alarmWeight) +
      (stats.statusBreakdown.down * downWeight) +
      (stats.statusBreakdown.fault * faultWeight) +
      (stats.statusBreakdown.unknown * unknownWeight);
    
    return Math.round(totalWeight / stats.total);
  };

  const formatSummaryAsText = (summary: GeneratedSummary, notes: string): string => {
    let text = `${summary.title}\n${'='.repeat(summary.title.length)}\n\n`;
    text += `${summary.overview}\n\n`;
    
    if (summary.deviceBreakdown) {
      text += `DEVICE BREAKDOWN:\n${summary.deviceBreakdown}\n\n`;
    }
    
    if (summary.criticalFindings.length > 0) {
      text += `CRITICAL FINDINGS:\n`;
      summary.criticalFindings.forEach(finding => {
        text += `• ${finding}\n`;
      });
      text += '\n';
    }
    
    if (summary.recommendations.length > 0) {
      text += `RECOMMENDATIONS:\n`;
      summary.recommendations.forEach(rec => {
        text += `• ${rec}\n`;
      });
      text += '\n';
    }
    
    if (notes.trim()) {
      text += `ADDITIONAL NOTES:\n${notes}\n\n`;
    }
    
    text += `\nGenerated: ${new Date().toLocaleString()}\n`;
    text += `Data Source: ${dataset.filename} (${selectedCount} selected records)`;
    
    return text;
  };

  const handleCopyToClipboard = () => {
    if (!generatedSummary) return;
    
    const text = formatSummaryAsText(generatedSummary, customNotes);
    navigator.clipboard.writeText(text);
    
    toast({
      title: "Copied to Clipboard",
      description: "Summary has been copied to your clipboard",
      variant: "default"
    });
  };

  const handleDownloadSummary = () => {
    if (!generatedSummary) return;
    
    const text = formatSummaryAsText(generatedSummary, customNotes);
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tridium-analysis-${dataset.filename.replace('.csv', '')}-${Date.now()}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Analysis Summary Generator
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Selection Status */}
        <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            {selectedCount > 0 ? (
              <CheckCircle className="w-5 h-5 text-green-500" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-yellow-500" />
            )}
            <span className="font-medium">
              {selectedCount} of {dataset.rows.length} records selected
            </span>
          </div>
          {selectedCount === 0 && (
            <span className="text-sm text-muted-foreground">
              Select data rows in the table above to generate analysis
            </span>
          )}
        </div>

        {/* Summary Template Selection */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Summary Template</label>
          <Select value={summaryTemplate} onValueChange={setSummaryTemplate}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="comprehensive">Comprehensive Analysis</SelectItem>
              <SelectItem value="executive">Executive Summary</SelectItem>
              <SelectItem value="technical">Technical Report</SelectItem>
              <SelectItem value="issues">Critical Issues Focus</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Custom Notes */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Additional Notes</label>
          <Textarea
            placeholder="Add any additional observations or context..."
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Generate Button */}
        <Button 
          onClick={generateSummary} 
          disabled={selectedCount === 0}
          className="w-full"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Generate Analysis Summary
        </Button>

        {/* Generated Summary Preview */}
        {generatedSummary && (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{generatedSummary.title}</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={handleCopyToClipboard}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadSummary}>
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="whitespace-pre-wrap text-sm bg-muted p-4 rounded-md">
                  {generatedSummary.overview}
                </div>
                
                {generatedSummary.deviceBreakdown && (
                  <div>
                    <h4 className="font-medium mb-2">Device Distribution</h4>
                    <p className="text-sm text-muted-foreground">{generatedSummary.deviceBreakdown}</p>
                  </div>
                )}
                
                {generatedSummary.criticalFindings.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Critical Findings</h4>
                    <ul className="text-sm space-y-1">
                      {generatedSummary.criticalFindings.map((finding, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {finding}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {generatedSummary.recommendations.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recommendations</h4>
                    <ul className="text-sm space-y-1">
                      {generatedSummary.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                          {rec}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};