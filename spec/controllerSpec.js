import { JSDOM } from 'jsdom';
import UUID from 'uuid/v1';
import Controller from '../lib/controller';
import Char from '../lib/char';
import Identifier from '../lib/identifier';

describe("Controller", () => {
  const mockPeer = {
    id: 8,
    on: function() {},
    connect: function() {},
  };

  const mockBroadcast = {
    bindServerEvents: function() {},
    connectToTarget: function() {},
    connectToNewTarget: function() {},
    send: function() {},
    addToNetwork: function() {},
    removeFromNetwork: function() {},
    connections: []
  };

  const mockEditor = {
    bindChangeEvent: function() {},
    updateView: function(text) {},
    onDownload: function() {},
    replaceText: function() {},
    insertText: function() {},
    deleteText: function() {},
    removeCursor: function() {}
  };

  const host = "https://localhost:3000";
  const siteId = UUID();
  const targetPeerId = UUID();

  describe("updateShareLink", () => {
    let controller, mockDoc, link;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
      mockDoc = new JSDOM(`<!DOCTYPE html><a id="myLink"></a>`).window.document;
      link = mockDoc.querySelector("#myLink").textContent;
    })

    it("changes the link value", () => {
      controller.updateShareLink(targetPeerId, mockDoc);
      const updatedLink = mockDoc.querySelector("#myLink").textContent;

      expect(link).not.toEqual(updatedLink);
    });

    it("sets the link's text content", () => {
      controller.updateShareLink(targetPeerId, mockDoc);
      const updatedLink = mockDoc.querySelector("#myLink").textContent;
      expect(updatedLink).toEqual(host+"/?id=" + targetPeerId);
    });

    it("sets the link's href attribute", () => {
      controller.updateShareLink(targetPeerId, mockDoc);
      const href = mockDoc.querySelector("#myLink").getAttribute('href');
      expect(href).toEqual(host+"/?id=" + targetPeerId);
    });
  });

  describe("populateCRDT", () => {
    let controller, initialStruct, expectedStruct;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
      initialStruct = [{
        position: [ {digit: 3, siteId: 4} ],
        counter: 1,
        siteId: 5,
        value: "a",
      }];

      expectedStruct = [ new Char("a", 1, 5, [new Identifier(3, 4)]) ];
      spyOn(controller.crdt, "populateText");
      spyOn(controller.editor, "replaceText");
    })

    it("sets proper value to crdt.struct", () => {
      controller.populateCRDT(initialStruct);
      expect(controller.crdt.struct).toEqual(expectedStruct);
    });

    it("calls crdt.populateText", () => {
      controller.populateCRDT(initialStruct);
      expect(controller.crdt.populateText).toHaveBeenCalled();
    });

    it("calls replaceText", () => {
      controller.populateCRDT(initialStruct);
      expect(controller.editor.replaceText).toHaveBeenCalled();
    });
  });

  describe("populateVersionVector", () => {
    let controller, initialVersions;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);

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
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
    controller.broadcast.peer = mockPeer;
    controller.network.push({ peerId: "b", siteId: '10' });
    const mockDoc = new JSDOM(`<!DOCTYPE html><p id="peerId"></p>`).window.document;
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
    const mockDoc = new JSDOM(`<!DOCTYPE html><p id="peerId"></p>`).window.document;
    let controller;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
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
      expect(controller.broadcast.removeFromNetwork).toHaveBeenCalledWith("b", '10');
    });
  });

  describe("addToListOfPeers", () => {
    let controller, mockDoc, connList;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
      mockDoc = new JSDOM(`<!DOCTYPE html><p id="peerId"></p>`).window.document;
      connList = mockDoc.querySelector("#peerId").textContent;
    })

    it("updates the connection list on the page", () => {
      controller.addToListOfPeers(siteId, targetPeerId, mockDoc);
      const updatedConnList = mockDoc.querySelector("#peerId").textContent;
      expect(connList).not.toEqual(updatedConnList);
    });
  });

  describe("removeFromListOfPeers", () => {
    let controller, mockDoc;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
      mockDoc = new JSDOM(`<!DOCTYPE html><p id="peerId"><li id="abcde"></li></p>`).window.document;
      controller.addToListOfPeers(siteId, targetPeerId, mockDoc);
    })

    it("removes the connection list element from the list", () => {
      const numElements = mockDoc.getElementsByTagName("LI").length;
      controller.removeFromListOfPeers('abcde', mockDoc);
      const updatedNumElements = mockDoc.getElementsByTagName("LI").length;
      expect(updatedNumElements).toEqual(numElements - 1);
    });
  });

  describe("findNewTarget", () => {
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);

    it("filters its own id out and throws an error if possible network list is empty", () => {
      controller.network.push(8);
      expect(controller.findNewTarget).toThrowError();
    });

    it("calls broadcast.connectToNewTarget with a random peer on the list", () => {
      controller.network.push({peerId: 'a', siteId: '10'});
      controller.network.push({peerId: 'b', siteId: '11'});
      controller.broadcast.connections = ['a', 'b'];
      spyOn(controller.broadcast, "connectToNewTarget");
      controller.findNewTarget('c');
      const args = controller.broadcast.connectToNewTarget.calls.allArgs();

      expect(['a', 'b'].indexOf(args[0][0])).toBeGreaterThan(-1);
    });
  });

  describe("handleSync", () => {
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
    const mockDoc = new JSDOM(`<!DOCTYPE html><p id="peerId"></p>`).window.document;
    const syncObj = {
      initialStruct: [{
        position: [ {digit: 3, siteId: 4} ],
        counter: 1,
        siteId: 5,
        value: "a"
      }, {
        position: [ {digit: 4, siteId: 5} ],
        counter: 1,
        siteId: 6,
        value: "b"
      }],
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
      controller.handleSync(syncObj, mockDoc);
      expect(controller.populateCRDT).toHaveBeenCalledWith([{
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
      ]);
    });

    it("calls populateVersionVector with the initial versions property", () => {
      spyOn(controller, "populateVersionVector");
      controller.handleSync(syncObj, mockDoc);
      expect(controller.populateVersionVector).toHaveBeenCalledWith([{
        siteId: 2,
        counter: 1,
        exceptions: [6, 7],
      }]);
    });

    it("calls addToNetwork for each id in the network property", () => {
      spyOn(controller, "addToNetwork");
      controller.handleSync(syncObj, mockDoc);
      expect(controller.addToNetwork).toHaveBeenCalledWith('1', '3', mockDoc);
      expect(controller.addToNetwork).toHaveBeenCalledWith('2', '4', mockDoc);
      expect(controller.addToNetwork).toHaveBeenCalledWith('3', '5', mockDoc);
    });
  });

  describe("handleRemoteOperation", () => {
    let controller, mockOperation;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
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
    let controller, op1, op2, version1, version2;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);

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
    let controller, operation;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
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
    let controller, operation;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);

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
    let controller;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
      spyOn(controller.crdt, "handleLocalDelete");
    })

    it("calls crdt.handleLocalDelete as many times as the difference between startIdx and endIdx", () => {
      const startIdx = 3;
      const endIdx = 5;
      controller.localDelete(startIdx, endIdx);
      expect(controller.crdt.handleLocalDelete).toHaveBeenCalledWith(startIdx);
      expect(controller.crdt.handleLocalDelete).toHaveBeenCalledWith(startIdx);
    });
  });

  describe("localInsert", () => {
    const controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);

    it("calls crdt.handleLocalInsert with the character object and index passed in", () => {
      const identifier1 = new Identifier(4, 5);
      const identifier2 = new Identifier(6, 7);
      const chars = [new Char("a", 1, 0, [identifier1, identifier2])];

      spyOn(controller.crdt, "handleLocalInsert");
      controller.localInsert(chars, 5);
      expect(controller.crdt.handleLocalInsert).toHaveBeenCalledWith(chars[0], 5);
    });
  });

  describe("broadcastInsertion", () => {
    let controller, newChar;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);

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
    let controller, newChar;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);

      const identifier1 = new Identifier(4, 5);
      const identifier2 = new Identifier(6, 7);
      newChar = new Char("a", 1, 0, [identifier1, identifier2]);

      spyOn(controller.vector, "getLocalVersion");
      spyOn(controller.broadcast, "send");
    })

    it("calls vector.getLocalVersion", () => {
      controller.broadcastDeletion(newChar);
      expect(controller.vector.getLocalVersion).toHaveBeenCalled();
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


// Didn't flush out these 2 tests since they'll be changing a lot with array of arrays
  describe("insertIntoEditor", () => {
    let controller;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
      spyOn(controller.editor, "insertText");
    })

    it("calls editor.insertText", () => {
      controller.insertIntoEditor("a", 0);
      expect(controller.editor.insertText).toHaveBeenCalled();
    });
  });

  describe("deleteFromEditor", () => {
    let controller;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
      spyOn(controller.editor, "deleteText");
    })

    it("calls editor.deleteText", () => {
      controller.deleteFromEditor("a", 0);
      expect(controller.editor.deleteText).toHaveBeenCalled();
    });
  });
});
