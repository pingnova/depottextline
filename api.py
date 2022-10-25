import re
import json

from twilio.rest import Client
from flask import current_app, request, Blueprint
from flask.json import jsonify

from db import get_model
from api_auth import account_required


# a Blueprint is a collection of routes under a certain prefix or "folder" on the http server
bp = Blueprint("api", __name__, url_prefix="/api")


@bp.route("/conversations", methods=['GET'])
@account_required
def list_conversations():
    conversations = get_model().list_conversations()
    return jsonify(conversations)

@bp.route("/conversations/<string:remote_number>", methods=['GET'])
@account_required
def list_messages(remote_number):
    messages = get_model().list_messages(remote_number)
    # TODO remote number profiles and names
    return jsonify({'messages': messages, 'name': ""})


@bp.route("/send/<string:remote_number>", methods=['POST'])
@account_required
def send(remote_number):
  request_body = request.json
  if 'body' not in request_body:
    return jsonify({'error': "'body' field is required"}), 400

  message = current_app.config["TWILIO_CLIENT"].messages.create(
    to=remote_number,
    from_=current_app.config["TEXTLINE_NUMBER"],
    body=request_body["body"],
  )

  get_model().save_message(message.sid, remote_number, False, request_body["body"])

  current_app.logger.debug(f"sent message to {remote_number}: sid: {message.sid}")

  return jsonify({'ok': True}), 200



@bp.errorhandler(500)
def json_error(error):
    return jsonify({'error': 'Internal Server Error'}), 500

