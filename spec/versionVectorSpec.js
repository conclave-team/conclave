import VersionVector from "../lib/VersionVector";

describe("VersionVector", () => {
  describe('constructor', () => {
    const vector = new VersionVector(10);

    it('initializes a allVersions property', () => {
      expect(vector.allVersions).toBeTruthy();
    });

    it('puts local vector in the all vector', () => {
      expect(vector.allVersions.get(0).siteId).toBe(10);
    });
  });

  describe('increment', () => {
    
  });

  describe('update', () => {
    it('increments the version if the entry exists in the all arr', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 1});

      expect(vector.allVersions.get(0).counter).toBe(1);
    });

    it('creates the entry if it does not exist and then increments', () => {
      const vector = new VersionVector(10);

      expect(vector.allVersions.get(0).siteId).toBe(10);
      vector.update({siteId: 5, counter: 1});

      expect(vector.allVersions.get(0).siteId).toBe(5);
      expect(vector.allVersions.get(0).counter).toBe(1);
    });

    it('creates exceptions if version counter is greater by more than 1', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 2});

      expect(vector.allVersions.get(0).exceptions.has(1)).toBe(true);
    });

    it('does not update version counter if remote version counter is equal to current counter', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 0});

      expect(vector.allVersions.get(0).counter).toBe(0);
    });

    it('does not update version counter if remote version counter is less than current counter', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: -1});
      expect(vector.allVersions.get(0).counter).toBe(0);
    });

    it('removes exceptions if counter exists in exceptions set', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 2});
      expect(vector.allVersions.get(0).exceptions.has(1)).toBe(true);

      vector.update({siteId: 10, counter: 1});
      expect(vector.allVersions.get(0).exceptions.has(1)).toBe(false);
    });
  });

  describe('comparator', () => {
    const vector = new VersionVector(1);
    const version1 = {siteId: 5, counter: 1};
    const version2 = {siteId: 10, counter: 1};

    it('returns -1 if first vector site is less than second', () => {
      expect(vector.comparator(version1, version2)).toBe(-1);
    });

    it('returns 1 if first vector site is greater than second', () => {
      expect(vector.comparator(version2, version1)).toBe(1);
    });

    it('returns 0 if first vector site is same as second', () => {
      expect(vector.comparator(version1, version1)).toBe(0);
    });
  });

  describe('isDuplicate', () => {
    // it('returns false if version is undefined or null', () => {
    //   expect(vector.isDuplicate(null)).toBe(false);
    //   expect(vector.isDuplicate(undefined)).toBe(false);
    // });

    it('returns true if remote counter is equal to or less than local version counter and no exceptions', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 1});
      vector.update({siteId: 10, counter: 2});

      expect(vector.isDuplicate({siteId: 10, counter: 1})).toBe(true);
      expect(vector.isDuplicate({siteId: 10, counter: 2})).toBe(true);
    });

    it('returns false if version does not exist', () => {
      const vector = new VersionVector(10);

      expect(vector.isDuplicate({siteId: 5, counter: 1})).toBe(false);
    });

    it('returns false if version counter is greater than stored version', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 1});

      expect(vector.isDuplicate({siteId: 10, counter: 2})).toBe(false);
    });

    it('returns false if version counter is in exceptions', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 2});

      expect(vector.isDuplicate({siteId: 10, counter: 1})).toBe(false);
    });
  });
});
