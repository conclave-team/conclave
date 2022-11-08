class Broadcast {
  constructor() {
    this.controller = null;
    this.peer = null;
    this.outConns = [];
    this.inConns = [];
    this.outgoingBuffer = [];
    this.MAX_BUFFER_SIZE = 40;
    this.currentStream = null;
    // additions
    this.region = [];
    this.refPoint = [];
    this.genValue = null;
    this.neighbors = [];
  }


  appendNeighbor(peerId, siteId, newPeerZone){
    console.log('\tDEBUG:\tAPPENDNEIGHBOR SUCCESS');
    this.neighbors.push({
      peerId: peerId,
      siteId: siteId,
      region: newPeerZone,
    });

    this.neighbors.forEach((item) =>{
      console.log('\tDEBUG:\tNEIGHBORS: ' + Object.values(item));
    });
    // console.table('\tDEBUG:\tNEIGHBORS: ' + this.neighbors);
  }
  
  connectPeers(peerId, siteId, newPeerZone){
    

  }

  isNeighbor(connection, newPeerZone){
    // connection: neighbor of original
    console.log('\tDEBUG:\tCONNECTION REGION: ' + connection.broadcast.region);
    let xEnd1 = connection.broadcast.region[0][1];
    let xStart1 = connection.broadcast.region[0][0];
    let xEnd2 = newPeerZone[0][1];
    let xStart2 = newPeerZone[0][0];

    let yEnd1 = connection.broadcast.region[1][1];
    let yStart1 = connection.broadcast.region[1][0];
    let yEnd2 = newPeerZone[1][1];
    let yStart2 = newPeerZone[1][0];

    if ((xEnd1 >= xStart2) && (xEnd2 >= xStart1)){
      if ((xEnd1 - xStart2 == 0) || (xEnd2 - xStart1 == 0)){
          // xintersect = 1;
          if ((yEnd1 >= yStart2) && (yEnd2 >= yStart1)){
              if ((yEnd1 - yStart2 == 0) || (yEnd2 - yStart1 == 0)){
                  //yintersect = 1;
                  neighbor = false;
              }else{
                  //yintersect = 2;
                  neighbor = true;
              }
          }else{
              //yintersect = 0;
              neigbor = false;
          }
      }else{
          // xintersect = 2;
          if ((yEnd1 >= yStart2) && (yEnd2 >= yStart1)){
              neighbor = true;
          }else{
              if((yEnd1%10 == 0) && (yStart2%10 == 0) || (yEnd2%10 == 0) && (yStart1%10 == 0)){// wrapping y
                  //yintersect = 1
                  neighbor = true;
              }else{
                  //yintersect = 0;
                  neighbor = false;
              }
          }
      }
  }else{
      if((xEnd1%10 == 0) && (xStart2%10 == 0) || (xEnd2%10 == 0) && (xStart1%10 == 0)){ // wrapping x
          //xintersect = 1;
          if ((yEnd1 >= yStart2) && (yEnd2 >= yStart1)){
              if ((yEnd1 - yStart2 == 0) || (yEnd2 - yStart1 == 0)){
                  //yintersect = 1;
                  neighbor = false;
              }else{
                  //yintersect = 2;
                  neighbor = true;
              }
          }else{
              //yintersect = 0;
              neighbor = false;
          }
      }else{
          //xintersect = 0;
          neighbor = false;
      }
  }
  }

  // 
  acceptNeighbor(peerId, siteId) {
    console.log("\tDEBUG:\t=====ACCEPT NEIGHBOR RUNNING ======")
    const connBack = this.peer.connect(peerId);
    this.addToOutConns(connBack);
    this.controller.addToNetwork(peerId, siteId);
    
    const initialData = JSON.stringify({
      type: 'syncNeighbor',
      siteId: this.controller.siteId,
      peerId: this.peer.id,
      initialStruct: this.controller.crdt.struct,
      initialVersions: this.controller.vector.versions,
      network: this.controller.network,
    });

    
    if (connBack.open) {
      connBack.send(initialData);
    } else {
      connBack.on('open', () => {
        connBack.send(initialData);
      });
    }
  }

  zoneTake(zoneOffer,Gen) { //split zone by new peer
    let temp = zoneOffer.split(',').map(Number);

    this.region = [[temp[0],temp[1]],[temp[2],temp[3]]];
    this.refPoint = [Math.floor((Math.random()*(this.region[0][1]-this.region[0][0]))+this.region[0][0]), Math.floor((Math.random()*(this.region[1][1]-this.region[1][0]))+this.region[1][0])];

    this.genValue = 2*(Gen)+1;
    console.log('\tDEBUG:\ ZONE of Connecting Peer: ' + this.region);
    console.log('\tDEBUG:\ GENVAL of Connecting Peer: ' + this.genValue);

  }

  zoneShare() { //split zone by original owner
    let xStart = this.region[0][0];
    let xEnd = this.region[0][1];
    let yStart = this.region[1][0];
    let yEnd = this.region[1][1];
    let zoneOffer = []
    let Offer = [];
    
    //for connecting Peer
    if((yEnd-yStart)>(xEnd-xStart)){
      Offer = [[xStart,xEnd],[yStart,((yEnd+yStart)/2)]];
    }else{
      Offer = [[xStart,(xEnd+xStart)/2],[yStart,yEnd]];
    }

    zoneOffer[0] = Offer[0][0] + ',' + Offer[0][1] + ',' + Offer[1][0] + ',' + Offer[1][1];

    //original Peer
    if((yEnd-yStart)>(xEnd-xStart)){
      this.region = [[xStart,xEnd],[(yStart+yEnd)/2,yEnd]];
    }
    else {
      this.region = [[(xStart+xEnd)/2,xEnd],[yStart,yEnd]];
    }

    zoneOffer[1] = this.region[0][0] + ',' + this.region[0][1] + ',' + this.region[1][0] + ',' + this.region[1][1];

    this.genValue = 2*(this.genValue)+2;

    console.log('\tDEBUG:\ ZONE of Original Peer: ' + this.region);
    console.log('\tDEBUG:\ GENVAL of Original Peer: ' + this.genValue);
    
    // zoneOffer = [original zone, connecting zone]
    return zoneOffer;
  }
  
  send(operation) {
    const operationJSON = JSON.stringify(operation);
    if (operation.type === 'insert' || operation.type === 'delete') {
      this.addToOutgoingBuffer(operationJSON);
    }
    this.outConns.forEach(conn => conn.send(operationJSON));
  }

  addToOutgoingBuffer(operation) {
    if (this.outgoingBuffer.length === this.MAX_BUFFER_SIZE) {
      this.outgoingBuffer.shift();
    }

    this.outgoingBuffer.push(operation);
  }

  processOutgoingBuffer(peerId) {
    const connection = this.outConns.find(conn => conn.peer === peerId);
    this.outgoingBuffer.forEach(op => {
      connection.send(op);
    });
  }

  bindServerEvents(targetPeerId, peer) {
    this.peer = peer;
    this.onOpen(targetPeerId);
    this.heartbeat = this.startPeerHeartBeat(peer);
  }

  startPeerHeartBeat(peer) {
    let timeoutId = 0;
    const heartbeat = () => {
      timeoutId = setTimeout( heartbeat, 20000 );
      if ( peer.socket._wsOpen() ) {
          peer.socket.send( {type:'HEARTBEAT'} );
      }
    };

    heartbeat();

    return {
      start : function () {
        if ( timeoutId === 0 ) { heartbeat(); }
      },
      stop : function () {
        clearTimeout( timeoutId );
        timeoutId = 0;
      }
    };
  }

  onOpen(targetPeerId) {
    debugger;
    this.peer.on('open', id => {
      this.controller.updateShareLink(id);
      this.onPeerConnection();
      this.onError();
      this.onDisconnect();
      if (targetPeerId == 0) {
        this.controller.addToNetwork(id, this.controller.siteId);
      } else {
        this.requestConnection(targetPeerId, id, this.controller.siteId)
      }
    });
  }

  onError() {
    this.peer.on("error", err => {
      const pid = String(err).replace("Error: Could not connect to peer ", "");
      this.removeFromConnections(pid);
      console.log(err.type);
      if (!this.peer.disconnected) {
        this.controller.findNewTarget();
      }
      this.controller.enableEditor();
    });
  }

  onDisconnect() {
    this.peer.on('disconnected', () => {
      this.controller.lostConnection();
    });
  }

  requestConnection(target, peerId, siteId) {
    const conn = this.peer.connect(target);
    this.addToOutConns(conn);
    conn.on('open', () => {
      conn.send(JSON.stringify({
        type: 'connRequest',
        peerId: peerId,
        siteId: siteId,
      }));
    });
  }

  evaluateRequest(peerId, siteId) {
    if (this.hasReachedMax()) {
      this.forwardConnRequest(peerId, siteId);
    } else {
      this.acceptConnRequest(peerId, siteId);
    }
  }

  hasReachedMax() {
    const halfTheNetwork = Math.ceil(this.controller.network.length / 2);
    const tooManyInConns = this.inConns.length > Math.max(halfTheNetwork, 5);
    const tooManyOutConns = this.outConns.length > Math.max(halfTheNetwork, 5);

    return tooManyInConns || tooManyOutConns;
  }

  forwardConnRequest(peerId, siteId) {
    const connected = this.outConns.filter(conn => conn.peer !== peerId);
    const randomIdx = Math.floor(Math.random() * connected.length);
    connected[randomIdx].send(JSON.stringify({
      type: 'connRequest',
      peerId: peerId,
      siteId: siteId,
    }));
  }


  addToOutConns(connection) {
    if (!!connection && !this.isAlreadyConnectedOut(connection)) {
      this.outConns.push(connection);
    }
  }

  addToInConns(connection) {
    if (!!connection && !this.isAlreadyConnectedIn(connection)) {
      this.inConns.push(connection);
    }
  }

  addToNetwork(peerId, siteId) {
    this.send({
      type: "add to network",
      newPeer: peerId,
      newSite: siteId
    });
  }

  removeFromNetwork(peerId) {
    this.send({
      type: "remove from network",
      oldPeer: peerId
    });
    this.controller.removeFromNetwork(peerId);
  }

  removeFromConnections(peer) {
    this.inConns = this.inConns.filter(conn => conn.peer !== peer);
    this.outConns = this.outConns.filter(conn => conn.peer !== peer);
    this.removeFromNetwork(peer);
  }

  isAlreadyConnectedOut(connection) {
    if (connection.peer) {
      return !!this.outConns.find(conn => conn.peer === connection.peer);
    } else {
      return !!this.outConns.find(conn => conn.peer.id === connection);
    }
  }

  isAlreadyConnectedIn(connection) {
    if (connection.peer) {
      return !!this.inConns.find(conn => conn.peer === connection.peer);
    } else {
      return !!this.inConns.find(conn => conn.peer.id === connection);
    }
  }

  onPeerConnection() {
    this.peer.on('connection', (connection) => {
      this.onConnection(connection);
      this.onVideoCall(connection);
      this.onData(connection);
      this.onConnClose(connection);
    });
  }

  acceptConnRequest(peerId, siteId) {
    const connBack = this.peer.connect(peerId);
    this.addToOutConns(connBack);
    this.controller.addToNetwork(peerId, siteId);
    let zoneOffer = this.zoneShare(); //
    
    const initialData = JSON.stringify({
      type: 'syncResponse',
      siteId: this.controller.siteId,
      peerId: this.peer.id,
      initialStruct: this.controller.crdt.struct,
      initialVersions: this.controller.vector.versions,
      network: this.controller.network,
      //additions
      peerZone: zoneOffer[1],
      zoneOffer: zoneOffer[0],
      Gen: this.genValue,

    });

    
    if (connBack.open) {
      connBack.send(initialData);
    } else {
      connBack.on('open', () => {
        connBack.send(initialData);
      });
    }

    this.appendNeighbor(peerId, siteId, zoneOffer[0]);
  }

  videoCall(id, ms) {
    if (!this.currentStream) {
      const callObj = this.peer.call(id, ms);
      this.onStream(callObj);
    }
  }

  onConnection(connection) {
    this.controller.updateRootUrl(connection.peer);
    this.addToInConns(connection);
  }

  onVideoCall() {
    this.peer.on('call', callObj => {
      this.controller.beingCalled(callObj);
    });
  }

  answerCall(callObj, ms) {
    if (!this.currentStream) {
      callObj.answer(ms);
      this.controller.answerCall(callObj.peer);
      this.onStream(callObj);
    }
  }

  onStream(callObj) {
    callObj.on('stream', stream => {
      if (this.currentStream) { this.currentStream.close(); }
      this.currentStream = callObj;

      this.controller.streamVideo(stream, callObj);

      callObj.on('close', () => this.onStreamClose(callObj.peer))
    });
  }

  onStreamClose(peerId) {
    this.currentStream.localStream.getTracks().forEach(track => track.stop());
    this.currentStream = null;

    this.controller.closeVideo(peerId);
  }

  onData(connection) {
    connection.on('data', data => {
      const dataObj = JSON.parse(data);

      switch(dataObj.type) {
        case 'connRequest':
          this.evaluateRequest(dataObj.peerId, dataObj.siteId);
          break;
        case 'addNeighbor':                                    // adding neighbor to original peer
          this.acceptNeighbor(dataObj.peerId, dataObj.siteId); // adds 
          break;
        case 'syncNeighbor':                                   // new syncResponse for neighbor adding
          this.processOutgoingBuffer(dataObj.peerId);
          this.controller.handleSync(dataObj); 
          break;
        case 'syncResponse':
          this.processOutgoingBuffer(dataObj.peerId);
          this.controller.handleSync(dataObj);
          this.zoneTake(dataObj.zoneOffer,dataObj.Gen);
          this.appendNeighbor(dataObj.peerId, dataObj.siteId, dataObj.peerZone);
          break;
        case 'syncCompleted':
          this.processOutgoingBuffer(dataObj.peerId);
          break;
        case 'add to network':
          this.controller.addToNetwork(dataObj.newPeer, dataObj.newSite);
          break;
        case 'remove from network':
          this.controller.removeFromNetwork(dataObj.oldPeer);
          break;
        default:
          this.controller.handleRemoteOperation(dataObj);
      }
    });
  }

  randomId() {
    const possConns = this.inConns.filter(conn => {
      return this.peer.id !== conn.peer;
    });
    const randomIdx = Math.floor(Math.random() * possConns.length);
    if (possConns[randomIdx]) {
      return possConns[randomIdx].peer;
    } else {
      return false;
    }
  }

  onConnClose(connection) {
    connection.on('close', () => {
      this.removeFromConnections(connection.peer);
      if (connection.peer == this.controller.urlId) {
        const id = this.randomId();
        if (id) { this.controller.updatePageURL(id); }
      }
      if (!this.hasReachedMax()) {
        this.controller.findNewTarget();
      }
    });
  }
}


export default Broadcast;
