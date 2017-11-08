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
    const broadcast = new Broadcast(mockController);

    it('creates a peer placeholder', () => {
      expect(broadcast.peer).toBeNull();
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
//this is not called yet
  // describe('onOpen', () => {
  //   const broadcast = new Broadcast(mockController);
  //
  //   it('calls "on" on the peer property', () => {
  //     spyOn(broadcast.peer, 'on');
  //     broadcast.onOpen();
  //     expect(broadcast.peer.on).toHaveBeenCalled();
  //   });
  // });
// this whole method is called later
  // describe('connectToTarget', () => {
  //   const broadcast = new Broadcast(mockController);
  //
  //   it('does not call "connect" on peer or "addToConnectionList" on controller when peerId "0"', () => {
  //     spyOn(broadcast.peer, 'connect');
  //     spyOn(broadcast.controller, 'addToConnectionList');
  //     broadcast.connectToTarget('0');
  //     expect(broadcast.peer.connect).not.toHaveBeenCalled();
  //     expect(broadcast.controller.addToConnectionList).not.toHaveBeenCalled();
  //   });
  //
  //   it('does call "connect" on peer or "addToConnectionList" on controller when peerId not "0"', () => {
  //     spyOn(broadcast.peer, 'connect');
  //     spyOn(broadcast.controller, 'addToConnectionList');
  //     broadcast.connectToTarget("78vjkhjkasdf7");
  //     expect(broadcast.peer.connect).toHaveBeenCalled();
  //     expect(broadcast.controller.addToConnectionList).toHaveBeenCalled();
  //   });
  // });
// this method is called later
  // describe('onConnection', () => {
  //   const broadcast = new Broadcast(mockController);
  //
  //   it('calls "on" on the peer property', () => {
  //     spyOn(broadcast.peer, 'on');
  //     broadcast.onConnection();
  //     expect(broadcast.peer.on).toHaveBeenCalled();
  //   });
  // });
});
