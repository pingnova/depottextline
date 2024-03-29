from nanoid import generate

from datetime import datetime, timezone

# I was never able to get this type hinting to work correctly
# from psycopg2.extensions import connection as Psycopg2Connection, cursor as Psycopg2Cursor
from flask import current_app



class DBModel:
  #def __init__(self, connection: Psycopg2Connection, cursor: Psycopg2Cursor):
  def __init__(self, connection, cursor):
    self.connection = connection
    self.cursor = cursor

  def get_account_id(self, lower_case_email, canonicalized_phone_number):
    if lower_case_email:
      self.cursor.execute("SELECT id FROM accounts WHERE lower_case_email = %s", (lower_case_email, ))
    elif canonicalized_phone_number:
      self.cursor.execute("SELECT id FROM accounts WHERE canonicalized_phone_number = %s", ( canonicalized_phone_number, ))
    else:
      raise "db_model.get_account_id(): invalid arguments"
    row = self.cursor.fetchone()
    if row:
      return row[0]
    else:
      return None


  def get_login_token(self, lower_case_email, canonicalized_phone_number, duration):
 
    account_id = self.get_account_id(lower_case_email, canonicalized_phone_number)
    current_app.logger.info("get_login_token: "+ lower_case_email+ " account_id=" + str(account_id) if account_id else "none")
    if account_id == None:
      self.cursor.execute("""
        INSERT INTO accounts (name, lower_case_email, canonicalized_phone_number) VALUES (%s, %s, %s) RETURNING id
        """,
        ("", lower_case_email, canonicalized_phone_number)
      )
      account_id = self.cursor.fetchone()[0]

    self.cursor.execute("""
        SELECT token FROM login_tokens WHERE account_id = %s 
        and expires > (NOW() AT TIME ZONE 'utc')
      """, 
      (account_id, )
    )
    if len(self.cursor.fetchall()) > 5:
      return None

    token = generate(alphabet="1234567890", size=6)
    self.cursor.execute("""
      INSERT INTO login_tokens (account_id, token, expires) VALUES (%s, %s,  ((NOW() AT TIME ZONE 'utc') + INTERVAL %s))
    """, (account_id, token, duration))
    self.connection.commit()

    return token

  def login(self, token):
    self.cursor.execute("""
        SELECT account_id FROM login_tokens WHERE token = %s 
        and expires > (NOW() AT TIME ZONE 'utc')
      """, 
      (token, )
    )
    row = self.cursor.fetchone()
    if row:
      account_id = row[0]
      self.cursor.execute("DELETE FROM login_tokens WHERE account_id = %s", (account_id, ))
      self.cursor.execute("UPDATE accounts SET last_login = (NOW() AT TIME ZONE 'utc') WHERE id = %s", (account_id, ))
      self.connection.commit()

      self.cursor.execute("""
          SELECT id, name, admin, canonicalized_phone_number, lower_case_email 
          FROM accounts WHERE id = %s
        """,
        (account_id, )
      )
      row = self.cursor.fetchone()
      if not row:
        return None
        
      return {
        'id': row[0],
        'name': row[1],
        'admin': row[2], 
        'phoneNumber': row[3],
        'email': row[4],
      }

    return None


  def list_conversations(self):
    self.cursor.execute("""
      SELECT remote_numbers.name, remote_number, accounts.name, status, last_message_body, last_message_date
      FROM remote_numbers LEFT OUTER JOIN accounts on accounts.id = last_message_sent_by_account_id
      ORDER BY last_message_date DESC;
    """)

    return list(map(
      lambda x: dict(name=x[0], remoteNumber=x[1], sentBy=x[2], status=x[3], body=x[4], date=self.ensure_datetime_is_utc(x[5])),
      self.cursor.fetchall()
    ))

  def set_account_name(self, account_id, name):
    self.cursor.execute("UPDATE accounts SET name = %s WHERE id = %s", (name, account_id))
    self.connection.commit()

  def list_messages(self, remote_number):
    self.cursor.execute("""
        SELECT sid, accounts.name, body, messages.created FROM messages
        LEFT OUTER JOIN accounts on sent_by_account_id = accounts.id
        WHERE remote_number = %s ORDER BY created DESC;
      """,
      (remote_number, )
    )

    return list(map(
      lambda x: dict(id=x[0], sentBy=x[1], body=x[2], date=x[3]),
      self.cursor.fetchall()
    ))

  def list_status_updates(self, remote_number):
    self.cursor.execute("""
        SELECT status_updates.id, accounts.name, status, comment, status_updates.created FROM status_updates
        LEFT OUTER JOIN accounts on sent_by_account_id = accounts.id
        WHERE remote_number = %s ORDER BY created DESC;
      """,
      (remote_number, )
    )

    return list(map(
      lambda x: dict(id=x[0], sentBy=x[1], status=x[2], comment=x[3] if x[3] else "", date=x[4]),
      self.cursor.fetchall()
    ))

  def get_remote_number_profile(self, remote_number):
    self.cursor.execute("SELECT name FROM remote_numbers WHERE remote_number = %s", (remote_number, ))
    row = self.cursor.fetchone()
    if not row:
      return None

    return dict(name=row[0])


  def get_remote_number_last_message_date(self, remote_number):
    self.cursor.execute("SELECT last_message_date FROM remote_numbers WHERE remote_number = %s", (remote_number, ))
    row = self.cursor.fetchone()
    if not row:
      return None

    return self.ensure_datetime_is_utc(row[0])

  def save_message(self, sid, remote_number, sent_by_account_id, body):

    self.cursor.execute("SELECT remote_number FROM remote_numbers WHERE remote_number = %s", (remote_number, ))
    if not self.cursor.fetchone():
      self.cursor.execute("""
        INSERT INTO remote_numbers (remote_number, name, last_message_sent_by_account_id, last_message_body) 
        VALUES (%s, %s, %s, %s)
        """,
        (remote_number, "", sent_by_account_id, body)
      )
    else:
      bot_account_id = self.get_bot_account_id()
      if sent_by_account_id != bot_account_id:
        self.cursor.execute("""
            UPDATE remote_numbers SET last_message_sent_by_account_id = %s, last_message_body = %s, 
              last_message_date = (NOW() AT TIME ZONE 'utc')
            WHERE remote_number = %s
          """,
          (sent_by_account_id, body, remote_number)
        )

    self.cursor.execute("""
        INSERT INTO messages (sid, remote_number, sent_by_account_id, body) VALUES (%s, %s, %s, %s)
      """,
      (sid, remote_number, sent_by_account_id, body)
    )

    self.connection.commit()

  def get_status(self, remote_number):
    self.cursor.execute("""
      SELECT status from remote_numbers WHERE remote_number = %s;
    """, (remote_number, ))
    status = "new"
    row = self.cursor.fetchone()
    if row:
      status = row[0]

    return status

  def save_status(self, remote_number, sent_by_account_id, status, comment):

    previous_status = self.get_status(remote_number)
    description = f"status changed from \"{previous_status}\" to \"{status}\""
    if comment:
      description = f"{description} because \"{comment}\""

    self.cursor.execute("""
        UPDATE remote_numbers SET status = %s, last_message_sent_by_account_id = %s, last_message_body = %s, 
          last_message_date = (NOW() AT TIME ZONE 'utc')
        WHERE remote_number = %s
      """,
      (status, sent_by_account_id, description, remote_number)
    )

    self.cursor.execute("""
        INSERT INTO status_updates (remote_number, sent_by_account_id, status, comment) VALUES (%s, %s, %s, %s)
      """,
      (remote_number, sent_by_account_id, status, comment)
    )

    self.connection.commit()

  def set_conversation_name(self, remote_number, name):
    self.cursor.execute("UPDATE remote_numbers SET name = %s WHERE remote_number = %s", (name, remote_number))
    self.connection.commit()

  def get_bot_account_id(self):
    self.cursor.execute("SELECT id FROM accounts WHERE canonicalized_phone_number = 'auto-response'")
    row = self.cursor.fetchone()
    if not row:
      self.cursor.execute("""
        INSERT INTO accounts (name, lower_case_email, canonicalized_phone_number) 
        VALUES ('auto-response', 'auto-response', 'auto-response') RETURNING id
      """)

      account_id = self.cursor.fetchone()[0]
      self.connection.commit()
      return account_id

    return row[0]

  def set_presence(self, account_id, path, active):
    self.cursor.execute("""
        UPDATE accounts SET presence_path = %s, presence_active = %s, last_presence = (NOW() AT TIME ZONE 'utc') 
        WHERE id = %s
      """,
      (path, active, account_id)
    )
    self.connection.commit()


  def get_presence(self):
    self.cursor.execute("""
        SELECT id, presence_path, presence_active, last_presence, name FROM accounts 
        WHERE last_presence > ((NOW() AT TIME ZONE 'utc') - INTERVAL '30 seconds')
    """)
    
    return list(map(
      lambda x: dict(account_id=x[0], path=x[1], active=x[2], date=self.ensure_datetime_is_utc(x[3]), name=x[4]),
      self.cursor.fetchall()
    ))


  def ensure_datetime_is_utc(self, datetime):
    return datetime.replace(tzinfo=timezone.utc)