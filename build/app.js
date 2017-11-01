'use strict';

var _editor = require('./editor');

var _editor2 = _interopRequireDefault(_editor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var editor1 = new _editor2.default(document.querySelector('#edit-1'));
var editor2 = new _editor2.default(document.querySelector('#edit-2'));

editor1.on('localInsert', function (char) {
  editor2.model.insertChar(char);
});

editor2.on('localInsert', function (char) {
  editor1.model.insertChar(char);
});

editor1.on('localDelete', function (char) {
  editor2.model.deleteChar(char);
});

<<<<<<< HEAD
editor2.on('localDelete', function (char) {
  editor1.model.deleteChar(char);
});
=======
  (0, _jquery2.default)('#read').val(editor.model.text);
});
>>>>>>> 6a904cfba4b7162f89d7dcc34dc9c54278304a0b
