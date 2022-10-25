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


@bp.errorhandler(500)
def json_error(error):
    return jsonify({'error': 'Internal Server Error'}), 500

