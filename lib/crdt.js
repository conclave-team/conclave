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
    const char = this.generateChar(value, pos);
    this.insertChar(char, pos);
    this.controller.broadcastInsertion(char);
  }

  handleRemoteInsert(char) {
    const pos = this.findPosition(char);
    this.insertChar(char, pos);
    this.controller.insertIntoEditor(char.value, pos, char.siteId);
  }

  insertChar(char, pos) {
    if (pos.line === this.struct.length) {
      this.struct.push([]);
    }

    // if inserting a newline, split line into two lines
    if (char.value === "\n") {
      const lineAfter = this.struct[pos.line].splice(pos.ch);
      const lineBefore = this.struct[pos.line].concat(char);
      if (lineAfter.length === 0) {
        this.struct.splice(pos.line, 1, lineBefore);
      } else {
        this.struct.splice(pos.line, 1, lineBefore, lineAfter);
      }
    } else {
      this.struct[pos.line].splice(pos.ch, 0, char);
    }
  }

  handleLocalDelete(startPos, endPos) {
    let char, line, ch, i;
    let newlineRemoved = false;

    // for multi-line deletes
    if (startPos.line !== endPos.line) {
      // delete chars on first line from startPos.ch to end of line
      do {
        char = this.struct[startPos.line].splice(startPos.ch, 1)[0];

        if (char) {
          this.vector.increment();
          this.controller.broadcastDeletion(char);
        }

        if (char.value === "\n") {
          newlineRemoved = true;
          break;
        }
      } while (char);

      // delete all chars on 2nd through 2nd-to-last lines
      for (line = startPos.line + 1; line < endPos.line; line++) {
        do {
          char = this.struct[line].splice(0, 1)[0];
          if (char) {
            this.vector.increment();
            this.controller.broadcastDeletion(char);
          }
        } while (char);
      }

      // delete chars on last line from 0 to endPos.ch
      for (ch = 0; ch < endPos.ch; ch++) {
        char = this.struct[endPos.line].splice(0, 1)[0];
        this.vector.increment();
        this.controller.broadcastDeletion(char);
      }

      // remove empty lines
      for (line = 0; line < this.struct.length; line++) {
        if (this.struct[line].length === 0) {
          this.struct.splice(line, 1);
          line--;
        }
      }

      // if newline deleted from start line, concat start line with next non-empty line
      if (newlineRemoved && this.struct[startPos.line + 1]) {
        const mergedLine = this.struct[startPos.line].concat(this.struct[startPos.line + 1]);
        this.struct.splice(startPos.line, 2, mergedLine);
      }

      // single-line deletes
    } else {
      for (i = startPos.ch; i < endPos.ch; i++) {
        char = this.struct[startPos.line].splice(startPos.ch, 1)[0];

        if (char.value === "\n") {
          const mergedLine = this.struct[startPos.line].concat(this.struct[startPos.line + 1]);
          this.struct.splice(startPos.line, 2, mergedLine);
        }
        this.vector.increment();
        this.controller.broadcastDeletion(char);
      }
    }
  }

  handleRemoteDelete(char, siteId) {
    const pos = this.findPosition(char);
    this.struct[pos.line].splice(pos.ch, 1)[0];

    // when deleting newline, concat start line with next non-empty line
    if (char.value === "\n" && this.struct[pos.line + 1]) {
      const mergedLine = this.struct[pos.line].concat(this.struct[pos.line + 1]);
      this.struct.splice(pos.line, 2, mergedLine);
    }

    this.controller.deleteFromEditor(char.value, pos, siteId);
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

  toText() {
    return this.struct.map(line => line.map(char => char.value).join(''));
  }
}

export default CRDT;
