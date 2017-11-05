import Editor from './editor';
import CRDT from './crdt';
import Char from './char';
import Identifier from './identifier';
import VersionVector from './versionVector';
import Broadcast from './broadcast';
import UUID from 'uuid/v1';
import Peer from 'peerjs';

class Controller {
  constructor(peerId, host, peer) {
    this.siteId = UUID();
    this.peerId = peerId;
    this.host = host;
    this.editor = new Editor(this);
    this.crdt = new CRDT(this);
    this.vector = new VersionVector(this);
    this.peer = peer;
    this.broadcast = new Broadcast(this);
    this.buffer = [];
  }

  updateShareLink(id) {
    const sharingLink = this.host + '/?id=' + id;
    const aTag = document.querySelector('#myLink');

    aTag.append(sharingLink);
    aTag.setAttribute('href', sharingLink);
    this.editor.bindChangeEvent();
  }

  updateConnectionList(id) {
    const node = document.createElement('LI');

    node.appendChild(document.createTextNode(id));
    document.querySelector('#peerId').appendChild(node);
  }

  handleRemoteOperation(data) {
    const dataObj = JSON.parse(data);

    if (this.vector.isDuplicate(dataObj.currentVersion)) return;

    this.broadcast.send(dataObj);
    this.buffer.push(dataObj);
    this.reviewBuffer();
  }

  reviewBuffer() {
    let found = false;
    let dataObj;

    for(let i = this.buffer.length - 1; i >= 0; i--) {
      dataObj = this.buffer[i];

      if (this.vector.isDuplicate(dataObj.currentVersion)) {
        this.buffer.splice(i, 1);
      } else {
        if (this.isReady(dataObj)) {
          found = true;
          this.handleOperation(dataObj);
          this.buffer.splice(i, 1);
        }
      }
    }
    //
    // while(i < this.buffer.length) {
    //   dataObj = this.buffer[i];
    //
    //   if (this.vector.isDuplicate(dataObj.currentVersion)) {
    //     this.buffer.splice(i, 1);
    //   } else {
    //     if (this.isReady(dataObj)) {
    //       found = true;
    //       this.handleOperation(dataObj);
    //       this.buffer.splice(i, 1);
    //     } else {
    //       i++;
    //     }
    //   }

    if (found) this.reviewBuffer();
  }

  isReady(dataObj) {
    const version = { siteId: dataObj.char.siteId, counter: dataObj.char.counter };

    switch(dataObj.op) {
      case "insert":
        break;
      case 'delete':
        if (!this.vector.isDuplicate(version)) return false;
        break;
    }

    return true;
  }

  handleOperation(dataObj) {
    const char = dataObj.char;
    const identifiers = char.position.map(pos => new Identifier(pos.digit, pos.siteId));
    const charObj = new Char(char.value, char.counter, char.siteId, identifiers);
    const charVersion = { siteId: charObj.siteId, counter: charObj.counter };

    if (dataObj.op === 'insert') {
      this.crdt.insertChar(charObj);
    } else if (dataObj.op === 'delete') {
      this.crdt.deleteChar(charObj);
    }

    this.vector.update(dataObj.currentVersion);
    this.editor.updateView();
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
      currentVersion: this.vector.getLatest()
    };

    this.broadcast.send(message);
  }

  broadcastDeletion(char) {
    this.vector.increment();

    const message = {
      op: 'delete',
      char: char,
      currentVersion: this.vector.getLatest()
    };

    this.broadcast.send(message);
  }

  updateEditor() {
    this.editor.updateView(this.crdt.text);
  }
}

new Controller(peerId, host, new Peer({key: 'mgk9l45fu1gfzuxr', debug: 1}));
