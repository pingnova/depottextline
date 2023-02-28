

import { createContext } from 'preact';
import { useState, useEffect, useContext } from 'preact/hooks';
import { SessionContext } from './Session';
import EventHub from './EventHub';

const presenceTimeoutSeconds = 30;
const PresenceContext = createContext();

function PresenceContextComponent({children}) {

  const session = useContext(SessionContext);
  const [presence, setPresence] = useState({});

  const accumulatePresence = (incoming) => {
    presence[incoming.path] = presence[incoming.path] || {};

    Object.keys(presence).forEach(k => {
      if(presence[k][incoming.account_id]) {
        delete presence[k][incoming.account_id];
      }
    });

    const timestamp = new Date(incoming.date).getTime();
    presence[incoming.path][incoming.account_id] = {
      name: incoming.name,
      active: incoming.active,
      date: timestamp,
    };

    const expiryTimestamp = timestamp + ((presenceTimeoutSeconds+2) * 1000);

    setTimeout(
      () => {
        const oldPresence = presence[incoming.path][incoming.account_id];
        if(oldPresence && oldPresence.date == timestamp) {
          delete presence[incoming.path][incoming.account_id];
          setPresence(presence);
        }
      }, 
      expiryTimestamp-(new Date().getTime()) 
    );
  }

  useEffect(() => {
    session.authenticatedFetch("/api/presence", null, true).then(items => {
      items.forEach(accumulatePresence);
      //console.log("ASD " + JSON.stringify(presence, null, "  "))
      setPresence({...presence});
    })

    // https://robertmarshall.dev/blog/componentwillunmount-functional-components-react/#componentwillunmount-in-useeffect
    // functions returned from the effect function will be called when the component unmounts, as cleanup 
    return () => delete EventHub.subscriptions.PresenceContext;
  }, []);

  EventHub.subscriptions.PresenceContext = {
    'presence': (eventData) => {
      accumulatePresence(eventData);
      setPresence({...presence});
    }
  };

  //console.log(JSON.stringify(presence, null, "  "))

  return <PresenceContext.Provider value={presence}>
    <PresenceListener/>
    {children}
  </PresenceContext.Provider>;
}

export { PresenceContextComponent, PresenceContext }


let lastUpdateByPath = {};
let lastIdleUpdate = new Date().getTime();
let lastIdleIntervalFired = new Date().getTime();

function PresenceListener() {

  const session = useContext(SessionContext);

  const postPresenceToServer = (active) => session.authenticatedFetch(
    '/api/presence',
    {
      method: "POST",
      body: JSON.stringify({ path: window.location.pathname, active }),
      headers:  {"Content-type": "application/json"}
    }
  );

  const userIsPresent = () => {
    const lastUpdate = lastUpdateByPath[window.location.pathname];
    const now = new Date().getTime();
    if(!lastUpdate || (now - lastUpdate) > presenceTimeoutSeconds * 1000) {
      lastUpdateByPath = {[window.location.pathname]: now};
      postPresenceToServer(true);
    }
  };

  useEffect(() => {
    document.addEventListener("keydown", userIsPresent);
    document.addEventListener("touchstart", userIsPresent);
    document.addEventListener("mousemove", userIsPresent);
    document.addEventListener("wheel", userIsPresent);

    let lastHref = document.location.href;

    const interval = setInterval(
      () => {
        // fire the event on navigation
        if (lastHref !== document.location.href) {
          lastHref = document.location.href;
          userIsPresent();
          return
        }

        const lastUpdate = lastUpdateByPath[window.location.pathname];
        const now = new Date().getTime();
        if((now - lastUpdate) > (presenceTimeoutSeconds+1) * 1000 && (now-lastIdleUpdate) > presenceTimeoutSeconds*1000) {
          // if the time since the last interval is really long, 
          // that means the app was backgrounded and the interval was not firing
          // since its firing now, this is an indication that the user clicked on the app!
          const justReturnedFromBrowserSleep = (now-lastIdleIntervalFired) > presenceTimeoutSeconds*1000;

          lastIdleUpdate = now;

          if(justReturnedFromBrowserSleep) {
            userIsPresent();
          } else {
            postPresenceToServer(false);
          }
        }
        lastIdleIntervalFired = now;
      }, 
      500
    );

    return () => {
      document.removeEventListener("keydown", userIsPresent);
      document.removeEventListener("touchstart", userIsPresent);
      document.removeEventListener("mousemove", userIsPresent);
      document.removeEventListener("wheel", userIsPresent);
      observer.disconnect();
      clearInterval(interval);
    };
  }, [])

  return "";
}