
ALTER TABLE login_tokens DROP COLUMN expires;

UPDATE schemaversion SET version = 3;
