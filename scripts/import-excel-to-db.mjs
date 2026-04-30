import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, withoutDatabaseConnection } from '../server/db.mjs';
import { parseRowsForType, replaceDataset } from '../server/importer.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

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

async function runSchema() {
  const schemaPath = path.join(rootDir, 'database', 'schema.sql');
  const schema = await fs.readFile(schemaPath, 'utf8');
  const connection = await withoutDatabaseConnection();
  try {
    await connection.query(schema);
  } finally {
    await connection.end();
  }
}

async function importFile(file) {
  const filePath = path.join(rootDir, file.filename);
  const rows = parseRowsForType(file.type, filePath);
  const connection = await pool.getConnection();
  try {
    const result = await replaceDataset(connection, {
      type: file.type,
      rows,
      originalName: file.filename,
      uploadedBy: null,
    });
    console.log(`${file.filename}: imported ${result.recordCount} rows into ${file.type}`);
  } finally {
    connection.release();
  }
}

await runSchema();
for (const file of files) {
  await importFile(file);
}
await pool.end();

