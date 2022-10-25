// Class that wraps the information about each version.
// exceptions are a set of counters for operations that our local CRDT has not
// seen or integrated yet. Waiting for these operations.
class Version {
  constructor(siteId) {
    this.siteId = siteId;
    this.counter = 0;
    this.exceptions = [];
  }

  // Update a site's version based on the incoming operation that was processed
  // If the incomingCounter is less than we had previously processed, we can remove it from the exceptions
  // Else if the incomingCounter is the operation immediately after the last one we procesed, we just increment our counter to reflect that
  // Else, add an exception for each counter value that we haven't seen yet, and update our counter to match
  update(version) {
    const incomingCounter = version.counter;

    if (incomingCounter <= this.counter) {
      const index = this.exceptions.indexOf(incomingCounter);
      this.exceptions.splice(index, 1);
    } else if (incomingCounter === this.counter + 1) {
      this.counter = this.counter + 1;
    } else {
      for (let i = this.counter + 1; i < incomingCounter; i++) {
        this.exceptions.push(i);
      }
      this.counter = incomingCounter;
    }
  }
}

export default Version;
