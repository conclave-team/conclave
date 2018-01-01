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
    insertIntoEditor: function() {},
    deleteFromEditor: function() {},
  };

  describe("handleLocalInsert", () => {
    let crdt, pos;

    beforeEach(() => {
      crdt = new CRDT(mockController);
      pos = { line: 0, ch: 0 };
      spyOn(crdt.controller, 'broadcastInsertion');
      spyOn(crdt.vector, 'increment');
    });

    it("calls vector 'increment'", () => {
      crdt.handleLocalInsert('A', pos);
      expect(crdt.vector.increment).toHaveBeenCalled();
    });

    it("adds char to CRDT", () => {
      expect(crdt.totalChars()).toBe(0)
      crdt.handleLocalInsert('A', pos);
      expect(crdt.totalChars()).toBe(1);
    });

    it("calls broadcastInsertion", function() {
      crdt.handleLocalInsert('A', pos);
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
      expect(crdt.totalChars()).toBe(0)
      crdt.handleRemoteInsert(char1);
      expect(crdt.totalChars()).toBe(1);
    });

    it("sorts chars based on position", () => {
      const char2 = new Char('B', siteCounter + 1, siteId, [new Identifier(0, 0), new Identifier(5, 0)]);

      crdt.handleRemoteInsert(char1);
      crdt.handleRemoteInsert(char2);
      expect(crdt.struct[0]).toEqual([char2, char1]);
      expect(crdt.toText()).toBe('BA');
    });

    it("calls insertIntoEditor", function() {
      crdt.handleRemoteInsert(char1);
      expect(crdt.controller.insertIntoEditor).toHaveBeenCalled();
    });
  });

  describe("insertChar", () => {
    let crdt, char, siteCounter, pos, newlineChar;

    beforeEach(() => {
      crdt = new CRDT(mockController);
      siteCounter = 1;
      char = new Char('A', siteCounter, siteId, [new Identifier(2, siteId)]);
      newlineChar = new Char('\n', siteCounter + 1, siteId, [new Identifier(1, siteId)]);
      pos = { line: 1, ch: 0 };
    });

    it("adds a new line to struct if non-newline char is inserted on a new line", () => {
      expect(crdt.struct.length).toBe(1);
      crdt.insertChar(char, pos);
      expect(crdt.struct.length).toBe(2);
    });

    it("adds a new char to correct line in the crdt", () => {
      crdt.insertChar(newlineChar, pos);
      expect(crdt.struct[1].length).toBe(1);
    });

    it("splits line into two lines when a newline is inserted before the last char of a line ", () => {
      crdt.insertChar(char, pos);
      expect(crdt.struct.length).toBe(2);
      crdt.insertChar(newlineChar, pos)
      expect(crdt.struct.length).toBe(3);
    });
  });

  describe("handleLocalDelete", () => {
    let crdt, char1, char2, startPos, endPos;

    beforeEach(() => {
      crdt = new CRDT(mockController);
      char1 = new Char("a", 1, siteId, [new Identifier(1, 25)]);
      char2 = new Char("b", 2, siteId, [new Identifier(2, 25)]);
      startPos = { line: 0, ch: 0 };
      endPos = { line: 0, ch: 1 };
      crdt.handleRemoteInsert(char1);
      crdt.handleRemoteInsert(char2);
    });

    it("deletes the correct character", () => {
      expect(crdt.struct[0]).toEqual([char1, char2]);
      crdt.handleLocalDelete(startPos, endPos);
      expect(crdt.struct[0]).toEqual([char2]);
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
      expect(crdt.totalChars()).toBe(1);
      crdt.handleRemoteDelete(char);
      expect(crdt.totalChars()).toBe(0);
    });

    it("updates the crdt's text", () => {
      expect(crdt.toText()).toBe('A');
      crdt.handleRemoteDelete(char);
      expect(crdt.toText()).toBe('');
    });

    it("calls deleteFromEditor", function() {
      crdt.handleRemoteDelete(char);
      expect(crdt.controller.deleteFromEditor).toHaveBeenCalled();
    });
  });

  describe("generateChar", () => {
    let crdt, char, pos;

    beforeEach(() => {
      crdt = new CRDT(mockController);
      pos = { line: 0, ch: 0 };
      crdt.vector.increment();
      char = crdt.generateChar("A", pos);
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
      const newDigit = crdt.generatePosBetween(pos1, pos2)[0].digit

      expect(digit1 < newDigit && newDigit < digit2).toBeTruthy();
    });

    it('returns (digit1 < newDigit <= digit1 + boundary) when difference is greater than 1 and greater than boundary', () => {
      const digit1 = 1;
      const digit2 = 10;
      const pos1 = [new Identifier(digit1, siteId)];
      const pos2 = [new Identifier(digit2, siteId)];
      const newDigit = crdt.generatePosBetween(pos1, pos2)[0].digit

      expect(digit1 < newDigit && newDigit <= (digit1 + crdt.boundary)).toBeTruthy();
    });

    it('returns (226 (base - boundary) < newCombinedDigit < 2.32 (base)) when two positions have a difference of 1 and 2nd level is empty', () => {
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
      expect(crdt.toText()).toBe("");
    });

    it("returns char value when char is inserted", () => {
      const position = [new Identifier(1, siteId)];
      const char1 = new Char('A', siteCounter, siteId, position);

      crdt.handleRemoteInsert(char1);
      expect(crdt.toText()).toBe("A")
    });

    it('removes a char from the crdt', () => {
      const position = [new Identifier(1, siteId)];
      const char1 = new Char('A', siteCounter, siteId, position);

      crdt.handleRemoteInsert(char1);
      expect(crdt.toText()).toBe("A");

      crdt.handleRemoteDelete(char1);
      expect(crdt.toText()).toBe("");
    });
  });

  describe("findIndexInLine", () => {
    let crdt, siteId, siteCounter, char1, char2, char3, line1;

    beforeEach(() => {
      siteId = Math.floor(Math.random() * 1000);
      siteCounter = Math.floor(Math.random() * 1000);
      crdt = new CRDT(mockController);
      char1 = new Char('A', siteCounter, siteId, [new Identifier(1, siteId)]);
      char2 = new Char('B', siteCounter + 1, siteId, [new Identifier(3, siteId)]);
      char3 = new Char('C', siteCounter + 2, siteId, [new Identifier(5, siteId)]);
      line1 = crdt.struct[0];
    });

    it ("returns 0 if array is empty", () => {
      expect(crdt.findIndexInLine(char1, line1)).toBe(0);
    });

    it ("returns 0 if char position is less than first char", () => {
      crdt.handleRemoteInsert(char2, 0);
      expect(crdt.totalChars()).toBe(1);
      expect(crdt.findIndexInLine(char1, line1)).toBe(0);
    });

    it("returns the index of a char when found in crdt", () => {
      crdt.handleRemoteInsert(char1);
      crdt.handleRemoteInsert(char2);
      const index = crdt.findIndexInLine(char2, line1);
      expect(index).toBe(1);
    });

    it("returns the index of where it would be located if it existed in the array", () => {
      crdt.handleRemoteInsert(char1);
      crdt.handleRemoteInsert(char3);
      const index = crdt.findIndexInLine(char2, line1);
      expect(index).toBeFalsy();
    });
  });
});
