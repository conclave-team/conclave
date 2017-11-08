import Broadcast from '../lib/broadcast';
import UUID from 'uuid/v1';

describe('Broadcast', () => {
  const mockController = {
    siteId: UUID(),
    peerId: '0',
    peer: {
      on: () => {},
      connect: () => {}
    },
    addToConnectionList: () => {}
  };

  describe('constructor', () => {
    const broadcast = new Broadcast(12345);

    it('creates a peer placeholder', () => {
      expect(broadcast.peer).toBeNull();
    });

    it('creates a connections array', () => {
      expect(broadcast.connections).toBeTruthy();
    });
  });

  describe('send', () => {
    const broadcast = new Broadcast(12345);

    it('calls forEach on the connections array', () => {
      spyOn(broadcast.connections, 'forEach');
      broadcast.send([]);
      expect(broadcast.connections.forEach).toHaveBeenCalled();
    });
  });

  describe('bindServerEvents', () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;

    it("calls onOpen", () => {
      spyOn(broadcast, "onOpen");
      broadcast.bindServerEvents();
      expect(broadcast.onOpen).toHaveBeenCalled();
    });

    it("calls onConnection", () => {
      spyOn(broadcast, "onConnection");
      broadcast.bindServerEvents();
      expect(broadcast.onConnection).toHaveBeenCalled();
    });
  });

  describe('connectToTarget', () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;

    it('does not call "connect" on peer or "addToConnectionList" on controller when peerId "0"', () => {
      spyOn(broadcast.peer, 'connect');
      spyOn(broadcast.controller, 'addToConnectionList');
      broadcast.connectToTarget('0');
      expect(broadcast.peer.connect).not.toHaveBeenCalled();
      expect(broadcast.controller.addToConnectionList).not.toHaveBeenCalled();
    });

    it('does call "connect" on peer or "addToConnectionList" on controller when peerId not "0"', () => {
      spyOn(broadcast.peer, 'connect');
      spyOn(broadcast.controller, 'addToConnectionList');
      broadcast.connectToTarget("78vjkhjkasdf7");
      expect(broadcast.peer.connect).toHaveBeenCalled();
      expect(broadcast.controller.addToConnectionList).toHaveBeenCalled();
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

  describe('onConnection', () => {
    const broadcast = new Broadcast(12345);
    broadcast.controller = mockController;
    broadcast.peer = mockController.peer;
    it('calls "on" on the peer property', () => {
      spyOn(broadcast.peer, 'on');
      broadcast.onConnection();
      expect(broadcast.peer.on).toHaveBeenCalled();
    });
  });
});
