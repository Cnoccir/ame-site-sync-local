import React from 'react';
import { pdf } from '@react-pdf/renderer';
import { ProcessedTridiumData } from '@/services/TridiumExportProcessor';
import { TridiumReportDocument } from '@/components/reports/TridiumReportDocument';

// PDF Report Generation Service
export interface ReportConfig {
  template: 'executive' | 'technical' | 'comprehensive';
  sections: {
    executiveSummary: boolean;
    systemOverview: boolean;
    deviceInventory: boolean;
    performanceMetrics: boolean;
    recommendations: boolean;
    rawDataAppendix: boolean;
  };
  branding: {
    companyName: string;
    logo?: string;
    primaryColor: string;
    secondaryColor: string;
  };
  format: {
    pageSize: 'letter' | 'a4';
    margins: { top: number; right: number; bottom: number; left: number };
    orientation: 'portrait' | 'landscape';
  };
}

export class TridiumReportGenerator {
  private static defaultConfig: ReportConfig = {
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
      margins: { top: 72, right: 54, bottom: 72, left: 54 },
      orientation: 'portrait'
    }
  };

  static async generateReport(
    data: ProcessedTridiumData,
    config: Partial<ReportConfig> = {}
  ): Promise<Blob> {
    const finalConfig = { ...this.defaultConfig, ...config };

    try {
      // Create PDF document using @react-pdf/renderer
      const reportDocument = React.createElement(TridiumReportDocument, {
        data,
        config: finalConfig,
      });

      const blob = await pdf(reportDocument).toBlob();
      return blob;

    } catch (error) {
      console.error('PDF generation failed:', error);
      throw new Error(`PDF generation failed: ${error.message}`);
    }
  }

  // Helper method to generate a simple text-based report for fallback
  static generateTextReport(data: ProcessedTridiumData): string {
    const currentDate = new Date().toLocaleDateString();
    const onlineDevices = data.devices.filter(d => d.status === 'online').length;
    const totalDevices = data.devices.length;
    const deviceHealthScore = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

    return `
TRIDIUM SYSTEM ASSESSMENT REPORT
Generated on ${currentDate}

SYSTEM SUMMARY
Files Processed: ${data.processedFiles.length}
Total Devices: ${totalDevices}
Online Devices: ${onlineDevices} (${deviceHealthScore}%)
System Resources: ${data.resources.length}
Network Stations: ${data.networks.length}
Processing Errors: ${data.errors.length}

DEVICE STATUS BREAKDOWN
${['online', 'offline', 'alarm'].map(status => {
  const count = data.devices.filter(d => d.status === status).length;
  const percentage = totalDevices > 0 ? Math.round((count / totalDevices) * 100) : 0;
  return `${status.toUpperCase()}: ${count} (${percentage}%)`;
}).join('\n')}

NETWORK DISTRIBUTION
${[...new Set(data.devices.map(d => d.network))].map(network => {
  const networkDevices = data.devices.filter(d => d.network === network);
  const onlineCount = networkDevices.filter(d => d.status === 'online').length;
  return `${network}: ${networkDevices.length} devices (${onlineCount} online)`;
}).join('\n')}

RECOMMENDATIONS
${data.devices.filter(d => d.status === 'offline').length > 0 ?
  `• Address ${data.devices.filter(d => d.status === 'offline').length} offline devices` : ''}
${data.errors.length > 0 ?
  `• Review ${data.errors.length} processing errors` : ''}
• Schedule regular system maintenance
• Monitor system performance trends

Report prepared by AME Controls
    `.trim();
  }

  // Utility method to download blob as file
  static downloadReport(blob: Blob, filename: string = 'tridium-system-report.pdf') {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  // Method to get report preview data
  static getReportPreview(data: ProcessedTridiumData) {
    const onlineDevices = data.devices.filter(d => d.status === 'online').length;
    const totalDevices = data.devices.length;
    const deviceHealthScore = totalDevices > 0 ? Math.round((onlineDevices / totalDevices) * 100) : 0;

    return {
      summary: {
        filesProcessed: data.processedFiles.length,
        totalDevices,
        onlineDevices,
        deviceHealthScore,
        systemResources: data.resources.length,
        networkStations: data.networks.length,
        processingErrors: data.errors.length
      },
      recommendations: this.generateSimpleRecommendations(data),
      estimatedPages: this.estimatePageCount(data)
    };
  }

  private static generateSimpleRecommendations(data: ProcessedTridiumData): string[] {
    const recommendations: string[] = [];

    const offlineDevices = data.devices.filter(d => d.status === 'offline').length;
    if (offlineDevices > 0) {
      recommendations.push(`Address ${offlineDevices} offline devices`);
    }

    if (data.errors.length > 0) {
      recommendations.push(`Review ${data.errors.length} processing errors`);
    }

    const highCpuSystems = data.resources.filter(r => (r.cpuUsage || 0) > 70).length;
    if (highCpuSystems > 0) {
      recommendations.push(`Monitor ${highCpuSystems} systems with high CPU usage`);
    }

    recommendations.push('Schedule regular system maintenance');

    return recommendations;
  }

  private static estimatePageCount(data: ProcessedTridiumData): number {
    let pageCount = 1; // Cover page

    // Executive summary
    pageCount += 1;

    // Device inventory (depends on number of networks and devices)
    const networks = [...new Set(data.devices.map(d => d.network))].length;
    pageCount += Math.ceil(networks / 10) + 1; // Rough estimate

    // Recommendations
    pageCount += 1;

    // Raw data appendix (if many devices)
    if (data.devices.length > 50) {
      pageCount += Math.ceil(data.devices.length / 40); // ~40 devices per page
    }

    return Math.max(pageCount, 4); // Minimum 4 pages
  }
}