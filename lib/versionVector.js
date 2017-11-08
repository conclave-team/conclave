import SortedArray from './sortedArray';
import Version from './version';

// vector/list of versions of sites in the distributed system
// keeps track of the latest operation received from each site (i.e. version)
// prevents duplicate operations from being applied to our CRDT
class VersionVector {
  // initialize empty vector to be sorted by siteId
  // initialize Version/Clock for local site and insert into SortedArray vector object
  constructor(siteId) {
    this.versions = new SortedArray(this.siteIdComparator);
    this.localVersion = new Version(siteId);
    this.versions.insert(this.localVersion);
  }

  increment() {
    this.localVersion.increment();
  }

  // updates vector with new version received from another site
  // if vector doesn't contain version, it's created and added to vector
  // create exceptions if need be.
  update(version) {
    const index = this.versions.indexOf(version);

    if (index === -1) {
      const newVersion = new Version(version.siteId);

      newVersion.update(version);
      this.versions.insert(newVersion);
    } else {
      const existingVersion = this.versions.get(index);

      existingVersion.update(version);
    }
  }

  // compare function passed to SortedArray when creating vector; sorts by siteId
  siteIdComparator(version1, version2) {
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

  // check if incoming remote operation has already been applied to our crdt
  hasBeenApplied(incomingVersion) {
    const localIncomingVersion = this.getVersionFromVector(incomingVersion);
    const isIncomingInVersionVector = !!localIncomingVersion;

    if (!isIncomingInVersionVector) return false;

    const isIncomingLower = incomingVersion.counter <= localIncomingVersion.counter;
    const isInExceptions = localIncomingVersion.exceptions.has(incomingVersion.counter);

    return isIncomingLower && !isInExceptions;
  }

  getVersionFromVector(version) {
    const index = this.versions.indexOf(version);
    return this.versions.get(index);
  }

  getLocalVersion() {
    return {
      siteId: this.localVersion.siteId,
      counter: this.localVersion.counter
    };
  }
}

export default VersionVector;
