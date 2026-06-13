import mysql from 'mysql2'
import dotenv from 'dotenv'
import fs from 'fs'
import { promisify } from 'util'
dotenv.config()

function readEnv(name) {
  const value = process.env[name]
  return value && value.trim() ? value.trim() : undefined
}

function getRequiredEnv(name, aliases = []) {
  const value = readEnv(name)
  if (value) return value

  for (const alias of aliases) {
    const aliasValue = readEnv(alias)
    if (aliasValue) {
      console.warn(`[db] ${alias} is deprecated; use ${name} instead.`)
      return aliasValue
    }
  }

  throw new Error(`Missing required database environment variable: ${name}`)
}

function parsePositiveInteger(name, defaultValue) {
  const rawValue = readEnv(name)
  if (!rawValue) return defaultValue

  const value = Number(rawValue)
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`)
  }

  return value
}

function buildSslConfig() {
  const sslMode = (readEnv('DB_SSL_MODE') || 'disabled').toLowerCase()
  const disabledModes = new Set(['disabled', 'disable', 'false', 'off', '0'])
  const requiredModes = new Set(['required', 'require', 'verify-ca'])

  if (disabledModes.has(sslMode)) return false
  if (!requiredModes.has(sslMode)) {
    throw new Error('DB_SSL_MODE must be one of: disabled, required, verify-ca')
  }

  const ssl = { rejectUnauthorized: true }
  const caPath = readEnv('DB_SSL_CA_PATH')

  if (caPath) {
    try {
      ssl.ca = fs.readFileSync(caPath)
    } catch {
      throw new Error('DB_SSL_CA_PATH is set but the certificate file could not be read')
    }
  }

  return ssl
}

const dbConfig = {
  host: getRequiredEnv('DB_HOST'),
  port: parsePositiveInteger('DB_PORT', 3306),
  user: getRequiredEnv('DB_USER'),
  password: getRequiredEnv('DB_PASSWORD', ['DB_PASS']),
  database: getRequiredEnv('DB_NAME'),
  connectionLimit: parsePositiveInteger('DB_CONNECTION_LIMIT', 10),
  ssl: buildSslConfig(),
}

const pool = mysql.createPool(dbConfig)

pool.query = promisify(pool.query).bind(pool)

pool.getConnection = promisify(pool.getConnection).bind(pool)

export function getDatabaseConfigSummary() {
  return {
    host: dbConfig.host,
    port: dbConfig.port,
    database: dbConfig.database,
    connectionLimit: dbConfig.connectionLimit,
    sslMode: dbConfig.ssl ? readEnv('DB_SSL_MODE') || 'required' : 'disabled',
  }
}

export async function checkDatabaseConnection() {
  const rows = await pool.query('SELECT 1 AS ok')
  return rows[0]?.ok === 1
}

export function describeDatabaseError(err) {
  switch (err?.code) {
    case 'ENOTFOUND':
    case 'EAI_AGAIN':
      return 'Database host could not be resolved. Check DB_HOST and DNS/VPC configuration.'
    case 'ECONNREFUSED':
    case 'ETIMEDOUT':
    case 'PROTOCOL_SEQUENCE_TIMEOUT':
    case 'PROTOCOL_CONNECTION_LOST':
      return 'Database network connection failed. Check RDS security groups, subnets, port, and DB_HOST.'
    case 'ER_ACCESS_DENIED_ERROR':
      return 'Database authentication failed. Check DB_USER and DB_PASSWORD.'
    case 'ER_NOT_SUPPORTED_AUTH_MODE':
      return 'Database authentication plugin is not supported by the configured MySQL client.'
    case 'ER_BAD_DB_ERROR':
      return 'Database name was not found. Check DB_NAME.'
    case 'HANDSHAKE_NO_SSL_SUPPORT':
    case 'HANDSHAKE_SSL_ERROR':
    case 'DEPTH_ZERO_SELF_SIGNED_CERT':
    case 'UNABLE_TO_VERIFY_LEAF_SIGNATURE':
    case 'CERT_HAS_EXPIRED':
    case 'ERR_TLS_CERT_ALTNAME_INVALID':
      return 'Database TLS connection failed. Check DB_SSL_MODE and DB_SSL_CA_PATH.'
    case 'ER_CON_COUNT_ERROR':
    case 'POOL_CONNLIMIT':
      return 'Database connection limit was reached. Check DB_CONNECTION_LIMIT and RDS max connections.'
    default:
      return 'Database operation failed. Check server logs for the database error code.'
  }
}

export default pool
