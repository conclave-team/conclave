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

const script1 = `Conclave is a real-time, peer-to-peer collaborative text editor.
It allows you to create and edit documents with multiple people
all at the same time.

### How Do I Use Conclave?

To start editing with a friend, click the *New Document* link above, and
then share the link at the bottom of the page with all your collaborators.

### Doesn't Google Already Do This?

Kind of. But Conclave is decentralized and therefore private. Google
stores your documents on their servers where they and the government
could access them. With Conclave, your document is stored on your computer
only and the changes you make are sent only to the people collaborating with you.
Also Google is pretty big. We're just three developers who created Conclave
in one month. Click *Our Team* above to find out who we are.

### What Else Can Conclave Do?

- Video chat with a peer by clicking the phone next to their animal name
- Upload a document from your computer (if you started the session)
- Save the document to your computer at any time

Happy Typing!`;

const bot1 = new UserBot('conclave-bot'+id, 'conclave-demo-'+id, script1, demo.editor.mde);
bot1.runScript(75);
