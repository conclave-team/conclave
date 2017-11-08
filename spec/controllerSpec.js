import UUID from 'uuid/v1';
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
    updateView: function(text) {}
  };

  const host = "https://localhost:3000";
  const siteId = Math.floor(Math.random() * 1000);
  const targetPeerId = '';

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
          exceptions: new Set([6, 7]),
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
      expect(controller.vector.versions.arr[0].exceptions.size).toEqual(2);
    });
  });

  describe("updateShareLink", () => {
    const controller = new Controller(targetId, host, mockPeer, mockBroadcast, mockEditor);
    const id = UUID();
    const dom = new JSDOM(`<!DOCTYPE html><a id="myLink">`).window.document;

    const oldLink = dom.querySelector("#myLink").textContent;
    controller.updateShareLink(id, dom);
    const newLink = dom.querySelector("#myLink").textContent;

    it("updates the link on the page", () => {
      expect(oldLink).not.toEqual(newLink);
    });

    it("creates the share link from the id", () => {
      expect(newLink).toEqual(host+"/?id="+id);
    });
  });

  describe("addToConnectionList", () => {
    const controller = new Controller(targetId, host, mockPeer, mockBroadcast, mockEditor);
    const dom = new JSDOM(`<!DOCTYPE html><p id="peerId">`).window.document;
    const id = UUID();

    const oldList = dom.querySelector("#peerId").textContent;
    controller.addToConnectionList(id, dom);
    const newList = dom.querySelector("#peerId").textContent;

    it("updates the connection list on the page", () => {
      expect(oldList).not.toEqual(newList);
    });

    it("adds the id passed in to the list", () => {
      expect(newList).toEqual(id);
    });
  });

  describe("removeFromConnectionList", () => {
    const dom = new JSDOM(`<!DOCTYPE html><p id="peerId"><li id="abcde">`).window.document;
    const controller = new Controller(targetId, host, mockPeer, mockBroadcast, mockEditor);
    const id = UUID();
    controller.addToConnectionList(id, dom);

    it("removes the connection list element from the list", () => {
      const LIsBefore = dom.getElementsByTagName("LI").length;
      controller.removeFromConnectionList(id, dom);
      expect(dom.getElementsByTagName("LI").length).toBeLessThan(LIsBefore);
    });
  });

  describe("handleRemoteOperation", () => {
    const controller = new Controller(targetId, host, mockPeer, mockBroadcast, mockEditor);
    controller.vector = {
      hasBeenApplied: function() {},
      update: function() {}
    }
    const data = JSON.stringify({
      version: [],
      char: { siteId: 0, counter: 0, position: []}
    });

    it("calls vector.hasBeenApplied", () => {
      spyOn(controller.vector, "hasBeenApplied");
      controller.handleRemoteOperation(data);
      expect(controller.vector.hasBeenApplied).toHaveBeenCalled();
    });

    it("adds and removes the new operation from the buffer", () => {
      controller.handleRemoteOperation(data);
      expect(controller.buffer.length).toBe(0);
    });

    it("calls broadcast.send", () => {
      spyOn(controller.broadcast, "send");
      controller.handleRemoteOperation(data);
      expect(controller.broadcast.send).toHaveBeenCalled();
    });
  });

  describe("processDeletionBuffer", () => {
    const controller = new Controller(targetId, host, mockPeer, mockBroadcast, mockEditor);
    controller.vector = {
      hasBeenApplied: function() {},
      update: function() {}
    };
    beforeEach(() => {
      controller.buffer = [
        {version: 1, char: { siteId: 0, counter: 0, position: []}},
        {version: 2, char: { siteId: 0, counter: 0, position: []}},
        {version: 3, char: { siteId: 0, counter: 0, position: []}}
      ];
    });

    it("calls vector.hasBeenApplied for each operation in buffer", () => {
      spyOn(controller.vector, "hasBeenApplied");
      controller.processDeletionBuffer();
      expect(controller.vector.hasBeenApplied).toHaveBeenCalledWith(1);
      expect(controller.vector.hasBeenApplied).toHaveBeenCalledWith(2);
      expect(controller.vector.hasBeenApplied).toHaveBeenCalledWith(3);
    });

    it("splices the operation from the buffer if it is ready", () => {
      controller.processDeletionBuffer();
      expect(controller.buffer.length).toBe(0);
    });
  });

  describe("hasInsertionBeenApplied", () => {
    const controller = new Controller(targetId, host, mockPeer, mockBroadcast, mockEditor);
    controller.vector = {
      hasBeenApplied: function() {}
    };

    it("returns true for insert operations", () => {
      const dataObj = {op: "insert", char: {siteId: 0, counter: 1}};
      expect(controller.hasInsertionBeenApplied(dataObj)).toBe(true);
    });

    it("calls vector.hasBeenApplied for delete operations", () => {
      const dataObj = {op: "delete", char: {siteId: 0, counter: 1}};
      spyOn(controller.vector, "hasBeenApplied");
      controller.hasInsertionBeenApplied(dataObj);
      expect(controller.vector.hasBeenApplied).toHaveBeenCalled();
    });

    it("calls the vector method with the correct character version", () => {
      const dataObj = {op: "delete", char: {siteId: 0, counter: 1}};
      spyOn(controller.vector, "hasBeenApplied");
      controller.hasInsertionBeenApplied(dataObj);
      expect(controller.vector.hasBeenApplied).toHaveBeenCalledWith({siteId: 0, counter: 1});
    })
  });

  describe("applyOperation", () => {
    const controller = new Controller(targetId, host, mockPeer, mockBroadcast, mockEditor);
    controller.crdt = {
      insertChar: function() {},
      deleteChar: function() {}
    };
    controller.vector = {
      update: function() {}
    };

    it("calls crdt.insertChar if it is an insertion operation", () => {
      const dataObj = {
        op: "insert",
        char: { siteId: 0, counter: 0, position: []},
        version: {siteId: 8, counter: 9}
      };
      spyOn(controller.crdt, "insertChar");
      controller.applyOperation(dataObj);
      expect(controller.crdt.insertChar).toHaveBeenCalled();
    });

    it("creates the character and identifier objects properly", () => {
      const dataObj = {
        op: "insert",
        char: {
          siteId: 4, counter: 5, value: "a",
          position: [{digit: 6, siteId: 7}]
        },
        version: {siteId: 8, counter: 9}
      };
      const newChar = new Char("a", 5, 4, [new Identifier(6, 7)]);

      spyOn(controller.crdt, "insertChar");
      controller.applyOperation(dataObj);
      expect(controller.crdt.insertChar).toHaveBeenCalledWith(newChar);
    });

    it("calls crdt.deleteChar if it is a deletion operation", () => {
      const dataObj = {
        op: "delete",
        char: { siteId: 0, counter: 0, position: []},
        version: {siteId: 8, counter: 9}
      };
      spyOn(controller.crdt, "deleteChar");
      controller.applyOperation(dataObj);
      expect(controller.crdt.deleteChar).toHaveBeenCalled();
    });

    it("calls vector.update with the operation's version", () => {
      const dataObj = {
        op: "insert",
        char: { siteId: 0, counter: 0, position: []},
        version: {siteId: 8, counter: 9}
      };
      spyOn(controller.vector, "update");
      controller.applyOperation(dataObj);
      expect(controller.vector.update).toHaveBeenCalledWith({siteId: 8, counter: 9});
    });
  });

  describe("handleDelete", () => {
    const controller = new Controller(targetId, host, mockPeer, mockBroadcast, mockEditor);
    controller.crdt = {
      handleLocalDelete: function(idx) {}
    };

    it("calls crdt.handleLocalDelete with the index passed in", () => {
      spyOn(controller.crdt, "handleLocalDelete");
      controller.handleDelete(3);
      expect(controller.crdt.handleLocalDelete).toHaveBeenCalledWith(3, undefined);
    });
  });

  describe("handleInsert", () => {
    const controller = new Controller(targetId, host, mockPeer, mockBroadcast, mockEditor);
    controller.crdt = {
      handleLocalInsert: function(char, idx) {}
    };

    it("calls crdt.handleLocalInsert with the character object and index passed in", () => {
      spyOn(controller.crdt, "handleLocalInsert");
      const identifier1 = new Identifier(4, 5);
      const identifier2 = new Identifier(6, 7);
      const newChar = new Char("a", 1, 0, [identifier1, identifier2]);
      controller.handleInsert(newChar, 5);
      expect(controller.crdt.handleLocalInsert).toHaveBeenCalledWith(newChar, 5);
    });
  });

  describe("broadcastInsertion", () => {
    const controller = new Controller(targetId, host, mockPeer, mockBroadcast, mockEditor);
    controller.vector = {
      increment: function() {},
      getLocalVersion: function() { return 5 }
    };

    const identifier1 = new Identifier(4, 5);
    const identifier2 = new Identifier(6, 7);
    const newChar = new Char("a", 1, 0, [identifier1, identifier2]);

    it("calls vector.increment", () => {
      spyOn(controller.vector, "increment");
      controller.broadcastInsertion(newChar);
      expect(controller.vector.increment).toHaveBeenCalled();
    });

    it("calls vector.getLocalVersion", () => {
      spyOn(controller.vector, "getLocalVersion");
      controller.broadcastInsertion(newChar);
      expect(controller.vector.getLocalVersion).toHaveBeenCalled();
    });

    it("calls broadcast.send with the correct message", () => {
      spyOn(controller.broadcast, "send");
      controller.broadcastInsertion(newChar);
      const newMessage = {
        op: 'insert',
        char: newChar,
        version: 5
      }
      expect(controller.broadcast.send).toHaveBeenCalledWith(newMessage);
    });
  });

  describe("broadcastDeletion", () => {
    const controller = new Controller(targetId, host, mockPeer, mockBroadcast, mockEditor);
    controller.vector = {
      increment: function() {},
      getLocalVersion: function() { return 5 }
    };

    const identifier1 = new Identifier(4, 5);
    const identifier2 = new Identifier(6, 7);
    const newChar = new Char("a", 1, 0, [identifier1, identifier2]);

    it("calls vector.increment", () => {
      spyOn(controller.vector, "increment");
      controller.broadcastDeletion(newChar);
      expect(controller.vector.increment).toHaveBeenCalled();
    });

    it("calls vector.getLocalVersion", () => {
      spyOn(controller.vector, "getLocalVersion");
      controller.broadcastDeletion(newChar);
      expect(controller.vector.getLocalVersion).toHaveBeenCalled();
    });

    it("calls broadcast.send with the correct message", () => {
      spyOn(controller.broadcast, "send");
      controller.broadcastDeletion(newChar);
      const newMessage = {
        op: 'delete',
        char: newChar,
        version: 5
      }
      expect(controller.broadcast.send).toHaveBeenCalledWith(newMessage);
    });
  });

  describe("updateEditor", () => {
    const controller = new Controller(targetId, host, mockPeer, mockBroadcast, mockEditor);
    controller.crdt.text = "blah";

    it("calls editor.updateView with the crdt's text", () => {
      spyOn(controller.editor, "updateView");
      controller.updateEditor(controller.crdt.text);
      expect(controller.editor.updateView).toHaveBeenCalledWith("blah");
    });
  });
});
