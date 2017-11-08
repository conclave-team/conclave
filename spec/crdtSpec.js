import CRDT from '../lib/crdt';
import Char from '../lib/char';
import Identifier from '../lib/identifier';
import VersionVector from '../lib/versionVector';

describe("CRDT", () => {
  const siteId = Math.floor(Math.random() * 1000);
  const mockController = {
    siteId: siteId,
    vector: new VersionVector(siteId),
    broadcastInsertion: function() {},
    broadcastDeletion: function() {},
    updateEditor: function() {},
  };

  describe("handleLocalInsert", () => {
    let crdt;

    beforeEach(() => {
      crdt = new CRDT(mockController);
      spyOn(crdt.controller, 'broadcastInsertion');
      spyOn(crdt.controller, 'updateEditor');
      spyOn(crdt.vector, 'increment');
    });

    it("calls vector 'increment'", () => {
      crdt.handleLocalInsert('A', 0);
      expect(crdt.vector.increment).toHaveBeenCalled();
    });

    it("adds char to CRDT", () => {
      expect(crdt.struct.length).toBe(0)
      crdt.handleLocalInsert('A', 0);
      expect(crdt.struct.length).toBe(1);
    });

    it("calls broadcastInsertion", function() {
      crdt.handleLocalInsert('A', 0);
      expect(crdt.controller.broadcastInsertion).toHaveBeenCalled();
    });

    it("calls updateEditor", function() {
      crdt.handleLocalInsert('A', 0);
      expect(crdt.controller.updateEditor).toHaveBeenCalled();
    });
  });

  describe("insertChar", () => {
    let crdt;
    let char1;
    let siteCounter;

    beforeEach(() => {
      crdt = new CRDT(mockController);
      siteCounter = 1;
      const position = [new Identifier(1, siteId)];
      char1 = new Char('A', siteCounter, siteId, position);
      spyOn(crdt.controller, 'updateEditor');
      spyOn(crdt.vector, 'increment');
    });

    it("adds char to CRDT", () => {
      expect(crdt.struct.length).toBe(0)
      crdt.insertChar(char1);
      expect(crdt.struct.length).toBe(1);
    });

    it("sorts chars based on position", () => {
      const char2 = new Char('B', siteCounter + 1, siteId, [new Identifier(0, 0), new Identifier(5, 0)]);

      crdt.insertChar(char1);
      crdt.insertChar(char2);
      expect(crdt.struct).toEqual([char2, char1]);
      expect(crdt.text).toBe('BA');
    });

    it("inserts the char value into the text property", () => {
      expect(crdt.text).toBe('');
      crdt.insertChar(char1);
      expect(crdt.text).toBe('A');
    });

    it("calls updateEditor", function() {
      crdt.insertChar(char1);
      expect(crdt.controller.updateEditor).toHaveBeenCalled();
    });

    it('does not call vector "increment"', () => {
      crdt.insertChar(char1);
      expect(crdt.vector.increment).not.toHaveBeenCalled();
    });
  });

  describe("handleLocalDelete", () => {
    let crdt;
    let char1;
    let char2;

    beforeEach(() => {
      crdt = new CRDT(mockController);
      char1 = new Char("a", 1, siteId, [new Identifier(1, 25)]);
      char2 = new Char("b", 2, siteId, [new Identifier(2, 25)]);
      crdt.insertChar(char1);
      crdt.insertChar(char2);
      spyOn(crdt.controller, 'broadcastDeletion');
      spyOn(crdt.vector, 'increment');
    });

    it("calls vector 'increment'", () => {
      crdt.handleLocalDelete(0);
      expect(crdt.vector.increment).toHaveBeenCalled();
    });

    it("deletes the correct character", () => {
      expect(crdt.struct).toEqual([char1, char2]);
      crdt.handleLocalDelete(0);
      expect(crdt.struct).toEqual([char2]);
    });

    it("calls broadcastDeletion", function() {
      crdt.handleLocalDelete(0);
      expect(crdt.controller.broadcastDeletion).toHaveBeenCalled();
    });
  });

  describe('deleteChar', () => {
    let crdt;
    let char;
    let position;
    let siteCounter;

    beforeEach(() => {
      crdt = new CRDT(mockController);
      siteCounter = Math.floor(Math.random() * 1000);
      position = [new Identifier(1, siteId)];
      char = new Char('A', siteCounter, siteId, position);
      crdt.insertChar(char);
      spyOn(crdt.controller, 'updateEditor');
    });

    it('removes a char from the crdt', () => {
      expect(crdt.struct.length).toBe(1);
      crdt.deleteChar(char);
      expect(crdt.struct.length).toBe(0);
    });

    it("updates the crdt's text", () => {
      expect(crdt.text).toBe('A');
      crdt.deleteChar(char);
      expect(crdt.text).toBe('');
    });

    it("calls updateEditor", function() {
      crdt.deleteChar(char);
      expect(crdt.controller.updateEditor).toHaveBeenCalled();
    });
  });

  describe("generateChar", () => {
    let crdt;
    let char;

    beforeEach(() => {
      crdt = new CRDT(mockController);
      crdt.vector.increment();
      char = crdt.generateChar("A", 0);
    });

    it("returns new Char object", () => {
      expect(char instanceof Char).toBe(true);
    });

    it("creates the Char with the correct value", () => {
      expect(char.value).toBe("A");
    });

    it("creates the Char with the correct counter", () => {
      let versionCounter = crdt.vector.localVersion.counter;
      expect(char.counter).toBe(versionCounter);
    });

    it("creates the Char with an array of position identifiers", () => {
      expect(char.position instanceof Array).toBe(true);
    });

    it("has at least one position identifier", () => {
      expect(char.position.length).toBeGreaterThan(0);
    })
  });

  describe('generatePosBetween', () => {
    let crdt;

    beforeEach(() => {
      const boundary = 5;
      const base = 16;
      crdt = new CRDT(mockController, base, boundary);
    });

    it('returns position with digit in (1...boundary) when both arrays are empty', () => {
      const digit = crdt.generatePosBetween([], [])[0].digit;

      expect(digit > 0 && digit <= crdt.boundary).toBeTruthy();
    });

    it('returns position with digit in (3..7) when first position digit is 2', () => {
      const pos1 = [new Identifier(2, siteId)];
      const digit = crdt.generatePosBetween(pos1, [])[0].digit

      expect(digit > 2 && digit <= (2 + crdt.boundary)).toBeTruthy();
    });

    it('returns position with digit in (1..2) when second position digit is 3', () => {
      const pos2 = [new Identifier(3, siteId)];
      const digit = crdt.generatePosBetween([], pos2)[0].digit;

      expect(digit > 0 && digit < 3).toBeTruthy();
    });

    it('returns position with second digit in (27..31) when two positions have a difference of 1', () => {
      const pos1 = [new Identifier(2, siteId)];
      const pos2 = [new Identifier(3, siteId)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const combinedPositionDigits = +newPos.map(id => id.digit).join('');

      expect(combinedPositionDigits > 226 && combinedPositionDigits < 232).toBeTruthy();
    });

    it('returns position with second digit in (27) when same positions but different siteIds', () => {
      const pos1 = [new Identifier(2, siteId)];
      const pos2 = [new Identifier(2, siteId + 1)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const combinedPositionDigits = newPos.map(id => id.digit).join('');

      expect(combinedPositionDigits > 226 && combinedPositionDigits < 232).toBeTruthy();
    });

    it('returns position between two positions with multiple ids', () => {
      const pos1 = [new Identifier(2, siteId), new Identifier(4, siteId)];
      const pos2 = [new Identifier(2, siteId), new Identifier(8, siteId)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const combinedPositionDigits = +newPos.map(id => id.digit).join('');

      expect(combinedPositionDigits > 24 && combinedPositionDigits < 28).toBeTruthy();
    });

    it('generates a position even when position arrays are different lengths', () => {
      const pos1 = [new Identifier(2, siteId), new Identifier(2, siteId), new Identifier(4, siteId)];
      const pos2 = [new Identifier(2, siteId), new Identifier(8, siteId)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const combinedPositionDigits = +newPos.map(id => id.digit).join('');

      expect(combinedPositionDigits > 22 && combinedPositionDigits < 28).toBeTruthy();
    });

    it('throws a sorting error if positions are sorted incorrectly', () => {
      const pos1 = [new Identifier(2, siteId + 1)];
      const pos2 = [new Identifier(2, siteId)];

      expect( function(){ crdt.generatePosBetween(pos1, pos2) }).toThrow(new Error("Fix Position Sorting"));
    });
  });

  describe("allocateId", () => {
    let crdt;

    beforeEach(() => {
      const boundary = 5;
      const base = 16;
      crdt = new CRDT(mockController, base, boundary);
    });

    it("returns digit within min + boundary when strategy is + and boundary < distance", () => {
      const digit = crdt.allocateId(1, 9, true);
      expect(digit > 1 && digit <= 6).toBeTruthy();
    });

    it("returns digit between min and max when strategy is + and boundary > distance", () => {
      const digit = crdt.allocateId(1, 4, true);
      expect(digit > 1 && digit < 4).toBeTruthy();
    });

    it("returns digit within max - boundary when strategy is - and boundary < distance", () => {
      const digit = crdt.allocateId(1, 9, false);
      expect(digit >= 4 && digit < 9).toBeTruthy();
    });

    it("returns digit between min and max when strategy is - and boundary > distance", () => {
      const digit = crdt.allocateId(1, 4, false);
      expect(digit > 1 && digit < 4).toBeTruthy();
    });
  });

  describe("updateText", () => {
    let crdt;
    let siteCounter;

    beforeEach(() => {
      siteCounter = Math.floor(Math.random() * 1000);
      crdt = new CRDT(mockController);
    });

    it("returns empty text when CRDT is empty", () => {
      expect(crdt.text).toBe("");
    });

    it("returns char value when char is inserted", () => {
      const position = [new Identifier(1, siteId)];
      const char1 = new Char('A', siteCounter, siteId, position);

      crdt.insertChar(char1);
      expect(crdt.text).toBe("A")
    });

    it('removes a char from the crdt', () => {
      const position = [new Identifier(1, siteId)];
      const char1 = new Char('A', siteCounter, siteId, position);

      crdt.insertChar(char1);
      expect(crdt.text).toBe("A");

      crdt.deleteChar(char1);
      expect(crdt.text).toBe("");
    });
  });

  describe("findIndexByPosition", () => {
    let mockController;
    let crdt;
    let siteId;
    let siteCounter;
    let char1;
    let char2;

    beforeEach(() => {
      siteId = Math.floor(Math.random() * 1000);
      siteCounter = Math.floor(Math.random() * 1000);
      mockController = {
        siteId: siteId,
        broadcastInsertion: function() {},
        updateEditor: function() {},
      }
      crdt = new CRDT(mockController);
      char1 = new Char('A', siteCounter, siteId, [new Identifier(1, siteId)]);
      char2 = new Char('B', siteCounter + 1, siteId, [new Identifier(3, siteId)]);
    });

    it ("throws error when crdt is empty", () => {
      expect(() => crdt.findIndexByPosition(char1)).toThrow(new Error("Character does not exist in CRDT."));
    });

    it("returns the index of a char when found in crdt", () => {
      crdt.insertChar(char1);
      crdt.insertChar(char2);
      const index = crdt.findIndexByPosition(char2);
      expect(index).toBe(1);
    });

    it("throws error if char doesn't exist in crdt", () => {
      crdt.insertChar(char1);
      expect(() => crdt.deleteChar(char2)).toThrow(new Error("Character does not exist in CRDT."));
    });
  });

  describe("findInsertIndex", () => {
    let mockController;
    let crdt;
    let siteId;
    let siteCounter;
    let char1;
    let char2;
    let char3;

    beforeEach(() => {
      siteId = Math.floor(Math.random() * 1000);
      siteCounter = Math.floor(Math.random() * 1000);
      mockController = {
        siteId: siteId,
        broadcastInsertion: function() {},
        updateEditor: function() {},
      }
      crdt = new CRDT(mockController);
      char1 = new Char('A', siteCounter, siteId, [new Identifier(1, siteId)]);
      char2 = new Char('B', siteCounter + 1, siteId, [new Identifier(3, siteId)]);
      char3 = new Char('C', siteCounter + 2, siteId, [new Identifier(5, siteId)]);
    });

    it ("returns 0 if array is empty", () => {
      expect(crdt.findInsertIndex(char1)).toBe(0);
    });

    it ("returns 0 if char position is less than first char", () => {
      crdt.insertChar(char2);
      expect(crdt.struct.length).toBe(1);
      expect(crdt.findInsertIndex(char1)).toBe(0);
    });

    it ("returns length if array if char position is greater than last char", () => {
      crdt.insertChar(char1);
      crdt.insertChar(char2);
      expect(crdt.struct.length).toBe(2);
      expect(crdt.findInsertIndex(char3)).toBe(2);
    });

    it("returns the index of a char when found in crdt", () => {
      crdt.insertChar(char1);
      crdt.insertChar(char2);
      const index = crdt.findInsertIndex(char2);
      expect(index).toBe(1);
    });

    it("returns the index of where it would be located if it existed in the array", () => {
      crdt.insertChar(char1);
      crdt.insertChar(char3);
      const index = crdt.findInsertIndex(char2);
      expect(index).toBe(1);
    });
  });
});
