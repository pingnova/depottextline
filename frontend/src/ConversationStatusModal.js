
import {inputHandlerFor} from './uiFunctions.js'
import { useState } from 'preact/hooks';

const ConversationStatusModal = (modal, name, previousStatus) => modal.open(
  `Status for ${name}`,
  (resolve, reject, buttonsComponent) => {
    const [status, setStatus] = useState(previousStatus);
    const [comment, setComment] = useState("");

    const buttons = [
      {
        escapeKey: true,
        text: "Cancel",
        onClick: () => reject()
      },
      {
        enterKey: true,
        text: "Save",
        onClick: () => resolve({
          status,
          comment
        })
      }
    ];

    const possibleStatuses = [
      "new",
      "reviewed",
      "on hold",
      "filled",
      "delivered",
      "unfilled",
      "out for delivery"
    ];

    return <>
      <p>These status updates are for our internal note-taking, they will not be texted to {name}</p>
      <div class="form row justify-start">
        <label for="status_input">Status:</label>
        <select id="status_input" onInput={inputHandlerFor(setStatus)}>
          {possibleStatuses.map(x => {
            return x == status ? (<option value={x} selected>{x}</option>) :  (<option value={x}>{x}</option>);
          })}
        </select>
      </div>
      <div class="form row justify-start">
        <div>
          <div>
            <label for="comment_input">Comment: (Optional)</label>
          </div>
          <textarea type="text" id="comment_input" 
                 value={comment} onInput={inputHandlerFor(setComment)}>
          </textarea>
        </div>
      </div>
      {buttonsComponent(buttons)}
    </>
  }
);

export default ConversationStatusModal