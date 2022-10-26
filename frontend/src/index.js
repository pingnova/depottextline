import { render } from 'preact';
import { route, Router } from 'preact-router';
import { useState } from 'preact/hooks';

import './index.css';
import SessionContext from './SessionContext.js'
import EventHub from './EventHub';
import ConversationsList from './ConversationsList.js';
import Conversation from './Conversation.js';
import Login from './Login.js';

const originalAccountString = window.localStorage.getItem('depot-text-line-account');
let originalAccount = null;
if(originalAccountString != null && originalAccountString != "") {
  originalAccount = JSON.parse(originalAccountString)
}

const Main = () => {

  const [loading, setLoading] = useState(0);
  const [flashMessage, setFlashMessage] = useState("");

  let session;
  let setSession;
  const originalSessionObject = {
    account: originalAccount,
    logIn: (account) => {
      window.localStorage.setItem('depot-text-line-account', JSON.stringify(account));
      session.account = account
      setSession(session);
      if(window.location.pathname != "/") {
        route("/");
      }
      
    },
    logOut: (message) => {
      window.localStorage.setItem('depot-text-line-account', "");
      session.account = null
      setSession(session);
      setFlashMessage(message);
      route("/login");
    }, 
    promptForUsername: () => {
      let newName = "";
      while (newName == "") {
        newName = prompt("Enter your username (required)", "")
      }
      session.authenticatedFetch("/api/setName", {
        method: "POST",
        body: JSON.stringify({name: newName}),
        headers:  {"Content-type": "application/json"}
      }).then(() => {
        session.account.name = newName;
        session.logIn(session.account);
      });
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
              if( !(session.account?.name || "") ) {
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

  const sessionUseState = useState(originalSessionObject);
  session = sessionUseState[0];
  setSession = sessionUseState[1];

  return (
    <SessionContext.Provider value={session}>
      {flashMessage != "" && <div className="flash">{flashMessage}</div>}
      <Router>
        <ConversationsList path="/" />
        <Login path="/login/:token?" />
        <Conversation path="/:remoteNumber/convo" />
      </Router>
      <div class="modal-container" style={{display: loading > 0 ? "block" : "none" }}>
        <div class="loader">loading</div>
      </div>
    </SessionContext.Provider>
  );
};


render(<Main />, document.getElementById('app'));