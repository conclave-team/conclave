import Editor from './editor';
import Peer from 'peerjs';
import Char from './char';
import Identifier from './identifier';

const peer = new Peer({key: 'mgk9l45fu1gfzuxr', debug: 1});
let editor;
let conns = [];
let changedChar;

peer.on('open', function(id) {
  editor = new Editor(id);
  const sharingLink = 'http://localhost:3000/?id=' + id;
  const aTag = document.querySelector('#myLink');
  aTag.append(sharingLink)
  aTag.setAttribute('href', sharingLink);
  editor.mde.codemirror.on("change", (self, changeObj) => {
    const idx = editor.findLinearIdx(changeObj.from.line, changeObj.from.ch);

    if (changeObj.origin === "+input") {
      const char = changeObj.text.length > 1 ? '\n' : changeObj.text
      changedChar = editor.crdt.handleLocalInsert(char, idx);
    } else if (changeObj.origin === "+delete") {
      changedChar = editor.crdt.handleLocalDelete(idx);
    }

    conns.forEach(conn => {
      conn.send(JSON.stringify(changedChar));
    });
  });
});

if (peerId != 0) {
  const conn = peer.connect(peerId);
  conns.push(conn);

  const node = document.createElement('LI');
  node.appendChild(document.createTextNode(conn.peer));
  document.querySelector('#peerId').appendChild(node);

  console.log('Connected to peer: ', conn);
}

// document.addEventListener('keydown', function(e) {
//   conns.forEach(conn => {
//     const message = document.getElementById('dataText').value;
//     conn.send(e.key);
//   });
// });

peer.on('connection', function(connection) {
  const peers = Object.keys(peer.connections);
  if (conns.length < peers.length) {
    connection.on('open', function() {
      const conn = peer.connect(peers[peers.length-1]);
      conns.push(conn);

      const node = document.createElement('LI');
      node.appendChild(document.createTextNode(conn.peer));
      document.querySelector('#peerId').appendChild(node);
    });
  }

  connection.on('data', function(data) {
    const dataObj = JSON.parse(data);
    const identifiers = dataObj.position.map(pos => new Identifier(pos.digit, pos.siteId));
    const charObj = new Char(dataObj.value[0], dataObj.counter, identifiers);
    editor.crdt.insertChar(charObj);
    editor.updateView();
  });
});
