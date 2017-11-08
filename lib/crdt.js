import Identifier from './identifier';
import Char from './char';

class CRDT {
  constructor(controller, base=16, boundary=5) {
    this.controller = controller;
    this.vector = controller.vector;
    this.struct = [];
    this.siteId = controller.siteId;
    this.text = "";
    this.base = base;
    this.boundary = boundary;
  }

  handleLocalInsert(val, index) {
    this.vector.increment();
    const newChar = this.generateChar(val, index);

    this.insertAndUpdate(index, newChar);
    this.controller.broadcastInsertion(newChar);
  }

  insertChar(char) {
    const index = this.findInsertIndex(char);

    this.insertAndUpdate(index, char);
  }

  insert(index, char) {
    this.struct.splice(index, 0, char);
  }

  insertAndUpdate(index, char) {
    this.insert(index, char);
    this.insertText(char.value, index);
    this.controller.updateEditor();
  }

  handleLocalDelete(idx) {
    let deletedChar;

    this.vector.increment();
    deletedChar = this.struct.splice(idx, 1)[0];
    this.deleteText(idx);
    this.controller.updateEditor();
    this.controller.broadcastDeletion(deletedChar);
  }

  deleteChar(char) {
    const index = this.findIndexByPosition(char);
    this.struct.splice(index, 1);
    this.deleteText(index);
    this.controller.updateEditor();
  }

  findInsertIndex(char) {
    let left = 0;
    let right = this.struct.length - 1;
    let mid, compareNum;

    if (this.struct.length === 0 || char.compareTo(this.struct[left]) < 0) {
      return left;
    } else if (char.compareTo(this.struct[right]) > 0) {
      return this.struct.length;
    }

    while (left + 1 < right) {
      mid = Math.floor(left + (right - left) / 2);
      compareNum = char.compareTo(this.struct[mid]);

      if (compareNum === 0) {
        return mid;
      } else if (compareNum > 0) {
        left = mid;
      } else {
        right = mid;
      }
    }

    return char.compareTo(this.struct[left]) === 0 ? left : right
  }

  findIndexByPosition(char) {
    let left = 0;
    let right = this.struct.length - 1;
    let mid, compareNum;

    if (this.struct.length === 0) {
      throw new Error("Character does not exist in CRDT.");
    }

    while (left + 1 < right) {
      mid = Math.floor(left + (right - left) / 2);
      compareNum = char.compareTo(this.struct[mid]);

      if (compareNum === 0) {
        return mid;
      } else if (compareNum > 0) {
        left = mid;
      } else {
        right = mid;
      }
    }

    if (char.compareTo(this.struct[left]) === 0) {
      return left;
    } else if (char.compareTo(this.struct[right]) === 0) {
      return right;
    } else {
      throw new Error("Character does not exist in CRDT.");
    }
  }

  generateChar(val, index) {
    const posBefore = (this.struct[index - 1] && this.struct[index - 1].position) || [];
    const posAfter = (this.struct[index] && this.struct[index].position) || [];
    const newPos = this.generatePosBetween(posBefore, posAfter);
    const localCounter = this.vector.localVersion.counter;

    return new Char(val, localCounter, this.siteId, newPos);
  }

  generatePosBetween(pos1, pos2, newPos=[], level=0) {
    let base = Math.pow(2, level) * this.base;
    let positiveStrategy = (level % 2) === 0 ? true : false;

    let id1 = pos1[0] || new Identifier(0, this.siteId);
    let id2 = pos2[0] || new Identifier(base, this.siteId);

    if (id2.digit - id1.digit > 1) {

      let newDigit = this.allocateId(id1.digit, id2.digit, positiveStrategy);
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

  allocateId(min, max, positiveStrategy) {
    if (positiveStrategy) {
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

  insertText(val, index) {
    this.text = this.text.slice(0, index) + val + this.text.slice(index);
  }

  deleteText(index) {
    this.text = this.text.slice(0, index) + this.text.slice(index + 1);
  }
}

export default CRDT;
