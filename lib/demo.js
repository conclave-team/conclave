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
    placeholder: "Share the link to invite collaborators to your document.",
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

const script1 = `Conclave is a private and secure real-time collaborative text editor. Conclave
allows you to create and edit documents with multiple people all at the same time.

### How Do I Use It?

To start editing, click the *New Document* link above, and then click the blue
boxes icon to copy the *Sharing Link* to your clipboard. Share the link however
you'd like with your collaborators.

### Doesn't Google Already Do This?

Kind of, but Conclave is decentralized and therefore private. Google stores your
documents on their servers where they and the government could access them. With
Conclave, your document is stored only on your computer and any changes you make
are sent only to the people collaborating with you. Also Google is pretty big.
We're just three engineers who created Conclave in a month. Click *Our Team* above
to learn more about us.

### What Else Can Conclave Do?

- Upload a document from your computer to continue editing
- Save the document to your computer at any time

Happy Typing!`;

const bot1 = new UserBot('conclave-bot'+id, 'conclave-demo-'+id, script1, demo.editor.mde);
bot1.runScript(75);
