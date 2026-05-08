const path = require('path');
const dotenv = require('dotenv');

if (process.env.NODE_ENV !== 'test') {
  dotenv.config();
}

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function toList(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
}

const NODE_ENV = process.env.NODE_ENV || 'development';
const JWT_SECRET = process.env.JWT_SECRET || (NODE_ENV === 'production' ? '' : 'safeher-local-development-secret-change-me');

if (NODE_ENV === 'production' && JWT_SECRET.length < 32) {
  throw new Error('JWT_SECRET must be set to a strong 32+ character secret in production.');
}

const env = {
  PORT: toNumber(process.env.PORT, 5000),
  NODE_ENV,
  JWT_SECRET,
  JWT_EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  DB_PATH: path.resolve(process.cwd(), process.env.DB_PATH || './src/db/safeher.sqlite'),
  UPLOAD_DIR: path.resolve(process.cwd(), process.env.UPLOAD_DIR || './uploads'),
  APP_BASE_URL: process.env.APP_BASE_URL || `http://localhost:${process.env.PORT || 5000}`,
  CLIENT_APP_URL: process.env.CLIENT_APP_URL || 'http://localhost:8081',
  CORS_ORIGINS: toList(process.env.CORS_ORIGINS),
  JSON_BODY_LIMIT: process.env.JSON_BODY_LIMIT || '1mb',
  UPLOAD_FILE_SIZE_MB: toNumber(process.env.UPLOAD_FILE_SIZE_MB, 5),
  BCRYPT_ROUNDS: toNumber(process.env.BCRYPT_ROUNDS, 10),
  GLOBAL_RATE_LIMIT_PER_MINUTE: toNumber(process.env.GLOBAL_RATE_LIMIT_PER_MINUTE, 180),
};

module.exports = { env };
