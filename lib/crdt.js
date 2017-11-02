import Identifier from './identifier';
import Char from './char';

class CRDT {
  constructor(peerId, editor, base=16, boundary=5) {
    this.struct = [];
    this.length = 0;
    this.siteId = peerId;
    this.counter = 0;
    this.text = "";
    this.base = base;
    this.boundary = boundary;
    this.conns = [];
    this.editor = editor;
  }

  handleLocalInsert(val, index) {
    const newChar = this.generateChar(val, index);
    this.incrementCounter();
    this.insertChar(newChar);
  }

  // also called when peer.on("data", insert char data)
  insertChar(char) {
    this.broadcastInsert(char);
    this.struct.push(char);
    this.length++;
    this.struct = this.sortByIdentifier();
    this.updateText();
    // this.editor.updateView();
  }

  broadcastInsert(char) {
    // something like peer.send(char data) for each connection
    this.conns[0] && this.conns[0].insertChar(char);
  }

  handleLocalDelete(index) {
    const deletedChar = this.struct[index];
    this.incrementCounter();
    this.deleteChar(deletedChar);
  }

// also called when peer.on("data", char object)
  deleteChar(char) {
    this.broadcastDelete(char);

    const idx = this.struct.indexOf(char);
    if (idx < 0) {
      throw new Error("Character could not be found");
    }

    this.struct.splice(idx, 1);
    this.length--;
    this.updateText();
    // this.editor.updateView();
  }

  broadcastDelete(char) {
    // something like peer.send(delete char) for each connection
    this.conns[0] && this.conns[0].deleteChar(char);
  }

  generateChar(val, index) {
    const posBefore = (this.struct[index - 1] && this.struct[index - 1].position) || [];
    const posAfter = (this.struct[index] && this.struct[index].position) || [];
    const newPos = this.generatePosBetween(posBefore, posAfter);
    return new Char(val, this.counter, newPos);
  }

  generatePosBetween(pos1, pos2, newPos=[], level=0) {
    let base = Math.pow(2, level) * this.base;
    let positive = (level % 2) === 0 ? true : false;

    let id1 = pos1[0] || new Identifier(0, this.siteId);
    let id2 = pos2[0] || new Identifier(base, this.siteId);

    if (id2.digit - id1.digit > 1) {

      let newDigit = this.allocateId(id1.digit, id2.digit, positive);
      newPos.push(new Identifier(newDigit, this.siteId));
      return newPos;

    } else if (id2.digit - id1.digit === 1) {

      newPos.push(id1);
      return this.generatePosBetween(pos1.slice(1), [], newPos, level+1);

    } else if (id1.digit === id2.digit) {
      if (id1.siteId < id2.siteId) {
        newPos.push(id1);
        return this.generatePosBetween(pos1.slice(1), [], newPos, level+1);
      } else if (id1.siteId === id2.siteId) {
        newPos.push(id1);
        return this.generatePosBetween(pos1.slice(1), pos2.slice(1), newPos, level+1);
      } else {
        throw new Error("Fix Position Sorting");
      }
    }
  }

  allocateId(min, max, positive) {
    if(positive) {
      min = min + 1;
      if (this.boundary < (max-min-1)) {
        max = min + this.boundary;
      }
    } else {
      if (this.boundary < (max-min)) {
        min = max - this.boundary;
      } else {
        min = min + 1;
      }
    }
    return Math.floor(Math.random() * (max - min)) + min;
  }

  updateText() {
    this.text = this.struct.map(char => char.value).join('');
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

export default CRDT;
