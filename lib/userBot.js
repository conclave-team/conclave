import CRDT from './crdt';
import VersionVector from './versionVector';
import Peer from 'peerjs';
import Broadcast from './broadcast';
import Identifier from './identifier';
import Char from './char';

class UserBot {
  constructor(peerId, targetPeerId, script, mde) {
    this.siteId = UUID();
    this.peer = new Peer(peerId, {
  			host: location.hostname,
  			port: location.port || (location.protocol === 'https:' ? 443 : 80),
  			path: '/peerjs',
  			debug: 3
  		});
    this.vector = new VersionVector(this.siteId);
    this.crdt = new CRDT(this);
    this.buffer = [];
    this.mde = mde;
    this.script = script;

    this.connectToUser(targetPeerId);
    this.onConnection();
  }

  connectToUser(targetPeerId) {
    this.connection = this.peer.connect(targetPeerId);
  }

  runScript(interval) {
    this.counter = 0;
    const self = this;

    self.intervalId = setInterval(function() {
      let index = self.mde.codemirror.getValue().length;
      let val = self.script[this.counter++];

      if (!val) {
        clearInterval(self.intervalId);
      }

      this.crdt.handleLocalInsert(val, index);
    }, interval);
  }

  onConnection() {
    this.peer.on('connection', connection => {
      connection.on('data', data => {
        const dataObj = JSON.parse(data);

        this.handleRemoteOperation(dataObj);
      });
    });
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

  handleRemoteOperation(dataObj) {
    if (this.vector.hasBeenApplied(operation.version)) return;

    if (operation.type === 'insert') {
      this.applyOperation(operation);
    } else if (operation.type === 'delete') {
      this.buffer.push(operation);
    }

    this.processDeletionBuffer();
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

  broadcastInsertion(char) {
    const operation = JSON.stringify({
      type: 'insert',
      char: char,
      version: this.vector.getLocalVersion()
    });

    if (this.connection.open) {
      this.connection.send(operation);
    } else {
      this.connection.on('open', () => {
        this.connection.send(operation);
      });
    }
  }

  broadcastDeletion(char) {
    const operation = JSON.stringify({
      type: 'delete',
      char: char,
      version: this.vector.getLocalVersion()
    });

    if (this.connection.open) {
      this.connection.send(operation);
    } else {
      this.connection.on('open', () => {
        this.connection.send(operation);
      });
    }
  }

  insertIntoEditor() {}
  deleteFromEditor() {}
}
