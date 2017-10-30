class CRDT {
  constructor(siteId) {
    this.struct = [];
    this.length = 0;
    this.siteId = siteId;
    this.counter = 0;
  }

  insertChar(id, char) {
    this.incrementCounter();
    this.struct[position] = [char, siteId, this.counter];
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
    console.log(this.struct.join(''));
  }

  incrementCounter() {
    this.counter++;
  }
}


const crdt = new CRDT();
crdt.insertChar("s", 0);
crdt.getChar(0);
crdt.print();

crdt.removeChar(0);
crdt.print();

// input = [pid, character]
// pid (tuple) = [position, site's counter value]
// position (list of identifier tuples) = [integer, siteId], [integer, siteId]
const position = [1, 2]
const pid = [position, 1];
crdt.insertChar(pid, "u");
