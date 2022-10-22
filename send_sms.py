from twilio.rest import Client
from flask import current_app, Blueprint

# a Blueprint is a collection of routes under a certain prefix or "folder" on the http server
bp = Blueprint("send_sms", __name__, url_prefix="/send_sms")

# You could access this route in the web browser at  http://localhost:5000/send_sms/+61212345678
@bp.route("/<string:send_to_phone_number>", methods=("GET", "POST"))
def detail(send_to_phone_number):

    # Your Account SID from twilio.com/console. app.py loads this from the .env file
    account_sid = current_app.config["ACCOUNT_SID"]
    # Your Auth Token from twilio.com/console.  app.py loads this from the .env file
    auth_token  = current_app.config["AUTH_TOKEN"]

    client = Client(account_sid, auth_token)

    message = client.messages.create(
        to=send_to_phone_number,
        from_=current_app.config["TEXTLINE_NUMBER"],
        body="Hello from Python!")

    return message.sid
