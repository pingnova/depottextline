

CREATE TABLE accounts (
  id         SERIAL PRIMARY KEY NOT NULL,
  name       TEXT NOT NULL,
  admin       BOOLEAN NOT NULL DEFAULT FALSE,
  canonicalized_phone_number TEXT NOT NULL,
  lower_case_email TEXT NOT NULL,
  last_login  TIMESTAMP NOT NULL DEFAULT NOW(),
  created  TIMESTAMP NOT NULL DEFAULT NOW()
);


CREATE TABLE login_tokens (
  account_id      INTEGER REFERENCES accounts(id) ON DELETE RESTRICT,
  token           TEXT NOT NULL,
  created         TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (token, account_id)
);

CREATE TABLE sessions (
  account_id      INTEGER REFERENCES accounts(id) ON DELETE RESTRICT,
  session_id      TEXT NOT NULL,
  user_agent      TEXT NOT NULL,
  created         TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (session_id)
);

UPDATE schemaversion SET version = 3;
