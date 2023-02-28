


ALTER TABLE accounts ADD COLUMN presence_path TEXT NOT NULL DEFAULT '/';
ALTER TABLE accounts ADD COLUMN presence_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE accounts ADD COLUMN last_presence TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc');

UPDATE schemaversion SET version = 5;

