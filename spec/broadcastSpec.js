import Broadcast from '../lib/broadcast';
import UUID from 'uuid/v1';
import { JSDOM } from 'jsdom';

describe('Broadcast', () => {
  const mockController = {
    siteId: UUID(),
    peer: {
      id: 55,
      on: function() {},
      connect: function(id) { return { open: false, id: id, on: function() {} } },
      call: function() {}
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

  describe('onError', () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;

    it('calls "on" on the peer property', () => {
      spyOn(broadcast.peer, 'on');
      broadcast.onError();
      expect(broadcast.peer.on).toHaveBeenCalled();
    });
  });

  describe('requestConnection', () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;
    broadcast.isAlreadyConnectedOut = function() {};

    // it('connects the peer to the target', () => {
    //   spyOn(broadcast.peer, 'connect');
    //   broadcast.requestConnection(12);
    //   expect(broadcast.peer.connect).toHaveBeenCalled();
    // });

    it('calls add the connection to the outgoing connections', () => {
      spyOn(broadcast, 'addToOutConns');
      broadcast.requestConnection(13);
      expect(broadcast.addToOutConns).toHaveBeenCalled();
    });
  });

  describe('redistribute', () => {
    it('calls syncTo with the peerId and siteId if less than 5 connections', () => {
      const bc = new Broadcast(12345);
      bc.controller = mockController;
      bc.controller.network = [1, 2, 3, 4, 5];
      bc.inConns = [1, 2, 3, 4];
      bc.outConns = [1, 2, 3, 4];
      spyOn(bc, 'syncTo');
      bc.redistribute(1, 2);
      expect(bc.syncTo).toHaveBeenCalledWith(1, 2);
    });

    it('calls forward message with the peerId and siteId if too many incoming connections', () => {
      const bc = new Broadcast(12345);
      bc.controller = mockController;
      bc.controller.network = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      bc.inConns = [1, 2, 3, 4, 5, 6];
      bc.outConns = [1, 2, 3, 4];
      spyOn(bc, 'forwardMessage');
      bc.redistribute(1, 2);
      expect(bc.forwardMessage).toHaveBeenCalledWith(1, 2);
    });

    it('calls forward message with the peerId and siteId if too many outgoing connections', () => {
      const bc = new Broadcast(12345);
      bc.controller = mockController;
      bc.controller.network = [1, 2, 3, 4, 5, 6, 7, 8, 9];
      bc.inConns = [1, 2, 3, 4];
      bc.outConns = [1, 2, 3, 4, 5, 6];
      spyOn(bc, 'forwardMessage');
      bc.redistribute(1, 2);
      expect(bc.forwardMessage).toHaveBeenCalledWith(1, 2);
    });

    it('calls syncTo with the peerId and siteId otherwise', () => {
      const bc = new Broadcast(12345);
      bc.controller = mockController;
      bc.controller.network = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      bc.inConns = [1, 2, 3, 4, 5];
      bc.outConns = [1, 2, 3, 4, 5];
      spyOn(bc, 'syncTo');
      bc.redistribute(1, 2);
      expect(bc.syncTo).toHaveBeenCalledWith(1, 2);
    });
  });

  describe('forwardMessage', () => {
    const bc = new Broadcast(123);
    bc.outConns = [{peer: 6, send: function() {}}];

    it('calls send on one of its outgoing connections', () => {
      spyOn(bc.outConns[0], 'send');
      bc.forwardMessage(1, 2);
      expect(bc.outConns[0].send).toHaveBeenCalled();
    });
  });

  describe('addToOutConns', () => {
    const bc = new Broadcast(123);

    it('pushes the connection into the outgoing connections if not already there', () => {
      bc.isAlreadyConnectedOut = function(conn) {return false}
      bc.addToOutConns(5);
      expect(bc.outConns).toContain(5);
    });

    it('does not push the connection into the list if it is already there', () => {
      bc.isAlreadyConnectedOut = function(conn) {return true}
      bc.addToOutConns(6);
      expect(bc.outConns).not.toContain(6);
    });
  });

  describe('addToInConns', () => {
    const bc = new Broadcast(123);

    it('pushes the connection into the incoming connections if not already there', () => {
      bc.isAlreadyConnectedIn = function(conn) {return false}
      bc.addToInConns(5);
      expect(bc.inConns).toContain(5);
    });

    it('does not push the connection into the list if it is already there', () => {
      bc.isAlreadyConnectedIn = function(conn) {return true}
      bc.addToInConns(6);
      expect(bc.inConns).not.toContain(6);
    });
  });

  describe("addToNetwork", () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;

    it("calls send with type 'add to network' and newPeer and siteId passed in", () => {
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
      broadcast.removeFromNetwork(5);
      expect(broadcast.send).toHaveBeenCalledWith({type:'remove from network', oldPeer:5});
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
      broadcast.inConns.push(conn);
      broadcast.outConns.push(conn);
    });

    it("removes the connection from incoming connections", () => {
      broadcast.removeFromConnections(conn.peer);
      expect(broadcast.inConns.length).toEqual(0);
    });

    it("removes the connection from outgoing connections", () => {
      broadcast.removeFromConnections(conn.peer);
      expect(broadcast.outConns.length).toEqual(0);
    });

    it("calls removeFromNetwork with connection.peer", () => {
      spyOn(broadcast, "removeFromNetwork");
      broadcast.removeFromConnections(conn.peer);
      expect(broadcast.removeFromNetwork).toHaveBeenCalledWith("somebody");
    });
  });

  describe("isAlreadyConnectedOut", () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;
    const conn = {
      peer: "somebody"
    };
    const otherConn = {
      peer: "someone"
    };
    broadcast.outConns.push(conn);

    it("returns true if the connection is already in this.outConns", () => {
      const rVal = broadcast.isAlreadyConnectedOut(conn);
      expect(rVal).toBe(true);
    });

    it("returns false if the connection is not in this.outConns", () => {
      const rVal = broadcast.isAlreadyConnectedOut(otherConn);
      expect(rVal).toBe(false);
    });
  });

  describe("isAlreadyConnectedIn", () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;
    const conn = {
      peer: "somebody"
    };
    const otherConn = {
      peer: "someone"
    };
    broadcast.inConns.push(conn);

    it("returns true if the connection is already in this.inConns", () => {
      const rVal = broadcast.isAlreadyConnectedIn(conn);
      expect(rVal).toBe(true);
    });

    it("returns false if the connection is not in this.inConns", () => {
      const rVal = broadcast.isAlreadyConnectedIn(otherConn);
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

  describe('syncTo', () => {
    const bc = new Broadcast(123);
    bc.controller = mockController;
    bc.peer = mockController.peer;
    bc.controller.crdt = { struct: [] };
    bc.controller.vector = { versions: []};
    bc.isAlreadyConnectedOut = function() {};

    // it('calls connect with the peerId passed in on this.peer', () => {
    //   spyOn(bc.peer, 'connect');
    //   bc.syncTo(1, 2);
    //   expect(bc.peer.connect).toHaveBeenCalledWith(1);
    // });

    it('calls addToOutConns', () => {
      spyOn(bc, 'addToOutConns');
      bc.syncTo(1, 2);
      expect(bc.addToOutConns).toHaveBeenCalled();
    });

    it('calls controller addToNetwork with the peerId and siteId passed in', () => {
      spyOn(bc.controller, 'addToNetwork');
      bc.syncTo(1, 2);
      expect(bc.controller.addToNetwork).toHaveBeenCalledWith(1, 2);
    });
  });

  describe('videoCall', () => {
    const bc = new Broadcast(123);
    bc.controller = mockController;
    bc.peer = mockController.peer;

    // it('calls the call method on this.peer with the id and ms passed in', () => {
    //   spyOn(bc.peer, 'call');
    //   bc.videoCall('id', 'ms', 'color');
    //   expect(bc.peer.call).toHaveBeenCalledWith('id', 'ms');
    // });

    it('calls onStream', () => {
      spyOn(bc, 'onStream');
      bc.videoCall('id', 'ms', 'color');
      expect(bc.onStream).toHaveBeenCalled();
    });
  });

  describe('onConnection', () => {
    const broadcast = new Broadcast(12345);

    const conn = {
      peer: "somebody",
      on: function() {}
    };

    it('calls adds the connection to the incoming connections list', () => {
      spyOn(broadcast, 'addToInConns');
      broadcast.onConnection(conn);
      expect(broadcast.addToInConns).toHaveBeenCalledWith(conn);
    });
  });

  describe('onVideoCall', () => {
    const bc = new Broadcast(123);
    bc.controller = mockController;
    bc.peer = mockController.peer;

    it('calls the on method on this.peer', () => {
      spyOn(bc.peer, 'on');
      bc.onVideoCall();
      expect(bc.peer.on).toHaveBeenCalled();
    });
  });

  describe('onStream', () => {
    const bc = new Broadcast(123);
    const obj = { on: function() {} };

    it('calls the on method on the object passed in', () => {
      spyOn(obj, 'on');
      bc.onStream(obj, 'color');
      expect(obj.on).toHaveBeenCalled();
    });
  });

  describe('onStreamClose', () => {
    const bc = new Broadcast(123);
    const vid = {style: { visibility: 'visible' } };
    const dom = new JSDOM(`<!DOCTYPE html><li id="7"><span id="test"></a>`);
    const mockDoc = dom.window.document;

    beforeEach(() => {
      bc.currentStream = {
        localStream: {
          getTracks: function() {return [{stop: function() {}}, {stop: function() {}}]}
        }
      }
    });

    it('sets the visibility property on the vid element passed in to hidden', () => {
      bc.onStreamClose(vid, 7, mockDoc);
      expect(vid.style.visibility).toEqual('hidden');
    });

    it('sets the current stream to null', () => {
      bc.onStreamClose(vid, 7, mockDoc);
      expect(bc.currentStream).toBeNull();
    })

    it('sets the onclick property on the correct peer span', () => {
      bc.onStreamClose(vid, 7, mockDoc);
      expect(mockDoc.getElementById('test').onclick).toBeTruthy();
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

  describe('randomId', () => {
    const bc = new Broadcast(123);
    bc.controller = mockController;
    bc.peer = mockController.peer;

    it('returns a random peer id from incoming connections list', () => {
      bc.inConns = [{peer: 1}, {peer: 2}];
      const rVal = bc.randomId();
      expect(1 <= rVal <= 2).toBeTruthy();
    });

    it('returns false if there are no possible connections', () => {
      bc.inConns = [{peer: 55}];
      expect(bc.randomId()).toBeFalsy();
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
