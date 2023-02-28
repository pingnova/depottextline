


ALTER TABLE accounts DROP COLUMN presence_path;
ALTER TABLE accounts DROP COLUMN presence_active;
ALTER TABLE accounts DROP COLUMN last_presence;

UPDATE schemaversion SET version = 4;


