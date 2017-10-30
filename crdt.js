class CRDT {
  constructor() {
    this.struct = [];
    this.length = 0;
  }

  insert(char, position) {
    this.struct[position] = char;
    return this.length++;
  }

  getChar(position) {
    return this.struct[position];
  }

  print() {
    console.log(this.struct);
  }
}


const crdt = new CRDT();
crdt.insert("s", 0);
crdt.getChar(0); // "s"
crdt.print();
