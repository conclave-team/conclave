import {CRDT, Char, Identifier} from "../crdt";

describe("CRDT", () => {
  describe("Local Insertion", () => {
    it("adds char to CRDT", () => {
      const siteId = 1;
      const siteClock = 1;

      const crdt = new CRDT(siteId);
      const id1 = new Identifier(1, siteId);
      const position = [id1]
      const char1 = new Char('A', siteClock, position);

      crdt.localInsert(char1);

      expect(crdt.length).toBe(1);
    });
  });
});
