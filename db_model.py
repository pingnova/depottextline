
# I was never able to get this type hinting to work correctly
# from psycopg2.extensions import connection as Psycopg2Connection, cursor as Psycopg2Cursor
from flask import current_app


class DBModel:
  #def __init__(self, connection: Psycopg2Connection, cursor: Psycopg2Cursor):
  def __init__(self, connection, cursor):
    self.connection = connection
    self.cursor = cursor

  def list_conversations(self):
    self.cursor.execute("""
      SELECT DISTINCT on (remote_number)
        remote_number, incoming, body, created
      FROM messages
      ORDER BY remote_number, created DESC;
    """)

    return list(map(
      lambda x: dict(remote_number=x[0], incoming=x[1], body=x[2], created=x[3]),
      self.cursor.fetchall()
    ))

  def save_message(self, sid, remote_number, incoming, body):
    self.cursor.execute("""
      INSERT INTO messages (sid, remote_number, incoming, body) VALUES (%s, %s, %s, %s)
    """,
    (sid, remote_number, incoming, body))

    self.connection.commit()
