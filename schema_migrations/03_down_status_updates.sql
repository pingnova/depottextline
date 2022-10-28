
DROP TABLE status_updates;

ALTER TABLE remote_numbers DROP COLUMN status;

UPDATE schemaversion SET version = 2;
