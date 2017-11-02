import CRDT from './crdt';
import SimpleMDE from 'simplemde';

class Editor {
  constructor(controller) {
    this.controller = controller;
    this.mde = new SimpleMDE({
      placeholder: 'Type here...',
      spellChecker: false,
      toolbar: false
    });
  }

  bindChangeEvent() {
    this.mde.codemirror.on("change", (_, changeObj) => {
      const idx = this.findLinearIdx(changeObj.from.line, changeObj.from.ch);
      let changedChar;
      let insertion;

      if (changeObj.origin === "+input") {
        const char = changeObj.text.length > 1 ? '\n' : changeObj.text
        changedChar = this.controller.handleInsert(char, idx);
        this.controller.broadcastInsertion(JSON.stringify(changedChar));
      } else if (changeObj.origin === "+delete") {
        changedChar = this.controller.handleDelete(idx);
        this.controller.broadcastDeletion(JSON.stringify(changedChar));
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
