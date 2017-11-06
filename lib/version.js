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
    this.counter++;
  }

  // Update a site's version based on the incoming operation that was processed
  // If the incomingCounter is less than we had previously processed, we can remove it from the exceptions
  // Else if the incomingCounter is the operation immediately after the last one we procesed, we just increment our counter to reflect that
  // Else, add an exception for each counter value that we haven't seen yet, and update our counter to match
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
