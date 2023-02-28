

import { useContext } from 'preact/hooks';

import Avatar from './Avatar.js';
import { PresenceContext } from './Presence.js'


import tinycolor from 'tinycolor2';
import { getRandomColor } from './uiFunctions.js';

function PresenceDisplay({path, extended}) {

  const presence = ( (useContext(PresenceContext) || {})[path] || {} );

  if(Object.entries(presence).length == 0) {
    return "";
  }

  return (
    <div class="subrow presence-container">
      {extended && (<span>👁️&nbsp;</span>) }
      {
        extended && Object.entries(presence).map(([account_id, x]) => {
          const color = getRandomColor(account_id);
          const textColor = tinycolor(color).darken(80).toHexString();

          return (<div class="subrow presence" style={{backgroundColor: color}}>
            <span style={{color: textColor}}>&nbsp;{x.name} {x.active ? "👀" : "😴"}</span>
          </div>);
        })
      }
      {
        !extended && Object.entries(presence).map(([account_id, x]) => (
          <>
          <Avatar name={x.name || ""} identityForColor={account_id || ""}/>
          <div class="presence-mini">{x.active ? "👀" : "😴"}</div>
          </>
        ))
      }
    </div>
  );
}

export default PresenceDisplay;
