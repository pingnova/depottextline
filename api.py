import re
import json
from datetime import datetime

from twilio.rest import Client
from flask import current_app, session, request, Blueprint
from flask.json import jsonify

from db import get_model
from api_auth import account_required
from api_server_sent_events import broker, presence_manager


# a Blueprint is a collection of routes under a certain prefix or "folder" on the http server
bp = Blueprint("api", __name__, url_prefix="/api")


@bp.route("/conversations", methods=['GET'])
@account_required
def list_conversations():
    conversations = get_model().list_conversations()
    return jsonify(conversations)

@bp.route("/setName", methods=['POST'])
@account_required
def setName():
  request_body = request.json
  if 'name' not in request_body or not request_body['name']:
    return jsonify({'error': "'name' field is required"}), 400

  get_model().set_account_name(session['account_id'], request_body['name'])
  session['name'] = request_body['name']

  presence_manager.update(session['account_id'], {
    'name': request_body['name'],
    'location': "home",
  })

  return jsonify({'ok': True}), 200

@bp.route("/conversations/<string:remote_number>", methods=['GET'])
@account_required
def list_messages(remote_number):
    messages = get_model().list_messages(remote_number)
    remote_number_profile = get_model().get_remote_number_profile(remote_number)
    return jsonify({'messages': messages, 'name': remote_number_profile['name']})



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

  get_model().save_message(message.sid, remote_number, session['account_id'], request_body["body"])

  broker.publish({
    'type': "message",
    'remote_number': remote_number,
    'sentBy': session['name'],
    'body': request_body["body"],
    'date': datetime.utcnow()
  })

  current_app.logger.debug(f"sent message to {remote_number}: sid: {message.sid}")

  return jsonify({'ok': True}), 200


@bp.errorhandler(500)
def json_error(error):
    return jsonify({'error': 'Internal Server Error'}), 500

