


import { useState } from 'preact/hooks';
import { createContext } from 'preact';

import './Modal.css';

let enterKeyAction = null;
let escapeKeyAction = null;
window.addEventListener("keydown", (event) => {
  if(event.key == "Enter" && enterKeyAction) {
    enterKeyAction();
  }
  if(event.key == "Escape" && escapeKeyAction) {
    escapeKeyAction();
  }
}, false);

const ModalContext = createContext();

function ModalContextComponent({children}) {


  let modal, setModal;

  const buttonsComponent = (buttons) => {
    enterKeyAction = () => buttons.filter(x => x.enterKey).forEach(x => x.onClick());
    escapeKeyAction = () => {
      const cancelButtons = buttons.filter(x => x.escapeKey);
      if(cancelButtons.length != 0) {
        cancelButtons.forEach(x => x.onClick());
      } else {
        modal.reject();
      }
    };

    return <div class="modal-buttons row justify-end">
      {buttons.map(button => (
        <button onClick={button.onClick}>
          {button.text}
        </button>
      ))}
    </div>
  };

  const originalModal = {
    resolve: () => {},
    reject: () => {},
    open: (title, component) => new Promise((resolve, reject) => {
      setModal({
        ...modal, 
        show: true, 
        title, resolve, reject,
        component: () => component( resolve, reject, buttonsComponent )
      })
    }).then(
      (value) => {
        setModal({...modal, show: false, buttons: [], resolve: () => {}, reject: () => {}})
        return value;
      },
      () => {
        setModal({...modal, show: false, buttons: [], resolve: () => {}, reject: () => {}})
      }
    ),
    show: false,
    title: "example modal title",
    component: (resolve, reject) => "example modal content",
  };
  [modal, setModal] = useState(originalModal);
  
  const {show, title, component} = modal;

  if(!show) {
    enterKeyAction = null;
    escapeKeyAction = null;
  }

  const containerClick = (e) => {
    if(e.target.id == "modal-container") {
      modal.reject();
    }
  }

  return (
    <ModalContext.Provider value={modal}>
      {children}
      {
        show && <div class="modal-container" id="modal-container" onClick={containerClick}>
          <div class="modal content" >
            <h3 id="modal-title">{title}</h3>
            {component()}
          </div>
        </div>
      }
    </ModalContext.Provider>
  );
}

export  { ModalContextComponent, ModalContext };


