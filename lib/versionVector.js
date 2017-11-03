import SortedArray from './sortedArray';
import Version from './version';

class VersionVector {
  // create a vector/list/sorted array of all versions in the network.
  constructor(controller) {
    this.controller = controller;
    this.local = new Version(controller.siteId);
    this.allVersions = new SortedArray(this.comparator);
    this.allVersions.insert(this.local);
  }

  increment() {
    this.local.increment();
  }

  // update a version in our allVersions vector.
  // create new version if none exist.
  // create exceptions if need be.
  update(version) {
    const index = this.allVersions.indexOf(version);

    if (index < 0) {
      const newVersionEntry = new Version(version.siteId);

      newVersionEntry.update(version);
      this.allVersions.insert(newVersionEntry);
    } else {
      const oldVersion = this.allVersions.get(index);

      oldVersion.update(version);
    }
  }

  // comparing function needed for SortedArray.
  // compares site ids and orders in ascending order.
  comparator(version1, version2) {
    const site1 = version1.siteId;
    const site2 = version2.siteId;

    if (site1 < site2) {
      return -1;
    } else if (site1 > site2) {
      return 1;
    } else {
      return 0;
    }
  }

  // check to see if remote operation has already been integrated
  isDuplicate(remoteVersion) {
    // if (version === undefined || version === null) return false;

    const index = this.allVersions.indexOf(remoteVersion);
    const localVersion = this.allVersions.get(index);

    return !!localVersion && remoteVersion.counter <= localVersion.counter &&
             !localVersion.exceptions.has(remoteVersion.counter);
  }

  getLatest() {
    return {
      siteId: this.local.siteId,
      counter: this.local.counter
    };
  }
}



export default VersionVector;
