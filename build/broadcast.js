'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _peerjs = require('peerjs');

var _peerjs2 = _interopRequireDefault(_peerjs);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Broadcast = function () {
  function Broadcast(controller) {
    _classCallCheck(this, Broadcast);

    this.controller = controller;
    this.peer = new _peerjs2.default({ key: 'mgk9l45fu1gfzuxr', debug: 1 });
    this.connections = [];
    this.bindServerEvents();
  }

  _createClass(Broadcast, [{
    key: 'send',
    value: function send(message) {
      var dataJSON = JSON.stringify(message);
      this.connections.forEach(function (conn) {
        return conn.send(dataJSON);
      });
    }
  }, {
    key: 'bindServerEvents',
    value: function bindServerEvents() {
      this.onOpen();
      this.onConnection();
    }
  }, {
    key: 'onOpen',
    value: function onOpen() {
      var _this = this;

      this.peer.on('open', function (id) {
        _this.controller.updateShareLink(id);
        _this.controller.updateSiteId(id);
      });

      if (peerId != 0) {
        this.connections.push(this.peer.connect(peerId));
        this.controller.updateConnectionList(peerId);
      }
    }
  }, {
    key: 'onConnection',
    value: function onConnection() {
      var _this2 = this;

      this.peer.on('connection', function (connection) {
        var peers = Object.keys(_this2.peer.connections);

        if (_this2.connections.length < peers.length) {
          connection.on('open', function () {
            var conn = _this2.peer.connect(peers[peers.length - 1]);
            _this2.connections.push(conn);

            _this2.controller.updateConnectionList(conn.peer);
          });
        }

        connection.on('data', function (data) {
          _this2.controller.handleRemoteOperation(data);
        });
      });
    }
  }]);

  return Broadcast;
}();

exports.default = Broadcast;