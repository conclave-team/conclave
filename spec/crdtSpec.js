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
});
