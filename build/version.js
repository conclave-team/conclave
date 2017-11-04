"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

// Class that wraps the information about each version.
// exceptions are a set of counters for operations that our local CRDT has not
// seen or integrated yet. Waiting for these operations.
var Version = function () {
  function Version(siteId) {
    _classCallCheck(this, Version);

    this.siteId = siteId;
    this.counter = 0;
    this.exceptions = new Set();
  }

  // increment local version counter by one.


  _createClass(Version, [{
    key: "increment",
    value: function increment() {
      this.counter += 1;
    }

    // updating local version counter based on a remote operation that has
    // been received. Create exceptions if operation was received out of order.

  }, {
    key: "update",
    value: function update(version) {
      var otherCounter = version.counter;

      if (otherCounter <= this.counter) {
        this.exceptions.delete(otherCounter);
      } else if (otherCounter === this.counter + 1) {
        this.increment();
      } else {
        for (var i = this.counter + 1; i < otherCounter; i++) {
          this.exceptions.add(i);
        }

        this.counter = otherCounter;
      }
    }
  }]);

  return Version;
}();

exports.default = Version;