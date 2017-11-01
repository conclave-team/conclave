'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _crdt = require('./crdt');

var _crdt2 = _interopRequireDefault(_crdt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Editor = function () {
  function Editor($editor) {
    _classCallCheck(this, Editor);

    this.$editor = $editor;
    this.model = new _crdt2.default(10);

    // this.bindEvents();
  }

  _createClass(Editor, [{
    key: 'bindEvents',
    value: function bindEvents() {
      this.keyDownEvt();
    }
  }, {
    key: 'keyDownEvt',
    value: function keyDownEvt() {
      var _this = this;

      var self = this;

      this.$editor.keydown(function (e) {
        var char = e.key;
        var index = void 0;

        if (char === 'backspace' || !char.match(/^(\w|\W)$/)) {
          return false;
        }

        if (char === 'backspace') {
          index = self.$editor.val().length - 1;
          return _this.model.localDelete(index);
        } else {
          index = self.$editor.val().length;
          return _this.model.localInsert(char, index);
        }
      });
    }
  }]);

  return Editor;
}();

exports.default = Editor;