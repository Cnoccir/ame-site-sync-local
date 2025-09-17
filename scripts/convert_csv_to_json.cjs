const fs = require('fs');
const path = require('path');
const tsnode = require('ts-node');
tsnode.register({ transpileOnly: true });
const { CSVParser } = require('../src/services/csvParser.ts');

const DATA_DIR = path.resolve(process.cwd(), 'docs', 'data');
const OUT_DIR = DATA_DIR;

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
  console.log(`Wrote ${file} (${Array.isArray(data) ? data.length : 1} records)`);
}

(function run() {
  const taskCsv = path.join(DATA_DIR, 'Task_Library_v22.csv');
  const sopCsv = path.join(DATA_DIR, 'SOP_Library_v22.csv');

  if (!fs.existsSync(taskCsv) || !fs.existsSync(sopCsv)) {
    console.error('CSV files not found in docs/data');
    process.exit(1);
  }

  const taskContent = fs.readFileSync(taskCsv, 'utf8');
  const sopContent = fs.readFileSync(sopCsv, 'utf8');

  const tasks = CSVParser.parseCSV(taskContent, 'Task_Library_v22.csv');
  const sops = CSVParser.parseCSV(sopContent, 'SOP_Library_v22.csv');

  writeJSON(path.join(OUT_DIR, 'Task_Library_v22.json'), tasks);
  writeJSON(path.join(OUT_DIR, 'SOP_Library_v22.json'), sops);
})();