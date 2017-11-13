import CSS_COLORS from './cssColors';
import { generateItemFromHash } from './hashAlgo';
import { ANIMALS } from './cursorNames';

export default class RemoteCursor {
  constructor(mde, siteId, position) {
    this.mde = mde;

    const color = generateItemFromHash(siteId, CSS_COLORS);
    const name = generateItemFromHash(siteId, ANIMALS);

    this.createCursor(color);
    this.createFlag(color, name);

    this.cursor.appendChild(this.flag);
    this.set(position);
  }

  createCursor(color) {
    const textHeight = this.mde.codemirror.defaultTextHeight();

    this.cursor = document.createElement('div');
    this.cursor.classList.add('remote-cursor');
    this.cursor.style.backgroundColor = color;
    this.cursor.style.height = textHeight + 'px';
  }

  createFlag(color, name) {
    const cursorName = document.createTextNode(name);

    this.flag = document.createElement('span');
    this.flag.classList.add('flag');
    this.flag.style.backgroundColor = color;
    this.flag.appendChild(cursorName)
  }

  set(position) {
    this.detach();

    const coords = this.mde.codemirror.cursorCoords(position, 'local');
    this.cursor.style.left = (coords.left >= 0 ? coords.left : 0) + 'px';
    this.mde.codemirror.getDoc().setBookmark(position, { widget: this.cursor });
    this.lastPosition = position;
  }

  detach() {
    if (this.cursor.parentElement) {
        this.cursor.parentElement.remove();
    }
  }
}
