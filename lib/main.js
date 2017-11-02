import Editor from './editor';
import Peer from 'peerjs';

const peer = new Peer({key: 'mgk9l45fu1gfzuxr', debug: 1});
let editor;
let conns = [];

peer.on('open', function(id) {
  editor = new Editor(id);
  const sharingLink = 'http://localhost:3000/?id=' + id;
  const aTag = document.querySelector('#myLink');
  aTag.append(sharingLink)
  aTag.setAttribute('href', sharingLink);
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
    const node = document.createElement('LI');
    node.appendChild(document.createTextNode(data));
    document.querySelector('#received').appendChild(node);
    console.log('Message received: ', data);
  });
});
