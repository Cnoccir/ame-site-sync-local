import { TridiumParser } from '@/utils/tridium/tridiumParser';
import * as fs from 'fs';
import * as path from 'path';

describe('BACnetExport Parser (E2E)', () => {
  const filePath = path.resolve(process.cwd(), 'docs/Example_Exports/JaceBacnetExport.csv');

  it('parses BACnet device export', async () => {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = await TridiumParser.parseFile(content, path.basename(filePath), { userFormatHint: 'BACnetExport' });

    expect(result.success).toBe(true);
    expect(result.dataset).toBeDefined();
    expect(result.dataset!.format).toBe('BACnetExport');
    expect(result.dataset!.rows.length).toBeGreaterThan(0);
  });
});

