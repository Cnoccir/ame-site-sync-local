import { TridiumDataset, TridiumDataRow, TridiumDataCategory, TridiumFormatSpec } from '@/types/tridium';
import { TridiumBaseParser, ParseResult } from '../baseParser';
import { logger } from '@/utils/logger';

/**
 * Parser for N2 Network device exports
 */
export class N2ExportParser extends TridiumBaseParser {
  getDataCategory(): TridiumDataCategory {
    return 'networkDevices';
  }

  async parse(
    content: string,
    filename: string,
    formatSpec: TridiumFormatSpec
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      logger.info('Starting N2 Export parsing', { filename });

      const validationErrors = this.validateContent(content, filename);
      if (validationErrors.length > 0) {
        return this.createErrorResult(validationErrors, warnings, Date.now() - startTime);
      }

      const { headers, rows: rawRows } = this.parseCSVContent(content);

      const required = ['Name', 'Status', 'Address', 'Controller Type'];
      const missing = required.filter(c => !headers.includes(c));
      if (missing.length > 0) {
        return this.createErrorResult([
          `Invalid N2 Export: missing required columns: ${missing.join(', ')}`
        ], warnings, Date.now() - startTime);
      }

      const columns = this.createColumns(headers, formatSpec);

      const rows: TridiumDataRow[] = rawRows.map((rawRow, index) => {
        const rowData: Record<string, any> = {};
        headers.forEach((header, i) => {
          rowData[header] = rawRow[i] ?? '';
        });

        const row: TridiumDataRow = {
          id: `n2-${index}`,
          selected: false,
          data: rowData
        };

        if (rowData.Status !== undefined) {
          row.parsedStatus = this.parseStatus(String(rowData.Status));
        }

        return row;
      });

      const summary = this.generateSummary(rows, formatSpec, this.getDataCategory());

      const dataset: TridiumDataset = {
        id: `n2-${Date.now()}`,
        filename,
        format: formatSpec.format,
        category: this.getDataCategory(),
        columns,
        rows,
        summary,
        formatSpec,
        metadata: {
          totalRows: rows.length,
          totalColumns: columns.length,
          parseErrors: [],
          parseWarnings: warnings,
          uploadedAt: new Date(),
          fileSize: content.length,
          processingTime: Date.now() - startTime,
          isValid: true,
          confidence: 85
        },
        rawContent: content
      };

      logger.info('N2 Export parsing completed', { filename, rowCount: rows.length });
      return this.createSuccessResult(dataset, warnings, Date.now() - startTime);

    } catch (error) {
      logger.error('N2 Export parsing failed', { filename, error });
      return this.createErrorResult([
        `N2 Export parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ], warnings, Date.now() - startTime);
    }
  }
}

