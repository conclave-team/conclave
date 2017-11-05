import Editor from './editor';
import CRDT from './crdt';
import Char from './char';
import Identifier from './identifier';
import VersionVector from './versionVector';
import Broadcast from './broadcast';
import UUID from 'uuid/v1';

class Controller {
  constructor() {
    this.siteId = UUID();
    this.editor = new Editor(this);
    this.crdt = new CRDT(this);
    this.vector = new VersionVector(this);
    this.broadcast = new Broadcast(this);
  }

  updateShareLink(id) {
    const sharingLink = gHOST + '/?id=' + id;
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

  updateSiteId(id) {
    this.siteId = id;
    this.crdt.siteId = id;
  }

  handleRemoteOperation(data) {
    const dataObj = JSON.parse(data);
    const char = dataObj.char;
    const currentVersion = dataObj.currentVersion;

    const identifiers = char.position.map(pos => new Identifier(pos.digit, pos.siteId));
    const charObj = new Char(char.value[0], char.counter, identifiers);

    const charVersion = { siteId: charObj.siteId, counter: charObj.counter };

    if (this.vector.isDuplicate(currentVersion)) return false;

    if (dataObj.op === 'insert') {
      this.crdt.insertChar(charObj);
    } else if (dataObj.op === 'delete') {
      if (!this.vector.isDuplicate(charVersion)) return false;

      this.crdt.deleteChar(charObj);
    }

    this.broadcast.send(dataObj);
    this.vector.update(currentVersion);
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

new Controller();
