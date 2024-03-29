
import time
import json
import queue
from datetime import datetime, timezone

from flask import Response, session, current_app, Blueprint
from flask.json import jsonify

from api_auth import account_required

class MessageBroker:
  def __init__(self):
    self.subscriptions = []

  def subscribe(self, account_id):
    # Note, for some reason this happens outside the application context?? 
    # So any current_app or other flask stuff has to be passed in from outside

    q = queue.Queue(maxsize=5)
    self.subscriptions.append({
      'account_id': account_id,
      'queue': q
    })
    return q

  def publish(self, event_object):

    # annotate every event with the account that published it
    if 'account_id' in session:
      event_object['account_id'] = session['account_id']
    else:
      # for events that are caused externally, for example caused by a twilio webhook
      event_object['account_id'] = None

    for i in reversed(range(len(self.subscriptions))):
      subscriber = self.subscriptions[i]

      # Only send the event to this subscriber if it was published by a different account
      if subscriber['account_id'] != event_object['account_id']:
        try:
          subscriber['queue'].put_nowait(event_object)
          # current_app.logger.info(f"put_nowait() ok to: {str(subscriber['account_id'])}: {json.dumps(event_object, default=str)}")
        except queue.Full:
          current_app.logger.info(f"shutting down account #{str(subscriber['account_id'])}'s "
                                   "SSE subscription because queue is full (they disconnected)")
          del self.subscriptions[i]

# a Blueprint is a collection of routes under a certain prefix or "folder" on the http server
bp = Blueprint("events", __name__, url_prefix="/events")

broker = MessageBroker()
#presence_manager = PresenceManager(broker)

# See https://maxhalford.github.io/blog/flask-sse-no-deps/
@bp.route('/stream', methods=['GET'])
@account_required
def server_sent_events_stream():

  # Note, for some reason this happens outside the application context?? 
  # So any current_app or other flask stuff has to be passed in from outside
  def stream(logger, account_id):

    # first, we dump the entire presence state as individual events
    # messages = list(map(
    #   lambda event_object: f"data: {json.dumps(event_object, default=str)}\n\n",
    #   presence_manager.get_all_as_events(account_id)
    # ))
    # yield "".join(messages)

    # i = 0
    # while i < 5:
    #   i += 1
    #   time.sleep(1)
    #   yield 'data: {"type": "connected!"}\n\n'

    # return

    time.sleep(0.1)
    yield 'data: {"type": "connected"}\n\n'

    queue = broker.subscribe(account_id)
    while True:
      # Blocks until a new message arrives
      event_object = queue.get()

      # serialize the object in SSE format
      msg = f'data: {json.dumps(event_object, default=str)}\n\n'

      # Yield is like return but it doesn't end the function, 
      # it "sleeps" the current thread of execution temporarily.
      # Yield makes this stream() function a "generator"
      # which is python-ese for "thing which can be iterated asynchronously"

      #logger.info(f"yield msg {msg}")
      yield msg

      # for some reason when the app is behind nginx, it always lags 1 event behind 
      # on the HTTP response. So I just send a bogus event after every real event. WTF.
      time.sleep(0.1)
      yield 'data: {"type": "flush"}\n\n'

  return Response(stream(current_app.logger, session['account_id']), mimetype='text/event-stream')

@bp.errorhandler(500)
def json_error(error):
    return jsonify({'error': 'Internal Server Error'}), 500

