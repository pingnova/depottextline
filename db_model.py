from nanoid import generate

# I was never able to get this type hinting to work correctly
# from psycopg2.extensions import connection as Psycopg2Connection, cursor as Psycopg2Cursor
from flask import current_app



class DBModel:
  #def __init__(self, connection: Psycopg2Connection, cursor: Psycopg2Cursor):
  def __init__(self, connection, cursor):
    self.connection = connection
    self.cursor = cursor

  def get_login_token(self, lower_case_email, canonicalized_phone_number):
    self.cursor.execute("""
      SELECT id, name, admin FROM accounts WHERE lower_case_email = %s or canonicalized_phone_number = %s
      """,
      (lower_case_email, canonicalized_phone_number)
    )
    row = self.cursor.fetchone()
    account_id = None

    if not row:
      self.cursor.execute("""
        INSERT INTO accounts (name, lower_case_email, canonicalized_phone_number) VALUES (%s, %s, %s) RETURNING id
        """,
        ("", lower_case_email, canonicalized_phone_number)
      )
      account_id = self.cursor.fetchone()[0]
    else:
      account_id = row[0]

    self.cursor.execute("SELECT token FROM login_tokens WHERE account_id = %s and created > (NOW() - INTERVAL '10 min')", (account_id, ))
    if len(self.cursor.fetchall()) > 5:
      return None

    token = generate(alphabet="1234567890", size=5)
    self.cursor.execute("INSERT INTO login_tokens (account_id, token) VALUES (%s, %s)", (account_id, token))
    self.connection.commit()

    return token

  def login(self, token, user_agent):
    self.cursor.execute("""
        SELECT account_id FROM login_tokens WHERE token = %s and created > (NOW() - INTERVAL '10 min')
      """, 
      (token, )
    )
    row = self.cursor.fetchone()
    if row:
      account_id = row[0]
      session_id = generate(alphabet="123456789qwertyupasdfghjkzxcvbnm", size=32)
      self.cursor.execute("DELETE FROM login_tokens WHERE account_id = %s", (account_id, ))
      self.cursor.execute("UPDATE accounts SET last_login = NOW() WHERE id = %s", (account_id, ))
      self.cursor.execute(
        """
          INSERT INTO sessions (account_id, session_id, user_agent) VALUES (%s, %s, %s)
        """, 
        (account_id, session_id, user_agent)
      )
      self.connection.commit()
      return session_id

    return None

  def get_account_for_session(self, session_id):
    self.cursor.execute("""
        SELECT id, name, admin, canonicalized_phone_number, lower_case_email FROM accounts
        JOIN sessions ON sessions.account_id = accounts.id
        WHERE sessions.session_id = %s
      """,
      (session_id, )
    )
    row = self.cursor.fetchone()

    if not row:
      return None
    
    return {
      'id': row[0],
      'name': row[1],
      'admin': row[2], 
      'phone_number': row[3],
      'email': row[4],
    }

  def list_conversations(self):
    self.cursor.execute("""
      SELECT DISTINCT on (remote_number)
        remote_number, incoming, body, created
      FROM messages
      ORDER BY remote_number, created DESC;
    """)

    return list(map(
      lambda x: dict(remote_number=x[0], incoming=x[1], body=x[2], last_message=x[3]),
      self.cursor.fetchall()
    ))

  def save_message(self, sid, remote_number, incoming, body):
    self.cursor.execute("""
      INSERT INTO messages (sid, remote_number, incoming, body) VALUES (%s, %s, %s, %s)
    """,
    (sid, remote_number, incoming, body))

    self.connection.commit()
