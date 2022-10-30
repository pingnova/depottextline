


ALTER TABLE login_tokens ADD COLUMN expires TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc');

UPDATE schemaversion SET version = 4;

