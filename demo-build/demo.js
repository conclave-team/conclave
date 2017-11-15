'use strict';

var _peerjs = require('peerjs');

var _peerjs2 = _interopRequireDefault(_peerjs);

var _simplemde = require('simplemde');

var _simplemde2 = _interopRequireDefault(_simplemde);

var _controller = require('./controller');

var _controller2 = _interopRequireDefault(_controller);

var _broadcast = require('./broadcast');

var _broadcast2 = _interopRequireDefault(_broadcast);

var _editor = require('./editor');

var _editor2 = _interopRequireDefault(_editor);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

new _controller2.default(new _peerjs2.default('conclavedemo', { host: 'conclavepeerjs.herokuapp.com', port: 443, secure: true, key: 'peerjs', debug: 1 }), new _broadcast2.default(), new _editor2.default(new _simplemde2.default({
  placeholder: "Share the link to invite collaborators to your room.",
  spellChecker: false,
  toolbar: false,
  autofocus: true,
  indentWithTabs: true,
  tabSize: 4,
  indentUnit: 4,
  lineWrapping: false,
  shortCuts: []
})), []);