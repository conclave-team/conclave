import Editor from './editor';
import CRDT from './crdt';
import Char from './char';
import Identifier from './identifier';
//import VersionVector from './versionVector';
import Peer from 'peerjs';

new Controller.init();

class Controller {
  constructor() {
    this.peer = new Peer({key: 'mgk9l45fu1gfzuxr', debug: 1});
    this.editor = new Editor(this);
    this.crdt = new CRDT(this);
    this.conns = [];
//    this.vector = new VersionVector(this);
  }

  init() {
    this.peer.on('open', function(id) {
      const sharingLink = 'http://localhost:3000/?id=' + id;
      const aTag = document.querySelector('#myLink');
      aTag.append(sharingLink)
      aTag.setAttribute('href', sharingLink);
      editor.bindChangeEvent();
    });

    if (peerId != 0) {
      this.conns.push(this.peer.connect(peerId));

      const node = document.createElement('LI');
      node.appendChild(document.createTextNode(peerId));
      document.querySelector('#peerId').appendChild(node);
    }

    this.peer.on('connection', function(connection) {
      const peers = Object.keys(this.peer.connections);
      if (this.conns.length < peers.length) {
        connection.on('open', function() {
          const conn = this.peer.connect(peers[peers.length-1]);
          this.conns.push(conn);

          const node = document.createElement('LI');
          node.appendChild(document.createTextNode(conn.peer));
          document.querySelector('#peerId').appendChild(node);
        });
      }

      connection.on('data', function(data) {
        const dataObj = JSON.parse(data);
        const identifiers = dataObj.position.map(pos => new Identifier(pos.digit, pos.siteId));
        const charObj = new Char(dataObj.value[0], dataObj.counter, identifiers);
        this.crdt.insertChar(charObj);
        this.editor.updateView();
      });
    });
  }
}
