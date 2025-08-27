import { TridiumParser } from '@/utils/tridium/tridiumParser';
import * as fs from 'fs';
import * as path from 'path';

describe('NiagaraNetExport Parser (E2E)', () => {
  const filePath = path.resolve(process.cwd(), 'docs/Example_Exports/SupervisorNiagaraNetExport.csv');

  it('parses supervisor niagara network export', async () => {
    const content = fs.readFileSync(filePath, 'utf8');
    const result = await TridiumParser.parseFile(content, path.basename(filePath));

    expect(result.success).toBe(true);
    expect(result.dataset).toBeDefined();
    expect(result.dataset!.format).toBe('NiagaraNetExport');
    expect(result.dataset!.rows.length).toBeGreaterThan(0);
  });
});

