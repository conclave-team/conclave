import Peer from 'peerjs';
import SimpleMDE from 'simplemde';

import UUID from 'uuid/v1';
import DemoController from './controller';
import Broadcast from './broadcast';
import Editor from './editor';
import UserBot from './userBot';

const demo = new DemoController(
  gTARGETPEERID,
  gHOST,
  new Peer('conclavedemo', {host: 'conclavepeerjs.herokuapp.com', port: 443, secure: true, key: 'peerjs' , debug: 1}),
  new Broadcast(),
  new Editor(new SimpleMDE({
    placeholder: "Share the link to invite collaborators to your room.",
    spellChecker: false,
    toolbar: false,
    autofocus: true,
    indentWithTabs: true,
    tabSize: 4,
    indentUnit: 4,
    lineWrapping: false,
    shortCuts: []
  }))
);
