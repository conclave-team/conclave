import Peer from 'peerjs';
import SimpleMDE from 'simplemde';

import UUID from 'uuid/v1';
import DemoController from './controller';
import Broadcast from './broadcast';
import Editor from './editor';
import UserBot from './userBot';
import fs from 'fs';

const id = Math.floor(Math.random() * 100000);

const demo = new DemoController(
  (location.search.slice(1) || '0'),
  location.origin,
  new Peer('conclave-demo-'+id, {
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

const script1 = `## Welcome!

Conclave is a peer-to-peer collaborative text editor and
was created by Elise Olivares, Nitin Savant, and Sunny Beatteay.

Conclave allows you to connect to multiple peers and edit a document together.
This particular editor also supports markdown.

### see?

To start an editing session, go to the *Home* tab and share the link at the bottom
with a friend, or open it in a new tab and type to yourself.

You can video chat with a peer by clicking on the phone icon next to
their name. A video will appear that you can move around and minimize. To
exit the video, just click the "X" on the corner of the video box.

You can download the text document at anytime using the *Save* button. If you
are the person who began the editing session, you can also upload a document
to the editor using the *Upload* button.

Happy Typing!`;

const bot1 = new UserBot('conclave-bot'+id, 'conclave-demo-'+id, script1, demo.editor.mde);
bot1.runScript(75);
