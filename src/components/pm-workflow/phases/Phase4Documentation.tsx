import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  ArrowRight,
  Download,
  Mail,
  Printer,
  Eye,
  Settings,
  BarChart3,
  PieChart,
  TrendingUp,
  Clock,
  Target,
  Wrench,
  Lightbulb,
  Camera,
  Save,
  Share2,
  Edit3
} from 'lucide-react';
import { Customer } from '@/types';
import { PhaseHeader, SectionCard } from '../shared';

// Import chart components
import { 
  BarChart, 
  Bar, 
  PieChart as RechartsPieChart, 
  Pie,
  Cell, 
  ResponsiveContainer, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  RadialBarChart,
  RadialBar
} from 'recharts';

// Import types
import type { 
  ServiceSummaryData,
  ReportConfigData,
  DeliveryInfo,
  GeneratedReportData,
  PMWorkflowData
} from '@/types/pmWorkflow';

interface DocumentationData {
  summary: ServiceSummaryData;
  reportConfig: ReportConfigData;
  deliveryInfo: DeliveryInfo;
  generatedReports: GeneratedReportData[];
}

interface Phase4DocumentationProps {
  data: DocumentationData;
  workflowData: PMWorkflowData; // Full workflow data for report generation
  onDataUpdate: (data: Partial<DocumentationData>) => void;
  onPhaseComplete: () => void;
}

export const Phase4Documentation: React.FC<Phase4DocumentationProps> = ({
  data,
  workflowData,
  onDataUpdate,
  onPhaseComplete
}) => {
  const [activeTab, setActiveTab] = useState('summary');
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportPreview, setReportPreview] = useState<string | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const calculateProgress = (): number => {
    const sections = ['summary', 'config', 'delivery'];
    const completed = sections.filter(section => validateSection(section)).length;
    return (completed / sections.length) * 100;
  };

  const validateSection = (section: string): boolean => {
    switch (section) {
      case 'summary':
        return !!(data.summary.executiveSummary && data.summary.keyFindings.length > 0);
      case 'config':
        return !!(data.reportConfig.template && data.reportConfig.includeSections.some(s => s.include));
      case 'delivery':
        return !!(data.deliveryInfo.method && data.deliveryInfo.recipients.length > 0);
      default:
        return false;
    }
  };

  const updateSummary = (field: keyof ServiceSummaryData, value: any) => {
    onDataUpdate({
      summary: { ...data.summary, [field]: value }
    });
  };

  const updateReportConfig = (field: keyof ReportConfigData, value: any) => {
    onDataUpdate({
      reportConfig: { ...data.reportConfig, [field]: value }
    });
  };

  const updateDeliveryInfo = (field: keyof DeliveryInfo, value: any) => {
    onDataUpdate({
      deliveryInfo: { ...data.deliveryInfo, [field]: value }
    });
  };

  const generateExecutiveSummary = () => {
    const completedTasks = workflowData.serviceActivities.tasks.filter(t => t.status === 'Completed');
    const criticalIssues = workflowData.serviceActivities.issues.filter(i => i.severity === 'Critical');
    const highPriorityRecs = workflowData.serviceActivities.recommendations.filter(r => r.priority === 'High');
    const healthScore = workflowData.serviceActivities.serviceMetrics.systemHealthScore;
    
    const autoSummary = `PM service completed for ${customer.company_name} on ${new Date().toLocaleDateString()}. 
    
System Health Score: ${healthScore}/100
Tasks Completed: ${completedTasks.length}/${workflowData.serviceActivities.tasks.length}
Issues Identified: ${workflowData.serviceActivities.issues.length} (${criticalIssues.length} Critical)
Recommendations Provided: ${workflowData.serviceActivities.recommendations.length} (${highPriorityRecs.length} High Priority)

${healthScore >= 90 ? 'System is operating optimally with minor opportunities for improvement.' :
  healthScore >= 70 ? 'System is functioning well with some areas requiring attention.' :
  healthScore >= 50 ? 'System requires attention to address several operational issues.' :
  'System requires immediate attention to address critical operational concerns.'}`;

    updateSummary('executiveSummary', autoSummary);
  };

  const generateKeyFindings = () => {
    const findings: string[] = [];
    
    // Task-based findings
    const completedTasks = workflowData.serviceActivities.tasks.filter(t => t.status === 'Completed');
    completedTasks.forEach(task => {
      if (task.findings.trim()) {
        findings.push(`${task.name}: ${task.findings}`);
      }
    });

    // Issue-based findings
    workflowData.serviceActivities.issues.forEach(issue => {
      findings.push(`${issue.severity} Issue - ${issue.title}: ${issue.description}`);
    });

    updateSummary('keyFindings', findings.slice(0, 10)); // Limit to top 10
  };

  const generateReportData = () => {
    const tasks = workflowData.serviceActivities.tasks;
    const issues = workflowData.serviceActivities.issues;
    const recommendations = workflowData.serviceActivities.recommendations;
    
    return {
      taskCompletion: [
        { name: 'Completed', value: tasks.filter(t => t.status === 'Completed').length, color: '#22c55e' },
        { name: 'Pending', value: tasks.filter(t => t.status === 'Pending').length, color: '#64748b' },
        { name: 'Skipped', value: tasks.filter(t => t.status === 'Skipped').length, color: '#f59e0b' }
      ],
      issueSeverity: [
        { name: 'Critical', value: issues.filter(i => i.severity === 'Critical').length, color: '#ef4444' },
        { name: 'High', value: issues.filter(i => i.severity === 'High').length, color: '#f97316' },
        { name: 'Medium', value: issues.filter(i => i.severity === 'Medium').length, color: '#eab308' },
        { name: 'Low', value: issues.filter(i => i.severity === 'Low').length, color: '#22c55e' }
      ],
      recommendationTypes: [
        { name: 'Immediate', value: recommendations.filter(r => r.type === 'Immediate').length, color: '#ef4444' },
        { name: 'Short Term', value: recommendations.filter(r => r.type === 'Short Term').length, color: '#f97316' },
        { name: 'Long Term', value: recommendations.filter(r => r.type === 'Long Term').length, color: '#3b82f6' },
        { name: 'Upgrade', value: recommendations.filter(r => r.type === 'Upgrade').length, color: '#8b5cf6' }
      ],
      systemHealth: [
        { 
          name: 'System Health', 
          value: workflowData.serviceActivities.serviceMetrics.systemHealthScore,
          color: workflowData.serviceActivities.serviceMetrics.systemHealthScore >= 90 ? '#22c55e' :
                 workflowData.serviceActivities.serviceMetrics.systemHealthScore >= 70 ? '#eab308' : '#ef4444'
        }
      ]
    };
  };

  const generatePDFReport = async () => {
    setGeneratingReport(true);
    
    try {
      // Auto-generate content if not already provided
      if (!data.summary.executiveSummary) {
        generateExecutiveSummary();
      }
      if (data.summary.keyFindings.length === 0) {
        generateKeyFindings();
      }
      
      // For now, we'll create a print-friendly HTML version
      // In a production environment, you'd use a library like jsPDF or Puppeteer
      const reportHTML = generateReportHTML();
      setReportPreview(reportHTML);
      
      // Simulate report generation delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newReport: GeneratedReportData = {
        id: `REP-${Date.now()}`,
        template: data.reportConfig.template,
        filename: `${customer.company_name}_PM_Report_${new Date().toISOString().split('T')[0]}.pdf`,
        fileSize: Math.floor(Math.random() * 1000000) + 500000, // Simulate file size
        generatedAt: new Date(),
        generatedBy: 'PM Workflow System',
        url: '#', // Would be actual URL in production
        deliveryStatus: 'pending',
        downloadCount: 0,
        version: 1
      };
      
      onDataUpdate({
        generatedReports: [...data.generatedReports, newReport]
      });
      
    } catch (error) {
      console.error('Error generating report:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const generateReportHTML = (): string => {
    const reportData = generateReportData();
    const serviceTier = customer.service_tier || 'CORE';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>${customer.company_name} - PM Service Report</title>
        <style>
          @page { margin: 0.75in; size: 8.5in 11in; }
          body { font-family: Arial, sans-serif; line-height: 1.4; color: #333; }
          .header { text-align: center; border-bottom: 3px solid #1e40af; padding-bottom: 20px; margin-bottom: 30px; }
          .company-logo { font-size: 24px; font-weight: bold; color: #1e40af; margin-bottom: 10px; }
          .report-title { font-size: 20px; font-weight: bold; margin-bottom: 5px; }
          .report-subtitle { font-size: 14px; color: #666; }
          .section { margin-bottom: 30px; page-break-inside: avoid; }
          .section-title { font-size: 16px; font-weight: bold; border-bottom: 2px solid #e5e7eb; padding-bottom: 5px; margin-bottom: 15px; }
          .summary-box { background: #f8fafc; border-left: 4px solid #1e40af; padding: 15px; margin-bottom: 20px; }
          .metrics-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
          .metric-card { text-align: center; padding: 15px; border: 1px solid #e5e7eb; border-radius: 8px; }
          .metric-value { font-size: 24px; font-weight: bold; color: #1e40af; }
          .metric-label { font-size: 12px; color: #666; margin-top: 5px; }
          .task-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
          .task-table th { background: #f1f5f9; padding: 10px; text-align: left; border: 1px solid #e5e7eb; }
          .task-table td { padding: 8px 10px; border: 1px solid #e5e7eb; }
          .status-completed { color: #16a34a; font-weight: bold; }
          .status-pending { color: #64748b; }
          .issue-item { margin-bottom: 15px; padding: 12px; border-left: 4px solid #ef4444; background: #fef2f2; }
          .issue-title { font-weight: bold; margin-bottom: 5px; }
          .issue-severity-critical { border-left-color: #dc2626; }
          .issue-severity-high { border-left-color: #ea580c; }
          .issue-severity-medium { border-left-color: #ca8a04; }
          .issue-severity-low { border-left-color: #16a34a; }
          .recommendation-item { margin-bottom: 15px; padding: 12px; border-left: 4px solid #3b82f6; background: #eff6ff; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-logo">AME CONTROLS</div>
          <div class="report-title">Preventive Maintenance Service Report</div>
          <div class="report-subtitle">${customer.company_name} - ${serviceTier} Service Tier</div>
          <div class="report-subtitle">${new Date().toLocaleDateString()}</div>
        </div>

        <div class="section">
          <div class="section-title">Executive Summary</div>
          <div class="summary-box">
            ${data.summary.executiveSummary || 'Executive summary will be generated automatically.'}
          </div>
          
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">${workflowData.serviceActivities.serviceMetrics.systemHealthScore}/100</div>
              <div class="metric-label">System Health Score</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${workflowData.serviceActivities.tasks.filter(t => t.status === 'Completed').length}/${workflowData.serviceActivities.tasks.length}</div>
              <div class="metric-label">Tasks Completed</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${workflowData.serviceActivities.issues.length}</div>
              <div class="metric-label">Issues Identified</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">${workflowData.serviceActivities.recommendations.length}</div>
              <div class="metric-label">Recommendations</div>
            </div>
          </div>
        </div>

        <div class="section">
          <div class="section-title">Work Performed</div>
          <table class="task-table">
            <thead>
              <tr>
                <th>Task</th>
                <th>Status</th>
                <th>Duration</th>
                <th>Findings</th>
              </tr>
            </thead>
            <tbody>
              ${workflowData.serviceActivities.tasks.map(task => `
                <tr>
                  <td>${task.name}</td>
                  <td class="status-${task.status.toLowerCase().replace(' ', '-')}">${task.status}</td>
                  <td>${task.actualDuration || task.estimatedDuration}min</td>
                  <td>${task.findings || 'N/A'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </div>

        ${workflowData.serviceActivities.issues.length > 0 ? `
        <div class="section">
          <div class="section-title">Issues Identified</div>
          ${workflowData.serviceActivities.issues.map(issue => `
            <div class="issue-item issue-severity-${issue.severity.toLowerCase()}">
              <div class="issue-title">${issue.severity}: ${issue.title}</div>
              <div>${issue.description}</div>
              ${issue.immediateAction ? `<div style="margin-top: 8px;"><strong>Action Taken:</strong> ${issue.immediateAction}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        ${workflowData.serviceActivities.recommendations.length > 0 ? `
        <div class="section">
          <div class="section-title">Recommendations</div>
          ${workflowData.serviceActivities.recommendations.map(rec => `
            <div class="recommendation-item">
              <div class="issue-title">${rec.type} - ${rec.title}</div>
              <div>${rec.description}</div>
              ${rec.justification ? `<div style="margin-top: 8px;"><strong>Justification:</strong> ${rec.justification}</div>` : ''}
            </div>
          `).join('')}
        </div>
        ` : ''}

        <div class="footer">
          <div>AME Controls - Building Automation Excellence</div>
          <div>Report generated on ${new Date().toLocaleString()}</div>
        </div>
      </body>
      </html>
    `;
  };

  const printReport = () => {
    if (reportPreview) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(reportPreview);
        printWindow.document.close();
        printWindow.focus();
        printWindow.print();
        printWindow.close();
      }
    }
  };

  const addFinding = (finding: string) => {
    if (finding.trim() && !data.summary.keyFindings.includes(finding.trim())) {
      updateSummary('keyFindings', [...data.summary.keyFindings, finding.trim()]);
    }
  };

  const removeFinding = (finding: string) => {
    updateSummary('keyFindings', data.summary.keyFindings.filter(f => f !== finding));
  };

  const addRecipient = (email: string, name: string) => {
    if (email.trim() && name.trim()) {
      const newRecipient = {
        name: name.trim(),
        email: email.trim(),
        role: 'Contact',
        notificationType: 'primary' as const
      };
      updateDeliveryInfo('recipients', [...data.deliveryInfo.recipients, newRecipient]);
    }
  };

  const canCompletePhase = (): boolean => {
    return ['summary', 'config', 'delivery'].every(section => validateSection(section)) &&
           data.generatedReports.length > 0;
  };

  const handlePhaseComplete = () => {
    if (canCompletePhase()) {
      onPhaseComplete();
    }
  };

  const progress = calculateProgress();
  const reportData = generateReportData();

  return (
    <div className="h-full flex flex-col">
      <PhaseHeader
        phase={4}
        title="Documentation & Reporting"
        description="Generate professional service reports and delivery"
        progress={progress}
        requiredTasks={['Service Summary', 'Report Configuration', 'Delivery Setup', 'Report Generation']}
        completedTasks={['summary', 'config', 'delivery', 'generation'].filter((section, index) => 
          index < 3 ? validateSection(section) : data.generatedReports.length > 0
        )}
      />

      <div className="flex-1 overflow-hidden">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
          <TabsList className="m-4 grid grid-cols-4">
            <TabsTrigger value="summary" className="gap-2">
              <FileText className="h-4 w-4" />
              Summary
              {validateSection('summary') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="config" className="gap-2">
              <Settings className="h-4 w-4" />
              Configuration
              {validateSection('config') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="preview" className="gap-2">
              <Eye className="h-4 w-4" />
              Preview
              {reportPreview && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-2">
              <Share2 className="h-4 w-4" />
              Delivery
              {validateSection('delivery') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Service Summary Tab */}
            <TabsContent value="summary" className="mt-0">
              <div className="space-y-6">
                <SectionCard
                  title="Service Summary"
                  description="Summarize the service performed and key findings"
                  icon={<FileText className="h-4 w-4" />}
                  required
                >
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Executive Summary</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateExecutiveSummary}
                          className="gap-2"
                        >
                          <Settings className="h-3 w-3" />
                          Auto-Generate
                        </Button>
                      </div>
                      <Textarea
                        value={data.summary.executiveSummary}
                        onChange={(e) => updateSummary('executiveSummary', e.target.value)}
                        placeholder="High-level summary of the service performed..."
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Key Findings</Label>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={generateKeyFindings}
                          className="gap-2"
                        >
                          <Settings className="h-3 w-3" />
                          Auto-Generate
                        </Button>
                      </div>
                      <div className="flex gap-2">
                        <Input
                          placeholder="Add key finding..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              addFinding((e.target as HTMLInputElement).value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }}
                        />
                        <Button 
                          onClick={() => {
                            const input = document.querySelector('input[placeholder*="key finding"]') as HTMLInputElement;
                            if (input?.value) {
                              addFinding(input.value);
                              input.value = '';
                            }
                          }}
                          variant="outline"
                        >
                          Add
                        </Button>
                      </div>
                      
                      <div className="space-y-2">
                        {data.summary.keyFindings.map((finding, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                            <span className="text-sm">{finding}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeFinding(finding)}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Service Metrics Overview */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-primary">
                          {workflowData.serviceActivities.serviceMetrics.systemHealthScore}
                        </div>
                        <div className="text-sm text-muted-foreground">Health Score</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {workflowData.serviceActivities.tasks.filter(t => t.status === 'Completed').length}
                        </div>
                        <div className="text-sm text-muted-foreground">Tasks Done</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {workflowData.serviceActivities.issues.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Issues Found</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {workflowData.serviceActivities.recommendations.length}
                        </div>
                        <div className="text-sm text-muted-foreground">Recommendations</div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </TabsContent>
            {/* Report Configuration Tab */}
            <TabsContent value="config" className="mt-0">
              <div className="space-y-6">
                <SectionCard
                  title="Report Configuration"
                  description="Configure report template and content options"
                  icon={<Settings className="h-4 w-4" />}
                  required
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Report Template</Label>
                        <Select
                          value={data.reportConfig.template}
                          onValueChange={(value) => updateReportConfig('template', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="customer">Customer Report - Simplified</SelectItem>
                            <SelectItem value="technical">Technical Report - Detailed</SelectItem>
                            <SelectItem value="executive">Executive Summary - High-level</SelectItem>
                            <SelectItem value="complete">Complete Report - All Details</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Branding Level</Label>
                        <Select
                          value={data.reportConfig.brandingLevel}
                          onValueChange={(value) => updateReportConfig('brandingLevel', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="full">Full AME Branding</SelectItem>
                            <SelectItem value="minimal">Minimal Branding</SelectItem>
                            <SelectItem value="none">No Branding</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Report Sections</Label>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {data.reportConfig.includeSections.map((section, index) => (
                          <div key={section.section} className="flex items-center space-x-2 p-2 border rounded">
                            <Checkbox
                              checked={section.include}
                              onCheckedChange={(checked) => {
                                const updatedSections = [...data.reportConfig.includeSections];
                                updatedSections[index] = { ...section, include: !!checked };
                                updateReportConfig('includeSections', updatedSections);
                              }}
                            />
                            <Label className="flex-1 capitalize">
                              {section.section.replace('_', ' ')} Section
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Label>Content Options</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={data.reportConfig.includePhotos}
                            onCheckedChange={(checked) => updateReportConfig('includePhotos', checked)}
                          />
                          <Label>Photos</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={data.reportConfig.includeCharts}
                            onCheckedChange={(checked) => updateReportConfig('includeCharts', checked)}
                          />
                          <Label>Charts</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={data.reportConfig.includeDataTables}
                            onCheckedChange={(checked) => updateReportConfig('includeDataTables', checked)}
                          />
                          <Label>Data Tables</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            checked={data.reportConfig.includeRecommendations}
                            onCheckedChange={(checked) => updateReportConfig('includeRecommendations', checked)}
                          />
                          <Label>Recommendations</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                </SectionCard>
              </div>
            </TabsContent>

            {/* Report Preview Tab */}
            <TabsContent value="preview" className="mt-0">
              <div className="space-y-6">
                <SectionCard
                  title="Report Preview & Generation"
                  description="Preview and generate professional PDF reports"
                  icon={<Eye className="h-4 w-4" />}
                >
                  <div className="space-y-4">
                    {/* Generation Controls */}
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                      <div>
                        <h4 className="font-medium">Report Generation</h4>
                        <p className="text-sm text-muted-foreground">
                          Generate a professional PDF report based on your configuration
                        </p>
                      </div>
                      <Button
                        onClick={generatePDFReport}
                        disabled={generatingReport}
                        className="gap-2"
                      >
                        {generatingReport ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary border-t-transparent" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <FileText className="h-4 w-4" />
                            Generate PDF
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Charts and Data Visualization */}
                    {data.reportConfig.includeCharts && (
                      <div className="space-y-4">
                        <h4 className="font-medium">Report Charts & Metrics</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* Task Completion Chart */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">Task Completion Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={200}>
                                <RechartsPieChart>
                                  <Pie
                                    data={reportData.taskCompletion}
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={60}
                                    dataKey="value"
                                  >
                                    {reportData.taskCompletion.map((entry, index) => (
                                      <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                  </Pie>
                                  <Tooltip />
                                  <Legend />
                                </RechartsPieChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>

                          {/* System Health Score */}
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-sm">System Health Score</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <ResponsiveContainer width="100%" height={200}>
                                <RadialBarChart cx="50%" cy="50%" innerRadius="20%" outerRadius="80%" data={reportData.systemHealth}>
                                  <RadialBar
                                    minAngle={15}
                                    label={{ position: 'insideStart', fill: '#fff' }}
                                    background
                                    clockWise
                                    dataKey="value"
                                    fill={reportData.systemHealth[0]?.color}
                                  />
                                  <Legend iconSize={18} layout="vertical" verticalAlign="middle" align="right" />
                                </RadialBarChart>
                              </ResponsiveContainer>
                            </CardContent>
                          </Card>

                          {/* Issue Severity Distribution */}
                          {workflowData.serviceActivities.issues.length > 0 && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Issue Severity Distribution</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                  <BarChart data={reportData.issueSeverity}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#ef4444" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </CardContent>
                            </Card>
                          )}

                          {/* Recommendations by Type */}
                          {workflowData.serviceActivities.recommendations.length > 0 && (
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-sm">Recommendations by Type</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <ResponsiveContainer width="100%" height={200}>
                                  <BarChart data={reportData.recommendationTypes}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis />
                                    <Tooltip />
                                    <Bar dataKey="value" fill="#3b82f6" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </CardContent>
                            </Card>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Generated Reports */}
                    {data.generatedReports.length > 0 && (
                      <div className="space-y-3">
                        <h4 className="font-medium">Generated Reports</h4>
                        {data.generatedReports.map((report) => (
                          <Card key={report.id}>
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="font-medium">{report.filename}</div>
                                  <div className="text-sm text-muted-foreground">
                                    Generated {report.generatedAt.toLocaleString()} • 
                                    {Math.round(report.fileSize / 1024)} KB • 
                                    {report.template} template
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge variant={
                                    report.deliveryStatus === 'delivered' ? 'default' :
                                    report.deliveryStatus === 'sent' ? 'secondary' :
                                    report.deliveryStatus === 'pending' ? 'outline' : 'destructive'
                                  }>
                                    {report.deliveryStatus}
                                  </Badge>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Eye className="h-3 w-3" />
                                    Preview
                                  </Button>
                                  <Button variant="outline" size="sm" onClick={printReport} className="gap-1">
                                    <Printer className="h-3 w-3" />
                                    Print
                                  </Button>
                                  <Button variant="outline" size="sm" className="gap-1">
                                    <Download className="h-3 w-3" />
                                    Download
                                  </Button>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    )}

                    {/* Report Preview */}
                    {reportPreview && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Report Preview</h4>
                          <Button variant="outline" size="sm" onClick={printReport} className="gap-2">
                            <Printer className="h-4 w-4" />
                            Print Report
                          </Button>
                        </div>
                        <div 
                          className="border rounded-lg p-4 bg-white text-black max-h-96 overflow-y-auto text-sm"
                          style={{ fontFamily: 'Arial, sans-serif' }}
                        >
                          <div dangerouslySetInnerHTML={{ __html: reportPreview }} />
                        </div>
                      </div>
                    )}
                  </div>
                </SectionCard>
              </div>
            </TabsContent>

            {/* Delivery Tab */}
            <TabsContent value="delivery" className="mt-0">
              <div className="space-y-6">
                <SectionCard
                  title="Report Delivery"
                  description="Configure how reports will be delivered to the customer"
                  icon={<Share2 className="h-4 w-4" />}
                  required
                >
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Delivery Method</Label>
                        <Select
                          value={data.deliveryInfo.method}
                          onValueChange={(value) => updateDeliveryInfo('method', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="email">Email Delivery</SelectItem>
                            <SelectItem value="portal">Customer Portal</SelectItem>
                            <SelectItem value="print">Print & Hand Delivery</SelectItem>
                            <SelectItem value="usb">USB Drive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Delivery Date</Label>
                        <Input
                          type="date"
                          value={data.deliveryInfo.deliveryDate.toISOString().split('T')[0]}
                          onChange={(e) => updateDeliveryInfo('deliveryDate', new Date(e.target.value))}
                        />
                      </div>
                    </div>

                    {data.deliveryInfo.method === 'email' && (
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label>Email Recipients</Label>
                          <div className="flex gap-2">
                            <Input
                              placeholder="Name"
                              id="recipient-name"
                            />
                            <Input
                              placeholder="Email address"
                              type="email"
                              id="recipient-email"
                            />
                            <Button 
                              onClick={() => {
                                const nameInput = document.getElementById('recipient-name') as HTMLInputElement;
                                const emailInput = document.getElementById('recipient-email') as HTMLInputElement;
                                if (nameInput?.value && emailInput?.value) {
                                  addRecipient(emailInput.value, nameInput.value);
                                  nameInput.value = '';
                                  emailInput.value = '';
                                }
                              }}
                              variant="outline"
                            >
                              Add
                            </Button>
                          </div>
                          
                          <div className="space-y-2">
                            {data.deliveryInfo.recipients.map((recipient, index) => (
                              <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded">
                                <div>
                                  <span className="font-medium">{recipient.name}</span>
                                  <span className="text-sm text-muted-foreground ml-2">{recipient.email}</span>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    const updatedRecipients = data.deliveryInfo.recipients.filter((_, i) => i !== index);
                                    updateDeliveryInfo('recipients', updatedRecipients);
                                  }}
                                >
                                  ×
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={data.deliveryInfo.signatureRequired}
                          onCheckedChange={(checked) => updateDeliveryInfo('signatureRequired', checked)}
                        />
                        <Label>Customer Signature Required</Label>
                      </div>
                    </div>

                    {data.deliveryInfo.signatureRequired && (
                      <Alert>
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          Customer signature will be captured upon report delivery.
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </SectionCard>
              </div>
            </TabsContent>
          </div>

          {/* Phase Completion Footer */}
          <div className="border-t bg-white dark:bg-gray-950 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-sm">
                  <span className="font-medium">Progress: {Math.round(progress)}%</span>
                  <span className="text-muted-foreground ml-2">
                    ({data.generatedReports.length} reports generated)
                  </span>
                </div>
                
                {data.generatedReports.length > 0 && (
                  <div className="text-sm">
                    <span className="font-medium">Ready for Delivery:</span>
                    <span className="text-muted-foreground ml-2">
                      {data.deliveryInfo.recipients.length} recipients configured
                    </span>
                  </div>
                )}
              </div>

              <Button
                onClick={handlePhaseComplete}
                disabled={!canCompletePhase()}
                className="gap-2"
              >
                Complete PM Workflow
                <CheckCircle2 className="h-4 w-4" />
              </Button>
            </div>

            {!canCompletePhase() && (
              <Alert className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Complete service summary, configure report settings, set up delivery options, and generate at least one report to finish the PM workflow.
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Tabs>
      </div>

      {/* Hidden print reference for PDF generation */}
      <div ref={printRef} className="hidden" />
    </div>
  );
};