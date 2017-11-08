import Peer from 'peerjs';
import SimpleMDE from 'simplemde';

import Controller from './controller';
import Broadcast from './broadcast';
import Editor from './editor';

new Controller(
  gTARGETPEERID,
  gHOST,
  new Peer({key: 'mgk9l45fu1gfzuxr'}),
  new Broadcast(gTARGETPEERID),
  new Editor(new SimpleMDE({
    placeholder: 'Type here...',
    spellChecker: false,
    toolbar: false,
    autofocus: true
  }))
);
