import os
import json

from flask import Flask
from logging.config import dictConfig as logging_dict_config

import db
# import send_sms
import receive_sms
import api

app = Flask(__name__)

app.config.from_mapping(
  LOG_LEVEL=os.environ.get("LOG_LEVEL", default="INFO"),
  BASE_URL=os.environ.get("BASE_URL", default="http://localhost:5000"),
  SECRET_KEY=os.environ.get("SECRET_KEY", default="dev"),
  ACCOUNT_SID=os.environ.get("ACCOUNT_SID", default=""),
  AUTH_TOKEN=os.environ.get("AUTH_TOKEN", default=""),
  TEXTLINE_NUMBER=os.environ.get("TEXTLINE_NUMBER", default=""),
  POSTGRES_CONNECTION_PARAMETERS=os.environ.get(
    "POSTGRES_CONNECTION_PARAMETERS",
    default="host=localhost port=5432 user=depottextline password=blah dbname=depottextline"
  ),
  DATABASE_SCHEMA=os.environ.get("DATABASE_SCHEMA", default="public"),
)

# This configures how flask (and the WSGI container that its running in) processes log messages
# It controls which log messages are displayed and what format they are outputted in
logging_dict_config({
  'version': 1,
  'formatters': {'default': {
    'format': '[%(asctime)s] %(levelname)s in %(module)s: %(message)s',
  }},
  'handlers': {'wsgi': {
    'class': 'logging.StreamHandler',
    'stream': 'ext://flask.logging.wsgi_errors_stream',
    'formatter': 'default',
  }},
  'root': {
    'level': app.config['LOG_LEVEL'],
    'handlers': ['wsgi']
  }
})

db.init_app(app)

# app.register_blueprint(send_sms.bp)
app.register_blueprint(receive_sms.bp)
app.register_blueprint(api.bp)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):
    return app.send_static_file("frontend-build/index.html")


