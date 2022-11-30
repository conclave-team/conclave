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
    this.genValue = '';
    this.neighbors = [];
  }
  /* CHANGES
  findTakeOver()      -> changed initial if condition to isPredecessor()
                        increased delay to 16s from 15s
  checkBitDistance()  -> see func for deets
  isPredecessor       -> 


  */

  /* TO CHANGE
  appendNeighbor()      -> make case where if the neighbor is already there do nothing
                        
  confirmNeighbor()     -> make case where if the neighbor is already there do nothing
  */
  
  isPredecessor(genValue, predecessor){
    if(predecessor === ""){
      return true;
    }else{
      if(genValue.slice(0,predecessor.length) === predecessor){
        return true;
      }else{
        return false;
      }
    }
  }

  // isPredecessor(genValue, predecessor){
  //   if(predecessor !== ''){
  //     if(genValue.slice(0,predecessor.length) === predecessor){
  //       return true;
  //     }else{
  //       return false;
  //     }
  //   }else{
  //     if(genValue.slice(0,genValue.length-1) === predecessor){
  //       return true;
  //     }else{
  //       return false;
  //     }
  //   }
  // }
  
  findTakeOver(departedGenValue,departedRegion,peerId,siteId,peerZone,genValue,visited){
    let find = () => {
      console.log('\tDEBUG: \t findTakeOver() running');
      console.log('\tDEBUG: \t visited '+ visited + ' ');
      this.delay(16000);
      
      let lowestDistance = null;
      let predecessorNeighbor = [];
      let connection = null;
      let x = 0;
      let visitedList = visited.split(',');
      let filteredNeighbors = [];

      this.checkNeighbor();

      console.log('\tTAKEOVER CHECK: \t ' + this.genValue + ' ?= ' + departedGenValue);
      let bitDistance = this.checkBitDistance(departedGenValue, this.genValue);
      // Check if I am the takeover node
      if((this.genValue === departedGenValue) || (this.genValue === departedGenValue.slice(0,-1))) {
        console.log('\tTAKEOVER CHECK: \t TRUE');

        this.acceptNeighbor(peerId,siteId,peerZone,genValue);
        console.log('\tDEBUG: \t!--------------NEIGHBOR RECOVERY SUCCESS.----------!');
      }else{
        this.neighbors.forEach(neighbor => {
          let remove = false;
          console.log('\tDEBUG: \t Neighbor: \t' + neighbor.peerId);
          visitedList.forEach(element => {
            console.log('\tDEBUG: \t\tVisited: \t' + element + '\tneighborGenValue ' + neighbor.genValue);
            if (neighbor.genValue === element){
              remove = true;
            }
          });
          if(remove != true){
            console.log('\tDEBUG: \t pushed to filtered Neighbors \t' + neighbor.genValue);
            filteredNeighbors.push(neighbor);
          }
        });

        filteredNeighbors.forEach((item) =>{
          console.log('\tDEBUG: \t filteredNeighbors: \t' + Object.values(item) + ':----!');
        });

        filteredNeighbors = filteredNeighbors.filter(neighbor => this.isIntersecting(departedRegion,neighbor.region));
        
        filteredNeighbors.forEach((item) =>{
          console.log('\tDEBUG: \t filteredNeighbors: \t' + Object.values(item) + ':----!');
        });
        
        while(departedGenValue.length-x !== 0){
          console.log('\tDEBUG: \t While loop: \t'+ x);
          x++;
          let predecessor = departedGenValue.slice(0,departedGenValue.length-x);
          console.log('\tDEBUG: \t\t predecessor: \t' + predecessor + '\tdepartedGenValue: ' + departedGenValue);
          
          if(predecessor.length !== 0){
            predecessorNeighbor = filteredNeighbors.filter(neighbor => this.isPredecessor(neighbor.genValue, predecessor));
            console.log('\tDEBUG: \t predNeighbor: \t' + predecessorNeighbor);
          }else{
            predecessorNeighbor = filteredNeighbors;
            console.log('\tDEBUG: \t predNeighbor: \t' + predecessorNeighbor);
          }
          
        }

        console.log('\tDEBUG: \t After loop predNeighbor: \t' + predecessorNeighbor);
        
        predecessorNeighbor.forEach(neighbor => {
          let currDistance = this.checkBitDistance(departedGenValue, neighbor.genValue);
          if ((currDistance <= lowestDistance) || (lowestDistance === null)){
            lowestDistance = currDistance;
            console.log('\tDEBUG:\t departedGenValue: '+ departedGenValue );
            console.log('\tDEBUG:\t NeighborGenValue: '+ neighbor.genValue );
            connection = this.outConns.find(conn => conn.peer === neighbor.peerId);
          }
        });
        
        console.log('\tDEBUG: \t CONNECTION: ' + connection);

        
        visitedList = visitedList + "," + this.genValue;
        
        console.log('\tDEBUG: \t visitedList: '+ visitedList);
        
        connection.send(JSON.stringify({
          type: 'findTakeOver',
          departedGenValue: departedGenValue,
          departedRegion: departedRegion, 
          peerId: peerId,
          siteId: siteId,
          region: peerZone,
          genValue: genValue,
          visited: visitedList,
        }));
        console.log('\tDEBUG: \t findTakeOver() forwarded');
      }
      

        // else{ // takeover node is found
        //   console.log('\tDEBUG:\t TakeOver Node found from '+ genValue );
        //   //this.acceptNeighbor(peerId, siteId, PeerZone, genValue);
        // }
    }

    let timer = setTimeout(function() {find()}, 6000);

}

  removeNeighbor(peerId){
    let idx = this.neighbors.findIndex((neighbor) => neighbor.peerId === peerId);
    clearTimeout(this.neighbors[idx].timer);
    this.neighbors = this.neighbors.filter(neighbor => peerId !== neighbor.peerId);
    this.inConns = this.inConns.filter(conn => conn.peer !== peerId);
    this.outConns = this.outConns.filter(conn => conn.peer !== peerId);
  }

  refreshTimer(peerId){

    let takeOver = (idx) => {
      console.log("\tDEBUG: \tTAKEOVER PROCESS STARTED");

      clearTimeout(this.neighbors[idx].timer); // departing node 
      console.log('\tDEBUG:\t'+ this.neighbors[idx].timer);
      console.log('\tDEBUG:\t'+ this.neighbors[idx].genValue);
      console.log('\tDEBUG:\t'+ this.genValue);

      let leavingNeighbor = this.neighbors[idx];
      let departedGenValue = leavingNeighbor.genValue;
      let departedPredecessor = departedGenValue.slice(0,departedGenValue.length-1);
      
      // compare bitwise distance of this neighbor to departing node
      if(this.isTakeOver(departedGenValue, this.genValue)){
        console.log('\tDEBUG": \t I AM A TAKEOVER NODE');
        this.removeNeighbor(leavingNeighbor.peerId);
        
        //if sibling
        if(this.isPredecessor(this.genValue, departedPredecessor) && (departedGenValue.length === this.genValue.length)){
          console.log('\tDEBUG": \t I AM SIBLINGS WITH DEPARTED');
          console.log('\tDEBUG": \t departed region ' + leavingNeighbor.region);
          console.log('\tDEBUG": \t departed prede ' + departedPredecessor);
          
          this.zoneMerge(leavingNeighbor.region, departedPredecessor);
        }
        else{
          console.log('\tDEBUG: \t SIBLINGS = FALSE');
          this.zoneTransfer(leavingNeighbor.region,departedGenValue);
        }
      }else{
        // look for takeover node (node with nearest distance) and connect to it and add to neighbor
        console.log('\tDEBUG: \t I AM NOT THE TAKEOVER NODE');
        console.log('\tDEBUG: \t ' + Object.values(leavingNeighbor) + ' HAS LEFT');
        
        this.removeNeighbor(leavingNeighbor.peerId);

        this.findTakeOver(leavingNeighbor.genValue,leavingNeighbor.region, this.peer.id, this.controller.siteId, this.region, this.genValue, this.genValue); // last param is visited
      }
      
    }

    console.log('!-----------------\tREFRESH\t-----------------!');
    let idx = this.neighbors.findIndex((neighbor) => neighbor.peerId === peerId);
    console.log('\tDEBUG:\t'+ this.neighbors[idx].timer);
    
    if(this.neighbors[idx].timer === null){
      //console.log('\tDEBUG:\t'+ this.neighbors[idx].timer);
      this.neighbors[idx].timer = setTimeout(function() { takeOver(idx); }, 15000);
    }else{
      //console.log('\tDEBUG:\t'+ this.neighbors[idx].timer);
      clearTimeout(this.neighbors[idx].timer);
      //console.log('\tDEBUG:\t'+ this.neighbors[idx].timer);
      this.neighbors[idx].timer = setTimeout(function() { takeOver(idx); }, 15000);
      //console.log('\tDEBUG:\t'+ this.neighbors[idx].timer);
    }
    // timeoutId = 0;
    // timeoutId = setTimeout(this.takeOver(),50000);
    // console.log('-------------------------------- ');
    this.checkNeighbor();
    this.checkOutConns();
    return 0;
  } 
  
  zoneMerge(departedZone, departedPredecessor){
    console.log('\tDEBUG: \t zoneMerge() running!! ');

    let temp1 = departedZone.split(',').map(Number); // zone of disconnecting
    let temp2 = this.region.split(',').map(Number); // zone of takeover node
    let mergingZone = [[],[]];
    console.log('\tDEBUG: \ttemp1 ' + temp1);
    console.log('\tDEBUG: \ttemp2 ' + temp2);

    
    mergingZone[0][0] = Math.min(temp1[0],temp2[0]); // xStart
    // console.log('\tDEBUG: \tMergingZone: ' + mergingZone[0][0]);
    mergingZone[0][1] = Math.max(temp1[1],temp2[1]); // xEnd
    mergingZone[1][0] = Math.min(temp1[2],temp2[2]); // yStart
    mergingZone[1][1] = Math.max(temp1[3],temp2[3]); // yEnd

    this.region = this.regionAdapter(mergingZone);
    console.log('\tDEBUG: \tNew region: ' + this.region);
    this.genValue = departedPredecessor;
    console.log('\tDEBUG: \tNew genValue: ' + this.genValue);
    
    this.updateRequest(this.peer.id);
  }

  zoneTransfer(departedZone, departedGenValue){

    let doTransfer = () => {
      console.log('\tDEBUG: \t\tzoneTransfer() RUNNING');

      // Look for sibling node
      let sibling = null;
      this.neighbors.forEach(neighbor => {
        let bitDistance = this.checkBitDistance(neighbor.genValue, this.genValue)
        if(this.isPredecessor(neighbor.genValue, (this.genValue).slice(0,this.genValue.length-1)) && (bitDistance == 1)){
          sibling = neighbor;
        }
      });

      console.log('\tSIBLING: \t' + Object.values(sibling));

      // Clear timers of all neighbors except sibling
      this.neighbors.forEach(neighbor => {
        if(neighbor !== sibling){
          clearTimeout(neighbor.timer)
        }
      });

      // Remove all neighbors except sibling
      this.neighbors = this.neighbors.filter(neighbor => neighbor.peerId === sibling.peerId);
      this.inConns = this.inConns.filter(conn => conn.peer === sibling.peerId);
      this.outConns = this.outConns.filter(conn => conn.peer === sibling.peerId);
      
      console.log('\tDEBUG: \tSENT takeOver to ' + sibling.peerId);
      // Send takeOver to sibling
      let connection = this.outConns.find(conn => conn.peer === sibling.peerId);
      connection.send(JSON.stringify({
        type: 'takeOver',
        departedPredecessor: this.genValue.slice(0,this.genValue.length-1),
        region: this.region,
      }));

      // Take region and genvalue of leaving node
      this.region = departedZone;
      this.genValue = departedGenValue;
      console.log('\tDEBUG: \tzoneTransfer() New Region\t' + this.region);
      console.log('\tDEBUG: \tzoneTransfer() New GenValue\t' + this.genValue);
    }

    let timer = setTimeout(function() { doTransfer() }, 3000);
    // doTransfer();
    
  }

  isTakeOver(departedGenValue, myGenValue){
    console.log('\tDEBUG: \t\tisTakeOver() running');
    
    console.log('\tDEBUG: \tdepartedGenValue\t'+ departedGenValue);
    console.log('\tDEBUG: \tmyGenValue\t'+ myGenValue);
    
    // compare departed node's genval with this genval
    // check if in the same predecessor subtree
    let bitDistance = 0;
    if (departedGenValue.length !== 1){
      let departedPredecessor = departedGenValue.slice(0,departedGenValue.length-1);
      if(this.isPredecessor(myGenValue, departedPredecessor)){ //filters to only the neighbors from the same predecessor subtree
        bitDistance = this.checkBitDistance(departedGenValue, myGenValue)

      }else{
        return false;
      }
    }else{
      bitDistance = this.checkBitDistance(departedGenValue, myGenValue);
    }
    
    if(bitDistance === 1){
    console.log('\tDEBUG: \t\tbitDistance = 1');
      console.log('\tDEBUG: \tTAKEOVER NODE: ' + myGenValue);
      return true;
    }else{
      return false;
    }
  }
  
  checkBitDistance(neighborGenVal, myGenValue){
    let tempDeparted = neighborGenVal;
    let tempGenValue = myGenValue;
    let bitDistance = 0;
    console.log('\tDEBUG: \tcheckBitDistance() running');
    // console.log('\tDEBUG: \tneighborGenVal ' + neighborGenVal + ' ' + neighborGenVal.length + '\t myGenValue ' + myGenValue + ' ' + myGenValue.length);
    
    if(myGenValue.length>neighborGenVal.length){
      while(tempDeparted.length !== myGenValue.length){
        tempDeparted = tempDeparted + "0";
      }
    }else{
      while(tempGenValue.length !== neighborGenVal.length){
        tempGenValue = tempGenValue + "0";
      }
    }
    // console.log('\tDEBUG: \tDone adding zero bits.');
    // console.log('\tDEBUG: \ttempDeparted ' + tempDeparted + '\ttempGenValue ' + tempGenValue);

    //check if one bitwise distance away
    for(let i = 0;i<tempDeparted.length;i++){ // changed condition from myGenValue to 
      if(tempDeparted[i] !== tempGenValue[i]){
        bitDistance++;
      }
    }
    // console.log('\tDEBUG: \tBitdistance ' + bitDistance);
    
    return bitDistance;
  }
  
  regionAdapter(region){
    let zone = region[0][0] + ',' + region[0][1] + ',' + region[1][0] + ',' + region[1][1];
    return zone; // from [[int],[int]] to [string]
  }

  checkNeighbor(){ // FOR DEBUGGING
    this.neighbors.forEach((item) =>{
      console.log('\tNEIGHBOR:\t!-----:' + Object.values(item) + ':----!');
    });
  }

  checkOutConns(){ // FOR DEBUGGING
    this.outConns.forEach((conn) =>{
      console.log('\tOUTCONN:\t!-----:' + conn.peer + ':----!');
    });
  }

  confirmNeighbor(peerId, siteId){
    // console.log('\tDEBUG:\tADDED TO OUTCONNS: ' + peerId);
    const conn = this.peer.connect(peerId);
    let existing = this.outConns.find(conn => peerId === conn.peer);
    if(!existing){
      this.addToOutConns(conn);
      this.controller.addToNetwork(peerId, siteId);
    }
  }

  appendNeighbor(peerId, siteId, newPeerZone, genValue){
    let existing = this.neighbors.find(conn => peerId === conn.peerId);
    if(!existing){
      this.neighbors.push({
        peerId: peerId,
        siteId: siteId,
        region: newPeerZone,
        genValue: genValue,
        timer: null,
      });
    }
    // console.log('\tDEBUG:\tAPPENDNEIGHBOR() SUCCESS');
    this.checkNeighbor();
  }
  
  // Passes connRequest of connecting peer to neighbors of original peer
  // peerId: of connecting peer
  // called by orig peer
  connectPeers(peerId, siteId, newPeerZone, genValue){
    // console.log('\tDEBUG:\t Passing neighbors from ' + this.peer.id + ' to ' + peerId);
    
    const origNeighbors = this.outConns.filter(conn => conn.peer !== peerId); // will make a new list, not containing the connecting peer

    const forwardData = JSON.stringify({
      type: 'addNeighbor',
      peerId: peerId,
      siteId: siteId,
      region: newPeerZone,
      genValue: genValue,
    });

    origNeighbors.forEach((item) =>{
      // console.log('\tDEBUG:\tCONNECTED LIST: ' + item.peer);
    });
    if(origNeighbors.length !== 0){
      this.neighbors.forEach((neighbor) => { //for each neighbor of original zone,
        const connNeighbor =  origNeighbors.find(conn => conn.peer === neighbor.peerId); // neighbor conn object
        if(connNeighbor){
          // console.log('\tDEBUG:\tCONNECTING PEER: ' + peerId);
          // console.log('\tDEBUG:\tNEIGHBOR PEER: ' + neighbor.peerId);
          if(this.isNeighbor(neighbor.region, newPeerZone)){
            if (connNeighbor.open) {
              // console.log('\tDEBUG:\tCONNEIGHBOR OPEN');
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
    console.log('\tDEBUG:\tRUNNING UPDATE REQUEST');
    const origNeighbors = this.outConns.filter(conn => conn.peer !== peerId); // will make a new list, not containing peer defined by peerId

    if(origNeighbors.length !== 0){
      console.log('\tDEBUG:\tORIGNEIGHBORS NOT EMPTY: ' + origNeighbors.length);
    }else{
      console.log('\tDEBUG:\tORIGNEIGHBORS EMPTY: ' + origNeighbors.length);
    }
    
    if(origNeighbors.length !== 0){
      const request = JSON.stringify({
        type: 'askUpdateNeighbor',
        peerId: this.peer.id,
        siteId: this.controller.siteId,
        region: this.region,
        genValue: this.genValue,
      });    
    
      origNeighbors.forEach((neighbor) => {
        if (neighbor.open) {
          console.log('\tDEBUG:\tSENT to:' + neighbor.peer);
          neighbor.send(request);
        } else {
          neighbor.on('open', () => {
            neighbor.send(request);
          });
        } 
      });
    }
  }

  replyRequest(peerId, siteId, region, genValue){ //deets of peer requesting update
    console.log('\tDEBUG:\tREQUEST RECEIVED from:' + peerId);
    const replyConn = this.outConns.find(conn => conn.peer === peerId);
    const reply = JSON.stringify({
      type: 'doUpdateNeighbor',
      peerId: this.peer.id,
      siteId: this.controller.siteId,
      region: this.region,
      genValue: this.genValue
    });
    
    if (replyConn.open) {
        // console.log('\tDEBUG:\tREPLY SENT');
        replyConn.send(reply);
    } else {
        replyConn.on('open', () => {
          replyConn.send(reply);
      });
    }
    this.updateNeighbor(peerId, siteId, region, genValue);
  }

    // updates zone info or removes neighbor from current neighbor list
  updateNeighbor(peerId, siteId, region, genValue){ 
    // console.log('\tDEBUG:\tREPLY RECEIVED');
    // updates regions of all current neighbors in list
    let remove = null;
    
    //removes regions that do not pass isNeighbor()
    this.neighbors.forEach((neighbor) => {
      if(peerId === neighbor.peerId){
        if(this.isNeighbor(this.region, region)){
          neighbor.region = region;
          neighbor.genValue = genValue;
          remove = false;
        }else{
          remove = true;
        }
      }
      if(remove){
        console.log('\tDEBUG: \t !----------!REMOVE TRUE!-----------!');
        clearTimeout(neighbor.timer);
        this.neighbors = this.neighbors.filter(neighbor => peerId !== neighbor.peerId);
        this.inConns = this.inConns.filter(conn => conn.peer !== peerId);
        this.outConns = this.outConns.filter(conn => conn.peer !== peerId);
        //this.removeNeighbor(neighbor.peerId);

      } 
      
      return remove;
    });
    // console.log('\tDEBUG:\tUPDATE SUCCESS');
    this.checkNeighbor();
    this.checkOutConns();
  }

  isIntersecting(myZone, PeerZone){
    console.log('\tDEBUG:\tisIntersecting() running');
    let intersections = this.getIntersections(PeerZone, myZone);
    console.log('\tDEBUG:\tIntersections: ' + intersections);
    let [xint, yint] = intersections;

    if((xint === 0) || (yint === 0)){
      console.log('\tDEBUG:\tNOT INTERSECTING ' + xint + " " + yint);
      return false;
    }else{
      console.log('\tDEBUG:\tINTERSECTING ' + xint + " " + yint);
      return true;
    }

  }

  isNeighbor(neighborZone, newPeerZone) {
    let intersections = this.getIntersections(neighborZone, newPeerZone);
    console.log('\tDEBUG:\tIntersections: ' + intersections);
    let [xint, yint] = intersections;

    if(((xint === 2) && (yint >= 1)) || ((yint === 2) && (xint >= 1))){
        return true;
    }else{
        return false;
    }
  }

  // Checking if two peers are neighbors
  getIntersections(neighborZone, newPeerZone){
    // console.log('\tDEBUG:\tISNEIGHBOR() RUNNING');
    let neighbor = [];
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

    if ((xEnd1 >= xStart2) && (xEnd2 >= xStart1)){ // x-regions overlap
      if ((xEnd1 - xStart2 == 0) || (xEnd2 - xStart1 == 0)){ // only endpoints of x overlap
        // xintersect = 1;
        if ((yEnd1 >= yStart2) && (yEnd2 >= yStart1)){ //y-regions overlap
            if ((yEnd1 - yStart2 == 0) || (yEnd2 - yStart1 == 0)){ // only endpoints of y overlap
                //yintersect = 1;
                neighbor = [1,1]; //false
            }else{
                //yintersect = 2;
                neighbor = [1,2]; // true
            }
        }else{
            if((yEnd1%10 == 0) && (yStart2%10 == 0) || (yEnd2%10 == 0) && (yStart1%10 == 0)){// wrapping y
                //yintersect = 1
                neighbor = [1,1]; // true
            }else{
                //yintersect = 0;
                neighbor = [1,0]; //false
            }
        }
      }else{
        // xintersect = 2;
        if ((yEnd1 >= yStart2) && (yEnd2 >= yStart1)){ //y-regions overlap
            if ((yEnd1 - yStart2 == 0) || (yEnd2 - yStart1 == 0)){ // only endpoints of y overlap
                //yintersect = 1;
                neighbor = [2,1]; //false
            }else{
                //yintersect = 2;
                neighbor = [2,2]; // true
            }
        }else{
            if((yEnd1%10 == 0) && (yStart2%10 == 0) || (yEnd2%10 == 0) && (yStart1%10 == 0)){// wrapping y
                //yintersect = 1
                neighbor = [2,1]; // true
            }else{
                //yintersect = 0;
                neighbor = [2,0]; //false
            }
        }
      }
    }else{
      if((xEnd1%10 == 0) && (xStart2%10 == 0) || (xEnd2%10 == 0) && (xStart1%10 == 0)){ // wrapping x
          //xintersect = 1;
          if ((yEnd1 >= yStart2) && (yEnd2 >= yStart1)){ //y-regions overlap
            if ((yEnd1 - yStart2 == 0) || (yEnd2 - yStart1 == 0)){ // only endpoints of y overlap
                //yintersect = 1;
                neighbor = [1,1]; //false
            }else{
                //yintersect = 2;
                neighbor = [1,2]; // true
            }
        }else{
            if((yEnd1%10 == 0) && (yStart2%10 == 0) || (yEnd2%10 == 0) && (yStart1%10 == 0)){// wrapping y
                //yintersect = 1
                neighbor = [1,1]; // true
            }else{
                //yintersect = 0;
                neighbor = [1,0]; //false
            }
        }
      }else{
          //xintersect = 0;
          if ((yEnd1 >= yStart2) && (yEnd2 >= yStart1)){ //y-regions overlap
            if ((yEnd1 - yStart2 == 0) || (yEnd2 - yStart1 == 0)){ // only endpoints of y overlap
                //yintersect = 1;
                neighbor = [0,1]; //false
            }else{
                //yintersect = 2;
                neighbor = [0,2]; // true
            }
        }else{
            if((yEnd1%10 == 0) && (yStart2%10 == 0) || (yEnd2%10 == 0) && (yStart1%10 == 0)){// wrapping y
                //yintersect = 1
                neighbor = [0,1]; // true
            }else{
                //yintersect = 0;
                neighbor = [0,0]; //false
            }
        }
      }
    }
    console.log('\tDEBUG:\tgetIntersections() = ' + neighbor);
    return neighbor;
  }

  // Neighbor of original peer accepts connecting peer as neighbor
  // peerId: peerId of connecting peer
  // newPeerZone: 
  acceptNeighbor(peerId, siteId, newPeerZone, genValue) {
    console.log("\tDEBUG:\t=====ACCEPT NEIGHBOR RUNNING ======");
    console.log("\tDEBUG:\tCONNECTING PEER:" + peerId + "," + siteId + "," + newPeerZone);
    const connBack = this.peer.connect(peerId);
    if(connBack){
      // console.log("\tDEBUG:\tPEER CONNECTED");
      this.appendNeighbor(peerId, siteId, newPeerZone, genValue);
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
      genValue: this.genValue 
    });
    
    if (connBack.open) {
      connBack.send(initialData);
      // console.log("\tDEBUG:\tSENT");
    } else {
      connBack.on('open', () => {
        connBack.send(initialData);
        // console.log("\tDEBUG:\tSENT");
      });
    }
  }

  zoneTake(zoneOffer, genValue) { //split zone by new peer
    this.region = zoneOffer;
    //this.refPoint = [Math.floor((Math.random()*(this.region[0][1]-this.region[0][0]))+this.region[0][0]), Math.floor((Math.random()*(this.region[1][1]-this.region[1][0]))+this.region[1][0])];

    // this.genValue = 2*(Gen)+1;
    
    this.genValue = genValue.slice(0,genValue.length-1) + "0";
    
    console.log('\tDEBUG:\tZONE of Connecting Peer: ' + this.region);
    console.log('\tDEBUG:\tGENVAL of Connecting Peer: ' + this.genValue);

  }

  // called by Original peer
  zoneShare() {
    // console.log('\tDEBUG:\tTHIS.REGION: ' + this.region + ' ' + typeof this.region);
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
    this.ps = this.periodicSend();
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

  // Every node pings neighbor to see if alive
  periodicSend(){
    let timeoutId = 0;

    const areYouAlive = () => {
      timeoutId = setTimeout(areYouAlive, 10000);

      this.neighbors.forEach((neighbor)=>{
        let connNeighbor = this.outConns.find(conn => conn.peer === neighbor.peerId);
        if(!connNeighbor){
          console.log("\tDEBUG: \t !--CONNECTION TO NEIGHBOR NOT FOUND---!");
        }
        else{
          //console.log("\tDEBUG: \t !--CONNECTION TO NEIGHBOR---!" + connNeighbor.peer);
          // Ping neighbor to see if alive
          connNeighbor.send(JSON.stringify({
            type: 'heartbeat',
            peerId: this.peer.id,
            siteId: this.controller.siteId,
          }));
        }
      });
      // console.log("!---end of neighbor connections---!");

    };

    areYouAlive();

    return {
      start : function () {
        if ( timeoutId === 0 ) { areYouAlive(); }
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
      // this.neighbors.forEach((neighbor) => {
      //   const connection =  neighbors.find(conn => conn.peer === neighbor.peerId)
      //   connection.send(JSON.stringify({
      //     type: 'disconnect message',
      //     string: 'A PEER HAS DISCONNECTED'
      // }))
      // });

      this.controller.lostConnection();
    });
  }

  requestConnection(target, peerId, siteId) {
    const conn = this.peer.connect(target);
    //this.addToOutConns(conn);
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
    // console.log('\tDEBUG:\t Initial Biggest: ' + Object.values(biggestNeighbor));
    this.neighbors.forEach((neighbor) =>{
      if(this.getSize(neighbor.region) > this.getSize(biggestNeighbor.region)){
        // console.log('\tDEBUG:\t size of peer 1: ' + this.getSize(biggestNeighbor.region));
        // console.log('\tDEBUG:\t size of peer 2: ' + this.getSize(neighbor.region));
        biggestNeighbor.peerId = neighbor.peerId;
        biggestNeighbor.siteId = neighbor.siteId;
        biggestNeighbor.region = neighbor.region;
        // console.log('\tDEBUG:\t biggestNeighbor: ' + this.getSize(biggestNeighbor.region));
      }
    });

    const connection = this.outConns.find(conn => conn.peer === biggestNeighbor.peerId);
  
    // console.log('\tDEBUG:\t control size: ' + this.getSize(this.region));

    if(this.getSize(biggestNeighbor.region) > this.getSize(this.region)){
      // console.log('\tDEBUG:\t FORWARDED');
      connection.send(JSON.stringify({
        type: 'connRequest',
        peerId: peerId,
        siteId: siteId,
      }));
    }else{
      // console.log('\tDEBUG:\t ACCEPTED');
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
      genValue: this.genValue+"1",
    });

    if (connBack.open) {
      connBack.send(initialData);
    } else {
      connBack.on('open', () => {
        connBack.send(initialData);
      });
    }

    this.appendNeighbor(peerId, siteId, zoneOffer[0], this.genValue+"0"); // zoneOffer[0] -> zone of connecting peer
    this.connectPeers(peerId, siteId, zoneOffer[0], this.genValue+"0");
    this.genValue = this.genValue + "1";

    console.log('\tDEBUG:\ NEW GENVAL of Original Peer: ' + this.genValue);
    console.log('\tDEBUG:\ ZONE of Original Peer: ' + this.region);
    this.updateRequest(peerId);
  }

  onConnection(connection) {
    this.controller.updateRootUrl(connection.peer);
    this.addToInConns(connection);
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
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
          // console.log('\tDEBUG:\tREQUEST RECEIVED from:' + dataObj.peerId); // adds neighbor
          this.replyRequest(dataObj.peerId, dataObj.siteId, dataObj.region, dataObj.genValue); // adds 
          break;
        case 'doUpdateNeighbor': // adds neighbor
        // console.log('\tDEBUG:\tGO RECEIVED from:' + dataObj.peerId);
          let connection = this.outConns.find((conn) => conn.peer === dataObj.peerId);
          let remove = this.updateNeighbor(dataObj.peerId, dataObj.siteId, dataObj.region, dataObj.genValue); // adds 
          if(connection && remove){
            connection.close();
          }
          break;
        case 'addNeighbor': // adds neighbor
          this.acceptNeighbor(dataObj.peerId, dataObj.siteId, dataObj.region, dataObj.genValue); // adds 
          break;
        case 'syncNeighbor': // new syncResponse for neighbor adding
          console.log('\tDEBUG:\tSYNCNEIGHBOR from:' + dataObj.peerId);
          this.confirmNeighbor(dataObj.peerId, dataObj.siteId); 
          this.appendNeighbor(dataObj.peerId, dataObj.siteId, dataObj.peerZone, dataObj.genValue);
          this.processOutgoingBuffer(dataObj.peerId);
          break;
        case 'syncResponse':
          this.processOutgoingBuffer(dataObj.peerId);
          this.confirmNeighbor(dataObj.peerId, dataObj.siteId);
          this.controller.handleSync(dataObj);
          this.zoneTake(dataObj.zoneOffer,dataObj.genValue);
          this.appendNeighbor(dataObj.peerId, dataObj.siteId, dataObj.peerZone, dataObj.genValue);
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
        case 'heartbeat':
          this.refreshTimer(dataObj.peerId);
          break;
        case 'findTakeOver':
          console.log('\tDEBUG: \t findTakeOver received');
          this.findTakeOver(dataObj.departedGenValue,dataObj.departedRegion,dataObj.peerId,dataObj.siteId,dataObj.region,dataObj.genValue,dataObj.visited);
          break;
        case 'takeOver':
          console.log('\tDEBUG: \t takeOver received');
          this.delay(20000);
          this.zoneMerge(dataObj.region, dataObj.departedPredecessor);
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
      // this.removeFromConnections(connection.peer);
      console.log("!-------------------A NODE HAS DISCONNECTED-----------------!");
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
