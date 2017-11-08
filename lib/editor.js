import CRDT from './crdt';

class Editor {
  constructor(mde) {
    this.controller = null;
    this.mde = mde;
  }

  bindChangeEvent() {
    this.mde.codemirror.on("change", (_, changeObj) => {
      let idx;
      const char = changeObj.text.length > 1 ? "\n" : changeObj.text[0];
      if (changeObj.origin === "+input") {
        idx = this.findLinearIdx(changeObj.to.line, changeObj.to.ch);
        this.controller.handleInsert(char, idx);
      } else if (changeObj.origin === "+delete") {
        idx = this.findLinearIdx(changeObj.from.line, changeObj.from.ch);
        const endIdx = this.findLinearIdx(changeObj.to.line, changeObj.to.ch);
        this.controller.handleDelete(idx, endIdx);
      }
    });
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
