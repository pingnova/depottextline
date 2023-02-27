from datetime import datetime, timezone

from flask import Blueprint, request, redirect
from twilio.twiml.messaging_response import MessagingResponse

from db import get_model
from api_server_sent_events import broker


# a Blueprint is a collection of routes under a certain prefix or "folder" on the http server
bp = Blueprint("receive_sms", __name__, url_prefix="/")

# You could access this route in the web browser at  http://localhost:5000/send_sms/+61212345678
@bp.route("/receive_sms", methods=['GET', 'POST'])
def receive_sms():

  # Get the Twilio String Identifier (SID) associated with this message
  sid = request.values.get('MessageSid', "")

  # Get the message the user sent our Twilio number
  body = request.values.get('Body', "")

  # Get the phone # of the phone that texted the twilio number
  remote_number = request.values.get('From', "")

  if sid == "" or remote_number == "" or body == "":
    return "Bad Request", 400


  last_message_date = get_model().get_remote_number_last_message_date(remote_number)
  one_week_in_seconds = 604800 

  # We know this is an incoming message (no sentBy or account_id) 
  # because twilio called our webhook
  sent_by_account_id = None
  get_model().save_message(sid, remote_number, sent_by_account_id, body)

  broker.publish({
    'type': "conversation_event",
    'remoteNumber': remote_number,
    'sentBy': None,
    'body': body,
    'date': datetime.now(timezone.utc)
  })

  # only send the auto-response message if this is the 1st time this phone number contacted us,
  # or if they haven't sent a message in the last week
  if last_message_date is None or (datetime.now(timezone.utc) - last_message_date).total_seconds() > one_week_in_seconds:
    auto_response_message = "DEPOT TEXT LINE\ngot your text, we'll respond soon.\n"

    message = current_app.config["TWILIO_CLIENT"].messages.create(
      to=remote_number,
      from_=current_app.config["TEXTLINE_NUMBER"],
      body=auto_response_message,
    )

    current_app.logger.debug(f"sent auto-response message to {remote_number}: sid: {message.sid}")

    bot_account_id = get_model().get_bot_account_id()

    get_model().save_message(message.sid, remote_number, bot_account_id, auto_response_message)

    broker.publish({
      'type': "conversation_event",
      'remoteNumber': remote_number,
      'sentBy': bot_account_id,
      'body': auto_response_message,
      'date': datetime.now(timezone.utc)
    })

  # Start our TwiML response
  response = MessagingResponse()

  # If we don't add the response message here, twilio will not send a response text!
  # response.message("New website who dis >:O")

  return str(response)

