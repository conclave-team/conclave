'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _crdt = require('./crdt');

var _crdt2 = _interopRequireDefault(_crdt);

var _simplemde = require('simplemde');

var _simplemde2 = _interopRequireDefault(_simplemde);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Editor = function () {
  function Editor(textarea) {
    _classCallCheck(this, Editor);

    this.mde = new _simplemde2.default({
      element: textarea,
      placeholder: 'Type here...',
      spellChecker: false,
      toolbar: false
    });
    this.crdt = new _crdt2.default(Math.floor(Math.random() * 100), this);
    this.bindChangeEvent();
  }

  _createClass(Editor, [{
    key: 'bindChangeEvent',
    value: function bindChangeEvent() {
      var _this = this;

      this.mde.codemirror.on("change", function (self, changeObj) {
        var idx = _this.findLinearIdx(changeObj.from.line, changeObj.from.ch);

        if (changeObj.origin === "+input") {
          var char = changeObj.text.length > 1 ? '\n' : changeObj.text;
          _this.crdt.localInsert(char, idx);
        } else if (changeObj.origin === "+delete") {
          _this.crdt.localDelete(idx);
        }
      });
    }
  }, {
    key: 'updateView',
    value: function updateView() {
      var cursor = this.mde.codemirror.getCursor();
      this.mde.value(this.crdt.text);
      this.mde.codemirror.setCursor(cursor);
    }
  }, {
    key: 'findLinearIdx',
    value: function findLinearIdx(lineIdx, chIdx) {
      var linesOfText = this.mde.codemirror.getValue().split("\n");
      var index = 0;
      for (var i = 0; i < lineIdx; i++) {
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

  }]);

  return Editor;
}();

exports.default = Editor;