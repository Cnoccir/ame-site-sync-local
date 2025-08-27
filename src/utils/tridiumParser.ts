// Legacy imports maintained for compatibility
import { TridiumDataset } from '@/types/tridium';
import { logger } from '@/utils/logger';

// Import new parser architecture
import { TridiumParser } from './tridium/tridiumParser';

/**
 * @deprecated Use TridiumParser from ./tridium/tridiumParser instead
 * This is maintained for backward compatibility only
 */
export class TridiumCSVParser {
  /**
   * @deprecated This class is deprecated. Use TridiumParser instead.
   * This method is maintained for backward compatibility.
   */
  static async parseFileContent(content: string, filename: string): Promise<TridiumDataset> {
    logger.warn('Using deprecated TridiumCSVParser. Consider migrating to TridiumParser.', {
      filename
    });
    
    try {
      const result = await TridiumParser.parseFile(content, filename);
      
      if (result.success && result.dataset) {
        return result.dataset;
      } else {
        throw new Error(`Parsing failed: ${result.errors.join('; ')}`);
      }
    } catch (error) {
      logger.error('Legacy parser fallback failed', { filename, error });
      throw error;
    }
  }
  
  // Export the new parser for direct use
  static get NewParser() {
    return TridiumParser;
  }
}

// Export the new parser as the main interface
export { TridiumParser } from './tridium/tridiumParser';
