'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _sortedArray = require('./sortedArray');

var _sortedArray2 = _interopRequireDefault(_sortedArray);

var _version = require('./version');

var _version2 = _interopRequireDefault(_version);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var VersionVector = function () {
  // create a vector/list/sorted array of all versions in the network.
  function VersionVector(controller) {
    _classCallCheck(this, VersionVector);

    this.controller = controller;
    this.local = new _version2.default(controller["siteId"]);
    this.allVersions = new _sortedArray2.default(this.comparator);
    this.allVersions.insert(this.local);
  }

  _createClass(VersionVector, [{
    key: 'increment',
    value: function increment() {
      this.local.increment();
    }

    // update a version in our allVersions vector.
    // create new version if none exist.
    // create exceptions if need be.

  }, {
    key: 'update',
    value: function update(version) {
      var index = this.allVersions.indexOf(version);

      if (index < 0) {
        var newVersionEntry = new _version2.default(version.siteId);

        newVersionEntry.update(version);
        this.allVersions.insert(newVersionEntry);
      } else {
        var oldVersion = this.allVersions.get(index);

        oldVersion.update(version);
      }
    }

    // comparing function needed for SortedArray.
    // compares site ids and orders in ascending order.

  }, {
    key: 'comparator',
    value: function comparator(version1, version2) {
      var site1 = version1.siteId;
      var site2 = version2.siteId;

      if (site1 < site2) {
        return -1;
      } else if (site1 > site2) {
        return 1;
      } else {
        return 0;
      }
    }

    // check to see if remote operation has already been integrated

  }, {
    key: 'isDuplicate',
    value: function isDuplicate(remoteVersion) {
      // if (version === undefined || version === null) return false;

      var index = this.allVersions.indexOf(remoteVersion);
      var localVersion = this.allVersions.get(index);

      return !!localVersion && remoteVersion.counter <= localVersion.counter && !localVersion.exceptions.has(remoteVersion.counter);
    }
  }, {
    key: 'getLatest',
    value: function getLatest() {
      return {
        siteId: this.local.siteId,
        counter: this.local.counter
      };
    }
  }]);

  return VersionVector;
}();

exports.default = VersionVector;