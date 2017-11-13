class Broadcast {
  constructor() {
    this.controller = null;
    this.peer = null;
    this.connections = [];
  }

  send(operation) {
    const operationJSON = JSON.stringify(operation);
    this.connections.forEach(conn => conn.send(operationJSON));
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
      this.connectToTarget(targetPeerId);
    });
  }

  onError() {
    this.peer.on("error", err => {
      const pid = String(err).replace("Error: Could not connect to peer ", "");
      this.removeFromConnections(pid);
      this.controller.findNewTarget();
    });
  }

  connectToTarget(targetId, createUrl=false) {
    if (targetId != 0) {
      const conn = this.peer.connect(targetId);
      conn.on("open", () => {
        if (createUrl) {
          this.controller.createNewUrl(targetId);
        }
        this.addToConnections(conn);
      });
    }
  }

  addToConnections(connection) {
    if (!this.isAlreadyConnected(connection)) {
      this.connections.push(connection);
      this.controller.addToNetwork(connection.peer);
    }
  }

  addToNetwork(id) {
    this.send({
      type: "add to network",
      newPeer: id
    });
  }

  removeFromNetwork(id) {
    this.send({
      type: "remove from network",
      oldPeer: id
    });
  }

  removeFromConnections(peer) {
    this.connections = this.connections.filter(conn => conn.peer !== peer);
    this.controller.removeFromNetwork(peer);
  }

  isAlreadyConnected(connection) {
    return !!this.connections.find(conn => conn.peer === connection.peer);
  }

  onPeerConnection() {
    this.peer.on('connection', (connection) => {
      this.onConnection(connection);
      this.onData(connection);
      this.onConnClose(connection);
    });
  }

  onConnection(connection) {
    connection.on('open', () => {
      if (this.isAlreadyConnected(connection)) { return; }
      const connBack = this.peer.connect(connection.peer);
      const initialData = JSON.stringify({
        type: 'sync',
        initialStruct: this.controller.crdt.struct,
        initialVersions: this.controller.vector.versions,
        network: this.controller.network
      });
      connBack.on('open', () => {
        this.addToConnections(connBack);
        connBack.send(initialData);
      });
    });
  }

  onData(connection) {
    connection.on('data', data => {
      const dataObj = JSON.parse(data);

      if (dataObj.type === 'sync') {
        this.controller.handleSync(dataObj);
      } else if (dataObj.type === 'add to network') {
        this.controller.addToNetwork(dataObj.newPeer);
      } else if (dataObj.type === 'remove from network') {
        this.controller.removeFromNetwork(dataObj.oldPeer);
      } else {
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
