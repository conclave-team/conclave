import Peer from 'peerjs';
import SimpleMDE from 'simplemde';

import UUID from 'uuid/v1';
import DemoController from './controller';
import Broadcast from './broadcast';
import Editor from './editor';
import UserBot from './userBot';
import fs from 'fs';

const demo = new DemoController(
  (location.search.slice(1) || '0'),
  location.origin,
  new Peer('conclave-demo', {
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

const script1 = `Lorem ipsum dolor sit amet, consectetur adipiscing elit.
Aliquam ut eleifend lorem, eget accumsan justo. Praesent dui lacus,
placerat a nisl ac, hendrerit accumsan odio. Duis sollicitudin vehicula`;


const bot1 = new UserBot('conclave-bot1', 'conclave-demo', script1, demo.editor.mde);
bot1.runScript(200);
