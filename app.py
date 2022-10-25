import os

from twilio.rest import Client
from flask import Flask, request, send_file, current_app
from flask_mail import Mail, Message
from logging.config import dictConfig as logging_dict_config

import db
# import send_sms
import receive_sms
import api_auth
import api

class StdoutMockFlaskMail:
  def send(self, message: Message):
    current_app.logger.info(
      f"Email would have been sent if configured:\n\nto: {','.join(message.recipients)}\n"
     +f"subject: {message.subject}\nbody:\n\n{message.body}\n\n"
    )


app = Flask(__name__, static_folder=os.path.abspath('frontend-build'))

app.config.from_mapping(
  LOG_LEVEL=os.environ.get("LOG_LEVEL", default="INFO"),
  BASE_URL=os.environ.get("BASE_URL", default="http://localhost:5000"),
  NAME_OF_APP=os.environ.get("NAME_OF_APP", default="Depot Text Line"),
  SECRET_KEY=os.environ.get("SECRET_KEY", default="changeme!"),


  ACCOUNT_SID=os.environ.get("ACCOUNT_SID", default=""),
  AUTH_TOKEN=os.environ.get("AUTH_TOKEN", default=""),
  TEXTLINE_NUMBER=os.environ.get("TEXTLINE_NUMBER", default=""),

  POSTGRES_CONNECTION_PARAMETERS=os.environ.get(
    "POSTGRES_CONNECTION_PARAMETERS",
    default="host=localhost port=5432 user=depottextline password=blah dbname=depottextline"
  ),
  DATABASE_SCHEMA=os.environ.get("DATABASE_SCHEMA", default="public"),

  MAIL_SERVER=os.environ.get("MAIL_SERVER", default=""),
  MAIL_PORT=os.environ.get("MAIL_PORT", default="465"),
  MAIL_USE_TLS=os.environ.get("MAIL_USE_TLS", default="False").lower() in ['true', '1', 't', 'y', 'yes'],
  MAIL_USE_SSL=os.environ.get("MAIL_USE_SSL", default="True").lower() in ['true', '1', 't', 'y', 'yes'],
  MAIL_USERNAME=os.environ.get("MAIL_USERNAME", default=""),
  MAIL_PASSWORD=os.environ.get("MAIL_PASSWORD", default=""),
  MAIL_DEFAULT_SENDER=os.environ.get("MAIL_DEFAULT_SENDER", default="no-reply@capsul.org"),
)

app.config["TWILIO_CLIENT"] = Client(app.config["ACCOUNT_SID"], app.config["AUTH_TOKEN"])

if app.config['MAIL_SERVER'] != "":
  app.config['FLASK_MAIL_INSTANCE'] = Mail(app)
else:
  app.logger.warn("No MAIL_SERVER configured. I will simply print emails to stdout.")
  app.config['FLASK_MAIL_INSTANCE'] = StdoutMockFlaskMail()



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
app.register_blueprint(api_auth.bp)
app.register_blueprint(api.bp)

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def catch_all(path):

    # app.logger.info(path)

    if "." in path and "/" not in path and os.path.exists("frontend-build/"+path):

      return send_file("frontend-build/"+path)
    else:
      return send_file("frontend-build/index.html")


