'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _identifier = require('./identifier');

var _identifier2 = _interopRequireDefault(_identifier);

var _char = require('./char');

var _char2 = _interopRequireDefault(_char);

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var CRDT = function (_EventEmitter) {
  _inherits(CRDT, _EventEmitter);

  function CRDT(peerId) {
    var base = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 16;
    var boundary = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 5;

    _classCallCheck(this, CRDT);

    var _this = _possibleConstructorReturn(this, (CRDT.__proto__ || Object.getPrototypeOf(CRDT)).call(this));

    _this.struct = [];
    _this.length = 0;
    _this.siteId = peerId;
    _this.counter = 0;
    _this.text = "";
    _this.base = base;
    _this.boundary = boundary;
    return _this;
  }

  _createClass(CRDT, [{
    key: 'insertChar',
    value: function insertChar(char) {
      this.insert(char);
      this.emit('remoteChange');
    }
  }, {
    key: 'insert',
    value: function insert(char) {
      this.struct.push(char);
      this.struct = this.sortByIdentifier();
      this.updateText();

      return ++this.length;
    }
  }, {
    key: 'localInsert',
    value: function localInsert(val, index) {
      this.incrementCounter();
      var newChar = this.generateChar(val, index);
      this.insert(newChar);
      return newChar;
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
    key: 'localDelete',
    value: function localDelete(index) {
      return this.delete(index);
    }
  }, {
    key: 'deleteChar',
    value: function deleteChar(char) {
      var idx = this.struct.indexOf(char);

      if (idx < 0) {
        throw new Error("Character could not be found");
      }
      this.delete(idx);
      this.emit('remoteChange');
    }
  }, {
    key: 'delete',
    value: function _delete(index) {
      var char = this.struct.splice(index, 1);
      this.incrementCounter();
      this.updateText();
      --this.length;
      return char[0];
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
}(_events2.default);

exports.default = CRDT;