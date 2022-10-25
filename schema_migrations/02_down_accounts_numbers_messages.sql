DROP TABLE messages;
DROP TABLE remote_numbers;
DROP TABLE login_tokens;
DROP TABLE accounts;

UPDATE schemaversion SET version = 1;
