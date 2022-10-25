import './Conversations.css';
import anon_avatar from './anon.png';
import SessionContext from './SessionContext';
import { useState, useEffect, useContext } from 'preact/hooks';
import Duration from 'duration';

function Conversations() {

  const [conversations, setConversations] = useState([]);
  const session = useContext(SessionContext);

  // useEffect takes 2 arguments: the effect function and the dependencies
  // useEffect will fire the effect function every time one of the dependencies changes
  // here there are no dependencies, so it will fire the function once when the component mounts
  useEffect(() => {
    session.authenticatedFetch("/api/conversations").then(setConversations)
  }, []);

  const getAvatar = (conversation) => {
    if(conversation.name) {
      if(conversation.name.length < 3) {
        return <span class="name">{conversation.name}</span>
      } else {
        names = conversation.name.trim().split(" ").map(x => x.trim()).filter(x => x.length)
        if(names.length > 2) {
          names = names.slice(0, 2);
        }
        return <span class="name">{names.map(x => x[0]).join("")}</span>
      }
    } else {
      return <img src={anon_avatar}></img>
    }
  };

  const getTimeSince = (timeString) => {
    const previousDate = new Date(timeString);

    // https://github.com/medikoo/duration
    const duration = new Duration(previousDate, new Date());

    // console.log("Alternative string representation: ", duration.toString(1));
    // 10y 2m 6d 3h 23m 8s 456ms
    const longDurationString = duration.toString(1);

    return longDurationString.split(" ")[0];

  };

  return (
    <div>
      {conversations.map((x) => (
        <div class="row space-between">
          <div class="avatar-container">
            <div class="avatar">
              {getAvatar(x)}
            </div>
          </div>
          <div class="grow">
            <div class="row space-between align-start">
              <span>{x.remote_number}</span>
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

export default Conversations;
