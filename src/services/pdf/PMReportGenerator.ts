import { pdf } from '@react-pdf/renderer';
import { PMWorkflowData } from '@/types/pmWorkflow';
import { PDFGenerationOptions } from './pdfStyles';
import { CustomerReport } from './templates/CustomerReport';
import { logger } from '@/utils/logger';

export interface PDFGenerationResult {
  success: boolean;
  blob?: Blob;
  url?: string;
  error?: string;
  stats: {
    generationTime: number;
    fileSize?: number;
    pageCount?: number;
  };
}

export class PMReportGenerator {
  /**
   * Generate PDF report based on workflow data and options
   */
  static async generateReport(
    workflowData: PMWorkflowData,
    options: PDFGenerationOptions
  ): Promise<PDFGenerationResult> {
    const startTime = performance.now();
    
    try {
      logger.info(`Generating ${options.template} PDF report...`);
      
      // Select the appropriate template
      const ReportComponent = this.getReportTemplate(options.template);
      
      if (!ReportComponent) {
        throw new Error(`Unsupported report template: ${options.template}`);
      }

      // Generate PDF blob
      const blob = await pdf(
        ReportComponent({ workflowData, options })
      ).toBlob();

      // Create object URL for download/preview
      const url = URL.createObjectURL(blob);
      
      const generationTime = performance.now() - startTime;
      
      logger.info(`PDF generated successfully in ${generationTime.toFixed(0)}ms`);
      
      return {
        success: true,
        blob,
        url,
        stats: {
          generationTime,
          fileSize: blob.size,
          pageCount: this.estimatePageCount(workflowData, options)
        }
      };
      
    } catch (error) {
      const generationTime = performance.now() - startTime;
      logger.error('PDF generation failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        stats: {
          generationTime
        }
      };
    }
  }

  /**
   * Download generated PDF report
   */
  static downloadReport(
    blob: Blob,
    filename: string,
    workflowData: PMWorkflowData
  ): void {
    try {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = this.generateFilename(filename, workflowData);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      logger.info(`PDF downloaded: ${link.download}`);
    } catch (error) {
      logger.error('PDF download failed:', error);
      throw error;
    }
  }

  /**
   * Generate standardized filename for reports
   */
  static generateFilename(
    customName: string | undefined,
    workflowData: PMWorkflowData
  ): string {
    if (customName) return customName;
    
    const { session, phase1 } = workflowData;
    const date = session.startTime.toISOString().split('T')[0]; // YYYY-MM-DD
    const siteName = phase1.customer.siteName.replace(/[^a-zA-Z0-9]/g, '_');
    const serviceTier = session.serviceTier;
    
    return `PM_Report_${siteName}_${serviceTier}_${date}.pdf`;
  }

  /**
   * Get the appropriate report template component
   */
  private static getReportTemplate(template: string) {
    switch (template) {
      case 'Customer':
        return CustomerReport;
      case 'Technical':
        // TODO: Implement TechnicalReport
        return CustomerReport; // Fallback for now
      case 'Executive':
        // TODO: Implement ExecutiveReport  
        return CustomerReport; // Fallback for now
      default:
        return null;
    }
  }

  /**
   * Estimate page count based on content
   */
  private static estimatePageCount(
    workflowData: PMWorkflowData,
    options: PDFGenerationOptions
  ): number {
    let pageCount = 1; // Executive summary page
    
    if (options.includeSections.systemOverview) pageCount += 1;
    if (options.includeSections.workPerformed) pageCount += 1;
    
    // Issues and recommendations can share a page if both are small
    if (options.includeSections.issues && workflowData.phase3.issues.length > 5) pageCount += 1;
    if (options.includeSections.recommendations && workflowData.phase3.recommendations.length > 5) pageCount += 1;
    else if (options.includeSections.issues || options.includeSections.recommendations) pageCount += 1;
    
    if (options.includeSections.appendix) pageCount += 1;
    
    // Add pages for photos if included
    if (options.includePhotos && workflowData.phase2.photos.length > 0) {
      pageCount += Math.ceil(workflowData.phase2.photos.length / 4); // 4 photos per page
    }
    
    return Math.min(pageCount, 12); // Cap at reasonable maximum
  }

  /**
   * Validate workflow data for PDF generation
   */
  static validateWorkflowData(workflowData: PMWorkflowData): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields validation
    if (!workflowData.phase1.customer.companyName) {
      errors.push('Customer company name is required');
    }

    if (!workflowData.phase1.customer.siteName) {
      errors.push('Site name is required');
    }

    if (!workflowData.session.technicianName) {
      warnings.push('Technician name is not specified');
    }

    if (workflowData.phase3.tasks.length === 0) {
      warnings.push('No tasks were performed during this visit');
    }

    if (workflowData.phase3.tasks.filter(t => t.status === 'Completed').length === 0) {
      warnings.push('No tasks were completed during this visit');
    }

    if (!workflowData.phase4.serviceSummary.executiveSummary) {
      warnings.push('Executive summary is empty');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  /**
   * Clean up object URLs to prevent memory leaks
   */
  static cleanup(url: string): void {
    URL.revokeObjectURL(url);
  }
}

// Export default instance
export default PMReportGenerator;