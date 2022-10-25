from flask import Blueprint, request, redirect
from twilio.twiml.messaging_response import MessagingResponse

from db import get_model


# a Blueprint is a collection of routes under a certain prefix or "folder" on the http server
bp = Blueprint("receive_sms", __name__, url_prefix="/receive_sms")

# You could access this route in the web browser at  http://localhost:5000/send_sms/+61212345678
@bp.route("/", methods=['GET', 'POST'])
def receive_sms():

    # Get the Twilio String Identifier (SID) associated with this message
    sid = request.values.get('MessageSid', "")

    # Get the message the user sent our Twilio number
    body = request.values.get('Body', "")

    # Get the phone # of the phone that texted the twilio number
    remote_number = request.values.get('From', "")

    # We know this is an incoming message because twilio called our webhook
    is_incoming_message = True

    if sid == "" or remote_number == "" or body == "":
      return "Bad Request", 400

    get_model().save_message(sid, remote_number, is_incoming_message, body)

    # Start our TwiML response
    response = MessagingResponse()

    # If we don't add the response message here, twilio will not send a response text!
    # response.message("New website who dis >:O")

    return str(response)


# Here are all of the request body values that can be obtained from
# the Webhook that twilio sends to us

# SmsSid=SMd4d169ec3aee87f64f60385d1f93d37f
# From=+11231234567
# Body=Heres+another+test+

# ToCountry=US
# ToState=MN
# SmsMessageSid=SMd4d169ec3aee87f64f60385d1f93d37f
# NumMedia=0
# ToCity=MINNEAPOLIS
# FromZip=55395
# SmsSid=SMd4d169ec3aee87f64f60385d1f93d37f
# FromState=MN
# SmsStatus=rec
# Body=Heres+another+test+eived
# FromCity=MOUND
# Body=Heres+another+test+
# FromCountry=US
# To=+17633632275
# ToZip=55415
# NumSegments=1
# ReferralNumMedia=0
# MessageSid=SMd4d169ec3aee87f64f60385d1f93d37f
# AccountSid=ACd821b6c2559271dd8c5b474ac5daae85
# From=+11231234567
# ApiVersion=2010-04-01
