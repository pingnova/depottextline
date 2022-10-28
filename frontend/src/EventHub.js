


const EventHub = {
  originalReconnectTimeoutMs: 500,
  reconnectTimeoutMs: 500,
  startStreamingIfNotAlreadyStarted: () => {
    if(!EventHub.sse) {
      EventHub.sse = new EventSource('/events/stream');

      EventHub.sse.addEventListener("message", (e) => {
        const eventData = JSON.parse(e.data);
        console.log(eventData);
        Object.entries(EventHub.subscriptions).forEach(
          ([_, types]) => Object.entries(types).forEach(
            ([handlerType, handler]) => {
              if(eventData.type == handlerType) {
                handler(eventData);
              }
            }
          )
        )
      });

      EventHub.sse.addEventListener("open", (e) => {
        EventHub.reconnectTimeoutMs = EventHub.originalReconnectTimeoutMs;
      });

      EventHub.sse.addEventListener("error", (e) => {
        EventHub.sse.close();
        setTimeout(() => {
          EventHub.reconnectTimeoutMs = EventHub.reconnectTimeoutMs * 2;
          if(EventHub.reconnectTimeoutMs > 10000) {
            EventHub.reconnectTimeoutMs = 10000;
          }
          EventHub.sse = null;
          EventHub.startStreamingIfNotAlreadyStarted();
        }, EventHub.reconnectTimeoutMs );
      });
    }
  },
  subscriptions: {},
};

export default EventHub;

