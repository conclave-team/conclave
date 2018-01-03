import Peer from 'peerjs';
import SimpleMDE from 'simplemde';

import Controller from './controller';
import Broadcast from './broadcast';
import Editor from './editor';

if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) {

} else {
  new Controller(
    (location.search.slice(1) || '0'),
    location.origin,
    new Peer({
        host: location.hostname,
        port: location.port || (location.protocol === 'https:' ? 443 : 80),
        path: '/peerjs',
        config: {'iceServers':
          [
            { url: 'stun:stun1.l.google.com:19302' },
            { url: 'turn:numb.viagenie.ca',
              credential: 'conclave-rulez',
              username: 'sunnysurvies@gmail.com'
            }
          ]
        },
        debug: 1
      }),
    new Broadcast(),
    new Editor(new SimpleMDE({
      placeholder: "Share the link to invite collaborators to your document.",
      spellChecker: false,
      toolbar: false,
      autofocus: false,
      indentWithTabs: true,
      tabSize: 4,
      indentUnit: 4,
      lineWrapping: false,
      shortCuts: []
    }))
  );
}
