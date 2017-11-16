class Broadcast {
  constructor() {
    this.controller = null;
    this.peer = null;
    this.connections = [];
    this.outgoingBuffer = [];
    this.MAX_BUFFER_SIZE = 30;
    this.currentStream = null;
  }

  send(operation) {
    const operationJSON = JSON.stringify(operation);
    if (operation.type === 'insert' || operation.type === 'delete') {
      this.addToOutgoingBuffer(operationJSON);
    }
    this.connections.forEach(conn => conn.send(operationJSON));
  }

  addToOutgoingBuffer(operation) {
    if (this.outgoingBuffer.length === this.MAX_BUFFER_SIZE) {
      this.outgoingBuffer.shift();
    }

    this.outgoingBuffer.push(operation);
  }

  processOutgoingBuffer(peerId) {
    const connection = this.connections.find(conn => conn.peer === peerId);
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
      this.onError();
      this.onPeerConnection();
      this.connectToTarget(targetPeerId, id);
    });
  }

  onError() {
    this.peer.on("error", err => {
      const pid = String(err).replace("Error: Could not connect to peer ", "");
      this.removeFromConnections(pid);
      this.controller.findNewTarget();
      this.controller.enableEditor();
    });
  }

  connectToTarget(targetId, peerId) {
    if (targetId != 0) {
      const conn = this.peer.connect(targetId);
      const syncRequest = JSON.stringify({
        type: 'syncRequest',
        siteId: this.controller.siteId,
        peerId: peerId
      });

      conn.on('open', () => {
        conn.send(syncRequest);
      });
    } else {
      this.controller.addToNetwork(peerId, this.controller.siteId);
    }
  }

  connectToNewTarget(targetId, createUrl=false) {
    const conn = this.peer.connect(targetId);
    conn.on("open", () => {
      if (createUrl) {
        this.controller.createNewUrl(targetId);
      }
      this.addToConnections(conn);
    });
  }

  addToConnections(connection) {
    if (!this.isAlreadyConnected(connection)) {
      this.connections.push(connection);
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
  }

  removeFromConnections(peer) {
    this.connections = this.connections.filter(conn => conn.peer !== peer);
    this.controller.removeFromNetwork(peer);
  }

  isAlreadyConnected(connection) {
    if (connection.peer) {
      return !!this.connections.find(conn => conn.peer === connection.peer);
    } else {
      return !!this.connections.find(conn => conn.peer.id === connection);
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
    let connBack = this.connections.find(conn => conn.peer === peerId);
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

  videoCall(id, ms, color) {
    const callObj = this.peer.call(id, ms);
    this.onStream(callObj, color);
  }

  onConnection(connection) {
    connection.on('open', () => {
      if (this.isAlreadyConnected(connection)) { return; }

      const connBack = this.peer.connect(connection.peer);
      this.addToConnections(connBack);
    });
  }

  onVideoCall() {
    this.peer.on('call', callObj => {
      const peerFlag = document.getElementById(callObj.peer).children[0];
      const color = peerFlag.style.backgroundColor;

      this.controller.highlightName(peerFlag, color);

      navigator.mediaDevices.getUserMedia({audio: true, video: true})
      .then(ms => {
        peerFlag.onclick = () => {
          callObj.answer(ms);
          this.controller.unHighlightName(peerFlag);
          this.onStream(callObj, color);
        };
      });
    });
  }

  onStream(callObj, color) {
    callObj.on('stream', stream => {
      if (this.currentStream) { this.currentStream.close(); }
      this.currentStream = callObj;

      const vid = document.querySelector('video');
      vid.style.visibility = 'visible';
      vid.style.borderColor = color;
      vid.srcObject = stream;
      vid.play();

      vid.onclick = () => callObj.close();
      callObj.on('close', () => this.onStreamClose(vid, callObj.peer))
    });
  }

  onStreamClose(vid, peerId) {
    vid.style.visibility = 'hidden';
    this.currentStream.localStream.getTracks().forEach(track => track.stop());
    this.currentStream = null;

    const peerFlag = document.getElementById(peerId).children[0];
    peerFlag.onclick = () => {
      navigator.mediaDevices.getUserMedia({audio: true, video: true})
      .then(ms => this.videoCall(peerId, ms, vid.style.borderColor))
    }
  }

  onData(connection) {
    connection.on('data', data => {
      const dataObj = JSON.parse(data);

      switch(dataObj.type) {
        case 'syncResponse':
          this.controller.handleSync(dataObj);
          break;
        case 'syncRequest':
          this.syncTo(dataObj.peerId, dataObj.siteId);
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

  onConnClose(connection) {
    connection.on('close', () => {
      this.removeFromConnections(connection.peer);
      this.controller.findNewTarget(connection.peer);
    });
  }
}

export default Broadcast;
