


const EventHub = {
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
    }
  },
  subscriptions: {},
};

export default EventHub;

