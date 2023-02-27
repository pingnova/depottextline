
import { useEffect, useContext } from 'preact/hooks';
import { SessionContext } from './Session';


const lastUpdateByPath = {};
let lastIdleUpdate = new Date().getTime();
let lastIdleIntervalFired = new Date().getTime();
const presenceTimeoutSeconds = 10;

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
      lastUpdateByPath[window.location.pathname] = now;
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
      1000
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

export default PresenceListener;
