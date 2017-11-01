import CRDT from './crdt';

class Editor {
  constructor($editor) {
    this.$editor = $editor;
    this.model = new CRDT(10);

    // this.bindEvents();
  }

  bindEvents() {
    this.keyDownEvt();
  }

  keyDownEvt() {
    const self = this;

    this.$editor.keydown(e => {
      const char = e.key;
      let index;

      if (char === 'backspace' || !char.match(/^(\w|\W)$/)) {
        return false;
      }

      if (char === 'backspace') {
        index = self.$editor.val().length - 1;
        return this.model.localDelete(index);
      } else {
        index = self.$editor.val().length;
        return this.model.localInsert(char, index);
      }
    });
  }
}

export default Editor;
