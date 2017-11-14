import Peer from 'peerjs';
import SimpleMDE from 'simplemde';

import Controller from './controller';
import Broadcast from './broadcast';
import Editor from './editor';

new Controller(
  gTARGETPEERID,
  gADDRESS,
  new Peer({host: gHOST, port: gPORT, path: 'peerjs', debug: 1}),
  new Broadcast(),
  new Editor(new SimpleMDE({
    placeholder: "Share the link to invite collaborators to your room.",
    spellChecker: false,
    toolbar: false,
    autofocus: true,
    indentWithTabs: true,
    tabSize: 4,
    indentUnit: 4,
  }))
);
