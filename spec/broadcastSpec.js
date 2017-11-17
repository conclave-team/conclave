import Broadcast from '../lib/broadcast';
import UUID from 'uuid/v1';

fdescribe('Broadcast', () => {
  const mockController = {
    siteId: UUID(),
    peer: {
      on: function() {},
      connect: function(id) { return { on: function() {} } }
    },
    addToNetwork: function() {},
    removeFromNetwork: function() {}
  };

  const targetId = UUID();

  describe('constructor', () => {
    const broadcast = new Broadcast(12345);

    it('creates a peer placeholder', () => {
      expect(broadcast.peer).toBeNull();
    });

    it('creates an incoming connections array', () => {
      expect(broadcast.inConns).toBeTruthy();
    });

    it('creates an outgoing connections array', () => {
      expect(broadcast.outConns).toBeTruthy();
    });

    it('creates an outgoing buffer array', () => {
      expect(broadcast.outgoingBuffer).toBeTruthy();
    });
  });

  describe('send', () => {
    const broadcast = new Broadcast(12345);

    it('calls forEach on the outgoing connections array', () => {
      spyOn(broadcast.outConns, 'forEach');
      broadcast.send([]);
      expect(broadcast.outConns.forEach).toHaveBeenCalled();
    });

    it('adds the operation to the outgoing buffer if it is an insertion', () => {
      spyOn(broadcast, 'addToOutgoingBuffer');
      broadcast.send({type: 'insert'});
      expect(broadcast.addToOutgoingBuffer).toHaveBeenCalled();
    });

    it('adds the operation to the outgoing buffer if it is a deletion', () => {
      spyOn(broadcast, 'addToOutgoingBuffer');
      broadcast.send({type: 'delete'});
      expect(broadcast.addToOutgoingBuffer).toHaveBeenCalled();
    });

    it('does not add the operation to the outgoing buffer otherwise', () => {
      spyOn(broadcast, 'addToOutgoingBuffer');
      broadcast.send({type: 'add to network'});
      expect(broadcast.addToOutgoingBuffer).not.toHaveBeenCalled();
    });
  });

  describe('addToOutgoingBuffer', () => {
    const bc = new Broadcast(12345);
    bc.outgoingBuffer = [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0, 1, 2, 3, 4,
      5, 6, 7, 8, 9, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9
    ];
    bc.addToOutgoingBuffer(5);

    it('removes the first item in the buffer if it is full', () => {
      expect(bc.outgoingBuffer[0]).toEqual(1);
    });

    it('adds the operation to the end of the buffer', () => {
      expect(bc.outgoingBuffer[bc.outgoingBuffer.length-1]).toEqual(5);
    });
  });

  describe('processOutgoingBuffer', () => {
    const bc = new Broadcast(12345);
    bc.outConns = [{peer: 6, send: function() {}}]
    bc.outgoingBuffer = [1, 2, 3, 4, 5];

    it('sends every operation in the outgoing buffer to the connection', () => {
      spyOn(bc.outConns[0], 'send');
      bc.processOutgoingBuffer(6);
      expect(bc.outConns[0].send.calls.count()).toEqual(5);
    });
  });

  describe('bindServerEvents', () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;

    it("set this.peer to the peer passed in from the controller", () => {
      expect(broadcast.peer).toBeNull();
      broadcast.bindServerEvents(targetId, mockController.peer);
      expect(broadcast.peer).toEqual(mockController.peer);
    });

    it("calls onOpen with the targetId passed in", () => {
      spyOn(broadcast, "onOpen");
      broadcast.bindServerEvents(targetId, mockController.peer);
      expect(broadcast.onOpen).toHaveBeenCalledWith(targetId);
    });
  });

  describe('onOpen', () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;

    it('calls "on" on the peer property', () => {
      spyOn(broadcast.peer, 'on');
      broadcast.onOpen();
      expect(broadcast.peer.on).toHaveBeenCalled();
    });
  });

  describe('connectToTarget', () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;

    it('does not call "connect" on peer or "addToConnectionList" on controller when peerId "0"', () => {
      spyOn(broadcast.peer, 'connect');
      spyOn(broadcast, 'addToConnections');
      broadcast.connectToTarget('0');
      expect(broadcast.peer.connect).not.toHaveBeenCalled();
      expect(broadcast.addToConnections).not.toHaveBeenCalled();
    });

    // it('does call "connect" on peer when peerId not "0"', () => {
    //   spyOn(broadcast.peer, 'connect');
    //   broadcast.connectToTarget("78vjkhjkasdf7");
    //   expect(broadcast.peer.connect).toHaveBeenCalled();
    // });
  });

  describe("addToConnections", () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;
    const conn = {
      peer: "somebody"
    };

    it("adds the connection to this list and calls addToNetwork with connection.peer", () => {
      spyOn(broadcast.controller, "addToNetwork");
      broadcast.addToConnections(conn);
      expect(broadcast.connections.length).toEqual(1);
    });

    it("doesn't call either of the functions if the connection is already in the list", () => {
      spyOn(broadcast.controller, "addToNetwork");
      broadcast.addToConnections(conn);
      expect(broadcast.connections.length).toEqual(1);
      expect(broadcast.controller.addToNetwork).not.toHaveBeenCalled();
    });
  });

  describe("addToNetwork", () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;

    it("calls send with type 'add to network' and newPeer of id passed in", () => {
      spyOn(broadcast, "send");
      broadcast.addToNetwork(5, '10');
      expect(broadcast.send).toHaveBeenCalledWith({type:'add to network',newPeer:5, newSite: '10'});
    });
  });

  describe("removeFromNetwork", () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;

    it("calls send with type 'remove to network' and oldPeer of id passed in", () => {
      spyOn(broadcast, "send");
      broadcast.removeFromNetwork(5, '10');
      expect(broadcast.send).toHaveBeenCalledWith({type:'remove from network', oldPeer:5, oldSite: '10'});
    });
  });

  describe("removeFromConnections", () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;
    const conn = {
      peer: "somebody"
    };

    beforeEach(() => {
      broadcast.connections.push(conn);
    });

    it("removes the connection from this.connections", () => {
      broadcast.removeFromConnections(conn.peer);
      expect(broadcast.connections.length).toEqual(0);
    });

    it("calls controller.removeFromNetwork with connection.peer", () => {
      spyOn(broadcast.controller, "removeFromNetwork");
      broadcast.removeFromConnections(conn.peer);
      expect(broadcast.controller.removeFromNetwork).toHaveBeenCalledWith("somebody");
    })
  });

  describe("isAlreadyConnected", () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;
    const conn = {
      peer: "somebody"
    };
    const otherConn = {
      peer: "someone"
    };
    broadcast.connections.push(conn);

    it("returns true if the connection is already in this.connections", () => {
      const rVal = broadcast.isAlreadyConnected(conn);
      expect(rVal).toBe(true);
    });

    it("returns false if the connection is not in this.connections", () => {
      const rVal = broadcast.isAlreadyConnected(otherConn);
      expect(rVal).toBe(false);
    });
  });

  describe("onPeerConnection", () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;

    it("calls 'on' on this.peer", () => {
      spyOn(broadcast.peer, "on");
      broadcast.onPeerConnection();
      expect(broadcast.peer.on).toHaveBeenCalled();
    });
  });

  describe('onConnection', () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;
    const conn = {
      peer: "somebody",
      on: function() {}
    };

    it('calls "on" on the connection passed in', () => {
      spyOn(conn, 'on');
      broadcast.onConnection(conn);
      expect(conn.on).toHaveBeenCalled();
    });
  });

  describe('onData', () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;
    const conn = {
      peer: "somebody",
      on: function() {}
    };

    it('calls "on" on the connection passed in', () => {
      spyOn(conn, 'on');
      broadcast.onData(conn);
      expect(conn.on).toHaveBeenCalled();
    });
  });

  describe('onConnClose', () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;
    const conn = {
      peer: "somebody",
      on: function() {}
    };

    it('calls "on" on the connection passed in', () => {
      spyOn(conn, 'on');
      broadcast.onConnClose(conn);
      expect(conn.on).toHaveBeenCalled();
    });
  });
});
