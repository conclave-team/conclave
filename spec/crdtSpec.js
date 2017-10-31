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

  describe("localInsert", () => {
    it("creates char with value", () => {
      const siteId = 1;
      const siteClock = 1;

      const crdt = new CRDT(siteId);
      const char = crdt.localInsert('A', 0);

      expect(char.value).toBe('A');
    });

    it("increments the local counter", () => {
      const siteId = 1;
      const siteClock = 1;

      const crdt = new CRDT(siteId);
      const char = crdt.localInsert('A', 0);

      expect(crdt.counter).toBe(1);
    });
  });

  describe("updateText", () => {
    it("returns empty text when CRDT is empty", () => {
      const siteId = 1;
      const crdt = new CRDT(siteId);
      expect(crdt.text).toBe("");
    });

    it("returns char's value when car is added to CRDT", () => {
      const siteId = 1;
      const siteClock = 1;

      const crdt = new CRDT(siteId);
      const id1 = new Identifier(1, siteId);
      const position = [id1]
      const char1 = new Char('A', siteClock, position);

      const newLength = crdt.insertChar(char1);

      expect(crdt.text).toBe("A")
    });
  });
});

describe("Identifier", () => {
  describe("compareTo", () => {
    it("compares itself to an id with a larger digit", () => {
      const siteId1 = 1;
      const siteId2 = 20;
      const id1 = new Identifier(1, siteId1);
      const id2 = new Identifier(2, siteId2);

      const comparator = id1.compareTo(id2);
      expect(comparator).toBe(-1);
    });

    it("compares itself to an id with a smaller digit", () => {
      const siteId1 = 1;
      const siteId2 = 20;
      const id1 = new Identifier(2, siteId1);
      const id2 = new Identifier(1, siteId2);

      const comparator = id1.compareTo(id2);
      expect(comparator).toBe(1);
    });

    it("compares itself to an id with a larger siteId", () => {
      const siteId1 = 2;
      const siteId2 = 1;
      const id1 = new Identifier(1, siteId1);
      const id2 = new Identifier(2, siteId2);

      const comparator = id1.compareTo(id2);
      expect(comparator).toBe(-1);
    });

    it("compares itself to an id with a smaller siteId", () => {
      const siteId1 = 2;
      const siteId2 = 1;
      const id1 = new Identifier(2, siteId1);
      const id2 = new Identifier(1, siteId2);

      const comparator = id1.compareTo(id2);
      expect(comparator).toBe(1);
    });

    it("compares itself to an id with the same digit and site", () => {
      const siteId1 = 1;
      const siteId2 = 1;
      const id1 = new Identifier(1, siteId1);
      const id2 = new Identifier(1, siteId2);

      const comparator = id1.compareTo(id2);
      expect(comparator).toBe(0);
    });
  });
});
