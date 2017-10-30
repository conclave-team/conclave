class Identifier {
  constructor(digit, siteId) {
    this.digit = digit;
    this.siteId = siteId;
  }
}

class Char {
  constructor(value, counter, identifiers) {
    this.position = identifiers;
    this.counter = counter;
    this.value = value;
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
    this.incrementCounter();
    this.struct.push(char);
    return this.length++;
  }

  getChar(position) {
    return this.struct[position];
  }

  removeChar(position) {
    this.struct.splice(position, 1);
    this.incrementCounter();
    return this.length--;
  }

  findPositionById(id) {

  }

  print() {
    const str = this.sortByIdentifier().map(char => char.value).join('');
    console.log(str);
  }
// if char1's position is < char2 then return -1
// if char1's position is > char2 then return 1
// // if char1's position is === char2 then return


  sortByIdentifier() {
    return this.struct.sort((char1, char2) => (
      this.comparePositions(char1.position, char2.position)
    ));
  }

  comparePositions(pos1, pos2) {
    for (let i = 0; i < Math.min(pos1.length, pos2.length); i++) {
      const comp = this.compareIdentifier(pos1[i], pos2[i]);

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

  compareIdentifier(id1, id2) {
    if (id1.digit < id2.digit) {
      return -1;
    } else if (id1.digit > id2.digit) {
      return 1;
    } else {
      if (id1.siteId < id2.siteId) {
        return -1;
      } else if (id1.siteId > id2.siteId) {
        return 1;
      } else {
        return 0;
      }
    }
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
