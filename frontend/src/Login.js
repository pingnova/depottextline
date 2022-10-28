import { useState, useEffect, useContext } from 'preact/hooks';

import './Login.css';
import { SessionContext } from './Session';
import {inputHandlerFor} from './uiFunctions.js'

function Login(props) {

  const [identity, setIdentity] = useState("");
  const [token, setToken] = useState(props.token);
  const [sentTokenMessage, setSentTokenMessage] = useState("");
  const [promptForToken, setPromptForToken] = useState(props.token);
  const session = useContext(SessionContext);

  const fetchLoginAPI = (url, body) => {
    session.pushLoading()

    return fetch(url, {
        method: "POST",
        body: JSON.stringify(body),
        headers: {"Content-type": "application/json"}
      })
      .then(response => response.json())
      .finally(() => session.popLoading())
  }

  const login = (e) => {
    if(e && e.preventDefault) {
      e.preventDefault();
    }
    
    if(!promptForToken) {
      fetchLoginAPI("/auth/get_login_token", {identity})
        .then(responseObject => {
          if(responseObject.message) {
            setSentTokenMessage(responseObject.message);
            setPromptForToken(true);
          } else {
            session.logOut(responseObject.error || "Unknown Login Error")
          }
        })
        .catch(err => session.logOut(err.toString()));
    } else {
      fetchLoginAPI("/auth/login", {token})
        .then(responseObject => {
          if(responseObject.id && (responseObject.email || responseObject.phoneNumber)) {
            const loggedInAccount = responseObject
            session.logIn(loggedInAccount);
          } else {
            session.logOut(responseObject.error || "Unknown Login Error")
          }
        })
        .catch(err => session.logOut(err.toString()));
    }

  };

  // useEffect takes 2 arguments: the effect function and the dependencies
  // useEffect will fire the effect function every time one of the dependencies changes
  // here there are no dependencies, so it will fire the function once when the component mounts
  useEffect(() => {
    if(props.token) {
      login();
    }
  }, []);


  return (
    <div className="login-container grow">
    <div className="login-form">
      <h1>Login</h1>


      <form onSubmit={login}>

      {/*  This is an if-else-statement  */}
      {/*  It looks wierd because of how react JSX (html) blocks are transpiled into "single-line" javascript statements */}
      {/*  under the hood. if() {} else {} in javascript is multiple lines, it can't be included inside a "single statement". */}
      
      {/*  Well, that's not quite true, it can, if we use an inline immediately executed function (IIFE) like so: */}
      {/*  (() => {  if() {} else {}  })() */}
      {/*  But that's quite a bit of syntax, it's cleaner in React JSX to simply use the Logical And operator "&&" */}

      {/*  It works because the JavaScript interpreter won't evaluate any more than is neccesary to resolve the  */}
      {/*  True-or-False-ish-ness of the Logical And statement.  */}
      {/*  So if we have (promptForToken && etc...) and promptForToken is false, */}
      {/*  It won't even evaluate the etc... part because it already knows false && etc... must be false.  */}
      {/*  However if promptForToken is true, then it must evaluate etc... to figure out if the entire expression is "true" */}
      {/*  In fact, the entire statement (true && etc...) will return whatever etc... is, it won't return boolean true. */}
      {/*  JavaScript statements evaluating to "false-ish" inside the JSX will be simply dropped or omitted by React*/}
   
      {promptForToken && 
        <div>
          <p>
            {sentTokenMessage}
          </p>
          <div className="form row">
            <div class="grow"></div>
            <label for="token">Login Token:</label>
            <input type="text" id="token" value={token} onInput={inputHandlerFor(setToken)} ></input>
            <div class="grow"></div>
          </div>
        </div>
      }
      {!promptForToken && 
        <div>
          <p>If you do not already have an account, one will be created for you.</p>
          <div className="form row">
            <div class="grow"></div>
            <label for="identity">Email or Phone #:</label>
            <input type="text" id="identity" value={identity} onInput={inputHandlerFor(setIdentity)} ></input>
            <div class="grow"></div>
          </div>
        </div>
      }
      <div className="form row">
        <button onClick={login}> Log In </button>
      </div>
      </form>
    </div>
    </div>
  );
}

export default Login;