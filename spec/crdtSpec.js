import {CRDT, Char, Identifier} from "../crdt";

describe("CRDT", () => {
  describe("insertChar", () => {
    it("adds char to CRDT", () => {
      const siteId = 1;
      const siteClock = 1;

      const crdt = new CRDT(siteId);
      const id1 = new Identifier(1, siteId);
      const position = [id1]
      const char1 = new Char('A', siteClock, position);

      const newLength = crdt.insertChar(char1);

      expect(newLength).toBe(1);
    });
  });

  // describe('localInsert', () => {
  //
  // });
});
