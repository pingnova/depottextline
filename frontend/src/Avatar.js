
import tinycolor from 'tinycolor2';

import './Avatar.css';
import anon_avatar from './anon.png';
import { getRandomColor } from './uiFunctions.js';

function Avatar({identityForColor, name, className, onClick}) {

  const color = identityForColor ? getRandomColor(identityForColor) : "#ccc";
  const textColor = tinycolor(color).darken(80).toHexString();

  const avatarContent = (name, style) => {
    if(name) {
      if(name.length < 3) {
        return <span class="name" style={style}>{name}</span>
      } else {
        let names = name.trim().split(" ").map(x => x.trim()).filter(x => x.length)
        if(names.length > 2) {
          names = names.slice(0, 2);
        }
        return <span class="name" style={style} >{names.map(x => x[0]).join("")}</span>
      }
    } else {
      return <img src={anon_avatar}></img>
    }
  }

  return (
    <div class={`avatar-container ${className || ""}`} onClick={onClick || (()=>{})} >
      <div class="avatar" style={{backgroundColor: color}}>
        {avatarContent(name, {color: textColor})}
      </div>
    </div>
  );
}

export default Avatar;
