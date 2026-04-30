import fs from 'fs/promises';
import path from 'path';
import express from 'express';
import multer from 'multer';
import { fileURLToPath } from 'url';
import { pool, pingDatabase } from './db.mjs';
import { createToken, hashPassword, publicUser, requireAuth, verifyPassword } from './auth.mjs';
import { datasetConfig, parseRowsForType, replaceDataset } from './importer.mjs';
import { splitLongText } from './excelParser.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});
const host = process.env.API_HOST || '127.0.0.1';
const publicHost = process.env.API_PUBLIC_HOST || '127.0.0.1';
const port = Number(process.env.API_PORT ?? 0);
const EMPTY_CAKUPAN_LABEL = 'Tanpa cakupan khusus';
const runtimeApiConfigPath = path.resolve(__dirname, '..', 'assets', 'runtime-api-config.json');
const configuredCorsOrigins = String(process.env.CORS_ORIGIN || '')
  .split(',')
  .map(origin => origin.trim())
  .filter(Boolean);

function isAllowedOrigin(origin) {
  if (!origin) return false;
  if (configuredCorsOrigins.length) {
    return configuredCorsOrigins.includes(origin);
  }

  try {
    const { hostname } = new URL(origin);
    return hostname === '127.0.0.1' || hostname === 'localhost';
  } catch {
    return false;
  }
}

async function writeRuntimeApiConfig(apiPort) {
  const payload = {
    apiBaseUrl: apiPort ? `http://${publicHost}:${apiPort}` : null,
    apiPort: apiPort ?? null,
    updatedAt: new Date().toISOString(),
  };

  await fs.mkdir(path.dirname(runtimeApiConfigPath), { recursive: true });
  await fs.writeFile(runtimeApiConfigPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
}

app.use(express.json({ limit: '2mb' }));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (typeof origin === 'string' && isAllowedOrigin(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

function asyncHandler(handler) {
  return (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
}

function formatDataset(row) {
  return {
    id: String(row.id ?? `${row.type}-active`),
    name: row.original_name,
    type: row.type,
    uploadDate: row.uploaded_at,
    recordCount: Number(row.record_count ?? 0),
    status: row.is_active ? 'active' : 'processing',
  };
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function nonEmptyList(text, fallback = 'Tidak tersedia') {
  const items = splitLongText(text);
  return items.length ? items : [fallback];
}

function uniqueStrings(values) {
  return [...new Set(values.map(value => String(value || '').trim()).filter(Boolean))];
}

function formatCompactRupiah(value) {
  if (value === null || value === undefined || !Number.isFinite(value)) return '';
  if (value >= 1e12) return `Rp ${(value / 1e12).toLocaleString('id-ID', { maximumFractionDigits: 1 })} triliun`;
  if (value >= 1e9) return `Rp ${(value / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 })} miliar`;
  if (value >= 1e6) return `Rp ${(value / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} juta`;
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function parseNominalValue(amount, unit = '') {
  const parsedAmount = Number(String(amount || '').replace(',', '.'));
  if (!Number.isFinite(parsedAmount)) return null;

  const normalizedUnit = String(unit || '').trim().toLowerCase();
  const multipliers = {
    ribu: 1e3,
    juta: 1e6,
    miliar: 1e9,
    triliun: 1e12,
  };

  return parsedAmount * (multipliers[normalizedUnit] || 1);
}

function parseHolidayTier(line) {
  const normalized = String(line || '').trim();
  if (!normalized) return null;

  const betweenMatch = normalized.match(/^Rp\s*([\d.,]+)\s*(ribu|juta|miliar|triliun)?\s*s\.d\.\s*<\s*Rp\s*([\d.,]+)\s*(ribu|juta|miliar|triliun)?\s*=\s*(.+)$/i);
  if (betweenMatch) {
    const min = parseNominalValue(betweenMatch[1], betweenMatch[2]);
    const max = parseNominalValue(betweenMatch[3], betweenMatch[4]);
    if (min === null || max === null) return null;
    return {
      min,
      max,
      exclusiveMax: true,
      duration: betweenMatch[5].trim(),
    };
  }

  const aboveMatch = normalized.match(/^>\s*Rp\s*([\d.,]+)\s*(ribu|juta|miliar|triliun)?\s*=\s*(.+)$/i);
  if (aboveMatch) {
    const min = parseNominalValue(aboveMatch[1], aboveMatch[2]);
    if (min === null) return null;
    return {
      min,
      max: null,
      exclusiveMax: false,
      duration: aboveMatch[3].trim(),
    };
  }

  return null;
}

function parseHolidayTiers(summary) {
  return splitLongText(summary)
    .map(parseHolidayTier)
    .filter(Boolean);
}

function buildHolidayTierSummary(jenisTaxHoliday, tier) {
  if (!tier) return jenisTaxHoliday || 'Tax Holiday';
  if (tier.max === null) {
    return `${jenisTaxHoliday} dengan jangka waktu ${tier.duration} untuk investasi mulai ${formatCompactRupiah(tier.min)}.`;
  }
  return `${jenisTaxHoliday} dengan jangka waktu ${tier.duration} untuk investasi ${formatCompactRupiah(tier.min)} sampai kurang dari ${formatCompactRupiah(tier.max)}.`;
}

function buildHolidayStandardSummary(row, min, max, duration) {
  const jenisTaxHoliday = row?.jenis_tax_holiday || 'Tax Holiday';
  const jangkaWaktu = String(duration || row?.jangka_waktu || '').trim();

  if (min !== null && max === null) {
    return `${jenisTaxHoliday} dengan jangka waktu ${jangkaWaktu} untuk investasi mulai ${formatCompactRupiah(min)}.`;
  }

  if (min !== null && max !== null) {
    return `${jenisTaxHoliday} dengan jangka waktu ${jangkaWaktu} untuk investasi ${formatCompactRupiah(min)} sampai ${formatCompactRupiah(max)}.`;
  }

  if (jangkaWaktu) {
    return `${jenisTaxHoliday} dengan jangka waktu ${jangkaWaktu}.`;
  }

  return jenisTaxHoliday;
}

function buildHolidayOutOfRangeSummary(row, min, max, selectedJangkaWaktu) {
  const jenisTaxHoliday = row?.jenis_tax_holiday || 'Tax Holiday';
  const label = selectedJangkaWaktu || row?.jangka_waktu || 'opsi yang dipilih';
  if (min !== null && max === null) {
    return `${jenisTaxHoliday} untuk ${label} tersedia mulai ${formatCompactRupiah(min)}.`;
  }
  if (min !== null && max !== null) {
    return `${jenisTaxHoliday} untuk ${label} berlaku pada rentang ${formatCompactRupiah(min)} sampai ${formatCompactRupiah(max)}.`;
  }
  return row?.summary || jenisTaxHoliday;
}

function normalizeHolidayRows(rows) {
  return rows
    .flatMap(row => {
      const tiers = parseHolidayTiers(row.summary);
      const normalizedMin = numberOrNull(row.nilai_investasi_minimum);
      const normalizedMax = numberOrNull(row.nilai_investasi_maksimum);
      const hasInvalidStoredRange = normalizedMin !== null && normalizedMax !== null && normalizedMax < normalizedMin;

      if (tiers.length && (normalizedMax === null || hasInvalidStoredRange)) {
        return tiers.map(tier => ({
          ...row,
          derived_jangka_waktu: tier.duration,
          derived_nilai_investasi_minimum: tier.min,
          derived_nilai_investasi_maksimum: tier.max,
          derived_exclusive_max: tier.exclusiveMax,
          derived_summary: buildHolidayTierSummary(row.jenis_tax_holiday, tier),
          raw_summary: row.summary,
        }));
      }

      return [{
        ...row,
        derived_jangka_waktu: row.jangka_waktu,
        derived_nilai_investasi_minimum: normalizedMin,
        derived_nilai_investasi_maksimum: normalizedMax,
        derived_exclusive_max: false,
        derived_summary: buildHolidayStandardSummary(row, normalizedMin, normalizedMax, row.jangka_waktu),
        raw_summary: row.summary,
      }];
    })
    .sort((left, right) => {
      const leftMin = left.derived_nilai_investasi_minimum ?? Number.MAX_SAFE_INTEGER;
      const rightMin = right.derived_nilai_investasi_minimum ?? Number.MAX_SAFE_INTEGER;
      return leftMin - rightMin;
    });
}

function buildTaxAllowanceSummary(row, kategoriInvestasi, kawasanIndustri) {
  const nilaiMinimum = numberOrNull(
    kategoriInvestasi === 'Perluasan'
      ? row?.nilai_min_perluasan
      : row?.nilai_min_investasi_baru
  );
  const lokasi = row?.lokasi || 'provinsi terpilih';
  const bidangUsaha = row?.bidang_usaha_kbli_2025 || 'bidang usaha terpilih';
  const cakupan = row?.cakupan || EMPTY_CAKUPAN_LABEL;
  const kawasanLabel = kawasanIndustri.length
    ? ` Kawasan industri yang sesuai: ${kawasanIndustri.join(', ')}.`
    : '';

  return `Tax Allowance untuk ${bidangUsaha} di ${lokasi} dengan cakupan ${cakupan} memerlukan investasi minimum ${formatCompactRupiah(nilaiMinimum ?? 0)} pada kategori ${kategoriInvestasi.toLowerCase()}.${kawasanLabel}`;
}

function normalizeTaxAllowanceCriteria(row, kategoriInvestasi) {
  return {
    min: numberOrNull(
      kategoriInvestasi === 'Perluasan'
        ? row?.nilai_min_perluasan
        : row?.nilai_min_investasi_baru
    ),
    max: numberOrNull(
      kategoriInvestasi === 'Perluasan'
        ? row?.nilai_max_perluasan
        : row?.nilai_max_investasi_baru
    ),
  };
}

function buildTaxAllowanceInvestmentCriteria(rows, kategoriInvestasi) {
  const normalizedCriteria = rows
    .map(row => normalizeTaxAllowanceCriteria(row, kategoriInvestasi))
    .filter(criteria => criteria.min !== null || criteria.max !== null);

  if (!normalizedCriteria.length) {
    return null;
  }

  const min = normalizedCriteria.reduce((currentMin, criteria) => {
    if (criteria.min === null) return currentMin;
    return currentMin === null ? criteria.min : Math.min(currentMin, criteria.min);
  }, null);

  const hasOpenEndedRange = normalizedCriteria.some(criteria => criteria.max === null);
  const max = hasOpenEndedRange
    ? null
    : normalizedCriteria.reduce((currentMax, criteria) => {
        if (criteria.max === null) return currentMax;
        return currentMax === null ? criteria.max : Math.max(currentMax, criteria.max);
      }, null);

  if (min === null && max === null) {
    return null;
  }

  return { min, max };
}

function formatTaxHoliday(row, status, kawasanIndustri) {
  return {
    status,
    provinsi: row?.lokasi ?? '',
    kawasanIndustri,
    cakupan: row?.cakupan ?? '',
    jangkaWaktu: row?.derived_jangka_waktu ?? row?.jangka_waktu ?? '',
    nilaiInvestasiMin: row?.derived_nilai_investasi_minimum ?? numberOrNull(row?.nilai_investasi_minimum),
    nilaiInvestasiMax: row?.derived_nilai_investasi_maksimum ?? numberOrNull(row?.nilai_investasi_maksimum),
    jenisTaxHoliday: row?.jenis_tax_holiday ?? '',
    summary: row?.derived_summary ?? row?.summary ?? '',
    catatanRegulasi: row?.raw_summary ?? row?.summary ?? '',
    detailInsentif: nonEmptyList(row?.detail_insentif),
    insentifTambahan: nonEmptyList(row?.insentif_tambahan),
    syarat: nonEmptyList(row?.syarat),
  };
}

function formatTaxAllowance(row, status, kategoriInvestasi, kawasanIndustriDipilih, nilaiMinInvestasi) {
  return {
    status,
    provinsi: row?.lokasi ?? '',
    kawasanIndustri: row?.kawasanIndustri ?? (row?.kawasan_industri ? [row.kawasan_industri] : []),
    kawasanIndustriDipilih,
    bidangUsaha: row?.bidang_usaha_kbli_2025 ?? '',
    cakupanBidangUsaha: row?.cakupan ?? EMPTY_CAKUPAN_LABEL,
    kategoriInvestasi,
    nilaiMinInvestasi: Number(nilaiMinInvestasi ?? 0),
    summary: row?.summary ?? 'Ringkasan hasil belum tersedia.',
    syarat: nonEmptyList(row?.syarat),
    taxAllowance: row?.tax_allowance ?? 'Tidak tersedia',
    insentifTambahan: nonEmptyList(row?.insentif_tambahan),
  };
}

async function distinctValues(table, column, whereParts = [], params = []) {
  const whereSql = whereParts.length ? `WHERE ${whereParts.join(' AND ')}` : '';
  const [rows] = await pool.execute(
    `SELECT DISTINCT ${column} AS value
     FROM ${table}
     ${whereSql}
     ORDER BY value ASC`,
    params
  );
  return rows.map(row => row.value).filter(Boolean);
}

app.get('/api/health', asyncHandler(async (_req, res) => {
  res.json({ ok: await pingDatabase() });
}));

app.post('/api/auth/login', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const username = String(body.username || '').trim();
  const password = String(body.password || '');

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password harus diisi.' });
  }

  const [rows] = await pool.execute(
    `SELECT id, username, password_hash, full_name, role, is_active, created_at, last_login_at
     FROM users
     WHERE username = ? AND is_active = 1
     LIMIT 1`,
    [username]
  );
  const user = rows[0];

  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ message: 'Username atau password salah. Coba lagi.' });
  }

  await pool.execute('UPDATE users SET last_login_at = CURRENT_TIMESTAMP WHERE id = ?', [user.id]);
  const token = createToken(user);
  res.json({ token, user: publicUser(user) });
}));

app.get('/api/auth/me', requireAuth, asyncHandler(async (req, res) => {
  res.json({ user: publicUser(req.user) });
}));

app.get('/api/users', requireAuth, asyncHandler(async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, username, full_name, role, is_active, created_at, last_login_at
     FROM users
     ORDER BY created_at DESC, id DESC`
  );
  res.json({ users: rows.map(publicUser) });
}));

app.post('/api/users', requireAuth, asyncHandler(async (req, res) => {
  const body = req.body || {};
  const username = String(body.username || '').trim();
  const fullName = String(body.fullName || '').trim() || username;
  const password = String(body.password || '');

  if (!username || !password) {
    return res.status(400).json({ message: 'Username dan password wajib diisi.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ message: 'Password minimal 6 karakter.' });
  }

  try {
    const [result] = await pool.execute(
      `INSERT INTO users (username, password_hash, full_name, role, is_active)
       VALUES (?, ?, ?, 'admin', 1)`,
      [username, hashPassword(password), fullName]
    );
    const [rows] = await pool.execute(
      `SELECT id, username, full_name, role, is_active, created_at, last_login_at
       FROM users WHERE id = ?`,
      [result.insertId]
    );
    res.status(201).json({ user: publicUser(rows[0]) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: 'Username sudah digunakan.' });
    }
    throw error;
  }
}));

app.get('/api/datasets', requireAuth, asyncHandler(async (_req, res) => {
  const [rows] = await pool.execute(
    `SELECT id, type, original_name, record_count, is_active, uploaded_at
     FROM dataset_files
     WHERE is_active = 1
     ORDER BY uploaded_at ASC`
  );

  const datasets = rows.map(formatDataset);
  res.json({ datasets });
}));

app.get('/api/datasets/:type/preview', requireAuth, asyncHandler(async (req, res) => {
  const type = req.params.type;
  const config = datasetConfig[type];
  if (!config) return res.status(404).json({ message: 'Dataset tidak ditemukan.' });

  const limit = Math.min(Number(req.query.limit || 20), 100);
  const [rows] = await pool.query(`SELECT * FROM \`${config.table}\` ORDER BY id ASC LIMIT ?`, [limit]);
  res.json({ rows });
}));

app.post('/api/datasets/:type/upload', requireAuth, upload.single('file'), asyncHandler(async (req, res) => {
  const type = req.params.type;
  if (!datasetConfig[type]) return res.status(404).json({ message: 'Dataset tidak ditemukan.' });
  if (!req.file) return res.status(400).json({ message: 'File Excel wajib dikirim.' });
  if (!/\.xlsx?$/i.test(req.file.originalname)) {
    return res.status(400).json({ message: 'Format file tidak valid. Gunakan .xlsx atau .xls.' });
  }

  const rows = parseRowsForType(type, req.file.buffer);
  if (!rows.length) {
    return res.status(400).json({ message: 'File tidak berisi data yang bisa diimpor.' });
  }

  const connection = await pool.getConnection();
  try {
    const dataset = await replaceDataset(connection, {
      type,
      rows,
      originalName: req.file.originalname,
      uploadedBy: req.user.id,
    });
    res.status(201).json({
      dataset: {
        id: String(dataset.id),
        name: req.file.originalname,
        type,
        uploadDate: new Date().toISOString(),
        recordCount: dataset.recordCount,
        status: 'active',
      },
    });
  } finally {
    connection.release();
  }
}));

app.delete('/api/datasets/files/:id', requireAuth, asyncHandler(async (req, res) => {
  const [files] = await pool.execute('SELECT id, type, original_name FROM dataset_files WHERE id = ?', [req.params.id]);
  const file = files[0];
  if (!file) return res.status(404).json({ message: 'File tidak ditemukan.' });

  const config = datasetConfig[file.type];
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(`TRUNCATE TABLE \`${config.table}\``);
    await connection.execute('UPDATE dataset_files SET is_active = 0 WHERE id = ?', [file.id]);
    await connection.commit();
    res.json({ message: `"${file.original_name}" berhasil dihapus.` });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

app.get('/api/tax-holiday/options', asyncHandler(async (req, res) => {
  const { provinsi, cakupan, jangkaWaktu: selectedJangkaWaktu } = req.query;
  const table = 'tax_holiday_kbli_2025';
  const provinces = await distinctValues(table, 'lokasi', ['lokasi IS NOT NULL', "lokasi <> ''"]);
  const cakupanOptions = provinsi
    ? await distinctValues(table, 'cakupan', ['lokasi = ?', 'cakupan IS NOT NULL', "cakupan <> ''"], [provinsi])
    : [];
  const jangkaWaktu = provinsi && cakupan
    ? await distinctValues(table, 'jangka_waktu', ['lokasi = ?', 'cakupan = ?', 'jangka_waktu IS NOT NULL', "jangka_waktu <> ''"], [provinsi, cakupan])
    : [];

  let investmentRange = null;
  if (provinsi && cakupan && selectedJangkaWaktu) {
    const [rows] = await pool.execute(
      `SELECT *
       FROM ${table}
       WHERE lokasi = ? AND cakupan = ? AND jangka_waktu = ?
       ORDER BY nilai_investasi_minimum ASC, id ASC`,
      [provinsi, cakupan, selectedJangkaWaktu]
    );

    if (rows.length) {
      const normalizedRows = normalizeHolidayRows(rows);
      const min = normalizedRows.reduce((currentMin, row) => {
        const value = row.derived_nilai_investasi_minimum;
        if (value === null) return currentMin;
        return currentMin === null ? value : Math.min(currentMin, value);
      }, null);
      const hasOpenEndedRange = normalizedRows.some(row => row.derived_nilai_investasi_maksimum === null);
      const max = hasOpenEndedRange
        ? null
        : normalizedRows.reduce((currentMax, row) => {
            const value = row.derived_nilai_investasi_maksimum;
            if (value === null) return currentMax;
            return currentMax === null ? value : Math.max(currentMax, value);
          }, null);

      if (min !== null) {
        investmentRange = { min, max };
      }
    }
  }

  res.json({ provinces, cakupan: cakupanOptions, jangkaWaktu, investmentRange });
}));

app.post('/api/tax-holiday/simulate', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const provinsi = String(body.provinsi || '').trim();
  const cakupan = String(body.cakupan || '').trim();
  const jangkaWaktu = String(body.jangkaWaktu || '').trim();
  const nilaiInvestasi = Number(body.nilaiInvestasi || 0);

  if (!provinsi || !cakupan || !jangkaWaktu || !Number.isFinite(nilaiInvestasi)) {
    return res.status(400).json({ message: 'Parameter simulasi belum lengkap.' });
  }

  const [rows] = await pool.execute(
    `SELECT *
     FROM tax_holiday_kbli_2025
     WHERE lokasi = ? AND cakupan = ? AND jangka_waktu = ?
     ORDER BY nilai_investasi_minimum ASC, id ASC`,
    [provinsi, cakupan, jangkaWaktu]
  );

  if (!rows.length) {
    return res.json(formatTaxHoliday({ lokasi: provinsi, cakupan, jangka_waktu: jangkaWaktu }, 'error', []));
  }

  const normalizedRows = normalizeHolidayRows(rows);

  const [kawasanRows] = await pool.execute(
    `SELECT DISTINCT kawasan_industri
     FROM tax_holiday_kbli_2025
     WHERE lokasi = ? AND cakupan = ? AND jangka_waktu = ? AND kawasan_industri IS NOT NULL
     ORDER BY kawasan_industri ASC
     LIMIT 100`,
    [provinsi, cakupan, jangkaWaktu]
  );
  const kawasanIndustri = uniqueStrings(kawasanRows.map(row => row.kawasan_industri));

  const match = normalizedRows.find(row => {
    const min = row.derived_nilai_investasi_minimum ?? 0;
    const max = row.derived_nilai_investasi_maksimum;
    if (nilaiInvestasi < min) return false;
    if (max === null) return true;
    return row.derived_exclusive_max ? nilaiInvestasi < max : nilaiInvestasi <= max;
  });

  if (!match) {
    const overallMin = normalizedRows.reduce((currentMin, row) => {
      const value = row.derived_nilai_investasi_minimum;
      if (value === null) return currentMin;
      return currentMin === null ? value : Math.min(currentMin, value);
    }, null);
    const hasOpenEndedRange = normalizedRows.some(row => row.derived_nilai_investasi_maksimum === null);
    const overallMax = hasOpenEndedRange
      ? null
      : normalizedRows.reduce((currentMax, row) => {
          const value = row.derived_nilai_investasi_maksimum;
          if (value === null) return currentMax;
          return currentMax === null ? value : Math.max(currentMax, value);
        }, null);

    const referenceRow = {
      ...rows[0],
      derived_jangka_waktu: jangkaWaktu,
      derived_nilai_investasi_minimum: overallMin,
      derived_nilai_investasi_maksimum: overallMax,
      derived_summary: buildHolidayOutOfRangeSummary(rows[0], overallMin, overallMax, jangkaWaktu),
    };

    return res.json(formatTaxHoliday(referenceRow, 'out_of_range', kawasanIndustri));
  }

  res.json(formatTaxHoliday(match, 'success', kawasanIndustri));
}));

app.get('/api/tax-allowance/options', asyncHandler(async (req, res) => {
  const { provinsi, bidangUsaha, cakupanBidangUsaha, kategoriInvestasi } = req.query;
  const selectedKategoriInvestasi = kategoriInvestasi === 'Perluasan' ? 'Perluasan' : 'Baru';
  const table = 'tax_allowance_kbli_2025';
  const provinces = await distinctValues(table, 'lokasi', ['lokasi IS NOT NULL', "lokasi <> ''"]);
  const bidangUsahaOptions = provinsi
    ? await distinctValues(table, 'bidang_usaha_kbli_2025', ['lokasi = ?', 'bidang_usaha_kbli_2025 IS NOT NULL', "bidang_usaha_kbli_2025 <> ''"], [provinsi])
    : [];
  let cakupanOptions = [];
  if (provinsi && bidangUsaha) {
    const [rows] = await pool.execute(
      `SELECT DISTINCT COALESCE(NULLIF(cakupan, ''), ?) AS value
       FROM ${table}
       WHERE lokasi = ? AND bidang_usaha_kbli_2025 = ?
       ORDER BY value ASC`,
      [EMPTY_CAKUPAN_LABEL, provinsi, bidangUsaha]
    );
    cakupanOptions = rows.map(row => row.value).filter(Boolean);
  }

  let kawasanIndustri = [];
  let investmentCriteria = null;
  if (provinsi && bidangUsaha && cakupanBidangUsaha) {
    const isEmptyCakupan = cakupanBidangUsaha === EMPTY_CAKUPAN_LABEL;
    const [rows] = await pool.execute(
      `SELECT *
       FROM ${table}
       WHERE lokasi = ?
         AND bidang_usaha_kbli_2025 = ?
         AND ${isEmptyCakupan ? "(cakupan IS NULL OR cakupan = '')" : 'cakupan = ?'}
       ORDER BY id ASC`,
      isEmptyCakupan ? [provinsi, bidangUsaha] : [provinsi, bidangUsaha, cakupanBidangUsaha]
    );

    kawasanIndustri = uniqueStrings(rows.map(row => row.kawasan_industri));
    investmentCriteria = buildTaxAllowanceInvestmentCriteria(rows, selectedKategoriInvestasi);
  }

  res.json({
    provinces,
    bidangUsaha: bidangUsahaOptions,
    cakupanBidangUsaha: cakupanOptions,
    kawasanIndustri,
    investmentCriteria,
  });
}));

app.post('/api/tax-allowance/simulate', asyncHandler(async (req, res) => {
  const body = req.body || {};
  const provinsi = String(body.provinsi || '').trim();
  const bidangUsaha = String(body.bidangUsaha || '').trim();
  const cakupanBidangUsaha = String(body.cakupanBidangUsaha || '').trim();
  const kategoriInvestasi = body.kategoriInvestasi === 'Perluasan' ? 'Perluasan' : 'Baru';
  const nilaiInvestasi = Number(body.nilaiInvestasi || 0);

  if (!provinsi || !bidangUsaha || !cakupanBidangUsaha || !Number.isFinite(nilaiInvestasi)) {
    return res.status(400).json({ message: 'Parameter simulasi belum lengkap.' });
  }

  const [rows] = await pool.execute(
    `SELECT *
     FROM tax_allowance_kbli_2025
     WHERE lokasi = ?
       AND bidang_usaha_kbli_2025 = ?
       AND ${cakupanBidangUsaha === EMPTY_CAKUPAN_LABEL ? "(cakupan IS NULL OR cakupan = '')" : 'cakupan = ?'}
     ORDER BY id ASC`,
    cakupanBidangUsaha === EMPTY_CAKUPAN_LABEL
      ? [provinsi, bidangUsaha]
      : [provinsi, bidangUsaha, cakupanBidangUsaha]
  );

  if (!rows.length) {
    return res.json(formatTaxAllowance({
      lokasi: provinsi,
      bidang_usaha_kbli_2025: bidangUsaha,
      cakupan: cakupanBidangUsaha,
      summary: 'Data tidak ditemukan untuk kombinasi filter yang dipilih.',
      kawasanIndustri: [],
    }, 'error', kategoriInvestasi, '', 0));
  }

  const kawasanIndustri = uniqueStrings(rows.map(row => row.kawasan_industri));
  const candidateRows = rows.map(row => ({
    ...row,
    applicable_nilai_min_investasi: numberOrNull(
      kategoriInvestasi === 'Baru'
        ? row.nilai_min_investasi_baru
        : row.nilai_min_perluasan
    ),
  }));
  const sortedRows = candidateRows.sort((left, right) => {
    const leftMin = left.applicable_nilai_min_investasi ?? Number.MAX_SAFE_INTEGER;
    const rightMin = right.applicable_nilai_min_investasi ?? Number.MAX_SAFE_INTEGER;
    return leftMin - rightMin;
  });
  const referenceRow = sortedRows[0];
  const nilaiMinInvestasi = Number(referenceRow.applicable_nilai_min_investasi ?? 0);
  const status = nilaiInvestasi < nilaiMinInvestasi ? 'below_minimum' : 'success';

  res.json(formatTaxAllowance({
    ...referenceRow,
    kawasanIndustri,
    summary: buildTaxAllowanceSummary(referenceRow, kategoriInvestasi, kawasanIndustri),
  }, status, kategoriInvestasi, kawasanIndustri[0] ?? '', nilaiMinInvestasi));
}));

app.use((error, _req, res, _next) => {
  console.error(error);
  const statusCode = Number(error?.statusCode || error?.status || 500);
  res.status(statusCode).json({
    message: error.message || 'Terjadi kesalahan pada server.',
  });
});

const server = app.listen(port, host, async () => {
  const address = server.address();
  const activePort = typeof address === 'object' && address ? address.port : port;

  try {
    await writeRuntimeApiConfig(activePort);
  } catch (error) {
    console.error('Gagal menulis runtime API config:', error);
  }

  console.log(`Tax Simulator API running at http://${publicHost}:${activePort}`);
});

async function shutdown() {
  try {
    await writeRuntimeApiConfig(null);
  } catch (error) {
    console.error('Gagal mereset runtime API config:', error);
  }

  server.close(() => {
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown();
});

process.on('SIGTERM', () => {
  void shutdown();
});
