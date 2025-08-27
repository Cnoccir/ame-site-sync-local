import { TridiumDataset, TridiumDataRow, TridiumDataCategory, TridiumFormatSpec } from '@/types/tridium';
import { TridiumBaseParser, ParseResult } from '../baseParser';
import { logger } from '@/utils/logger';

/**
 * Parser for Niagara Network export (Supervisor NiagaraNet CSV)
 * Builds a dataset suitable for network topology construction.
 */
export class NiagaraNetExportParser extends TridiumBaseParser {
  getDataCategory(): TridiumDataCategory {
    return 'networkTopology';
  }

  async parse(
    content: string,
    filename: string,
    formatSpec: TridiumFormatSpec
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      logger.info('Starting Niagara Network Export parsing', { filename });

      // Validate content
      const validationErrors = this.validateContent(content, filename);
      if (validationErrors.length > 0) {
        return this.createErrorResult(validationErrors, warnings, Date.now() - startTime);
      }

      // Parse CSV content
      const { headers, rows: rawRows } = this.parseCSVContent(content);

      // Validate required columns (allow presence in any order)
      const required = ['Name', 'Type', 'Address', 'Status'];
      const missing = required.filter(c => !headers.includes(c));
      if (missing.length > 0) {
        return this.createErrorResult([
          `Invalid Niagara Network Export: missing required columns: ${missing.join(', ')}`
        ], warnings, Date.now() - startTime);
      }

      // Create columns
      const columns = this.createColumns(headers, formatSpec);

      // Parse rows and attach parsed status for both Station Status and Platform Status if present
      const rows: TridiumDataRow[] = rawRows.map((rawRow, index) => {
        const rowData: Record<string, any> = {};
        headers.forEach((header, i) => {
          const value = rawRow[i] ?? '';
          // Redact sensitive fields
          if (/password/i.test(header)) {
            rowData[header] = '--redacted--';
          } else {
            rowData[header] = value;
          }
        });

        const row: TridiumDataRow = {
          id: `niagara-${index}`,
          selected: false,
          data: rowData
        };

        // Primary station status
        if (rowData.Status !== undefined) {
          row.parsedStatus = this.parseStatus(String(rowData.Status));
        }

        // Secondary platform status (stored in metadata fields)
        if (rowData['Platform Status'] !== undefined) {
          row.data.platformParsedStatus = this.parseStatus(String(rowData['Platform Status']));
        }

        // Normalize/annotate useful metadata
        row.data.nodeKind = this.inferNodeKind(rowData);
        row.data.ip = this.extractIPFromAddress(rowData.Address);
        row.data.clientConnected = this.normalizeConn(rowData['Client Conn']);
        row.data.serverConnected = this.normalizeConn(rowData['Server Conn']);

        return row;
      });

      // Generate summary
      const summary = this.generateNiagaraSummary(rows);

      // Create dataset
      const dataset: TridiumDataset = {
        id: `niagara-${Date.now()}`,
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
          confidence: 90
        },
        rawContent: content
      };

      logger.info('Niagara Network Export parsing completed', {
        filename,
        rowCount: rows.length,
        processingTime: Date.now() - startTime
      });

      return this.createSuccessResult(dataset, warnings, Date.now() - startTime);

    } catch (error) {
      logger.error('Niagara Network Export parsing failed', { filename, error });
      return this.createErrorResult([
        `Niagara Network Export parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ], warnings, Date.now() - startTime);
    }
  }

  private normalizeConn(value: any): 'Connected' | 'Not connected' | 'Unknown' {
    const v = String(value || '').toLowerCase();
    if (v.includes('connected') && !v.includes('not')) return 'Connected';
    if (v.includes('not connected')) return 'Not connected';
    return 'Unknown';
  }

  private extractIPFromAddress(address: string): string | null {
    if (!address) return null;
    const match = String(address).match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/);
    return match ? match[0] : null;
  }

  private inferNodeKind(data: Record<string, any>): 'supervisor' | 'jace' | 'station' {
    const hostModel = (data['Host Model'] || '').toString().toLowerCase();
    const type = (data['Type'] || '').toString().toLowerCase();
    const name = (data['Name'] || '').toString().toLowerCase();

    if (type.includes('niagara') && (name.includes('supervisor') || hostModel.includes('workstation'))) {
      return 'supervisor';
    }
    return 'jace';
  }

  private generateNiagaraSummary(rows: TridiumDataRow[]) {
    // Reuse base summary and then enrich with connection/platform info
    const formatSpec: TridiumFormatSpec = {
      format: 'NiagaraNetExport',
      displayName: 'Niagara Network Export',
      description: '',
      fileTypes: ['.csv'],
      requiredColumns: [],
      optionalColumns: [],
      identifierColumns: [],
      keyColumn: 'Name',
      statusColumn: 'Status'
    } as any;

    const summary = this.generateSummary(rows, formatSpec, 'networkTopology');

    const conn = { clientConnected: 0, clientNotConnected: 0, serverConnected: 0, serverNotConnected: 0 };
    const platform = { ok: 0, down: 0, fault: 0, alarm: 0, unknown: 0 };

    rows.forEach(r => {
      if (r.data.clientConnected === 'Connected') conn.clientConnected++; else if (r.data.clientConnected === 'Not connected') conn.clientNotConnected++;
      if (r.data.serverConnected === 'Connected') conn.serverConnected++; else if (r.data.serverConnected === 'Not connected') conn.serverNotConnected++;

      const p = r.data.platformParsedStatus?.status as ('ok' | 'down' | 'fault' | 'alarm' | 'unknown') | undefined;
      if (p) platform[p]++;
    });

    // Append summary details
    summary.recommendations.push(
      `${conn.clientNotConnected} stations not connected on client side`,
      `${conn.serverNotConnected} stations not connected on server side`
    );

    return summary;
  }
}

