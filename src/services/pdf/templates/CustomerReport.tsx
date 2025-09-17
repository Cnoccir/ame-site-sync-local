import React from 'react';
import { Document, Page, Text, View } from '@react-pdf/renderer';
import { PMWorkflowData } from '@/types/pmWorkflow';
import { pdfStyles, formatters, PDFGenerationOptions } from '../pdfStyles';
import { 
  ReportHeader, 
  ReportFooter, 
  ServiceMetrics,
  TaskTable,
  IssuesTable,
  RecommendationList
} from '../reportComponents';

interface CustomerReportProps {
  workflowData: PMWorkflowData;
  options: PDFGenerationOptions;
}

export const CustomerReport: React.FC<CustomerReportProps> = ({ workflowData, options }) => {
  const { session, phase1, phase2, phase3, phase4 } = workflowData;  return (
    <Document>
      {/* Page 1: Executive Summary */}
      <Page size="LETTER" style={pdfStyles.page}>
        <ReportHeader workflowData={workflowData} options={options} />
        
        {options.includeSections.executiveSummary && (
          <View>
            <Text style={pdfStyles.sectionHeader}>Executive Summary</Text>
            <ServiceMetrics workflowData={workflowData} />
            
            <View style={pdfStyles.contentBlock}>
              <Text style={pdfStyles.paragraph}>
                {phase4.serviceSummary.executiveSummary || 
                 `Completed ${session.serviceTier} tier preventive maintenance service for ${phase1.customer.companyName}. System assessment performed with ${phase3.tasks.filter(t => t.status === 'Completed').length} maintenance tasks completed successfully.`}
              </Text>
            </View>

            <Text style={pdfStyles.sectionSubheader}>Key Findings</Text>
            <View style={pdfStyles.listContainer}>
              {(phase4.serviceSummary.keyFindings.length > 0 ? 
                phase4.serviceSummary.keyFindings : 
                ['System performance verified', 'Preventive maintenance completed', 'No critical issues identified']
              ).map((finding, index) => (
                <View key={index} style={pdfStyles.listItem}>
                  <Text style={pdfStyles.listBullet}>•</Text>
                  <Text style={pdfStyles.listText}>{finding}</Text>
                </View>
              ))}
            </View>

            <Text style={pdfStyles.sectionSubheader}>Value Delivered</Text>
            <View style={pdfStyles.listContainer}>
              {(phase4.serviceSummary.valueDelivered.length > 0 ? 
                phase4.serviceSummary.valueDelivered : 
                ['System reliability maintained', 'Performance optimized', 'Preventive maintenance completed']
              ).map((value, index) => (
                <View key={index} style={pdfStyles.listItem}>
                  <Text style={pdfStyles.listBullet}>•</Text>
                  <Text style={pdfStyles.listText}>{value}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        <ReportFooter pageNumber={1} confidentiality={options.confidentiality} />
      </Page>
      {/* Page 2: System Overview */}
      {options.includeSections.systemOverview && (
        <Page size="LETTER" style={pdfStyles.page}>
          <ReportHeader workflowData={workflowData} options={options} />
          
          <Text style={pdfStyles.sectionHeader}>System Overview</Text>
          
          <View style={pdfStyles.contentBlock}>
            <Text style={pdfStyles.sectionSubheader}>Building Management System</Text>
            <Text style={pdfStyles.paragraph}>
              Platform: {phase2.bmsSystem.platform || 'Not specified'}
            </Text>
            <Text style={pdfStyles.paragraph}>
              Software Version: {phase2.bmsSystem.softwareVersion || 'Not specified'}
            </Text>
            <Text style={pdfStyles.paragraph}>
              Service Tier: {session.serviceTier}
            </Text>
            <Text style={pdfStyles.paragraph}>
              Total Device Count: {phase2.manualInventory.totalDeviceCount || 'Not specified'}
            </Text>
          </View>

          <Text style={pdfStyles.sectionSubheader}>Service Contact Information</Text>
          <View style={pdfStyles.contentBlock}>
            {phase1.contacts.map((contact, index) => (
              <View key={index} style={{ marginBottom: 8 }}>
                <Text style={pdfStyles.paragraph}>
                  <Text style={{ fontWeight: 'bold' }}>{contact.name}</Text> - {contact.role}
                </Text>
                <Text style={pdfStyles.paragraph}>
                  Phone: {contact.phone} | Email: {contact.email}
                </Text>
              </View>
            ))}
          </View>

          <ReportFooter pageNumber={2} confidentiality={options.confidentiality} />
        </Page>
      )}
      {/* Page 3: Work Performed */}
      {options.includeSections.workPerformed && (
        <Page size="LETTER" style={pdfStyles.page}>
          <ReportHeader workflowData={workflowData} options={options} />
          
          <Text style={pdfStyles.sectionHeader}>Work Performed</Text>
          
          <Text style={pdfStyles.sectionSubheader}>Completed Tasks</Text>
          {options.includeDataTables ? (
            <TaskTable tasks={phase3.tasks.filter(t => t.status === 'Completed')} />
          ) : (
            <View style={pdfStyles.listContainer}>
              {phase3.tasks.filter(t => t.status === 'Completed').map((task, index) => (
                <View key={index} style={pdfStyles.listItem}>
                  <Text style={pdfStyles.listBullet}>•</Text>
                  <Text style={pdfStyles.listText}>{task.name}</Text>
                </View>
              ))}
            </View>
          )}

          <ReportFooter pageNumber={3} confidentiality={options.confidentiality} />
        </Page>
      )}

      {/* Page 4: Issues & Recommendations */}
      {(options.includeSections.issues || options.includeSections.recommendations) && (
        <Page size="LETTER" style={pdfStyles.page}>
          <ReportHeader workflowData={workflowData} options={options} />
          
          {phase3.issues.length > 0 && (
            <View>
              <Text style={pdfStyles.sectionHeader}>Issues Identified</Text>
              <IssuesTable issues={phase3.issues} />
            </View>
          )}

          {phase3.recommendations.length > 0 && (
            <View>
              <Text style={pdfStyles.sectionHeader}>Recommendations</Text>
              <RecommendationList recommendations={phase3.recommendations} />
            </View>
          )}

          <ReportFooter pageNumber={4} confidentiality={options.confidentiality} />
        </Page>
      )}
    </Document>
  );
};