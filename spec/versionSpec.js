import Version from '../lib/version';

describe('Version', () => {
  describe('constructor', () => {
    const version = new Version(10);
    it('initializes with counter at 0', () => {
      expect(version.counter).toBe(0);
    });
  });

  describe('increment', () => {
    it('increments the counter by 1', () => {
      const version = new Version(10);
      version.increment();
      expect(version.counter).toBe(1);
    });
  });

  describe('update', () => {
    it('increments counter by one it counter is greater by 1', () => {
      const version = new Version(10);
      version.update({sideId: 10, counter: 1});

      expect(version.counter).toBe(1);
    });

    it('does not increment counter if remote counter is less than current', () => {
      const version = new Version(10);
      version.update({sideId: 10, counter: -1});

      expect(version.counter).toBe(0);
    });

    it('does not increment counter if remote counter is equal to current', () => {
      const version = new Version(10);
      version.update({sideId: 10, counter: 0});

      expect(version.counter).toBe(0);
    });

    it('creates exceptions if remote counter is greater than current by more than 1', () => {
      const version = new Version(10);
      version.update({sideId: 10, counter: 2});

      expect(version.exceptions.has(1)).toBe(true);
    });

    it('removes exceptions if remote counter is less than current and exists in exceptions', () => {
      const version = new Version(10);
      version.update({sideId: 10, counter: 2});
      expect(version.exceptions.has(1)).toBe(true);

      version.update({sideId: 10, counter: 1});
      expect(version.exceptions.has(1)).toBe(false);
    });
  });
});
