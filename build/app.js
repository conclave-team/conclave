'use strict';

var _editor = require('./editor');

var _editor2 = _interopRequireDefault(_editor);

var _jquery = require('jquery');

var _jquery2 = _interopRequireDefault(_jquery);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var editor = new _editor2.default((0, _jquery2.default)('#write'));

editor.$editor.keydown(function (e) {
  var char = e.key;
  var index = (0, _jquery2.default)(e.target).val().length;
  var charObj = editor.model.localInsert(char, index);
  console.log(index, charObj);

  (0, _jquery2.default)('#read').val(editor.model.text);
});