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
import Feather from 'feather-icons';

class Controller {
  constructor(targetPeerId, host, peer, broadcast, editor) {
    this.siteId = UUID();
    this.host = host;
    this.buffer = [];
    this.calling = [];
    this.network = [];
    this.urlId = targetPeerId;
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
    this.attachModalEvents();
  }

  attachModalEvents() {
    let xPos = 0;
    let yPos = 0;
    const modal = document.querySelector('.video-modal');
    const dragModal = e => {
      xPos = e.clientX - modal.offsetLeft;
      yPos = e.clientY - modal.offsetTop;
      window.addEventListener('mousemove', modalMove, true);
    }
    const setModal = () => { window.removeEventListener('mousemove', modalMove, true); }
    const modalMove = e => {
      modal.style.position = 'absolute';
      modal.style.top = (e.clientY - yPos) + 'px';
      modal.style.left = (e.clientX - xPos) + 'px';
    };

    document.querySelector('.video-modal').addEventListener('mousedown', dragModal, false);
    window.addEventListener('mouseup', setModal, false);
  }

  lostConnection() {
    console.log('disconnected');
  }

  updateShareLink(id, doc=document) {
    const shareLink = this.host + '?' + id;
    const aTag = doc.querySelector('#myLink');

    aTag.textContent = shareLink;
    aTag.setAttribute('href', shareLink);
  }

  updatePageURL(id, doc=document) {
    this.urlId = id;

    const newURL = this.host + '?' + id;
    window.history.pushState({}, '', newURL);
  }

  enableEditor(doc=document) {
    doc.getElementById('conclave').classList.remove('hide');
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
    const parser = new DOMParser();
    const color = generateItemFromHash(siteId, CSS_COLORS);
    const name = generateItemFromHash(siteId, ANIMALS);

    const phone = parser.parseFromString(Feather.icons.phone.toSvg({ class: 'phone' }), "image/svg+xml");
    const phoneIn = parser.parseFromString(Feather.icons['phone-incoming'].toSvg({ class: 'phone-in' }), "image/svg+xml");
    const phoneOut = parser.parseFromString(Feather.icons['phone-outgoing'].toSvg({ class: 'phone-out' }), "image/svg+xml");
    const phoneCall = parser.parseFromString(Feather.icons['phone-call'].toSvg({ class: 'phone-call' }), "image/svg+xml");

    node.textContent = name;
    node.style.backgroundColor = color;
    node.classList.add('peer');

    this.attachVideoEvent(peerId, listItem);

    listItem.id = peerId;
    listItem.appendChild(node);
    listItem.appendChild(phone.firstChild);
    listItem.appendChild(phoneIn.firstChild);
    listItem.appendChild(phoneOut.firstChild);
    listItem.appendChild(phoneCall.firstChild);
    doc.querySelector('#peerId').appendChild(listItem);
  }

  getPeerElemById(peerId) {
    return document.getElementById(peerId);
  }

  beingCalled(callObj, doc=document) {
    const peerFlag = this.getPeerElemById(callObj.peer);

    this.addBeingCalledClass(callObj.peer);

    navigator.mediaDevices.getUserMedia({audio: true, video: true})
    .then(ms => {
      peerFlag.onclick = () => {
        this.broadcast.answerCall(callObj, ms);
      };
    });
  }

  getPeerFlagById(peerId) {
    const peerLi = document.getElementById(peerId);
    return peerLi.children[0];
  }

  addBeingCalledClass(peerId) {
    const peerLi = document.getElementById(peerId);

    peerLi.classList.add('beingCalled');
  }

  addCallingClass(peerId) {
    const peerLi = document.getElementById(peerId);

    peerLi.classList.add('calling');
  }

  streamVideo(stream, callObj, doc=document) {
    const peerFlag = this.getPeerFlagById(callObj.peer);
    const color = peerFlag.style.backgroundColor;
    const modal = document.querySelector('.video-modal');
    const bar = document.querySelector('.video-bar');
    const vid = document.querySelector('.video-modal video');

    this.answerCall(callObj.peer);

    modal.classList.remove('hide');
    bar.style.backgroundColor = color;
    vid.srcObject = stream;
    vid.play();

    this.bindVideoEvents(callObj);
  }

  bindVideoEvents(callObj) {
    const exit = document.querySelector('.exit');
    const minimize = document.querySelector('.minimize');
    const modal = document.querySelector('.video-modal');
    const bar = document.querySelector('.video-bar');
    const vid = document.querySelector('.video-modal video');

    minimize.onclick = () => {
      bar.classList.toggle('mini');
      vid.classList.toggle('hide');
    };
    exit.onclick = () => {
      modal.classList.add('hide');
      callObj.close()
    };
  }

  answerCall(peerId) {
    const peerLi = document.getElementById(peerId);

    if (peerLi) {
      peerLi.classList.remove('calling');
      peerLi.classList.remove('beingCalled');
      peerLi.classList.add('answered');
    }
  }

  closeVideo(peerId) {
    const modal = document.querySelector('.video-modal');
    const peerLi = this.getPeerElemById(peerId);

    modal.classList.add('hide');
    peerLi.classList.remove('answered', 'calling', 'beingCalled');
    this.calling = this.calling.filter(id => id !== peerId);

    this.attachVideoEvent(peerId, peerLi);
  }

  attachVideoEvent(peerId, node) {
    node.onclick = () => {
      if (!this.calling.includes(peerId)) {
        navigator.mediaDevices.getUserMedia({audio: true, video: true})
        .then(ms => {
          this.addCallingClass(peerId);
          this.calling.push(peerId);
          this.broadcast.videoCall(peerId, ms);
        });
      }
    }
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
      this.broadcast.peer.on('connection', conn => this.updatePageURL(conn.peer));
    } else {
      const randomIdx = Math.floor(Math.random() * possibleTargets.length);
      const newTarget = possibleTargets[randomIdx].peerId;
      this.broadcast.requestConnection(newTarget, this.broadcast.peer.id, this.siteId);
    }
  }

  handleSync(syncObj, doc=document) {
    if (syncObj.peerId != this.urlId) { this.updatePageURL(syncObj.peerId); }

    syncObj.network.forEach(obj => this.addToNetwork(obj.peerId, obj.siteId, doc));

    if (this.crdt.totalChars() === 0) {
      this.populateCRDT(syncObj.initialStruct);
      this.populateVersionVector(syncObj.initialVersions);
    }
    this.enableEditor();

    this.syncCompleted(syncObj.peerId);
  }

  syncCompleted(peerId) {
    const completedMessage = JSON.stringify({
      type: 'syncCompleted',
      peerId: this.broadcast.peer.id
    });

    let connection = this.broadcast.outConns.find(conn => conn.peer === peerId);

    if (connection) {
      connection.send(completedMessage);
    } else {
      connection = this.broadcast.peer.connect(peerId);
      this.broadcast.addToOutConns(connection);
      connection.on('open', () => {
        connection.send(completedMessage);
      });
    }
  }

  handleRemoteOperation(operation) {
    if (this.vector.hasBeenApplied(operation.version)) return;

    this.buffer.push(operation);
    this.processBuffer();
    this.broadcast.send(operation);
  }

  processBuffer() {
    let i = 0;
    let operation, found;

    while (i < this.buffer.length) {
      operation = this.buffer[i];

      if (operation.type === 'insert' || this.hasInsertionBeenApplied(operation)) {
        this.applyOperation(operation);
        found = true;
        this.buffer.splice(i, 1);
      } else {
        i++;
      }
    }

    if (found) this.processBuffer();
  }

  hasInsertionBeenApplied(operation) {
    let isReady = true;

    for (let i = 0; i < operation.chars.length; i++) {
      let char = operation.chars[i];
      const charVersion = { siteId: char.siteId, counter: char.counter };

      if (!this.vector.hasBeenApplied(charVersion)) {
        isReady = false;
        break;
      }
    }

    return isReady;
  }

  applyOperation(operation) {
    const chars = operation.chars.map(char => {
      let identifiers = char.position.map(pos => new Identifier(pos.digit, pos.siteId));
      return new Char(char.value, char.counter, char.siteId, identifiers);
    });


    if (operation.type === 'insert') {
      this.crdt.handleRemoteInsert(chars);
    } else if (operation.type === 'delete') {
      this.crdt.handleRemoteDelete(chars, operation.version.siteId);
    }

    this.vector.update(operation.version);
  }

  localDelete(startPos, endPos) {
    this.crdt.handleLocalDelete(startPos, endPos);
  }

  localInsert(chars, startPos) {
    this.crdt.handleLocalInsert(chars, startPos);
  }

  broadcastInsertion(chars) {
    while (chars.length > 0) {
      let someChars = chars.splice(0, 100);

      const operation = {
        type: 'insert',
        chars: someChars,
        version: {
          siteId: someChars[0].siteId,
          counter: someChars[0].counter
        }
      };

      this.broadcast.send(operation);
    }
  }

  broadcastDeletion(chars, versions) {
    while (chars.length > 0) {
      let someChars = chars.splice(0, 100);
      this.vector.increment();

      const operation = {
        type: 'delete',
        chars: someChars,
        version: this.vector.getLocalVersion()
      };

      this.broadcast.send(operation);
    }
  }

  insertIntoEditor(chars, startPos, endPos, siteId) {
    const positions = {
      from: startPos,
      to: endPos
    }

    this.editor.insertText(chars.map(char => char.value).join(''), positions, siteId);
  }

  deleteFromEditor(chars, startPos, endPos, siteId) {
    let positions = {
      from: startPos,
      to: endPos
    }
    const lastChar = chars[chars.length - 1];

    if (lastChar.value === "\n") {
      positions.to.line++;
    } else {
      positions.to.ch++;
    }

    this.editor.deleteText(chars.map(char => char.value).join(''), positions, siteId);
  }
}

export default Controller;
