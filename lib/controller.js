import Editor from './editor';
import CRDT from './crdt';
import Char from './char';
import Identifier from './identifier';
import VersionVector from './versionVector';
import Version from './version';
import Broadcast from './broadcast';
import SortedArray from './sortedArray';
import UUID from 'uuid/v1';

class Controller {
  constructor(targetPeerId, host, peer, broadcast, editor) {
    this.siteId = UUID();
    this.host = host;
    this.peer = peer;
    this.buffer = [];

    this.broadcast = broadcast;
    this.broadcast.controller = this;
    this.broadcast.peer = this.peer;
    this.broadcast.bindServerEvents();
    this.broadcast.connectToTarget(targetPeerId);

    this.editor = editor;
    this.editor.controller = this;
    this.editor.bindChangeEvent();

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
    const versions = JSON.parse(data).arr.map(ver => {
      let version = new Version(ver.siteId);
      version.counter = ver.counter;
      version.exceptions = new Set();
      for (ex in ver.exceptions) { version.exceptions.add(ex) }
      return version;
    });

    const newLocalVer = versions.find(ver => ver.siteId = this.vector.localVersion.siteId);
    this.vector.localVersion.counter = newLocalVer.counter;
    for (ex in newLocalVer.exceptions) {
      this.vector.localVersion.exceptions.add(ex);
    }

    let newVersions = new SortedArray(this.vector.siteIdComparator);
    versions.forEach(ver => newVersions.insert(ver));
    newVersions.insert(this.vector.localVersion);
    this.vector.versions = newVersions;
  }

  updateShareLink(id, dom=document) {
    const sharingLink = this.host + '/?id=' + id;
    const aTag = dom.querySelector('#myLink');

    aTag.textContent = sharingLink;
    aTag.setAttribute('href', sharingLink);
  }

  addToConnectionList(id, dom=document) {
    const node = dom.createElement('LI');

    node.appendChild(dom.createTextNode(id));
    node.id = id;
    dom.querySelector('#peerId').appendChild(node);
  }

  removeFromConnectionList(id, dom=document) {
    dom.getElementById(id).remove();
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

export default Controller;
