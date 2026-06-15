import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import crypto from 'crypto';
import path from 'path';

const AWS_REGION = process.env.AWS_REGION || 'us-east-1';
const S3_BUCKET_NAME = process.env.S3_BUCKET_NAME;
const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;
const MAX_PROFILE_PHOTO_BYTES = 5 * 1024 * 1024;
const UPLOAD_URL_SECONDS = 300;
const DOWNLOAD_URL_SECONDS = 300;

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

const s3 = new S3Client({ region: AWS_REGION });

function requireBucket() {
  if (!S3_BUCKET_NAME) {
    const err = new Error('S3_BUCKET_NAME is not configured');
    err.status = 500;
    throw err;
  }
  return S3_BUCKET_NAME;
}

function safeFilename(filename) {
  const base = path.basename(String(filename || 'document'));
  return base
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 120) || 'document';
}

export function validateUpload({ contentType, size }) {
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
  return [
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

export async function createUploadUrl({ key, contentType }) {
  const command = new PutObjectCommand({
    Bucket: requireBucket(),
    Key: key,
    ContentType: contentType,
  });

  return getSignedUrl(s3, command, { expiresIn: UPLOAD_URL_SECONDS });
}

export async function createDownloadUrl(key) {
  const command = new GetObjectCommand({
    Bucket: requireBucket(),
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: DOWNLOAD_URL_SECONDS });
}

export async function deleteDocumentObject(key) {
  const command = new DeleteObjectCommand({
    Bucket: requireBucket(),
    Key: key,
  });

  await s3.send(command);
}
