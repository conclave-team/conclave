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
    const dataObj = JSON.parse(data);

    if (this.vector.hasBeenApplied(dataObj.version)) return;

    this.buffer.push(dataObj);
    this.reviewBuffer();
    this.broadcast.send(dataObj);
  }

  reviewBuffer() {
    let found = false;
    let dataObj;

    // for(let i = this.buffer.length - 1; i >= 0; i--) {
    //   dataObj = this.buffer[i];
    //
    //   if (this.vector.hasBeenApplied(dataObj.version)) {
    //     this.buffer.splice(i, 1);
    //   } else {
    //     if (this.isReady(dataObj)) {
    //       found = true;
    //       this.applyOperation(dataObj);
    //       this.buffer.splice(i, 1);
    //     }
    //   }
    // }

    while(i < this.buffer.length) {
      dataObj = this.buffer[i];

      if (this.vector.hasBeenApplied(dataObj.currentVersion)) {
        this.buffer.splice(i, 1);
      } else {
        if (this.isReady(dataObj)) {
          found = true;
          this.applyeOperation(dataObj);
          this.buffer.splice(i, 1);
        } else {
          i++;
        }
      }
    }

    if (found) this.reviewBuffer();
  }

  isReady(dataObj) {
    const charVersion = { siteId: dataObj.char.siteId, counter: dataObj.char.counter };

    switch(dataObj.op) {
      case "insert":
        break;
      case 'delete':
        if (!this.vector.hasBeenApplied(charVersion)) return false;
        break;
    }

    return true;
  }

  applyOperation(dataObj) {
    const char = dataObj.char;
    const identifiers = char.position.map(pos => new Identifier(pos.digit, pos.siteId));
    const newChar = new Char(char.value, char.counter, char.siteId, identifiers);

    if (dataObj.op === 'insert') {
      this.crdt.insertChar(newChar);
    } else if (dataObj.op === 'delete') {
      this.crdt.deleteChar(newChar);
    }

    this.vector.update(dataObj.version);
  }

  handleDelete(idx) {
    this.crdt.handleLocalDelete(idx);
  }

  handleInsert(char, idx) {
    this.crdt.handleLocalInsert(char, idx);
  }

  broadcastInsertion(char) {
    this.vector.increment();

    const message = {
      op: 'insert',
      char: char,
      version: this.vector.getLocalVersion()
    };

    this.broadcast.send(message);
  }

  broadcastDeletion(char) {
    this.vector.increment();

    const message = {
      op: 'delete',
      char: char,
      version: this.vector.getLocalVersion()
    };

    this.broadcast.send(message);
  }

  updateEditor() {
    this.editor.updateView(this.crdt.text);
  }
}

new Controller(gTARGETPEERID, gHOST, new Peer({key: 'mgk9l45fu1gfzuxr', debug: 1}));
