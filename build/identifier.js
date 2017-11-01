"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Identifier = function () {
  function Identifier(digit, siteId) {
    _classCallCheck(this, Identifier);

    this.digit = digit;
    this.siteId = siteId;
  }

  _createClass(Identifier, [{
    key: "compareTo",
    value: function compareTo(otherId) {
      if (this.digit < otherId.digit) {
        return -1;
      } else if (this.digit > otherId.digit) {
        return 1;
      } else {
        if (this.siteId < otherId.siteId) {
          return -1;
        } else if (this.siteId > otherId.siteId) {
          return 1;
        } else {
          return 0;
        }
      }
    }
  }]);

  return Identifier;
}();

exports.default = Identifier;