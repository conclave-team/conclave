class Identifier {
  constructor(digit, siteId) {
    this.digit = digit;
    this.siteId = siteId;
  }

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

class Char {
  constructor(value, counter, identifiers) {
    this.position = identifiers;
    this.counter = counter;
    this.value = value;
  }

  comparePositionTo(otherChar) {
    const pos1 = this.position;
    const pos2 = otherChar.position;
    for (let i = 0; i < Math.min(pos1.length, pos2.length); i++) {
      let comp = pos1[i].compareTo(pos2[i]);

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

class CRDT {
  constructor(siteId) {
    this.struct = [];
    this.length = 0;
    this.siteId = siteId;
    this.counter = 0;
  }

  insertChar(char) {
    this.struct.push(char);
    this.struct = this.sortByIdentifier();
    return ++this.length;
  }

  localInsert(val, index) {
    this.incrementCounter();
    const newChar = this.generateChar(val, index);

    this.insertChar(newChar);
    return newChar;
  }

  generateChar(val, index) {
    const posBefore = (this.struct[index - 1] && this.struct[index - 1].position) || [];
    const posAfter = (this.struct[index] && this.struct[index].position) || [];
    const newPos = this.generatePosBetween(posBefore, posAfter);
    return new Char(val, this.counter, newPos);
  }

  generatePosBetween(pos1, pos2, newPos=[]) {
    let id1 = pos1[0] || new Identifier(0, this.siteId);
    let id2 = pos2[0] || new Identifier(10, this.siteId);

    if (id2.digit - id1.digit > 1) {

      let newDigit = Math.floor((id1.digit + id2.digit) / 2);
      newPos.push(new Identifier(newDigit, this.siteId));
      return newPos;

    } else if (id2.digit - id1.digit === 1) {

      newPos.push(id1);
      return this.generatePosBetween(pos1.slice(1), [], newPos);

    } else if (id1.digit === id2.digit) {
      if (id1.siteId < id2.siteId) {
        newPos.push(id1);
        return this.generatePosBetween(pos1.slice(1), [], newPos);
      } else if (id1.siteId === id2.siteId) {
        newPos.push(id1);
        return this.generatePosBetween(pos1.slice(1), pos2.slice(1), newPos);
      } else {
        throw new Error("Fix Position Sorting");
      }

    }
  }

  getChar(position) {
    return this.struct[position];
  }

  localDelete(index) {
    this.struct.splice(index, 1);
    this.incrementCounter();
    return this.length--;
  }

  remoteDelete(char) {
    const idx = this.struct.indexOf(char);
    this.removeChar(idx);
  }


  print() {
    const str = this.struct.map(char => char.value).join('');
    return str;
  }

  sortByIdentifier() {
    return this.struct.sort((char1, char2) => (
      char1.comparePositionTo(char2)
    ));
  }

  incrementCounter() {
    this.counter++;
  }
}

export {
  CRDT,
  Char,
  Identifier
}
