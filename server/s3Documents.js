import {
  DeleteObjectCommand,
  GetObjectCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';
import {
  getS3ClientConfig,
  getS3Config,
  requireS3BucketName,
} from './config/aws.js';

const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/webp',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const ALLOWED_IMAGE_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
]);

let s3 = new S3Client(getS3ClientConfig());
let signedUrlFactory = getSignedUrl;

export function setS3DocumentTestHooks({ s3Client, createSignedUrl } = {}) {
  if (s3Client) s3 = s3Client;
  if (createSignedUrl) signedUrlFactory = createSignedUrl;
}

export function resetS3DocumentTestHooks() {
  s3 = new S3Client(getS3ClientConfig());
  signedUrlFactory = getSignedUrl;
}

function getS3ErrorCode(err) {
  return err?.name || err?.Code || err?.code || 'UnknownS3Error';
}

function classifyS3Error(err) {
  const code = getS3ErrorCode(err);
  const status = err?.$metadata?.httpStatusCode;
  const message = String(err?.message || '');

  if (message.includes('S3_BUCKET_NAME is not configured')) return 'missing_config';
  if (code === 'CredentialsProviderError' || message.includes('Could not load credentials')) {
    return 'aws_credentials';
  }
  if (code === 'AccessDenied' || code === 'Forbidden' || status === 403) return 'access_denied';
  if (code === 'NoSuchBucket' || code === 'NotFound' || status === 404) return 'bucket_not_found';
  if (
    code === 'PermanentRedirect' ||
    code === 'AuthorizationHeaderMalformed' ||
    code === 'IllegalLocationConstraintException' ||
    status === 301
  ) {
    return 'wrong_region';
  }
  if (
    code === 'ENOTFOUND' ||
    code === 'EAI_AGAIN' ||
    code === 'ECONNREFUSED' ||
    code === 'ETIMEDOUT' ||
    code === 'TimeoutError' ||
    code === 'NetworkingError'
  ) {
    return 'network';
  }
  if (err?.$metadata || err?.$fault) return 's3_service';

  return 'unknown';
}

export function getS3ErrorLogFields(err) {
  const category = classifyS3Error(err);
  if (category === 'unknown') return null;

  return {
    category,
    code: getS3ErrorCode(err),
    status: err?.$metadata?.httpStatusCode,
  };
}

export function describeS3Error(err) {
  switch (classifyS3Error(err)) {
    case 'missing_config':
      return 'S3 bucket is not configured. Check S3_BUCKET_NAME in the server environment.';
    case 'aws_credentials':
      return 'AWS credentials could not be resolved. Check the EC2 IAM role or local AWS credential provider.';
    case 'access_denied':
      return 'S3 bucket access was denied. Check the EC2 IAM role policy for the configured bucket and prefix.';
    case 'bucket_not_found':
      return 'S3 bucket was not found. Check S3_BUCKET_NAME and the target AWS account.';
    case 'wrong_region':
      return 'S3 bucket is in a different region. Check AWS_REGION and the bucket region.';
    case 'network':
      return 'S3 network connection failed. Check VPC, DNS, endpoint, and internet or VPC endpoint access.';
    case 's3_service':
      return 'S3 service request failed. Check the server logs for the safe S3 error code.';
    default:
      return 'S3 check failed. Check server logs for the safe S3 error code.';
  }
}

function safeFilename(filename) {
  const base = path.basename(String(filename || 'document'));
  return base
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120) || 'document';
}

export function validateUpload({ filename, contentType, size }) {
  if (!String(filename || '').trim()) {
    const err = new Error('Filename is required');
    err.status = 400;
    throw err;
  }

  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    const err = new Error('File type is not allowed');
    err.status = 400;
    throw err;
  }

  const parsedSize = Number(size);
  if (!Number.isInteger(parsedSize) || parsedSize <= 0 || parsedSize > MAX_UPLOAD_BYTES) {
    const err = new Error('File size must be between 1 byte and 10 MB');
    err.status = 400;
    throw err;
  }
}

export function validateProfilePhotoUpload({ contentType, size }) {
  if (!ALLOWED_IMAGE_TYPES.has(contentType)) {
    const err = new Error('Profile photo must be PNG, JPEG, or WebP');
    err.status = 400;
    throw err;
  }

  const parsedSize = Number(size);
  if (!Number.isInteger(parsedSize) || parsedSize <= 0 || parsedSize > MAX_PROFILE_PHOTO_BYTES) {
    const err = new Error('Profile photo size must be between 1 byte and 5 MB');
    err.status = 400;
    throw err;
  }
}

export function buildDocumentKey({ councilYearId, committeeId, eventId, filename }) {
  const randomId = crypto.randomUUID();
  const { eventFilesPrefix } = getS3Config();
  return [
    eventFilesPrefix,
    `council-years/${Number(councilYearId)}`,
    `committees/${Number(committeeId)}`,
    `events/${Number(eventId)}`,
    `documents/${randomId}`,
    safeFilename(filename),
  ].join('/');
}

export function buildProfilePhotoKey({ computingId, filename }) {
  const randomId = crypto.randomUUID();
  return [
    `profiles/${safeFilename(computingId)}`,
    `photos/${randomId}`,
    safeFilename(filename),
  ].join('/');
}

export function buildReceiptKey({ councilYearId, committeeId, eventId, expenseId, filename }) {
  const randomId = crypto.randomUUID();
  const { eventFilesPrefix } = getS3Config();
  return [
    eventFilesPrefix,
    `council-years/${Number(councilYearId)}`,
    `committees/${Number(committeeId)}`,
    `events/${Number(eventId)}`,
    `receipts/${Number(expenseId)}`,
    randomId,
    safeFilename(filename),
  ].join('/');
}

export async function createUploadUrl({ key, contentType }) {
  const { uploadUrlExpiresSeconds } = getS3Config();
  const command = new PutObjectCommand({
    Bucket: requireS3BucketName(),
    Key: key,
    ContentType: contentType,
  });

  return signedUrlFactory(s3, command, { expiresIn: uploadUrlExpiresSeconds });
}

export async function createDownloadUrl(key) {
  const { downloadUrlExpiresSeconds } = getS3Config();
  const command = new GetObjectCommand({
    Bucket: requireS3BucketName(),
    Key: key,
  });

  return signedUrlFactory(s3, command, { expiresIn: downloadUrlExpiresSeconds });
}

export async function deleteDocumentObject(key) {
  const command = new DeleteObjectCommand({
    Bucket: requireS3BucketName(),
    Key: key,
  });

  await s3.send(command);
}

export async function checkS3BucketAccess() {
  const { eventFilesPrefix } = getS3Config();
  const command = new ListObjectsV2Command({
    Bucket: requireS3BucketName(),
    Prefix: eventFilesPrefix ? `${eventFilesPrefix}/` : undefined,
    MaxKeys: 1,
  });

  await s3.send(command);
  return true;
}

export function getUploadUrlExpiresSeconds() {
  return getS3Config().uploadUrlExpiresSeconds;
}

export function getDownloadUrlExpiresSeconds() {
  return getS3Config().downloadUrlExpiresSeconds;
}
