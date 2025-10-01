import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { ProcessedTridiumData } from '@/services/TridiumExportProcessor';
import { ReportConfig } from '@/services/TridiumReportGenerator';

const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 30,
  },
  section: {
    margin: 10,
    padding: 10,
    flexGrow: 1,
  },
  title: {
    fontSize: 24,
    textAlign: 'center',
    marginBottom: 30,
    color: '#1e40af',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 20,
    color: '#1e40af',
    fontWeight: 'bold',
  },
  header: {
    fontSize: 14,
    marginBottom: 10,
    color: '#1e40af',
    fontWeight: 'bold',
  },
  text: {
    fontSize: 11,
    lineHeight: 1.4,
    marginBottom: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    color: 'white',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 10,
  },
  tableRow: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    padding: 8,
    fontSize: 9,
  },
  tableCell: {
    flex: 1,
    padding: 2,
  },
  summary: {
    backgroundColor: '#f3f4f6',
    padding: 15,
    marginVertical: 10,
    borderRadius: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    fontSize: 10,
    color: '#64748b',
  },
});

interface TridiumReportDocumentProps {
  data: ProcessedTridiumData;
  config: ReportConfig;
}

export const TridiumReportDocument: React.FC<TridiumReportDocumentProps> = ({
  data,
  config,
}) => {
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const onlineDevices = data.devices.filter(d => d.status === 'online').length;
  const totalDevices = data.devices.length;
  const deviceHealthScore = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

  return (
    <Document>
      {/* Cover Page */}
      <Page size="LETTER" style={styles.page}>
        <View style={styles.section}>
          <Text style={styles.title}>TRIDIUM SYSTEM ASSESSMENT REPORT</Text>
          <Text style={[styles.text, { textAlign: 'center', marginTop: 40 }]}>
            Generated on {currentDate}
          </Text>

          <View style={[styles.summary, { marginTop: 60 }]}>
            <Text style={styles.header}>System Summary</Text>
            <Text style={styles.text}>Files Processed: {data.processedFiles.length}</Text>
            <Text style={styles.text}>Total Devices: {totalDevices}</Text>
            <Text style={styles.text}>Online Devices: {onlineDevices} ({deviceHealthScore}%)</Text>
            <Text style={styles.text}>System Resources: {data.resources.length}</Text>
            <Text style={styles.text}>Network Stations: {data.networks.length}</Text>
            <Text style={styles.text}>Processing Errors: {data.errors.length}</Text>
          </View>

          <Text style={[styles.text, { textAlign: 'center', marginTop: 60, fontWeight: 'bold' }]}>
            Prepared by {config.branding.companyName}
          </Text>
        </View>

        <Text style={styles.footer}>
          Tridium System Assessment Report - Page 1
        </Text>
      </Page>

      {/* Executive Summary */}
      {config.sections.executiveSummary && (
        <Page size="LETTER" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.subtitle}>Executive Summary</Text>

            <Text style={styles.text}>
              This report provides a comprehensive analysis of the Tridium Building Management System
              based on {data.processedFiles.length} export files processed on {currentDate}.
            </Text>

            <Text style={styles.header}>System Health Overview</Text>
            <View style={styles.summary}>
              <Text style={styles.text}>Overall System Health: {deviceHealthScore}%</Text>
              <Text style={styles.text}>• Device Health: {deviceHealthScore}%</Text>
              <Text style={styles.text}>• Performance Status: Good</Text>
              <Text style={styles.text}>• Data Quality: {data.errors.length === 0 ? 'Excellent' : 'Needs Review'}</Text>
            </View>

            <Text style={styles.header}>Key Findings</Text>
            <Text style={styles.text}>
              • System contains {totalDevices} total devices across {data.resources.length} system{data.resources.length !== 1 ? 's' : ''}
            </Text>
            <Text style={styles.text}>
              • {onlineDevices} devices ({deviceHealthScore}%) are currently online
            </Text>
            {data.devices.filter(d => d.status === 'offline').length > 0 && (
              <Text style={styles.text}>
                • {data.devices.filter(d => d.status === 'offline').length} devices require attention due to offline status
              </Text>
            )}

            {data.errors.length > 0 && (
              <Text style={styles.text}>
                • {data.errors.length} processing error{data.errors.length !== 1 ? 's' : ''} encountered requiring review
              </Text>
            )}
          </View>

          <Text style={styles.footer}>
            Tridium System Assessment Report - Page 2
          </Text>
        </Page>
      )}

      {/* Device Inventory */}
      {config.sections.deviceInventory && (
        <Page size="LETTER" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.subtitle}>Device Inventory Analysis</Text>

            <Text style={styles.header}>Device Status Summary</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Status</Text>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Count</Text>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Percentage</Text>
            </View>

            {['online', 'offline', 'alarm'].map(status => {
              const count = data.devices.filter(d => d.status === status).length;
              const percentage = totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0;

              return count > 0 ? (
                <View key={status} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{status.toUpperCase()}</Text>
                  <Text style={styles.tableCell}>{count}</Text>
                  <Text style={styles.tableCell}>{percentage}%</Text>
                </View>
              ) : null;
            })}

            <Text style={[styles.header, { marginTop: 30 }]}>Network Distribution</Text>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Network</Text>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Devices</Text>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Online</Text>
              <Text style={[styles.tableCell, { fontWeight: 'bold' }]}>Offline</Text>
            </View>

            {[...new Set(data.devices.map(d => d.network))].map(network => {
              const networkDevices = data.devices.filter(d => d.network === network);
              const onlineCount = networkDevices.filter(d => d.status === 'online').length;
              const offlineCount = networkDevices.filter(d => d.status === 'offline').length;

              return (
                <View key={network} style={styles.tableRow}>
                  <Text style={styles.tableCell}>{network}</Text>
                  <Text style={styles.tableCell}>{networkDevices.length}</Text>
                  <Text style={styles.tableCell}>{onlineCount}</Text>
                  <Text style={styles.tableCell}>{offlineCount}</Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.footer}>
            Tridium System Assessment Report - Page 3
          </Text>
        </Page>
      )}

      {/* Recommendations */}
      {config.sections.recommendations && (
        <Page size="LETTER" style={styles.page}>
          <View style={styles.section}>
            <Text style={styles.subtitle}>Recommendations & Next Steps</Text>

            {data.devices.filter(d => d.status === 'offline').length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.header}>HIGH PRIORITY: Address Offline Devices</Text>
                <Text style={styles.text}>
                  {data.devices.filter(d => d.status === 'offline').length} devices are currently offline.
                  Investigate network connectivity, power issues, or device failures.
                </Text>
              </View>
            )}

            {data.resources.some(r => (r.cpuUsage || 0) > 70) && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.header}>MEDIUM PRIORITY: Monitor System Performance</Text>
                <Text style={styles.text}>
                  Some systems showing elevated CPU usage. Consider reviewing control logic
                  efficiency and reducing unnecessary processing loads.
                </Text>
              </View>
            )}

            <View style={{ marginBottom: 20 }}>
              <Text style={styles.header}>ONGOING: Regular System Maintenance</Text>
              <Text style={styles.text}>
                Schedule quarterly system health checks including backup verification,
                performance monitoring, and device communication testing to maintain optimal system operation.
              </Text>
            </View>

            {data.errors.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.header}>DATA QUALITY: Review Processing Errors</Text>
                <Text style={styles.text}>
                  {data.errors.length} processing errors were encountered. Review source data
                  and export formats to ensure complete system analysis.
                </Text>
              </View>
            )}
          </View>

          <Text style={styles.footer}>
            Tridium System Assessment Report - Page 4
          </Text>
        </Page>
      )}
    </Document>
  );
};