import { useState, useEffect, useContext } from 'preact/hooks';
import { route } from 'preact-router';

// its all in conversation.css
// import './ConversationsList.css';
import shareImage from './share.png'
import EventHub from './EventHub';
import { SessionContext } from './Session';
import Avatar from './Avatar';
import {  beautifyPhoneNumber, getTimeSince } from './uiFunctions.js';

function ConversationsList() {

  const [conversations, setConversations] = useState([]);
  const session = useContext(SessionContext);


  EventHub.subscriptions.ConversationsList = {
    'conversation_event': (eventData) => {
      const matchingConversations = conversations.filter(x => x.remoteNumber == eventData.remoteNumber);
      if(matchingConversations.length == 1) {
        matchingConversations[0].sentBy = eventData.sentBy
        if(eventData.body) {
          matchingConversations[0].body = eventData.body
        }
        if(eventData.status) {
          const description = `status changed from "${matchingConversations[0].status}" to "${eventData.status}"`;
          matchingConversations[0].body = `${description}${eventData.comment ? `because "${eventData.comment}"` : ''}`
          matchingConversations[0].status = eventData.status
        }
        matchingConversations[0].date = eventData.date

        setConversations(
          matchingConversations.concat(conversations.filter(x => x.remoteNumber != eventData.remoteNumber))
        )
      }
    }
  };

  // useEffect takes 2 arguments: the effect function and the dependencies
  // useEffect will fire the effect function every time one of the dependencies changes
  // here there are no dependencies, so it will fire the function once when the component mounts
  useEffect(() => {
    session.authenticatedFetch("/api/conversations", null, true).then(setConversations)

    // https://robertmarshall.dev/blog/componentwillunmount-functional-components-react/#componentwillunmount-in-useeffect
    // functions returned from the effect function will be called when the component unmounts, as cleanup 
    return () => delete EventHub.subscriptions.ConversationsList;
  }, []);

  const share = () => {
    const identity = prompt("Invite Another User: Enter Phone # / Email Address", "").trim()
    if(identity) {
      session.authenticatedFetch("/auth/get_login_token", {
        method: "POST",
        body: JSON.stringify({identity}),
        headers:  {"Content-type": "application/json"}
      }, true).then(() => {
        alert(`${identity} has been invited!`)
      });
    }
  };

  if(!session?.account?.id) {
    return "..."
  }

  return (
    <div class="column width100">
      <div class="row space-between view-header">

        <div class="row space-between grow">
          <div class="subrow">
            <b><i>Depot Text Line</i></b>
            <div class="share-button clickable" onClick={share}>
              <img src={shareImage}></img>
            </div>
          </div>
          <span class="double-spaced clickable" onClick={session.promptForUsername}>
            {session.account?.name || "Anonymous"}
          </span>
        </div> 
        <div class="clickable" onClick={session.promptForUsername}>
          <Avatar className="right" name={session.account?.name || ""} identityForColor={session.account?.id || ""}/>
        </div>
      </div>

      <div class="grow column justify-start width100 view-body">
      {conversations.map((x) => (
        <div class="row space-between clickable conversation" onClick={() => route(`/${x.remoteNumber}/convo`)}>
          <Avatar className="left" name={x.name} identityForColor={x.remoteNumber}/>
          <div class="grow">
            <div class="row space-between align-start">
              <div class="subrow wrap">
                <span>{x.name ? x.name : beautifyPhoneNumber(x.remoteNumber)}</span>
                <span class="small-text"> &nbsp; {x.name ? beautifyPhoneNumber(x.remoteNumber) : ''}</span>
              </div>
              <div class="subrow">
                <b class="small-status">{x.status}</b>
                <div class="small-text small-ago">{getTimeSince(x.date)}</div>
              </div>
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
