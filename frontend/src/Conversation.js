import { useState, useEffect, useContext, useRef } from 'preact/hooks';
import { route } from 'preact-router';

import './Conversation.css';
import { SessionContext } from './Session';
import EventHub from './EventHub';
import Avatar from './Avatar';
import { ModalContext } from './Modal.js'
import TextInputModal from './TextInputModal.js'
import ConversationStatusModal from './ConversationStatusModal.js'
import {  beautifyPhoneNumber, getTimeSince, inputHandlerFor } from './uiFunctions.js';

function Conversation(props) {

  const [reply, setReply] = useState("");
  const [events, setEvents] = useState([]);
  const [name, setName] = useState("");
  const [status, setStatus] = useState("");
  const session = useContext(SessionContext);
  const modal = useContext(ModalContext);

  const scrollElement = useRef(null);
  const textInputElement = useRef(null);

  // useEffect takes 2 arguments: the effect function and the dependencies
  // useEffect will fire the effect function every time one of the dependencies changes
  // here there are no dependencies, so it will fire the function once when the component mounts
  useEffect(() => {
    session.authenticatedFetch(`/api/conversations/${props.remoteNumber}`, null,  true).then(responseObject => {
      setEvents(responseObject.events.map(x => ({...x, date: new Date(x.date)})));
      setName(responseObject.name);
      setStatus(responseObject.status);
      textInputElement.current?.focus();
    })
  }, [props.remoteNumber]);

  useEffect(() => {
    EventHub.subscriptions.Conversation = {
      'conversation_event': (eventData) => {
        if(eventData.remoteNumber == props.remoteNumber) {
          setEvents([{
            body: eventData.body,
            sentBy: eventData.sentBy,
            date: new Date(eventData.date),
          }].concat(events))
        }
      }
    }

    // https://robertmarshall.dev/blog/componentwillunmount-functional-components-react/#componentwillunmount-in-useeffect
    // functions returned from the effect function will be called when the component unmounts, as cleanup 
    return () => delete EventHub.subscriptions.Conversation;
  }, [])

  const sendMessage = (e) => {
    if(e && e.preventDefault) {
      e.preventDefault();
    }

    if(reply != "") {
      session.authenticatedFetch(
        `/api/send/${props.remoteNumber}`,
        {
          method: "POST",
          body: JSON.stringify({body: reply}),
          headers:  {"Content-type": "application/json"}
        }
      ).then(() => {
        setEvents([{
          body: reply,
          sentBy: session.account?.name || "Anonymous",
          date: new Date(),
        }].concat(events))
        setReply("");
      })
    }
  };

  const contactProfileModal = () => {
    TextInputModal(modal, {
      title: `Contact Profile for ${props.remoteNumber}`,
      inputLabel: "Name",
      initialValue: name || ""
    })
    .then((newName) => {
      if(newName) {
        session.authenticatedFetch(`/api/conversations/${props.remoteNumber}/name`, {
          method: "POST",
          body: JSON.stringify({name: newName}),
          headers:  {"Content-type": "application/json"}
        }, true).then(() => {
          setName(newName);
        });
      }
    });
  };

  const statusModal = () => {
    ConversationStatusModal(modal, name || props.remoteNumber, status)
    .then((statusUpdate) => {
      if(statusUpdate) {
        session.authenticatedFetch(`/api/conversations/${props.remoteNumber}/status`, {
          method: "POST",
          body: JSON.stringify(statusUpdate),
          headers:  {"Content-type": "application/json"}
        }, true).then(() => {
          setStatus(statusUpdate.status);
          setEvents([{
            ...statusUpdate,
            sentBy: session.account?.name || "Anonymous",
            date: new Date(),
          }].concat(events))
        });
      }
    });
  };

  
  // don't display the component until the user is logged in
  if(!session?.account?.id) {
    return "..."
  }

  // whenever new events are loaded, scroll to the bottom of the page!
  useEffect(() => {
    setTimeout(() => {
      if (scrollElement.current) {
        scrollElement.current.scrollTop = scrollElement.current.scrollHeight;
      }
    }, 10)
  }, [events]);

  return (
    <div class="column width100">
      <div class="row space-between view-header">
        <div class="avatar-container clickable" onClick={() => route("/")}>
          <span class="large-text">←</span>
        </div>
        <Avatar className="left right clickable" 
                name={name} identityForColor={props.remoteNumber} onClick={contactProfileModal}/>
        <div class="grow">
          <div className="clickable" onClick={contactProfileModal}>
            {name && <div>{name}</div>}
            <div class={name ? "small-text" : ""}>{beautifyPhoneNumber(props.remoteNumber)}</div>
          </div>
        </div>
        <div>
          <button onClick={statusModal}>
            Status: {status}
          </button>
        </div>
        <div>
          &nbsp;
        </div>
      </div>
      <div class="grow column justify-start width100 view-body" ref={scrollElement}>
        <div class="chat">
          {events.map((x, i) => (<div key={x.date}>
            {/* if */ (i < events.length-1 && differentDays(events[i+1].date, x.date)) && /* then */
              <div class="row justify-center small-text">
                {describeDay(x.date)}
              </div>
            }
            {
              // there are two types of events, SMS messages which have a body property, 
              // and status updates which have a status property
            }
            {/* if */ x.body && /* then */
              <div class={`row ${x.sentBy ?'justify-end' :  'justify-start'}`}>
                <div class={`chat-bubble ${x.sentBy ?  '' : 'incoming'}`}>
                  {x.body}<br/>
                  <div class="small-text float-right">
                    {x.sentBy}{x.sentBy && <> &nbsp;</>}{formatTime(x.date)}
                  </div>
                </div>
              </div>
            }
            {/* if */ x.status && /* then */
              <div class="status-update">
                <div class="grow"></div>
                <div>{x.sentBy} set the status to "{x.status}" {x.comment ? `because "${x.comment}"` : ''}</div>
                <div class="grow"></div>
                <div class="small-text float-right">
                  {formatTime(x.date)}
                </div>
              </div>
            }
          </div>))}
        </div>
      </div>
      <div class="row reply-form">
        <form onSubmit={sendMessage} class="grow">
          <textarea class="message-input" type="text" placeholder={"SMS Message"} 
                 style={{height: `${reply.split("\n").length*1.5+1}em`, lineHeight: '1.5em'}}
                 onKeyDown={(e) => {
                   // Normally a textarea will consume the enter key event to make a newline.
                   // instead we submit the form, but only if the shift key is not pressed :) 
                   if(!e.shiftKey && e.key == "Enter") {
                     e.preventDefault();
                     sendMessage();
                   }
                 }}
                 ref={textInputElement} value={reply} onInput={inputHandlerFor(setReply)}>
          </textarea>
        </form>

        <div class="large-text send-button clickable" onClick={sendMessage}>→</div>
        
      </div>
    </div>
  );
}


function formatTime(date) {
  const millisecondsPerHour = 3600000
  if( (new Date().getTime() - date.getTime()) <  millisecondsPerHour) {
    return getTimeSince(date)
  }
  return date.toLocaleTimeString().toLowerCase().replace(/(\d+:\d+):\d+/, "$1");
}

function differentDays(date1, date2) {
  return date1.getDate() != date2.getDate() 
      || date1.getMonth() != date2.getMonth() 
      || date1.getFullYear() != date2.getFullYear();
}

function describeDay(date) {
  const millisecondsPerDay = 86400000;
  const dateString = date.toDateString()
  const todayDateString = new Date().toDateString();
  if(dateString == todayDateString) {
    return "Today";
  }
  if(new Date(date.getTime()+millisecondsPerDay).toDateString() == todayDateString) {
    return "Yesterday";
  }
  if(new Date(date.getTime()+millisecondsPerDay*2).toDateString() == todayDateString) {
    return "Day Before Yesterday";
  }
  return dateString
}

export default Conversation;
