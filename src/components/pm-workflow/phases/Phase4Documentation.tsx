import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Mail, 
  Printer, 
  CheckCircle2, 
  AlertTriangle,
  Eye,
  Send,
  Settings,
  BarChart3,
  Image,
  Table,
  ArrowRight,
  Clock,
  Users,
  Shield
} from 'lucide-react';
import { PhaseHeader, SectionCard } from '../shared';
import { logger } from '@/utils/logger';
import { PMReportGenerator } from '@/services/pdf';
import { PostVisitPhase } from '@/components/visit/phases/PostVisitPhase';

// Import types
import type { DocumentationData, PMWorkflowData } from '@/types/pmWorkflow';

interface Phase4DocumentationProps {
  data: DocumentationData;
  workflowData: PMWorkflowData;
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
  const [reportGenerated, setReportGenerated] = useState(false);
  const [sendingReport, setSendingReport] = useState(false);
  const [reportBlob, setReportBlob] = useState<Blob | null>(null);
  const [reportUrl, setReportUrl] = useState<string | null>(null);
  const [reportError, setReportError] = useState<string | null>(null);

  // Cleanup blob URLs on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      if (reportUrl) {
        PMReportGenerator.cleanup(reportUrl);
      }
    };
  }, [reportUrl]);

  const calculateProgress = (): number => {
    const sections = ['summary', 'config', 'delivery', 'closeout'];
    const completed = sections.filter(section => validateSection(section)).length;
    return (completed / sections.length) * 100;
  };

  const validateSection = (section: string): boolean => {
    switch (section) {
      case 'summary':
        return !!(data.serviceSummary.executiveSummary && data.serviceSummary.keyFindings.length > 0);
      case 'config':
        return !!(data.reportConfig.template);
      case 'delivery':
        return !!(data.deliveryInfo.primaryRecipient && data.deliveryInfo.method);
      case 'closeout':
        return true; // For now, always consider this complete (could add validation later)
      default:
        return false;
    }
  };

  // Auto-generate summary data from previous phases
  const generateAutoSummary = () => {
    const phase1 = workflowData.phase1;
    const phase2 = workflowData.phase2;
    const phase3 = workflowData.phase3;

    const autoSummary = {
      executiveSummary: `Completed ${workflowData.session.serviceTier} tier preventive maintenance service for ${phase1.customer.companyName} - ${phase1.customer.siteName}. System health assessment performed on ${phase2.bmsSystem.platform || 'BMS'} platform with ${phase3.tasks.filter(t => t.status === 'Completed').length} maintenance tasks completed.`,
      
      keyFindings: [
        `BMS Platform: ${phase2.bmsSystem.platform || 'Not specified'}`,
        `Service Tier: ${workflowData.session.serviceTier}`,
        `Tasks Completed: ${phase3.tasks.filter(t => t.status === 'Completed').length}/${phase3.tasks.length}`,
        `Issues Found: ${phase3.issues.length}`,
        `Recommendations: ${phase3.recommendations.length}`
      ].filter(finding => !finding.includes('Not specified')),
      
      valueDelivered: [
        'System performance verification completed',
        'Critical alarms addressed',
        'Documentation updated',
        'Preventive maintenance tasks performed',
        phase3.issues.length > 0 && 'System issues identified and addressed',
        phase3.recommendations.length > 0 && 'Improvement recommendations provided'
      ].filter(Boolean) as string[],
      
      systemImprovements: phase3.recommendations.map(rec => rec.title),
      
      nextSteps: [
        'Continue regular preventive maintenance schedule',
        phase3.issues.filter(i => i.status === 'Deferred').length > 0 && 'Address deferred maintenance items',
        phase3.recommendations.filter(r => r.type === 'Immediate').length > 0 && 'Implement immediate recommendations'
      ].filter(Boolean) as string[],
      
      followupRequired: phase3.issues.some(i => i.status === 'Deferred') || phase3.recommendations.some(r => r.type === 'Immediate'),
      
      followupActions: [
        ...phase3.issues.filter(i => i.status === 'Deferred').map(i => `Resolve: ${i.title}`),
        ...phase3.recommendations.filter(r => r.type === 'Immediate').map(r => `Implement: ${r.title}`)
      ]
    };

    updateServiceSummary(autoSummary);
    logger.info('Auto-generated service summary from workflow data');
  };

  const updateServiceSummary = (updates: any) => {
    onDataUpdate({
      serviceSummary: { ...data.serviceSummary, ...updates }
    });
  };

  const updateReportConfig = (field: string, value: any) => {
    if (field.includes('.')) {
      const [parent, child] = field.split('.');
      onDataUpdate({
        reportConfig: { 
          ...data.reportConfig, 
          [parent]: { ...data.reportConfig[parent as keyof typeof data.reportConfig], [child]: value }
        }
      });
    } else {
      onDataUpdate({
        reportConfig: { ...data.reportConfig, [field]: value }
      });
    }
  };

  const updateDeliveryInfo = (field: string, value: any) => {
    onDataUpdate({
      deliveryInfo: { ...data.deliveryInfo, [field]: value }
    });
  };

  const generateReport = async () => {
    setGeneratingReport(true);
    setReportError(null);
    
    try {
      // Validate workflow data before generation
      const validation = PMReportGenerator.validateWorkflowData(workflowData);
      
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
      }

      // Log warnings if any
      if (validation.warnings.length > 0) {
        logger.warn('PDF generation warnings:', validation.warnings);
      }

      // Prepare PDF options from report configuration
      const options = {
        template: data.reportConfig.template,
        includeSections: data.reportConfig.includeSections,
        includePhotos: data.reportConfig.includePhotos,
        includeCharts: data.reportConfig.includeCharts,
        includeDataTables: data.reportConfig.includeDataTables,
        brandingLevel: data.reportConfig.brandingLevel,
        confidentiality: data.reportConfig.confidentiality,
      };

      // Generate PDF
      const result = await PMReportGenerator.generateReport(workflowData, options);

      if (!result.success) {
        throw new Error(result.error || 'PDF generation failed');
      }

      // Store the generated PDF
      setReportBlob(result.blob!);
      setReportUrl(result.url!);
      setReportGenerated(true);
      
      logger.info(`PDF generated successfully in ${result.stats.generationTime.toFixed(0)}ms`);
      logger.info(`File size: ${(result.stats.fileSize! / 1024).toFixed(1)} KB`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setReportError(errorMessage);
      logger.error('PDF generation failed:', error);
    } finally {
      setGeneratingReport(false);
    }
  };

  const downloadReport = () => {
    if (!reportBlob) return;
    
    try {
      PMReportGenerator.downloadReport(reportBlob, undefined, workflowData);
      logger.info('PDF download initiated');
    } catch (error) {
      logger.error('PDF download failed:', error);
      setReportError('Failed to download PDF report');
    }
  };

  const previewReport = () => {
    if (!reportUrl) return;
    
    // Open PDF in new tab for preview
    window.open(reportUrl, '_blank');
    logger.info('PDF preview opened');
  };

  const simulateReportDelivery = async () => {
    setSendingReport(true);
    
    try {
      // Simulate email delivery - in real implementation, this would call an email service
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      logger.info(`Report sent to ${data.deliveryInfo.primaryRecipient}`);
      
      // TODO: Implement actual email delivery service
      // await EmailService.sendReport({
      //   to: data.deliveryInfo.primaryRecipient,
      //   cc: data.deliveryInfo.ccRecipients,
      //   subject: `PM Report - ${workflowData.phase1.customer.companyName}`,
      //   body: generateEmailBody(),
      //   attachment: reportBlob
      // });
      
    } catch (error) {
      logger.error('Report delivery failed:', error);
      setReportError('Failed to send report');
    } finally {
      setSendingReport(false);
    }
  };

  const generateEmailBody = (): string => {
    const { session, phase1 } = workflowData;
    return `
Dear ${data.deliveryInfo.primaryRecipient.split('@')[0]},

Please find attached the ${session.serviceTier} tier preventive maintenance report for ${phase1.customer.companyName} - ${phase1.customer.siteName}.

Service completed on: ${new Date(session.startTime).toLocaleDateString()}
Technician: ${session.technicianName}

${data.deliveryInfo.deliveryNotes || 'Thank you for choosing AME Controls for your building automation maintenance needs.'}

Best regards,
AME Controls Service Team
    `.trim();
  };

  const getReportStats = () => {
    const stats = {
      totalPages: 8,
      includePhotos: data.reportConfig.includePhotos ? workflowData.phase2.photos.length : 0,
      includeCharts: data.reportConfig.includeCharts ? 4 : 0,
      includeDataTables: data.reportConfig.includeDataTables ? 3 : 0,
      tasksCompleted: workflowData.phase3.tasks.filter(t => t.status === 'Completed').length,
      issuesFound: workflowData.phase3.issues.length,
      recommendations: workflowData.phase3.recommendations.length
    };
    return stats;
  };

  const canCompletePhase = (): boolean => {
    return ['summary', 'config', 'delivery', 'closeout'].every(section => validateSection(section));
  };

  const handlePhaseComplete = () => {
    if (canCompletePhase()) {
      logger.info('Phase 4 Documentation completed - PM Workflow finished');
      onPhaseComplete();
    }
  };

  const progress = calculateProgress();
  const reportStats = getReportStats();

  return (
    <div className="h-full flex flex-col">
      <PhaseHeader
        phase={4}
        title="Documentation & Reporting"
        description="Generate professional documentation and deliver results"
        progress={progress}
        requiredTasks={['Service Summary', 'Report Configuration', 'Delivery Setup', 'Visit Closeout']}
        completedTasks={['summary', 'config', 'delivery', 'closeout'].filter(validateSection)}
        estimatedTime={15}
        actualTime={0}
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
              Report Config
              {validateSection('config') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="delivery" className="gap-2">
              <Send className="h-4 w-4" />
              Delivery
              {validateSection('delivery') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
            <TabsTrigger value="closeout" className="gap-2">
              <Shield className="h-4 w-4" />
              Visit Closeout
              {validateSection('closeout') && <CheckCircle2 className="h-3 w-3 text-green-600" />}
            </TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {/* Service Summary Tab */}
            <TabsContent value="summary" className="mt-0">
              <SectionCard
                title="Service Summary"
                description="Executive summary and key findings from the PM visit"
                icon={<FileText className="h-4 w-4" />}
                required
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                      Summarize the work performed and key findings
                    </p>
                    <Button onClick={generateAutoSummary} variant="outline" className="gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Auto-Generate
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <Label>Executive Summary *</Label>
                    <Textarea
                      value={data.serviceSummary.executiveSummary}
                      onChange={(e) => updateServiceSummary({ executiveSummary: e.target.value })}
                      placeholder="Brief overview of the service visit, what was accomplished, and overall system status..."
                      rows={4}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Key Findings</Label>
                      <div className="space-y-2">
                        {data.serviceSummary.keyFindings.map((finding, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input 
                              value={finding} 
                              onChange={(e) => {
                                const updated = [...data.serviceSummary.keyFindings];
                                updated[index] = e.target.value;
                                updateServiceSummary({ keyFindings: updated });
                              }}
                            />
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                const updated = data.serviceSummary.keyFindings.filter((_, i) => i !== index);
                                updateServiceSummary({ keyFindings: updated });
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const updated = [...data.serviceSummary.keyFindings, ''];
                            updateServiceSummary({ keyFindings: updated });
                          }}
                          className="gap-2"
                        >
                          + Add Finding
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Value Delivered</Label>
                      <div className="space-y-2">
                        {data.serviceSummary.valueDelivered.map((value, index) => (
                          <div key={index} className="flex items-center gap-2">
                            <Input 
                              value={value} 
                              onChange={(e) => {
                                const updated = [...data.serviceSummary.valueDelivered];
                                updated[index] = e.target.value;
                                updateServiceSummary({ valueDelivered: updated });
                              }}
                            />
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => {
                                const updated = data.serviceSummary.valueDelivered.filter((_, i) => i !== index);
                                updateServiceSummary({ valueDelivered: updated });
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ))}
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            const updated = [...data.serviceSummary.valueDelivered, ''];
                            updateServiceSummary({ valueDelivered: updated });
                          }}
                          className="gap-2"
                        >
                          + Add Value
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Next Steps</Label>
                      <Textarea
                        value={data.serviceSummary.nextSteps.join('\n')}
                        onChange={(e) => updateServiceSummary({ nextSteps: e.target.value.split('\n').filter(s => s.trim()) })}
                        placeholder="Recommended next steps and actions..."
                        rows={3}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Follow-up Actions</Label>
                      <Textarea
                        value={data.serviceSummary.followupActions.join('\n')}
                        onChange={(e) => updateServiceSummary({ followupActions: e.target.value.split('\n').filter(a => a.trim()) })}
                        placeholder="Specific follow-up items requiring attention..."
                        rows={3}
                      />
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="followup-required"
                          checked={data.serviceSummary.followupRequired}
                          onCheckedChange={(checked) => updateServiceSummary({ followupRequired: checked })}
                        />
                        <Label htmlFor="followup-required">Follow-up visit required</Label>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Service Visit Stats</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{reportStats.tasksCompleted}</div>
                        <div className="text-sm text-muted-foreground">Tasks Completed</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{reportStats.issuesFound}</div>
                        <div className="text-sm text-muted-foreground">Issues Found</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{reportStats.recommendations}</div>
                        <div className="text-sm text-muted-foreground">Recommendations</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{reportStats.includePhotos}</div>
                        <div className="text-sm text-muted-foreground">Photos Taken</div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* Report Configuration Tab */}
            <TabsContent value="config" className="mt-0">
              <SectionCard
                title="Report Configuration"
                description="Customize the professional PDF report format and content"
                icon={<Settings className="h-4 w-4" />}
                required
              >
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Report Template *</Label>
                      <Select 
                        value={data.reportConfig.template} 
                        onValueChange={(value) => updateReportConfig('template', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Choose template" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Customer">Customer Report - Executive Focus</SelectItem>
                          <SelectItem value="Technical">Technical Report - Detailed Analysis</SelectItem>
                          <SelectItem value="Executive">Executive Summary - High Level</SelectItem>
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
                          <SelectItem value="Full">Full AME Branding</SelectItem>
                          <SelectItem value="Minimal">Minimal Branding</SelectItem>
                          <SelectItem value="None">No Branding</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Confidentiality</Label>
                      <Select 
                        value={data.reportConfig.confidentiality} 
                        onValueChange={(value) => updateReportConfig('confidentiality', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Public">Public</SelectItem>
                          <SelectItem value="Confidential">Confidential</SelectItem>
                          <SelectItem value="Restricted">Restricted</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium mb-3 block">Report Sections</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      {[
                        { key: 'executiveSummary', label: 'Executive Summary' },
                        { key: 'systemOverview', label: 'System Overview' },
                        { key: 'workPerformed', label: 'Work Performed' },
                        { key: 'issues', label: 'Issues Found' },
                        { key: 'recommendations', label: 'Recommendations' },
                        { key: 'appendix', label: 'Technical Appendix' }
                      ].map(section => (
                        <div key={section.key} className="flex items-center space-x-2">
                          <Checkbox
                            id={`section-${section.key}`}
                            checked={data.reportConfig.includeSections[section.key as keyof typeof data.reportConfig.includeSections]}
                            onCheckedChange={(checked) => updateReportConfig(`includeSections.${section.key}`, checked)}
                          />
                          <Label htmlFor={`section-${section.key}`}>{section.label}</Label>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-medium mb-3 block">Visual Elements</Label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="include-photos"
                          checked={data.reportConfig.includePhotos}
                          onCheckedChange={(checked) => updateReportConfig('includePhotos', checked)}
                        />
                        <Label htmlFor="include-photos" className="flex items-center gap-2">
                          <Image className="h-4 w-4" />
                          Photos ({reportStats.includePhotos})
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="include-charts"
                          checked={data.reportConfig.includeCharts}
                          onCheckedChange={(checked) => updateReportConfig('includeCharts', checked)}
                        />
                        <Label htmlFor="include-charts" className="flex items-center gap-2">
                          <BarChart3 className="h-4 w-4" />
                          Charts & Graphs
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="include-tables"
                          checked={data.reportConfig.includeDataTables}
                          onCheckedChange={(checked) => updateReportConfig('includeDataTables', checked)}
                        />
                        <Label htmlFor="include-tables" className="flex items-center gap-2">
                          <Table className="h-4 w-4" />
                          Data Tables
                        </Label>
                      </div>
                    </div>
                  </div>

                  {/* Report Preview */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-medium mb-3">Report Preview</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <div className="font-medium">Template:</div>
                        <div className="text-muted-foreground">{data.reportConfig.template}</div>
                      </div>
                      <div>
                        <div className="font-medium">Estimated Pages:</div>
                        <div className="text-muted-foreground">{reportStats.totalPages}</div>
                      </div>
                      <div>
                        <div className="font-medium">Visual Elements:</div>
                        <div className="text-muted-foreground">
                          {[
                            data.reportConfig.includePhotos && 'Photos',
                            data.reportConfig.includeCharts && 'Charts',
                            data.reportConfig.includeDataTables && 'Tables'
                          ].filter(Boolean).join(', ') || 'Text only'}
                        </div>
                      </div>
                      <div>
                        <div className="font-medium">Confidentiality:</div>
                        <div className="text-muted-foreground">{data.reportConfig.confidentiality}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* Delivery Tab */}
            <TabsContent value="delivery" className="mt-0">
              <SectionCard
                title="Report Delivery"
                description="Configure how and where to deliver the final report"
                icon={<Send className="h-4 w-4" />}
                required
              >
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Delivery Method *</Label>
                      <Select 
                        value={data.deliveryInfo.method} 
                        onValueChange={(value) => updateDeliveryInfo('method', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="How to deliver" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Email">Email Only</SelectItem>
                          <SelectItem value="Print">Print Only</SelectItem>
                          <SelectItem value="Both">Email + Print Copy</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Primary Recipient *</Label>
                      <Input
                        value={data.deliveryInfo.primaryRecipient}
                        onChange={(e) => updateDeliveryInfo('primaryRecipient', e.target.value)}
                        placeholder="primary.contact@customer.com"
                        type="email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>CC Recipients</Label>
                    <Input
                      value={data.deliveryInfo.ccRecipients.join(', ')}
                      onChange={(e) => updateDeliveryInfo('ccRecipients', e.target.value.split(',').map(email => email.trim()).filter(email => email))}
                      placeholder="cc1@customer.com, cc2@customer.com"
                    />
                    <p className="text-sm text-muted-foreground">Separate multiple emails with commas</p>
                  </div>

                  <div className="space-y-2">
                    <Label>Delivery Notes</Label>
                    <Textarea
                      value={data.deliveryInfo.deliveryNotes}
                      onChange={(e) => updateDeliveryInfo('deliveryNotes', e.target.value)}
                      placeholder="Any special delivery instructions or notes to include..."
                      rows={3}
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="signature-required"
                      checked={data.deliveryInfo.signatureRequired}
                      onCheckedChange={(checked) => updateDeliveryInfo('signatureRequired', checked)}
                    />
                    <Label htmlFor="signature-required">Customer signature required</Label>
                  </div>

                  {/* Report Actions */}
                  <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                    <h4 className="font-medium">Report Generation & Delivery</h4>
                    
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        onClick={generateReport}
                        disabled={generatingReport || !canCompletePhase()}
                        className="gap-2"
                      >
                        {generatingReport ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Generating PDF...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4" />
                            Generate PDF
                          </>
                        )}
                      </Button>
                      
                      {reportGenerated && !reportError && (
                        <>
                          <Button variant="outline" className="gap-2" onClick={previewReport}>
                            <Eye className="h-4 w-4" />
                            Preview
                          </Button>
                          <Button variant="outline" className="gap-2" onClick={downloadReport}>
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                          <Button 
                            onClick={simulateReportDelivery}
                            disabled={sendingReport || !data.deliveryInfo.primaryRecipient}
                            className="gap-2"
                          >
                            {sendingReport ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                Sending...
                              </>
                            ) : (
                              <>
                                <Mail className="h-4 w-4" />
                                Send Report
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>

                    {reportGenerated && !reportError && (
                      <Alert>
                        <CheckCircle2 className="h-4 w-4" />
                        <AlertDescription>
                          Professional PDF report generated successfully! Ready for delivery to {data.deliveryInfo.primaryRecipient}
                        </AlertDescription>
                      </Alert>
                    )}

                    {reportError && (
                      <Alert variant="destructive">
                        <AlertTriangle className="h-4 w-4" />
                        <AlertDescription>
                          PDF Generation Error: {reportError}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
              </SectionCard>
            </TabsContent>

            {/* Visit Closeout Tab */}
            <TabsContent value="closeout" className="mt-0">
              <SectionCard
                title="Visit Closeout Checklist"
                description="Complete safety checks and customer communication requirements"
                icon={<Shield className="h-4 w-4" />}
                required
              >
                <div className="space-y-4">
                  <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2">Visit Closeout Requirements</h4>
                    <div className="text-sm text-blue-800 space-y-1">
                      <div>• Verify all safety protocols were followed</div>
                      <div>• Confirm all tools and equipment are accounted for</div>
                      <div>• Ensure system is operational and secure</div>
                      <div>• Obtain customer feedback and satisfaction confirmation</div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-3">
                      <strong>Note:</strong> The full visit closeout checklist with safety verification, issue tracking,
                      customer feedback collection, and recommendations is available in the complete visit workflow.
                      For PM-only visits, ensure the key items above are completed.
                    </p>

                    <div className="space-y-3">
                      {/* Mini Checklist for PM */}
                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox id="tools-removed" />
                          <Label htmlFor="tools-removed" className="text-sm">
                            All tools accounted for and removed from site
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="panels-secured" />
                          <Label htmlFor="panels-secured" className="text-sm">
                            All panels closed and secured properly
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="system-operational" />
                          <Label htmlFor="system-operational" className="text-sm">
                            System confirmed operational
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="customer-briefed" />
                          <Label htmlFor="customer-briefed" className="text-sm">
                            Customer briefed on work performed
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox id="area-cleaned" />
                          <Label htmlFor="area-cleaned" className="text-sm">
                            Work area cleaned and debris removed
                          </Label>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Customer Contact Name</Label>
                        <Input
                          placeholder="Name of customer contact who confirmed work completion"
                          className="text-sm"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium">Final Notes</Label>
                        <Textarea
                          placeholder="Any final observations or notes for the customer..."
                          rows={3}
                          className="text-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </SectionCard>
            </TabsContent>
          </div>

          {/* Phase Completion Footer */}
          <div className="border-t bg-white p-4">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <span className="font-medium">Progress: {Math.round(progress)}%</span>
                <span className="text-muted-foreground ml-2">
                  ({['summary', 'config', 'delivery', 'closeout'].filter(validateSection).length} of 4 sections completed)
                </span>
              </div>
              <Button
                onClick={handlePhaseComplete}
                disabled={!canCompletePhase() || !reportGenerated}
                className="gap-2"
              >
                Complete PM Workflow
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>

            {(!canCompletePhase() || !reportGenerated) && (
              <Alert className="mt-3">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  Complete service summary, configure report, set delivery details, complete visit closeout, and generate PDF to finish the workflow.
                  {!validateSection('summary') && ' Fill in service summary.'}
                  {!validateSection('config') && ' Select report template.'}
                  {!validateSection('delivery') && ' Set delivery recipient.'}
                  {!validateSection('closeout') && ' Complete visit closeout checklist.'}
                  {!reportGenerated && ' Generate PDF report.'}
                </AlertDescription>
              </Alert>
            )}
          </div>
        </Tabs>
      </div>
    </div>
  );
};
