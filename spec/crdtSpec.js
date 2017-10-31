import {CRDT, Char, Identifier} from "../crdt";

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

      expect(crdt.print()).toBe('BA');
    });
  });

  describe('generatePosBetween', () => {
    const siteId = 1;
    const siteClock = 1;
    const crdt = new CRDT(siteId);

    it('returns a position with digit 5 when both positions are empty', () => {
      expect(
        crdt.generatePosBetween([], [])[0].digit
      ).toBe(5)
    });

    it('returns a position with digit 6 when first position digit is 2', () => {
      const pos1 = [new Identifier(2, siteId)];

      expect(
        crdt.generatePosBetween(pos1, [])[0].digit
      ).toBe(6)
    });

    it('returns a position with digit 4 when second position digit is 8', () => {
      const pos2 = [new Identifier(8, siteId)];

      expect(
        crdt.generatePosBetween([], pos2)[0].digit
      ).toBe(4)
    });

    it('returns a position half way between two positions when they have a difference of 1', () => {
      const pos1 = [new Identifier(2, siteId)];
      const pos2 = [new Identifier(3, siteId)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const combinedPositionDigits = newPos.map(id => id.digit).join('');

      expect(combinedPositionDigits).toBe('25');
    });

    it('returns a position half way between two positions when they have same digits but different siteIds', () => {
      const pos1 = [new Identifier(2, siteId)];
      const pos2 = [new Identifier(2, siteId + 1)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const combinedPositionDigits = newPos.map(id => id.digit).join('');

      expect(combinedPositionDigits).toBe('25');
    });

    it('returns a position halfway between two positions with multiple ids', () => {
      const pos1 = [new Identifier(2, siteId), new Identifier(4, siteId)];
      const pos2 = [new Identifier(2, siteId), new Identifier(8, siteId)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const combinedPositionDigits = newPos.map(id => id.digit).join('');

      expect(combinedPositionDigits).toBe('26');
    });

    it('generates a position even when position arrays are different lengths', () => {
      const pos1 = [new Identifier(2, siteId), new Identifier(2, siteId), new Identifier(4, siteId)];
      const pos2 = [new Identifier(2, siteId), new Identifier(8, siteId)];
      const newPos = crdt.generatePosBetween(pos1, pos2);
      const combinedPositionDigits = newPos.map(id => id.digit).join('');

      expect(combinedPositionDigits).toBe('25');
    });

    it('throws a sorting error if positions are sorted incorrectly', () => {
      const pos1 = [new Identifier(2, siteId + 1)];
      const pos2 = [new Identifier(2, siteId)];

      expect( function(){ crdt.generatePosBetween(pos1, pos2) }).toThrow(new Error("Fix Position Sorting"));
    });
  });
});
