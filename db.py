import psycopg2
import re
import sys
from os import listdir
from os.path import isfile, join
from psycopg2 import pool
from flask import current_app
from flask import g

from db_model import DBModel
from shared import my_exec_info_message

# increment this to enable new database changes written to sql files in the schema_migrations folder
desiredSchemaVersion = 5

def init_app(app):

  try:
    app.config['PSYCOPG2_CONNECTION_POOL'] = psycopg2.pool.SimpleConnectionPool(
      1,
      20,
      app.config['POSTGRES_CONNECTION_PARAMETERS']
    )
  except:
    app.logger.error(f"""
        error was thrown when connecting to postgres database:
        {my_exec_info_message(sys.exc_info())}"""
    )
    raise

  # tell the app to clean up the DB connection when shutting down.
  app.teardown_appcontext(close_db)


  schemaMigrations = {}
  schemaMigrationsPath = join(app.root_path, 'schema_migrations')
  app.logger.info("loading schema migration scripts from {}".format(schemaMigrationsPath))
  for filename in listdir(schemaMigrationsPath):
    result = re.search(r"^\d+_(up|down)", filename)
    if not result:
      app.logger.error(f"schemaVersion {filename} must match ^\\d+_(up|down). exiting.")
      exit(1)
    key = result.group()
    with open(join(schemaMigrationsPath, filename), 'rb') as file:
      schemaMigrations[key] = file.read().decode("utf8")

  connection = app.config['PSYCOPG2_CONNECTION_POOL'].getconn()

  hasSchemaVersionTable = False
  actionWasTaken = False
  schemaVersion = 0

  cursor = connection.cursor()

  cursor.execute("""
    SELECT table_name, table_schema FROM information_schema.tables WHERE table_schema = %s
  """, (app.config['DATABASE_SCHEMA'], ))

  rows = cursor.fetchall()
  for row in rows:
    if row[0] == "schemaversion":
      hasSchemaVersionTable = True

  if hasSchemaVersionTable == False:
    app.logger.info("no table named schemaversion found in the {} schema. running migration 01_up".format(app.config['DATABASE_SCHEMA']))
    try:
      cursor.execute(schemaMigrations["01_up"])
      connection.commit()
    except:
      app.logger.error("unable to create the schemaversion table because: {}".format(my_exec_info_message(sys.exc_info())))
      exit(1)
    actionWasTaken = True

  cursor.execute("SELECT Version FROM schemaversion")
  schemaVersion = cursor.fetchall()[0][0]

  if schemaVersion > desiredSchemaVersion:
    app.logger.critical("schemaVersion ({}) > desiredSchemaVersion ({}). schema downgrades are not supported yet. exiting.".format(
      schemaVersion, desiredSchemaVersion
    ))
    exit(1)

  while schemaVersion < desiredSchemaVersion:
    migrationKey = "%02d_up" % (schemaVersion+1)
    app.logger.info("schemaVersion ({}) < desiredSchemaVersion ({}). running migration {}".format(
      schemaVersion, desiredSchemaVersion, migrationKey
    ))
    try:
      cursor.execute(schemaMigrations[migrationKey])
      connection.commit()
    except KeyError:
      app.logger.critical("missing schema migration script: {}_xyz.sql".format(migrationKey))
      exit(1)
    except:
      app.logger.critical("unable to execute the schema migration {} because: {}".format(migrationKey, my_exec_info_message(sys.exc_info())))
      exit(1)
    actionWasTaken = True

    schemaVersion += 1
    cursor.execute("SELECT Version FROM schemaversion")
    versionFromDatabase = cursor.fetchall()[0][0]

    if schemaVersion != versionFromDatabase:
      app.logger.critical("incorrect schema version value \"{}\" after running migration {}, expected \"{}\". exiting.".format(
        versionFromDatabase,
        migrationKey,
        schemaVersion
      ))
      exit(1)

  cursor.close()

  app.config['PSYCOPG2_CONNECTION_POOL'].putconn(connection)

  app.logger.info("{} current schemaVersion: \"{}\"".format(
    ("schema migration completed." if actionWasTaken else "schema is already up to date. "), schemaVersion
  ))




def get_model() -> DBModel:
    if 'db_model' not in g:
        connection = current_app.config['PSYCOPG2_CONNECTION_POOL'].getconn()
        cursor = connection.cursor()
        g.db_model = DBModel(connection, cursor)
    return g.db_model


def close_db(e=None):
  db_model = g.pop("db_model", None)

  if db_model is not None:
    db_model.cursor.close()
    current_app.config['PSYCOPG2_CONNECTION_POOL'].putconn(db_model.connection)
