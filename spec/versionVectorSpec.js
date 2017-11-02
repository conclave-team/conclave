import VersionVector from "../lib/VersionVector";

describe("VersionVector", () => {
  describe('constructor', () => {
    const vector = new VersionVector(10);

    it('initializes a local property', () => {
      expect(vector.local).toBeTruthy();
    });

    it('initializes a all property', () => {
      expect(vector.all).toBeTruthy();
    });

    it('puts local vector in the all vector', () => {
      expect(vector.all.indexOf(vector.local)).not.toBe(-1);
    });
  });

  describe('increment', () => {
    it('increments the local counter', () => {
      const vector = new VersionVector(10);
      vector.increment();

      expect(vector.local.counter).toBe(1);
    });

    it('increments the version in the all arr as well', () => {
      const vector = new VersionVector(10);
      vector.increment();
      expect(vector.all.get(0).counter).toBe(1);
    });
  });

  describe('incrementFrom', () => {
    it('increments the version if the entry exists in the all arr', () => {
      const vector = new VersionVector(10);
      vector.incrementFrom({siteId: 10, counter: 1});

      expect(vector.all.get(0).counter).toBe(1);
    });

    it('creates the entry if it does not exist and then increments', () => {
      const vector = new VersionVector(10);

      expect(vector.all.get(0).siteId).toBe(10);
      vector.incrementFrom({siteId: 5, counter: 1});

      expect(vector.all.get(0).siteId).toBe(5);
      expect(vector.all.get(0).counter).toBe(1);
    });
  });

  describe('comparator', () => {
    const vector1 = new VersionVector(10);
    const vector2 = new VersionVector(20);

    it('returns -1 if first vector site is less than second', () => {
      const ver1 = vector1.local;
      const ver2 = vector2.local;
      expect(vector1.comparator(ver1, ver2)).toBe(-1);
    });

    it('returns 1 if first vector site is greater than second', () => {
      const ver1 = vector1.local;
      const ver2 = vector2.local;
      expect(vector1.comparator(ver2, ver1)).toBe(1);
    });

    it('returns 0 if first vector site is same as second', () => {
      const ver1 = vector1.local;
      expect(vector1.comparator(ver1, ver1)).toBe(0);
    });
  });
});
