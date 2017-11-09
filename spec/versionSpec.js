import Version from '../lib/version';

describe('Version', () => {
  let siteId, version;

  beforeEach(() => {
    siteId = Math.floor(Math.random() * 1000);
    version = new Version(siteId);
  });

  describe('constructor', () => {
    it('initializes with counter at 0', () => {
      expect(version.counter).toBe(0);
    });
  });

  describe('update', () => {
    it('increments counter by one it counter is greater by 1', () => {
      version.update({sideId: siteId, counter: 1});

      expect(version.counter).toBe(1);
    });

    it('does not increment counter if remote counter is less than current', () => {
      version.update({sideId: siteId, counter: -1});

      expect(version.counter).toBe(0);
    });

    it('does not increment counter if remote counter is equal to current', () => {
      version.update({sideId: siteId, counter: 0});

      expect(version.counter).toBe(0);
    });

    it('creates exceptions if remote counter is greater than current by more than 1', () => {
      version.update({sideId: siteId, counter: 2});

      expect(version.exceptions.includes(1)).toBe(true);
    });

    it('removes exceptions if remote counter is less than current and exists in exceptions', () => {
      version.update({sideId: siteId, counter: 2});
      expect(version.exceptions.includes(1)).toBe(true);

      version.update({sideId: siteId, counter: 1});
      expect(version.exceptions.includes(1)).toBe(false);
    });
  });
});
