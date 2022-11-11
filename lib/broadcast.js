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
    this.region = ''; // string of zone 'XStart,XEnd,YStart,YEnd'
    this.refPoint = [];
    this.genValue = null;
    this.neighbors = [];
  }

  // To stringify this.region
  regionAdapter(region){
    let zone = region[0][0] + ',' + region[0][1] + ',' + region[1][0] + ',' + region[1][1];
    return zone; // from [[int],[int]] to [string]
  }

  checkNeighbor(){ //FOR DEBUGGING
    this.neighbors.forEach((item) =>{
      console.log('\tDEBUG:\tNEIGHBORS: ' + Object.values(item));
    });
  }

  confirmNeighbor(peerId, siteId){
    console.log('\tDEBUG:\tADDED TO OUTCONNS: ' + peerId);
    const conn = this.peer.connect(peerId);
    this.addToOutConns(conn);
    this.controller.addToNetwork(peerId, siteId);
  }

  appendNeighbor(peerId, siteId, newPeerZone){
    this.neighbors.push({
      peerId: peerId,
      siteId: siteId,
      region: newPeerZone,
    });
    console.log('\tDEBUG:\tAPPENDNEIGHBOR() SUCCESS');
    this.checkNeighbor();
  }
  
  // Passes connRequest of connecting peer to neighbors of original peer
  // peerId: of connecting peer
  // called by orig peer
  connectPeers(peerId, siteId, newPeerZone){
    console.log('\tDEBUG:\t Passing neighbors from ' + this.peer.id + ' to ' + peerId);
    
    const origNeighbors = this.outConns.filter(conn => conn.peer !== peerId); // will make a new list, not containing the connecting peer

    const forwardData = JSON.stringify({
      type: 'addNeighbor',
      peerId: peerId,
      siteId: siteId,
      region: newPeerZone,
    });

    origNeighbors.forEach((item) =>{
      console.log('\tDEBUG:\tCONNECTED LIST: ' + item.peer);
    });
    if(origNeighbors.length !== 0){
      this.neighbors.forEach((neighbor) => { //for each neighbor of original zone,
        const connNeighbor =  origNeighbors.find(conn => conn.peer === neighbor.peerId); // neighbor conn object
        if(connNeighbor){
          console.log('\tDEBUG:\tCONNECTING PEER: ' + peerId);
          console.log('\tDEBUG:\tNEIGHBOR PEER: ' + neighbor.peerId);
          if(this.isNeighbor(neighbor.region, newPeerZone)){
            if (connNeighbor.open) {
              console.log('\tDEBUG:\tCONNEIGHBOR OPEN');
              connNeighbor.send(forwardData);
            } else {
              connNeighbor.on('open', () => {
                connNeighbor.send(forwardData);
              });
            } 
          }  
        }   
      })
    }
    
  }

  updateRequest(peerId){
    const origNeighbors = this.outConns.filter(conn => conn.peer !== peerId); // will make a new list, not containing the connecting peer
    
    if(origNeighbors.length !== 0){
      const request = JSON.stringify({
        type: 'askUpdateNeighbor',
        peerId: this.peer.id,
        siteId: this.controller.siteId,
        region: this.region,
      });    
    
      origNeighbors.forEach((neighbor) => {
        if (neighbor.open) {
          console.log('\tDEBUG:\tREQUEST SENT from ' + this.peerId);
          neighbor.send(request);
        } else {
          neighbor.on('open', () => {
            neighbor.send(request);
          });
        } 
      });
    }
  }

  replyRequest(peerId, siteId, region){ //deets of peer requesting update
    console.log('\tDEBUG:\tREQUEST RECEIVED from:' + peerId);
    const replyConn = this.outConns.find(conn => conn.peer === peerId);
    const reply = JSON.stringify({
      type: 'doUpdateNeighbor',
      peerId: this.peer.id,
      siteId: this.controller.siteId,
      region: this.region,
    });
    
    if (replyConn.open) {
        console.log('\tDEBUG:\tREPLY SENT');
        replyConn.send(reply);
    } else {
        replyConn.on('open', () => {
          replyConn.send(reply);
      });
    }
    this.updateNeighbor(peerId, siteId, region);
  }

    // updates zone info or removes neighbor from current neighbor list
  updateNeighbor(peerId, siteId, region){ 
    console.log('\tDEBUG:\tREPLY RECEIVED');
    //updates regions of all current neighbors in list
    let remove = null;
    
    //removes regions that do not pass isNeighbor()
    this.neighbors.forEach((neighbor) => {
      if(peerId === neighbor.peerId){
        if(this.isNeighbor(this.region, region)){
          neighbor.region = region;
          remove = false;
        }else{
          remove = true;
        }
      }
      if(remove){
        this.neighbors = this.neighbors.filter(neighbor => peerId !== neighbor.peerId);
      }
      
    });
    console.log('\tDEBUG:\tUPDATE SUCCESS');
    this.checkNeighbor();
  }

  // Checking if two peers are neighbors
  isNeighbor(neighborZone, newPeerZone){
    console.log('\tDEBUG:\tISNEIGHBOR() RUNNING');
    let neighbor = null;
    let temp1 = neighborZone.split(',').map(Number);
    let temp2 = newPeerZone.split(',').map(Number);
    console.log('\tDEBUG:\tCONNECTING ZONE: ' + newPeerZone);
    console.log('\tDEBUG:\tNEIGHBOR ZONE: ' + neighborZone);

    let xStart1 = temp1[0];
    let xEnd1 = temp1[1];
    let xStart2 = temp2[0];
    let xEnd2 = temp2[1];

    let yStart1 = temp1[2];
    let yEnd1 = temp1[3];
    let yStart2 = temp2[2];
    let yEnd2 = temp2[3];

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
              neighbor = false;
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
    console.log('\tDEBUG:\tISNEIGHBOR() = ' + neighbor);
    return neighbor;
  }

  // Neighbor of original peer accepts connecting peer as neighbor
  // peerId: peerId of connecting peer
  // newPeerZone: 
  acceptNeighbor(peerId, siteId, newPeerZone) {
    console.log("\tDEBUG:\t=====ACCEPT NEIGHBOR RUNNING ======");
    console.log("\tDEBUG:\tCONNECTING PEER:" + peerId + "," + siteId + "," + newPeerZone);
    const connBack = this.peer.connect(peerId);
    if(connBack){
      console.log("\tDEBUG:\tPEER CONNECTED");
      this.appendNeighbor(peerId, siteId, newPeerZone);
    }
    this.addToOutConns(connBack);
    this.controller.addToNetwork(peerId, siteId);
    
    const initialData = JSON.stringify({
      type: 'syncNeighbor',
      siteId: this.controller.siteId,
      peerId: this.peer.id,
      initialStruct: this.controller.crdt.struct,
      initialVersions: this.controller.vector.versions,
      network: this.controller.network,
      //additions
      peerZone: this.region,
    });
    
    if (connBack.open) {
      connBack.send(initialData);
      console.log("\tDEBUG:\tSENT");
    } else {
      connBack.on('open', () => {
        connBack.send(initialData);
        console.log("\tDEBUG:\tSENT");
      });
    }
  }

  zoneTake(zoneOffer,Gen) { //split zone by new peer
    this.region = zoneOffer;
    //this.refPoint = [Math.floor((Math.random()*(this.region[0][1]-this.region[0][0]))+this.region[0][0]), Math.floor((Math.random()*(this.region[1][1]-this.region[1][0]))+this.region[1][0])];

    this.genValue = 2*(Gen)+1;
    console.log('\tDEBUG:\tZONE of Connecting Peer: ' + this.region);
    console.log('\tDEBUG:\tGENVAL of Connecting Peer: ' + this.genValue);

  }

  // called by Original peer
  zoneShare() {
    console.log('\tDEBUG:\tTHIS.REGION: ' + this.region + ' ' + typeof this.region);
    let zone = this.region.split(',').map(Number);
    let xStart = zone[0];
    let xEnd = zone[1];
    let yStart = zone[2];
    let yEnd = zone[3];
    let zoneOffer = []
    let Offer = [];
    let myZone = [];
    
    //connecting Peer
    if((yEnd-yStart)>(xEnd-xStart)){
      Offer = [[xStart,xEnd],[yStart,((yEnd+yStart)/2)]];
    }else{
      Offer = [[xStart,(xEnd+xStart)/2],[yStart,yEnd]];
    }

    zoneOffer[0] = this.regionAdapter(Offer); // ex: '1,2,3,4'

    //original Peer
    if((yEnd-yStart)>(xEnd-xStart)){
      myZone = [[xStart,xEnd],[(yStart+yEnd)/2,yEnd]];
    }
    else {
      myZone = [[(xStart+xEnd)/2,xEnd],[yStart,yEnd]];
    }
    this.region = this.regionAdapter(myZone);
    zoneOffer[1] = this.region; // ex: '1,2,3,4'

    this.genValue = 2*(this.genValue)+2;

    console.log('\tDEBUG:\ ZONE of Original Peer: ' + this.region);
    console.log('\tDEBUG:\ GENVAL of Original Peer: ' + this.genValue);
    
    // zoneOffer = [connecting, original]
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
    let biggestNeighbor = {
      peerId: this.peer.id,
      siteId: this.controller.siteId,
      region: this.region,
    };
    console.log('\tDEBUG:\t Initial Biggest: ' + Object.values(biggestNeighbor));
    this.neighbors.forEach((neighbor) =>{
      if(this.getSize(neighbor.region) > this.getSize(biggestNeighbor.region)){
        console.log('\tDEBUG:\t size of peer 1: ' + this.getSize(biggestNeighbor.region));
        console.log('\tDEBUG:\t size of peer 2: ' + this.getSize(neighbor.region));
        biggestNeighbor.peerId = neighbor.peerId;
        biggestNeighbor.siteId = neighbor.siteId;
        biggestNeighbor.region = neighbor.region;
        console.log('\tDEBUG:\t biggestNeighbor: ' + this.getSize(biggestNeighbor.region));
      }
    });

    const connection = this.outConns.find(conn => conn.peer === biggestNeighbor.peerId);
  
    console.log('\tDEBUG:\t control size: ' + this.getSize(this.region));

    if(this.getSize(biggestNeighbor.region) > this.getSize(this.region)){
      console.log('\tDEBUG:\t FORWARDED');
      connection.send(JSON.stringify({
        type: 'connRequest',
        peerId: peerId,
        siteId: siteId,
      }));
    }else{
      console.log('\tDEBUG:\t ACCEPTED');
      this.acceptConnRequest(peerId, siteId);
    }
  }

  getSize(zone){
    let temp1 = zone.split(',').map(Number);
    let XStart = temp1[0];
    let XEnd = temp1[1];
    let YStart = temp1[2];
    let YEnd = temp1[3];
    let area = (YEnd-YStart)*(XEnd-XStart);
    
    return area;
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
      this.onData(connection);
      this.onConnClose(connection);
    });
  }

  // Original peer accepts connection of connecting peer
  // peerId: peerId of connecting
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

    this.appendNeighbor(peerId, siteId, zoneOffer[0]); // zoneOffer[0] -> zone of connecting peer
    this.connectPeers(peerId, siteId, zoneOffer[0]);
    this.updateRequest(peerId);
  }

  onConnection(connection) {
    this.controller.updateRootUrl(connection.peer);
    this.addToInConns(connection);
  }

  onData(connection) {
    connection.on('data', data => {
      const dataObj = JSON.parse(data);

      switch(dataObj.type) {
        case 'connRequest':
          this.evaluateRequest(dataObj.peerId, dataObj.siteId);
          //this.acceptConnRequest(dataObj.peerId, dataObj.siteId); // temporary
          break;
        case 'askUpdateNeighbor':
          console.log('\tDEBUG:\tREQUEST RECEIVED from:' + dataObj.peerId); // adds neighbor
          this.replyRequest(dataObj.peerId, dataObj.siteId, dataObj.region ); // adds 
          break;
        case 'doUpdateNeighbor': // adds neighbor
        console.log('\tDEBUG:\tGO RECEIVED from:' + dataObj.peerId);
          this.updateNeighbor(dataObj.peerId, dataObj.siteId, dataObj.region); // adds 
          break;
        case 'addNeighbor': // adds neighbor
          this.acceptNeighbor(dataObj.peerId, dataObj.siteId, dataObj.region); // adds 
          break;
        case 'syncNeighbor': // new syncResponse for neighbor adding
          console.log('\tDEBUG:\tSYNCNEIGHBOR from:' + dataObj.peerId);
          this.confirmNeighbor(dataObj.peerId, dataObj.siteId); 
          this.processOutgoingBuffer(dataObj.peerId);
          this.appendNeighbor(dataObj.peerId, dataObj.siteId, dataObj.peerZone);
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

  hasReachedMax() {
    const halfTheNetwork = Math.ceil(this.controller.network.length / 2);
    const tooManyInConns = this.inConns.length > Math.max(halfTheNetwork, 5);
    const tooManyOutConns = this.outConns.length > Math.max(halfTheNetwork, 5);

    return tooManyInConns || tooManyOutConns;
  }

/*
  forwardConnRequest(peerId, siteId) {
    const connected = this.outConns.filter(conn => conn.peer !== peerId);
    const randomIdx = Math.floor(Math.random() * connected.length);
    connected[randomIdx].send(JSON.stringify({
      type: 'connRequest',
      peerId: peerId,
      siteId: siteId,
    }));
  }
  
  videoCall(id, ms) {
    if (!this.currentStream) {
      const callObj = this.peer.call(id, ms);
      this.onStream(callObj);
    }
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
  }*/
}


export default Broadcast;
