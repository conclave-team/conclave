import CRDT from './crdt';

class Editor {
  constructor(mde) {
    this.controller = null;
    this.mde = mde;
  }

  bindChangeEvent() {
    this.mde.codemirror.on("change", (_, changeObj) => {
      if (changeObj.origin === "setValue") return;
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
    const idx = this.findLinearIdx(linePos, charPos);

    this.controller.localInsert(chars, idx);
  }

  processDelete(changeObj) {
    const idx = this.findLinearIdx(changeObj.from.line, changeObj.from.ch);
    const endIdx = this.findLinearIdx(changeObj.to.line, changeObj.to.ch);

    this.controller.localDelete(idx, endIdx);
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

  updateCursor() {
    const cursor = this.mde.codemirror.getCursor();
    this.mde.codemirror.setCursor(cursor);
  }

  updateCursorRemote(opType, index) {
    const cursor = this.mde.codemirror.getCursor();
    const cursorIndex = this.findLinearIdx(cursor.line, cursor.ch);

    if (opType === 'insert') {
      if (index <= cursorIndex) {
        cursor.ch = cursor.ch + 1;
        this.mde.codemirror.setCursor(cursor);
      }
    } else {
      if (index >= cursorIndex) {
        cursor.ch = cursor.ch - 1;
        this.mde.codemirror.setCursor(cursor);
      }
    }
  }

  updateText(newText) {
    this.mde.value(newText);
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
