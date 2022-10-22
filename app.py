from flask import Flask
import send_sms
import os

app = Flask(__name__)

app.config.from_mapping(
  BASE_URL=os.environ.get("BASE_URL", default="http://localhost:5000"),
  SECRET_KEY=os.environ.get("SECRET_KEY", default="dev"),
  ACCOUNT_SID=os.environ.get("ACCOUNT_SID", default=""),
  AUTH_TOKEN=os.environ.get("AUTH_TOKEN", default=""),
  TEXTLINE_NUMBER=os.environ.get("TEXTLINE_NUMBER", default=""),
)

app.register_blueprint(send_sms.bp)


@app.route("/")
def hello_world():
    return "<p>Hello, World!</p>"
