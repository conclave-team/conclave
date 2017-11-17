import CRDT from '../lib/crdtLinear';
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
    replaceText: function() {},
    insertIntoEditor: function() {},
    deleteFromEditor: function() {},
  };

  describe("handleLocalInsert", () => {
    let crdt;

    beforeEach(() => {
      crdt = new CRDT(mockController);
      spyOn(crdt.controller, 'broadcastInsertion');
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
  });

  describe("handleRemoteInsert", () => {
    let crdt;
    let char1;
    let siteCounter;

    beforeEach(() => {
      crdt = new CRDT(mockController);
      siteCounter = 1;
      const position = [new Identifier(1, siteId)];
      char1 = new Char('A', siteCounter, siteId, position);
      spyOn(crdt.controller, 'insertIntoEditor');
    });

    it("adds char to CRDT", () => {
      expect(crdt.struct.length).toBe(0)
      crdt.handleRemoteInsert(char1);
      expect(crdt.struct.length).toBe(1);
    });

    it("sorts chars based on position", () => {
      const char2 = new Char('B', siteCounter + 1, siteId, [new Identifier(0, 0), new Identifier(5, 0)]);

      crdt.handleRemoteInsert(char1);
      crdt.handleRemoteInsert(char2);
      expect(crdt.struct).toEqual([char2, char1]);
      expect(crdt.text).toBe('BA');
    });

    it("inserts the char value into the text property", () => {
      expect(crdt.text).toBe('');
      crdt.handleRemoteInsert(char1);
      expect(crdt.text).toBe('A');
    });

    it("calls insertIntoEditor", function() {
      crdt.handleRemoteInsert(char1);
      expect(crdt.controller.insertIntoEditor).toHaveBeenCalled();
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
      crdt.handleRemoteInsert(char1);
      crdt.handleRemoteInsert(char2);
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

  describe('handleRemoteDelete', () => {
    let crdt;
    let char;
    let position;
    let siteCounter;

    beforeEach(() => {
      crdt = new CRDT(mockController);
      siteCounter = Math.floor(Math.random() * 1000);
      position = [new Identifier(1, siteId)];
      char = new Char('A', siteCounter, siteId, position);
      crdt.handleRemoteInsert(char);
      spyOn(crdt.controller, 'deleteFromEditor');
    });

    it('removes a char from the crdt', () => {
      expect(crdt.struct.length).toBe(1);
      crdt.handleRemoteDelete(char);
      expect(crdt.struct.length).toBe(0);
    });

    it("updates the crdt's text", () => {
      expect(crdt.text).toBe('A');
      crdt.handleRemoteDelete(char);
      expect(crdt.text).toBe('');
    });

    it("calls deleteFromEditor", function() {
      crdt.handleRemoteDelete(char);
      expect(crdt.controller.deleteFromEditor).toHaveBeenCalled();
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
      const base = 16;
      const boundary = 5;
      const strategy = 'every2nd';
      crdt = new CRDT(mockController, base, boundary, strategy);
    });

    it('returns (0 < newDigit <= boundary) when both positions are empty', () => {
      const newDigit = crdt.generatePosBetween([], [])[0].digit;

      expect(0 < newDigit && newDigit <= crdt.boundary).toBeTruthy();
    });

    it('returns (0 < newDigit < digit2) when 1st position is empty', () => {
      const digit2 = 3;
      const pos2 = [new Identifier(digit2, siteId)];
      const newDigit = crdt.generatePosBetween([], pos2)[0].digit;

      expect(0 < newDigit && newDigit < digit2).toBeTruthy();
    });

    it('returns (digit1 < newDigit <= digit1 + boundary) when 2nd position is empty', () => {
      const digit1 = 2;
      const pos1 = [new Identifier(digit1, siteId)];
      const newDigit = crdt.generatePosBetween(pos1, [])[0].digit

      expect(digit1 < newDigit && newDigit <= (digit1 + crdt.boundary)).toBeTruthy();
    });

    it('returns (digit1 < newDigit < digit2) when difference is greater than 1 and less than boundary', () => {
      const digit1 = 1;
      const digit2 = 4;
      const pos1 = [new Identifier(digit1, siteId)];
      const pos2 = [new Identifier(digit2, siteId)];
      const newDigit = crdt.generatePosBetween(pos1, pos2)[0].digit;

      expect(digit1 < newDigit && newDigit < digit2).toBeTruthy();
    });

    it('returns (digit1 < newDigit <= digit1 + boundary) when difference is greater than 1 and greater than boundary', () => {
      const digit1 = 1;
      const digit2 = 10;
      const pos1 = [new Identifier(digit1, siteId)];
      const pos2 = [new Identifier(digit2, siteId)];
      const newDigit = crdt.generatePosBetween(pos1, pos2)[0].digit;

      expect(digit1 < newDigit && newDigit <= (digit1 + crdt.boundary)).toBeTruthy();
    });

    it('returns (2.26 (base - boundary) < newCombinedDigit < 2.32 (base)) when two positions have a difference of 1 and 2nd level is empty', () => {
      const digit1 = 2;
      const digit2 = 3;
      const pos1 = [new Identifier(digit1, siteId)];
      const pos2 = [new Identifier(digit2, siteId)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const newCombinedDigit = +newPos.map(id => id.digit).join('');

      expect(226 < newCombinedDigit && newCombinedDigit < 232).toBeTruthy();
    });

    it('returns (228 (base - digit1b) < newCombinedDigit < 2.32 (base)) when two positions have a difference of 1 and 2nd level is not empty', () => {
      const digit1a = 2;
      const digit1b = 28;
      const digit2 = 3;
      const pos1 = [new Identifier(digit1a, siteId), new Identifier(digit1b, siteId)];
      const pos2 = [new Identifier(digit2, siteId)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const newCombinedDigit = +newPos.map(id => id.digit).join('');

      expect(228 < newCombinedDigit && newCombinedDigit < 232).toBeTruthy();
    });

    it('returns (226 (base - boundary) < newCombinedDigit < 2.32 (base)) when same positions and pos1.siteID < pos2.siteId', () => {
      const digit = 2;
      const pos1 = [new Identifier(digit, siteId)];
      const pos2 = [new Identifier(digit, siteId + 1)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const newCombinedDigit = newPos.map(id => id.digit).join('');

      expect(226 < newCombinedDigit && newCombinedDigit < 232).toBeTruthy();
    });

    it('returns (24 < newCombinedDigit < 28) with same 1st level ids and 2nd level ids diff greater than 1', () => {
      const pos1 = [new Identifier(2, siteId), new Identifier(4, siteId)];
      const pos2 = [new Identifier(2, siteId), new Identifier(8, siteId)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const newCombinedDigit = +newPos.map(id => id.digit).join('');

      expect(24 < newCombinedDigit && newCombinedDigit < 28).toBeTruthy();
    });

    it('generates a position even when position arrays are different lengths', () => {
      const pos1 = [new Identifier(2, siteId), new Identifier(2, siteId), new Identifier(4, siteId)];
      const pos2 = [new Identifier(2, siteId), new Identifier(8, siteId)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const newCombinedDigit = +newPos.map(id => id.digit).join('');

      expect(22 < newCombinedDigit && newCombinedDigit < 28).toBeTruthy();
    });

    it('throws a sorting error if positions are sorted incorrectly', () => {
      const pos1 = [new Identifier(2, siteId + 1)];
      const pos2 = [new Identifier(2, siteId)];

      expect( function(){ crdt.generatePosBetween(pos1, pos2) }).toThrow(new Error("Fix Position Sorting"));
    });
  });

  describe("generateIdBetween", () => {
    let crdt;

    beforeEach(() => {
      const base = 16;
      const boundary = 5;
      const strategy = 'every2nd';
      crdt = new CRDT(mockController, base, boundary, strategy);
    });

    it("returns digit within min + boundary when strategy is + and boundary < distance", () => {
      const digit = crdt.generateIdBetween(1, 9, '+');
      expect(digit > 1 && digit <= 6).toBeTruthy();
    });

    it("returns digit between min and max when strategy is + and boundary > distance", () => {
      const digit = crdt.generateIdBetween(1, 4, '+');
      expect(digit > 1 && digit < 4).toBeTruthy();
    });

    it("returns digit within max - boundary when strategy is - and boundary < distance", () => {
      const digit = crdt.generateIdBetween(1, 9, '-');
      expect(digit >= 4 && digit < 9).toBeTruthy();
    });

    it("returns digit between min and max when strategy is - and boundary > distance", () => {
      const digit = crdt.generateIdBetween(1, 4, '-');
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

      crdt.handleRemoteInsert(char1);
      expect(crdt.text).toBe("A")
    });

    it('removes a char from the crdt', () => {
      const position = [new Identifier(1, siteId)];
      const char1 = new Char('A', siteCounter, siteId, position);

      crdt.handleRemoteInsert(char1);
      expect(crdt.text).toBe("A");

      crdt.handleRemoteDelete(char1);
      expect(crdt.text).toBe("");
    });
  });

  describe("findIndexByPosition", () => {
    let crdt;
    let siteId;
    let siteCounter;
    let char1;
    let char2;

    beforeEach(() => {
      siteId = Math.floor(Math.random() * 1000);
      siteCounter = Math.floor(Math.random() * 1000);
      crdt = new CRDT(mockController);
      char1 = new Char('A', siteCounter, siteId, [new Identifier(1, siteId)]);
      char2 = new Char('B', siteCounter + 1, siteId, [new Identifier(3, siteId)]);
    });

    it ("throws error when crdt is empty", () => {
      expect(() => crdt.findIndexByPosition(char1)).toThrow(new Error("Character does not exist in CRDT."));
    });

    it("returns the index of a char when found in crdt", () => {
      crdt.handleRemoteInsert(char1);
      crdt.handleRemoteInsert(char2);
      const index = crdt.findIndexByPosition(char2);
      expect(index).toBe(1);
    });

    it("throws error if char doesn't exist in crdt", () => {
      crdt.handleRemoteInsert(char1);
      expect(() => crdt.handleRemoteDelete(char2)).toThrow(new Error("Character does not exist in CRDT."));
    });
  });

  describe("findInsertIndex", () => {
    let crdt;
    let siteId;
    let siteCounter;
    let char1;
    let char2;
    let char3;

    beforeEach(() => {
      siteId = Math.floor(Math.random() * 1000);
      siteCounter = Math.floor(Math.random() * 1000);
      crdt = new CRDT(mockController);
      char1 = new Char('A', siteCounter, siteId, [new Identifier(1, siteId)]);
      char2 = new Char('B', siteCounter + 1, siteId, [new Identifier(3, siteId)]);
      char3 = new Char('C', siteCounter + 2, siteId, [new Identifier(5, siteId)]);
    });

    it ("returns 0 if array is empty", () => {
      expect(crdt.findInsertIndex(char1)).toBe(0);
    });

    it ("returns 0 if char position is less than first char", () => {
      crdt.handleRemoteInsert(char2);
      expect(crdt.struct.length).toBe(1);
      expect(crdt.findInsertIndex(char1)).toBe(0);
    });

    it ("returns length if array if char position is greater than last char", () => {
      crdt.handleRemoteInsert(char1);
      crdt.handleRemoteInsert(char2);
      expect(crdt.struct.length).toBe(2);
      expect(crdt.findInsertIndex(char3)).toBe(2);
    });

    it("returns the index of a char when found in crdt", () => {
      crdt.handleRemoteInsert(char1);
      crdt.handleRemoteInsert(char2);
      const index = crdt.findInsertIndex(char2);
      expect(index).toBe(1);
    });

    it("returns the index of where it would be located if it existed in the array", () => {
      crdt.handleRemoteInsert(char1);
      crdt.handleRemoteInsert(char3);
      const index = crdt.findInsertIndex(char2);
      expect(index).toBe(1);
    });
  });

  describe('insertText', () => {
    let siteId;
    let siteCounter;
    let crdt;

    beforeEach(() => {
      siteId = Math.floor(Math.random() * 1000);
      siteCounter = Math.floor(Math.random() * 1000);
      crdt = new CRDT(mockController);
    });

    it('inserts character in the correct index', () => {
      crdt.text = 'tet';
      crdt.insertText('s', 2);
      expect(crdt.text).toBe('test');
    });
  });

  describe('deleteText', () => {
    let siteId;
    let siteCounter;
    let crdt;

    beforeEach(() => {
      siteId = Math.floor(Math.random() * 1000);
      siteCounter = Math.floor(Math.random() * 1000);
      crdt = new CRDT(mockController);
    });

    it('deletes character in the correct index', () => {
      crdt.text = 'tester';
      crdt.deleteText(4);
      expect(crdt.text).toBe('testr');
    });
  });
});
