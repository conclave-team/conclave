import CRDT from './crdt';
import SimpleMDE from 'simplemde';

class Editor {
  constructor(textarea) {
    this.mde = new SimpleMDE({
      element: textarea,
      placeholder: 'Type here...',
      spellChecker: false,
      toolbar: false
    });
    this.crdt = new CRDT(Math.floor(Math.random() * 100), this);
    this.bindChangeEvent();
  }

  bindChangeEvent() {
    this.mde.codemirror.on("change", (self, changeObj) => {
      const idx = this.findLinearIdx(changeObj.from.line, changeObj.from.ch);

      if (changeObj.origin === "+input") {
        const char = changeObj.text.length > 1 ? '\n' : changeObj.text
        this.crdt.localInsert(char, idx);
      } else if (changeObj.origin === "+delete") {
        this.crdt.localDelete(idx);
      }
    });
  }

  updateView() {
    const cursor = this.mde.codemirror.getCursor();
    this.mde.value(this.crdt.text);
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

//    this.bindEvents();
  // }
  //
  // bindEvents() {
  //   this.charInsertEvt();
  //   this.specialInsertEvt();
  //   this.deleteEvt();
  //   this.remoteChangeEvt();
  // }
  //
  // charInsertEvt() {
//     const textbox = Rx.Observable.fromEvent(this.editor, 'keydown');
//
//     textbox.filter(e => e.key.match(/^(\w|\W)$/))
//            .subscribe(e => {
//              const char = e.key;
//              const index = e.target.value.length;
//              const insertedChar = this.model.localInsert(char, index)
//
//              this.emit('localInsert', insertedChar);
//            });
  // }
  //
  // specialInsertEvt() {
//     const textbox = Rx.Observable.fromEvent(this.editor, 'keydown');
//
//     textbox.filter(e => e.key.match(/(Enter|Tab)/))
//            .subscribe(e => {
//              const char = e.key === 'Enter' ? '\n' : '\t';
//              const index = e.target.value.length;
//              const insertedChar = this.model.localInsert(char, index)
//
//              this.emit('localInsert', insertedChar);
//            });
  // }
  //
  // deleteEvt() {
//     const textbox = Rx.Observable.fromEvent(this.editor, 'keydown');
//
//     textbox.filter(e => e.key === 'Backspace')
//            .subscribe(e => {
//              const index = e.target.value.length - 1;
//              const deletedChar = this.model.localDelete(index);
//
//              this.emit('localDelete', deletedChar);
//            });
  // }
  //
  // remoteChangeEvt() {
//     this.model.on('remoteChange', () => {
//       this.editor.value = this.model.text;
//     });
//  }
}

export default Editor;
