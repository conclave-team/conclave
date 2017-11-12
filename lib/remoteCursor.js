import cssColorNames from './cssColorNames';

export default class RemoteCursor {
  constructor(mde) {
    this.mde = mde;
    this.lastPosition = { line: 0, ch: 0 };

    const textHeight = this.mde.codemirror.defaultTextHeight();

    this.cursor = document.createElement('div');
    this.cursor.style.top = '0px';
    this.cursor.style.backgroundColor = this.generateColor();
    this.cursor.style.height = textHeight + 'px';
    this.cursor.style.width = '1.5px';
    this.cursor.style.position = 'absolute';

    this.set();
  }

  set(position) {
    if (position) { this.lastPosition = position; }

    const coords = this.mde.codemirror.cursorCoords(this.lastPosition, 'local');
    this.cursor.style.left = coords.left + 'px';
    this.mde.codemirror.getDoc().setBookmark(this.lastPosition, { widget: this.cursor });
  }

  generateColor() {
    const randIdx = Math.floor(Math.random() * cssColorNames.length);

    return cssColorNames[randIdx];
  }
}
