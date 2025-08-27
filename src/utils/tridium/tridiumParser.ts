import { TridiumExportFormat, TridiumDataset } from '@/types/tridium';
import { TridiumFormatDetector, FormatDetectionResult } from './formatDetector';
import { getFormatSpec } from './formatSpecs';
import { TridiumBaseParser, ParseResult } from './baseParser';
import { ResourceExportParser } from './parsers/resourceExportParser';
import { NiagaraNetExportParser } from './parsers/niagaraNetExportParser';
import { PlatformDetailsParser } from './parsers/platformDetailsParser';
import { logger } from '@/utils/logger';

// TODO: Import other parsers as they are implemented
import { N2ExportParser } from './parsers/n2ExportParser';
import { BACnetExportParser } from './parsers/bacnetExportParser';
// import { NiagaraNetExportParser } from './parsers/niagaraNetExportParser';  
// import { PlatformDetailsParser } from './parsers/platformDetailsParser';

export interface TridiumParseOptions {
  userFormatHint?: TridiumExportFormat;
  maxFileSize?: number;
  maxRows?: number;
  strictValidation?: boolean;
}

export interface TridiumParseResult {
  success: boolean;
  dataset?: TridiumDataset;
  errors: string[];
  warnings: string[];
  formatDetection: FormatDetectionResult;
  processingTime: number;
}

/**
 * Main Tridium parser - orchestrates format detection and parsing
 */
export class TridiumParser {
  private static parsers: Map<TridiumExportFormat, TridiumBaseParser> = new Map();

  /**
   * Initialize parsers
   */
  private static initializeParsers(): void {
    if (this.parsers.size === 0) {
      // Initialize available parsers
      this.parsers.set('ResourceExport', new ResourceExportParser());
      this.parsers.set('NiagaraNetExport', new NiagaraNetExportParser());
      this.parsers.set('PlatformDetails', new PlatformDetailsParser());
      
      // TODO: Add other parsers as they are implemented
      this.parsers.set('N2Export', new N2ExportParser());
      this.parsers.set('BACnetExport', new BACnetExportParser());
    }
  }

  /**
   * Parse Tridium export file
   */
  static async parseFile(
    content: string,
    filename: string,
    options: TridiumParseOptions = {}
  ): Promise<TridiumParseResult> {
    const startTime = Date.now();
    
    try {
      logger.info('Starting Tridium file parsing', { 
        filename, 
        contentLength: content.length,
        userHint: options.userFormatHint
      });

      // Initialize parsers
      this.initializeParsers();

      // Step 1: Detect format
      const formatDetection = TridiumFormatDetector.detectFormat(
        content, 
        filename, 
        options.userFormatHint
      );

      logger.info('Format detection completed', {
        filename,
        detectedFormat: formatDetection.format,
        confidence: formatDetection.confidence,
        reasons: formatDetection.reasons.slice(0, 3) // Log first 3 reasons
      });

      // Step 2: Check if we have a parser for this format
      const parser = this.parsers.get(formatDetection.format);
      if (!parser) {
        // Format detected but no parser available
        const warnings = [
          `No parser available for format '${formatDetection.format}'`,
          'Please implement the corresponding parser or select a different format'
        ];

        // For now, try to handle with a generic approach if confidence is low
        if (formatDetection.confidence < 70 && formatDetection.format !== 'ResourceExport') {
          logger.warn('Low confidence detection, attempting Resource Export fallback', {
            filename,
            originalFormat: formatDetection.format,
            confidence: formatDetection.confidence
          });
          
          // Try Resource Export as fallback
          const resourceParser = this.parsers.get('ResourceExport');
          if (resourceParser) {
            const resourceFormatSpec = getFormatSpec('ResourceExport');
            const parseResult = await resourceParser.parse(content, filename, resourceFormatSpec);
            
            if (parseResult.success) {
              return {
                success: true,
                dataset: parseResult.dataset,
                errors: [],
                warnings: warnings.concat(parseResult.warnings, ['Used Resource Export parser as fallback']),
                formatDetection,
                processingTime: Date.now() - startTime
              };
            }
          }
        }

        return {
          success: false,
          errors: [`Parser not implemented for format: ${formatDetection.format}`],
          warnings,
          formatDetection,
          processingTime: Date.now() - startTime
        };
      }

      // Step 3: Parse with appropriate parser
      logger.info('Starting format-specific parsing', {
        filename,
        format: formatDetection.format,
        parser: parser.constructor.name
      });

      const parseResult = await parser.parse(content, filename, formatDetection.formatSpec);

      if (parseResult.success && parseResult.dataset) {
        // Enhance dataset with detection metadata
        parseResult.dataset.metadata.confidence = formatDetection.confidence;
        
        logger.info('Parsing completed successfully', {
          filename,
          format: formatDetection.format,
          rowCount: parseResult.dataset.rows.length,
          processingTime: parseResult.processingTime
        });

        return {
          success: true,
          dataset: parseResult.dataset,
          errors: parseResult.errors,
          warnings: parseResult.warnings,
          formatDetection,
          processingTime: Date.now() - startTime
        };
      } else {
        logger.error('Parsing failed', {
          filename,
          format: formatDetection.format,
          errors: parseResult.errors
        });

        return {
          success: false,
          errors: parseResult.errors,
          warnings: parseResult.warnings,
          formatDetection,
          processingTime: Date.now() - startTime
        };
      }

    } catch (error) {
      logger.error('Tridium parsing failed with exception', { filename, error });

      return {
        success: false,
        errors: [`Parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        warnings: [],
        formatDetection: {
          format: 'Unknown',
          confidence: 0,
          reasons: ['Exception during parsing'],
          formatSpec: getFormatSpec('Unknown')
        },
        processingTime: Date.now() - startTime
      };
    }
  }

  /**
   * Get available parsers
   */
  static getAvailableParsers(): TridiumExportFormat[] {
    this.initializeParsers();
    return Array.from(this.parsers.keys());
  }

  /**
   * Check if a format is supported
   */
  static isFormatSupported(format: TridiumExportFormat): boolean {
    this.initializeParsers();
    return this.parsers.has(format);
  }

  /**
   * Get parser statistics
   */
  static getParserStats(): { 
    totalParsers: number; 
    availableFormats: TridiumExportFormat[];
    missingParsers: TridiumExportFormat[];
  } {
    this.initializeParsers();
    
    const allFormats: TridiumExportFormat[] = [
      'N2Export', 'BACnetExport', 'ResourceExport', 
      'NiagaraNetExport', 'PlatformDetails'
    ];
    
    const availableFormats = Array.from(this.parsers.keys());
    const missingParsers = allFormats.filter(format => !this.parsers.has(format));

    return {
      totalParsers: this.parsers.size,
      availableFormats,
      missingParsers
    };
  }
}

/**
 * Legacy compatibility function - maintains existing API
 */
export class TridiumCSVParser {
  static async parseFileContent(content: string, filename: string): Promise<TridiumDataset> {
    const result = await TridiumParser.parseFile(content, filename);
    
    if (result.success && result.dataset) {
      return result.dataset;
    } else {
      throw new Error(`Parsing failed: ${result.errors.join('; ')}`);
    }
  }

  // Add other legacy methods as needed for backward compatibility
  static parseStatus = TridiumParser.prototype.constructor;
  static parseValue = TridiumParser.prototype.constructor;
}
