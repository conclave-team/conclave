<<<<<<< Updated upstream
"use strict";
=======
'use strict';

var _peerjs = require('peerjs');

var _peerjs2 = _interopRequireDefault(_peerjs);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var peer = new _peerjs2.default({ key: 'mgk9l45fu1gfzuxr', debug: 3 });
var conns = [];

peer.on('open', function (id) {
  var sharingLink = 'http://localhost:3000/?id=' + id;
  document.getElementById('myId').append(sharingLink);
});

if (peerId != 0) {
  var conn = peer.connect(peerId);
  conns.push(conn);
  console.log('Connected to peer: ', conn);
  document.getElementById('peerId').append(conn.peer, ', ');
}

document.getElementById('send').onclick = function () {
  conns.forEach(function (conn) {
    var message = document.getElementById('dataText').value;
    conn.send(message);

    var node = document.createElement('LI');
    node.appendChild(document.createTextNode(message));
    document.getElementById('sent').appendChild(node);
    console.log('Message sent to: ', conn);
  });
};

peer.on('connection', function (connection) {
  if (conns.length < Object.keys(peer.connections).length) {
    connection.on('open', function () {
      var conn = peer.connect(Object.keys(peer.connections)[0]);
      conns.push(conn);
      console.log('Connected to peer: ', conn);
      document.getElementById('peerId').append(conn.peer, ', ');
    });
  }

  connection.on('data', function (data) {
    var node = document.createElement('LI');
    node.appendChild(document.createTextNode(data));
    document.getElementById('received').appendChild(node);
    console.log('Message received: ', data);
  });
});
>>>>>>> Stashed changes
