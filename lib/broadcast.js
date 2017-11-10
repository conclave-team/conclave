class Broadcast {
  constructor() {
    this.controller = null;
    this.peer = null
    this.connections = [];
  }

  send(operation) {
    const operationJSON = JSON.stringify(operation);
    this.connections.forEach(conn => conn.send(operationJSON));
  }

  bindServerEvents(targetPeerId, peer) {
    this.peer = peer;
    this.onOpen();
    this.connectToTarget(targetPeerId);
    this.onPeerConnection();
  }

  onOpen() {
    this.peer.on('open', id => {
      this.controller.updateShareLink(id);
    });
  }

  connectToTarget(targetId) {
    if (targetId != 0) {
      const conn = this.peer.connect(targetId);
      this.addToConnections(conn);
    }
  }

  addToConnections(connection) {
    if (!this.isAlreadyConnected(connection)) {
      this.connections.push(connection);
      this.controller.addToNetwork(connection.peer);
      this.controller.addToListOfPeers(connection.peer);
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

  removeFromConnections(connection) {
    this.connections = this.connections.filter(conn => conn.peer !== connection.peer);
    this.controller.removeFromNetwork(connection.peer)
    this.controller.removeFromListOfPeers(connection.peer);
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
      this.addToConnections(connBack);
      const initialData = JSON.stringify({
        type: 'sync',
        initialStruct: this.controller.crdt.struct,
        initialVersions: this.controller.vector.versions,
        network: this.controller.network
      });

      connBack.on('open', () => {
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
      this.removeFromConnections(connection);
      if (this.connections.length === 0) {
        this.controller.findNewTarget();
      }
    });
  }
}

export default Broadcast;
