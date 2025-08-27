import { TridiumParser } from '@/utils/tridium/tridiumParser';
import * as fs from 'fs';
import * as path from 'path';

describe('N2Export Parser (E2E)', () => {
  const filePath = path.resolve(process.cwd(), 'docs/Example_Exports/Jace1_N2xport.csv');

  it('parses N2 network device export', async () => {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = await TridiumParser.parseFile(content, path.basename(filePath), { userFormatHint: 'N2Export' });

    expect(result.success).toBe(true);
    expect(result.dataset).toBeDefined();
    expect(result.dataset!.format).toBe('N2Export');
    expect(result.dataset!.rows.length).toBeGreaterThan(0);
  });
});

