import { useState, useEffect, useContext, useRef } from 'preact/hooks';
import { route } from 'preact-router';

import './Conversation.css';
import SessionContext from './SessionContext';
import { getAvatar, beautifyPhoneNumber, getTimeSince, keyEventHandlerFor } from './uiFunctions.js';

function Conversation(props) {

  const [reply, setReply] = useState("");
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState("");
  const session = useContext(SessionContext);

  const scrollElement = useRef(null);

  // useEffect takes 2 arguments: the effect function and the dependencies
  // useEffect will fire the effect function every time one of the dependencies changes
  // here there are no dependencies, so it will fire the function once when the component mounts
  useEffect(() => {
    session.authenticatedFetch(`/api/conversations/${props.remoteNumber}`).then(responseObject => {
      setMessages(responseObject.messages.map(x => ({...x, date: new Date(x.date)})));
      setName(responseObject.name);
    })
  }, [props.remoteNumber]);

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
        setMessages([{
          body: reply,
          incoming: false,
          date: new Date(),
        }].concat(messages))
        setReply("");
      })
    }
  };

  const formatTime = (date) => {
    const millisecondsPerHour = 3600000
    if( (new Date().getTime() - date.getTime()) <  millisecondsPerHour) {
      return getTimeSince(date)
    }
    return date.toLocaleTimeString().toLowerCase().replace(/(\d+:\d+):\d+/, "$1");
  };

  const differentDays = (date1, date2) => {
    return date1.getDate() != date2.getDate() 
        || date1.getMonth() != date2.getMonth() 
        || date1.getFullYear() != date2.getFullYear();
  };

  const describeDay = (date) => {
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
  };

  // whenever new messages are loaded, scroll to the bottom of the page!
  useEffect(() => {
    setTimeout(() => {
      if (scrollElement.current) scrollElement.current.scrollTop = scrollElement.current.scrollHeight;
    }, 10)
  }, [messages]);

  return (
    <div class="column">
      <div class="row space-between">
        <div class="avatar-container clickable" onClick={() => route("/")}>
          <span class="large-text">←</span>
        </div>
        <div class="avatar-container">
          <div class="avatar">
            {getAvatar(name)}
          </div>
        </div>
        <div class="grow">
          <span>{beautifyPhoneNumber(props.remoteNumber)}</span>
        </div>
      </div>
      <div class="grow column justify-start width100 chat-container" ref={scrollElement}>
        <div class="chat">
          {messages.map((x, i) => (<div key={x.date}>
            {/* if */ (i < messages.length-1 && differentDays(messages[i+1].date, x.date)) && /* then */
              <div class="row justify-center small-text">
                {describeDay(x.date)}
              </div>
            }
            <div class={`row ${x.incoming ? 'justify-start' : 'justify-end'}`}>
              <div class={`chat-bubble ${x.incoming ? 'incoming' : ''}`}>
                {x.body}<br/>
                <div class="small-text float-right">{formatTime(x.date)}</div>
              </div>
            </div>
          </div>))}
        </div>
      </div>
      <div class="row reply-form">
        <form onSubmit={sendMessage} class="grow">
          <input class="message-input" type="text" placeholder={"SMS Message"}
                 value={reply} onInput={keyEventHandlerFor(setReply)}>
          </input>
        </form>

        <div class="large-text send-button clickable" onClick={sendMessage}>→</div>
        
      </div>
    </div>
  );
}

export default Conversation;
