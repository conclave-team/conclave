import Peer from 'peerjs';
import SimpleMDE from 'simplemde';

import Controller from './controller';
import Broadcast from './broadcast';
import Editor from './editor';

let ph;

if (gTARGETPEERID == 0) {
  ph = "Share the link to invite collaborators to your room.";
} else {
  ph = "Give me a second to retrieve the current document from your network.";
}

new Controller(
  gTARGETPEERID,
  gHOST,
  new Peer({key: 'mgk9l45fu1gfzuxr'}),
  new Broadcast(gTARGETPEERID),
  new Editor(new SimpleMDE({
    placeholder: ph,
    spellChecker: false,
    toolbar: false,
    autofocus: true,
    indentWithTabs: true,
    tabSize: 4,
  }))
);
