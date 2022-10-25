import anon_avatar from './anon.png';
import Duration from 'duration';


const keyEventHandlerFor = (setter) => (e) => {
  const { value } = e.target;
  setter(value)
};

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

const beautifyPhoneNumber = (str) => {

  // if its a canonical phone #
  if(str.startsWith("+1") && str.length == 12) {
    return `(${str.substring(2, 5)}) ${str.substring(5, 8)} ${str.substring(8, 12)}`;
  }
  return str;
}

const getTimeSince = (timeString) => {
  const previousDate = new Date(timeString);

  // https://github.com/medikoo/duration
  const duration = new Duration(previousDate, new Date());

  // console.log("Alternative string representation: ", duration.toString(1));
  // 10y 2m 6d 3h 23m 8s 456ms
  const longDurationString = duration.toString(1);

  return longDurationString.split(" ")[0];

};

export {
  keyEventHandlerFor,
  getAvatar,
  beautifyPhoneNumber,
  getTimeSince,
}
