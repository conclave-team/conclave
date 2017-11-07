class Broadcast {
  constructor(controller, targetPeerId) {
    this.controller = controller;
    this.peer = controller.peer;
    this.connections = [];

    this.connectToTarget(targetPeerId);
    this.bindServerEvents();
  }

  send(operation) {
    const dataJSON = JSON.stringify(operation);
    this.connections.forEach(conn => conn.send(dataJSON));
  }

  bindServerEvents() {
    this.onOpen();
    this.onConnection();
  }

  connectToTarget(peerId) {
    if (peerId != 0) {
      this.connections.push(this.peer.connect(peerId));
      this.controller.addToConnectionList(peerId);
    }
  }

  onOpen() {
    this.peer.on('open', id => {
      this.controller.updateShareLink(id);
    });
  }

  onConnection() {
    this.peer.on('connection', (connection) => {
      const peers = Object.keys(this.peer.connections);

      if (this.connections.length < peers.length) {
        connection.on('open', () => {
          this.connections.push(this.peer.connect(connection.peer));
          this.controller.addToConnectionList(connection.peer);
        });
      }

      connection.on('data', data => {
        this.controller.handleRemoteOperation(data);
      });

      connection.on('close', () => {
        let index = this.connections.indexOf(connection);
        this.connections.splice(index, 1);
        this.controller.removeFromConnectionList(connection.peer);
      });
    });
  }
}

export default Broadcast;
