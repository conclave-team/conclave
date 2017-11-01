import CRDT from './crdt';
import Rx from 'rxjs/Rx';
import EventEmitter from 'events';

class Editor extends EventEmitter {
  constructor(editor) {
    super();
    this.editor = editor;
    this.model = new CRDT(Math.floor(Math.random() * 100));

    this.bindEvents();
  }

  bindEvents() {
    this.localInsertEvt();
    this.localDeleteEvt();
    this.remoteChangeEvt();
  }

  localInsertEvt() {
    const textbox = Rx.Observable.fromEvent(this.editor, 'keydown');

    textbox.filter(e => e.key.match(/^(\w|\W)$/) || e.key === 'Enter')
           .subscribe(e => {
             let char = e.key;
             char = char === 'Enter' ? '\n' : char;
             const index = e.target.value.length;
             const insertedChar = this.model.localInsert(char, index)

             this.emit('localInsert', insertedChar);
           });
  }

  localDeleteEvt() {
    const textbox = Rx.Observable.fromEvent(this.editor, 'keydown');

    textbox.filter(e => e.key === 'Backspace')
           .subscribe(e => {
             const index = e.target.value.length - 1;
             const deletedChar = this.model.localDelete(index);

             this.emit('localDelete', deletedChar);
           });
  }

  remoteChangeEvt() {
    this.model.on('remoteChange', () => {
      this.editor.value = this.model.text;
    });
  }
}

export default Editor;
