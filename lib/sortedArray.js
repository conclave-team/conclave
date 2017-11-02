import sorted from 'sorted-cmp-array';

class SortedArray extends sorted {
  constructor(compareFn) {
    super(compareFn);
  }

  get(idx) {
    return this.arr[idx];
  }
}

export default SortedArray;
