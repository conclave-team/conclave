import CRDT from './crdt';

class Editor {
  constructor(mde) {
    this.controller = null;
    this.mde = mde;
  }

  bindChangeEvent() {
    this.mde.codemirror.on("change", (_, changeObj) => {
      console.log(changeObj);
      if (changeObj.origin === "setValue") return;
      if (changeObj.origin === "insertText") return;
      if (changeObj.origin === "deleteText") return;
      // if (changeObj.origin === 'undo' && !this.isUndoRedo(changeObj)) return;
      // if (changeObj.origin === 'redo' && !this.isUndoRedo(changeObj)) return;
// when are the above two lines true?
      switch(changeObj.origin) {
        case 'redo':
        case 'undo':
          this.processUndoRedo(changeObj);
          break;
        case '+input':
//          this.processInsert(changeObj);    // uncomment this line for palindromes!
        case 'paste':
          this.processInsert(changeObj);
          break;
        case '+delete':
        case 'cut':
          this.processDelete(changeObj);
          break;
        default:
          throw new Error("Unknown operation attempted in editor.");
      }
    });
  }

  processInsert(changeObj) {
    const chars = this.extractChars(changeObj.text);
    const linePos = changeObj.from.line;
    const charPos = this.findCharPosition(changeObj);
    const startIdx = this.findLinearIdx(linePos, charPos);

    this.controller.localInsert(chars, startIdx);
  }

  processDelete(changeObj) {
    const startIdx = this.findLinearIdx(changeObj.from.line, changeObj.from.ch);
    const endIdx = this.findLinearIdx(changeObj.to.line, changeObj.to.ch);

    this.controller.localDelete(startIdx, endIdx);
  }

  processUndoRedo(changeObj) {
    if (changeObj.removed[0].length > 0) {
      this.processDelete(changeObj);
    } else {
      this.processInsert(changeObj);
    }
  }
  //
  // isUndoRedo(changeObj) {
  //   return changeObj.removed[0].length !== changeObj.text[0].length; // what is this checking?
  // }

  extractChars(text) {
    if (text[0] === '' && text[1] === '' && text.length === 2) {
      return '\n';
    } else if (text[0][0] === '\t') {
      return '\t';
    } else {
      return text.join("\n");
    }
  }

  findCharPosition(changeObj) {
    if (changeObj.text[0][0] === '\t') {
      return this.mde.codemirror.getCursor().ch - 1;
    } else {
      return changeObj.to.ch;
    }
  }

  replaceText(text) {
    const cursor = this.mde.codemirror.getCursor();
    this.mde.value(text);
    this.mde.codemirror.setCursor(cursor);
  }

  insertText(value, positions) {
    const cursor = this.mde.codemirror.getCursor();
    this.mde.codemirror.replaceRange(value, positions.from, positions.to, 'insertText');
    this.mde.codemirror.setCursor(cursor);
  }

  deleteText(positions) {
    const cursor = this.mde.codemirror.getCursor();
    this.mde.codemirror.replaceRange("", positions.from, positions.to, 'deleteText');
    this.mde.codemirror.setCursor(cursor);
  }

  findLinearIdx(lineIdx, chIdx) {
    const linesOfText = this.controller.crdt.text.split("\n");
    if (lineIdx >= linesOfText.length) {
      return -1;
    }
    if (chIdx > linesOfText[lineIdx].length) {
      return -1;
    }

    let index = 0
    for (let i = 0; i < lineIdx; i++) {
      index += linesOfText[i].length + 1;
    }

    return index + chIdx;
  }
}

export default Editor;
