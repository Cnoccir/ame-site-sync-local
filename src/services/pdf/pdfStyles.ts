import { Document, Page, Text, View, StyleSheet, PDFDownloadLink, pdf } from '@react-pdf/renderer';
import { PMWorkflowData } from '@/types/pmWorkflow';

// Professional AME Controls styling for 8.5×11 reports
export const pdfStyles = StyleSheet.create({
  // Page Layout (8.5×11 with proper margins)
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 50, // 0.7 inches all around
    fontSize: 10,
    fontFamily: 'Helvetica',
    lineHeight: 1.4,
  },

  // Header & Branding
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomWidth: 2,
    borderBottomColor: '#1e40af', // Professional blue
  },
  
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e40af',
  },
  
  reportTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#374151',
  },
  
  reportSubtitle: {
    fontSize: 10,
    color: '#6b7280',
  },

  // Section Headers
  sectionHeader: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e40af',
    marginTop: 20,
    marginBottom: 10,
    paddingBottom: 5,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },

  sectionSubheader: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#374151',
    marginTop: 15,
    marginBottom: 8,
  },

  // Content Layout
  contentBlock: {
    marginBottom: 15,
  },

  paragraph: {
    fontSize: 10,
    lineHeight: 1.4,
    marginBottom: 8,
    color: '#374151',
  },

  // Tables
  table: {
    display: 'flex',
    width: 'auto',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    marginBottom: 15,
  },
  
  tableRow: {
    margin: 'auto',
    flexDirection: 'row',
  },
  
  tableColHeader: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    backgroundColor: '#f3f4f6',
    padding: 8,
  },
  
  tableCol: {
    width: '25%',
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#d1d5db',
    padding: 8,
  },
  
  tableCellHeader: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#374151',
  },
  
  tableCell: {
    fontSize: 9,
    color: '#374151',
  },

  // Lists
  listContainer: {
    marginBottom: 10,
  },

  listItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 4,
  },

  listBullet: {
    fontSize: 8,
    color: '#1e40af',
    marginRight: 8,
    marginTop: 2,
  },

  listText: {
    fontSize: 10,
    color: '#374151',
    flex: 1,
  },

  // Status Indicators
  statusGreen: {
    color: '#059669',
    fontWeight: 'bold',
  },

  statusRed: {
    color: '#dc2626',
    fontWeight: 'bold',
  },

  statusYellow: {
    color: '#d97706',
    fontWeight: 'bold',
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    paddingTop: 10,
  },

  // Metrics Cards
  metricsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },

  metricCard: {
    backgroundColor: '#f8fafc',
    border: '1 solid #e2e8f0',
    borderRadius: 4,
    padding: 12,
    width: '23%',
    alignItems: 'center',
  },

  metricValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 2,
  },

  metricLabel: {
    fontSize: 8,
    color: '#64748b',
    textAlign: 'center',
  },

  // Badges
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },

  badge: {
    backgroundColor: '#eff6ff',
    color: '#1e40af',
    fontSize: 8,
    fontWeight: 'bold',
    padding: 4,
    borderRadius: 3,
    marginRight: 8,
  },

  badgeGreen: {
    backgroundColor: '#f0fdf4',
    color: '#166534',
  },

  badgeRed: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
  },

  badgeYellow: {
    backgroundColor: '#fffbeb',
    color: '#d97706',
  },
});

// Utility functions for data formatting
export const formatters = {
  date: (date: Date): string => {
    return new Intl.DateFormat('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  },

  time: (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  },

  duration: (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  },

  percentage: (value: number): string => {
    return `${Math.round(value)}%`;
  },
};

// Color utilities for status indicators
export const statusColors = {
  success: '#059669',
  warning: '#d97706', 
  danger: '#dc2626',
  info: '#1e40af',
  muted: '#6b7280',
};

export interface PDFGenerationOptions {
  template: 'Customer' | 'Technical' | 'Executive';
  includeSections: {
    executiveSummary: boolean;
    systemOverview: boolean;
    workPerformed: boolean;
    issues: boolean;
    recommendations: boolean;
    appendix: boolean;
  };
  includePhotos: boolean;
  includeCharts: boolean;
  includeDataTables: boolean;
  brandingLevel: 'Full' | 'Minimal' | 'None';
  confidentiality: 'Public' | 'Confidential' | 'Restricted';
}