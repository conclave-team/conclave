class Broadcast {
  constructor(controller) {
    this.controller = controller;
    this.peer = controller.peer;
    this.peerId = controller.peerId;
    this.connections = [];
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

  onOpen() {
    this.peer.on('open', id => {
      this.controller.updateShareLink(id);
    });

    if (this.peerId != 0) {
      this.connections.push(this.peer.connect(this.peerId));
      this.controller.updateConnectionList(this.peerId);
    }
  }

  onConnection() {
    this.peer.on('connection', connection => {
      const peers = Object.keys(this.peer.connections);

      if (this.connections.length < peers.length) {
        connection.on('open', () => {
          const conn = this.peer.connect(peers[peers.length-1]);
          this.connections.push(conn);

          this.controller.updateConnectionList(conn.peer);
        });
      }

      connection.on('data', data => {
        this.controller.handleRemoteOperation(data);
      });
    });
  }
}

export default Broadcast;
