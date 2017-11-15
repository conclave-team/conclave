'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

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

var _version = require('./version');

var _version2 = _interopRequireDefault(_version);

var _broadcast = require('./broadcast');

var _broadcast2 = _interopRequireDefault(_broadcast);

var _v = require('uuid/v1');

var _v2 = _interopRequireDefault(_v);

var _hashAlgo = require('./hashAlgo');

var _cssColors = require('./cssColors');

var _cssColors2 = _interopRequireDefault(_cssColors);

var _cursorNames = require('./cursorNames');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Controller = function () {
  function Controller(peer, broadcast, editor, fakeUsers) {
    _classCallCheck(this, Controller);

    this.siteId = 'demo-1';
    this.buffer = [];
    this.network = [];

    this.broadcast = broadcast;
    this.broadcast.controller = this;
    this.broadcast.bindServerEvents(targetPeerId, peer);

    this.editor = editor;
    this.editor.controller = this;
    this.editor.bindChangeEvent();

    this.vector = new _versionVector2.default(this.siteId);
    this.crdt = new _crdt2.default(this);
    this.editor.onDownload();
  }

  _createClass(Controller, [{
    key: 'updateShareLink',
    value: function updateShareLink(id) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      var shareLink = this.host + '/?id=' + id;
      var aTag = doc.querySelector('#myLink');

      aTag.textContent = shareLink;
      aTag.setAttribute('href', shareLink);
    }
  }, {
    key: 'createNewUrl',
    value: function createNewUrl(id) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      var pTag = doc.querySelector('#newRoot');
      pTag.style.visibility = 'visible';

      this.rootRoom = id;

      var newRootLink = this.host + '/?id=' + id;
      var aTag = doc.querySelector("#newLink");
      aTag.textContent = newRootLink;
      aTag.setAttribute('href', newRootLink);
      aTag.style.visibility = 'visible';
    }
  }, {
    key: 'enableEditor',
    value: function enableEditor() {
      var doc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;

      doc.getElementById('wrapper').classList.remove('hide');
    }
  }, {
    key: 'removeUrl',
    value: function removeUrl() {
      var doc = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : document;

      var pTag = doc.querySelector('#newRoot');
      pTag.style.visibility = 'hidden';

      this.rootRoom = null;

      var aTag = doc.querySelector("#newLink");
      aTag.style.visibility = 'hidden';
    }
  }, {
    key: 'afterDownload',
    value: function afterDownload(e) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      doc.body.removeChild(e.target);
    }
  }, {
    key: 'populateCRDT',
    value: function populateCRDT(initialStruct) {
      // const struct = initialStruct.forEach(ch => {
      //   const char = new Char(ch.value, ch.counter, ch.siteId, ch.position.map(id => {
      //     return new Identifier(id.digit, id.siteId);
      //   }))
      //
      //   this.crdt.handleRemoteInsert(char);
      // });

      var struct = initialStruct.map(function (ch) {
        return new _char2.default(ch.value, ch.counter, ch.siteId, ch.position.map(function (id) {
          return new _identifier2.default(id.digit, id.siteId);
        }));
      });
      this.crdt.struct = struct;
      this.crdt.populateText();
      this.editor.replaceText(this.crdt.text);
    }
  }, {
    key: 'populateVersionVector',
    value: function populateVersionVector(initialVersions) {
      var _this = this;

      var versions = initialVersions.map(function (ver) {
        var version = new _version2.default(ver.siteId);
        version.counter = ver.counter;
        ver.exceptions.forEach(function (ex) {
          return version.exceptions.push(ex);
        });
        return version;
      });

      versions.forEach(function (version) {
        return _this.vector.versions.push(version);
      });
    }
  }, {
    key: 'addToNetwork',
    value: function addToNetwork(peerId, siteId) {
      var doc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document;

      if (!this.network.find(function (obj) {
        return obj.siteId === siteId;
      })) {
        this.network.push({ peerId: peerId, siteId: siteId });
        this.network.sort(function (obj1, obj2) {
          return obj1.peerId.localeCompare(obj2.peerId);
        });
        if (siteId !== this.siteId) {
          this.addToListOfPeers(siteId, peerId, doc);
        }

        this.broadcast.addToNetwork(peerId, siteId);
      }
    }
  }, {
    key: 'addRemoteCursor',
    value: function addRemoteCursor(siteId) {
      this.editor.addRemoteCursor(siteId);
    }
  }, {
    key: 'removeFromNetwork',
    value: function removeFromNetwork(peerId) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      var peerObj = this.network.find(function (obj) {
        return obj.peerId === peerId;
      });
      var idx = this.network.indexOf(peerObj);
      if (idx >= 0) {
        var deletedObj = this.network.splice(idx, 1)[0];
        this.removeFromListOfPeers(peerId, doc);
        this.editor.removeCursor(deletedObj.siteId);
        this.broadcast.removeFromNetwork(peerId);
      }
    }
  }, {
    key: 'removeRemoteCursor',
    value: function removeRemoteCursor(siteId) {
      this.editor.removeRemoteCursor(siteId);
    }
  }, {
    key: 'addToListOfPeers',
    value: function addToListOfPeers(siteId, peerId) {
      var _this2 = this;

      var doc = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : document;

      var listItem = doc.createElement('li');
      var node = doc.createElement('span');
      var color = (0, _hashAlgo.generateItemFromHash)(siteId, _cssColors2.default);
      var name = (0, _hashAlgo.generateItemFromHash)(siteId, _cursorNames.ANIMALS);

      node.textContent = name;
      node.style.backgroundColor = color;
      node.classList.add('peer');

      node.onclick = function () {
        navigator.mediaDevices.getUserMedia({ audio: true, video: true }).then(function (ms) {
          return _this2.broadcast.videoCall(peerId, ms, color);
        });
      };

      listItem.id = peerId;
      listItem.appendChild(node);
      doc.querySelector('#peerId').appendChild(listItem);
    }
  }, {
    key: 'highlightName',
    value: function highlightName(peerDOM, color) {
      peerDOM.style.border = '2px solid ' + color;
      peerDOM.style.boxShadow = '0 0 10px ' + color;
    }
  }, {
    key: 'unHighlightName',
    value: function unHighlightName(peerDOM) {
      peerDOM.style.border = 'none';
      peerDOM.style.boxShadow = 'none';
    }

    // getPeerColor(peerId) {
    //   const peer = this.network.find(net => net.peerId === peerId);
    //   const siteId = peer.siteId;
    //   return generateItemFromHash(siteId, CSS_COLORS);
    // }

  }, {
    key: 'removeFromListOfPeers',
    value: function removeFromListOfPeers(peerId) {
      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      doc.getElementById(peerId).remove();
    }
  }, {
    key: 'findNewTarget',
    value: function findNewTarget(oldId) {
      var _this3 = this;

      var connected = this.broadcast.connections.map(function (conn) {
        return conn.peer;
      });
      var unconnected = this.network.filter(function (obj) {
        return connected.indexOf(obj.peerId) === -1;
      });
      var possibleTargets = unconnected.filter(function (obj) {
        return obj.peerId !== _this3.broadcast.peer.id;
      });
      var rootRoomClosed = this.wasRootRoom(oldId);

      if (possibleTargets.length === 0) {
        this.removeUrl();
        this.broadcast.peer.on('connection', function (conn) {
          _this3.createNewUrl(conn.peer);
        });
      } else {
        var randomIdx = Math.floor(Math.random() * possibleTargets.length);
        this.broadcast.connectToNewTarget(possibleTargets[randomIdx].peerId, rootRoomClosed);
      }
    }
  }, {
    key: 'wasRootRoom',
    value: function wasRootRoom(id) {
      return id === this.rootRoom;
    }
  }, {
    key: 'handleSync',
    value: function handleSync(syncObj) {
      var _this4 = this;

      var doc = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document;

      syncObj.network.forEach(function (obj) {
        return _this4.addToNetwork(obj.peerId, obj.siteId, doc);
      });
      this.populateCRDT(syncObj.initialStruct);
      this.populateVersionVector(syncObj.initialVersions);
      this.enableEditor();
      this.syncEnd(syncObj.peerId);
    }
  }, {
    key: 'syncEnd',
    value: function syncEnd(peerId) {
      var operation = JSON.stringify({
        type: 'syncEnd',
        peerId: this.broadcast.peer.id
      });

      var connection = this.broadcast.connections.find(function (conn) {
        return conn.peer === peerId;
      });

      if (connection.open) {
        connection.send(operation);
      } else {
        connection.on('open', function () {
          connection.send(operation);
        });
      }
    }
  }, {
    key: 'handleRemoteOperation',
    value: function handleRemoteOperation(operation) {
      if (this.vector.hasBeenApplied(operation.version)) return;

      if (operation.type === 'insert') {
        this.applyOperation(operation);
      } else if (operation.type === 'delete') {
        this.buffer.push(operation);
      }

      this.processDeletionBuffer();
      this.broadcast.send(operation);
    }
  }, {
    key: 'processDeletionBuffer',
    value: function processDeletionBuffer() {
      var i = 0;
      var deleteOperation = void 0;

      while (i < this.buffer.length) {
        deleteOperation = this.buffer[i];

        if (this.hasInsertionBeenApplied(deleteOperation)) {
          this.applyOperation(deleteOperation);
          this.buffer.splice(i, 1);
        } else {
          i++;
        }
      }
    }
  }, {
    key: 'hasInsertionBeenApplied',
    value: function hasInsertionBeenApplied(operation) {
      var charVersion = { siteId: operation.char.siteId, counter: operation.char.counter };
      return this.vector.hasBeenApplied(charVersion);
    }
  }, {
    key: 'applyOperation',
    value: function applyOperation(operation) {
      var char = operation.char;
      var identifiers = char.position.map(function (pos) {
        return new _identifier2.default(pos.digit, pos.siteId);
      });
      var newChar = new _char2.default(char.value, char.counter, char.siteId, identifiers);

      if (operation.type === 'insert') {
        this.crdt.handleRemoteInsert(newChar);
      } else if (operation.type === 'delete') {
        this.crdt.handleRemoteDelete(newChar, operation.version.siteId);
      }

      this.vector.update(operation.version);
    }
  }, {
    key: 'localDelete',
    value: function localDelete(startIdx, endIdx) {
      for (var i = startIdx; i < endIdx; i++) {
        this.crdt.handleLocalDelete(startIdx);
      }
    }
  }, {
    key: 'localInsert',
    value: function localInsert(chars, idx) {
      for (var i = 0; i < chars.length; i++) {
        this.crdt.handleLocalInsert(chars[i], i + idx);
      }
    }
  }, {
    key: 'broadcastInsertion',
    value: function broadcastInsertion(char) {
      var operation = {
        type: 'insert',
        char: char,
        version: this.vector.getLocalVersion()
      };

      this.broadcast.send(operation);
    }
  }, {
    key: 'broadcastDeletion',
    value: function broadcastDeletion(char) {
      var operation = {
        type: 'delete',
        char: char,
        version: this.vector.getLocalVersion()
      };

      this.broadcast.send(operation);
    }
  }, {
    key: 'insertIntoEditor',
    value: function insertIntoEditor(value, index, siteId) {
      var substring = this.crdt.text.slice(0, index + 1);
      var linesOfText = substring.split("\n");
      var line = void 0,
          char = void 0;

      if (value === "\n") {
        line = linesOfText.length - 2;
        char = linesOfText[line].length;
      } else {
        line = linesOfText.length - 1;
        char = linesOfText[line].length - 1;
      }

      var positions = {
        from: {
          line: line,
          ch: char
        },
        to: {
          line: line,
          ch: char
        }
      };

      this.editor.insertText(value, positions, siteId);
    }
  }, {
    key: 'deleteFromEditor',
    value: function deleteFromEditor(value, index, siteId) {
      var substring = this.crdt.text.slice(0, index + 1);
      var linesOfText = substring.split("\n");
      var line = void 0,
          char = void 0,
          positions = void 0;

      if (value === "\n") {
        line = linesOfText.length - 2;
        char = linesOfText[line].length;

        positions = {
          from: {
            line: line,
            ch: char
          },
          to: {
            line: line + 1,
            ch: 0
          }
        };
      } else {
        line = linesOfText.length - 1;
        char = linesOfText[line].length - 1;

        positions = {
          from: {
            line: line,
            ch: char
          },
          to: {
            line: line,
            ch: char + 1
          }
        };
      }

      this.editor.deleteText(value, positions, siteId);
    }
  }]);

  return Controller;
}();

exports.default = Controller;