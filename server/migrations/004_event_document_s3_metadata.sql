-- Adds explicit S3 metadata for event documents while preserving existing file_url keys.

SET @column_exists := (
  SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'EventDocument'
     AND COLUMN_NAME = 's3_bucket'
);
SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE EventDocument ADD COLUMN s3_bucket VARCHAR(255) NULL AFTER uploaded_by',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'EventDocument'
     AND COLUMN_NAME = 's3_key'
);
SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE EventDocument ADD COLUMN s3_key VARCHAR(700) NULL AFTER s3_bucket',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

UPDATE EventDocument
   SET s3_key = file_url
 WHERE s3_key IS NULL
   AND file_url IS NOT NULL;

ALTER TABLE EventDocument
  MODIFY COLUMN s3_key VARCHAR(700) NOT NULL;

ALTER TABLE EventDocument
  MODIFY COLUMN file_url VARCHAR(700) NOT NULL;

SET @column_exists := (
  SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'EventDocument'
     AND COLUMN_NAME = 'original_filename'
);
SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE EventDocument ADD COLUMN original_filename VARCHAR(255) NULL AFTER file_url',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'EventDocument'
     AND COLUMN_NAME = 'content_type'
);
SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE EventDocument ADD COLUMN content_type VARCHAR(160) NULL AFTER original_filename',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'EventDocument'
     AND COLUMN_NAME = 'file_size_bytes'
);
SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE EventDocument ADD COLUMN file_size_bytes BIGINT UNSIGNED NULL AFTER content_type',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'EventDocument'
     AND COLUMN_NAME = 'file_category'
);
SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE EventDocument ADD COLUMN file_category ENUM(''flyer'', ''contract'', ''receipt'', ''budget'', ''promo'', ''other'') NOT NULL DEFAULT ''other'' AFTER file_size_bytes',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'EventDocument'
     AND COLUMN_NAME = 'visibility'
);
SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE EventDocument ADD COLUMN visibility ENUM(''private'', ''committee'', ''council'') NOT NULL DEFAULT ''private'' AFTER file_category',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @column_exists := (
  SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'EventDocument'
     AND COLUMN_NAME = 'updated_at'
);
SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE EventDocument ADD COLUMN updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER uploaded_at',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists := (
  SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'EventDocument'
     AND INDEX_NAME = 'idx_event_document_event_uploaded'
);
SET @ddl := IF(
  @index_exists = 0,
  'CREATE INDEX idx_event_document_event_uploaded ON EventDocument (event_id, uploaded_at)',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @index_exists := (
  SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.STATISTICS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'EventDocument'
     AND INDEX_NAME = 'idx_event_document_uploaded_by'
);
SET @ddl := IF(
  @index_exists = 0,
  'CREATE INDEX idx_event_document_uploaded_by ON EventDocument (uploaded_by)',
  'SELECT 1'
);
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

