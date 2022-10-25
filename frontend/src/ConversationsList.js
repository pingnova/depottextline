import { useState, useEffect, useContext } from 'preact/hooks';
import { route } from 'preact-router';

import './ConversationsList.css';
import SessionContext from './SessionContext';
import { getAvatar, beautifyPhoneNumber, getTimeSince } from './uiFunctions.js';

function ConversationsList() {


  const [name, setName] = useState("");
  const [conversations, setConversations] = useState([]);
  const session = useContext(SessionContext);


  const promptForUsername = () => {
    let newName = "";
    while (newName == "") {
      newName = prompt("Enter your username (required)", "")
    }
    session.authenticatedFetch("/api/setName", {
      method: "POST",
      body: JSON.stringify({name: newName}),
      headers:  {"Content-type": "application/json"}
    }).then(() => {
      setName(newName)
    });
  };


  // useEffect takes 2 arguments: the effect function and the dependencies
  // useEffect will fire the effect function every time one of the dependencies changes
  // here there are no dependencies, so it will fire the function once when the component mounts
  useEffect(() => {
    session.authenticatedFetch("/api/conversations").then(responseObject => {
      setConversations(responseObject.conversations)
      setName(responseObject.name)
      if(responseObject.name == "") {
        promptForUsername()
      }
    })
  }, []);

  return (
    <div class="column">
      <div class="row space-between">

        <div class="avatar-container">
          <div class="avatar clickable" onClick={promptForUsername}>
            {getAvatar(name)}
          </div>
        </div>
        <div class="grow">
          <span></span>
        </div> 
        asd
      </div>

      <div class="grow column justify-start width100 chat-container">
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
              <span class="small-text">{getTimeSince(x.date)}</span>
            </div>
            <div class="row space-between align-start">
              <span class="small-text">{x.body}</span>
              <span class="small-text">{x.incoming ? (<>&nbsp;</>) : "✅"}</span>
            </div>
          </div>
        </div>
      ))}
      </div>

  </div>
  );
}

export default ConversationsList;
