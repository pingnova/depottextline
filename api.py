import re
import json
from datetime import datetime, timezone

from twilio.rest import Client
from flask import current_app, session, request, Blueprint
from flask.json import jsonify

from db import get_model
from api_auth import account_required
from api_server_sent_events import broker
# from api_server_sent_events import broker, presence_manager


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

  # presence_manager.update(session['account_id'], {
  #   'name': request_body['name'],
  #   'location': "home",
  # })

  return jsonify({'ok': True}), 200

@bp.route("/conversations/<string:remote_number>", methods=['GET'])
@account_required
def get_conversation(remote_number):
  messages = get_model().list_messages(remote_number)
  status_updates = get_model().list_status_updates(remote_number)

  events = joinerate(messages, status_updates, "date")

  remote_number_profile = get_model().get_remote_number_profile(remote_number)
  status = "new" if len(status_updates) == 0 else status_updates[0]['status']

  return jsonify({'events': events, 'name': remote_number_profile['name'], 'status': status})

@bp.route("/conversations/<string:remote_number>/status", methods=['POST'])
@account_required
def set_conversation_status(remote_number):
  request_body = request.json
  if 'status' not in request_body:
    return jsonify({'error': "'status' field is required"}), 400

  comment = "" if 'comment' not in request_body else request_body['comment']

  get_model().save_status(remote_number, session['account_id'], request_body["status"], comment)

  broker.publish({
    'type': "conversation_event",
    'remoteNumber': remote_number,
    'sentBy': session['name'],
    'status': request_body["status"],
    'comment': comment,
    'date': datetime.now(timezone.utc)
  })

  return jsonify({'ok': True}), 200


@bp.route("/conversations/<string:remote_number>/name", methods=['POST'])
@account_required
def set_conversation_name(remote_number):
  request_body = request.json
  if 'name' not in request_body:
    return jsonify({'error': "'name' field is required"}), 400

  get_model().set_conversation_name(remote_number, request_body["name"])

  return jsonify({'ok': True}), 200

@bp.route("/send/<string:remote_number>", methods=['POST'])
@account_required
def send_sms(remote_number):
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
    'type': "conversation_event",
    'remoteNumber': remote_number,
    'sentBy': session['name'],
    'body': request_body["body"],
    'date': datetime.now(timezone.utc)
  })

  current_app.logger.debug(f"sent message to {remote_number}: sid: {message.sid}")

  return jsonify({'ok': True}), 200


@bp.route("/presence", methods=['POST'])
@account_required
def post_presence():
  request_body = request.json
  if 'path' not in request_body:
    return jsonify({'error': "'path' field is required"}), 400

  if 'active' not in request_body:
    return jsonify({'error': "'active' field is required"}), 400

  if type(request_body['active']) != bool:
    return jsonify({'error': "'active' must be a boolean"}), 400

  if type(request_body['path']) != str:
    return jsonify({'error': "'path' must be a string"}), 400

  if not re.match(r"^[a-z0-9/?&_+-]+$", request_body['path'], re.IGNORECASE):
    return jsonify({'error': "'path' may only include the characters a-z0-9/?&_+-"}), 400
  
  #current_app.logger.info(f"presence: account_id={session['account_id']} path={request_body['path']} active={request_body['active']}")

  get_model().set_presence(session['account_id'], request_body['path'], request_body['active'])

  broker.publish({
    'type': "presence",
    #'account_id': session['account_id'], # account_id gets added by broker
    'name': session['name'],
    'path': request_body['path'],
    'active': request_body['active'],
    'date': datetime.now(timezone.utc)
  })

  return jsonify({'ok': True}), 200


@bp.route("/presence", methods=['GET'])
@account_required
def get_presence():

  items = list(filter(lambda x: x['account_id'] != session['account_id'], get_model().get_presence()))

  return jsonify(items), 200

# "joinerater" (joining iterator) pattern, zip two sorted lists of dict objects together into a single sorted list
def joinerate(list_a, list_b, sorted_by_key):
  to_return = []
  i = 0
  j = 0
  while i < len(list_a) or j < len(list_b):
    list_a_has_more = i < len(list_a)
    list_b_has_more = j < len(list_b)
    if list_a_has_more and list_b_has_more:
      if list_a[i][sorted_by_key] > list_b[j][sorted_by_key]:
        to_return.append(list_a[i])
        i += 1
      else:
        to_return.append(list_b[j])
        j += 1
    elif list_a_has_more:
      to_return.append(list_a[i])
      i += 1
    elif list_b_has_more:
      to_return.append(list_b[j])
      j += 1

  return to_return

@bp.errorhandler(500)
def json_error(error):
    return jsonify({'error': 'Internal Server Error'}), 500

