import Editor from './editor';
import CRDT from './crdt';
import Char from './char';
import Identifier from './identifier';
import VersionVector from './versionVector';
import Version from './version';
import Broadcast from './broadcast';
import SortedArray from './sortedArray';
import UUID from 'uuid/v1';
import { generateItemFromHash } from './hashalgo';
import CSS_COLORS from './cssColors';
import { ANIMALS } from './cursorNames';

class Controller {
  constructor(targetPeerId, host, peer, broadcast, editor) {
    this.siteId = UUID();
    this.host = host;
    this.buffer = [];
    this.network = [];

    this.broadcast = broadcast;
    this.broadcast.controller = this;
    this.broadcast.bindServerEvents(targetPeerId, peer);

    this.editor = editor;
    this.editor.controller = this;
    this.editor.bindChangeEvent();

    this.vector = new VersionVector(this.siteId);
    this.crdt = new CRDT(this);
  }

  updateShareLink(id, doc=document) {
    const sharingLink = this.host + '/?id=' + id;
    const aTag = doc.querySelector('#myLink');

    aTag.textContent = sharingLink;
    aTag.setAttribute('href', sharingLink);
  }

  populateCRDT(initialStruct) {
    const struct = initialStruct.map(ch => {
      return new Char(ch.value, ch.counter, ch.siteId, ch.position.map(id => {
        return new Identifier(id.digit, id.siteId);
      }))
    });
    this.crdt.struct = struct;
    this.crdt.populateText();
    this.updateEditorLocal();
  }

  populateVersionVector(initialVersions) {
    const versions = initialVersions.map(ver => {
      let version = new Version(ver.siteId);
      version.counter = ver.counter;
      ver.exceptions.forEach(ex => version.exceptions.push(ex));
      return version;
    });

    versions.forEach(version => this.vector.versions.push(version));
  }

  addToNetwork(peerId, siteId) {
    if (!this.network.find(obj => obj.siteId === siteId)) {
      this.network.push({ peerId, siteId });
      this.network.sort((obj1, obj2) => obj1.peerId.localeCompare(obj2.peerId));
      if (siteId !== this.siteId) {
        this.addToListOfPeers(siteId, peerId);
      }
      this.broadcast.addToNetwork(peerId, siteId);
    }
  }

  addRemoteCursor(siteId) {
    this.editor.addRemoteCursor(siteId);
  }

  removeFromNetwork(peerId) {
    const peerObj = this.network.find(obj => obj.peerId === peerId);
    const idx = this.network.indexOf(peerObj);
    if (idx >= 0) {
      const deletedObj = this.network.splice(idx, 1);
      this.removeFromListOfPeers(peerId);
      this.broadcast.removeFromNetwork(peerId, deletedObj.siteId);
    }
  }

  removeRemoteCursor(siteId) {
    this.editor.removeRemoteCursor(siteId);
  }

  addToListOfPeers(siteId, peerId, doc=document) {
    const listItem = doc.createElement('li');
    const node = doc.createElement('span');
    const color = generateItemFromHash(siteId, CSS_COLORS);
    const name = generateItemFromHash(siteId, ANIMALS);

    node.appendChild(doc.createTextNode(name));
    node.style.backgroundColor = color;
    node.classList.add('peer');

    listItem.id = peerId;
    listItem.appendChild(node);
    doc.querySelector('#peerId').appendChild(listItem);
  }

  removeFromListOfPeers(peerId, doc=document) {
    doc.getElementById(peerId).remove();
  }

  findNewTarget() {
    const possibleTargets = this.network.filter(obj => obj.peerId !== this.broadcast.peer.id);
    if (possibleTargets.length === 0) {
      throw new Error("There are no more available connections in your network");
    }
    this.broadcast.connectToTarget(possibleTargets[0].peerId);
  }

  handleSync(syncObj) {
    this.populateCRDT(syncObj.initialStruct);
    this.populateVersionVector(syncObj.initialVersions);
    // this.addToListOfPeers(syncObj.siteId, syncObj.peerId);
    syncObj.network.forEach(obj => this.addToNetwork(obj.peerId, obj.siteId));
  }

  handleRemoteOperation(operation) {
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
      this.crdt.handleRemoteInsert(newChar);
    } else if (operation.type === 'delete') {
      this.crdt.handleRemoteDelete(newChar);
    }

    this.vector.update(operation.version);
  }

  localDelete(startIdx, endIdx) {
    for (let i = startIdx; i < endIdx; i++) {
      this.crdt.handleLocalDelete(startIdx);
    }
  }

  localInsert(chars, idx) {
    for (let i = 0; i < chars.length; i++) {
      this.crdt.handleLocalInsert(chars[i], i+idx);
    }
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

  updateEditorRemote(opType, index, char) {
      this.editor.updateEditorRemote(this.crdt.text, opType, index, char);
  }

  updateEditorLocal() {
    this.editor.updateEditorLocal(this.crdt.text);
  }

  updateRemoteCursor(dataObj) {
    this.editor.updateRemoteCursor(dataObj.siteId, dataObj.position);
  }

  handleCursorChange(position) {
    const operation = {
      type: 'cursorMove',
      position: position,
      siteId: this.siteId
    };

    this.broadcast.send(operation);
  }
}

export default Controller;
