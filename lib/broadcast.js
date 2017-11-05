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
      this.controller.updateShareLink(id);
    });

    // query parameter includes id that is used to connect to another site
    if (gPEERID != 0) {
      this.connections.push(this.peer.connect(gPEERID));
      this.controller.addToConnectionList(gPEERID);
    }
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
