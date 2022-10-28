
import { createContext } from 'preact';
import { route } from 'preact-router';
import { useState, useContext } from 'preact/hooks';

import EventHub from './EventHub.js'
import { ModalContext } from './Modal.js'
import TextInputModal from './TextInputModal.js'

const SessionContext = createContext();


const originalAccountString = window.localStorage.getItem('depot-text-line-account');
let originalAccount = null;
if(originalAccountString != null && originalAccountString != "") {
  originalAccount = JSON.parse(originalAccountString)
}

function SessionContextComponent({loading, setLoading, setFlashMessage, children}) {
   
  const modal = useContext(ModalContext);
  
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
      TextInputModal(modal, {
        title: "Your Profile",
        description: "Please Set your Username",
        inputLabel: "Username",
        initialValue: session.account?.name || ""
      })
      .then((newName) => {
        if(newName) {
          session.authenticatedFetch("/api/setName", {
            method: "POST",
            body: JSON.stringify({name: newName}),
            headers:  {"Content-type": "application/json"}
          }).then(() => {
            session.account.name = newName;
            session.logIn(session.account);
          });
        }

      })

    },
    authenticatedFetch: (url, options, displayLoader) => {
      if(displayLoader) {
        session.pushLoading()
      }
      const toReturn = fetch(url, options)
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
