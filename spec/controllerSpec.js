import { JSDOM } from 'jsdom';
import UUID from 'uuid/v1';
import Controller from '../lib/controller';
import Char from '../lib/char';
import Identifier from '../lib/identifier';

describe("Controller", () => {
  const mockPeer = {
    id: 8,
    on: function() {},
    connect: function(id) { return {
      on: function() { return },
      send: function() { return }
    } },
  };

  const mockBroadcast = {
    bindServerEvents: function() {},
    connectToTarget: function() {},
    connectToNewTarget: function() {},
    send: function() {},
    addToNetwork: function() {},
    removeFromNetwork: function() {},
    requestConnection: function() {},
    addToOutConns: function() {},
    inConns: [],
    outConns: []
  };

  const mockEditor = {
    bindChangeEvent: function() {},
    updateView: function(text) {},
    onDownload: function() {},
    replaceText: function() {},
    insertText: function() {},
    deleteText: function() {},
    removeCursor: function() {},
    bindButtons: function() {}
  };

  const host = "https://localhost:3000";
  const siteId = UUID();
  const targetPeerId = UUID();

  describe('attachEvents', () => {
    const mockWin = new JSDOM(`<!DOCTYPE html><p id="peerId"><p class="copy-container"></p><p class='video-modal'></p>`).window;
    const mockDoc = mockWin.document;
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);

    it('calls bindCopyEvent', () => {
      spyOn(controller, 'bindCopyEvent');
      controller.attachEvents(mockDoc, mockWin);
      expect(controller.bindCopyEvent).toHaveBeenCalled();
    });
  });

  describe("updateShareLink", () => {
    let controller, mockDoc, mockWin, link;

    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html>
        <a id="myLink"></a>
        <p id='myLinkInput'></p>
        <p id="peerId"></p>
        <p class="copy-container"></p>
        <p class='video-modal'></p>`).window;
      mockDoc = mockWin.document;
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      link = mockDoc.querySelector("#myLink").textContent;
    });

    it("sets the link input's text content", () => {
      controller.updateShareLink(targetPeerId, mockDoc);
      const updatedLink = mockDoc.querySelector("#myLinkInput").textContent;
      expect(updatedLink).toEqual(host+"?" + targetPeerId);
    });

    it("sets the link's href attribute", () => {
      controller.updateShareLink(targetPeerId, mockDoc);
      const href = mockDoc.querySelector("#myLink").getAttribute('href');
      expect(href).toEqual(host+"?" + targetPeerId);
    });
  });

  describe('updatePageURL', () => {
    const mockWin = new JSDOM(`<!DOCTYPE html><p id="peerId"></p><p class='video-modal'></p><p class="copy-container"></p>`).window;
    mockWin.history.pushState = function(one, two, three) {};
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockWin.document, mockWin);

    it('sets its urlId', () => {
      expect(controller.urlId).toEqual(targetPeerId);
      controller.updatePageURL(12345, mockWin);
      expect(controller.urlId).toEqual(12345);
    });

    it('creates a new URL from the id passed in', () => {
      spyOn(mockWin.history, 'pushState');
      controller.updatePageURL(12345, mockWin);
      expect(mockWin.history.pushState).toHaveBeenCalledWith({}, '', host + '?12345');
    });

    it('redirects the window to the new url', () => {
      spyOn(mockWin.history, 'pushState');
      controller.updatePageURL(12345, mockWin);
      expect(mockWin.history.pushState).toHaveBeenCalled();
    });
  });

  describe('updateRootUrl', () => {
    const mockWin = new JSDOM(`<!DOCTYPE html><p id="peerId"></p><p class='video-modal'></p><p class="copy-container"></p>`).window;
    mockWin.history.pushState = function(one, two, three) {};
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockWin.document, mockWin);

    it('calls updatePageURL with the id passed in if urlId is 0', () => {
      spyOn(controller, 'updatePageURL');
      controller.urlId = 0;
      controller.updateRootUrl(123, mockWin);
      expect(controller.updatePageURL).toHaveBeenCalledWith(123, mockWin);
    });

    it('does not call updatePageURL otherwise', () => {
      spyOn(controller, 'updatePageURL');
      controller.urlId = 12345
      controller.updateRootUrl(123, mockWin);
      expect(controller.updatePageURL).not.toHaveBeenCalled();
    });
  });

  describe('enableEditor', () => {
    const mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p id="peerId"></p><p class='video-modal'></p><p class="copy-container"></p>`).window;
    const mockDoc = mockWin.document;
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockWin.document, mockWin);

    it('removes the hide class from the editor element', () => {
      mockDoc.getElementById('conclave').classList.add('hide');
      controller.enableEditor(mockDoc);
      expect(mockDoc.getElementById('conclave').classList.length).toEqual(0);
    });
  });

  describe("populateCRDT", () => {
    let controller, initialStruct, expectedStruct;
    const mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p id="peerId"></p><p class='video-modal'></p><p class="copy-container"></p>`).window;
    const mockDoc = mockWin.document;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      initialStruct = [[{
        position: [ {digit: 3, siteId: 4} ],
        counter: 1,
        siteId: 5,
        value: "a",
      }]];

      expectedStruct = [[ new Char("a", 1, 5, [new Identifier(3, 4)]) ]];
    });

    it("sets proper value to crdt.struct", () => {
      controller.populateCRDT(initialStruct);
      expect(controller.crdt.struct).toEqual(expectedStruct);
    });

    it("calls editor.replaceText", () => {
      spyOn(controller.editor, 'replaceText');
      controller.populateCRDT(initialStruct);
      expect(controller.editor.replaceText).toHaveBeenCalled();
    });
  });

  describe("populateVersionVector", () => {
    let controller, initialVersions;
    const mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p id="peerId"></p><p class='video-modal'></p><p class="copy-container"></p>`).window;
    const mockDoc = mockWin.document;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);

      initialVersions = [{
          siteId: 2,
          counter: 1,
          exceptions: [6, 7],
        }];
    })

    it("sets counter in the version vector", () => {
      controller.populateVersionVector(initialVersions);
      expect(controller.vector.versions[1].counter).toEqual(1);
    });

    it("sets siteID in the version vector", () => {
      controller.populateVersionVector(initialVersions);
      expect(controller.vector.versions[1].siteId).toEqual(2);
    });

    it("adds exceptions to this local version", () => {
      controller.populateVersionVector(initialVersions);
      expect(controller.vector.versions[1].exceptions.length).toEqual(2);
    });
  });

  describe("addToNetwork", () => {
    const mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p id="peerId"></p><p class='video-modal'></p><p class="copy-container"></p>`).window;
    const mockDoc = mockWin.document;
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
    controller.broadcast.peer = mockPeer;
    controller.network.push({ peerId: "b", siteId: '10' });
    const connList = mockDoc.querySelector("#peerId").textContent;

    it("doesn't do anything if the id is already in the network list", () => {
      spyOn(controller.broadcast, "addToNetwork");
      controller.addToNetwork("b", '10', mockDoc);
      expect(controller.broadcast.addToNetwork).not.toHaveBeenCalled();
    });

    it("pushes the id into the network list", () => {
      controller.addToNetwork("a", '11', mockDoc);
      expect(controller.network).toContain({peerId: "a", siteId: '11'});
    });

    it("calls addToListOfPeers with the id passed in if it is not its own id", () => {
      spyOn(controller, "addToListOfPeers");
      controller.addToNetwork('10', "c", mockDoc);
      expect(controller.addToListOfPeers).toHaveBeenCalledWith("c", '10', mockDoc);
    });

    it("doesn't call addToListOfPeers if its own id is passed in", () => {
      spyOn(controller, "addToListOfPeers");
      controller.addToNetwork('b', '10', mockDoc);
      expect(controller.addToListOfPeers).not.toHaveBeenCalled();
    });
  });

  describe("removeFromNetwork", () => {
    const mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p id="peerId"></p><p class='video-modal'></p><p class="copy-container"></p>`).window;
    const mockDoc = mockWin.document;
    let controller;


    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      controller.broadcast.peer = mockPeer;
      controller.network.push({peerId: 'b', siteId: '10'});
      controller.addToListOfPeers('10', "b", mockDoc);
    });

    it("doesn't do anything if the id isn't in the network list", () => {
      spyOn(controller.broadcast, "removeFromNetwork");
      spyOn(controller, "removeFromListOfPeers");
      controller.removeFromNetwork("a", mockDoc);
      expect(controller.broadcast.removeFromNetwork).not.toHaveBeenCalled();
      expect(controller.removeFromListOfPeers).not.toHaveBeenCalled();
    });

    it("removes the id from the network list", () => {
      controller.removeFromNetwork("b", mockDoc);
      expect(controller.network.length).toEqual(0);
    });

    it("calls removeFromListOfPeers with the id passed in", () => {
      spyOn(controller, "removeFromNetwork");
      controller.removeFromNetwork("b", mockDoc);
      expect(controller.removeFromNetwork).toHaveBeenCalledWith("b", mockDoc);
    });

    it("calls broadcast.removeFromNetwork with the id passed in", () => {
      spyOn(controller.broadcast, "removeFromNetwork");
      controller.removeFromNetwork("b", mockDoc);
      expect(controller.broadcast.removeFromNetwork).toHaveBeenCalledWith("b");
    });
  });

  describe('makeOwnName', () => {
    it('adds a peer flag to the list', () => {
      const mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p id="peerId"></p><p class='video-modal'></p><p class="copy-container"></p>`).window;
      const mockDoc = mockWin.document;
      const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);

      const childrenBefore = mockDoc.querySelector('#peerId').children.length;
      controller.makeOwnName(mockDoc);
      expect(mockDoc.querySelector('#peerId').children.length).toBeGreaterThan(childrenBefore);
    });
  });

  describe("addToListOfPeers", () => {
    let controller, mockDoc, mockWin, connList;

    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p id="peerId"></p><p class='video-modal'></p><p class="copy-container"></p>`).window;
      mockDoc = mockWin.document;
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      connList = mockDoc.querySelector("#peerId").textContent;
    })

    it("updates the connection list on the page", () => {
      controller.addToListOfPeers(siteId, targetPeerId, mockDoc);
      const updatedConnList = mockDoc.querySelector("#peerId").textContent;
      expect(connList).not.toEqual(updatedConnList);
    });
  });

  describe('getPeerElemById', () => {
    it('returns the peer list item element with the id passed in', () => {
      const mockWin = new JSDOM(`<!DOCTYPE html><p id="peerId"></p><p class='video-modal'></p><p class="copy-container"></p>`).window;
      const mockDoc = mockWin.document;
      const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      controller.addToListOfPeers(siteId, 123, mockDoc);
      const retVal = controller.getPeerElemById(123, mockDoc);
      expect(retVal.tagName).toEqual('LI');
    });
  });

  describe('getPeerFlagById', () => {
    it('returns the peer flag with the id passed in', () => {
      const mockWin = new JSDOM(`<!DOCTYPE html><p id="peerId"></p><p class='video-modal'></p><p class="copy-container"></p>`).window;
      const mockDoc = mockWin.document;
      const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      controller.addToListOfPeers(siteId, 123, mockDoc);
      const retVal = controller.getPeerFlagById(123, mockDoc);
      expect(retVal.tagName).toEqual('SPAN');
    });
  });

  describe('addBeingCalledClass', () => {
    it('adds the being called class to the peer flag with the id passed in', () => {
      const mockWin = new JSDOM(`<!DOCTYPE html><p id="peerId"></p><p class='video-modal'></p><p class="copy-container"></p>`).window;
      const mockDoc = mockWin.document;
      const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      controller.addToListOfPeers(siteId, 123, mockDoc);
      expect(mockDoc.getElementById(123).classList.length).toEqual(0);
      controller.addBeingCalledClass(123, mockDoc);
      expect(String(mockDoc.getElementById(123).classList)).toEqual('beingCalled');
    });
  });

  describe('addCallingClass', () => {
    it('adds the calling class to the peer flag with the id passed in', () => {
      const mockWin = new JSDOM(`<!DOCTYPE html><p id="peerId"></p><p class='video-modal'></p><p class="copy-container"></p>`).window;
      const mockDoc = mockWin.document;
      const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      controller.addToListOfPeers(siteId, 123, mockDoc);
      expect(mockDoc.getElementById(123).classList.length).toEqual(0);
      controller.addCallingClass(123, mockDoc);
      expect(String(mockDoc.getElementById(123).classList)).toEqual('calling');
    });
  });

  describe('streamVideo', () => {
    const mockWin = new JSDOM(`<!DOCTYPE html><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
    const mockDoc = mockWin.document;
    mockDoc.querySelector('video').play = function() {};
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);

    it('answers the call from the peer passed in', () => {
      spyOn(controller, 'answerCall');
      controller.addToListOfPeers(siteId, 12345, mockDoc);
      controller.streamVideo('stream', {peer: 12345}, mockDoc);
      expect(controller.answerCall).toHaveBeenCalledWith(12345, mockDoc);
    });

    it('removes the hide class from the video modal', () => {
      const videoModal = mockDoc.querySelector('.video-modal');
      videoModal.classList.add('hide');
      expect(String(videoModal.classList)).toEqual('video-modal hide');
      controller.streamVideo('stream', {peer: 12345}, mockDoc);
      expect(String(videoModal.classList)).toEqual('video-modal');
    });

    it('binds the video events', () => {
      spyOn(controller, 'bindVideoEvents');
      controller.streamVideo('stream', {peer: 12345}, mockDoc);
      expect(controller.bindVideoEvents).toHaveBeenCalledWith({peer: 12345}, mockDoc);
    });
  });

  describe('bindVideoEvents', () => {
    let mockWin, mockDoc, controller;
    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
      mockDoc = mockWin.document;
      mockDoc.querySelector('video').play = function() {};
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
    });

    it('sets a click event on the minimize element', () => {
      const minimize = mockDoc.querySelector('.minimize');
      expect(minimize.onclick).toBeNull();
      controller.bindVideoEvents({peer: 12345}, mockDoc);
      expect(minimize.onclick).toBeDefined();
    });

    it('sets a click event on the exit element', () => {
      const exit = mockDoc.querySelector('.exit');
      expect(exit.onclick).toBeNull();
      controller.bindVideoEvents({peer: 12345}, mockDoc);
      expect(exit.onclick).toBeDefined();
    });
  });

  describe('answerCall', () => {
    let mockWin, mockDoc, controller, peer;
    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
      mockDoc = mockWin.document;
      mockDoc.querySelector('video').play = function() {};
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      controller.addToListOfPeers(siteId, 123, mockDoc);
      peer = mockDoc.getElementById(123);
      peer.classList = 'calling beingcalled';
    });

    it('removes the calling class from the peer flag with the id passed in', () => {
      controller.answerCall(123, mockDoc);
      expect(peer.classList.contains('calling')).toBeFalsy();
    });

    it('removes the beingCalled class from the peer flag with the id passed in', () => {
      controller.answerCall(123, mockDoc);
      expect(peer.classList.contains('beingCalled')).toBeFalsy();
    });

    it('adds the answered class to the peer flag with the id passed in', () => {
      controller.answerCall(123, mockDoc);
      expect(peer.classList.contains('answered')).toBeTruthy();
    });
  });

  describe('closeVideo', () => {
    let mockWin, mockDoc, controller, peer, modal;
    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
      mockDoc = mockWin.document;
      mockDoc.querySelector('video').play = function() {};
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      controller.addToListOfPeers(siteId, 123, mockDoc);
      modal = mockDoc.querySelector('.video-modal');
      peer = mockDoc.getElementById(123);
      peer.classList = 'answered calling beingCalled';
    });

    it('adds the hide class to the video modal', () => {
      expect(modal.classList.contains('hide')).toBeFalsy();
      controller.closeVideo(123, mockDoc);
      expect(modal.classList.contains('hide')).toBeTruthy();
    });

    it('removes the answered, calling, and being called classes from the peer flag with the id passed in', () => {
      expect(peer.classList.contains('answered')).toBeTruthy();
      expect(peer.classList.contains('calling')).toBeTruthy();
      expect(peer.classList.contains('beingCalled')).toBeTruthy();
      controller.closeVideo(123, mockDoc);
      expect(peer.classList.contains('answered')).toBeFalsy();
      expect(peer.classList.contains('calling')).toBeFalsy();
      expect(peer.classList.contains('beingCalled')).toBeFalsy();
    });

    it('removes the id passed in from the calling attribute', () => {
      controller.calling = [123, 1234];
      controller.closeVideo(123, mockDoc);
      expect(controller.calling).toEqual([1234]);
    });

    it('calls attachVideoEvent with the id passed in', () => {
      spyOn(controller, 'attachVideoEvent');
      controller.closeVideo(123, mockDoc);
      expect(controller.attachVideoEvent).toHaveBeenCalled();
    });
  });

  describe("removeFromListOfPeers", () => {
    const mockWin = new JSDOM(`<!DOCTYPE html><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
    const mockDoc = mockWin.document;
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
    controller.addToListOfPeers(siteId, 123, mockDoc);

    it("removes the connection list element from the list", () => {
      const numElements = mockDoc.getElementsByTagName("LI").length;
      controller.removeFromListOfPeers(123, mockDoc);
      const updatedNumElements = mockDoc.getElementsByTagName("LI").length;
      expect(updatedNumElements).toEqual(numElements - 1);
    });
  });

  describe("findNewTarget", () => {
    const mockWin = new JSDOM(`<!DOCTYPE html><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
    const mockDoc = mockWin.document;
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);

    it("filters its own id out and throws an error if possible network list is empty", () => {
      controller.network.push(8);
      expect(controller.findNewTarget).toThrowError();
    });

    it("calls broadcast.connectToNewTarget with a random peer on the list", () => {
      controller.network.push({peerId: 'a', siteId: '10'});
      controller.network.push({peerId: 'b', siteId: '11'});
      controller.broadcast.connections = ['a', 'b'];
      spyOn(controller.broadcast, "requestConnection");
      controller.findNewTarget('c');
      const args = controller.broadcast.requestConnection.calls.allArgs();
      expect(String(args).includes('a') || String(args).includes('b')).toBeTruthy();
    });
  });

  describe("handleSync", () => {
    const mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
    mockWin.history.pushState = function(one, two, three) {};
    const mockDoc = mockWin.document;
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
    controller.broadcast.peer = mockPeer;
    const syncObj = {
      initialStruct: [[{
        position: [ {digit: 3, siteId: 4} ],
        counter: 1,
        siteId: 5,
        value: "a"
      }, {
        position: [ {digit: 4, siteId: 5} ],
        counter: 1,
        siteId: 6,
        value: "b"
      }]],
      initialVersions: [{
        siteId: 2,
        counter: 1,
        exceptions: [6, 7],
      }],
      peerId: '7',
      siteId: '10',
      network: [
        {peerId: '1', siteId: '3'},
        {peerId: '2', siteId: '4'},
        {peerId: '3', siteId: '5'}
      ]
    };

    it("calls populateCRDT with the initial struct property", () => {
      spyOn(controller, "populateCRDT");
      controller.handleSync(syncObj, mockDoc, mockWin);
      expect(controller.populateCRDT).toHaveBeenCalledWith([[{
            position: [ {digit: 3, siteId: 4} ],
            counter: 1,
            siteId: 5,
            value: "a"
          }, {
            position: [ {digit: 4, siteId: 5} ],
            counter: 1,
            siteId: 6,
            value: "b"
          }
      ]]);
    });

    it("calls populateVersionVector with the initial versions property", () => {
      spyOn(controller, "populateVersionVector");
      controller.handleSync(syncObj, mockDoc, mockWin);
      expect(controller.populateVersionVector).toHaveBeenCalledWith([{
        siteId: 2,
        counter: 1,
        exceptions: [6, 7],
      }]);
    });

    it("calls addToNetwork for each id in the network property", () => {
      spyOn(controller, "addToNetwork");
      controller.handleSync(syncObj, mockDoc, mockWin);
      expect(controller.addToNetwork).toHaveBeenCalledWith('1', '3', mockDoc);
      expect(controller.addToNetwork).toHaveBeenCalledWith('2', '4', mockDoc);
      expect(controller.addToNetwork).toHaveBeenCalledWith('3', '5', mockDoc);
    });
  });

  describe('syncCompleted', () => {
    let mockWin, mockDoc, controller;
    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
      mockWin.history.pushState = function(one, two, three) {};
      mockDoc = mockWin.document;
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      controller.broadcast.peer = mockPeer;
    });

    it('adds id passed in to outgoing connections if not already connected', () => {
      spyOn(controller.broadcast, 'addToOutConns');
      controller.syncCompleted(123);
      expect(controller.broadcast.addToOutConns).toHaveBeenCalled();
    });
  });

  describe("handleRemoteOperation", () => {
    let mockWin, mockDoc, controller, mockOperation;

    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
      mockDoc = mockWin.document;
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      mockOperation = {};

      spyOn(controller.vector, "hasBeenApplied");
      spyOn(controller, "applyOperation");
      spyOn(controller, "processDeletionBuffer");
      spyOn(controller.broadcast, "send");
    })

    it("calls vector.hasBeenApplied", () => {
      controller.handleRemoteOperation(mockOperation);
      expect(controller.vector.hasBeenApplied).toHaveBeenCalled();
    });

    it("calls applyOperation for an insert", () => {
      const insertOperation = {
        type: 'insert',
        char: { siteId: 0, counter: 0, position: []},
        version: [],
      };

      controller.handleRemoteOperation(insertOperation);
      expect(controller.applyOperation).toHaveBeenCalled();
    });

    it("pushes operation to buffer for a delete", () => {
      const deleteOperation = {
        type: 'delete',
        char: { siteId: 0, counter: 0, position: []},
        version: [],
      };

      expect(controller.buffer.length).toBe(0);
      controller.handleRemoteOperation(deleteOperation);
      expect(controller.buffer.length).toBe(1);
    });

    it("calls processDeletionBuffer", () => {
      controller.handleRemoteOperation(mockOperation);
      expect(controller.processDeletionBuffer).toHaveBeenCalled();
    });

    it("calls broadcast.send", () => {
      controller.handleRemoteOperation(mockOperation);
      expect(controller.broadcast.send).toHaveBeenCalled();
    });
  });

  describe("processDeletionBuffer", () => {
    let controller, op1, op2, version1, version2, mockWin, mockDoc;

    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
      mockDoc = mockWin.document;
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);

      op1 = {type: 'delete', char: { siteId: 1, counter: 1 }};
      op2 = {type: 'delete', char: { siteId: 3, counter: 5 }};
      controller.buffer = [op1, op2];

      // version1 = { siteId: 1, counter: 3 };
      // version2 = { siteId: 3, counter: 3 };
      // controller.vector.versions = [version1, version2];

      spyOn(controller, "hasInsertionBeenApplied");
      spyOn(controller, "applyOperation");
    })

    it("calls vector.hasBeenApplied for each operation in buffer", () => {
      controller.processDeletionBuffer();
      expect(controller.hasInsertionBeenApplied).toHaveBeenCalledWith(op1);
      expect(controller.hasInsertionBeenApplied).toHaveBeenCalledWith(op2);
    });

    it("calls applyOperation if hasInsertionBeenApplied is true", () => {
      controller.hasInsertionBeenApplied = function() {
        return true;
      }

      controller.processDeletionBuffer();
      expect(controller.applyOperation).toHaveBeenCalledWith(op1);
    });

    it("doesn't call applyOperation if hasInsertionBeenApplied is false", () => {
      controller.hasInsertionBeenApplied = function() {
        return false;
      }

      controller.processDeletionBuffer();
      expect(controller.applyOperation).not.toHaveBeenCalledWith(op1);
    });

    it("clears buffer if hasInsertionBeenApplied is true", () => {
      controller.hasInsertionBeenApplied = function() {
        return true;
      }
      expect(controller.buffer.length).toBe(2);
      controller.processDeletionBuffer();
      expect(controller.buffer.length).toBe(0);
    });
  });

  describe("hasInsertionBeenApplied", () => {
    let controller, operation, mockWin, mockDoc;

    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
      mockDoc = mockWin.document;
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      operation = {type: "delete", char: {siteId: 1, counter: 1}};

      spyOn(controller.vector, "hasBeenApplied");
    })

    it("calls vector.hasBeenApplied for operation", () => {
      controller.hasInsertionBeenApplied(operation);
      expect(controller.vector.hasBeenApplied).toHaveBeenCalled();
    });

    it("calls the vector method with the correct character version", () => {
      controller.hasInsertionBeenApplied(operation);
      expect(controller.vector.hasBeenApplied).toHaveBeenCalledWith({siteId: 1, counter: 1});
    })
  });

  describe("applyOperation", () => {
    let controller, operation, mockWin, mockDoc;

    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
      mockDoc = mockWin.document;
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);

      spyOn(controller.crdt, "handleRemoteInsert");
      spyOn(controller.crdt, "handleRemoteDelete");
      spyOn(controller.vector, "update");
    })

    it("calls crdt.handleRemoteInsert if it's an insert", () => {
      const operation = {
        type: "insert",
        char: { siteId: 0, counter: 0, position: []},
        version: {siteId: 8, counter: 9}
      };
      controller.applyOperation(operation);
      expect(controller.crdt.handleRemoteInsert).toHaveBeenCalled();
    });

    it("calls crdt.handleRemoteDelete if it's a delete", () => {
      const operation = {
        type: "delete",
        char: { siteId: 0, counter: 0, position: []},
        version: {siteId: 8, counter: 9}
      };
      controller.applyOperation(operation);
      expect(controller.crdt.handleRemoteDelete).toHaveBeenCalled();
    });

    it("calls creates the proper char and identifier objects to pass to handleRemoteInsert/handleRemoteDelete", () => {
      const operation = {
        type: "insert",
        char: { siteId: 4, counter: 5, value: "a", position: [{digit: 6, siteId: 7}] },
        version: {siteId: 8, counter: 9}
      };
      const newChar = new Char("a", 5, 4, [new Identifier(6, 7)]);

      controller.applyOperation(operation);
      expect(controller.crdt.handleRemoteInsert).toHaveBeenCalledWith(newChar);
    });

    it("calls vector.update with the operation's version", () => {
      const dataObj = {
        op: "insert",
        char: { siteId: 0, counter: 0, position: []},
        version: {siteId: 8, counter: 9}
      };

      controller.applyOperation(dataObj);
      expect(controller.vector.update).toHaveBeenCalledWith({siteId: 8, counter: 9});
    });
  });

  describe("localDelete", () => {
    let controller, mockDoc, mockWin;

    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
      mockDoc = mockWin.document;
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);

      spyOn(controller.crdt, "handleLocalDelete");
    })

    it("calls crdt.handleLocalDelete as many times as the difference between startIdx and endIdx", () => {
      const startIdx = 3;
      const endIdx = 5;
      controller.localDelete(startIdx, endIdx);
      expect(controller.crdt.handleLocalDelete).toHaveBeenCalledWith(startIdx, endIdx);
    });
  });

  describe("localInsert", () => {
    const mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
    const mockDoc = mockWin.document;
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);

    it("calls crdt.handleLocalInsert with the character object and index passed in", () => {
      const identifier1 = new Identifier(4, 5);
      const identifier2 = new Identifier(6, 7);
      const chars = [new Char("a", 1, 0, [identifier1, identifier2])];

      spyOn(controller.crdt, "handleLocalInsert");
      controller.localInsert(chars, {line: 0, ch: 5});
      expect(controller.crdt.handleLocalInsert).toHaveBeenCalledWith(chars[0], {line: 0, ch: 6});
    });
  });

  describe("broadcastInsertion", () => {
    let controller, newChar, mockWin, mockDoc;

    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
      mockDoc = mockWin.document;
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);

      const identifier1 = new Identifier(4, 5);
      const identifier2 = new Identifier(6, 7);
      newChar = new Char("a", 1, 0, [identifier1, identifier2]);

      spyOn(controller.vector, "getLocalVersion");
      spyOn(controller.broadcast, "send");
    })

    it("calls vector.getLocalVersion", () => {
      controller.broadcastInsertion(newChar);
      expect(controller.vector.getLocalVersion).toHaveBeenCalled();
    });

    it("calls broadcast.send with the correct operation", () => {
      controller.broadcastInsertion(newChar);
      const operation = {
        type: 'insert',
        char: newChar,
        version: undefined,
      }
      expect(controller.broadcast.send).toHaveBeenCalledWith(operation);
    });
  });

  describe("broadcastDeletion", () => {
    let controller, newChar, mockDoc, mockWin;

    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
      mockDoc = mockWin.document;
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);

      const identifier1 = new Identifier(4, 5);
      const identifier2 = new Identifier(6, 7);
      newChar = new Char("a", 1, 0, [identifier1, identifier2]);

      spyOn(controller.vector, "getLocalVersion");
      spyOn(controller.broadcast, "send");
    });

    it("calls broadcast.send with the correct operation", () => {
      controller.broadcastDeletion(newChar);
      const operation = {
        type: 'delete',
        char: newChar,
        version: undefined,
      }
      expect(controller.broadcast.send).toHaveBeenCalledWith(operation);
    });
  });

  describe("insertIntoEditor", () => {
    let controller, mockDoc, mockWin;

    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
      mockDoc = mockWin.document;
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      spyOn(controller.editor, "insertText");
    })

    it("calls editor.insertText", () => {
      controller.insertIntoEditor("a", 0);
      expect(controller.editor.insertText).toHaveBeenCalled();
    });
  });

  describe("deleteFromEditor", () => {
    let controller, mockDoc, mockWin;

    beforeEach(() => {
      mockWin = new JSDOM(`<!DOCTYPE html><p id='conclave'></p><p class='minimize'></p><p class='exit'></p><p class='video-bar'></p><p id="peerId"></p><p class='video-modal'><video /></p><p class="copy-container"></p>`).window;
      mockDoc = mockWin.document;
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor, mockDoc, mockWin);
      spyOn(controller.editor, "deleteText");
    })

    it("calls editor.deleteText", () => {
      controller.deleteFromEditor("a", 0);
      expect(controller.editor.deleteText).toHaveBeenCalled();
    });
  });
});
