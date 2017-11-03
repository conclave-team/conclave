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
  }

  bindChangeEvent() {
    this.mde.codemirror.on("change", (_, changeObj) => {
      const idx = this.findLinearIdx(changeObj.from.line, changeObj.from.ch);

      if (changeObj.origin === "+input") {
        const char = changeObj.text.length > 1 ? '\n' : changeObj.text
        this.controller.handleInsert(char, idx);
      } else if (changeObj.origin === "+delete") {
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
    let index = 0
    for (let i = 0; i < lineIdx; i++) {
      index += linesOfText[i].length;
    }

    return index + chIdx;
  }
}

export default Editor;
