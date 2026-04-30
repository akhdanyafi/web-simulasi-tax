import crypto from 'crypto';
import { pool } from './db.mjs';

const TOKEN_SECRET = process.env.AUTH_SECRET || 'tax-simulator-local-secret';
const TOKEN_TTL_SECONDS = Number(process.env.AUTH_TOKEN_TTL_SECONDS || 60 * 60 * 8);
const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LENGTH = 64;

function base64Url(input) {
  return Buffer.from(input).toString('base64url');
}

function sign(value) {
  return crypto.createHmac('sha256', TOKEN_SECRET).update(value).digest('base64url');
}

export function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(password, salt, KEY_LENGTH, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  }).toString('hex');

  return `scrypt$${SCRYPT_N}$${SCRYPT_R}$${SCRYPT_P}$${salt}$${hash}`;
}

export function verifyPassword(password, storedHash) {
  const [scheme, n, r, p, salt, expectedHash] = String(storedHash || '').split('$');
  if (scheme !== 'scrypt' || !salt || !expectedHash) return false;

  const actualHash = crypto.scryptSync(password, salt, KEY_LENGTH, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  }).toString('hex');

  const actualBuffer = Buffer.from(actualHash, 'hex');
  const expectedBuffer = Buffer.from(expectedHash, 'hex');
  return actualBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(actualBuffer, expectedBuffer);
}

export function createToken(user) {
  const now = Math.floor(Date.now() / 1000);
  const header = base64Url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const payload = base64Url(JSON.stringify({
    sub: user.id,
    username: user.username,
    role: user.role,
    iat: now,
    exp: now + TOKEN_TTL_SECONDS,
  }));
  const unsigned = `${header}.${payload}`;
  return `${unsigned}.${sign(unsigned)}`;
}

export function verifyToken(token) {
  const parts = String(token || '').split('.');
  if (parts.length !== 3) return null;

  const [header, payload, signature] = parts;
  const unsigned = `${header}.${payload}`;
  const expected = sign(unsigned);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);
  if (signatureBuffer.length !== expectedBuffer.length || !crypto.timingSafeEqual(signatureBuffer, expectedBuffer)) return null;

  const decoded = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
  if (!decoded.exp || decoded.exp < Math.floor(Date.now() / 1000)) return null;
  return decoded;
}

export async function requireAuth(req, res, next) {
  try {
    const token = req.headers.authorization?.replace(/^Bearer\s+/i, '');
    const decoded = verifyToken(token);
    if (!decoded?.sub) {
      return res.status(401).json({ message: 'Sesi tidak valid. Silakan login ulang.' });
    }

    const [rows] = await pool.execute(
      'SELECT id, username, full_name, role, is_active FROM users WHERE id = ? AND is_active = 1',
      [decoded.sub]
    );
    const user = rows[0];
    if (!user) {
      return res.status(401).json({ message: 'User tidak ditemukan atau tidak aktif.' });
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}

export function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    fullName: user.full_name,
    role: user.role,
    isActive: Boolean(user.is_active),
    createdAt: user.created_at,
    lastLoginAt: user.last_login_at,
  };
}
