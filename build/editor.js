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
  function Editor(controller) {
    _classCallCheck(this, Editor);

    this.controller = controller;
    this.mde = new _simplemde2.default({
      placeholder: 'Type here...',
      spellChecker: false,
      toolbar: false
    });
  }

  _createClass(Editor, [{
    key: 'bindChangeEvent',
    value: function bindChangeEvent() {
      var _this = this;

      this.mde.codemirror.on("change", function (_, changeObj) {
        var idx = _this.findLinearIdx(changeObj.from.line, changeObj.from.ch);
        var changedChar = void 0;
        var insertion = void 0;

        if (changeObj.origin === "+input") {
          var char = changeObj.text.length > 1 ? '\n' : changeObj.text;
          changedChar = _this.controller.handleInsert(char, idx);
          _this.controller.broadcastInsertion(JSON.stringify(changedChar));
        } else if (changeObj.origin === "+delete") {
          changedChar = _this.controller.handleDelete(idx);
          _this.controller.broadcastDeletion(JSON.stringify(changedChar));
        }
      });
    }
  }, {
    key: 'updateView',
    value: function updateView(newText) {
      var cursor = this.mde.codemirror.getCursor();
      this.mde.value(newText);
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
  }]);

  return Editor;
}();

exports.default = Editor;