from flask import Blueprint, request, redirect
from twilio.twiml.messaging_response import MessagingResponse

# a Blueprint is a collection of routes under a certain prefix or "folder" on the http server
bp = Blueprint("receive_sms", __name__, url_prefix="/receive_sms")

# You could access this route in the web browser at  http://localhost:5000/send_sms/+61212345678
@bp.route("/", methods=['GET', 'POST'])
def sms_reply():

    # Get the message the user sent our Twilio number
    body = request.values.get('Body', None)

    # Start our TwiML response
    response = MessagingResponse()

    # Add a message
    response.message("New website who dis >:O")

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
