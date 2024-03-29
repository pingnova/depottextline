
import { createContext } from 'preact';
import { route } from 'preact-router';
import { useState, useContext } from 'preact/hooks';

import EventHub from './EventHub.js'

const SessionContext = createContext();


const originalAccountString = window.localStorage.getItem('depot-text-line-account');
let originalAccount = null;
if(originalAccountString != null && originalAccountString != "") {
  originalAccount = JSON.parse(originalAccountString)
}

let didPromptForUsername = false;

function SessionContextComponent({loading, setLoading, setFlashMessage, children}) {
   
  
  let session, setSession;
  const originalSessionObject = {
    account: originalAccount,
    logIn: (account) => {
      window.localStorage.setItem('depot-text-line-account', JSON.stringify(account));
      setSession({...session, account});
      if(window.location.pathname != "/") {
        route("/");
      }
      
    },
    logOut: (message) => {
      window.localStorage.setItem('depot-text-line-account', "");
      setSession({...session, account: null});
      setFlashMessage(message);
      route("/login");
    }, 
    promptForUsername: () => {
      if(didPromptForUsername) {
        return
      }
      didPromptForUsername = true;

      setTimeout(() => {
        const newName = (window.prompt("Your Profile: Please Set your Username", session.account?.name || "") || "").trim()
        if(newName) {
          session.authenticatedFetch("/api/setName", {
            method: "POST",
            body: JSON.stringify({name: newName}),
            headers:  {"Content-type": "application/json"}
          }, true).then(() => {
            session.account.name = newName;
            session.logIn(session.account);
          }).finally(() => {
            didPromptForUsername = false;
          });
        } else {
          didPromptForUsername = false;
        }
      }, 500);
    },
    authenticatedFetch: (url, options, displayLoader) => {
      if(displayLoader) {
        session.pushLoading()
      }
      let toReturn = fetch(url, options)
        .then(response => {
          return response.json().then(responseObject => {
            if(response.status == 401) {
              session.logOut(responseObject.error || "Please log in to view this")
            } else {
              // as soon as we know the user is logged in, we can start consuming the event stream
              EventHub.startStreamingIfNotAlreadyStarted();

              // make sure the user sets thier username if not already done
              if(session.account?.id && !(session.account?.name || "") ) {
                session.promptForUsername();
              }
            }
            return responseObject;
          })
        })
  
      if(displayLoader) {
        toReturn = toReturn.finally(() => session.popLoading());
      }
      return toReturn;
    },
    pushLoading: () => setLoading(loading+1),
    popLoading: () => {
      setLoading(loading > 0 ? loading-1 : 0);
      setFlashMessage("");
    },
  };

  [session, setSession] = useState(originalSessionObject);

  return <SessionContext.Provider value={session}>
    {children}
  </SessionContext.Provider>

}

export { SessionContextComponent, SessionContext };
