import Editor from './editor';
import CRDT from './crdt';
import Char from './char';
import Identifier from './identifier';
import VersionVector from './versionVector';
import Broadcast from './broadcast';
import UUID from 'uuid/v1';
import Peer from 'peerjs';

class Controller {
  constructor(targetPeerId, host, peer) {
    this.siteId = UUID();
    this.host = host;
    this.peer = peer;
    this.buffer = [];

    this.editor = new Editor(this);
    this.crdt = new CRDT(this);
    this.vector = new VersionVector(this);
    this.broadcast = new Broadcast(this, targetPeerId);
  }

  updateShareLink(id) {
    const sharingLink = this.host + '/?id=' + id;
    const aTag = document.querySelector('#myLink');

    aTag.append(sharingLink);
    aTag.setAttribute('href', sharingLink);
  }

  addToConnectionList(id) {
    const node = document.createElement('LI');

    node.appendChild(document.createTextNode(id));
    node.id = id;
    document.querySelector('#peerId').appendChild(node);
  }

  removeFromConnectionList(id) {
    document.querySelector('#' + id).remove();
  }

  handleRemoteOperation(data) {
    const operation = JSON.parse(data);
    if (this.vector.hasBeenApplied(operation.version)) return;

    if (operation.type === 'insert') {
      this.applyOperation(operation);
    } else if (operation.type === 'delete') {
      this.buffer.push(operation);
      this.processDeletionBuffer();
    }

    this.broadcast.send(operation);
  }

  processDeletionBuffer() {
    let found = false;
    let i = 0;
    let deleteOperation;

    while (i < this.buffer.length) {
      deleteOperation = this.buffer[i];

      if (this.hasInsertionBeenApplied(deleteOperation)) {
        found = true;
        this.applyOperation(deleteOperation);
        this.buffer.splice(i, 1);
      } else {
        i++;
      }
    }

    if (found) this.processDeletionBuffer();
  }

  hasInsertionBeenApplied(operation) {
    const charVersion = { siteId: operation.char.siteId, counter: operation.char.counter };
    return this.vector.hasBeenApplied(charVersion);
  }

  applyOperation(operation) {
    const char = operation.char;
    const identifiers = char.position.map(pos => new Identifier(pos.digit, pos.siteId));
    const newChar = new Char(char.value, char.counter, char.siteId, identifiers);

    if (operation.type === 'insert') {
      this.crdt.insertChar(newChar);
    } else if (operation.type === 'delete') {
      this.crdt.deleteChar(newChar);
    }

    this.vector.update(operation.version);
  }

  handleDelete(startIdx, endIdx) {
    this.crdt.handleLocalDelete(startIdx, endIdx);
  }

  handleInsert(char, idx) {
    this.crdt.handleLocalInsert(char, idx);
  }

  broadcastInsertion(char) {
    this.vector.increment();

    const operation = {
      type: 'insert',
      char: char,
      version: this.vector.getLocalVersion()
    };

    this.broadcast.send(operation);
  }

  broadcastDeletion(char) {
    this.vector.increment();

    const operation = {
      type: 'delete',
      char: char,
      version: this.vector.getLocalVersion()
    };

    this.broadcast.send(operation);
  }

  updateEditor() {
    this.editor.updateView(this.crdt.text);
  }
}

new Controller(gTARGETPEERID, gHOST, new Peer({key: 'mgk9l45fu1gfzuxr', debug: 1}));
