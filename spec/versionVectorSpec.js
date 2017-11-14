import VersionVector from "../lib/VersionVector";

describe("VersionVector", () => {
  describe('constructor', () => {
    const vector = new VersionVector(10);

    it('initializes a local property on the object', () => {
      expect(vector.localVersion).toBeTruthy();
    });

    it('initializes a Versions property', () => {
      expect(vector.versions).toBeTruthy();
    });

    it('puts local vector in the all vector', () => {
      expect(vector.versions[0].siteId).toBe(10);
    });
  });

  describe('increment', () => {
    it('increments the counter in the local property', () => {
      const vector = new VersionVector(10);

      expect(vector.localVersion.counter).toBe(0);

      vector.increment();
      expect(vector.localVersion.counter).toBe(1);
    });

    it('increments the counter of the version in the Versions array', () => {
      const vector = new VersionVector(10);
      vector.increment();

      expect(vector.versions[0].counter).toBe(1)
    });
  });

  describe('update', () => {
    it('increments the version if the entry exists in the all arr', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 1});

      expect(vector.versions[0].counter).toBe(1);
    });

    it('creates the entry if it does not exist and then increments', () => {
      const vector = new VersionVector(10);

      expect(vector.versions[0].siteId).toBe(10);
      vector.update({siteId: 5, counter: 1});

      expect(vector.versions[1].siteId).toBe(5);
      expect(vector.versions[1].counter).toBe(1);
    });

    it('creates exceptions if version counter is greater by more than 1', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 2});

      expect(vector.versions[0].exceptions.includes(1)).toBe(true);
    });

    it('does not update version counter if remote version counter is equal to current counter', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 0});

      expect(vector.versions[0].counter).toBe(0);
    });

    it('does not update version counter if remote version counter is less than current counter', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: -1});
      expect(vector.versions[0].counter).toBe(0);
    });

    it('removes exceptions if counter exists in exceptions set', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 2});
      expect(vector.versions[0].exceptions.includes(1)).toBe(true);

      vector.update({siteId: 10, counter: 1});
      expect(vector.versions[0].exceptions.includes(1)).toBe(false);
    });
  });

  describe('hasBeenApplied', () => {
    it('returns true if remote counter is equal to or less than local version counter and no exceptions', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 1});
      vector.update({siteId: 10, counter: 2});

      expect(vector.hasBeenApplied({siteId: 10, counter: 1})).toBe(true);
      expect(vector.hasBeenApplied({siteId: 10, counter: 2})).toBe(true);
    });

    it('returns false if version does not exist', () => {
      const vector = new VersionVector(10);

      expect(vector.hasBeenApplied({siteId: 5, counter: 1})).toBe(false);
    });

    it('returns false if version counter is greater than stored version', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 1});

      expect(vector.hasBeenApplied({siteId: 10, counter: 2})).toBe(false);
    });

    it('returns false if version counter is in exceptions', () => {
      const vector = new VersionVector(10);
      vector.update({siteId: 10, counter: 2});

      expect(vector.hasBeenApplied({siteId: 10, counter: 1})).toBe(false);
    });
  });
});
