# Deployment

The EC2 service is `hooplannedthis-api`. It runs the Express API from `server/` and serves the built React client from `client/dist`.

## Required Env

Use placeholders in source control. Production values live on EC2 in `/etc/hooplannedthis/api.env`.

```text
PORT=4000
JWT_SECRET=<secret>
ADMIN_USERNAME=admin
ADMIN_PASSWORD=<secret>
CORS_ORIGINS=http://52.90.160.103:4000

DB_HOST=<rds-endpoint>
DB_PORT=3306
DB_NAME=<database-name>
DB_USER=<database-user>
DB_PASSWORD=<database-password>
DB_CONNECTION_LIMIT=10
DB_SSL_MODE=required
DB_SSL_CA_PATH=/etc/ssl/rds/global-bundle.pem

AWS_REGION=us-east-1
S3_BUCKET_NAME=class-council-uploads
S3_EVENT_FILES_PREFIX=class-council-events
S3_PRESIGNED_UPLOAD_EXPIRES_SECONDS=300
S3_PRESIGNED_DOWNLOAD_EXPIRES_SECONDS=300
```

## EC2 Secrets

The systemd service loads:

```ini
[Service]
EnvironmentFile=/etc/hooplannedthis/api.env
```

The env file should be owned by `root:root` and mode `600`. Do not keep production secrets in `server/.env` on EC2.

## S3 IAM

EC2 should use an instance role, not AWS keys. The current role is `instanceRole`.

Minimum S3 policy shape:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
      "Resource": [
        "arn:aws:s3:::class-council-uploads/class-council-events/*",
        "arn:aws:s3:::class-council-uploads/profiles/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": "s3:ListBucket",
      "Resource": "arn:aws:s3:::class-council-uploads",
      "Condition": {
        "StringLike": {
          "s3:prefix": ["class-council-events/*"]
        }
      }
    }
  ]
}
```

## Deploy

```bash
cd server
npm ci
npm test

cd ../client
npm ci
npm run build

sudo systemctl restart hooplannedthis-api
```

Apply database migrations in order from a machine that can reach RDS:

```bash
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" < server/migrations/001_erd_schema.sql
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" < server/migrations/002_account_requests.sql
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" < server/migrations/003_event_volunteer_slots.sql
mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" -p "$DB_NAME" < server/migrations/004_event_document_s3_metadata.sql
```

## Verify

```bash
curl http://localhost:4000/api/health
curl http://localhost:4000/api/readiness
```

Expected readiness:

```json
{"status":"ok","checks":{"database":{"status":"ok"},"s3":{"status":"ok","region":"us-east-1","bucket":"configured","eventFilesPrefix":"class-council-events"}}}
```

Public app URL:

```text
http://52.90.160.103:4000
```
