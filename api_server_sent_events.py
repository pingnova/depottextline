
import json
import queue
from datetime import datetime

from flask import Blueprint
from flask.json import jsonify

from api_auth import account_required

class MessageBroker:
  def __init__(self):
    self.subscriptions = []

  def subscribe(self):
    q = queue.Queue(maxsize=5)
    self.subscriptions.append(q)
    return q

  def publish(self, event_object):
    for i in reversed(range(len(self.subscriptions))):
      try:
        self.subscriptions[i].put_nowait(event_object)
      except queue.Full:
        del self.subscriptions[i]

class PresenceManager:
  def __init__(self, broker):
      self.presence = dict()
      self.broker = broker

  def update(self, account_id, data):
    if account_id not in self.presence:
      self.presence[account_id] = data
    else:
      for key in data:
        self.presence[account_id][key] = data[key]
      
    self.presence[account_id]['date'] = datetime.utcnow()
    
    event = { 'type': "presence", 'account_id': account_id }
    for key in self.presence[account_id]:
      event[key] = self.presence[account_id][key]

    self.broker.publish(event)

  def get_all_as_events(self):
    events = []
    for account_id in self.presence:
      event = { 'type': "presence", 'account_id': account_id }
      account_presence = self.presence[account_id]
      for key in account_presence:
        event[key] = account_presence[key]
      
      events.append(event)


# a Blueprint is a collection of routes under a certain prefix or "folder" on the http server
bp = Blueprint("events", __name__, url_prefix="/events")

broker = MessageBroker()
presence_manager = PresenceManager(broker)

# See https://maxhalford.github.io/blog/flask-sse-no-deps/
@bp.route('/stream', methods=['GET'])
@account_required
def server_sent_events_stream():
  def stream():
    queue = broker.subscribe()

    # first, we dump the entire presence state as individual events
    messages = list(map(
      lambda event_object: f"data: {json.dumps(event_object)}\n\n",
      presence_manager.get_all_as_events()
    ))
    yield "".join(messages)
    
    while True:
      # Blocks until a new message arrives
      event_object = queue.get()

      # serialize the object in SSE format
      msg = f'data: {json.dumps(event_object)}\n\n'

      # Yield is like return but it doesn't end the function, 
      # it "sleeps" the current thread of execution temporarily.
      # Yield makes this stream() function a "generator"
      # which is python-ese for "thing which can be iterated asynchronously"
      yield msg

  return flask.Response(stream(), mimetype='text/event-stream')

@bp.errorhandler(500)
def json_error(error):
    return jsonify({'error': 'Internal Server Error'}), 500

