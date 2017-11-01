import CRDT from "../lib/crdt";
import Identifier from '../lib/identifier';
import Char from '../lib/char';

describe("CRDT", () => {
  describe("insertChar", () => {
    const siteId = 1;
    const siteClock = 1;
    const id1 = new Identifier(1, siteId);
    const position = [id1]
    const char1 = new Char('A', siteClock, position);

    it("adds char to CRDT", () => {
      const crdt = new CRDT(siteId);

      expect(crdt.length).toBe(0)

      crdt.insertChar(char1);
      expect(crdt.length).toBe(1);
    });

    it("returns new length of the CRDT", () => {
      const crdt = new CRDT(siteId);

      expect(crdt.insertChar(char1)).toBe(1);
    });

    it('does not increment counter', () => {
      const crdt = new CRDT(siteId);
      crdt.insertChar(char1);

      expect(crdt.counter).toBe(0);
    });

    it("Sorts the chars correctly", () => {
      const crdt = new CRDT(siteId);
      const char2 = new Char('B', siteClock + 1, [new Identifier(0, 0), new Identifier(5, 0)]);

      crdt.insertChar(char1);
      crdt.insertChar(char2);

      expect(crdt.text).toBe('BA');
    });
  });

  describe("generateChar", () => {
    let crdt;
    let newChar;

    beforeEach(() => {
      crdt = new CRDT(25);
      crdt.counter++;
      newChar = crdt.generateChar("A", 0);
    });

    it("returns a new Char object", () => {
      expect(newChar instanceof Char).toBe(true);
    });

    it("creates the Char with the correct value", () => {
      expect(newChar.value).toEqual("A");
    });

    it("creates the Char with the correct counter", () => {
      expect(newChar.counter).toEqual(1);
    });

    it("creates the Char with an array of position identifiers", () => {
      expect(newChar.position instanceof Array).toBe(true);
    });

    it("has at least one position identifier", () => {
      expect(newChar.position.length).toBeGreaterThan(0);
    })
  });

  describe("localInsert", () => {
    it("creates char with value, counter, and position", () => {
      const siteId = 1;
      const siteClock = 1;

      const crdt = new CRDT(siteId);
      const newChar = crdt.localInsert('A', 0);

      expect(newChar.value).toEqual('A');
      expect(newChar.counter).toEqual(1);
      expect(newChar.position instanceof Array).toBe(true);
    });

    it("increments the local counter", () => {
      const siteId = 1;
      const siteClock = 1;

      const crdt = new CRDT(siteId);
      const char = crdt.localInsert('A', 0);

      expect(crdt.counter).toEqual(1);
    });
  });

  describe("updateText", () => {
    it("returns empty text when CRDT is empty", () => {
      const siteId = 1;
      const crdt = new CRDT(siteId);
      expect(crdt.text).toEqual("");
    });

    it("returns char's value when car is added to CRDT", () => {
      const siteId = 1;
      const siteClock = 1;

      const crdt = new CRDT(siteId);
      const id1 = new Identifier(1, siteId);
      const position = [id1]
      const char1 = new Char('A', siteClock, position);

      const newLength = crdt.insertChar(char1);

      expect(crdt.text).toEqual("A")
    });
  });

  describe("localDelete", () => {
    let crdt;
    let a;
    let b;

    beforeEach(() => {
      crdt = new CRDT(25);
      a = new Char("a", 0, [new Identifier(1, 25)]);
      b = new Char("b", 0, [new Identifier(2, 25)]);
      crdt.insertChar(a);
      crdt.insertChar(b);
    });

    it("deletes the correct character", () => {
      crdt.localDelete(0);
      expect(crdt.struct).toEqual([b]);
    });

    it("increments the crdt's counter", () => {
      const oldCounter = crdt.counter;
      crdt.localDelete(0);
      expect(crdt.counter).toEqual(oldCounter + 1);
    });

    it("decreases the crdt's length property and returns it", () => {
      const oldLength = crdt.length;
      const newLength = crdt.localDelete(0);
      expect(newLength).toEqual(oldLength - 1);
    });
  });

  describe("sortByIdentifier", () => {
    let crdt = new CRDT(25);
    const a = new Char("a", 0, [new Identifier(2, 25)]);
    const b = new Char("b", 0, [new Identifier(1, 25)]);
    crdt.insertChar(a);
    crdt.insertChar(b);

    it("returns the sorted structure", () => {
      const sorted = crdt.sortByIdentifier();
      expect(sorted).toEqual([b, a]);
    });
  });

  describe('generatePosBetween', () => {
    const siteId = 1;
    const siteClock = 1;
    const crdt = new CRDT(siteId);

    it('returns a position with digit in (1...boundary) when both arrays are empty', () => {
      const digit = crdt.generatePosBetween([], [])[0].digit;

      expect(digit > 0 && digit <= crdt.boundary).toBeTruthy();
    });

    it('returns a position with digit in (3..7) when first position digit is 2', () => {
      const pos1 = [new Identifier(2, siteId)];
      const digit = crdt.generatePosBetween(pos1, [])[0].digit

      expect(digit > 2 && digit <= (2 + crdt.boundary)).toBeTruthy();
    });

    it('returns a position with digit in (1..2) when second position digit is 3', () => {
      const pos2 = [new Identifier(3, siteId)];
      const digit = crdt.generatePosBetween([], pos2)[0].digit;

      expect(digit > 0 && digit < 3).toBeTruthy();
    });

    it('returns a position with second digit in (27..31) when two positions have a difference of 1', () => {
      const pos1 = [new Identifier(2, siteId)];
      const pos2 = [new Identifier(3, siteId)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const combinedPositionDigits = +newPos.map(id => id.digit).join('');

      expect(combinedPositionDigits > 226 && combinedPositionDigits < 232).toBeTruthy();
    });

    it('returns a position with second digit in (27) when same positions but different siteIds', () => {
      const pos1 = [new Identifier(2, siteId)];
      const pos2 = [new Identifier(2, siteId + 1)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const combinedPositionDigits = newPos.map(id => id.digit).join('');

      expect(combinedPositionDigits > 226 && combinedPositionDigits < 232).toBeTruthy();
    });

    it('returns a position between two positions with multiple ids', () => {
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

  describe('deleteChar', () => {
    const siteId = 1;
    const siteClock = 1;
    const id1 = new Identifier(1, siteId);
    const position = [id1]
    const char1 = new Char('A', siteClock, position);

    it('removes a char from the crdt', () => {
      const crdt = new CRDT(siteId);

      crdt.insertChar(char1);
      expect(crdt.length).toBe(1);

      crdt.deleteChar(char1);
      expect(crdt.length).toBe(0);
    });

    it("throws error if char couldn't be found", () => {
      const crdt = new CRDT(siteId);

      expect(
        () => crdt.deleteChar(char1)
      ).toThrow(new Error("Character could not be found"));
    });
  });

  describe('incrementCounter', () => {
    it('increments the counter of the CRDT', () => {
      const crdt = new CRDT(1);

      expect(crdt.counter).toBe(0);
      crdt.incrementCounter();
      expect(crdt.counter).toBe(1);
    });
  });
});
