class Entry {
  constructor(siteId) {
    this.siteId = siteId;
    this.counter = 0;
    this.exceptions = [];
  }

  increment() {
    this.counter += 1;
  }

  incrementFrom(version) {
    this.counter = version.counter;
  }
}

export default Entry;
