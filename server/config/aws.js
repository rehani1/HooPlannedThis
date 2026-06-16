import dotenv from 'dotenv';

dotenv.config();

const DEFAULT_EVENT_FILES_PREFIX = 'class-council-events';
const DEFAULT_UPLOAD_EXPIRES_SECONDS = 300;
const DEFAULT_DOWNLOAD_EXPIRES_SECONDS = 300;

function readEnv(name) {
  const value = process.env[name];
  return value && value.trim() ? value.trim() : undefined;
}

function parsePositiveInteger(name, defaultValue) {
  const rawValue = readEnv(name);
  if (!rawValue) return defaultValue;

  const value = Number(rawValue);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }

  return value;
}

function trimSlashes(value) {
  return String(value || '').replace(/^\/+|\/+$/g, '');
}

export function isProductionRuntime() {
  const environment = (
    readEnv('NODE_ENV') ||
    readEnv('APP_ENV') ||
    readEnv('ENVIRONMENT') ||
    ''
  ).toLowerCase();

  return environment === 'production';
}

export function getS3Config() {
  return {
    region: readEnv('AWS_REGION') || 'us-east-1',
    bucketName: readEnv('S3_BUCKET_NAME'),
    eventFilesPrefix: trimSlashes(readEnv('S3_EVENT_FILES_PREFIX') || DEFAULT_EVENT_FILES_PREFIX),
    uploadUrlExpiresSeconds: parsePositiveInteger(
      'S3_PRESIGNED_UPLOAD_EXPIRES_SECONDS',
      DEFAULT_UPLOAD_EXPIRES_SECONDS
    ),
    downloadUrlExpiresSeconds: parsePositiveInteger(
      'S3_PRESIGNED_DOWNLOAD_EXPIRES_SECONDS',
      DEFAULT_DOWNLOAD_EXPIRES_SECONDS
    ),
    endpointUrl: readEnv('AWS_ENDPOINT_URL'),
  };
}

export function getS3ClientConfig() {
  const config = getS3Config();
  const clientConfig = {
    region: config.region,
  };

  if (config.endpointUrl) {
    clientConfig.endpoint = config.endpointUrl;
    clientConfig.forcePathStyle = true;
  }

  return clientConfig;
}

export function validateS3ConfigForStartup() {
  if (!isProductionRuntime()) return;

  const missing = [];

  if (!readEnv('AWS_REGION')) missing.push('AWS_REGION');
  if (!readEnv('S3_BUCKET_NAME')) missing.push('S3_BUCKET_NAME');
  if (!readEnv('S3_EVENT_FILES_PREFIX')) missing.push('S3_EVENT_FILES_PREFIX');

  if (missing.length) {
    throw new Error(`Missing required production S3 environment variable(s): ${missing.join(', ')}`);
  }
}

export function requireS3BucketName() {
  const config = getS3Config();
  if (!config.bucketName) {
    const err = new Error('S3_BUCKET_NAME is not configured; set S3_BUCKET_NAME in the server environment.');
    err.status = 500;
    throw err;
  }

  return config.bucketName;
}

export function getS3ConfigSummary() {
  const config = getS3Config();
  return {
    region: config.region,
    bucketConfigured: Boolean(config.bucketName),
    eventFilesPrefix: config.eventFilesPrefix,
    uploadUrlExpiresSeconds: config.uploadUrlExpiresSeconds,
    downloadUrlExpiresSeconds: config.downloadUrlExpiresSeconds,
    customEndpointConfigured: Boolean(config.endpointUrl),
  };
}
