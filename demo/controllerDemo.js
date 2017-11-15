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
  constructor(peer, broadcast, editor, fakeUsers) {
    this.siteId = 'demo-1';
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

  enableEditor(doc=document) {
    doc.getElementById('wrapper').classList.remove('hide');
  }

  removeUrl(doc=document) {
    const pTag = doc.querySelector('#newRoot');
    pTag.style.visibility = 'hidden';

    this.rootRoom = null;

    const aTag = doc.querySelector("#newLink");
    aTag.style.visibility = 'hidden';
  }

  afterDownload(e, doc=document) {
    doc.body.removeChild(e.target);
  }

  populateCRDT(initialStruct) {
    // const struct = initialStruct.forEach(ch => {
    //   const char = new Char(ch.value, ch.counter, ch.siteId, ch.position.map(id => {
    //     return new Identifier(id.digit, id.siteId);
    //   }))
    //
    //   this.crdt.handleRemoteInsert(char);
    // });

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
      this.broadcast.removeFromNetwork(peerId);
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

  highlightName(peerDOM, color) {
    peerDOM.style.border = '2px solid ' + color;
    peerDOM.style.boxShadow = '0 0 10px ' + color;
  }

  unHighlightName(peerDOM) {
    peerDOM.style.border = 'none';
    peerDOM.style.boxShadow = 'none';
  }

  // getPeerColor(peerId) {
  //   const peer = this.network.find(net => net.peerId === peerId);
  //   const siteId = peer.siteId;
  //   return generateItemFromHash(siteId, CSS_COLORS);
  // }

  removeFromListOfPeers(peerId, doc=document) {
    doc.getElementById(peerId).remove();
  }

  findNewTarget(oldId) {
    const connected = this.broadcast.connections.map(conn => conn.peer);
    const unconnected = this.network.filter(obj => connected.indexOf(obj.peerId) === -1);
    const possibleTargets = unconnected.filter(obj => obj.peerId !== this.broadcast.peer.id);
    const rootRoomClosed = this.wasRootRoom(oldId);

    if (possibleTargets.length === 0) {
      this.removeUrl();
      this.broadcast.peer.on('connection', conn => {
        this.createNewUrl(conn.peer);
      });
    } else {
      const randomIdx = Math.floor(Math.random() * possibleTargets.length);
      this.broadcast.connectToNewTarget(possibleTargets[randomIdx].peerId, rootRoomClosed);
    }
  }

  wasRootRoom(id) {
    return id === this.rootRoom;
  }

  handleSync(syncObj, doc=document) {
    syncObj.network.forEach(obj => this.addToNetwork(obj.peerId, obj.siteId, doc));
    this.populateCRDT(syncObj.initialStruct);
    this.populateVersionVector(syncObj.initialVersions);
    this.enableEditor();
    this.syncEnd(syncObj.peerId);
  }

  syncEnd(peerId) {
    const operation = JSON.stringify({
      type: 'syncEnd',
      peerId: this.broadcast.peer.id
    });

    const connection = this.broadcast.connections.find(conn => conn.peer === peerId);

    if (connection.open) {
      connection.send(operation);
    } else {
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

  insertIntoEditor(value, index, siteId) {
    const substring = this.crdt.text.slice(0, index + 1);
    const linesOfText = substring.split("\n");
    let line, char;

    if (value === "\n") {
      line = linesOfText.length - 2;
      char = linesOfText[line].length;
    } else {
      line = linesOfText.length - 1;
      char = linesOfText[line].length - 1;
    }

    const positions = {
      from: {
        line: line,
        ch: char,
      },
      to: {
        line: line,
        ch: char,
      }
    }

    this.editor.insertText(value, positions, siteId);
  }

  deleteFromEditor(value, index, siteId) {
    const substring = this.crdt.text.slice(0, index + 1);
    const linesOfText = substring.split("\n");
    let line, char, positions;

    if (value === "\n") {
      line = linesOfText.length - 2;
      char = linesOfText[line].length;

      positions =  {
        from: {
          line: line,
          ch: char,
        },
        to: {
          line: line + 1,
          ch: 0,
        }
      }
    } else {
      line = linesOfText.length - 1;
      char = linesOfText[line].length - 1;

      positions =  {
        from: {
          line: line,
          ch: char,
        },
        to: {
          line: line,
          ch: char + 1,
        }
      }
    }

    this.editor.deleteText(value, positions, siteId);
  }
}

export default Controller;
