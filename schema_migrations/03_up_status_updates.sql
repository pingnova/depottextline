


CREATE TABLE status_updates (
  id SERIAL PRIMARY KEY NOT NULL,
  comment TEXT NULL,
  status TEXT NOT NULL,
  remote_number TEXT REFERENCES remote_numbers(remote_number) ON DELETE RESTRICT,
  sent_by_account_id INTEGER NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  created  TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);

ALTER TABLE remote_numbers ADD COLUMN status TEXT NOT NULL DEFAULT 'new';

UPDATE schemaversion SET version = 3;

