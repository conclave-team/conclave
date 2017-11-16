import Peer from 'peerjs';
import SimpleMDE from 'simplemde';

import Controller from './controller';
import Broadcast from './broadcast';
import Editor from './editor';

new Controller(
  (location.search.slice(1) || '0'),
  location.origin,
  new Peer({
      host: location.hostname,
      port: location.port || (location.protocol === 'https:' ? 443 : 80),
      path: '/peerjs',
      debug: 3
    }),
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
