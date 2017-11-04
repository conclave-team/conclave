'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _editor = require('./editor');

var _editor2 = _interopRequireDefault(_editor);

var _crdt = require('./crdt');

var _crdt2 = _interopRequireDefault(_crdt);

var _char = require('./char');

var _char2 = _interopRequireDefault(_char);

var _identifier = require('./identifier');

var _identifier2 = _interopRequireDefault(_identifier);

var _versionVector = require('./versionVector');

var _versionVector2 = _interopRequireDefault(_versionVector);

var _broadcast = require('./broadcast');

var _broadcast2 = _interopRequireDefault(_broadcast);

var _v = require('uuid/v1');

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Controller = function () {
  function Controller() {
    _classCallCheck(this, Controller);

    this.siteId = (0, _v2.default)();
    this.editor = new _editor2.default(this);
    this.crdt = new _crdt2.default(this);
    this.vector = new _versionVector2.default(this);
    this.broadcast = new _broadcast2.default(this);
  }

  _createClass(Controller, [{
    key: 'updateShareLink',
    value: function updateShareLink(id) {
      var sharingLink = host + '/?id=' + id;
      var aTag = document.querySelector('#myLink');

      aTag.append(sharingLink);
      aTag.setAttribute('href', sharingLink);
      this.editor.bindChangeEvent();
    }
  }, {
    key: 'updateConnectionList',
    value: function updateConnectionList(id) {
      var node = document.createElement('LI');

      node.appendChild(document.createTextNode(id));
      document.querySelector('#peerId').appendChild(node);
    }
  }, {
    key: 'updateSiteId',
    value: function updateSiteId(id) {
      this.siteId = id;
      this.crdt.siteId = id;
    }
  }, {
    key: 'handleRemoteOperation',
    value: function handleRemoteOperation(data) {
      var dataObj = JSON.parse(data);
      var char = dataObj.char;
      var currentVersion = dataObj.currentVersion;

      var identifiers = char.position.map(function (pos) {
        return new _identifier2.default(pos.digit, pos.siteId);
      });
      var charObj = new _char2.default(char.value[0], char.counter, identifiers);

      var charVersion = { siteId: charObj.siteId, counter: charObj.counter };

      if (this.vector.isDuplicate(currentVersion)) return false;

      if (dataObj.op === 'insert') {
        this.crdt.insertChar(charObj);
      } else if (dataObj.op === 'delete') {
        if (!this.vector.isDuplicate(charVersion)) return false;

        this.crdt.deleteChar(charObj);
      }

      this.broadcast.send(dataObj);
      this.vector.update(currentVersion);
      this.editor.updateView();
    }
  }, {
    key: 'handleDelete',
    value: function handleDelete(idx) {
      this.crdt.handleLocalDelete(idx);
    }
  }, {
    key: 'handleInsert',
    value: function handleInsert(char, idx) {
      this.crdt.handleLocalInsert(char, idx);
    }
  }, {
    key: 'broadcastInsertion',
    value: function broadcastInsertion(char) {
      this.vector.increment();

      var message = {
        op: 'insert',
        char: char,
        currentVersion: this.vector.getLatest()
      };

      this.broadcast.send(message);
    }
  }, {
    key: 'broadcastDeletion',
    value: function broadcastDeletion(char) {
      this.vector.increment();

      var message = {
        op: 'delete',
        char: char,
        currentVersion: this.vector.getLatest()
      };

      this.broadcast.send(message);
    }
  }, {
    key: 'updateEditor',
    value: function updateEditor() {
      this.editor.updateView(this.crdt.text);
    }
  }]);

  return Controller;
}();

new Controller();