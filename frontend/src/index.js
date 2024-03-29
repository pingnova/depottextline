import { render } from 'preact';
import { Router } from 'preact-router';
import { useEffect, useState } from 'preact/hooks';

import './index.css';
import { SessionContextComponent } from './Session.js'
import { ModalContextComponent } from './Modal.js'
import ConversationsList from './ConversationsList.js';
import Conversation from './Conversation.js';
import Login from './Login.js';
import { PresenceContextComponent } from './Presence.js';

const Main = () => {

  const [loading, setLoading] = useState(0);
  const [flashMessage, setFlashMessage] = useState("");

  return (
    <ModalContextComponent>
    <SessionContextComponent loading={loading} setLoading={setLoading} setFlashMessage={setFlashMessage}>
    <PresenceContextComponent>

      {flashMessage != "" && <div className="flash">{flashMessage}</div>}
      <Router>
        <ConversationsList path="/" />
        <Login path="/login/:token?" />
        <Conversation path="/:remoteNumber/convo" />
      </Router>
      <div class="loader-container" style={{display: loading > 0 ? "block" : "none" }}>
        <div class="loader">loading</div>
      </div>

    </PresenceContextComponent>
    </SessionContextComponent>
    </ModalContextComponent>
  );
};


render(<Main />, document.getElementById('app'));