class Broadcast {
  constructor() {
    this.controller = null;
    this.peer = null;
    this.outConns = [];
    this.inConns = [];
    this.outgoingBuffer = [];
    this.MAX_BUFFER_SIZE = 40;
    this.currentStream = null;
  }

  send(operation) {
    const operationJSON = JSON.stringify(operation);
    if (operation.type === 'insert' || operation.type === 'delete') {
      this.addToOutgoingBuffer(operationJSON);
    }
    this.outConns.forEach(conn => conn.send(operationJSON));
  }

  addToOutgoingBuffer(operation) {
    if (this.outgoingBuffer.length === this.MAX_BUFFER_SIZE) {
      this.outgoingBuffer.shift();
    }

    this.outgoingBuffer.push(operation);
  }

  processOutgoingBuffer(peerId) {
    const connection = this.outConns.find(conn => conn.peer === peerId);
    this.outgoingBuffer.forEach(op => {
      connection.send(op);
    });
  }

  bindServerEvents(targetPeerId, peer) {
    this.peer = peer;
    this.onOpen(targetPeerId);
  }

  onOpen(targetPeerId) {
    this.peer.on('open', id => {
      this.controller.updateShareLink(id);
      this.onPeerConnection();
      this.onError();
      this.onDisconnect();
      if (targetPeerId == 0) {
        this.controller.addToNetwork(id, this.controller.siteId);
      } else {
        this.requestConnection(targetPeerId, id, this.controller.siteId)
      }
    });
  }

  onError() {
    this.peer.on("error", err => {
      const pid = String(err).replace("Error: Could not connect to peer ", "");
      this.removeFromConnections(pid);
      console.log(err.type);
      if (!this.peer.disconnected) {
        this.controller.findNewTarget();
      }

      this.controller.enableEditor();
    });
  }

  onDisconnect() {
    this.peer.on('disconnected', function() {
      this.controller.lostConnection();
    });
  }

  requestConnection(target, peerId, siteId) {
    const conn = this.peer.connect(target);
    this.addToOutConns(conn);
    conn.on('open', () => {
      conn.send(JSON.stringify({
        type: 'connRequest',
        peerId: peerId,
        siteId: siteId,
      }));
    });
  }

  redistribute(peerId, siteId) {
    const halfTheNetwork = Math.ceil(this.controller.network.length / 2);
    const tooManyInConns = this.inConns.length > Math.max(halfTheNetwork, 5);
    const tooManyOutConns = this.outConns.length > Math.max(halfTheNetwork, 5);

    if (tooManyInConns || tooManyOutConns) {
      this.forwardMessage(peerId, siteId);
    } else {
      this.syncTo(peerId, siteId);
    }
  }

  forwardMessage(peerId, siteId) {
    const connected = this.outConns.filter(conn => conn.peer !== peerId);
    const randomIdx = Math.floor(Math.random() * connected.length);
    connected[randomIdx].send(JSON.stringify({
      type: 'connRequest',
      peerId: peerId,
      siteId: siteId,
    }));
  }

  addToOutConns(connection) {
    if (!this.isAlreadyConnectedOut(connection)) {
      this.outConns.push(connection);
    }
  }

  addToInConns(connection) {
    if (!this.isAlreadyConnectedIn(connection)) {
      this.inConns.push(connection);
    }
  }

  addToNetwork(peerId, siteId) {
    this.send({
      type: "add to network",
      newPeer: peerId,
      newSite: siteId
    });
  }

  removeFromNetwork(peerId) {
    this.send({
      type: "remove from network",
      oldPeer: peerId
    });
    this.controller.removeFromNetwork(peerId);
  }

  removeFromConnections(peer) {
    this.inConns = this.inConns.filter(conn => conn.peer !== peer);
    this.outConns = this.outConns.filter(conn => conn.peer !== peer);
    this.removeFromNetwork(peer);
  }

  isAlreadyConnectedOut(connection) {
    if (connection.peer) {
      return !!this.outConns.find(conn => conn.peer === connection.peer);
    } else {
      return !!this.outConns.find(conn => conn.peer.id === connection);
    }
  }

  isAlreadyConnectedIn(connection) {
    if (connection.peer) {
      return !!this.inConns.find(conn => conn.peer === connection.peer);
    } else {
      return !!this.inConns.find(conn => conn.peer.id === connection);
    }
  }

  onPeerConnection() {
    this.peer.on('connection', (connection) => {
      this.onConnection(connection);
      this.onVideoCall(connection);
      this.onData(connection);
      this.onConnClose(connection);
    });
  }

  syncTo(peerId, siteId) {
    const connBack = this.peer.connect(peerId);
    this.addToOutConns(connBack);
    this.controller.addToNetwork(peerId, siteId);

    const initialData = JSON.stringify({
      type: 'syncResponse',
      siteId: this.controller.siteId,
      peerId: this.peer.id,
      initialStruct: this.controller.crdt.struct,
      initialVersions: this.controller.vector.versions,
      network: this.controller.network
    });

    if (connBack.open) {
      connBack.send(initialData);
    } else {
      connBack.on('open', () => {
        connBack.send(initialData);
      });
    }
  }

  videoCall(id, ms) {
    const callObj = this.peer.call(id, ms);
    this.onStream(callObj);
  }

  onConnection(connection) {
    this.addToInConns(connection);
  }

  onVideoCall() {
    this.peer.on('call', callObj => {
      this.controller.beingCalled(callObj);
    });
  }

  answerCall(callObj, ms) {
    callObj.answer(ms);
    this.onStream(callObj);
  }

  onStream(callObj) {
    callObj.on('stream', stream => {
      if (this.currentStream) { this.currentStream.close(); }
      this.currentStream = callObj;

      this.controller.streamVideo(stream, callObj);

      callObj.on('close', () => this.onStreamClose(callObj.peer))
    });
  }

  onStreamClose(peerId) {
    this.currentStream.localStream.getTracks().forEach(track => track.stop());
    this.currentStream = null;

    this.controller.closeVideo(peerId);
  }

  onData(connection) {
    connection.on('data', data => {
      const dataObj = JSON.parse(data);

      switch(dataObj.type) {
        case 'connRequest':
          this.redistribute(dataObj.peerId, dataObj.siteId);
          break;
        case 'syncResponse':
          this.processOutgoingBuffer(dataObj.peerId);
          this.controller.handleSync(dataObj);
          break;
        case 'syncEnd':
          this.processOutgoingBuffer(dataObj.peerId);
          break;
        case 'add to network':
          this.controller.addToNetwork(dataObj.newPeer, dataObj.newSite);
          break;
        case 'remove from network':
          this.controller.removeFromNetwork(dataObj.oldPeer);
          break;
        default:
          this.controller.handleRemoteOperation(dataObj);
      }
    });
  }

  randomId() {
    const possConns = this.inConns.filter(conn => {
      return this.peer.id !== conn.peer;
    });
    const randomIdx = Math.floor(Math.random() * possConns.length);
    if (possConns[randomIdx]) {
      return possConns[randomIdx].peer;
    } else {
      return false;
    }
  }

  onConnClose(connection) {
    connection.on('close', () => {
      this.removeFromConnections(connection.peer);
      if (connection.peer == this.controller.refreshId) {
        const id = this.randomId();
        if (id) { this.controller.createNewUrl(id); }
      }
      if (this.inConns.length < 5 || this.outConns.length < 5) {
        this.controller.findNewTarget();
      }
    });
  }
}

export default Broadcast;
