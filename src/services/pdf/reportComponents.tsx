import React from 'react';
import { Document, Page, Text, View, Image } from '@react-pdf/renderer';
import { PMWorkflowData } from '@/types/pmWorkflow';
import { pdfStyles, formatters, statusColors, PDFGenerationOptions } from './pdfStyles';

interface ReportHeaderProps {
  workflowData: PMWorkflowData;
  options: PDFGenerationOptions;
}

export const ReportHeader: React.FC<ReportHeaderProps> = ({ workflowData, options }) => {
  const { session, phase1 } = workflowData;
  const showBranding = options.brandingLevel !== 'None';

  return (
    <View style={pdfStyles.header}>
      <View>
        {showBranding && (
          <Text style={pdfStyles.companyName}>AME CONTROLS</Text>
        )}
        <Text style={pdfStyles.reportTitle}>
          {options.template === 'Executive' ? 'Executive Summary Report' :
           options.template === 'Technical' ? 'Technical Service Report' :
           'Preventive Maintenance Report'}
        </Text>
        <Text style={pdfStyles.reportSubtitle}>
          {phase1.customer.companyName} - {phase1.customer.siteName}
        </Text>
      </View>
      <View>
        <Text style={pdfStyles.reportSubtitle}>
          Service Date: {formatters.date(session.startTime)}
        </Text>
        <Text style={pdfStyles.reportSubtitle}>
          Service Tier: {session.serviceTier}
        </Text>
        <Text style={pdfStyles.reportSubtitle}>
          Technician: {session.technicianName}
        </Text>
      </View>
    </View>
  );
};

interface ReportFooterProps {
  pageNumber?: number;
  confidentiality: string;
}

export const ReportFooter: React.FC<ReportFooterProps> = ({ pageNumber, confidentiality }) => {
  return (
    <View style={pdfStyles.footer}>
      <Text>
        {confidentiality && `${confidentiality.toUpperCase()} - `}
        AME Controls Preventive Maintenance Report | Generated: {formatters.date(new Date())}
        {pageNumber && ` | Page ${pageNumber}`}
      </Text>
    </View>
  );
};

interface ServiceMetricsProps {
  workflowData: PMWorkflowData;
}

export const ServiceMetrics: React.FC<ServiceMetricsProps> = ({ workflowData }) => {
  const { phase3 } = workflowData;
  const completedTasks = phase3.tasks.filter(t => t.status === 'Completed').length;
  const totalTime = phase3.tasks.reduce((acc, task) => acc + (task.actualDuration || 0), 0);
  
  return (
    <View style={pdfStyles.metricsContainer}>
      <View style={pdfStyles.metricCard}>
        <Text style={pdfStyles.metricValue}>{completedTasks}</Text>
        <Text style={pdfStyles.metricLabel}>Tasks Completed</Text>
      </View>
      <View style={pdfStyles.metricCard}>
        <Text style={pdfStyles.metricValue}>{phase3.issues.length}</Text>
        <Text style={pdfStyles.metricLabel}>Issues Found</Text>
      </View>
      <View style={pdfStyles.metricCard}>
        <Text style={pdfStyles.metricValue}>{phase3.recommendations.length}</Text>
        <Text style={pdfStyles.metricLabel}>Recommendations</Text>
      </View>
      <View style={pdfStyles.metricCard}>
        <Text style={pdfStyles.metricValue}>{formatters.duration(totalTime)}</Text>
        <Text style={pdfStyles.metricLabel}>Time On Site</Text>
      </View>
    </View>
  );
};

interface TaskTableProps {
  tasks: any[];
}

export const TaskTable: React.FC<TaskTableProps> = ({ tasks }) => {
  if (tasks.length === 0) return null;

  return (
    <View style={pdfStyles.table}>
      <View style={pdfStyles.tableRow}>
        <View style={pdfStyles.tableColHeader}>
          <Text style={pdfStyles.tableCellHeader}>Task</Text>
        </View>
        <View style={pdfStyles.tableColHeader}>
          <Text style={pdfStyles.tableCellHeader}>Status</Text>
        </View>
        <View style={pdfStyles.tableColHeader}>
          <Text style={pdfStyles.tableCellHeader}>Duration</Text>
        </View>
        <View style={pdfStyles.tableColHeader}>
          <Text style={pdfStyles.tableCellHeader}>Findings</Text>
        </View>
      </View>
      
      {tasks.slice(0, 15).map((task, index) => ( // Limit to prevent page overflow
        <View style={pdfStyles.tableRow} key={index}>
          <View style={pdfStyles.tableCol}>
            <Text style={pdfStyles.tableCell}>{task.name}</Text>
          </View>
          <View style={pdfStyles.tableCol}>
            <Text style={[
              pdfStyles.tableCell,
              task.status === 'Completed' ? pdfStyles.statusGreen : 
              task.status === 'In Progress' ? pdfStyles.statusYellow : pdfStyles.statusRed
            ]}>
              {task.status}
            </Text>
          </View>
          <View style={pdfStyles.tableCol}>
            <Text style={pdfStyles.tableCell}>
              {task.actualDuration ? formatters.duration(task.actualDuration) : '-'}
            </Text>
          </View>
          <View style={pdfStyles.tableCol}>
            <Text style={pdfStyles.tableCell}>
              {task.findings ? task.findings.substring(0, 50) + '...' : 'No findings'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

interface IssuesTableProps {
  issues: any[];
}

export const IssuesTable: React.FC<IssuesTableProps> = ({ issues }) => {
  if (issues.length === 0) {
    return (
      <View style={pdfStyles.contentBlock}>
        <Text style={pdfStyles.paragraph}>No issues were identified during this service visit.</Text>
      </View>
    );
  }

  return (
    <View style={pdfStyles.table}>
      <View style={pdfStyles.tableRow}>
        <View style={pdfStyles.tableColHeader}>
          <Text style={pdfStyles.tableCellHeader}>Issue</Text>
        </View>
        <View style={pdfStyles.tableColHeader}>
          <Text style={pdfStyles.tableCellHeader}>Severity</Text>
        </View>
        <View style={pdfStyles.tableColHeader}>
          <Text style={pdfStyles.tableCellHeader}>Status</Text>
        </View>
        <View style={pdfStyles.tableColHeader}>
          <Text style={pdfStyles.tableCellHeader}>Action Taken</Text>
        </View>
      </View>
      
      {issues.slice(0, 10).map((issue, index) => (
        <View style={pdfStyles.tableRow} key={index}>
          <View style={pdfStyles.tableCol}>
            <Text style={pdfStyles.tableCell}>{issue.title}</Text>
          </View>
          <View style={pdfStyles.tableCol}>
            <Text style={[
              pdfStyles.tableCell,
              issue.severity === 'Critical' ? pdfStyles.statusRed :
              issue.severity === 'High' ? pdfStyles.statusYellow : pdfStyles.statusGreen
            ]}>
              {issue.severity}
            </Text>
          </View>
          <View style={pdfStyles.tableCol}>
            <Text style={pdfStyles.tableCell}>{issue.status}</Text>
          </View>
          <View style={pdfStyles.tableCol}>
            <Text style={pdfStyles.tableCell}>
              {issue.immediateAction ? issue.immediateAction.substring(0, 40) + '...' : 'See notes'}
            </Text>
          </View>
        </View>
      ))}
    </View>
  );
};

interface RecommendationListProps {
  recommendations: any[];
}

export const RecommendationList: React.FC<RecommendationListProps> = ({ recommendations }) => {
  if (recommendations.length === 0) {
    return (
      <View style={pdfStyles.contentBlock}>
        <Text style={pdfStyles.paragraph}>No additional recommendations at this time.</Text>
      </View>
    );
  }

  return (
    <View style={pdfStyles.listContainer}>
      {recommendations.slice(0, 8).map((rec, index) => (
        <View key={index} style={pdfStyles.contentBlock}>
          <View style={pdfStyles.badgeContainer}>
            <View style={[
              pdfStyles.badge,
              rec.priority === 'High' ? pdfStyles.badgeRed :
              rec.priority === 'Medium' ? pdfStyles.badgeYellow : pdfStyles.badgeGreen
            ]}>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{rec.priority}</Text>
            </View>
            <View style={[
              pdfStyles.badge,
              rec.type === 'Immediate' ? pdfStyles.badgeRed :
              rec.type === 'Short Term' ? pdfStyles.badgeYellow : pdfStyles.badge
            ]}>
              <Text style={{ fontSize: 8, fontWeight: 'bold' }}>{rec.type}</Text>
            </View>
          </View>
          
          <Text style={[pdfStyles.paragraph, { fontWeight: 'bold', marginBottom: 4 }]}>
            {rec.title}
          </Text>
          <Text style={pdfStyles.paragraph}>
            {rec.description}
          </Text>
          {rec.justification && (
            <Text style={[pdfStyles.paragraph, { fontSize: 9, color: '#64748b' }]}>
              Justification: {rec.justification}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
};