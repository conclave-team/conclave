import CRDT from './crdt';
import RemoteCursor from './remoteCursor';

class Editor {
  constructor(mde) {
    this.controller = null;
    this.mde = mde;
    this.remoteCursors = {};
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

    this.mde.codemirror.on('cursorActivity', doc => {
      if (!doc.getCursor().sticky) return;

      this.controller.handleCursorChange(doc.getCursor());
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

  addRemoteCursor(siteId) {
    if (!this.remoteCursors[siteId]) {
      this.remoteCursors[siteId] = new RemoteCursor(this.mde)
    }
  }

  removeRemoteCursor(siteId) {
    delete this.remoteCursors[siteId];
  }

  updateEditorRemote(newText, opType, index, char) {
    const cursor = this.mde.codemirror.getCursor();
    const position = this.getPositionFromIndex(index, opType);
    const cursorIndex = this.findLinearIdx(cursor.line, cursor.ch);

    this.mde.value(newText);
    this.updateRemoteCursor(char.siteId, position);

    if (opType === 'insert') {
      if (index <= cursorIndex) {
        cursor.ch = cursor.ch + 1;
      }
    } else {
      if (index <= cursorIndex) {
        cursor.ch = cursor.ch - 1;
      }
    }

    this.mde.codemirror.setCursor(cursor);
    this.setRemoteCursors();
  }

  updateRemoteCursor(siteId, position) {
    this.addRemoteCursor(siteId);
    this.remoteCursors[siteId].set(position);
  }

  updateEditorLocal(newText) {
    const cursor = this.mde.codemirror.getCursor();
    this.mde.value(newText);
    this.mde.codemirror.setCursor(cursor);
    this.setRemoteCursors();
  }

  setRemoteCursors() {
    for (const siteId in this.remoteCursors) {
      this.remoteCursors[siteId].set();
    }
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

  getPositionFromIndex(index, opType) {
    if (opType === 'insert') { index++; }
    const text = this.mde.codemirror.getDoc().getValue();
    const position = { line: 0, ch: 0 };
    let counter = 0;

    while (counter < index) {
      if (text[counter] === '\n') {
        position.line++;
        position.ch = 0
      } else {
        position.ch++;
      }

      counter ++;
    }

    return position;
  }
}

export default Editor;
