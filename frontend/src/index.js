import { render } from 'preact';
import { route, Router } from 'preact-router';
import { useState } from 'preact/hooks';

import './index.css';
import SessionContext from './SessionContext.js'
import ConversationsList from './ConversationsList.js';
import Conversation from './Conversation.js';
import Login from './Login.js';

const originalSessionId = window.localStorage.getItem('depot-text-line-session-id');
const originalUsername = window.localStorage.getItem('depot-text-line-username');

const Main = () => {
  const [sessionId, setSessionId] = useState(originalSessionId);
  const [username, setUsername] = useState(originalUsername);
  const [loading, setLoading] = useState(0);
  const [flashMessage, setFlashMessage] = useState("");

  const sessionObject = {
    username,
    logIn: (sessionId, username) => {
      window.localStorage.setItem('depot-text-line-session-id', sessionId);
      window.localStorage.setItem('depot-text-line-username', username);
      setSessionId(sessionId);
      setUsername(username);
      route("/");
    },
    logOut: (message) => {
      setSessionId("");
      setUsername("");
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
    options = options || {};
    options.headers = options.headers || {};
    options.headers['Authorization'] = `Bearer ${sessionId || ""}`;
    const toReturn = fetch(url, options)
      .then(response => {
        return response.json().then(responseObject => {
          if(response.status == 401) {
            setFlashMessage(responseObject.error)
            route("/login");
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