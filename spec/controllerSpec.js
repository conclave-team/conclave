import { JSDOM } from 'jsdom';
import Controller from '../lib/controller';
import Char from '../lib/char';
import Identifier from '../lib/identifier';

describe("Controller", () => {
  const mockPeer = {
    on: function() {},
    connect: function() {},
  };

  const mockBroadcast = {
    bindServerEvents: function() {},
    connectToTarget: function() {},
    send: function() {}
  };

  const mockEditor = {
    bindChangeEvent: function() {},
    updateView: function(text) {},
    onDownload: function() {}
  };

  const host = "https://localhost:3000";
  const siteId = Math.floor(Math.random() * 1000);
  const targetPeerId = Math.floor(Math.random() * 1000);

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
      spyOn(controller, "updateEditor");
    })

    it("sets proper value to crdt.struct", () => {
      controller.populateCRDT(initialStruct);
      expect(controller.crdt.struct).toEqual(expectedStruct);
    });

    it("calls crdt.populateText", () => {
      controller.populateCRDT(initialStruct);
      expect(controller.crdt.populateText).toHaveBeenCalled();
    });

    it("calls updateEditor", () => {
      controller.populateCRDT(initialStruct);
      expect(controller.updateEditor).toHaveBeenCalled();
    });
  });

  describe("populateVersionVector", () => {
    let controller, initialVersions;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);

      initialVersions = {
        arr: [{
          siteId: 2,
          counter: 1,
          exceptions: [6, 7],
        }],
      };
    })

    it("sets counter in the version vector", () => {
      controller.populateVersionVector(initialVersions);
      expect(controller.vector.versions.arr[0].counter).toEqual(1);
    });

    it("sets siteID in the version vector", () => {
      controller.populateVersionVector(initialVersions);
      expect(controller.vector.versions.arr[0].siteId).toEqual(2);
    });

    it("adds exceptions to this local version", () => {
      controller.populateVersionVector(initialVersions);
      expect(controller.vector.versions.arr[0].exceptions.length).toEqual(2);
    });
  });

  describe("updateShareLink", () => {
    let controller, mockDocument, link;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
      mockDocument = new JSDOM(`<!DOCTYPE html><a id="myLink"></a>`).window.document;
      link = mockDocument.querySelector("#myLink").textContent;
    })

    it("changes the link value", () => {
      controller.updateShareLink(targetPeerId, mockDocument);
      const updatedLink = mockDocument.querySelector("#myLink").textContent;

      expect(link).not.toEqual(updatedLink);
    });

    it("sets the link's text content", () => {
      controller.updateShareLink(targetPeerId, mockDocument);
      const updatedLink = mockDocument.querySelector("#myLink").textContent;
      expect(updatedLink).toEqual(host+"/?id=" + targetPeerId);
    });

    it("sets the link's href attribute", () => {
      controller.updateShareLink(targetPeerId, mockDocument);
      const href = mockDocument.querySelector("#myLink").getAttribute('href');
      expect(href).toEqual(host+"/?id=" + targetPeerId);
    });
  });

  describe("addToConnectionList", () => {
    let controller, mockDocument, connList;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
      mockDocument = new JSDOM(`<!DOCTYPE html><p id="peerId"></p>`).window.document;
      connList = mockDocument.querySelector("#peerId").textContent;
    })

    it("updates the connection list on the page", () => {
      controller.addToConnectionList(targetPeerId, mockDocument);
      const updatedConnList = mockDocument.querySelector("#peerId").textContent;
      expect(connList).not.toEqual(updatedConnList);
    });

    it("adds the id passed in to the list", () => {
      controller.addToConnectionList(targetPeerId, mockDocument);
      const updatedConnList = mockDocument.querySelector("#peerId").textContent;
      expect(updatedConnList).toEqual(String(targetPeerId));
    });
  });

  describe("removeFromConnectionList", () => {
    let controller, mockDocument;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
      mockDocument = new JSDOM(`<!DOCTYPE html><p id="peerId"><li id="abcde"></li></p>`).window.document;
      controller.addToConnectionList(targetPeerId, mockDocument);
    })

    it("removes the connection list element from the list", () => {
      const numElements = mockDocument.getElementsByTagName("LI").length;
      controller.removeFromConnectionList(targetPeerId, mockDocument);
      const updatedNumElements = mockDocument.getElementsByTagName("LI").length;
      expect(updatedNumElements).toEqual(numElements - 1);
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
    let controller;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
      spyOn(controller.crdt, "handleLocalInsert");
    })

    it("calls crdt.handleLocalInsert with the character object and index passed in", () => {
      const identifier1 = new Identifier(4, 5);
      const identifier2 = new Identifier(6, 7);
      const newChar = new Char("a", 1, 0, [identifier1, identifier2]);
      controller.localInsert(newChar, 5);

      expect(controller.crdt.handleLocalInsert).toHaveBeenCalledWith(newChar, 5);
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

  describe("updateEditor", () => {
    let controller;

    beforeEach(() => {
      controller = new Controller(targetPeerId, host, mockPeer, mockBroadcast, mockEditor);
      controller.crdt.text = "blah";
      spyOn(controller.editor, "updateView");
    })

    it("calls editor.updateView with the crdt's text", () => {
      controller.updateEditor(controller.crdt.text);
      expect(controller.editor.updateView).toHaveBeenCalledWith("blah");
    });
  });
});
