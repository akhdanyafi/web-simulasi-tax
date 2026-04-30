import { parseTaxAllowance, parseTaxHoliday } from './excelParser.mjs';

export const datasetConfig = {
  tax_allowance: {
    table: 'tax_allowance_kbli_2025',
    parser: parseTaxAllowance,
    columns: [
      'source_row',
      'excel_no',
      'lokasi',
      'kawasan_industri',
      'jenis_industri_kbli_2025',
      'bidang_usaha_kbli_2025',
      'kode_kbli_2025',
      'kode_kbli_2020_lama',
      'tipe_perubahan',
      'cakupan',
      'nilai_min_investasi_baru',
      'nilai_min_perluasan',
      'syarat',
      'tax_allowance',
      'insentif_tambahan',
    ],
  },
  tax_holiday: {
    table: 'tax_holiday_kbli_2025',
    parser: parseTaxHoliday,
    columns: [
      'source_row',
      'lokasi',
      'kawasan_industri',
      'jenis_industri',
      'kbli_2025_source',
      'cakupan',
      'jenis_tax_holiday',
      'jangka_waktu',
      'nilai_investasi_minimum',
      'nilai_investasi_maksimum',
      'syarat',
      'summary',
      'detail_insentif',
      'insentif_tambahan',
      'kode_kbli_2025',
      'judul_kbli_2025',
      'sifat_kesesuaian',
      'keterangan_revisi',
    ],
  },
};

export function parseRowsForType(type, input) {
  const config = datasetConfig[type];
  if (!config) throw new Error(`Unknown dataset type: ${type}`);
  return config.parser(input);
}

export async function insertRows(connection, type, rows, chunkSize = 500) {
  const config = datasetConfig[type];
  if (!config) throw new Error(`Unknown dataset type: ${type}`);
  if (!rows.length) return 0;

  const columnSql = config.columns.map(column => `\`${column}\``).join(', ');
  const placeholders = rows => rows
    .map(() => `(${config.columns.map(() => '?').join(', ')})`)
    .join(', ');

  let inserted = 0;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const values = chunk.flatMap(row => config.columns.map(column => row[column] ?? null));
    await connection.query(
      `INSERT INTO \`${config.table}\` (${columnSql}) VALUES ${placeholders(chunk)}`,
      values
    );
    inserted += chunk.length;
  }

  return inserted;
}

export async function replaceDataset(connection, { type, rows, originalName, uploadedBy = null }) {
  const config = datasetConfig[type];
  if (!config) throw new Error(`Unknown dataset type: ${type}`);

  await connection.beginTransaction();
  try {
    await connection.query(`TRUNCATE TABLE \`${config.table}\``);
    const inserted = await insertRows(connection, type, rows);
    await connection.execute(
      'UPDATE dataset_files SET is_active = 0 WHERE type = ?',
      [type]
    );
    const [result] = await connection.execute(
      `INSERT INTO dataset_files (type, original_name, stored_name, record_count, is_active, uploaded_by)
       VALUES (?, ?, ?, ?, 1, ?)`,
      [type, originalName, originalName, inserted, uploadedBy]
    );
    await connection.commit();
    return { id: result.insertId, recordCount: inserted };
  } catch (error) {
    await connection.rollback();
    throw error;
  }
}

