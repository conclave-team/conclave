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
