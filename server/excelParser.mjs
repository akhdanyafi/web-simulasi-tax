import xlsx from 'xlsx';

const ALLOWANCE_SHEET = 'Master_KBLI_2025';
const HOLIDAY_SHEET = 'Data Tax Holiday REVISI';
const ALLOWANCE_REQUIRED_HEADERS = [
  'No',
  'Lokasi',
  'Kawasan Industri',
  'Bidang Usaha (KBLI 2025)',
  'Cakupan',
  'Nilai Min. Investasi Baru (Rp)',
  'Nilai Min. Perluasan (Rp)',
  'Syarat',
  'Tax Allowance',
];
const HOLIDAY_REQUIRED_HEADERS = [
  'Lokasi',
  'Kawasan Industri',
  'Cakupan',
  'Jangka Waktu',
  'Nilai Investasi Minimum',
  'Nilai Investasi Maksimum',
  'Jenis Tax Holiday',
  'Summary',
  'Detail Insentif A',
  'Syarat',
];

export class DatasetValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DatasetValidationError';
    this.statusCode = 400;
  }
}

function readWorkbook(input) {
  if (Buffer.isBuffer(input)) {
    return xlsx.read(input, { type: 'buffer', cellDates: false });
  }
  return xlsx.readFile(input, { cellDates: false });
}

function getSheet(workbook, preferredName) {
  const exact = workbook.Sheets[preferredName];
  if (exact) return exact;

  const fallbackName = workbook.SheetNames.find(name =>
    name.toLowerCase().includes(preferredName.toLowerCase().slice(0, 12))
  );
  if (fallbackName) return workbook.Sheets[fallbackName];

  return workbook.Sheets[workbook.SheetNames[0]];
}

function assertRequiredHeaders(headers, requiredHeaders, label) {
  const missingHeaders = requiredHeaders.filter(header => !headers.includes(header));
  if (!missingHeaders.length) return;
  throw new DatasetValidationError(
    `${label}: kolom wajib tidak lengkap. Kolom yang belum tersedia: ${missingHeaders.join(', ')}.`
  );
}

function cleanText(value) {
  if (value === null || value === undefined) return '';
  return String(value).replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim();
}

function nullableText(value) {
  const text = cleanText(value);
  return text.length ? text : null;
}

function numberValue(value) {
  if (value === null || value === undefined || value === '') return null;
  if (typeof value === 'number') return Number.isFinite(value) ? value : null;
  const cleaned = String(value).replace(/[^0-9.-]/g, '');
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeKeyPart(value) {
  return cleanText(value).toLowerCase();
}

function deduplicateRows(rows, keySelector) {
  const seen = new Map();
  const uniqueRows = [];

  for (const row of rows) {
    const key = keySelector(row)
      .map(normalizeKeyPart)
      .join('||');
    if (!key.replace(/\|/g, '')) {
      uniqueRows.push(row);
      continue;
    }

    if (seen.has(key)) {
      continue;
    }
    seen.set(key, row.source_row);
    uniqueRows.push(row);
  }

  return uniqueRows;
}

function hasTierSummary(summary) {
  return /s\.d\.|^>/im.test(String(summary || ''));
}

function rowsFromSheet(sheet) {
  const rawRows = xlsx.utils.sheet_to_json(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
    raw: true,
  });

  const headerRow = rawRows[0] ?? [];
  const headers = headerRow.map(cleanText);

  const rows = rawRows.slice(1).map((row, index) => {
    const data = {};
    headers.forEach((header, columnIndex) => {
      if (header) data[header] = row[columnIndex] ?? null;
    });
    return { sourceRow: index + 2, data };
  });

  return { headers, rows };
}

export function splitLongText(text) {
  return cleanText(text)
    .split(/\n|;\s*/g)
    .map(item => item.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean);
}

export function parseTaxAllowance(input) {
  const workbook = readWorkbook(input);
  const sheet = getSheet(workbook, ALLOWANCE_SHEET);
  const { headers, rows } = rowsFromSheet(sheet);

  assertRequiredHeaders(headers, ALLOWANCE_REQUIRED_HEADERS, 'Dataset Tax Allowance');

  const parsedRows = rows
    .filter(({ data }) => nullableText(data.No) && nullableText(data.Lokasi))
    .map(({ sourceRow, data }) => ({
      source_row: sourceRow,
      excel_no: Math.trunc(numberValue(data.No) ?? sourceRow - 1),
      lokasi: nullableText(data.Lokasi),
      kawasan_industri: nullableText(data['Kawasan Industri']),
      jenis_industri_kbli_2025: nullableText(data['Jenis Industri (KBLI 2025)']),
      bidang_usaha_kbli_2025: nullableText(data['Bidang Usaha (KBLI 2025)']),
      kode_kbli_2025: nullableText(data['Kode KBLI 2025']),
      kode_kbli_2020_lama: nullableText(data['Kode KBLI 2020 (Lama)']),
      tipe_perubahan: nullableText(data['Tipe Perubahan']),
      cakupan: nullableText(data.Cakupan),
      nilai_min_investasi_baru: numberValue(data['Nilai Min. Investasi Baru (Rp)']),
      nilai_min_perluasan: numberValue(data['Nilai Min. Perluasan (Rp)']),
      syarat: nullableText(data.Syarat),
      tax_allowance: nullableText(data['Tax Allowance']),
      insentif_tambahan: nullableText(data['Insentif Tambahan']),
    }));

  if (!parsedRows.length) {
    throw new DatasetValidationError('Dataset Tax Allowance tidak berisi baris yang valid untuk diimpor.');
  }

  const uniqueRows = deduplicateRows(parsedRows, row => [
    row.lokasi,
    row.kawasan_industri,
    row.jenis_industri_kbli_2025,
    row.bidang_usaha_kbli_2025,
    row.kode_kbli_2025,
    row.kode_kbli_2020_lama,
    row.tipe_perubahan,
    row.cakupan,
    row.nilai_min_investasi_baru,
    row.nilai_min_perluasan,
    row.syarat,
    row.tax_allowance,
    row.insentif_tambahan,
  ]);

  uniqueRows.forEach(row => {
    if (!row.kawasan_industri || !row.bidang_usaha_kbli_2025) {
      throw new DatasetValidationError(
        `Dataset Tax Allowance: data wajib belum lengkap pada baris ${row.source_row}.`
      );
    }

    const hasNilaiBaru = row.nilai_min_investasi_baru !== null;
    const hasNilaiPerluasan = row.nilai_min_perluasan !== null;
    if (!hasNilaiBaru && !hasNilaiPerluasan) {
      throw new DatasetValidationError(
        `Dataset Tax Allowance: nilai minimum investasi belum tersedia pada baris ${row.source_row}.`
      );
    }

    if ((hasNilaiBaru && row.nilai_min_investasi_baru < 0) || (hasNilaiPerluasan && row.nilai_min_perluasan < 0)) {
      throw new DatasetValidationError(
        `Dataset Tax Allowance: nilai minimum investasi tidak boleh negatif pada baris ${row.source_row}.`
      );
    }
  });

  return uniqueRows;
}

export function parseTaxHoliday(input) {
  const workbook = readWorkbook(input);
  const sheet = getSheet(workbook, HOLIDAY_SHEET);
  const { headers, rows } = rowsFromSheet(sheet);

  assertRequiredHeaders(headers, HOLIDAY_REQUIRED_HEADERS, 'Dataset Tax Holiday');

  const parsedRows = rows
    .filter(({ data }) => nullableText(data.Lokasi) && nullableText(data['Kawasan Industri']))
    .map(({ sourceRow, data }) => {
      const summary = nullableText(data.Summary);
      const nilaiInvestasiMinimum = numberValue(data['Nilai Investasi Minimum']);
      let nilaiInvestasiMaksimum = numberValue(data['Nilai Investasi Maksimum']);

      if (
        nilaiInvestasiMinimum !== null &&
        nilaiInvestasiMaksimum !== null &&
        nilaiInvestasiMaksimum < nilaiInvestasiMinimum &&
        hasTierSummary(summary)
      ) {
        nilaiInvestasiMaksimum = null;
      }

      return ({
      source_row: sourceRow,
      lokasi: nullableText(data.Lokasi),
      kawasan_industri: nullableText(data['Kawasan Industri']),
      jenis_industri: nullableText(data['Jenis Industri']),
      kbli_2025_source: nullableText(data['KBLI 2025']),
      cakupan: nullableText(data.Cakupan),
      jenis_tax_holiday: nullableText(data['Jenis Tax Holiday']),
      jangka_waktu: nullableText(data['Jangka Waktu']),
      nilai_investasi_minimum: nilaiInvestasiMinimum,
      nilai_investasi_maksimum: nilaiInvestasiMaksimum,
      syarat: nullableText(data.Syarat),
      summary,
      detail_insentif: nullableText(data['Detail Insentif A']),
      insentif_tambahan: nullableText(data['Insentif Tambahan']),
      kode_kbli_2025: nullableText(data['Kode KBLI 2025']),
      judul_kbli_2025: nullableText(data['Judul KBLI 2025']),
      sifat_kesesuaian: nullableText(data['Sifat Kesesuaian']),
      keterangan_revisi: nullableText(data['Keterangan Revisi']),
    });
    });

  if (!parsedRows.length) {
    throw new DatasetValidationError('Dataset Tax Holiday tidak berisi baris yang valid untuk diimpor.');
  }

  const uniqueRows = deduplicateRows(parsedRows, row => [
    row.lokasi,
    row.kawasan_industri,
    row.jenis_industri,
    row.kbli_2025_source,
    row.cakupan,
    row.jangka_waktu,
    row.nilai_investasi_minimum,
    row.nilai_investasi_maksimum,
    row.jenis_tax_holiday,
    row.summary,
    row.detail_insentif,
    row.syarat,
    row.kode_kbli_2025,
    row.judul_kbli_2025,
    row.sifat_kesesuaian,
    row.keterangan_revisi,
  ]);

  uniqueRows.forEach(row => {
    if (!row.cakupan || !row.jangka_waktu || !row.jenis_tax_holiday || !row.summary || !row.detail_insentif) {
      throw new DatasetValidationError(
        `Dataset Tax Holiday: data wajib belum lengkap pada baris ${row.source_row}.`
      );
    }

    if (row.nilai_investasi_minimum === null) {
      throw new DatasetValidationError(
        `Dataset Tax Holiday: nilai investasi minimum wajib tersedia pada baris ${row.source_row}.`
      );
    }

    if (row.nilai_investasi_maksimum !== null && row.nilai_investasi_maksimum < row.nilai_investasi_minimum) {
      throw new DatasetValidationError(
        `Dataset Tax Holiday: nilai investasi maksimum lebih kecil dari minimum pada baris ${row.source_row}.`
      );
    }

    if (row.nilai_investasi_maksimum === null) {
      if (!hasTierSummary(row.summary)) {
        throw new DatasetValidationError(
          `Dataset Tax Holiday: rule investasi terbuka harus menyertakan tier/range summary pada baris ${row.source_row}.`
        );
      }
    }
  });

  return uniqueRows;
}

