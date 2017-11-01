'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _crdt = require('./crdt');

var _crdt2 = _interopRequireDefault(_crdt);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Editor = function Editor($editor) {
  _classCallCheck(this, Editor);

  this.$editor = $editor;
  this.model = new _crdt2.default(10);
};

exports.default = Editor;