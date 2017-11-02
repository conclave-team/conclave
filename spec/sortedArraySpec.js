import SortedArray from '../lib/sortedArray';

describe('SortedArray', () => {
  describe('get', () => {
    it('returns the element at the specified index', () => {
      const sortedArray = new SortedArray((a, b) => a - b);
      sortedArray.insert(2);
      sortedArray.insert(1);

      expect(sortedArray.get(0)).toBe(1);
    });
  });
});
