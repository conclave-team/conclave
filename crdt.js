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

  remoteInsert(char) {
    this.incrementCounter();
    this.struct.push(char);
    this.struct = this.sortByIdentifier();
    return this.length++;
  }

  localInsert(val, index) {
    const posBefore = this.struct[index - 1].position;
    const posAfter = this.struct[index].position;
    const newPos = generatePosBetween(posBefore, posAfter);
  }

  generatePosBetween(pos1, pos2, newPos=[]) {
    if (pos1.length === 0 && pos2.length === 0) {
      // all digits are the same, must compare sites ?
    }

    if (pos1.length === 0) {
      pos1.push(new Identifier(0, this.siteId));
    }

    if (pos2[0].digit - pos1[0].digit > 1) {
      let newDigit = Math.floor((pos1[0].digit + pos2[0].digit) / 2);
      newPos.push(new Identifier(newDigit, this.siteId));
      return newPos;
    }

    if (pos2[0].digit - pos1[0].digit === 1) {
      newPos.push(pos1[0]);
      this.generatePosBetween(pos1.slice(1), [new Identifier(9, this.siteId)], newPos);
    }

    if (pos1[0].digit === pos2[0].digit) {
      newPos.push(pos1[0]);
      this.generatePosBetween(pos1.slice(1), pos2.slice(1), newPos);
    }
  }

    // if (pos1[0] !== pos2[0]) {
    //   pos1Num = pos1.map(id => id.digit);
    //   pos2Num = pos2.map(id => id.digit);
    //   //head digits are different
    // } else {
    //   if (pos1[0].siteId < pos2[0].siteId) {
    //     //head digits are the same, sites are different
    //   } else if (pos1[0].siteId === pos2[0].siteId) {
    //     //head digits and sites are the same
    //     this.generatePosBetween(pos1.slice())
    //   } else {
    //     throw new Error("invalid site ordering");
    //   }
    // }
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
    console.log(str);
  }
// if char1's position is < char2 then return -1
// if char1's position is > char2 then return 1
// // if char1's position is === char2 then return


  sortByIdentifier() {
    return this.struct.sort((char1, char2) => (
      char1.comparePositionTo(char2)
    ));
  }

  incrementCounter() {
    this.counter++;
  }
}


const crdt = new CRDT();
// crdt.insertChar("s", 0);
// crdt.getChar(0);
// crdt.print();
//
// crdt.removeChar(0);
// crdt.print();

// input = [pid, character]
// pid (tuple) = [position, site's counter value]
// position (list of identifier tuples) = [integer, siteId], [integer, siteId]
// const position = [1, 2]
// const pid = [position, 1];
// crdt.insertChar(pid, "u");

const id1 = new Identifier(1, 1);
const id2 = new Identifier(2, 1);

const char1 = new Char('A', 1, [id1]);
const char2 = new Char('B', 2, [id2]);


crdt.insertChar(char2);
crdt.insertChar(char1);

crdt.print();
crdt.remoteDelete(char2);
crdt.print();
