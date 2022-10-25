import { useState, useEffect, useContext } from 'preact/hooks';
import { route } from 'preact-router';

import './ConversationsList.css';
import SessionContext from './SessionContext';
import { getAvatar, beautifyPhoneNumber, getTimeSince } from './uiFunctions.js';

function ConversationsList() {

  const [conversations, setConversations] = useState([]);
  const session = useContext(SessionContext);

  // useEffect takes 2 arguments: the effect function and the dependencies
  // useEffect will fire the effect function every time one of the dependencies changes
  // here there are no dependencies, so it will fire the function once when the component mounts
  useEffect(() => {
    session.authenticatedFetch("/api/conversations").then(setConversations)
  }, []);

  return (
    <div>
      {conversations.map((x) => (
        <div class="row space-between clickable" onClick={() => route(`/${x.remote_number}/convo`)}>
          <div class="avatar-container">
            <div class="avatar">
              {getAvatar(x)}
            </div>
          </div>
          <div class="grow">
            <div class="row space-between align-start">
              <span>{beautifyPhoneNumber(x.remote_number)}</span>
              <span class="small-text">{getTimeSince(x.last_message)}</span>
            </div>
            <div class="row space-between align-start">
              <span class="small-text">{x.body}</span>
              <span class="small-text">{x.incoming ? (<>&nbsp;</>) : "✅"}</span>
            </div>
          </div>
          <p></p>
        </div>
      ))}
    </div>
  );
}

export default ConversationsList;
