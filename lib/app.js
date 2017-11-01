import Peer from 'peerjs';
import path from 'path';

const peer = new Peer({key: 'mgk9l45fu1gfzuxr', debug: 3});
let conns = [];

peer.on('open', function(id) {
  const sharingLink = 'http://localhost:3000/?id=' + id;
  const aTag = document.getElementById('myLink');
  aTag.append(sharingLink)
  aTag.setAttribute('href', sharingLink);
});

if (peerId != 0) {
  const conn = peer.connect(peerId);
  conns.push(conn);

  const node = document.createElement('LI');
  node.appendChild(document.createTextNode(conn.peer));
  document.getElementById('peerId').appendChild(node);

  console.log('Connected to peer: ', conn);
}

document.getElementById('send').onclick = (() => {
  conns.forEach((conn) => {
    const message = document.getElementById('dataText').value;
    conn.send(message);

    const node = document.createElement('LI');
    node.appendChild(document.createTextNode(message));
    document.getElementById('sent').appendChild(node);
    console.log('Message sent to: ', conn);
  });
});

peer.on('connection', function(connection) {
  if (conns.length < Object.keys(peer.connections).length) {
    connection.on('open', function() {
      const conn = peer.connect(Object.keys(peer.connections)[0]);
      conns.push(conn);
      
      const node = document.createElement('LI');
      node.appendChild(document.createTextNode(conn.peer));
      document.getElementById('peerId').appendChild(node);
    });
  }

  connection.on('data', function(data) {
    const node = document.createElement('LI');
    node.appendChild(document.createTextNode(data));
    document.getElementById('received').appendChild(node);
    console.log('Message received: ', data);
  });
});
