class Char {
  constructor(value, counter, siteId, identifiers) {
    this.position = identifiers;
    this.counter = counter;
    this.siteId = siteId;
    this.value = value;
  }

  compareTo(otherChar) {
    let comp, id1, id2;
    const pos1 = this.position;
    const pos2 = otherChar.position;

    for (let i = 0; i < Math.min(pos1.length, pos2.length); i++) {
      id1 = pos1[i];
      id2 = pos2[i];
      comp = id1.compareTo(id2);

      if (comp !== 0) {
        return comp;
      }
    }

    if (pos1.length < pos2.length) {
      return -1;
    } else if (pos1.length > pos2.length) {
      return 1;
    } else {
      return 0;
    }
  }
}

export default Char;
