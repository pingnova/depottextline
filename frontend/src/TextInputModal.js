
import {keyEventHandlerFor} from './uiFunctions.js'
import { useState, useRef, useEffect } from 'preact/hooks';

const TextInputModal = (modal, title, inputLabel, initialValue) => modal.open(
  title,
  (resolve, reject, buttonsComponent) => {
    const [text, setText] = useState(initialValue);
    const inputElement = useRef(null);

    const buttons = [
      {
        enterKey: true,
        text: "Save",
        onClick: () => resolve(text)
      }
    ];

    useEffect(() => {
      setTimeout(() => inputElement.current?.focus(), 20)
    }, [])

    return <>
      <div className="form row">
      <label for="modal_text_input">{inputLabel}:</label>
      <input type="text" id="modal_text_input" 
             value={text} onInput={keyEventHandlerFor(setText)} ref={inputElement}>
      </input>
      <div class="grow"></div>
      </div>
      {buttonsComponent(buttons)}
    </>
  }
);

export default TextInputModal