import { useState, useEffect, useContext } from 'preact/hooks';
import { route } from 'preact-router';

// its all in conversation.css
// import './ConversationsList.css';
import EventHub from './EventHub';
import SessionContext from './SessionContext';
import Avatar from './Avatar';
import {  beautifyPhoneNumber, getTimeSince } from './uiFunctions.js';

function ConversationsList() {

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
      session.account.name = newName;
      session.logIn(session.account);
    });
  };


  // useEffect takes 2 arguments: the effect function and the dependencies
  // useEffect will fire the effect function every time one of the dependencies changes
  // here there are no dependencies, so it will fire the function once when the component mounts
  useEffect(() => {
    session.authenticatedFetch("/api/conversations")
      .then(setConversations)
      .then(() => {
        if( !(session.account?.name || "") ) {
          promptForUsername();
        }
      })
  }, []);

  EventHub.subscriptions.ConversationsList = {
    'message': (eventData) => {
      const matchingConversations = conversations.filter(x => x.remoteNumber == eventData.remoteNumber);
      if(matchingConversations.length == 1) {
        matchingConversations[0].sentBy = eventData.sentBy
        matchingConversations[0].body = eventData.body
        matchingConversations[0].date = eventData.date

        setConversations(
          matchingConversations.concat(conversations.filter(x => x.remoteNumber != eventData.remoteNumber))
        )
      }
    }
  }

  return (
    <div class="column width100">
      <div class="row space-between view-header">

        <div class="row space-between grow">
          <span>Depot Text Line</span>
          <span class="double-spaced clickable" onClick={promptForUsername}>
            {session.account?.name || "Anonymous"}
          </span>
        </div> 
        <div class="clickable" onClick={promptForUsername}>
          <Avatar className="right" name={session.account?.name || ""} identityForColor={session.account?.id || ""}/>
        </div>
      </div>

      <div class="grow column justify-start width100 view-body">
      {conversations.map((x) => (
        <div class="row space-between clickable conversation" onClick={() => route(`/${x.remoteNumber}/convo`)}>
          <Avatar className="left" name={x.name} identityForColor={x.remoteNumber}/>
          <div class="grow">
            <div class="row space-between align-start">
              <span>{beautifyPhoneNumber(x.remoteNumber)}</span>
              <span class="small-text">{getTimeSince(x.date)}</span>
            </div>
            <div class="row space-between align-start">
              <span>
              {x.sentBy ? (<span class="small-text">{x.sentBy}:&nbsp; </span>) : (<>📥&nbsp; </>)}
              <span class="small-text">{x.body}</span>
              </span>
              <span class="small-text"> {/* TODO presence here */}</span>
            </div>
          </div>
        </div>
      ))}
      </div>

  </div>
  );
}

export default ConversationsList;
