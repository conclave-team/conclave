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
  function CRDT(controller) {
    var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 16;
    var boundary = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5;

    _classCallCheck(this, CRDT);

    this.controller = controller;
    this.struct = [];
    this.siteId = controller.siteId;
    this.counter = 0;
    this.text = "";
    this.base = base;
    this.boundary = boundary;
  }

  _createClass(CRDT, [{
    key: 'handleLocalInsert',
    value: function handleLocalInsert(val, index) {
      var newChar = this.generateChar(val, index);
      this.incrementCounter();
      this.insertChar(newChar);
      return newChar;
    }
  }, {
    key: 'insertChar',
    value: function insertChar(char) {
      this.broadcastInsert(char);
      this.struct.push(char);
      this.struct = this.sortByIdentifier();
      this.updateText();
      this.controller.updateEditor();
    }
  }, {
    key: 'broadcastInsert',
    value: function broadcastInsert(char) {
      this.controller.broadcastInsertion(JSON.stringify(char));
    }
  }, {
    key: 'handleLocalDelete',
    value: function handleLocalDelete(index) {
      var deletedChar = this.struct[index];
      this.incrementCounter();
      this.deleteChar(deletedChar);
      return deletedChar;
    }
  }, {
    key: 'deleteChar',
    value: function deleteChar(char) {
      this.broadcastDelete(char);

      var idx = this.struct.indexOf(char);
      if (idx < 0) {
        throw new Error("Character could not be found");
      }

      this.struct.splice(idx, 1);
      this.updateText();
      this.controller.updateEditor();
    }
  }, {
    key: 'broadcastDelete',
    value: function broadcastDelete(char) {
      this.controller.broadcastDeletion(JSON.stringify(char));
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