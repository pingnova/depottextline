
import Duration from 'duration';
import tinycolor from 'tinycolor2';


const inputHandlerFor = (setter) => (e) => {
  const { value } = e.target;
  setter(value)
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


function getRandomColor(id) {
  const colorId = hashFnv32a(String(id))
  const goldenRatio = 1.61803;
  const nonCorrelatedSineFudgeFactor = 0.6934;
  const fluctuation = Math.sin(nonCorrelatedSineFudgeFactor*colorId);
  const slowFluctuation = Math.sin(nonCorrelatedSineFudgeFactor*goldenRatio*colorId);

  const clamp01 = (x) => x > 1 ? 1 : (x < 0 ? 0 : x);

  return tinycolor({ 
    h: (goldenRatio * colorId * 360) % 360,
    s: clamp01(0.3 + fluctuation*0.1),
    v: clamp01(0.9 + slowFluctuation*0.15),
  }).toHexString();
};



// https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
function hashFnv32a(str, asString, seed) {
  /*jshint bitwise:false */
  var i, l,
      hval = (seed === undefined) ? 0x811c9dc5 : seed;

  for (i = 0, l = str.length; i < l; i++) {
      hval ^= str.charCodeAt(i);
      hval += (hval << 1) + (hval << 4) + (hval << 7) + (hval << 8) + (hval << 24);
  }
  if( asString ){
      // Convert to 8 digit hex string
      return ("0000000" + (hval >>> 0).toString(16)).substr(-8);
  }
  return hval >>> 0;
}


export {
  inputHandlerFor,
  getRandomColor,
  beautifyPhoneNumber,
  getTimeSince,
}
