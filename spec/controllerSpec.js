import UUID from 'uuid/v1';
import { JSDOM } from 'jsdom';
import Identifier from '../lib/identifier';
import Char from '../lib/char';

describe("Controller", () => {
  describe("updateShareLink", () => {
    const host = "https://localhost";
    const dom = new JSDOM(`<!DOCTYPE html><a id="myLink">`).window.document;
    const id = UUID();

    function updateShareLink(id) {
      const sharingLink = host + '/?id=' + id;
      const aTag = dom.querySelector('#myLink');

      aTag.textContent = sharingLink;
      aTag.setAttribute('href', sharingLink);
    }

    const oldLink = dom.querySelector("#myLink").textContent;
    updateShareLink(id);
    const newLink = dom.querySelector("#myLink").textContent;

    it("updates the link on the page", () => {
      expect(oldLink).not.toEqual(newLink);
    });

    it("creates the share link from the id", () => {
      expect(newLink).toEqual(host+"/?id="+id);
    });
  });

  describe("addToConnectionList", () => {
    const dom = new JSDOM(`<!DOCTYPE html><p id="peerId">`).window.document;
    const id = UUID();

    function addToConnectionList(id) {
      const node = dom.createElement('LI');

      node.appendChild(dom.createTextNode(id));
      node.id = id;
      dom.querySelector('#peerId').appendChild(node);
    }

    const oldList = dom.querySelector("#peerId").textContent;
    addToConnectionList(id);
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

    function removeFromConnectionList(id) {
      dom.querySelector("#abcde").remove();
    }

    it("removes the connection list element from the list", () => {
      removeFromConnectionList("abcde");
      expect(dom.getElementsByTagName("LI").length).toBe(0);
    });
  });

  describe("handleRemoteOperation", () => {
    let buffer = [];
    const vector = {
      hasBeenApplied: function() {}
    };
    const broadcast = {
      send: function() {}
    };
    function reviewBuffer() {};

    function handleRemoteOperation(data) {
      const dataObj = JSON.parse(data);

      if (vector.hasBeenApplied(dataObj.version)) return;

      buffer.push(dataObj);
      reviewBuffer();
      broadcast.send(dataObj);
    }

    it("calls vector.hasBeenApplied", () => {
      spyOn(vector, "hasBeenApplied");
      handleRemoteOperation(JSON.stringify({version: []}));
      expect(vector.hasBeenApplied).toHaveBeenCalled();
    });

    it("adds the new operation to the buffer", () => {
      handleRemoteOperation(JSON.stringify({version: []}));
      expect(buffer.length).toBeGreaterThan(0);
    });

    it("calls broadcast.send", () => {
      spyOn(broadcast, "send");
      handleRemoteOperation(JSON.stringify({version: []}));
      expect(broadcast.send).toHaveBeenCalled();
    });
  });

  describe("reviewBuffer", () => {
    let buffer;
    const vector = {
      hasBeenApplied: function() {}
    };
    function isReady(dataObj) { return true }
    function applyOperation(dataObj) {}

    function reviewBuffer() {
      let found = false;
      let i = 0;
      let dataObj;

      while(i < buffer.length) {
        dataObj = buffer[i];

        if (vector.hasBeenApplied(dataObj.version)) {
          buffer.splice(i, 1);
        } else {
          if (isReady(dataObj)) {
            found = true;
            applyOperation(dataObj);
            buffer.splice(i, 1);
          } else {
            i++;
          }
        }
      }

      if (found) reviewBuffer();
    }

    it("calls vector.hasBeenApplied for each operation in buffer", () => {
      buffer = [{version: 1}, {version: 2}, {version: 3}];
      spyOn(vector, "hasBeenApplied");
      reviewBuffer();
      expect(vector.hasBeenApplied).toHaveBeenCalledWith(1);
      expect(vector.hasBeenApplied).toHaveBeenCalledWith(2);
      expect(vector.hasBeenApplied).toHaveBeenCalledWith(3);
    });

    it("splices the operation from the buffer if it is ready", () => {
      buffer = [{version: 1}, {version: 2}, {version: 3}];
      reviewBuffer();
      expect(buffer.length).toBe(0);
    });
  });

  describe("isReady", () => {
    const vector = {
      hasBeenApplied: function() {}
    };
    function isReady(dataObj) {
      const charVersion = { siteId: dataObj.char.siteId, counter: dataObj.char.counter };

      switch(dataObj.op) {
        case "insert":
          break;
        case 'delete':
          if (!vector.hasBeenApplied(charVersion)) return false;
          break;
      }

      return true;
    }

    it("returns true for insert operations", () => {
      const dataObj = {op: "insert", char: {siteId: 0, counter: 1}};
      expect(isReady(dataObj)).toBe(true);
    });

    it("calls vector.hasBeenApplied for delete operations", () => {
      const dataObj = {op: "delete", char: {siteId: 0, counter: 1}};
      spyOn(vector, "hasBeenApplied");
      isReady(dataObj);
      expect(vector.hasBeenApplied).toHaveBeenCalled();
    });

    it("calls the vector method with the correct character version", () => {
      const dataObj = {op: "delete", char: {siteId: 0, counter: 1}};
      spyOn(vector, "hasBeenApplied");
      isReady(dataObj);
      expect(vector.hasBeenApplied).toHaveBeenCalledWith({siteId: 0, counter: 1});
    })
  });

  describe("applyOperation", () => {
    const crdt = {
      insertChar: function() {},
      deleteChar: function() {}
    };
    const vector = {
      update: function() {}
    };
    function applyOperation(dataObj) {
      const char = dataObj.char;
      const identifiers = char.position.map(pos => new Identifier(pos.digit, pos.siteId));
      const newChar = new Char(char.value, char.counter, char.siteId, identifiers);

      if (dataObj.op === 'insert') {
        crdt.insertChar(newChar);
      } else if (dataObj.op === 'delete') {
        crdt.deleteChar(newChar);
      }

      vector.update(dataObj.version);
    }

    const position = [{digit: 4, siteId: 5}, {digit: 6, siteId: 7}];
    const char = {value: "a", siteId: 0, counter: 1, position: position, version: {siteId: 2, counter: 3}};

    it("calls crdt.insertChar if it is an insertion operation", () => {
      const dataObj = {op: "insert", char: char, version: {siteId: 8, counter: 9}};
      spyOn(crdt, "insertChar");
      applyOperation(dataObj);
      expect(crdt.insertChar).toHaveBeenCalled();
    });

    it("creates the character and identifier objects properly", () => {
      const dataObj = {op: "insert", char: char, version: {siteId: 8, counter: 9}};
      spyOn(crdt, "insertChar");
      const identifier1 = new Identifier(4, 5);
      const identifier2 = new Identifier(6, 7);
      const newChar = new Char("a", 1, 0, [identifier1, identifier2]);
      applyOperation(dataObj);
      expect(crdt.insertChar).toHaveBeenCalledWith(newChar);
    });

    it("calls crdt.deleteChar if it is a deletion operation", () => {
      const dataObj = {op: "delete", char: char, version: {siteId: 8, counter: 9}};
      spyOn(crdt, "deleteChar");
      applyOperation(dataObj);
      expect(crdt.deleteChar).toHaveBeenCalled();
    });

    it("calls vector.update with the operation's version", () => {
      const dataObj = {op: "insert", char: char, version: {siteId: 8, counter: 9}};
      spyOn(vector, "update");
      applyOperation(dataObj);
      expect(vector.update).toHaveBeenCalledWith({siteId: 8, counter: 9});
    });
  });

  describe("handleDelete", () => {
    const crdt = {
      handleLocalDelete: function(idx) {}
    };
    function handleDelete(idx) {
      crdt.handleLocalDelete(idx);
    }

    it("calls crdt.handleLocalDelete with the index passed in", () => {
      spyOn(crdt, "handleLocalDelete");
      handleDelete(3);
      expect(crdt.handleLocalDelete).toHaveBeenCalledWith(3);
    });
  });

  describe("handleInsert", () => {
    const crdt = {
      handleLocalInsert: function(char, idx) {}
    };
    function handleInsert(char, idx) {
      crdt.handleLocalInsert(char, idx);
    }

    it("calls crdt.handleLocalInsert with the character object and index passed in", () => {
      spyOn(crdt, "handleLocalInsert");
      const identifier1 = new Identifier(4, 5);
      const identifier2 = new Identifier(6, 7);
      const newChar = new Char("a", 1, 0, [identifier1, identifier2]);
      handleInsert(newChar, 5);
      expect(crdt.handleLocalInsert).toHaveBeenCalledWith(newChar, 5);
    });
  });

  describe("broadcastInsertion", () => {
    const vector = {
      increment: function() {},
      getLocalVersion: function() { return 5 }
    };
    const broadcast = {
      send: function(message) {}
    };
    function broadcastInsertion(char) {
      vector.increment();

      const message = {
        op: 'insert',
        char: char,
        version: vector.getLocalVersion()
      };

      broadcast.send(message);
    }

    const identifier1 = new Identifier(4, 5);
    const identifier2 = new Identifier(6, 7);
    const newChar = new Char("a", 1, 0, [identifier1, identifier2]);

    it("calls vector.increment", () => {
      spyOn(vector, "increment");
      broadcastInsertion(newChar);
      expect(vector.increment).toHaveBeenCalled();
    });

    it("calls vector.getLocalVersion", () => {
      spyOn(vector, "getLocalVersion");
      broadcastInsertion(newChar);
      expect(vector.getLocalVersion).toHaveBeenCalled();
    });

    it("calls broadcast.send with the correct message", () => {
      spyOn(broadcast, "send");
      broadcastInsertion(newChar);
      const newMessage = {
        op: 'insert',
        char: newChar,
        version: 5
      }
      expect(broadcast.send).toHaveBeenCalledWith(newMessage);
    });
  });

  describe("broadcastDeletion", () => {
    const vector = {
      increment: function() {},
      getLocalVersion: function() { return 5 }
    };
    const broadcast = {
      send: function(message) {}
    };
    function broadcastDeletion(char) {
      vector.increment();

      const message = {
        op: 'delete',
        char: char,
        version: vector.getLocalVersion()
      };

      broadcast.send(message);
    }

    const identifier1 = new Identifier(4, 5);
    const identifier2 = new Identifier(6, 7);
    const newChar = new Char("a", 1, 0, [identifier1, identifier2]);

    it("calls vector.increment", () => {
      spyOn(vector, "increment");
      broadcastDeletion(newChar);
      expect(vector.increment).toHaveBeenCalled();
    });

    it("calls vector.getLocalVersion", () => {
      spyOn(vector, "getLocalVersion");
      broadcastDeletion(newChar);
      expect(vector.getLocalVersion).toHaveBeenCalled();
    });

    it("calls broadcast.send with the correct message", () => {
      spyOn(broadcast, "send");
      broadcastDeletion(newChar);
      const newMessage = {
        op: 'delete',
        char: newChar,
        version: 5
      }
      expect(broadcast.send).toHaveBeenCalledWith(newMessage);
    });
  });

  describe("updateEditor", () => {
    const crdt = {
      text: "blah"
    };
    const editor = {
      updateView: function(text) {}
    };
    function updateEditor() {
      editor.updateView(crdt.text);
    }

    it("calls editor.updateView with the crdt's text", () => {
      spyOn(editor, "updateView");
      updateEditor(crdt.text);
      expect(editor.updateView).toHaveBeenCalledWith("blah");
    });
  });
});
