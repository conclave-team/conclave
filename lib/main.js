import Editor from './editor';
import CRDT from './crdt';
import Char from './char';
import Identifier from './identifier';
import VersionVector from './versionVector';
import Peer from 'peerjs';

class Controller {
  constructor() {
    this.siteId = Math.floor(Math.random() * 100);
    this.peer = new Peer({key: 'mgk9l45fu1gfzuxr', debug: 1});
    this.editor = new Editor(this);
    this.crdt = new CRDT(this);
    this.conns = [];
    this.vector = new VersionVector(this);

    this.init();
  }

  init() {
    this.peer.on('open', id => {
      const sharingLink = 'http://localhost:3000/?id=' + id;
      const aTag = document.querySelector('#myLink');
      aTag.append(sharingLink)
      aTag.setAttribute('href', sharingLink);
      this.editor.bindChangeEvent();
    });

    if (peerId != 0) {
      this.conns.push(this.peer.connect(peerId));

      const node = document.createElement('LI');
      node.appendChild(document.createTextNode(peerId));
      document.querySelector('#peerId').appendChild(node);
    }

    this.peer.on('connection', connection => {
      const peers = Object.keys(this.peer.connections);
      if (this.conns.length < peers.length) {
        connection.on('open', () => {
          const conn = this.peer.connect(peers[peers.length-1]);
          this.conns.push(conn);

          const node = document.createElement('LI');
          node.appendChild(document.createTextNode(conn.peer));
          document.querySelector('#peerId').appendChild(node);
        });
      }

      connection.on('data', data => {
        const dataObj = JSON.parse(data);
        const char = dataObj.char;
        const identifiers = char.position.map(pos => new Identifier(pos.digit, pos.siteId));
        const charObj = new Char(char.value[0], char.counter, identifiers);
        if (dataObj.op === 'insert') {
          if (this.vector.isDuplicate(dataObj.currentVersion)) {
            return false;
          }
          this.crdt.insertChar(charObj);
        } else if (dataObj.op === 'delete') {
          if (!this.vector.isDuplicate(charObj)) {
            return false;
          }
          this.crdt.deleteChar(charObj);
        }
        this.vector.update(dataObj.currentVersion);
        this.editor.updateView();
      });
    });
  }

  handleDelete(idx) {
    this.crdt.handleLocalDelete(idx);
  }

  handleInsert(char, idx) {
    this.crdt.handleLocalInsert(char, idx);
  }

  broadcastInsertion(char) {
    const message = {
      op: 'insert',
      char: char,
      currentVersion: this.vector.getLatest()
    };

    const dataJSON = JSON.stringify(message);
    this.conns.forEach(conn => conn.send(dataJSON));
  }

  broadcastDeletion(char) {
    const message = {
      op: 'delete',
      char: char,
      currentVersion: this.vector.getLatest()
    };

    const charJSON = JSON.stringify(char);
    this.conns.forEach(conn => conn.send(charJSON));
  }

  updateEditor() {
    this.editor.updateView(this.crdt.text);
  }
}

new Controller();
