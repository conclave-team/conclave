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
    this.onOpen(targetPeerId);
    this.onPeerConnection();
  }

  onOpen(targetPeerId) {
    this.peer.on('open', id => {
      this.controller.updateShareLink(id);
      this.connectToTarget(targetPeerId, id);
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
      // this.addToConnections(conn);
    } else {
      this.controller.addToNetwork(peerId, this.controller.siteId);
    }
  }

  addToConnections(connection) {
    if (!this.isAlreadyConnected(connection)) {
      this.connections.push(connection);
      // this.controller.addToNetwork(connection.peer);
    }
  }

  addToNetwork(peerId, siteId) {
    this.send({
      type: "add to network",
      newPeer: peerId,
      newSite: siteId
    });
  }

  removeFromNetwork(peerId, siteId) {
    this.send({
      type: "remove from network",
      oldPeer: peerId,
      oldSite: siteId
    });
  }

  removeFromConnections(connection) {
    this.connections = this.connections.filter(conn => conn.peer !== connection.peer);
    this.controller.removeFromNetwork(connection.peer);
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
      this.onData(connection);
      this.onConnClose(connection);
    });
  }

  syncTo(peerId, siteId) {
    if (this.isAlreadyConnected(peerId)) { return; }

    const connBack = this.peer.connect(peerId);
    this.addToConnections(connBack);
    this.controller.addToNetwork(peerId, siteId);
    const initialData = JSON.stringify({
      type: 'syncResponse',
      siteId: this.controller.siteId,
      peerId: this.peer.id,
      initialStruct: this.controller.crdt.struct,
      initialVersions: this.controller.vector.versions,
      network: this.controller.network
    });

    connBack.on('open', () => {
      connBack.send(initialData);
    });
  }

  onConnection(connection) {
    connection.on('open', () => {
      if (this.isAlreadyConnected(connection)) { return; }

      const connBack = this.peer.connect(connection.peer);
      this.addToConnections(connBack);
    //   const initialData = JSON.stringify({
    //     type: 'syncResponse',
    //     siteId: this.controller.siteId,
    //     initialStruct: this.controller.crdt.struct,
    //     initialVersions: this.controller.vector.versions,
    //     network: this.controller.network
    //   });
    //
    //   connBack.on('open', () => {
    //     connBack.send(initialData);
    //   });
    });
  }

  onData(connection) {
    connection.on('data', data => {
      const dataObj = JSON.parse(data);

      if (dataObj.type === 'syncResponse') {
        this.controller.handleSync(dataObj);
      } else if (dataObj.type === 'syncRequest') {
        this.syncTo(dataObj.peerId, dataObj.siteId);
      } else if (dataObj.type === 'add to network') {
        this.controller.addToNetwork(dataObj.newPeer, dataObj.newSite);
      } else if (dataObj.type === 'remove from network') {
        this.controller.removeFromNetwork(dataObj.oldPeer, dataObj.oldSite);
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
