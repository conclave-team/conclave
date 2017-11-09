import CRDT from './crdt';

class Editor {
  constructor(mde) {
    this.controller = null;
    this.mde = mde;
  }

  bindChangeEvent() {
    this.mde.codemirror.on("change", (_, changeObj) => {
      if (changeObj.origin === "setValue") return;
      if (changeObj.origin === 'undo' && !this.isUndoRedo(changeObj)) return;
      if (changeObj.origin === 'redo' && !this.isUndoRedo(changeObj)) return;

      switch(changeObj.origin) {
        case 'redo':
        case 'undo':
          this.processUndoRedo(changeObj);
          break;
        case '+input':
          this.processInsert(changeObj);
          break;
        case '+delete':
          this.processDelete(changeObj);
          break;
      }
    });
  }

  processInsert(changeObj) {
    const char = this.extractChar(changeObj.text);
    const linePos = changeObj.to.line;
    const charPos = this.findCharPosition(changeObj);
    const idx = this.findLinearIdx(linePos, charPos);

    this.controller.handleInsert(char, idx);
  }

  processDelete(changeObj) {
    const linePos = changeObj.to.line;
    const idx = this.findLinearIdx(changeObj.from.line, changeObj.from.ch);
    const endIdx = this.findLinearIdx(changeObj.to.line, changeObj.to.ch);

    this.controller.handleDelete(idx, endIdx);
  }

  processUndoRedo(changeObj) {
    if (changeObj.removed[0].length > 0) {
      if (changeObj.origin === 'undo' && changeObj.removed[0][0] === '\t') {
        changeObj.to.ch = this.mde.codemirror.getCursor().ch + 1;
        changeObj.from.ch = changeObj.to.ch - 1;
      }
      this.processDelete(changeObj);
    } else {
      this.processInsert(changeObj);
    }
  }

  isUndoRedo(changeObj) {
    return changeObj.removed[0].length !== changeObj.text[0].length;
  }

  extractChar(text) {
    if (text[0] === '' && text[1] === '') {
      return '\n';
    } else if (text[0][0] === '\t') {
      return '\t';
    } else {
      return text[0];
    }
  }

  findCharPosition(changeObj) {
    if (changeObj.text[0][0] === '\t') {
      return this.mde.codemirror.getCursor().ch - 1;
    } else {
      return changeObj.to.ch;
    }
  }

  updateView(newText) {
    const cursor = this.mde.codemirror.getCursor();
    this.mde.value(newText);
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
