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
    this.buffer = [];

    this.broadcast = broadcast;
    this.broadcast.controller = this;
    this.broadcast.peer = peer;
    this.broadcast.bindServerEvents();
    this.broadcast.connectToTarget(targetPeerId);

    this.editor = editor;
    this.editor.controller = this;
    this.editor.bindChangeEvent();

    this.crdt = new CRDT(this);
    this.vector = new VersionVector(this);
  }

  populateCRDT(initialStruct) {
    const struct = initialStruct.map(ch => {
      return new Char(ch.value, ch.counter, ch.siteId, ch.position.map(id => {
        return new Identifier(id.digit, id.siteId);
      }))
    });
    this.crdt.struct = struct;
    this.crdt.populateText();
    this.updateEditor();
  }

  populateVersionVector(initialVersions) {
    const versions = initialVersions.arr.map(ver => {
      let version = new Version(ver.siteId);
      version.counter = ver.counter;
      version.exceptions = new Set();
      ver.exceptions.forEach(ex => version.exceptions.add(ex));
      return version;
    });

    versions.forEach(version => this.vector.versions.insert(version));
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
    const operation = JSON.parse(data);
    if (this.vector.hasBeenApplied(operation.version)) return;

    if (operation.type === 'insert') {
      this.applyOperation(operation);
    } else if (operation.type === 'delete') {
      this.buffer.push(operation);
    }

    this.processDeletionBuffer();
    this.broadcast.send(operation);
  }

  processDeletionBuffer() {
    let i = 0;
    let deleteOperation;

    while (i < this.buffer.length) {
      deleteOperation = this.buffer[i];

      if (this.hasInsertionBeenApplied(deleteOperation)) {
        this.applyOperation(deleteOperation);
        this.buffer.splice(i, 1);
      } else {
        i++;
      }
    }
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

  localDelete(startIdx, endIdx) {
    for (let i = startIdx; i < endIdx; i++) {
      this.crdt.handleLocalDelete(startIdx);
    }
  }

  localInsert(char, idx) {
    this.crdt.handleLocalInsert(char, idx);
  }

  broadcastInsertion(char) {
    const operation = {
      type: 'insert',
      char: char,
      version: this.vector.getLocalVersion()
    };

    this.broadcast.send(operation);
  }

  broadcastDeletion(char) {
    const operation = {
      type: 'delete',
      char: char,
      version: this.vector.getLocalVersion()
    };

    this.broadcast.send(operation);
  }

  updateEditor() {
    this.editor.updateText(this.crdt.text);
  }
}

export default Controller;
