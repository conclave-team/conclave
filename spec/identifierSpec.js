import Identifier from '../lib/identifier';

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
