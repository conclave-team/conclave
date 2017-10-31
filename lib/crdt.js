import Identifier from './identifier';
import Char from './char';

class CRDT {
  constructor(peerId, base=10, boundary=5) {
    this.struct = [];
    this.length = 0;
    this.siteId = peerId;
    this.counter = 0;
    this.text = "";
    this.base = base;
    this.boundary = boundary;
  }

  insertChar(char) {
    this.struct.push(char);
    this.struct = this.sortByIdentifier();
    this.updateText();
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

  boundaryPositive(min, max) {
    max = min + Math.min(this.boundary, (max-min));
    return ((Math.random() * (max-min)) + min);
  }

  generatePosBetween(pos1, pos2, newPos=[]) {
    let id1 = pos1[0] || new Identifier(0, this.siteId);
    let id2 = pos2[0] || new Identifier(this.base, this.siteId);

    if (id2.digit - id1.digit > 1) {

      let newDigit = this.boundaryPositive(id1.digit, id2.digit);
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

  localDelete(index) {
    this.struct.splice(index, 1);
    this.incrementCounter();
    this.updateText();
    return --this.length;
  }

  deleteChar(char) {
    const idx = this.struct.indexOf(char);

    if (idx < 0) {
      throw new Error("Character could not be found");
    }

    this.localDelete(idx);
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
