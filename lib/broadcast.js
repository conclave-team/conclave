import Peer from 'peerjs';

class Broadcast {
  constructor(controller) {
    this.controller = controller;
    this.peer = new Peer({key: 'mgk9l45fu1gfzuxr', debug: 1});
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
      debugger;
      this.controller.updateShareLink(id);
    });

    debugger;

    if (peerId !== 0) {
      this.connections.push(this.peer.connect(peerId));
      this.controller.updateConnectionList(peerId);
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

      this.onData();
    });
  }

  onData(connection) {
    connection.on('data', data => {
      this.controller.handleRemoteOperation(data);
    });
  }
}
