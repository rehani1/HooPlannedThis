# HooPlannedThis

Event planning app for UVA Class Council. The app has a Vite/React client, an Express API, MySQL/RDS storage, and private S3-backed event documents.

## Structure

- `client/`: React frontend.
- `server/`: Express API and MySQL models.
- `server/migrations/`: database schema and migrations.
- `docs/DEPLOYMENT.md`: production deploy notes.
- `SECURITY.md`: S3, IAM, and secrets guidance.

## Local Setup

```bash
cp server/.env.example server/.env
cp client/.env.example client/.env

cd server
npm install
npm start
```

In another terminal:

```bash
cd client
npm install
npm run dev
```

Do not commit real `.env` files.

## Checks

```bash
cd server
npm test

cd ../client
npm run build
```

Server tests mock AWS S3 calls and do not require real AWS credentials.

## Event Documents

Event documents and receipts are private S3 objects. RDS stores metadata, and the API issues short-lived presigned upload/download URLs after authorization.

Production uses:

```text
S3_BUCKET_NAME=class-council-uploads
S3_EVENT_FILES_PREFIX=class-council-events
```
