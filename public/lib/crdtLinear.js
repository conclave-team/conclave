import Identifier from './identifier';
import Char from './char';

class CRDT {
  constructor(controller, base=32, boundary=10, strategy='random', mult=2) {
    this.controller = controller;
    this.vector = controller.vector;
    this.struct = [];
    this.siteId = controller.siteId;
    this.text = "";
    this.base = base;
    this.boundary = boundary;
    this.strategy = strategy;
    this.strategyCache = [];
    this.mult = mult;
  }

  handleLocalInsert(val, index) {
    this.vector.increment();

    const char = this.generateChar(val, index);
    this.insertChar(index, char);
    this.insertText(char.value, index);

    this.controller.broadcastInsertion(char);
  }

  handleRemoteInsert(char) {
    const index = this.findInsertIndex(char);

    this.insertChar(index, char);
    this.insertText(char.value, index);

    this.controller.insertIntoEditor(char.value, index, char.siteId);
  }

  insertChar(index, char) {
    this.struct.splice(index, 0, char);
  }

  handleLocalDelete(idx) {
    this.vector.increment();

    const char = this.struct.splice(idx, 1)[0];
    this.deleteText(idx);

    this.controller.broadcastDeletion(char);
  }

  handleRemoteDelete(char, siteId) {
    const index = this.findIndexByPosition(char);
    this.struct.splice(index, 1);

    this.controller.deleteFromEditor(char.value, index, siteId);
    this.deleteText(index);
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

    return char.compareTo(this.struct[left]) === 0 ? left : right;
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

  retrieveStrategy(level) {
    if (this.strategyCache[level]) return this.strategyCache[level];
    let strategy;

    switch (this.strategy) {
      case 'plus':
        strategy = '+';
        break;
      case 'minus':
        strategy = '-';
        break;
      case 'random':
        strategy = Math.round(Math.random()) === 0 ? '+' : '-';
        break;
      case 'every2nd':
        strategy = ((level+1) % 2) === 0 ? '-' : '+';
        break;
      case 'every3rd':
        strategy = ((level+1) % 3) === 0 ? '-' : '+';
        break;
      default:
        strategy = ((level+1) % 2) === 0 ? '-' : '+';
        break;
    }

    this.strategyCache[level] = strategy;
    return strategy;
  }

  generatePosBetween(pos1, pos2, newPos=[], level=0) {
    let base = Math.pow(this.mult, level) * this.base;
    let boundaryStrategy = this.retrieveStrategy(level);

    let id1 = pos1[0] || new Identifier(0, this.siteId);
    let id2 = pos2[0] || new Identifier(base, this.siteId);

    if (id2.digit - id1.digit > 1) {

      let newDigit = this.generateIdBetween(id1.digit, id2.digit, boundaryStrategy);
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
/*
Math.random gives you a range that is inclusive of the min and exclusive of the max
so have to add and subtract ones to get them all into that format

if max - min <= boundary, the boundary doesn't matter
    newDigit > min, newDigit < max
    ie (min+1...max)
    so, min = min + 1
if max - min > boundary and the boundary is negative
    min = max - boundary
    newDigit >= min, newDigit < max
    ie (min...max)
if max - min > boundary and the boundary is positive
    max = min + boundary
    newDigit > min, newDigit <= max
    ie (min+1...max+1)
    so, min = min + 1 and max = max + 1

now all are (min...max)
*/
  generateIdBetween(min, max, boundaryStrategy) {
    if ((max - min) < this.boundary) {
      min = min + 1;
    } else {
      if (boundaryStrategy === '-') {
        min = max - this.boundary;
      } else {
        min = min + 1;
        max = min + this.boundary;
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

  populateText() {
    this.text = this.struct.map(char => char.value).join('');
  }
}

export default CRDT;
