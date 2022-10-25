


CREATE TABLE remote_numbers (
  remote_number TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  created  TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
  last_message_date  TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc'),
  last_message_incoming BOOLEAN NOT NULL,
  last_message_body TEXT NOT NULL,
);

CREATE TABLE messages (
  sid TEXT PRIMARY KEY NOT NULL,
  body TEXT NOT NULL,
  remote_number TEXT REFERENCES remote_numbers(remote_number) ON DELETE RESTRICT,
  incoming BOOLEAN NOT NULL,
  created  TIMESTAMP NOT NULL DEFAULT (NOW() AT TIME ZONE 'utc')
);



UPDATE schemaversion SET version = 2;
