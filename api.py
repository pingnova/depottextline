from twilio.rest import Client
from flask import current_app, Blueprint

# a Blueprint is a collection of routes under a certain prefix or "folder" on the http server
bp = Blueprint("api", __name__, url_prefix="/api")

@app.route("/list_conversations")
def list_conversations():
    conversations = db.get_model().list_conversations()
    return json.dumps(conversations, default = str)
