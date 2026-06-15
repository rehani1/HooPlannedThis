-- Adds event-level volunteer capacity while preserving individual signups in VolunteerSignup.
SET @column_exists := (
  SELECT COUNT(*)
    FROM INFORMATION_SCHEMA.COLUMNS
   WHERE TABLE_SCHEMA = DATABASE()
     AND TABLE_NAME = 'CouncilEvent'
     AND COLUMN_NAME = 'volunteer_slots'
);

SET @ddl := IF(
  @column_exists = 0,
  'ALTER TABLE CouncilEvent ADD COLUMN volunteer_slots INT NOT NULL DEFAULT 0 AFTER status',
  'SELECT 1'
);

PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
