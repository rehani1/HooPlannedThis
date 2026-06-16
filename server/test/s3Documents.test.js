import assert from 'node:assert/strict';
import { afterEach, describe, test } from 'node:test';

process.env.AWS_REGION = 'us-east-1';
process.env.S3_BUCKET_NAME = 'test-bucket';
process.env.S3_EVENT_FILES_PREFIX = 'test-prefix';
process.env.S3_PRESIGNED_UPLOAD_EXPIRES_SECONDS = '123';
process.env.S3_PRESIGNED_DOWNLOAD_EXPIRES_SECONDS = '45';

const s3Documents = await import('../s3Documents.js');
const awsConfig = await import('../config/aws.js');

const ENV_KEYS = [
  'NODE_ENV',
  'APP_ENV',
  'ENVIRONMENT',
  'AWS_REGION',
  'S3_BUCKET_NAME',
  'S3_EVENT_FILES_PREFIX',
  'S3_PRESIGNED_UPLOAD_EXPIRES_SECONDS',
  'S3_PRESIGNED_DOWNLOAD_EXPIRES_SECONDS',
  'AWS_ENDPOINT_URL',
];

function withEnv(values, callback) {
  const previous = new Map(ENV_KEYS.map(key => [key, process.env[key]]));

  for (const [key, value] of Object.entries(values)) {
    if (value === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = value;
    }
  }

  try {
    return callback();
  } finally {
    for (const [key, value] of previous.entries()) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  }
}

afterEach(() => {
  s3Documents.resetS3DocumentTestHooks();
});

describe('S3 configuration', () => {
  test('production startup validation reports missing required S3 env vars', () => {
    withEnv({
      NODE_ENV: 'production',
      APP_ENV: undefined,
      ENVIRONMENT: undefined,
      AWS_REGION: undefined,
      S3_BUCKET_NAME: undefined,
      S3_EVENT_FILES_PREFIX: undefined,
    }, () => {
      assert.throws(
        () => awsConfig.validateS3ConfigForStartup(),
        /AWS_REGION, S3_BUCKET_NAME, S3_EVENT_FILES_PREFIX/
      );
    });
  });

  test('S3 config trims prefixes and includes optional local endpoint settings', () => {
    withEnv({
      AWS_REGION: 'us-west-2',
      S3_BUCKET_NAME: 'bucket',
      S3_EVENT_FILES_PREFIX: '/nested/prefix/',
      AWS_ENDPOINT_URL: 'http://localhost:4566',
    }, () => {
      assert.deepEqual(awsConfig.getS3Config(), {
        region: 'us-west-2',
        bucketName: 'bucket',
        eventFilesPrefix: 'nested/prefix',
        uploadUrlExpiresSeconds: 123,
        downloadUrlExpiresSeconds: 45,
        endpointUrl: 'http://localhost:4566',
      });

      assert.deepEqual(awsConfig.getS3ClientConfig(), {
        region: 'us-west-2',
        endpoint: 'http://localhost:4566',
        forcePathStyle: true,
      });
    });
  });
});

describe('S3 document validation and key generation', () => {
  test('document keys stay under the configured prefix and sanitize filenames', () => {
    const key = s3Documents.buildDocumentKey({
      councilYearId: 1,
      committeeId: 2,
      eventId: 3,
      filename: '../../evil file<script>.pdf',
    });

    assert.match(
      key,
      /^test-prefix\/council-years\/1\/committees\/2\/events\/3\/documents\/[0-9a-f-]{36}\/evil-file-script-.pdf$/
    );
    assert.equal(key.includes('..'), false);
    assert.equal(key.includes('<'), false);
    assert.equal(key.includes(' '), false);
  });

  test('receipt keys stay under the event receipt prefix', () => {
    const key = s3Documents.buildReceiptKey({
      councilYearId: 1,
      committeeId: 2,
      eventId: 3,
      expenseId: 4,
      filename: 'receipt.pdf',
    });

    assert.match(
      key,
      /^test-prefix\/council-years\/1\/committees\/2\/events\/3\/receipts\/4\/[0-9a-f-]{36}\/receipt.pdf$/
    );
  });

  test('profile photo keys sanitize computing IDs and filenames', () => {
    const key = s3Documents.buildProfilePhotoKey({
      computingId: '../abc 123',
      filename: '../avatar.png',
    });

    assert.match(key, /^profiles\/abc-123\/photos\/[0-9a-f-]{36}\/avatar.png$/);
    assert.equal(key.includes('..'), false);
  });

  test('upload validation rejects missing filename, unsupported type, and invalid size', () => {
    assert.throws(
      () => s3Documents.validateUpload({ filename: '', contentType: 'application/pdf', size: 1 }),
      /Filename is required/
    );
    assert.throws(
      () => s3Documents.validateUpload({ filename: 'x.html', contentType: 'text/html', size: 1 }),
      /File type is not allowed/
    );
    assert.throws(
      () => s3Documents.validateUpload({ filename: 'x.pdf', contentType: 'application/pdf', size: 0 }),
      /between 1 byte and 10 MB/
    );

    assert.doesNotThrow(() => {
      s3Documents.validateUpload({
        filename: 'budget.pdf',
        contentType: 'application/pdf',
        size: 1024,
      });
    });
  });
});

describe('mocked S3 operations', () => {
  test('upload and download presigned URLs use mocked signer without AWS credentials', async () => {
    const observed = [];
    s3Documents.setS3DocumentTestHooks({
      s3Client: { marker: 'mock-client' },
      createSignedUrl: async (client, command, options) => {
        observed.push({ client, command, options });
        return `mock://${command.constructor.name}`;
      },
    });

    assert.equal(
      await s3Documents.createUploadUrl({
        key: 'test-prefix/documents/a.pdf',
        contentType: 'application/pdf',
      }),
      'mock://PutObjectCommand'
    );
    assert.equal(
      await s3Documents.createDownloadUrl('test-prefix/documents/a.pdf'),
      'mock://GetObjectCommand'
    );

    assert.equal(observed[0].client.marker, 'mock-client');
    assert.equal(observed[0].command.constructor.name, 'PutObjectCommand');
    assert.deepEqual(observed[0].command.input, {
      Bucket: 'test-bucket',
      Key: 'test-prefix/documents/a.pdf',
      ContentType: 'application/pdf',
    });
    assert.deepEqual(observed[0].options, { expiresIn: 123 });

    assert.equal(observed[1].command.constructor.name, 'GetObjectCommand');
    assert.deepEqual(observed[1].command.input, {
      Bucket: 'test-bucket',
      Key: 'test-prefix/documents/a.pdf',
    });
    assert.deepEqual(observed[1].options, { expiresIn: 45 });
  });

  test('bucket readiness and delete operations use mocked S3 client send', async () => {
    const sent = [];
    s3Documents.setS3DocumentTestHooks({
      s3Client: {
        async send(command) {
          sent.push(command);
          return {};
        },
      },
    });

    await s3Documents.checkS3BucketAccess();
    await s3Documents.deleteDocumentObject('test-prefix/documents/a.pdf');

    assert.equal(sent[0].constructor.name, 'ListObjectsV2Command');
    assert.deepEqual(sent[0].input, {
      Bucket: 'test-bucket',
      Prefix: 'test-prefix/',
      MaxKeys: 1,
    });

    assert.equal(sent[1].constructor.name, 'DeleteObjectCommand');
    assert.deepEqual(sent[1].input, {
      Bucket: 'test-bucket',
      Key: 'test-prefix/documents/a.pdf',
    });
  });
});

describe('safe S3 error summaries', () => {
  test('classifies common AWS failures without returning credential-bearing details', () => {
    const fields = s3Documents.getS3ErrorLogFields({
      name: 'AccessDenied',
      message: 'Credential should not be copied to logs',
      $metadata: { httpStatusCode: 403 },
    });

    assert.deepEqual(fields, {
      category: 'access_denied',
      code: 'AccessDenied',
      status: 403,
    });
    assert.equal(JSON.stringify(fields).includes('Credential should not be copied'), false);
    assert.match(
      s3Documents.describeS3Error({ name: 'CredentialsProviderError' }),
      /AWS credentials could not be resolved/
    );
  });
});
