

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

UPDATE schemaversion SET version = 3;
