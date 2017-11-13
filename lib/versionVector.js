import SortedArray from './sortedArray';
import Version from './version';

// vector/list of versions of sites in the distributed system
// keeps track of the latest operation received from each site (i.e. version)
// prevents duplicate operations from being applied to our CRDT
class VersionVector {
  // initialize empty vector to be sorted by siteId
  // initialize Version/Clock for local site and insert into SortedArray vector object
  constructor(siteId) {
    // this.versions = new SortedArray(this.siteIdComparator);
    this.versions = []
    this.localVersion = new Version(siteId);
    this.versions.push(this.localVersion);
  }

  increment() {
    this.localVersion.counter++;
  }

  // updates vector with new version received from another site
  // if vector doesn't contain version, it's created and added to vector
  // create exceptions if need be.
  update(incomingVersion) {
    const existingVersion = this.versions.find(version => incomingVersion.siteId === version.siteId);

    if (!existingVersion) {
      const newVersion = new Version(incomingVersion.siteId);

      newVersion.update(incomingVersion);
      this.versions.push(newVersion);
    } else {
      existingVersion.update(incomingVersion);
    }
  }

  // check if incoming remote operation has already been applied to our crdt
  hasBeenApplied(incomingVersion) {
    const localIncomingVersion = this.getVersionFromVector(incomingVersion);
    const isIncomingInVersionVector = !!localIncomingVersion;

    if (!isIncomingInVersionVector) return false;

    const isIncomingLower = incomingVersion.counter <= localIncomingVersion.counter;
    const isInExceptions = localIncomingVersion.exceptions.includes(incomingVersion.counter);

    return isIncomingLower && !isInExceptions;
  }

  getVersionFromVector(incomingVersion) {
    return this.versions.find(version => version.siteId === incomingVersion.siteId);
  }

  getLocalVersion() {
    return {
      siteId: this.localVersion.siteId,
      counter: this.localVersion.counter
    };
  }
}

export default VersionVector;
