class RemoteCursor {
  constructor(mde) {
    this.mde = mde;

    const textHeight = this.mde.codemirror.defaultTextHeight();

    this.cursor = document.createElement('div');
    this.cursor.style.top = '0px';
    this.cursor.style.backgroundColor = 'black';
    this.cursor.style.height = textHeight + 'px';
    this.cursor.style.width = '1.5px';
    this.cursor.style.position = 'absolute';
  }

  moveTo(position) {
    const coords = this.mde.codemirror.cursorCoords(position, 'local');
    this.cursor.style.left = coords.left + 'px';
    this.mde.codemirror.getDoc().setBookmark(position, { widget: this.cursor });
  }
}
