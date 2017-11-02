// Class that wraps the information about each version.
// exceptions are a set of counters for operations that our local CRDT has not
// seen or integrated yet. Waiting for these operations.
class Version {
  constructor(siteId) {
    this.siteId = siteId;
    this.counter = 0;
    this.exceptions = new Set();
  }

  // increment local version counter by one.
  increment() {
    this.counter += 1;
  }

  // updating local version counter based on a remote operation that has
  // been received. Create exceptions if operation was received out of order.
  update(version) {
    const otherCounter = version.counter;

    if (otherCounter <= this.counter) {
      this.exceptions.delete(otherCounter);
    } else if (otherCounter === this.counter + 1) {
      this.increment();
    } else {
      for (let i = this.counter + 1; i < otherCounter; i++) {
        this.exceptions.add(i);
      }

      this.counter = otherCounter;
    }
  }
}

export default Version;
