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
    this.editor.replaceText(this.crdt.text);
  }

  populateVersionVector(initialVersions) {
    const versions = initialVersions.arr.map(ver => {
      let version = new Version(ver.siteId);
      version.counter = ver.counter;
      ver.exceptions.forEach(ex => version.exceptions.push(ex));
      return version;
    });

    versions.forEach(version => this.vector.versions.insert(version));
  }

  addToNetwork(id) {
    if (this.network.indexOf(id) < 0) {
      this.network.push(id);
      this.network.sort();
      if (id != this.broadcast.peer.id) {
        this.addToListOfPeers(id);
      }
      this.broadcast.addToNetwork(id);
    }
  }

  removeFromNetwork(id) {
    const idx = this.network.indexOf(id)
    if (idx >= 0) {
      this.network.splice(idx, 1);
      this.removeFromListOfPeers(id);
      this.broadcast.removeFromNetwork(id);
    }
  }

  addToListOfPeers(id, doc=document) {
    const node = doc.createElement('LI');
    node.appendChild(doc.createTextNode(id));
    node.id = id;
    doc.querySelector('#peerId').appendChild(node);
  }

  removeFromListOfPeers(id, doc=document) {
    doc.getElementById(id).remove();
  }

  findNewTarget() {
    const possibleTargets = this.network.filter(id => id != this.broadcast.peer.id);
    if (possibleTargets.length === 0) {
      throw new Error("There are no more available connections in your network");
    }
    this.broadcast.connectToTarget(possibleTargets[0]);
  }

  handleSync(syncObj) {
    this.populateCRDT(syncObj.initialStruct);
    this.populateVersionVector(syncObj.initialVersions);
    syncObj.network.forEach(id => this.addToNetwork(id));
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

  insertIntoEditor(value, index) {
    const substring = this.crdt.text.slice(0, index + 1);
    const newlineMatches = substring.match(/\n/g);
    const newlines = newlineMatches && newlineMatches.length || 0;
    const lastNewlineIdx = this.crdt.text.lastIndexOf("\n");
    const charsLastLine = substring.slice(lastNewlineIdx + 1).length;

    const positions = {
      from: {
        line: newlines,
        ch: charsLastLine - 1,
      },
      to: {
        line: newlines,
        ch: charsLastLine - 1,
      }
    }

    this.editor.insertText(value, positions);
  }

  deleteFromEditor(index) {
    const substring = this.crdt.text.slice(0, index + 1);
    const newlineMatches = substring.match(/\n/g);
    const newlines = newlineMatches && newlineMatches.length || 0;
    const lastNewlineIdx = this.crdt.text.lastIndexOf("\n");
    const charsLastLine = substring.slice(lastNewlineIdx + 1).length;

    const positions =  {
      from: {
        line: newlines,
        ch: charsLastLine,
      },
      to: {
        line: newlines,
        ch: charsLastLine + 1,
      }
    }

    this.editor.deleteText(positions);
  }
}

export default Controller;
