import SortedArray from './sortedArray';
import Entry from './entry';

class VersionVector {
  constructor(siteId) {
    this.local = new Entry(siteId);
    this.all = new SortedArray(this.compareFunction);
    this.all.insert(this.local);
  }

  increment() {
    this.local.increment();
  }

  incrementFrom(version) {
    const index = this.all.indexOf(version);

    if (index < 0) {
      const newEntry = new Entry(version.siteId);

      newEntry.incrementFrom(version);
      this.all.insert(newEntry);
    } else {
      const entry = this.all.get(index);

      entry.incrementFrom(version);
    }
  }

  compareFunction(ver1, ver2) {
    const site1 = ver1.siteId;
    const site2 = ver2.siteId;

    if (site1 < site2) {
      return -1;
    } else if (site1 > site2) {
      return 1;
    } else {
      return 0;
    }
  }

  isDuplicate(version) {
    const index = this.all.indexOf(version);
    const entry = this.all.get(index);

    return entry && version.counter <= entry.counter;
    // TODO exceptions
  }

  isReady(version) {
    const index = this.all.indexOf(version);
    const entry = this.all.get(index);

    return entry && (version.counter > entry.counter || entry.x.indexOf(version.counter) < 0);
  }
}

export default VersionVector;
