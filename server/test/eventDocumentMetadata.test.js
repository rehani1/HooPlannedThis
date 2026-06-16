import assert from 'node:assert/strict';
import { after, describe, test } from 'node:test';

process.env.DB_HOST = process.env.DB_HOST || 'localhost';
process.env.DB_PORT = process.env.DB_PORT || '3306';
process.env.DB_NAME = process.env.DB_NAME || 'test';
process.env.DB_USER = process.env.DB_USER || 'test';
process.env.DB_PASSWORD = process.env.DB_PASSWORD || 'test';
process.env.DB_SSL_MODE = process.env.DB_SSL_MODE || 'disabled';

const { normalizeEventDocument } = await import('../models/event.js');
const { default: pool } = await import('../db.js');

after(async () => {
  await new Promise(resolve => pool.end(resolve));
});

describe('event document metadata validation', () => {
  test('defaults category and visibility for valid document metadata', () => {
    assert.deepEqual(
      normalizeEventDocument({
        documentName: 'Budget',
        documentType: 'application/pdf',
        key: 'test-prefix/documents/budget.pdf',
        contentType: 'application/pdf',
        fileSizeBytes: 2048,
      }),
      {
        documentName: 'Budget',
        documentType: 'application/pdf',
        fileUrl: 'test-prefix/documents/budget.pdf',
        s3Bucket: null,
        s3Key: 'test-prefix/documents/budget.pdf',
        originalFilename: 'Budget',
        contentType: 'application/pdf',
        fileSizeBytes: 2048,
        fileCategory: 'other',
        visibility: 'private',
      }
    );
  });

  test('rejects invalid category, visibility, and file size', () => {
    const baseDocument = {
      documentName: 'Contract',
      documentType: 'application/pdf',
      key: 'test-prefix/documents/contract.pdf',
    };

    assert.throws(
      () => normalizeEventDocument({ ...baseDocument, fileCategory: 'secret' }),
      /Document file category is not allowed/
    );
    assert.throws(
      () => normalizeEventDocument({ ...baseDocument, visibility: 'public' }),
      /Document visibility is not allowed/
    );
    assert.throws(
      () => normalizeEventDocument({ ...baseDocument, fileSizeBytes: -1 }),
      /Document file size must be a non-negative whole number/
    );
  });
});
