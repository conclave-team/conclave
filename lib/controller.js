import Editor from './editor';
import CRDT from './crdt';
import Char from './char';
import Identifier from './identifier';
import VersionVector from './versionVector';
import Version from './version';
import Broadcast from './broadcast';
import UUID from 'uuid/v1';
import Peer from 'peerjs';

class Controller {
  constructor(targetPeerId, host, peer) {
    this.siteId = UUID();
    this.host = host;
    this.peer = peer;
    this.buffer = [];

    this.broadcast = new Broadcast(this, targetPeerId);
    this.editor = new Editor(this);
    this.crdt = new CRDT(this);
    this.vector = new VersionVector(this);
  }

  populateCRDT(data) {
    const struct = JSON.parse(data).map(ch => {
      return new Char(ch.value, ch.counter, ch.siteId, ch.position.map(id => {
        return new Identifier(id.digit, id.siteId);
      }))
    });

    this.crdt.struct = struct;
    this.crdt.updateText();
    this.updateEditor();
  }

  populateVersions(data) {
    JSON.parse(data).arr.forEach(ver => {
      const version = new Version(ver.siteId);
      version.counter = ver.counter;
      version.exceptions = ver.exceptions;
      this.vector.versions.insert(version);
    });
    this.vector.localVersion = version;
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
    let i = 0;
    let dataObj;

    while(i < this.buffer.length) {
      dataObj = this.buffer[i];

      if (this.vector.hasBeenApplied(dataObj.version)) {
        this.buffer.splice(i, 1);
      } else {
        if (this.isReady(dataObj)) {
          found = true;
          this.applyOperation(dataObj);
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

  handleDelete(startIdx, endIdx) {
    this.crdt.handleLocalDelete(startIdx, endIdx);
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

new Controller(gTARGETPEERID, gHOST, new Peer({key: 'mgk9l45fu1gfzuxr'}));
