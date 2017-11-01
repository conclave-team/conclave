'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _crdt = require('./crdt');

var _crdt2 = _interopRequireDefault(_crdt);

var _Rx = require('rxjs/Rx');

var _Rx2 = _interopRequireDefault(_Rx);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var Editor = function (_EventEmitter) {
  _inherits(Editor, _EventEmitter);

  function Editor(editor) {
    _classCallCheck(this, Editor);

    var _this = _possibleConstructorReturn(this, (Editor.__proto__ || Object.getPrototypeOf(Editor)).call(this));

    _this.editor = editor;
    _this.model = new _crdt2.default(Math.floor(Math.random() * 100));

    _this.bindEvents();
    return _this;
  }

  _createClass(Editor, [{
    key: 'bindEvents',
    value: function bindEvents() {
      this.charInsertEvt();
      this.specialInsertEvt();
      this.deleteEvt();
      this.remoteChangeEvt();
    }
  }, {
    key: 'charInsertEvt',
    value: function charInsertEvt() {
      var _this2 = this;

      var textbox = _Rx2.default.Observable.fromEvent(this.editor, 'keydown');

      textbox.filter(function (e) {
        return e.key.match(/^(\w|\W)$/);
      }).subscribe(function (e) {
        var char = e.key;
        var index = e.target.value.length;
        var insertedChar = _this2.model.localInsert(char, index);

        _this2.emit('localInsert', insertedChar);
      });
    }
  }, {
    key: 'specialInsertEvt',
    value: function specialInsertEvt() {
      var _this3 = this;

      var textbox = _Rx2.default.Observable.fromEvent(this.editor, 'keydown');

      textbox.filter(function (e) {
        return e.key.match(/(Enter|Tab)/);
      }).subscribe(function (e) {
        var char = e.key === 'Enter' ? '\n' : '\t';
        var index = e.target.value.length;
        var insertedChar = _this3.model.localInsert(char, index);

        _this3.emit('localInsert', insertedChar);
      });
    }
  }, {
    key: 'deleteEvt',
    value: function deleteEvt() {
      var _this4 = this;

      var textbox = _Rx2.default.Observable.fromEvent(this.editor, 'keydown');

      textbox.filter(function (e) {
        return e.key === 'Backspace';
      }).subscribe(function (e) {
        var index = e.target.value.length - 1;
        var deletedChar = _this4.model.localDelete(index);

        _this4.emit('localDelete', deletedChar);
      });
    }
  }, {
    key: 'remoteChangeEvt',
    value: function remoteChangeEvt() {
      var _this5 = this;

      this.model.on('remoteChange', function () {
        _this5.editor.value = _this5.model.text;
      });
    }
  }]);

  return Editor;
}(_events2.default);

exports.default = Editor;