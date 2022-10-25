class Identifier {
  constructor(digit, siteId) {
    this.digit = digit;
    this.siteId = siteId;
  }

// Compare identifiers using their digit value with siteID as the tiebreaker
// If identifers are equal, return 0
  compareTo(otherId) {
    if (this.digit < otherId.digit) {
      return -1;
    } else if (this.digit > otherId.digit) {
      return 1;
    } else {
      if (this.siteId < otherId.siteId) {
        return -1;
      } else if (this.siteId > otherId.siteId) {
        return 1;
      } else {
        return 0;
      }
    }
  }
}

export default Identifier;
