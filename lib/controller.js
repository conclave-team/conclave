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

  addToConnectionList(id) {
    const node = document.createElement('LI');

    node.appendChild(document.createTextNode(id));
    node.id = id;
    document.querySelector('#peerId').appendChild(node);
  }

  removeFromConnectionList(id) {
    document.querySelector('#' + id).remove();
  }

  handleRemoteOperation(data) {
    const dataObj = JSON.parse(data);
    const char = dataObj.char;
    const incomingVersion = dataObj.version;

    const identifiers = char.position.map(pos => new Identifier(pos.digit, pos.siteId));
    const newChar = new Char(char.value[0], char.counter, identifiers);

    const newCharVersion = { siteId: newChar.siteId, counter: newChar.counter };

    if (this.vector.isDuplicate(incomingVersion)) return false;

    if (dataObj.op === 'insert') {
      this.crdt.insertChar(newChar);
    } else if (dataObj.op === 'delete') {
      if (!this.vector.isDuplicate(newCharVersion)) return false;

      this.crdt.deleteChar(newChar);
    }

    this.editor.updateView();
    this.broadcast.send(dataObj);
    this.vector.update(incomingVersion);
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

new Controller();
