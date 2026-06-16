import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
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

const s3 = new S3Client(getS3ClientConfig());

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

  return getSignedUrl(s3, command, { expiresIn: uploadUrlExpiresSeconds });
}

export async function createDownloadUrl(key) {
  const { downloadUrlExpiresSeconds } = getS3Config();
  const command = new GetObjectCommand({
    Bucket: requireS3BucketName(),
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn: downloadUrlExpiresSeconds });
}

export async function deleteDocumentObject(key) {
  const command = new DeleteObjectCommand({
    Bucket: requireS3BucketName(),
    Key: key,
  });

  await s3.send(command);
}

export function getUploadUrlExpiresSeconds() {
  return getS3Config().uploadUrlExpiresSeconds;
}

export function getDownloadUrlExpiresSeconds() {
  return getS3Config().downloadUrlExpiresSeconds;
}
