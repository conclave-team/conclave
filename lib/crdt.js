import Identifier from './identifier';
import Char from './char';

class CRDT {
  constructor(controller, base=16, boundary=5) {
    this.controller = controller;
    this.vector = controller.vector;
    this.struct = [[]];
    this.siteId = controller.siteId;
    this.text = "";
    this.base = base;
    this.boundary = boundary;
  }

  handleLocalInsert(value, pos) {
    this.vector.increment();
    console.log("pos: ", pos);

    const char = this.generateChar(value, pos);
    this.insertChar(char, pos);
    this.populateText();
    console.log("crdt.text: ", this.text);

    this.controller.broadcastInsertion(char);
  }

  handleRemoteInsert(char) {
    const pos = this.findPosition(char);
    console.log("pos: ", pos);

    this.insertChar(char, pos);
    this.populateText();
    console.log("crdt.text: ", this.text);

    this.controller.insertIntoEditor(char.value, pos, char.siteId);
  }

  insertChar(char, pos) {
    if (pos.line === this.struct.length) {
      this.struct.push([]);
    }

    this.struct[pos.line].splice(pos.ch, 0, char);
    // this.struct.splice(index, 0, char);
  }

  handleLocalDelete(pos) {
    this.vector.increment();

    // const char = this.struct.splice(idx, 1)[0];
    const char = this.deleteChar(pos);
    this.populateText();
    console.log("crdt.text: ", this.text);

    this.controller.broadcastDeletion(char);
  }

  handleRemoteDelete(char, siteId) {
    const pos = this.findPosition(char);
    // this.struct.splice(index, 1);
    this.deleteChar(pos);
    this.controller.deleteFromEditor(char.value, pos, siteId);
    this.populateText();
    console.log("crdt.text: ", this.text);
  }

  deleteChar(pos) {
    return this.struct[pos.line].splice(pos.ch, 1)[0];
  }

  // to be replaced with binary search
  findPosition(char) {
    let line, ch;
    const numLines = this.struct.length;

    for (line = 0; line < numLines; line++) {
      if (this.struct[line].length === 0) { return { line: line, ch: 0 }; }

      let chars = this.struct[line];
      let lastChar = chars[chars.length - 1];

      // chars will only be equal when deleting; method could be optimized for deletes
      if (char.compareTo(lastChar) <= 0) {
        for (ch = 0; ch < chars.length; ch++) {
          if (char.compareTo(chars[ch]) <= 0) {
            return { line: line, ch: ch }
          }
        }
      }
    }

    // char is greater than all chars; either add to last line or add to a new line
    const lastLine = this.struct[numLines - 1];
    const lastChar = lastLine[lastLine.length - 1];

    if (lastChar.value === "\n") {
      return { line: numLines, ch: 0 };
    } else {
      return { line: numLines - 1, ch: lastLine.length}
    }
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

  findPosBefore(pos) {
    let ch = pos.ch;
    let line = pos.line;

    if (ch === 0 && line === 0) {
      return [];
    } else if (ch === 0 && line !== 0) {
      line = line - 1;
      ch = this.struct[line].length;
    }

    return this.struct[line][ch - 1].position;
  }

  findPosAfter(pos) {
    let ch = pos.ch;
    let line = pos.line;

    let numLines = this.struct.length;
    let numChars = (this.struct[line] && this.struct[line].length) || 0;

    if ((line === numLines - 1) && (ch === numChars)) {
      return [];
    } else if ((line < numLines - 1) && (ch === numChars)) {
      line = line + 1;
      ch = 0;
    } else if ((line > numLines - 1) && ch === 0) {
      return [];
    }

    return this.struct[line][ch].position;
  }

  generateChar(val, pos) {
    // const posBefore = (this.struct[index - 1] && this.struct[index - 1].position) || [];
    // const posAfter = (this.struct[index] && this.struct[index].position) || [];

    const posBefore = this.findPosBefore(pos);
    const posAfter = this.findPosAfter(pos);
    const newPos = this.generatePosBetween(posBefore, posAfter);

    return new Char(val, this.vector.localVersion.counter, this.siteId, newPos);
  }

  generatePosBetween(pos1, pos2, newPos=[], level=0) {
    let base = Math.pow(2, level) * this.base;
// default: every second level is boundary negative
    let boundaryStrategy = (level % 2) === 0 ? '+' : '-';
// every third level is boundary negative
    // let boundaryStrategy = ((level+1) % 3) === 0 ? '-' : '+';
// every level is boundary positive
    // let boundaryStrategy = '+';
// every level is boundary negative
    // let boundaryStrategy = '-';
// each level is randomly boundary positive or negative
    // let boundaryStrategy = Math.round(Math.random()) === 0 ? '+' : '-';

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

  // insertText(val, index) {
  //   this.text = this.text.slice(0, index) + val + this.text.slice(index);
  // }
  //
  // deleteText(index) {
  //   this.text = this.text.slice(0, index) + this.text.slice(index + 1);
  // }

  populateText() {
    this.text = this.struct.map(line => line.map(char => char.value).join(''));
    // this.text = this.struct.map(char => char.value).join('');
  }
}

export default CRDT;
