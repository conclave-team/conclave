'use strict';

var _editor = require('./editor');

var _editor2 = _interopRequireDefault(_editor);

var _peerjs = require('peerjs');

var _peerjs2 = _interopRequireDefault(_peerjs);

var _char = require('./char');

var _char2 = _interopRequireDefault(_char);

var _identifier = require('./identifier');

var _identifier2 = _interopRequireDefault(_identifier);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var peer = new _peerjs2.default({ key: 'mgk9l45fu1gfzuxr', debug: 1 });
var editor = void 0;
var conns = [];
var changedChar = void 0;

peer.on('open', function (id) {
  editor = new _editor2.default(id);
  var sharingLink = 'http://localhost:3000/?id=' + id;
  var aTag = document.querySelector('#myLink');
  aTag.append(sharingLink);
  aTag.setAttribute('href', sharingLink);
  editor.mde.codemirror.on("change", function (self, changeObj) {
    var idx = editor.findLinearIdx(changeObj.from.line, changeObj.from.ch);

    if (changeObj.origin === "+input") {
      var char = changeObj.text.length > 1 ? '\n' : changeObj.text;
      changedChar = editor.crdt.handleLocalInsert(char, idx);
    } else if (changeObj.origin === "+delete") {
      changedChar = editor.crdt.handleLocalDelete(idx);
    }

    conns.forEach(function (conn) {
      conn.send(JSON.stringify(changedChar));
    });
  });
});

if (peerId != 0) {
  var conn = peer.connect(peerId);
  conns.push(conn);

  var node = document.createElement('LI');
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

peer.on('connection', function (connection) {
  var peers = Object.keys(peer.connections);
  if (conns.length < peers.length) {
    connection.on('open', function () {
      var conn = peer.connect(peers[peers.length - 1]);
      conns.push(conn);

      var node = document.createElement('LI');
      node.appendChild(document.createTextNode(conn.peer));
      document.querySelector('#peerId').appendChild(node);
    });
  }

  connection.on('data', function (data) {
    var dataObj = JSON.parse(data);
    var identifiers = dataObj.position.map(function (pos) {
      return new _identifier2.default(pos.digit, pos.siteId);
    });
    var charObj = new _char2.default(dataObj.value[0], dataObj.counter, identifiers);
    editor.crdt.insertChar(charObj);
    editor.updateView();
  });
});