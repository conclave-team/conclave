class Broadcast {
  constructor(targetPeerId) {
    this.controller = null;
    this.peer = null
    this.connections = [];
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
      const connection = this.peer.connect(peerId);
      this.connections.push(connection);
      this.controller.addToConnectionList(peerId);
    }
  }

  onOpen() {
    this.peer.on('open', id => {
      this.id = id;
      this.controller.updateShareLink(id);
    });
  }

  onConnection() {
    this.peer.on('connection', (connection) => {

      const peers = Object.keys(this.peer.connections);

      if (this.connections.length < peers.length) {
        connection.on('open', () => {
          const connBack = this.peer.connect(connection.peer);

          const myStruct = JSON.stringify(this.controller.crdt.struct);
          const myVersions = JSON.stringify(this.controller.vector.versions);
          const initialData = JSON.stringify({
            type: 'sync',
            initialStruct: myStruct,
            initialVersions: myVersions
          });

          connBack.on('open', () => {
            connBack.send(initialData);
          })

          this.connections.push(connBack);
          this.controller.addToConnectionList(connection.peer);
        });
      }

      connection.on('data', data => {
        const dataObj = JSON.parse(data);

        if (dataObj.type === 'sync') {
          this.controller.handleSync(dataObj);
        } else {
          this.controller.handleRemoteOperation(dataObj);
        }
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
