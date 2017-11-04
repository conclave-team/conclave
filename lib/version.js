// Class that wraps the information about each version.
// exceptions are a set of counters for operations that our local CRDT has not
// seen or integrated yet. Waiting for these operations.
class Version {
  constructor(siteId) {
    this.siteId = siteId;
    this.counter = 0;
    this.exceptions = new Set();
  }

  increment() {
    this.counter += 1;
  }

  // updating local version counter based on a remote operation that has
  // been received. Create exceptions if operation was received out of order.
  // Version is updated when an operation is received from a node
  // If the incoming counter is less than our current version, then we can remove it from exceptions (why???)
  // If the incoming version's counter is 1 more than our version of that site, we just update our record of the version's counter
  // Otherwise if the incoming version is more than 1 greater than our version, we add an exception for each counter value in between
  update(version) {
    const incomingCounter = version.counter;

    if (incomingCounter <= this.counter) {
      this.exceptions.delete(incomingCounter);
    } else if (incomingCounter === this.counter + 1) {
      this.increment();
    } else {
      for (let i = this.counter + 1; i < incomingCounter; i++) {
        this.exceptions.add(i);
      }

      this.counter = incomingCounter;
    }
  }
}

export default Version;
