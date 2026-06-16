# Security

## Private S3 Documents

Event documents and receipts are stored in the private S3 bucket:

```text
S3_BUCKET_NAME=class-council-uploads
S3_EVENT_FILES_PREFIX=class-council-events
```

Objects are addressed by server-generated keys such as:

```text
class-council-events/council-years/{council_year_id}/committees/{committee_id}/events/{event_id}/documents/{uuid}/{safe_filename}
```

The S3 key is not authorization. The backend must check the logged-in user against the event's council year and committee before creating upload URLs, listing files, creating download URLs, updating metadata, or deleting files.

Allowed document managers:

- executive members for the event council year
- committee leads for the event committee

## Presigned URLs

- Upload and download URLs are short-lived.
- The bucket stays private.
- Do not store or expose permanent public S3 URLs.
- Do not log presigned URLs, AWS signing parameters, JWTs, DB passwords, or private keys.

## Runtime Secrets

Production secrets are loaded from:

```text
/etc/hooplannedthis/api.env
```

The file should be `root:root` and mode `600`, loaded by systemd through `EnvironmentFile`.

Never commit:

- `JWT_SECRET`
- `ADMIN_PASSWORD`
- `DB_PASSWORD`
- AWS access keys or session tokens
- private keys

EC2 should use the IAM instance role for S3 access. Do not configure static AWS keys in production.

## S3 Permissions

The EC2 role should be limited to:

- `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `class-council-uploads/class-council-events/*`
- `s3:PutObject`, `s3:GetObject`, `s3:DeleteObject` on `class-council-uploads/profiles/*`
- `s3:ListBucket` on `class-council-uploads` scoped to `class-council-events/*`

Keep S3 block-public-access enabled.
