import {CRDT, Char, Identifier} from "../crdt";

describe("CRDT", () => {
  describe("insertChar", () => {


    it("adds char to CRDT", () => {
      const siteId = 1;
      const siteClock = 1;
      const id1 = new Identifier(1, siteId);
      const position = [id1]
      const char1 = new Char('A', siteClock, position);
      const crdt = new CRDT(siteId);

      expect(crdt.length).toBe(0)

      crdt.insertChar(char1);
      expect(crdt.length).toBe(1);
    });

    it("returns new length of the CRDT", () => {
      const siteId = 1;
      const siteClock = 1;
      const id1 = new Identifier(1, siteId);
      const position = [id1]
      const char1 = new Char('A', siteClock, position);
      const crdt = new CRDT(siteId);

      expect(crdt.insertChar(char1)).toBe(1);
    });
  });

  describe('generatePosBetween', () => {
    it('returns a position of 5 when both identifiers are blank')
  });
});
