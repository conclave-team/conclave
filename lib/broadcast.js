class Broadcast {
  constructor(controller, targetPeerId) {
    this.controller = controller;
    this.peer = controller.peer;
    this.connections = [];

    this.bindServerEvents();
    this.connectToTarget(targetPeerId);
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

      connection.on('data', data => {
        const dataObj = JSON.parse(data);
        if (dataObj instanceof Array) {
          this.controller.populateCRDT(dataObj);
        } else if (dataObj === String(dataObj)) {
          this.controller.editor.updateView(dataObj);
        } else {
          this.controller.handleRemoteOperation(data);
        }
      });

      const peers = Object.keys(this.peer.connections);
      if (this.connections.length < peers.length) {
//        connection.on('open', () => {
          const connBack = this.peer.connect(connection.peer);
          const myStruct = JSON.stringify(this.controller.crdt.struct);
          const myVector = JSON.stringify(this.controller.vector);
          const initialData = JSON.stringify({
            initialStruct: this.controller.crdt.struct,
            initialVector: this.controller.vector
          });

          setTimeout(function() {connBack.send(myStruct)}, 500);

          this.connections.push(connBack);
          this.controller.addToConnectionList(connection.peer);
//        });
      }

      connection.on('close', () => {
        let index = this.connections.indexOf(connection);
        this.connections.splice(index, 1);
        this.controller.removeFromConnectionList(connection.peer);
      });
    });
  }
}

export default Broadcast;
