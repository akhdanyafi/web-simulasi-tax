import mysql from 'mysql2/promise';

export const dbConfig = {
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tax_simulator_features',
  waitForConnections: true,
  connectionLimit: Number(process.env.DB_CONNECTION_LIMIT || 10),
  namedPlaceholders: true,
  dateStrings: true,
  charset: 'utf8mb4',
};

export const pool = mysql.createPool(dbConfig);

export async function withoutDatabaseConnection() {
  return mysql.createConnection({
    ...dbConfig,
    database: undefined,
    multipleStatements: true,
  });
}

export async function pingDatabase() {
  const [rows] = await pool.query('SELECT 1 AS ok');
  return rows[0]?.ok === 1;
}
