import { TridiumDataset, TridiumDataRow, TridiumDataCategory, TridiumFormatSpec } from '@/types/tridium';
import { TridiumBaseParser, ParseResult } from '../baseParser';
import { logger } from '@/utils/logger';

/**
 * Parser for Platform Details text exports (.txt)
 * Extracts platform/system information into a single-row dataset.
 */
export class PlatformDetailsParser extends TridiumBaseParser {
  getDataCategory(): TridiumDataCategory {
    return 'platformInfo';
  }

  async parse(
    content: string,
    filename: string,
    _formatSpec: TridiumFormatSpec
  ): Promise<ParseResult> {
    const startTime = Date.now();
    const warnings: string[] = [];

    try {
      logger.info('Starting Platform Details parsing', { filename });

      const validationErrors = this.validateContent(content, filename);
      if (validationErrors.length > 0) {
        return this.createErrorResult(validationErrors, warnings, Date.now() - startTime);
      }

      // Tokenize by lines and extract key-value pairs & lists
      const lines = content.split(/\r?\n/);
      const data: Record<string, any> = {};
      const modules: string[] = [];
      const applications: string[] = [];

      let currentSection: 'modules' | 'applications' | null = null;

      for (let rawLine of lines) {
        const line = rawLine.trim();
        if (!line) continue;

        // Section detection
        if (/^modules:?/i.test(line)) { currentSection = 'modules'; continue; }
        if (/^applications:?/i.test(line)) { currentSection = 'applications'; continue; }

        // List parsing for sections
        if (currentSection === 'modules') {
          const mod = line.replace(/^[-•]\s*/, '');
          if (mod) { modules.push(mod); continue; }
        }
        if (currentSection === 'applications') {
          const app = line.replace(/^[-•]\s*/, '');
          if (app) { applications.push(app); continue; }
        }

        // Key: value pairs
        const kv = line.match(/^([^:]+):\s*(.*)$/);
        if (kv) {
          const key = kv[1].trim();
          const value = kv[2].trim();
          data[key] = value;
        }
      }

      // Compose columns dynamically from collected keys
      const headers = [
        'Platform',
        'Station Name',
        'License Type',
        'Version',
        'Modules',
        'Applications'
      ];

      const columns = this.createColumns(headers, {
        format: 'PlatformDetails',
        displayName: 'Platform Details',
        description: '',
        fileTypes: ['.txt'],
        requiredColumns: [],
        optionalColumns: [],
        identifierColumns: [],
        keyColumn: 'Station Name'
      } as any);

      const rowData: Record<string, any> = {
        'Platform': data['Platform'] || data['Platform Summary'] || data['Niagara Runtime'] || '',
        'Station Name': data['Station Name'] || data['Station'] || '',
        'License Type': data['License Type'] || data['License'] || '',
        'Version': data['version.niagara'] || data['Niagara Runtime'] || data['Niagara Version'] || '',
        'Modules': modules.join(', '),
        'Applications': applications.join(', ')
      };

      const rows: TridiumDataRow[] = [{
        id: 'platform-0',
        selected: false,
        data: rowData
      }];

      const summary = this.generateSummary(rows, {
        format: 'PlatformDetails',
        displayName: 'Platform Details',
        description: '',
        fileTypes: ['.txt'],
        requiredColumns: [],
        optionalColumns: [],
        identifierColumns: [],
        keyColumn: 'Station Name'
      } as any, 'platformInfo');

      const dataset: TridiumDataset = {
        id: `platform-${Date.now()}`,
        filename,
        format: 'PlatformDetails',
        category: this.getDataCategory(),
        columns,
        rows,
        summary,
        formatSpec: {
          format: 'PlatformDetails',
          displayName: 'Platform Details',
          description: '',
          fileTypes: ['.txt'],
          requiredColumns: [],
          optionalColumns: [],
          identifierColumns: [],
          keyColumn: 'Station Name'
        },
        metadata: {
          totalRows: rows.length,
          totalColumns: columns.length,
          parseErrors: [],
          parseWarnings: warnings,
          uploadedAt: new Date(),
          fileSize: content.length,
          processingTime: Date.now() - startTime,
          isValid: true,
          confidence: 80
        },
        rawContent: content
      };

      logger.info('Platform Details parsing completed', { filename });
      return this.createSuccessResult(dataset, warnings, Date.now() - startTime);

    } catch (error) {
      logger.error('Platform Details parsing failed', { filename, error });
      return this.createErrorResult([
        `Platform Details parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      ], warnings, Date.now() - startTime);
    }
  }
}

