

CREATE TABLE accounts (
  id         SERIAL PRIMARY KEY NOT NULL,
  name       TEXT NOT NULL,
  admin       BOOLEAN NOT NULL DEFAULT FALSE,
  canonicalized_phone_number TEXT NOT NULL,
  lower_case_email TEXT NOT NULL,
  last_login  TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
  created  TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);


CREATE TABLE login_tokens (
  account_id      INTEGER REFERENCES accounts(id) ON DELETE RESTRICT,
  token           TEXT NOT NULL,
  created         TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
  PRIMARY KEY (token, account_id)
);

CREATE TABLE remote_numbers (
  remote_number TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  created  TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
  last_message_date  TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
  last_message_sent_by_account_id INTEGER NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  last_message_body TEXT NOT NULL
);

CREATE TABLE messages (
  sid TEXT PRIMARY KEY NOT NULL,
  body TEXT NOT NULL,
  remote_number TEXT REFERENCES remote_numbers(remote_number) ON DELETE RESTRICT,
  sent_by_account_id INTEGER NULL REFERENCES accounts(id) ON DELETE RESTRICT,
  created  TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);



UPDATE schemaversion SET version = 2;
