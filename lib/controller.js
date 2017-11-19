import Editor from './editor';
import CRDT from './crdt';
import Char from './char';
import Identifier from './identifier';
import VersionVector from './versionVector';
import Version from './version';
import Broadcast from './broadcast';
import UUID from 'uuid/v1';
import { generateItemFromHash } from './hashAlgo';
import CSS_COLORS from './cssColors';
import { ANIMALS } from './cursorNames';

class Controller {
  constructor(targetPeerId, host, peer, broadcast, editor) {
    this.siteId = UUID();
    this.host = host;
    this.buffer = [];
    this.network = [];
    this.urlId = targetPeerId;
    this.refreshId = null;
    this.makeOwnName();

    if (targetPeerId == 0) this.enableEditor();

    this.broadcast = broadcast;
    this.broadcast.controller = this;
    this.broadcast.bindServerEvents(targetPeerId, peer);

    this.editor = editor;
    this.editor.controller = this;
    this.editor.bindChangeEvent();

    this.vector = new VersionVector(this.siteId);
    this.crdt = new CRDT(this);
    this.editor.bindButtons();
  }

  updateShareLink(id, doc=document) {
    const shareLink = this.host + '?' + id;
    const aTag = doc.querySelector('#myLink');

    aTag.textContent = shareLink;
    aTag.setAttribute('href', shareLink);
  }

  createNewUrl(id, doc=document) {
    this.refreshId = id;

    const pTag = doc.querySelector('#newRoot');
    pTag.style.visibility = 'visible';
    const pTag2 = doc.querySelector('#newRoot2');
    pTag2.style.visibility = 'visible';

    const newRootLink = this.host + '?' + id;
    const aTag = doc.querySelector("#newLink");
    aTag.textContent = newRootLink;
    aTag.setAttribute('href', newRootLink);
    aTag.style.visibility = 'visible';
  }

  enableEditor(doc=document) {
    doc.getElementById('conclave').classList.remove('hide');
  }

  removeUrl(doc=document) {
    const pTag = doc.querySelector('#newRoot2');
    pTag.style.visibility = 'hidden';

    const aTag = doc.querySelector("#newLink");
    aTag.style.visibility = 'hidden';
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
      this.broadcast.removeFromNetwork(peerId);
    }
  }

  removeRemoteCursor(siteId) {
    this.editor.removeRemoteCursor(siteId);
  }

  makeOwnName() {
    const node = document.createElement('span');
    const color = generateItemFromHash(this.siteId, CSS_COLORS);
    const name = generateItemFromHash(this.siteId, ANIMALS);

    node.textContent = name;
    node.style.backgroundColor = color;

    document.querySelector('#ownName').appendChild(node);
  }

  addToListOfPeers(siteId, peerId, doc=document) {
    const listItem = doc.createElement('li');
    const node = doc.createElement('span');
    const color = generateItemFromHash(siteId, CSS_COLORS);
    const name = generateItemFromHash(siteId, ANIMALS);

    node.textContent = name;
    node.style.backgroundColor = color;
    node.classList.add('peer');

    node.onclick = () => {
      navigator.mediaDevices.getUserMedia({audio: true, video: true})
      .then(ms => this.broadcast.videoCall(peerId, ms, color))
    };

    listItem.id = peerId;
    listItem.appendChild(node);
    doc.querySelector('#peerId').appendChild(listItem);
  }

  lightOn(li, doc=document) {
    let thereBe = 'light';

    li.classList.add(thereBe);
  }

  lightOff(li) {
    let meTurnOutThe = 'light';

    li.classList.remove(meTurnOutThe);
  }

  removeFromListOfPeers(peerId, doc=document) {
    doc.getElementById(peerId).remove();
  }

  findNewTarget() {
    const connected = this.broadcast.outConns.map(conn => conn.peer);
    const unconnected = this.network.filter(obj => {
      return connected.indexOf(obj.peerId) === -1;
    });
    const possibleTargets = unconnected.filter(obj => {
      return obj.peerId !== this.broadcast.peer.id
    });
    if (possibleTargets.length === 0) {
      this.removeUrl();
      // this.broadcast.peer.on('connection', conn => this.createNewUrl(conn.peer));
    } else {
      const randomIdx = Math.floor(Math.random() * possibleTargets.length);
      const newTarget = possibleTargets[randomIdx].peerId;
      this.broadcast.requestConnection(newTarget, this.broadcast.peer.id, this.siteId);
    }
  }

  handleSync(syncObj, doc=document) {
    // if (syncObj.peerId != this.urlId) { this.createNewUrl(syncObj.peerId); }

    syncObj.network.forEach(obj => this.addToNetwork(obj.peerId, obj.siteId, doc));

    if (this.crdt.totalChars() === 0) {
      this.populateCRDT(syncObj.initialStruct);
      this.populateVersionVector(syncObj.initialVersions);
    }
    this.enableEditor();

    this.syncEnd(syncObj.peerId);
  }

  syncEnd(peerId) {
    const operation = JSON.stringify({
      type: 'syncEnd',
      peerId: this.broadcast.peer.id
    });

    let connection = this.broadcast.outConns.find(conn => conn.peer === peerId);

    if (connection) {
      connection.send(operation);
    } else {
      connection = this.broadcast.peer.connect(peerId);
      this.broadcast.addToOutConns(connection);
      connection.on('open', () => {
        connection.send(operation);
      });
    }
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

  broadcastDeletion(char, version) {
    const operation = {
      type: 'delete',
      char: char,
      version: version
    };

    this.broadcast.send(operation);
  }

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

    this.editor.deleteText(value, positions, siteId);
  }
}

export default Controller;
