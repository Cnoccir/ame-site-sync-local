// Export all PDF generation services and components
export { PMReportGenerator } from './PMReportGenerator';
export type { PDFGenerationResult, PDFGenerationOptions } from './PMReportGenerator';
export { pdfStyles, formatters, statusColors } from './pdfStyles';
export { CustomerReport } from './templates/CustomerReport';
export * from './reportComponents';

// Re-export types for convenience
export type { PDFGenerationOptions as ReportOptions } from './pdfStyles';