import CRDT from './crdt';

class Editor {
  constructor($editor) {
    this.$editor = $editor;
    this.model = new CRDT(10);
  }
}

export default Editor;
