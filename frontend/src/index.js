import { render } from 'preact';
import { route, Router } from 'preact-router';
import { useState } from 'preact/hooks';

import './index.css';
import SessionContext from './SessionContext.js'
import ConversationsList from './ConversationsList.js';
import Conversation from './Conversation.js';
import Login from './Login.js';

const originalAccountString = window.localStorage.getItem('depot-text-line-account');
const originalAccount = null;
if(originalAccountString != null && originalAccountString != "") {
  originalAccount = JSON.parse(originalAccountString)
}

const Main = () => {
  const [account, setAccount] = useState(originalAccount);
  const [loading, setLoading] = useState(0);
  const [flashMessage, setFlashMessage] = useState("");

  const sessionObject = {
    account,
    logIn: (account) => {
      window.localStorage.setItem('depot-text-line-account', JSON.stringify(account));
      setAccount(account);
      route("/");
    },
    logOut: (message) => {
      window.localStorage.setItem('depot-text-line-account', "");
      setAccount(null);
      setFlashMessage(message);
      route("/login");
    }, 
    pushLoading: () => setLoading(loading+1),
    popLoading: () => {
      setLoading(loading > 0 ? loading-1 : 0);
      setFlashMessage("");
    },
  };
  sessionObject.authenticatedFetch = (url, options, displayLoader) => {
    if(displayLoader) {
      sessionObject.pushLoading()
    }
    const toReturn = fetch(url, options)
      .then(response => {
        return response.json().then(responseObject => {
          if(response.status == 401) {
            sessionObject.logOut(responseObject.error || "Please log in to view this")
          }
          return responseObject;
        })
      })

    if(displayLoader) {
      toReturn = toReturn.finally(() => sessionObject.popLoading());
    }
    return toReturn;
  }

  return (
    <SessionContext.Provider value={sessionObject}>
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