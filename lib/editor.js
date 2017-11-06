import CRDT from './crdt';
import SimpleMDE from 'simplemde';

class Editor {
  constructor(controller, initialText="") {
    this.controller = controller;
    this.mde = new SimpleMDE({
      element: document.querySelector('textarea'),
      placeholder: 'Type here...',
      spellChecker: false,
      toolbar: false,
      initialValue: initialText
    });
    this.bindChangeEvent();
  }

  bindChangeEvent() {
    this.mde.codemirror.on("change", (_, changeObj) => {
      let idx;
      const char = changeObj.text.length > 1 ? "\n" : changeObj.text[0];
console.log(this.controller.crdt.struct.length);
      if (changeObj.origin === "+input") {
        idx = this.findLinearIdx(changeObj.to.line, changeObj.to.ch);
        this.controller.handleInsert(char, idx);
      } else if (changeObj.origin === "+delete") {
        idx = this.findLinearIdx(changeObj.from.line, changeObj.from.ch);
        this.controller.handleDelete(idx);
      }
    });
  }

  updateView(newText) {
    const cursor = this.mde.codemirror.getCursor();
    this.mde.value(newText);
    this.mde.codemirror.setCursor(cursor);
  }

  findLinearIdx(lineIdx, chIdx) {
    const linesOfText = this.mde.codemirror.getValue().split("\n");
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
