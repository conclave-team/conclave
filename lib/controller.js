import Editor from './editor';
import CRDT from './crdt';
import Char from './char';
import Identifier from './identifier';
import VersionVector from './versionVector';
import Version from './version';
import Broadcast from './broadcast';
import SortedArray from './sortedArray';
import UUID from 'uuid/v1';
import { generateItemFromHash } from './hashAlgo';
import CSS_COLORS from './cssColors';
import { ANIMALS } from './cursorNames';

class Controller {
  constructor(targetPeerId, host, peer, broadcast, editor) {
    this.siteId = UUID();
    this.rootRoom = targetPeerId;
    this.host = host;
    this.buffer = [];
    this.network = [];
    this.rootRoom = targetPeerId;

    this.broadcast = broadcast;
    this.broadcast.controller = this;
    this.broadcast.bindServerEvents(targetPeerId, peer);

    this.editor = editor;
    this.editor.controller = this;
    this.editor.bindChangeEvent();

    this.vector = new VersionVector(this.siteId);
    this.crdt = new CRDT(this);
    this.editor.onDownload();
  }

  updateShareLink(id, doc=document) {
    const shareLink = this.host + '/?id=' + id;
    const aTag = doc.querySelector('#myLink');

    aTag.textContent = shareLink;
    aTag.setAttribute('href', shareLink);
  }

  createNewUrl(id, doc=document) {
    const pTag = doc.querySelector('#newRoot');
    pTag.style.visibility = 'visible';

    this.rootRoom = id;

    const newRootLink = this.host + '/?id=' + id;
    const aTag = doc.querySelector("#newLink");
    aTag.textContent = newRootLink;
    aTag.setAttribute('href', newRootLink);
    aTag.style.visibility = 'visible';
  }

  afterDownload(e, doc=document) {
    doc.body.removeChild(e.target);
  }

  populateCRDT(initialStruct) {
    const struct = initialStruct.map(line => {
      return line.map(ch => {
        return new Char(ch.value, ch.counter, ch.siteId, ch.position.map(id => {
          return new Identifier(id.digit, id.siteId);
        }));
      });
    });

    this.crdt.struct = struct;
    this.editor.replaceText(this.crdt.toText());
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

  addToNetwork(peerId, siteId, doc=document) {
    if (!this.network.find(obj => obj.siteId === siteId)) {
      this.network.push({ peerId, siteId });
      this.network.sort((obj1, obj2) => obj1.peerId.localeCompare(obj2.peerId));

      if (siteId !== this.siteId) {
        this.addToListOfPeers(siteId, peerId, doc);
      }

      this.broadcast.addToNetwork(peerId, siteId);
    }
  }

  addRemoteCursor(siteId) {
    this.editor.addRemoteCursor(siteId);
  }

  removeFromNetwork(peerId, doc=document) {
    const peerObj = this.network.find(obj => obj.peerId === peerId);
    const idx = this.network.indexOf(peerObj);
    if (idx >= 0) {
      const deletedObj = this.network.splice(idx, 1)[0];
      this.removeFromListOfPeers(peerId, doc);
      this.editor.removeCursor(deletedObj.siteId);
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

  findNewTarget(oldId) {
    const connected = this.broadcast.connections.map(conn => conn.peer);
    const unconnected = this.network.filter(obj => connected.indexOf(obj.peerId) === -1);
    const possibleTargets = unconnected.filter(obj => obj.peerId !== this.broadcast.peer.id);
    const rootRoomClosed = this.wasRootRoom(oldId);

    if (possibleTargets.length === 0) {
      this.createNewUrl(connected[0]);
      throw new Error("There are no more available connections in your network");
    }

    const randomIdx = Math.floor(Math.random() * possibleTargets.length);
    this.broadcast.connectToNewTarget(possibleTargets[randomIdx].peerId, rootRoomClosed);
  }

  wasRootRoom(id) {
    return id === this.rootRoom;
  }

  handleSync(syncObj, doc=document) {
    this.populateCRDT(syncObj.initialStruct);
    this.populateVersionVector(syncObj.initialVersions);
    syncObj.network.forEach(obj => this.addToNetwork(obj.peerId, obj.siteId, doc));
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
      this.crdt.handleRemoteDelete(newChar, operation.version.siteId);
    }

    this.vector.update(operation.version);
  }

  localDelete(startPos, endPos) {
    this.crdt.handleLocalDelete(startPos, endPos);
  }

  localInsert(chars, startPos) {
    for (let i = 0; i < chars.length; i++) {
      if (chars[i - 1] === '\n') {
        startPos.line++;
        startPos.ch = 0;
      }
      this.crdt.handleLocalInsert(chars[i], startPos);
      startPos.ch++;
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

  // updateEditorRemote(opType, index, char) {
  //     this.editor.updateEditorRemote(this.crdt.text, opType, index, char);
  // }
  //
  // updateEditorLocal() {
  //   this.editor.updateEditorLocal(this.crdt.text);
  // }
  //
  // updateRemoteCursor(dataObj) {
  //   this.editor.updateRemoteCursor(dataObj.siteId, dataObj.position);
  // }
  //
  // handleCursorChange(position) {
  //   const operation = {
  //     type: 'cursorMove',
  //     position: position,
  //     siteId: this.siteId
  //   };
  //
  //   this.broadcast.send(operation);
  // }

  insertIntoEditor(value, pos, siteId) {
    const positions = {
      from: {
        line: pos.line,
        ch: pos.ch,
      },
      to: {
        line: pos.line,
        ch: pos.ch,
      }
    }

    this.editor.insertText(value, positions, siteId);
  }

  deleteFromEditor(value, pos, siteId) {
    let positions;

    if (value === "\n") {
      positions = {
        from: {
          line: pos.line,
          ch: pos.ch,
        },
        to: {
          line: pos.line + 1,
          ch: 0,
        }
      }
    } else {
      positions = {
        from: {
          line: pos.line,
          ch: pos.ch,
        },
        to: {
          line: pos.line,
          ch: pos.ch + 1,
        }
      }
    }


    this.editor.deleteText(positions, siteId);
  }
}

export default Controller;
