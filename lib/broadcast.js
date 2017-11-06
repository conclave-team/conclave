class Broadcast {
  constructor(controller, targetPeerId) {
    this.controller = controller;
    this.peer = controller.peer;
    this.connections = [];

    this.connectToTarget(targetPeerId);
    this.bindServerEvents();
  }

  send(message) {
    const dataJSON = JSON.stringify(message);
    this.connections.forEach(conn => conn.send(dataJSON));
  }

  bindServerEvents() {
    this.onOpen();
    this.onConnection();
  }

  connectToTarget(peerId) {
    if (peerId != 0) {
      this.connections.push(this.peer.connect(peerId));
      this.controller.updateConnectionList(peerId);
    }
  }

  onOpen() {
    this.peer.on('open', id => {
      this.controller.updateShareLink(id);
    });
  }

  onConnection() {
    this.peer.on('connection', connection => {
      const peers = Object.keys(this.peer.connections);

      if (this.connections.length < peers.length) {
        connection.on('open', () => {
          this.connections.push(this.peer.connect(connection.peer));
          this.controller.updateConnectionList(connection.peer);
        });
      }

      connection.on('data', data => {
        this.controller.handleRemoteOperation(data);
      });
    });
  }
}

export default Broadcast;
