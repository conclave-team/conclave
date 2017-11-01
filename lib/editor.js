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
    this.charInsertEvt();
    this.specialInsertEvt();
    this.deleteEvt();
    this.remoteChangeEvt();
  }

  charInsertEvt() {
    const textbox = Rx.Observable.fromEvent(this.editor, 'keydown');

    textbox.filter(e => e.key.match(/^(\w|\W)$/))
           .subscribe(e => {
             const char = e.key;
             const index = e.target.value.length;
             const insertedChar = this.model.localInsert(char, index)

             this.emit('localInsert', insertedChar);
           });
  }

  specialInsertEvt() {
    const textbox = Rx.Observable.fromEvent(this.editor, 'keydown');

    textbox.filter(e => e.key.match(/(Enter|Tab)/))
           .subscribe(e => {
             const char = e.key === 'Enter' ? '\n' : '\t';
             const index = e.target.value.length;
             const insertedChar = this.model.localInsert(char, index)

             this.emit('localInsert', insertedChar);
           });
  }

  deleteEvt() {
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
