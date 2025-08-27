import { TridiumExportFormat, TridiumFormatSpec } from '@/types/tridium';
import { TRIDIUM_FORMAT_SPECS, getFormatSpec } from './formatSpecs';
import { logger } from '@/utils/logger';

export interface FormatDetectionResult {
  format: TridiumExportFormat;
  confidence: number;  // 0-100
  reasons: string[];
  formatSpec: TridiumFormatSpec;
}

/**
 * Enhanced format detector based on actual Tridium export analysis
 */
export class TridiumFormatDetector {
  
  /**
   * Detect format from file content and metadata
   */
  static detectFormat(
    content: string, 
    filename: string, 
    userHint?: TridiumExportFormat
  ): FormatDetectionResult {
    const startTime = Date.now();
    
    logger.info('Starting format detection', { 
      filename, 
      contentLength: content.length,
      userHint
    });

    // If user provided a hint, validate and use it
    if (userHint && userHint !== 'Unknown') {
      const result = this.validateUserHint(content, filename, userHint);
      if (result.confidence >= 80) {
        logger.info('User hint validated successfully', { 
          format: result.format, 
          confidence: result.confidence 
        });
        return result;
      } else {
        logger.warn('User hint validation failed, falling back to auto-detection', {
          hint: userHint,
          confidence: result.confidence
        });
      }
    }

    // Detect based on file extension first
    const extension = this.extractFileExtension(filename);
    
    if (extension === '.txt') {
      return this.detectPlatformDetails(content, filename);
    } else if (extension === '.csv') {
      return this.detectCSVFormat(content, filename);
    } else {
      return this.createUnknownResult(filename, [`Unsupported file extension: ${extension}`]);
    }
  }

  /**
   * Validate user-provided format hint
   */
  private static validateUserHint(
    content: string, 
    filename: string, 
    hint: TridiumExportFormat
  ): FormatDetectionResult {
    const formatSpec = getFormatSpec(hint);
    const extension = this.extractFileExtension(filename);

    // Basic file type validation
    if (!formatSpec.fileTypes.includes(extension)) {
      return this.createUnknownResult(filename, [
        `File type ${extension} not supported for ${hint} format`
      ]);
    }

    if (extension === '.txt' && hint === 'PlatformDetails') {
      return this.detectPlatformDetails(content, filename);
    } else if (extension === '.csv') {
      const headers = this.extractCSVHeaders(content);
      return this.validateCSVFormatHint(headers, filename, hint);
    }

    return this.createUnknownResult(filename, ['Unable to validate format hint']);
  }

  /**
   * Detect CSV format based on headers
   */
  private static detectCSVFormat(content: string, filename: string): FormatDetectionResult {
    const headers = this.extractCSVHeaders(content);
    
    if (headers.length === 0) {
      return this.createUnknownResult(filename, ['No valid CSV headers found']);
    }

    logger.debug('CSV headers extracted', { headers, filename });

    // Try each format in order of specificity
    const detectionMethods = [
      () => this.detectResourceExport(headers, filename),
      () => this.detectN2Export(headers, filename),  
      () => this.detectBACnetExport(headers, filename),
      () => this.detectNiagaraNetExport(headers, filename)
    ];

    let bestResult: FormatDetectionResult | null = null;
    
    for (const method of detectionMethods) {
      const result = method();
      if (result.confidence >= 90) {
        // High confidence match - return immediately
        return result;
      }
      if (!bestResult || result.confidence > bestResult.confidence) {
        bestResult = result;
      }
    }

    return bestResult || this.createUnknownResult(filename, ['No format patterns matched']);
  }

  /**
   * Detect Resource Export - HIGHEST PRIORITY due to exact match requirement
   */
  private static detectResourceExport(headers: string[], filename: string): FormatDetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // Resource exports MUST have exactly Name and Value columns
    if (headers.length === 2 && 
        headers.includes('Name') && 
        headers.includes('Value')) {
      
      confidence = 100;
      reasons.push('Exact match: exactly 2 columns (Name, Value)');
      
      logger.info('Resource Export detected with perfect match', { 
        filename, 
        headers, 
        confidence 
      });
      
      return {
        format: 'ResourceExport',
        confidence,
        reasons,
        formatSpec: getFormatSpec('ResourceExport')
      };
    }

    // Partial match with additional columns (lower confidence)
    if (headers.includes('Name') && headers.includes('Value')) {
      confidence = 60;
      reasons.push(`Has Name and Value columns but ${headers.length - 2} additional columns present`);
      reasons.push('May be Resource Export with extra data');
    }

    return {
      format: 'ResourceExport',
      confidence,
      reasons,
      formatSpec: getFormatSpec('ResourceExport')
    };
  }

  /**
   * Detect N2 Export based on Controller Type column
   */
  private static detectN2Export(headers: string[], filename: string): FormatDetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // N2 exports are uniquely identified by "Controller Type" column
    if (headers.includes('Controller Type')) {
      confidence += 80;
      reasons.push('Has unique "Controller Type" column');

      // Check for other expected columns
      const expectedColumns = ['Name', 'Status', 'Address'];
      const foundColumns = expectedColumns.filter(col => headers.includes(col));
      
      confidence += (foundColumns.length / expectedColumns.length) * 20;
      reasons.push(`Has ${foundColumns.length}/${expectedColumns.length} expected columns: ${foundColumns.join(', ')}`);

      logger.info('N2 Export detected', { filename, confidence, foundColumns });
    }

    return {
      format: 'N2Export',
      confidence,
      reasons,
      formatSpec: getFormatSpec('N2Export')
    };
  }

  /**
   * Detect BACnet Export based on Device ID and vendor information
   */
  private static detectBACnetExport(headers: string[], filename: string): FormatDetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // BACnet exports have Device ID column
    if (headers.includes('Device ID')) {
      confidence += 60;
      reasons.push('Has "Device ID" column');

      // Check for BACnet-specific columns
      const bacnetColumns = ['Vendor', 'Model', 'Health', 'Encoding', 'Protocol Rev'];
      const foundBACnetColumns = bacnetColumns.filter(col => headers.includes(col));
      
      if (foundBACnetColumns.length > 0) {
        confidence += (foundBACnetColumns.length / bacnetColumns.length) * 40;
        reasons.push(`Has ${foundBACnetColumns.length} BACnet-specific columns: ${foundBACnetColumns.join(', ')}`);
      }

      logger.info('BACnet Export detected', { filename, confidence, foundBACnetColumns });
    }

    return {
      format: 'BACnetExport',
      confidence,
      reasons,
      formatSpec: getFormatSpec('BACnetExport')
    };
  }

  /**
   * Detect Niagara Network Export based on Fox Port or Path columns
   */
  private static detectNiagaraNetExport(headers: string[], filename: string): FormatDetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // Niagara exports have distinctive columns
    const niagaraIdentifiers = ['Fox Port', 'Path', 'Platform Status'];
    const foundIdentifiers = niagaraIdentifiers.filter(col => headers.includes(col));

    if (foundIdentifiers.length > 0) {
      confidence += 50 + (foundIdentifiers.length * 25);
      reasons.push(`Has ${foundIdentifiers.length} Niagara identifiers: ${foundIdentifiers.join(', ')}`);

      // Check for connection status columns
      const connectionColumns = ['Client Conn', 'Server Conn'];
      const foundConnectionColumns = connectionColumns.filter(col => headers.includes(col));
      
      if (foundConnectionColumns.length > 0) {
        confidence += foundConnectionColumns.length * 10;
        reasons.push(`Has ${foundConnectionColumns.length} connection status columns`);
      }

      logger.info('Niagara Network Export detected', { filename, confidence, foundIdentifiers });
    }

    return {
      format: 'NiagaraNetExport',
      confidence,
      reasons,
      formatSpec: getFormatSpec('NiagaraNetExport')
    };
  }

  /**
   * Detect Platform Details text files
   */
  private static detectPlatformDetails(content: string, filename: string): FormatDetectionResult {
    const reasons: string[] = [];
    let confidence = 0;

    // Look for platform summary indicators
    const platformIndicators = [
      'Platform summary',
      'Daemon Version:',
      'Niagara Runtime:',
      'Operating System:',
      'Modules'
    ];

    const contentLower = content.toLowerCase();
    const foundIndicators = platformIndicators.filter(indicator => 
      contentLower.includes(indicator.toLowerCase())
    );

    if (foundIndicators.length > 0) {
      confidence = Math.min(90, foundIndicators.length * 20);
      reasons.push(`Found ${foundIndicators.length} platform indicators: ${foundIndicators.join(', ')}`);
      
      logger.info('Platform Details detected', { filename, confidence, foundIndicators });
    } else {
      // Check filename
      if (filename.toLowerCase().includes('platform')) {
        confidence = 60;
        reasons.push('Filename suggests platform details');
      }
    }

    return {
      format: 'PlatformDetails',
      confidence,
      reasons,
      formatSpec: getFormatSpec('PlatformDetails')
    };
  }

  /**
   * Validate CSV format hint against actual headers
   */
  private static validateCSVFormatHint(
    headers: string[], 
    filename: string, 
    hint: TridiumExportFormat
  ): FormatDetectionResult {
    const formatSpec = getFormatSpec(hint);
    const reasons: string[] = [];
    let confidence = 80; // Start high for user hints

    // Check required columns
    const missingRequired = formatSpec.requiredColumns.filter(col => !headers.includes(col));
    if (missingRequired.length === 0) {
      confidence += 20;
      reasons.push('All required columns present');
    } else {
      confidence -= missingRequired.length * 15;
      reasons.push(`Missing required columns: ${missingRequired.join(', ')}`);
    }

    // Check identifier columns
    const foundIdentifiers = formatSpec.identifierColumns.filter(col => headers.includes(col));
    if (foundIdentifiers.length > 0) {
      confidence += foundIdentifiers.length * 10;
      reasons.push(`Found ${foundIdentifiers.length} identifier columns`);
    } else if (formatSpec.identifierColumns.length > 0) {
      confidence -= 20;
      reasons.push('No identifier columns found');
    }

    return {
      format: hint,
      confidence: Math.max(0, Math.min(100, confidence)),
      reasons,
      formatSpec
    };
  }

  /**
   * Extract CSV headers from content
   */
  private static extractCSVHeaders(content: string): string[] {
    try {
      const lines = content.split(/\r?\n/);
      if (lines.length === 0) return [];

      const headerLine = lines[0].trim();
      if (!headerLine) return [];

      // Simple CSV parsing for headers only
      return this.parseCSVLine(headerLine);
    } catch (error) {
      logger.error('Failed to extract CSV headers', { error });
      return [];
    }
  }

  /**
   * Parse a single CSV line
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    let i = 0;

    // Remove BOM if present
    if (line.charCodeAt(0) === 0xFEFF) {
      line = line.slice(1);
    }

    while (i < line.length) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i += 2;
        } else {
          inQuotes = !inQuotes;
          i++;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
        i++;
      } else {
        current += char;
        i++;
      }
    }
    
    result.push(current.trim());
    return result.filter(header => header.length > 0);
  }

  /**
   * Extract file extension from filename
   */
  private static extractFileExtension(filename: string): string {
    const lastDot = filename.lastIndexOf('.');
    if (lastDot === -1) return '';
    return filename.substring(lastDot).toLowerCase();
  }

  /**
   * Create unknown format result
   */
  private static createUnknownResult(filename: string, reasons: string[]): FormatDetectionResult {
    return {
      format: 'Unknown',
      confidence: 0,
      reasons,
      formatSpec: getFormatSpec('Unknown')
    };
  }
}
