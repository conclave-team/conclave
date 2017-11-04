'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sortedCmpArray = require('sorted-cmp-array');

var _sortedCmpArray2 = _interopRequireDefault(_sortedCmpArray);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

// Extending SortedArray functionality from 'sorted-cmp-array'.
// Adding a 'get' method for retrieving elements.
var SortedArray = function (_sorted) {
  _inherits(SortedArray, _sorted);

  function SortedArray(compareFn) {
    _classCallCheck(this, SortedArray);

    return _possibleConstructorReturn(this, (SortedArray.__proto__ || Object.getPrototypeOf(SortedArray)).call(this, compareFn));
  }

  _createClass(SortedArray, [{
    key: 'get',
    value: function get(idx) {
      return this.arr[idx];
    }
  }]);

  return SortedArray;
}(_sortedCmpArray2.default);

exports.default = SortedArray;