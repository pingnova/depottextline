import re
import json
import functools
from datetime import datetime, timedelta


from twilio.rest import Client
from flask import current_app, request, Blueprint
from flask.json import jsonify
from flask_mail import Message

from db import get_model

# a Blueprint is a collection of routes under a certain prefix or "folder" on the http server
bp = Blueprint("auth", __name__, url_prefix="/auth")


# This is a custom Flask route annotation that allows us to easily mark API routes as requiring a login
def account_required(view):
    @functools.wraps(view)
    def wrapped_view(**kwargs):
        authorization_header = request.headers.get('Authorization')
        session_id = authorization_header.replace("Bearer", "").strip()
        if session_id == "":
          return jsonify({'error': f"Please login in order to view this"}), 401
        elif not get_account_from_session():
          return jsonify({'error': f"Invalid session. Please login again in order to view this"}), 401
        
        return view(**kwargs)

    return wrapped_view

# convenience function used to grab the account for the current session
def get_account_from_session():
  authorization_header = request.headers.get('Authorization')
  session_id = authorization_header.replace("Bearer", "").strip()
  if session_id == "":
    return None

  if session_id in current_app.config["SESSION_CACHE"]:
    cached_account = current_app.config["SESSION_CACHE"][session_id]
    if datetime.now() < cached_account["expires"]:
      return cached_account

  account = get_model().get_account_for_session(session_id)
  if not account:
    return None
  else:
    account["expires"] = datetime.now() + timedelta(minutes=1)
    current_app.config["SESSION_CACHE"][session_id] = account
    return account



@bp.route("/get_login_token", methods=['POST'])
def get_login_token():
    request_body = request.json

    # if the user provided us an identity, then they are asking us to send them a login token
    if 'identity' in request_body:
      identity = request_body['identity']

      # Check if the user entered what appears to be a phone number
      if re.match(r"^[0-9+_.() -]+$", identity):
        return send_login_token_to_phone(identity)

      # else if its not a phone number, check if it could be an email address
      elif len(identity.strip()) >= 6 and identity.count('@') == 1 and identity.count('.') > 0:
        return send_login_token_to_email(identity)
      
      # if it's not a phone # or email address, then tell the user about the problem
      else:
        return jsonify({'error': f"'{identity}' was not recognized as an email address or phone number"}), 400
    
    # if no identity given, return an error (this indicates a bug in the frontend)
    else:
        return jsonify({'error': f"the 'identity' field is required"}), 400

@bp.route("/login", methods=['POST'])
def login():
    request_body = request.json

    # if the user provided us a token, then they are confirming their identity and creating a new session
    if 'token' in request_body:
      token = request_body['token']
      session_id = get_model().login(token, request.headers.get('User-Agent'))
      if not session_id:
        return jsonify({'error': f"invalid login token"}), 400

      account = get_account_from_session(session_id)
      account['sessionId'] = session_id
      return jsonify(account), 200
    
    # if no token given, return an error (this indicates a bug in the frontend)
    else:
        return jsonify({'error': f"the 'token' field is required"}), 400


##     -----------  Helper functions for Login  --------------   

def send_login_token_to_phone(raw_phone_number):
  # Since we are going to store this in the database and use it as an identifier,
  # We really really don't want it to be possible for two different strings to represent 
  # the same phone number.
  # canonicalization is the process of ensuring that there's only one way of representing each
  # different piece of data. We use the same canonical phone # format that twilio does
  # TODO support international country codes? Right now it forces US numbers only 

  just_the_digits = re.sub(r"[^0-9]", "", raw_phone_number)
  canonicalized_phone_number = None
  if len(just_the_digits) == 3+3+4:
    canonicalized_phone_number = f"+1{just_the_digits}"
  elif len(just_the_digits) == 1+3+3+4:
    canonicalized_phone_number = f"+{just_the_digits}"
  
  if not canonicalized_phone_number:
    return jsonify({
      'error': f"'{just_the_digits}' was not recognized as a phone number. "
             + f"Expected 10 digits, got {len(just_the_digits)}."
    }), 400

  token = get_model().get_login_token("", canonicalized_phone_number)

  if not token:
    return jsonify({
      'error': f"too many logins. please use one of the existing tokens that have been texted to you"
    }), 400

  message = current_app.config["TWILIO_CLIENT"].messages.create(
    to=canonicalized_phone_number,
    from_=current_app.config["TEXTLINE_NUMBER"],
    body=f"{token} is your {current_app.config['NAME_OF_APP']} login token.\n\n"
        +f"{current_app.config['BASE_URL']}/login/{token}",
  )

  current_app.logger.debug(f"sent login token {token} to {canonicalized_phone_number}: sid: {message.sid}")

  return jsonify({'message': f"Sent login token to {canonicalized_phone_number}.  Tap the link in that message or enter the token here to complete login."}), 200


def send_login_token_to_email(raw_email_address):

  # if the app hasn't been configured to send email, then explain to the user whats going on
  if current_app.config['MAIL_SERVER'] == "":
    return jsonify({
      'error': (
        f"{current_app.config['NAME_OF_APP']} hasn't been configured to send email."
        f"Try logging in with your phone # instead."
      )
    }), 500
  
  email = raw_email_address.strip().lower()
  token = get_model().get_login_token(email, "")

  if not token:
    return jsonify({
      'error': f"too many logins. please use one of the existing tokens that have been emailed to you"
    }), 400

  current_app.config["FLASK_MAIL_INSTANCE"].send(
    Message(
      f"Click This Link to Login to {current_app.config['NAME_OF_APP']}",
      sender=current_app.config["MAIL_DEFAULT_SENDER"],
      body=(
        f"Enter {token} or navigate to {current_app.config['BASE_URL']}/login/{token}"
        f" to log into {current_app.config['NAME_OF_APP']}.\n\nIf you didn't request this, ignore this message."
      ),
      recipients=[email]
    )
  )

  return jsonify({'message': f"Sent login token / link to {email}. Click the link in that email or enter the token here to complete login."}), 200