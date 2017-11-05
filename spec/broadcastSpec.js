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
    updateConnectionList: () => {}
  };

  describe('constructor', () => {
    const broadcast = new Broadcast(mockController);

    it('creates a peer property', () => {
      expect(broadcast.peer).toBeTruthy();
    });

    it('creates a connections array', () => {
      expect(broadcast.connections).toBeTruthy();
    });
  });

  describe('send', () => {
    const broadcast = new Broadcast(mockController);

    it('calls forEach on the connections array', () => {
      spyOn(broadcast.connections, 'forEach');
      broadcast.send([]);
      expect(broadcast.connections.forEach).toHaveBeenCalled();
    });
  });

  describe('onOpen', () => {
    const broadcast = new Broadcast(mockController);

    it('calls "on" on the peer property', () => {
      spyOn(broadcast.peer, 'on');
      broadcast.onOpen();
      expect(broadcast.peer.on).toHaveBeenCalled();
    });

    it('does not call "connect" on peer or "updateConnectionList" on controller when peerId "0"', () => {
      spyOn(broadcast.peer, 'connect');
      spyOn(broadcast.controller, 'updateConnectionList');
      broadcast.onOpen();
      expect(broadcast.peer.connect).not.toHaveBeenCalled();
      expect(broadcast.controller.updateConnectionList).not.toHaveBeenCalled();
    });

    it('does call "connect" on peer or "updateConnectionList" on controller when peerId not "0"', () => {
      broadcast.peerId = "78vjkhjkasdf7";

      spyOn(broadcast.peer, 'connect');
      spyOn(broadcast.controller, 'updateConnectionList');
      broadcast.onOpen();
      expect(broadcast.peer.connect).toHaveBeenCalled();
      expect(broadcast.controller.updateConnectionList).toHaveBeenCalled();

      broadcast.peerId = '0';
    });
  });

  describe('onConnection', () => {
    const broadcast = new Broadcast(mockController);

    it('calls "on" on the peer property', () => {
      spyOn(broadcast.peer, 'on');
      broadcast.onConnection();
      expect(broadcast.peer.on).toHaveBeenCalled();
    });
  });
});
