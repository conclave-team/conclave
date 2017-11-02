'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _identifier = require('./identifier');

var _identifier2 = _interopRequireDefault(_identifier);

var _char = require('./char');

var _char2 = _interopRequireDefault(_char);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var CRDT = function () {
  function CRDT(peerId, editor) {
    var base = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 16;
    var boundary = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 5;

    _classCallCheck(this, CRDT);

    this.struct = [];
    this.length = 0;
    this.siteId = peerId;
    this.counter = 0;
    this.text = "";
    this.base = base;
    this.boundary = boundary;
    this.conns = [];
    this.editor = editor;
  }

  _createClass(CRDT, [{
    key: 'localInsert',
    value: function localInsert(val, index) {
      this.incrementCounter();
      var newChar = this.generateChar(val, index);
      this.insertAndRelay(newChar);
      return newChar;
    }
    // also called when peer.on("data", insert char data)

  }, {
    key: 'insertAndRelay',
    value: function insertAndRelay(char) {
      this.struct.push(char);
      this.struct = this.sortByIdentifier();
      this.updateText();
      this.editor.updateView();
      this.broadcastInsertion(char);
      return ++this.length;
    }
  }, {
    key: 'broadcastInsertion',
    value: function broadcastInsertion(char) {
      // something like peer.send(char data) for each connection
      this.conns[0] && this.conns[0].insertAndRelay(char);
    }
  }, {
    key: 'localDelete',
    value: function localDelete(index) {
      this.incrementCounter();
      var deletedChar = this.struct[index];
      this.deleteAndRelay(deletedChar);
      return deletedChar;
    }
    // also called when peer.on("data", char object)

  }, {
    key: 'deleteAndRelay',
    value: function deleteAndRelay(char) {
      var idx = this.struct.indexOf(char);
      if (idx < 0) {
        throw new Error("Character could not be found");
      }

      this.struct.splice(idx, 1);
      this.updateText();
      this.editor.updateView();
      this.broadcastDeletion(char);
      return --this.length;
    }
  }, {
    key: 'broadcastDeletion',
    value: function broadcastDeletion(char) {
      // something like peer.send(delete char) for each connection
      this.conns[0] && this.conns[0].deleteAndRelay(char);
    }
  }, {
    key: 'generateChar',
    value: function generateChar(val, index) {
      var posBefore = this.struct[index - 1] && this.struct[index - 1].position || [];
      var posAfter = this.struct[index] && this.struct[index].position || [];
      var newPos = this.generatePosBetween(posBefore, posAfter);
      return new _char2.default(val, this.counter, newPos);
    }
  }, {
    key: 'generatePosBetween',
    value: function generatePosBetween(pos1, pos2) {
      var newPos = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : [];
      var level = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : 0;

      var base = Math.pow(2, level) * this.base;
      var positive = level % 2 === 0 ? true : false;

      var id1 = pos1[0] || new _identifier2.default(0, this.siteId);
      var id2 = pos2[0] || new _identifier2.default(base, this.siteId);

      if (id2.digit - id1.digit > 1) {

        var newDigit = this.allocateId(id1.digit, id2.digit, positive);
        newPos.push(new _identifier2.default(newDigit, this.siteId));
        return newPos;
      } else if (id2.digit - id1.digit === 1) {

        newPos.push(id1);
        return this.generatePosBetween(pos1.slice(1), [], newPos, level + 1);
      } else if (id1.digit === id2.digit) {
        if (id1.siteId < id2.siteId) {
          newPos.push(id1);
          return this.generatePosBetween(pos1.slice(1), [], newPos, level + 1);
        } else if (id1.siteId === id2.siteId) {
          newPos.push(id1);
          return this.generatePosBetween(pos1.slice(1), pos2.slice(1), newPos, level + 1);
        } else {
          throw new Error("Fix Position Sorting");
        }
      }
    }
  }, {
    key: 'allocateId',
    value: function allocateId(min, max, positive) {
      if (positive) {
        min = min + 1;
        if (this.boundary < max - min - 1) {
          max = min + this.boundary;
        }
      } else {
        if (this.boundary < max - min) {
          min = max - this.boundary;
        } else {
          min = min + 1;
        }
      }
      return Math.floor(Math.random() * (max - min)) + min;
    }
  }, {
    key: 'updateText',
    value: function updateText() {
      this.text = this.struct.map(function (char) {
        return char.value;
      }).join('');
    }
  }, {
    key: 'sortByIdentifier',
    value: function sortByIdentifier() {
      return this.struct.sort(function (char1, char2) {
        return char1.comparePositionTo(char2);
      });
    }
  }, {
    key: 'incrementCounter',
    value: function incrementCounter() {
      this.counter++;
    }
  }]);

  return CRDT;
}();

exports.default = CRDT;