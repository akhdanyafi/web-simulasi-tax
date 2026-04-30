import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { datasetConfig, parseRowsForType } from '../server/importer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const outputPath = path.join(rootDir, 'database', 'tax_simulator_features.sql');

const files = [
  {
    type: 'tax_allowance',
    filename: 'Tax_Allowance_KBLI_2025_Reconciliation.xlsx',
  },
  {
    type: 'tax_holiday',
    filename: 'TAX_HOLIDAY_KBLI2025_REVISI.xlsx',
  },
];

function sqlValue(value) {
  if (value === null || value === undefined || value === '') return 'NULL';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return `'${String(value).replace(/'/g, "''")}'`;
}

function insertSql(type, rows, chunkSize = 250) {
  const config = datasetConfig[type];
  const columns = config.columns.map(column => `\`${column}\``).join(', ');
  const statements = [];

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const values = chunk.map(row =>
      `(${config.columns.map(column => sqlValue(row[column])).join(', ')})`
    ).join(',\n');
    statements.push(`INSERT INTO \`${config.table}\` (${columns}) VALUES\n${values};`);
  }

  return statements.join('\n\n');
}

const schema = await fs.readFile(path.join(rootDir, 'database', 'schema.sql'), 'utf8');
const parts = [
  schema,
  'SET FOREIGN_KEY_CHECKS = 0;',
  'TRUNCATE TABLE `dataset_files`;',
  'TRUNCATE TABLE `tax_allowance_kbli_2025`;',
  'TRUNCATE TABLE `tax_holiday_kbli_2025`;',
  'SET FOREIGN_KEY_CHECKS = 1;',
];

for (const file of files) {
  const rows = parseRowsForType(file.type, path.join(rootDir, file.filename));
  parts.push(`\n-- Data from ${file.filename}`);
  parts.push(insertSql(file.type, rows));
  parts.push(
    `INSERT INTO \`dataset_files\` (\`type\`, \`original_name\`, \`stored_name\`, \`record_count\`, \`is_active\`, \`uploaded_by\`) ` +
    `VALUES (${sqlValue(file.type)}, ${sqlValue(file.filename)}, ${sqlValue(file.filename)}, ${rows.length}, 1, NULL);`
  );
  console.log(`${file.filename}: wrote ${rows.length} rows`);
}

await fs.writeFile(outputPath, `${parts.join('\n\n')}\n`, 'utf8');
console.log(`SQL written to ${outputPath}`);

