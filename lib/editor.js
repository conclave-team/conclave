import CRDT from './crdt';

class Editor {
  constructor(mde) {
    this.controller = null;
    this.mde = mde;
    this.customTabBehavior();
  }

  customTabBehavior() {
    this.mde.codemirror.setOption("extraKeys", {
      Tab: function(codemirror) {
        codemirror.replaceSelection("\t");
      }
    });
  }

  onDownload() {
    const dlButton = document.querySelector('#download');

    dlButton.onclick = () => {
      const textToSave = this.mde.value();
      const textAsBlob = new Blob([textToSave], {type:"text/plain"});
      const textAsURL = window.URL.createObjectURL(textAsBlob);
      const fileName = "Conclave-"+Date.now();
      const downloadLink = document.createElement("a");

      downloadLink.download = fileName;
      downloadLink.innerHTML = "Download File";
      downloadLink.href = textAsURL;
      downloadLink.onclick = this.afterDownload;
      downloadLink.style.display = "none";
      document.body.appendChild(downloadLink);

      downloadLink.click();
    };
  }

  afterDownload(event) {
    document.body.removeChild(event.target);
  }

  bindChangeEvent() {
    this.mde.codemirror.on("change", (_, changeObj) => {
      if (changeObj.origin === "setValue") return;
      if (changeObj.origin === "insertText") return;
      if (changeObj.origin === "deleteText") return;
      
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
    const charPos = changeObj.from.ch;
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

  extractChars(text) {
    if (text[0] === '' && text[1] === '' && text.length === 2) {
      return '\n';
    } else {
      return text.join("\n");
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

    let index = 0
    for (let i = 0; i < lineIdx; i++) {
      index += linesOfText[i].length + 1;
    }

    return index + chIdx;
  }
}

export default Editor;
