/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebRtcPeer = __webpack_require__(1);

/**
 * Native WebRTC Adapter (native-webrtc)
 * For use with uws-server.js
 * networked-scene: serverURL needs to be ws://localhost:8080 when running locally
 */

var NativeWebRtcAdapter = function () {
  function NativeWebRtcAdapter() {
    _classCallCheck(this, NativeWebRtcAdapter);

    if (io === undefined) console.warn('It looks like socket.io has not been loaded before NativeWebRtcAdapter. Please do that.');

    this.app = "default";
    this.room = "default";
    this.occupantListener = null;
    this.myRoomJoinTime = null;

    this.peers = {}; // id -> WebRtcPeer
    this.occupants = {}; // id -> joinTimestamp
  }

  _createClass(NativeWebRtcAdapter, [{
    key: "setServerUrl",
    value: function setServerUrl(wsUrl) {
      this.wsUrl = wsUrl;
    }
  }, {
    key: "setApp",
    value: function setApp(appName) {
      this.app = appName;
    }
  }, {
    key: "setRoom",
    value: function setRoom(roomName) {
      this.room = roomName;
    }
  }, {
    key: "setWebRtcOptions",
    value: function setWebRtcOptions(options) {
      if (options.datachannel === false) console.warn("NativeWebRtcAdapter.setWebRtcOptions: datachannel must be true.");
      if (options.audio === true) console.warn("NativeWebRtcAdapter does not support audio yet.");
      if (options.video === true) console.warn("NativeWebRtcAdapter does not support video yet.");
    }
  }, {
    key: "setServerConnectListeners",
    value: function setServerConnectListeners(successListener, failureListener) {
      this.connectSuccess = successListener;
      this.connectFailure = failureListener;
    }
  }, {
    key: "setRoomOccupantListener",
    value: function setRoomOccupantListener(occupantListener) {
      this.occupantListener = occupantListener;
    }
  }, {
    key: "setDataChannelListeners",
    value: function setDataChannelListeners(openListener, closedListener, messageListener) {
      this.openListener = openListener;
      this.closedListener = closedListener;
      this.messageListener = messageListener;
    }
  }, {
    key: "connect",
    value: function connect() {
      var _this = this;

      var self = this;

      if (!this.wsUrl || this.wsUrl === "/") {
        if (location.protocol === "https:") {
          this.wsUrl = "wss://" + location.host;
        } else {
          this.wsUrl = "ws://" + location.host;
        }
      }

      NAF.log.write("Attempting to connect to socket.io");
      var socket = this.socket = io(this.wsUrl);

      socket.on("connect", function () {
        NAF.log.write("User connected", socket.id);
        self.joinRoom();
      });

      socket.on("connectSuccess", function (data) {
        var joinedTime = data.joinedTime;


        _this.myRoomJoinTime = joinedTime;
        NAF.log.write("Successfully joined room", _this.room, "at server time", joinedTime);
        self.connectSuccess(socket.id);
      });

      socket.on("error", function (err) {
        console.error("Socket connection failure", err);
        self.connectFailure();
      });

      socket.on("occupantsChanged", function (data) {
        var occupants = data.occupants;

        NAF.log.write('occupants changed', data);
        self.receivedOccupants(occupants);
      });

      function receiveData(packet) {
        var from = packet.from;
        var type = packet.type;
        var data = packet.data;
        if (type === 'ice-candidate') {
          self.peers[from].handleSignal(data);
          return;
        }
        self.messageListener(from, type, data);
      }

      socket.on("send", receiveData);
      socket.on("broadcast", receiveData);
    }
  }, {
    key: "joinRoom",
    value: function joinRoom() {
      NAF.log.write("Joining room", this.room);
      this.socket.emit("joinRoom", { room: this.room });
    }
  }, {
    key: "receivedOccupants",
    value: function receivedOccupants(occupants) {
      var _this2 = this;

      delete occupants[NAF.clientId];

      this.occupants = occupants;

      NAF.log.write('occupants=', occupants);
      var self = this;
      var localId = NAF.clientId;

      var _loop = function _loop() {
        var remoteId = key;
        if (_this2.peers[remoteId]) return "continue";

        var peer = new WebRtcPeer(localId, remoteId, function (data) {
          self.socket.emit('send', {
            from: localId,
            to: remoteId,
            type: 'ice-candidate',
            data: data,
            sending: true
          });
        });
        peer.setDatachannelListeners(self.openListener, self.closedListener, self.messageListener);

        self.peers[remoteId] = peer;
      };

      for (var key in occupants) {
        var _ret = _loop();

        if (_ret === "continue") continue;
      }

      NAF.log.write('peers', self.peers);

      this.occupantListener(occupants);
    }
  }, {
    key: "shouldStartConnectionTo",
    value: function shouldStartConnectionTo(client) {
      return (this.myRoomJoinTime || 0) <= (client || 0);
    }
  }, {
    key: "startStreamConnection",
    value: function startStreamConnection(remoteId) {
      NAF.log.write('starting offer process');
      this.peers[remoteId].offer();
    }
  }, {
    key: "closeStreamConnection",
    value: function closeStreamConnection(clientId) {
      NAF.log.write('closeStreamConnection', clientId, this.peers);
      this.peers[clientId].close();
      delete this.peers[clientId];
      delete this.occupants[clientId];
      this.closedListener(clientId);
    }
  }, {
    key: "getConnectStatus",
    value: function getConnectStatus(clientId) {
      var peer = this.peers[clientId];

      if (peer === undefined) return NAF.adapters.NOT_CONNECTED;

      switch (peer.getStatus()) {
        case WebRtcPeer.IS_CONNECTED:
          return NAF.adapters.IS_CONNECTED;

        case WebRtcPeer.CONNECTING:
          return NAF.adapters.CONNECTING;

        case WebRtcPeer.NOT_CONNECTED:
        default:
          return NAF.adapters.NOT_CONNECTED;
      }
    }
  }, {
    key: "sendData",
    value: function sendData(to, type, data) {
      this.peers[to].send(type, data);
    }
  }, {
    key: "sendDataGuaranteed",
    value: function sendDataGuaranteed(to, type, data) {
      var packet = {
        from: NAF.clientId,
        to: to,
        type: type,
        data: data,
        sending: true
      };

      this.socket.emit("send", packet);
    }
  }, {
    key: "broadcastData",
    value: function broadcastData(type, data) {
      for (var clientId in this.peers) {
        this.sendData(clientId, type, data);
      }
    }
  }, {
    key: "broadcastDataGuaranteed",
    value: function broadcastDataGuaranteed(type, data) {
      var packet = {
        from: NAF.clientId,
        type: type,
        data: data,
        broadcasting: true
      };
      this.socket.emit("broadcast", packet);
    }
  }, {
    key: "getMediaStream",
    value: function getMediaStream(clientId) {
      // TODO implement audio
      // var that = this;
      // if (this.audioStreams[clientId]) {
      //   NAF.log.write("Already had audio for " + clientId);
      //   return Promise.resolve(this.audioStreams[clientId]);
      // } else {
      //   NAF.log.write("Waiting on audio for " + clientId);
      //   return new Promise(function(resolve) {
      //     that.pendingAudioRequest[clientId] = resolve;
      //   });
      // }
      return Promise.reject('Interface method not implemented: getMediaStream');
    }
  }, {
    key: "updateTimeOffset",
    value: function updateTimeOffset() {
      var _this3 = this;

      var clientSentTime = Date.now() + this.avgTimeOffset;

      return fetch(document.location.href, { method: "HEAD", cache: "no-cache" }).then(function (res) {
        var precision = 1000;
        var serverReceivedTime = new Date(res.headers.get("Date")).getTime() + precision / 2;
        var clientReceivedTime = Date.now();
        var serverTime = serverReceivedTime + (clientReceivedTime - clientSentTime) / 2;
        var timeOffset = serverTime - clientReceivedTime;

        _this3.serverTimeRequests++;

        if (_this3.serverTimeRequests <= 10) {
          _this3.timeOffsets.push(timeOffset);
        } else {
          _this3.timeOffsets[_this3.serverTimeRequests % 10] = timeOffset;
        }

        _this3.avgTimeOffset = _this3.timeOffsets.reduce(function (acc, offset) {
          return acc += offset;
        }, 0) / _this3.timeOffsets.length;

        if (_this3.serverTimeRequests > 10) {
          setTimeout(function () {
            return _this3.updateTimeOffset();
          }, 5 * 60 * 1000); // Sync clock every 5 minutes.
        } else {
          _this3.updateTimeOffset();
        }
      });
    }
  }, {
    key: "getServerTime",
    value: function getServerTime() {
      return -1; // TODO implement
    }
  }]);

  return NativeWebRtcAdapter;
}();

NAF.adapters.register("native-webrtc", NativeWebRtcAdapter);

module.exports = NativeWebRtcAdapter;

/***/ }),
/* 1 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebRtcPeer = function () {
  function WebRtcPeer(localId, remoteId, sendSignalFunc) {
    _classCallCheck(this, WebRtcPeer);

    this.localId = localId;
    this.remoteId = remoteId;
    this.sendSignalFunc = sendSignalFunc;
    this.open = false;
    this.channelLabel = "networked-aframe-channel";

    this.pc = this.createPeerConnection();
    this.channel = null;
  }

  _createClass(WebRtcPeer, [{
    key: "setDatachannelListeners",
    value: function setDatachannelListeners(openListener, closedListener, messageListener) {
      this.openListener = openListener;
      this.closedListener = closedListener;
      this.messageListener = messageListener;
    }
  }, {
    key: "offer",
    value: function offer() {
      var self = this;
      // reliable: false - UDP
      this.setupChannel(this.pc.createDataChannel(this.channelLabel, { reliable: false }));
      this.pc.createOffer(function (sdp) {
        self.handleSessionDescription(sdp);
      }, function (error) {
        NAF.log.error("WebRtcPeer.offer: " + error);
      });
    }
  }, {
    key: "handleSignal",
    value: function handleSignal(signal) {
      // ignores signal if it isn't for me
      if (this.localId !== signal.to || this.remoteId !== signal.from) return;

      switch (signal.type) {
        case "offer":
          this.handleOffer(signal);
          break;

        case "answer":
          this.handleAnswer(signal);
          break;

        case "candidate":
          this.handleCandidate(signal);
          break;

        default:
          NAF.log.error("WebRtcPeer.handleSignal: Unknown signal type " + signal.type);
          break;
      }
    }
  }, {
    key: "send",
    value: function send(type, data) {
      if (this.channel === null || this.channel.readyState !== "open") {
        return;
      }

      this.channel.send(JSON.stringify({ type: type, data: data }));
    }
  }, {
    key: "getStatus",
    value: function getStatus() {
      if (this.channel === null) return WebRtcPeer.NOT_CONNECTED;

      switch (this.channel.readyState) {
        case "open":
          return WebRtcPeer.IS_CONNECTED;

        case "connecting":
          return WebRtcPeer.CONNECTING;

        case "closing":
        case "closed":
        default:
          return WebRtcPeer.NOT_CONNECTED;
      }
    }

    /*
     * Privates
     */

  }, {
    key: "createPeerConnection",
    value: function createPeerConnection() {
      var self = this;
      var RTCPeerConnection = window.RTCPeerConnection || window.webkitRTCPeerConnection || window.mozRTCPeerConnection || window.msRTCPeerConnection;

      if (RTCPeerConnection === undefined) {
        throw new Error("WebRtcPeer.createPeerConnection: This browser does not seem to support WebRTC.");
      }

      var pc = new RTCPeerConnection({ iceServers: WebRtcPeer.ICE_SERVERS });

      pc.onicecandidate = function (event) {
        if (event.candidate) {
          self.sendSignalFunc({
            from: self.localId,
            to: self.remoteId,
            type: "candidate",
            sdpMLineIndex: event.candidate.sdpMLineIndex,
            candidate: event.candidate.candidate
          });
        }
      };

      // Note: seems like channel.onclose hander is unreliable on some platforms,
      //       so also tries to detect disconnection here.
      pc.oniceconnectionstatechange = function () {
        if (self.open && pc.iceConnectionState === "disconnected") {
          self.open = false;
          self.closedListener(self.remoteId);
        }
      };

      return pc;
    }
  }, {
    key: "setupChannel",
    value: function setupChannel(channel) {
      var self = this;

      this.channel = channel;

      // received data from a remote peer
      this.channel.onmessage = function (event) {
        var data = JSON.parse(event.data);
        self.messageListener(self.remoteId, data.type, data.data);
      };

      // connected with a remote peer
      this.channel.onopen = function (event) {
        self.open = true;
        self.openListener(self.remoteId);
      };

      // disconnected with a remote peer
      this.channel.onclose = function (event) {
        if (!self.open) return;
        self.open = false;
        self.closedListener(self.remoteId);
      };

      // error occurred with a remote peer
      this.channel.onerror = function (error) {
        NAF.log.error("WebRtcPeer.channel.onerror: " + error);
      };
    }
  }, {
    key: "handleOffer",
    value: function handleOffer(message) {
      var self = this;

      this.pc.ondatachannel = function (event) {
        self.setupChannel(event.channel);
      };

      this.setRemoteDescription(message);

      this.pc.createAnswer(function (sdp) {
        self.handleSessionDescription(sdp);
      }, function (error) {
        NAF.log.error("WebRtcPeer.handleOffer: " + error);
      });
    }
  }, {
    key: "handleAnswer",
    value: function handleAnswer(message) {
      this.setRemoteDescription(message);
    }
  }, {
    key: "handleCandidate",
    value: function handleCandidate(message) {
      var self = this;
      var RTCIceCandidate = window.RTCIceCandidate || window.webkitRTCIceCandidate || window.mozRTCIceCandidate;

      this.pc.addIceCandidate(new RTCIceCandidate(message), function () {}, function (error) {
        NAF.log.error("WebRtcPeer.handleCandidate: " + error);
      });
    }
  }, {
    key: "handleSessionDescription",
    value: function handleSessionDescription(sdp) {
      var self = this;

      this.pc.setLocalDescription(sdp, function () {}, function (error) {
        NAF.log.error("WebRtcPeer.handleSessionDescription: " + error);
      });

      this.sendSignalFunc({
        from: this.localId,
        to: this.remoteId,
        type: sdp.type,
        sdp: sdp.sdp
      });
    }
  }, {
    key: "setRemoteDescription",
    value: function setRemoteDescription(message) {
      var self = this;
      var RTCSessionDescription = window.RTCSessionDescription || window.webkitRTCSessionDescription || window.mozRTCSessionDescription || window.msRTCSessionDescription;

      this.pc.setRemoteDescription(new RTCSessionDescription(message), function () {}, function (error) {
        NAF.log.error("WebRtcPeer.setRemoteDescription: " + error);
      });
    }
  }, {
    key: "close",
    value: function close() {
      if (this.pc) {
        this.pc.close();
      }
    }
  }]);

  return WebRtcPeer;
}();

WebRtcPeer.IS_CONNECTED = "IS_CONNECTED";
WebRtcPeer.CONNECTING = "CONNECTING";
WebRtcPeer.NOT_CONNECTED = "NOT_CONNECTED";

WebRtcPeer.ICE_SERVERS = [{ urls: "stun:stun1.l.google.com:19302" }, { urls: "stun:stun2.l.google.com:19302" }, { urls: "stun:stun3.l.google.com:19302" }, { urls: "stun:stun4.l.google.com:19302" }];

module.exports = WebRtcPeer;

/***/ })
/******/ ]);
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgODQ4ZTQ5ZWY3MWM4ZmZiY2EzYzQiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9XZWJSdGNQZWVyLmpzIl0sIm5hbWVzIjpbIldlYlJ0Y1BlZXIiLCJyZXF1aXJlIiwiTmF0aXZlV2ViUnRjQWRhcHRlciIsImlvIiwidW5kZWZpbmVkIiwiY29uc29sZSIsIndhcm4iLCJhcHAiLCJyb29tIiwib2NjdXBhbnRMaXN0ZW5lciIsIm15Um9vbUpvaW5UaW1lIiwicGVlcnMiLCJvY2N1cGFudHMiLCJ3c1VybCIsImFwcE5hbWUiLCJyb29tTmFtZSIsIm9wdGlvbnMiLCJkYXRhY2hhbm5lbCIsImF1ZGlvIiwidmlkZW8iLCJzdWNjZXNzTGlzdGVuZXIiLCJmYWlsdXJlTGlzdGVuZXIiLCJjb25uZWN0U3VjY2VzcyIsImNvbm5lY3RGYWlsdXJlIiwib3Blbkxpc3RlbmVyIiwiY2xvc2VkTGlzdGVuZXIiLCJtZXNzYWdlTGlzdGVuZXIiLCJzZWxmIiwibG9jYXRpb24iLCJwcm90b2NvbCIsImhvc3QiLCJOQUYiLCJsb2ciLCJ3cml0ZSIsInNvY2tldCIsIm9uIiwiaWQiLCJqb2luUm9vbSIsImRhdGEiLCJqb2luZWRUaW1lIiwiZXJyb3IiLCJlcnIiLCJyZWNlaXZlZE9jY3VwYW50cyIsInJlY2VpdmVEYXRhIiwicGFja2V0IiwiZnJvbSIsInR5cGUiLCJoYW5kbGVTaWduYWwiLCJlbWl0IiwiY2xpZW50SWQiLCJsb2NhbElkIiwicmVtb3RlSWQiLCJrZXkiLCJwZWVyIiwidG8iLCJzZW5kaW5nIiwic2V0RGF0YWNoYW5uZWxMaXN0ZW5lcnMiLCJjbGllbnQiLCJvZmZlciIsImNsb3NlIiwiYWRhcHRlcnMiLCJOT1RfQ09OTkVDVEVEIiwiZ2V0U3RhdHVzIiwiSVNfQ09OTkVDVEVEIiwiQ09OTkVDVElORyIsInNlbmQiLCJzZW5kRGF0YSIsImJyb2FkY2FzdGluZyIsIlByb21pc2UiLCJyZWplY3QiLCJjbGllbnRTZW50VGltZSIsIkRhdGUiLCJub3ciLCJhdmdUaW1lT2Zmc2V0IiwiZmV0Y2giLCJkb2N1bWVudCIsImhyZWYiLCJtZXRob2QiLCJjYWNoZSIsInRoZW4iLCJwcmVjaXNpb24iLCJzZXJ2ZXJSZWNlaXZlZFRpbWUiLCJyZXMiLCJoZWFkZXJzIiwiZ2V0IiwiZ2V0VGltZSIsImNsaWVudFJlY2VpdmVkVGltZSIsInNlcnZlclRpbWUiLCJ0aW1lT2Zmc2V0Iiwic2VydmVyVGltZVJlcXVlc3RzIiwidGltZU9mZnNldHMiLCJwdXNoIiwicmVkdWNlIiwiYWNjIiwib2Zmc2V0IiwibGVuZ3RoIiwic2V0VGltZW91dCIsInVwZGF0ZVRpbWVPZmZzZXQiLCJyZWdpc3RlciIsIm1vZHVsZSIsImV4cG9ydHMiLCJzZW5kU2lnbmFsRnVuYyIsIm9wZW4iLCJjaGFubmVsTGFiZWwiLCJwYyIsImNyZWF0ZVBlZXJDb25uZWN0aW9uIiwiY2hhbm5lbCIsInNldHVwQ2hhbm5lbCIsImNyZWF0ZURhdGFDaGFubmVsIiwicmVsaWFibGUiLCJjcmVhdGVPZmZlciIsInNkcCIsImhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbiIsInNpZ25hbCIsImhhbmRsZU9mZmVyIiwiaGFuZGxlQW5zd2VyIiwiaGFuZGxlQ2FuZGlkYXRlIiwicmVhZHlTdGF0ZSIsIkpTT04iLCJzdHJpbmdpZnkiLCJSVENQZWVyQ29ubmVjdGlvbiIsIndpbmRvdyIsIndlYmtpdFJUQ1BlZXJDb25uZWN0aW9uIiwibW96UlRDUGVlckNvbm5lY3Rpb24iLCJtc1JUQ1BlZXJDb25uZWN0aW9uIiwiRXJyb3IiLCJpY2VTZXJ2ZXJzIiwiSUNFX1NFUlZFUlMiLCJvbmljZWNhbmRpZGF0ZSIsImV2ZW50IiwiY2FuZGlkYXRlIiwic2RwTUxpbmVJbmRleCIsIm9uaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlIiwiaWNlQ29ubmVjdGlvblN0YXRlIiwib25tZXNzYWdlIiwicGFyc2UiLCJvbm9wZW4iLCJvbmNsb3NlIiwib25lcnJvciIsIm1lc3NhZ2UiLCJvbmRhdGFjaGFubmVsIiwic2V0UmVtb3RlRGVzY3JpcHRpb24iLCJjcmVhdGVBbnN3ZXIiLCJSVENJY2VDYW5kaWRhdGUiLCJ3ZWJraXRSVENJY2VDYW5kaWRhdGUiLCJtb3pSVENJY2VDYW5kaWRhdGUiLCJhZGRJY2VDYW5kaWRhdGUiLCJzZXRMb2NhbERlc2NyaXB0aW9uIiwiUlRDU2Vzc2lvbkRlc2NyaXB0aW9uIiwid2Via2l0UlRDU2Vzc2lvbkRlc2NyaXB0aW9uIiwibW96UlRDU2Vzc2lvbkRlc2NyaXB0aW9uIiwibXNSVENTZXNzaW9uRGVzY3JpcHRpb24iLCJ1cmxzIl0sIm1hcHBpbmdzIjoiO0FBQUE7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7OztBQUdBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBLGFBQUs7QUFDTDtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLG1DQUEyQiwwQkFBMEIsRUFBRTtBQUN2RCx5Q0FBaUMsZUFBZTtBQUNoRDtBQUNBO0FBQ0E7O0FBRUE7QUFDQSw4REFBc0QsK0RBQStEOztBQUVySDtBQUNBOztBQUVBO0FBQ0E7Ozs7Ozs7Ozs7Ozs7O0FDN0RBLElBQU1BLGFBQWEsbUJBQUFDLENBQVEsQ0FBUixDQUFuQjs7QUFFQTs7Ozs7O0lBS01DLG1CO0FBQ0osaUNBQWM7QUFBQTs7QUFFWixRQUFJQyxPQUFPQyxTQUFYLEVBQ0VDLFFBQVFDLElBQVIsQ0FBYSx5RkFBYjs7QUFFRixTQUFLQyxHQUFMLEdBQVcsU0FBWDtBQUNBLFNBQUtDLElBQUwsR0FBWSxTQUFaO0FBQ0EsU0FBS0MsZ0JBQUwsR0FBd0IsSUFBeEI7QUFDQSxTQUFLQyxjQUFMLEdBQXNCLElBQXRCOztBQUVBLFNBQUtDLEtBQUwsR0FBYSxFQUFiLENBVlksQ0FVSztBQUNq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Q0FBYyxzQ0FBc0NBLEtBQXBEO0FBQ0QsT0FMSDtBQU9EOzs7NEJBRU87QUFDTixVQUFJLEtBQUtnRSxFQUFULEVBQWE7QUFDWCxhQUFLQSxFQUFMLENBQVE3QyxLQUFSO0FBQ0Q7QUFDRjs7Ozs7O0FBR0gzRCxXQUFXK0QsWUFBWCxHQUEwQixjQUExQjtBQUNBL0QsV0FBV2dFLFVBQVgsR0FBd0IsWUFBeEI7QUFDQWhFLFdBQVc2RCxhQUFYLEdBQTJCLGVBQTNCOztBQUVBN0QsV0FBVytILFdBQVgsR0FBeUIsQ0FDdkIsRUFBRXlCLE1BQU0sK0JBQVIsRUFEdUIsRUFFdkIsRUFBRUEsTUFBTSwrQkFBUixFQUZ1QixFQUd2QixFQUFFQSxNQUFNLCtCQUFSLEVBSHVCLEVBSXZCLEVBQUVBLE1BQU0sK0JBQVIsRUFKdUIsQ0FBekI7O0FBT0FyRCxPQUFPQyxPQUFQLEdBQWlCcEcsVUFBakIsQyIsImZpbGUiOiJuYWYtbmF0aXZlLXdlYnJ0Yy1hZGFwdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgODQ4ZTQ5ZWY3MWM4ZmZiY2EzYzQiLCJjb25zdCBXZWJSdGNQZWVyID0gcmVxdWlyZShcIi4vV2ViUnRjUGVlclwiKTtcblxuLyoqXG4gKiBOYXRpdmUgV2ViUlRDIEFkYXB0ZXIgKG5hdGl2ZS13ZWJydGMpXG4gKiBGb3IgdXNlIHdpdGggdXdzLXNlcnZlci5qc1xuICogbmV0d29ya2VkLXNjZW5lOiBzZXJ2ZXJVUkwgbmVlZHMgdG8gYmUgd3M6Ly9sb2NhbGhvc3Q6ODA4MCB3aGVuIHJ1bm5pbmcgbG9jYWxseVxuICovXG5jbGFzcyBOYXRpdmVXZWJSdGNBZGFwdGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG5cbiAgICBpZiAoaW8gPT09IHVuZGVmaW5lZClcbiAgICAgIGNvbnNvbGUud2FybignSXQgbG9va3MgbGlrZSBzb2NrZXQuaW8gaGFzIG5vdCBiZWVuIGxvYWRlZCBiZWZvcmUgTmF0aXZlV2ViUnRjQWRhcHRlci4gUGxlYXNlIGRvIHRoYXQuJylcblxuICAgIHRoaXMuYXBwID0gXCJkZWZhdWx0XCI7XG4gICAgdGhpcy5yb29tID0gXCJkZWZhdWx0XCI7XG4gICAgdGhpcy5vY2N1cGFudExpc3RlbmVyID0gbnVsbDtcbiAgICB0aGlzLm15Um9vbUpvaW5UaW1lID0gbnVsbDtcblxuICAgIHRoaXMucGVlcnMgPSB7fTsgLy8gaWQgLT4gV2ViUnRjUGVlclxuICAgIHRoaXMub2NjdXBhbnRzID0ge307IC8vIGlkIC0+IGpvaW5UaW1lc3RhbXBcbiAgfVxuXG4gIHNldFNlcnZlclVybCh3c1VybCkge1xuICAgIHRoaXMud3NVcmwgPSB3c1VybDtcbiAgfVxuXG4gIHNldEFwcChhcHBOYW1lKSB7XG4gICAgdGhpcy5hcHAgPSBhcHBOYW1lO1xuICB9XG5cbiAgc2V0Um9vbShyb29tTmFtZSkge1xuICAgIHRoaXMucm9vbSA9IHJvb21OYW1lO1xuICB9XG5cbiAgc2V0V2ViUnRjT3B0aW9ucyhvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuZGF0YWNoYW5uZWwgPT09IGZhbHNlKVxuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBcIk5hdGl2ZVdlYlJ0Y0FkYXB0ZXIuc2V0V2ViUnRjT3B0aW9uczogZGF0YWNoYW5uZWwgbXVzdCBiZSB0cnVlLlwiXG4gICAgICApO1xuICAgIGlmIChvcHRpb25zLmF1ZGlvID09PSB0cnVlKVxuICAgICAgY29uc29sZS53YXJuKFwiTmF0aXZlV2ViUnRjQWRhcHRlciBkb2VzIG5vdCBzdXBwb3J0IGF1ZGlvIHlldC5cIik7XG4gICAgaWYgKG9wdGlvbnMudmlkZW8gPT09IHRydWUpXG4gICAgICBjb25zb2xlLndhcm4oXCJOYXRpdmVXZWJSdGNBZGFwdGVyIGRvZXMgbm90IHN1cHBvcnQgdmlkZW8geWV0LlwiKTtcbiAgfVxuXG4gIHNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMoc3VjY2Vzc0xpc3RlbmVyLCBmYWlsdXJlTGlzdGVuZXIpIHtcbiAgICB0aGlzLmNvbm5lY3RTdWNjZXNzID0gc3VjY2Vzc0xpc3RlbmVyO1xuICAgIHRoaXMuY29ubmVjdEZhaWx1cmUgPSBmYWlsdXJlTGlzdGVuZXI7XG4gIH1cblxuICBzZXRSb29tT2NjdXBhbnRMaXN0ZW5lcihvY2N1cGFudExpc3RlbmVyKSB7XG4gICAgdGhpcy5vY2N1cGFudExpc3RlbmVyID0gb2NjdXBhbnRMaXN0ZW5lcjtcbiAgfVxuXG4gIHNldERhdGFDaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lcikge1xuICAgIHRoaXMub3Blbkxpc3RlbmVyID0gb3Blbkxpc3RlbmVyO1xuICAgIHRoaXMuY2xvc2VkTGlzdGVuZXIgPSBjbG9zZWRMaXN0ZW5lcjtcbiAgICB0aGlzLm1lc3NhZ2VMaXN0ZW5lciA9IG1lc3NhZ2VMaXN0ZW5lcjtcbiAgfVxuXG4gIGNvbm5lY3QoKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAoIXRoaXMud3NVcmwgfHwgdGhpcy53c1VybCA9PT0gXCIvXCIpIHtcbiAgICAgIGlmIChsb2NhdGlvbi5wcm90b2NvbCA9PT0gXCJodHRwczpcIikge1xuICAgICAgICB0aGlzLndzVXJsID0gXCJ3c3M6Ly9cIiArIGxvY2F0aW9uLmhvc3Q7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLndzVXJsID0gXCJ3czovL1wiICsgbG9jYXRpb24uaG9zdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBOQUYubG9nLndyaXRlKFwiQXR0ZW1wdGluZyB0byBjb25uZWN0IHRvIHNvY2tldC5pb1wiKTtcbiAgICBjb25zdCBzb2NrZXQgPSB0aGlzLnNvY2tldCA9IGlvKHRoaXMud3NVcmwpO1xuXG4gICAgc29ja2V0Lm9uKFwiY29ubmVjdFwiLCAoKSA9PiB7XG4gICAgICBOQUYubG9nLndyaXRlKFwiVXNlciBjb25uZWN0ZWRcIiwgc29ja2V0LmlkKTtcbiAgICAgIHNlbGYuam9pblJvb20oKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbihcImNvbm5lY3RTdWNjZXNzXCIsIChkYXRhKSA9PiB7XG4gICAgICBjb25zdCB7IGpvaW5lZFRpbWUgfSA9IGRhdGE7XG5cbiAgICAgIHRoaXMubXlSb29tSm9pblRpbWUgPSBqb2luZWRUaW1lO1xuICAgICAgTkFGLmxvZy53cml0ZShcIlN1Y2Nlc3NmdWxseSBqb2luZWQgcm9vbVwiLCB0aGlzLnJvb20sIFwiYXQgc2VydmVyIHRpbWVcIiwgam9pbmVkVGltZSk7XG4gICAgICBzZWxmLmNvbm5lY3RTdWNjZXNzKHNvY2tldC5pZCk7XG4gICAgfSk7XG5cbiAgICBzb2NrZXQub24oXCJlcnJvclwiLCBlcnIgPT4ge1xuICAgICAgY29uc29sZS5lcnJvcihcIlNvY2tldCBjb25uZWN0aW9uIGZhaWx1cmVcIiwgZXJyKTtcbiAgICAgIHNlbGYuY29ubmVjdEZhaWx1cmUoKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbihcIm9jY3VwYW50c0NoYW5nZWRcIiwgZGF0YSA9PiB7XG4gICAgICBjb25zdCB7IG9jY3VwYW50cyB9ID0gZGF0YTtcbiAgICAgIE5BRi5sb2cud3JpdGUoJ29jY3VwYW50cyBjaGFuZ2VkJywgZGF0YSk7XG4gICAgICBzZWxmLnJlY2VpdmVkT2NjdXBhbnRzKG9jY3VwYW50cyk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiByZWNlaXZlRGF0YShwYWNrZXQpIHtcbiAgICAgIGNvbnN0IGZyb20gPSBwYWNrZXQuZnJvbTtcbiAgICAgIGNvbnN0IHR5cGUgPSBwYWNrZXQudHlwZTtcbiAgICAgIGNvbnN0IGRhdGEgPSBwYWNrZXQuZGF0YTtcbiAgICAgIGlmICh0eXBlID09PSAnaWNlLWNhbmRpZGF0ZScpIHtcbiAgICAgICAgc2VsZi5wZWVyc1tmcm9tXS5oYW5kbGVTaWduYWwoZGF0YSk7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHNlbGYubWVzc2FnZUxpc3RlbmVyKGZyb20sIHR5cGUsIGRhdGEpO1xuICAgIH1cblxuICAgIHNvY2tldC5vbihcInNlbmRcIiwgcmVjZWl2ZURhdGEpO1xuICAgIHNvY2tldC5vbihcImJyb2FkY2FzdFwiLCByZWNlaXZlRGF0YSk7XG4gIH1cblxuICBqb2luUm9vbSgpIHtcbiAgICBOQUYubG9nLndyaXRlKFwiSm9pbmluZyByb29tXCIsIHRoaXMucm9vbSk7XG4gICAgdGhpcy5zb2NrZXQuZW1pdChcImpvaW5Sb29tXCIsIHsgcm9vbTogdGhpcy5yb29tIH0pO1xuICB9XG5cbiAgcmVjZWl2ZWRPY2N1cGFudHMob2NjdXBhbnRzKSB7XG4gICAgZGVsZXRlIG9jY3VwYW50c1tOQUYuY2xpZW50SWRdO1xuXG4gICAgdGhpcy5vY2N1cGFudHMgPSBvY2N1cGFudHM7XG5cbiAgICBOQUYubG9nLndyaXRlKCdvY2N1cGFudHM9Jywgb2NjdXBhbnRzKTtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICBjb25zdCBsb2NhbElkID0gTkFGLmNsaWVudElkO1xuXG4gICAgZm9yICh2YXIga2V5IGluIG9jY3VwYW50cykge1xuICAgICAgY29uc3QgcmVtb3RlSWQgPSBrZXk7XG4gICAgICBpZiAodGhpcy5wZWVyc1tyZW1vdGVJZF0pIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBwZWVyID0gbmV3IFdlYlJ0Y1BlZXIoXG4gICAgICAgIGxvY2FsSWQsXG4gICAgICAgIHJlbW90ZUlkLFxuICAgICAgICAoZGF0YSkgPT4ge1xuICAgICAgICAgIHNlbGYuc29ja2V0LmVtaXQoJ3NlbmQnLHtcbiAgICAgICAgICAgIGZyb206IGxvY2FsSWQsXG4gICAgICAgICAgICB0bzogcmVtb3RlSWQsXG4gICAgICAgICAgICB0eXBlOiAnaWNlLWNhbmRpZGF0ZScsXG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgc2VuZGluZzogdHJ1ZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHBlZXIuc2V0RGF0YWNoYW5uZWxMaXN0ZW5lcnMoXG4gICAgICAgIHNlbGYub3Blbkxpc3RlbmVyLFxuICAgICAgICBzZWxmLmNsb3NlZExpc3RlbmVyLFxuICAgICAgICBzZWxmLm1lc3NhZ2VMaXN0ZW5lclxuICAgICAgKTtcblxuICAgICAgc2VsZi5wZWVyc1tyZW1vdGVJZF0gPSBwZWVyO1xuICAgIH1cblxuICAgIE5BRi5sb2cud3JpdGUoJ3BlZXJzJywgc2VsZi5wZWVycyk7XG5cbiAgICB0aGlzLm9jY3VwYW50TGlzdGVuZXIob2NjdXBhbnRzKTtcbiAgfVxuXG4gIHNob3VsZFN0YXJ0Q29ubmVjdGlvblRvKGNsaWVudCkge1xuICAgIHJldHVybiAodGhpcy5teVJvb21Kb2luVGltZSB8fCAwKSA8PSAoY2xpZW50IHx8IDApO1xuICB9XG5cbiAgc3RhcnRTdHJlYW1Db25uZWN0aW9uKHJlbW90ZUlkKSB7XG4gICAgTkFGLmxvZy53cml0ZSgnc3RhcnRpbmcgb2ZmZXIgcHJvY2VzcycpO1xuICAgIHRoaXMucGVlcnNbcmVtb3RlSWRdLm9mZmVyKCk7XG4gIH1cblxuICBjbG9zZVN0cmVhbUNvbm5lY3Rpb24oY2xpZW50SWQpIHtcbiAgICBOQUYubG9nLndyaXRlKCdjbG9zZVN0cmVhbUNvbm5lY3Rpb24nLCBjbGllbnRJZCwgdGhpcy5wZWVycyk7XG4gICAgdGhpcy5wZWVyc1tjbGllbnRJZF0uY2xvc2UoKTtcbiAgICBkZWxldGUgdGhpcy5wZWVyc1tjbGllbnRJZF07XG4gICAgZGVsZXRlIHRoaXMub2NjdXBhbnRzW2NsaWVudElkXTtcbiAgICB0aGlzLmNsb3NlZExpc3RlbmVyKGNsaWVudElkKTtcbiAgfVxuXG4gIGdldENvbm5lY3RTdGF0dXMoY2xpZW50SWQpIHtcbiAgICBjb25zdCBwZWVyID0gdGhpcy5wZWVyc1tjbGllbnRJZF07XG5cbiAgICBpZiAocGVlciA9PT0gdW5kZWZpbmVkKSByZXR1cm4gTkFGLmFkYXB0ZXJzLk5PVF9DT05ORUNURUQ7XG5cbiAgICBzd2l0Y2ggKHBlZXIuZ2V0U3RhdHVzKCkpIHtcbiAgICAgIGNhc2UgV2ViUnRjUGVlci5JU19DT05ORUNURUQ6XG4gICAgICAgIHJldHVybiBOQUYuYWRhcHRlcnMuSVNfQ09OTkVDVEVEO1xuXG4gICAgICBjYXNlIFdlYlJ0Y1BlZXIuQ09OTkVDVElORzpcbiAgICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5DT05ORUNUSU5HO1xuXG4gICAgICBjYXNlIFdlYlJ0Y1BlZXIuTk9UX0NPTk5FQ1RFRDpcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBOQUYuYWRhcHRlcnMuTk9UX0NPTk5FQ1RFRDtcbiAgICB9XG4gIH1cblxuICBzZW5kRGF0YSh0bywgdHlwZSwgZGF0YSkge1xuICAgIHRoaXMucGVlcnNbdG9dLnNlbmQodHlwZSwgZGF0YSk7XG4gIH1cblxuICBzZW5kRGF0YUd1YXJhbnRlZWQodG8sIHR5cGUsIGRhdGEpIHtcbiAgICBjb25zdCBwYWNrZXQgPSB7XG4gICAgICBmcm9tOiBOQUYuY2xpZW50SWQsXG4gICAgICB0byxcbiAgICAgIHR5cGUsXG4gICAgICBkYXRhLFxuICAgICAgc2VuZGluZzogdHJ1ZSxcbiAgICB9O1xuXG4gICAgdGhpcy5zb2NrZXQuZW1pdChcInNlbmRcIiwgcGFja2V0KTtcbiAgfVxuXG4gIGJyb2FkY2FzdERhdGEodHlwZSwgZGF0YSkge1xuICAgIGZvciAodmFyIGNsaWVudElkIGluIHRoaXMucGVlcnMpIHtcbiAgICAgIHRoaXMuc2VuZERhdGEoY2xpZW50SWQsIHR5cGUsIGRhdGEpO1xuICAgIH1cbiAgfVxuXG4gIGJyb2FkY2FzdERhdGFHdWFyYW50ZWVkKHR5cGUsIGRhdGEpIHtcbiAgICBjb25zdCBwYWNrZXQgPSB7XG4gICAgICBmcm9tOiBOQUYuY2xpZW50SWQsXG4gICAgICB0eXBlLFxuICAgICAgZGF0YSxcbiAgICAgIGJyb2FkY2FzdGluZzogdHJ1ZVxuICAgIH07XG4gICAgdGhpcy5zb2NrZXQuZW1pdChcImJyb2FkY2FzdFwiLCBwYWNrZXQpO1xuICB9XG5cbiAgZ2V0TWVkaWFTdHJlYW0oY2xpZW50SWQpIHtcbiAgICAvLyBUT0RPIGltcGxlbWVudCBhdWRpb1xuICAgIC8vIHZhciB0aGF0ID0gdGhpcztcbiAgICAvLyBpZiAodGhpcy5hdWRpb1N0cmVhbXNbY2xpZW50SWRdKSB7XG4gICAgLy8gICBOQUYubG9nLndyaXRlKFwiQWxyZWFkeSBoYWQgYXVkaW8gZm9yIFwiICsgY2xpZW50SWQpO1xuICAgIC8vICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmF1ZGlvU3RyZWFtc1tjbGllbnRJZF0pO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICBOQUYubG9nLndyaXRlKFwiV2FpdGluZyBvbiBhdWRpbyBmb3IgXCIgKyBjbGllbnRJZCk7XG4gICAgLy8gICByZXR1cm4gbmV3IFByb21pc2UoZnVuY3Rpb24ocmVzb2x2ZSkge1xuICAgIC8vICAgICB0aGF0LnBlbmRpbmdBdWRpb1JlcXVlc3RbY2xpZW50SWRdID0gcmVzb2x2ZTtcbiAgICAvLyAgIH0pO1xuICAgIC8vIH1cbiAgICByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0ludGVyZmFjZSBtZXRob2Qgbm90IGltcGxlbWVudGVkOiBnZXRNZWRpYVN0cmVhbScpXG4gIH1cblxuICB1cGRhdGVUaW1lT2Zmc2V0KCkge1xuICAgIGNvbnN0IGNsaWVudFNlbnRUaW1lID0gRGF0ZS5ub3coKSArIHRoaXMuYXZnVGltZU9mZnNldDtcblxuICAgIHJldHVybiBmZXRjaChkb2N1bWVudC5sb2NhdGlvbi5ocmVmLCB7IG1ldGhvZDogXCJIRUFEXCIsIGNhY2hlOiBcIm5vLWNhY2hlXCIgfSlcbiAgICAgIC50aGVuKHJlcyA9PiB7XG4gICAgICAgIHZhciBwcmVjaXNpb24gPSAxMDAwO1xuICAgICAgICB2YXIgc2VydmVyUmVjZWl2ZWRUaW1lID0gbmV3IERhdGUocmVzLmhlYWRlcnMuZ2V0KFwiRGF0ZVwiKSkuZ2V0VGltZSgpICsgKHByZWNpc2lvbiAvIDIpO1xuICAgICAgICB2YXIgY2xpZW50UmVjZWl2ZWRUaW1lID0gRGF0ZS5ub3coKTtcbiAgICAgICAgdmFyIHNlcnZlclRpbWUgPSBzZXJ2ZXJSZWNlaXZlZFRpbWUgKyAoKGNsaWVudFJlY2VpdmVkVGltZSAtIGNsaWVudFNlbnRUaW1lKSAvIDIpO1xuICAgICAgICB2YXIgdGltZU9mZnNldCA9IHNlcnZlclRpbWUgLSBjbGllbnRSZWNlaXZlZFRpbWU7XG5cbiAgICAgICAgdGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMrKztcblxuICAgICAgICBpZiAodGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgPD0gMTApIHtcbiAgICAgICAgICB0aGlzLnRpbWVPZmZzZXRzLnB1c2godGltZU9mZnNldCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy50aW1lT2Zmc2V0c1t0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cyAlIDEwXSA9IHRpbWVPZmZzZXQ7XG4gICAgICAgIH1cblxuICAgICAgICB0aGlzLmF2Z1RpbWVPZmZzZXQgPSB0aGlzLnRpbWVPZmZzZXRzLnJlZHVjZSgoYWNjLCBvZmZzZXQpID0+IGFjYyArPSBvZmZzZXQsIDApIC8gdGhpcy50aW1lT2Zmc2V0cy5sZW5ndGg7XG5cbiAgICAgICAgaWYgKHRoaXMuc2VydmVyVGltZVJlcXVlc3RzID4gMTApIHtcbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHRoaXMudXBkYXRlVGltZU9mZnNldCgpLCA1ICogNjAgKiAxMDAwKTsgLy8gU3luYyBjbG9jayBldmVyeSA1IG1pbnV0ZXMuXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhpcy51cGRhdGVUaW1lT2Zmc2V0KCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICB9XG5cbiAgZ2V0U2VydmVyVGltZSgpIHtcbiAgICByZXR1cm4gLTE7IC8vIFRPRE8gaW1wbGVtZW50XG4gIH1cbn1cblxuTkFGLmFkYXB0ZXJzLnJlZ2lzdGVyKFwibmF0aXZlLXdlYnJ0Y1wiLCBOYXRpdmVXZWJSdGNBZGFwdGVyKTtcblxubW9kdWxlLmV4cG9ydHMgPSBOYXRpdmVXZWJSdGNBZGFwdGVyO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL2luZGV4LmpzIiwiY2xhc3MgV2ViUnRjUGVlciB7XG4gIGNvbnN0cnVjdG9yKGxvY2FsSWQsIHJlbW90ZUlkLCBzZW5kU2lnbmFsRnVuYykge1xuICAgIHRoaXMubG9jYWxJZCA9IGxvY2FsSWQ7XG4gICAgdGhpcy5yZW1vdGVJZCA9IHJlbW90ZUlkO1xuICAgIHRoaXMuc2VuZFNpZ25hbEZ1bmMgPSBzZW5kU2lnbmFsRnVuYztcbiAgICB0aGlzLm9wZW4gPSBmYWxzZTtcbiAgICB0aGlzLmNoYW5uZWxMYWJlbCA9IFwibmV0d29ya2VkLWFmcmFtZS1jaGFubmVsXCI7XG5cbiAgICB0aGlzLnBjID0gdGhpcy5jcmVhdGVQZWVyQ29ubmVjdGlvbigpO1xuICAgIHRoaXMuY2hhbm5lbCA9IG51bGw7XG4gIH1cblxuICBzZXREYXRhY2hhbm5lbExpc3RlbmVycyhvcGVuTGlzdGVuZXIsIGNsb3NlZExpc3RlbmVyLCBtZXNzYWdlTGlzdGVuZXIpIHtcbiAgICB0aGlzLm9wZW5MaXN0ZW5lciA9IG9wZW5MaXN0ZW5lcjtcbiAgICB0aGlzLmNsb3NlZExpc3RlbmVyID0gY2xvc2VkTGlzdGVuZXI7XG4gICAgdGhpcy5tZXNzYWdlTGlzdGVuZXIgPSBtZXNzYWdlTGlzdGVuZXI7XG4gIH1cblxuICBvZmZlcigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gcmVsaWFibGU6IGZhbHNlIC0gVURQXG4gICAgdGhpcy5zZXR1cENoYW5uZWwoXG4gICAgICB0aGlzLnBjLmNyZWF0ZURhdGFDaGFubmVsKHRoaXMuY2hhbm5lbExhYmVsLCB7IHJlbGlhYmxlOiBmYWxzZSB9KVxuICAgICk7XG4gICAgdGhpcy5wYy5jcmVhdGVPZmZlcihcbiAgICAgIGZ1bmN0aW9uKHNkcCkge1xuICAgICAgICBzZWxmLmhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbihzZHApO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIE5BRi5sb2cuZXJyb3IoXCJXZWJSdGNQZWVyLm9mZmVyOiBcIiArIGVycm9yKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgaGFuZGxlU2lnbmFsKHNpZ25hbCkge1xuICAgIC8vIGlnbm9yZXMgc2lnbmFsIGlmIGl0IGlzbid0IGZvciBtZVxuICAgIGlmICh0aGlzLmxvY2FsSWQgIT09IHNpZ25hbC50byB8fCB0aGlzLnJlbW90ZUlkICE9PSBzaWduYWwuZnJvbSkgcmV0dXJuO1xuXG4gICAgc3dpdGNoIChzaWduYWwudHlwZSkge1xuICAgICAgY2FzZSBcIm9mZmVyXCI6XG4gICAgICAgIHRoaXMuaGFuZGxlT2ZmZXIoc2lnbmFsKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJhbnN3ZXJcIjpcbiAgICAgICAgdGhpcy5oYW5kbGVBbnN3ZXIoc2lnbmFsKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJjYW5kaWRhdGVcIjpcbiAgICAgICAgdGhpcy5oYW5kbGVDYW5kaWRhdGUoc2lnbmFsKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIE5BRi5sb2cuZXJyb3IoXG4gICAgICAgICAgXCJXZWJSdGNQZWVyLmhhbmRsZVNpZ25hbDogVW5rbm93biBzaWduYWwgdHlwZSBcIiArIHNpZ25hbC50eXBlXG4gICAgICAgICk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHNlbmQodHlwZSwgZGF0YSkge1xuICAgIGlmICh0aGlzLmNoYW5uZWwgPT09IG51bGwgfHwgdGhpcy5jaGFubmVsLnJlYWR5U3RhdGUgIT09IFwib3BlblwiKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jaGFubmVsLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiB0eXBlLCBkYXRhOiBkYXRhIH0pKTtcbiAgfVxuXG4gIGdldFN0YXR1cygpIHtcbiAgICBpZiAodGhpcy5jaGFubmVsID09PSBudWxsKSByZXR1cm4gV2ViUnRjUGVlci5OT1RfQ09OTkVDVEVEO1xuXG4gICAgc3dpdGNoICh0aGlzLmNoYW5uZWwucmVhZHlTdGF0ZSkge1xuICAgICAgY2FzZSBcIm9wZW5cIjpcbiAgICAgICAgcmV0dXJuIFdlYlJ0Y1BlZXIuSVNfQ09OTkVDVEVEO1xuXG4gICAgICBjYXNlIFwiY29ubmVjdGluZ1wiOlxuICAgICAgICByZXR1cm4gV2ViUnRjUGVlci5DT05ORUNUSU5HO1xuXG4gICAgICBjYXNlIFwiY2xvc2luZ1wiOlxuICAgICAgY2FzZSBcImNsb3NlZFwiOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFdlYlJ0Y1BlZXIuTk9UX0NPTk5FQ1RFRDtcbiAgICB9XG4gIH1cblxuICAvKlxuICAgKiBQcml2YXRlc1xuICAgKi9cblxuICBjcmVhdGVQZWVyQ29ubmVjdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIFJUQ1BlZXJDb25uZWN0aW9uID1cbiAgICAgIHdpbmRvdy5SVENQZWVyQ29ubmVjdGlvbiB8fFxuICAgICAgd2luZG93LndlYmtpdFJUQ1BlZXJDb25uZWN0aW9uIHx8XG4gICAgICB3aW5kb3cubW96UlRDUGVlckNvbm5lY3Rpb24gfHxcbiAgICAgIHdpbmRvdy5tc1JUQ1BlZXJDb25uZWN0aW9uO1xuXG4gICAgaWYgKFJUQ1BlZXJDb25uZWN0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJXZWJSdGNQZWVyLmNyZWF0ZVBlZXJDb25uZWN0aW9uOiBUaGlzIGJyb3dzZXIgZG9lcyBub3Qgc2VlbSB0byBzdXBwb3J0IFdlYlJUQy5cIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICB2YXIgcGMgPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oeyBpY2VTZXJ2ZXJzOiBXZWJSdGNQZWVyLklDRV9TRVJWRVJTIH0pO1xuXG4gICAgcGMub25pY2VjYW5kaWRhdGUgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKGV2ZW50LmNhbmRpZGF0ZSkge1xuICAgICAgICBzZWxmLnNlbmRTaWduYWxGdW5jKHtcbiAgICAgICAgICBmcm9tOiBzZWxmLmxvY2FsSWQsXG4gICAgICAgICAgdG86IHNlbGYucmVtb3RlSWQsXG4gICAgICAgICAgdHlwZTogXCJjYW5kaWRhdGVcIixcbiAgICAgICAgICBzZHBNTGluZUluZGV4OiBldmVudC5jYW5kaWRhdGUuc2RwTUxpbmVJbmRleCxcbiAgICAgICAgICBjYW5kaWRhdGU6IGV2ZW50LmNhbmRpZGF0ZS5jYW5kaWRhdGVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIE5vdGU6IHNlZW1zIGxpa2UgY2hhbm5lbC5vbmNsb3NlIGhhbmRlciBpcyB1bnJlbGlhYmxlIG9uIHNvbWUgcGxhdGZvcm1zLFxuICAgIC8vICAgICAgIHNvIGFsc28gdHJpZXMgdG8gZGV0ZWN0IGRpc2Nvbm5lY3Rpb24gaGVyZS5cbiAgICBwYy5vbmljZWNvbm5lY3Rpb25zdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHNlbGYub3BlbiAmJiBwYy5pY2VDb25uZWN0aW9uU3RhdGUgPT09IFwiZGlzY29ubmVjdGVkXCIpIHtcbiAgICAgICAgc2VsZi5vcGVuID0gZmFsc2U7XG4gICAgICAgIHNlbGYuY2xvc2VkTGlzdGVuZXIoc2VsZi5yZW1vdGVJZCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHJldHVybiBwYztcbiAgfVxuXG4gIHNldHVwQ2hhbm5lbChjaGFubmVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5jaGFubmVsID0gY2hhbm5lbDtcblxuICAgIC8vIHJlY2VpdmVkIGRhdGEgZnJvbSBhIHJlbW90ZSBwZWVyXG4gICAgdGhpcy5jaGFubmVsLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICB2YXIgZGF0YSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG4gICAgICBzZWxmLm1lc3NhZ2VMaXN0ZW5lcihzZWxmLnJlbW90ZUlkLCBkYXRhLnR5cGUsIGRhdGEuZGF0YSk7XG4gICAgfTtcblxuICAgIC8vIGNvbm5lY3RlZCB3aXRoIGEgcmVtb3RlIHBlZXJcbiAgICB0aGlzLmNoYW5uZWwub25vcGVuID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHNlbGYub3BlbiA9IHRydWU7XG4gICAgICBzZWxmLm9wZW5MaXN0ZW5lcihzZWxmLnJlbW90ZUlkKTtcbiAgICB9O1xuXG4gICAgLy8gZGlzY29ubmVjdGVkIHdpdGggYSByZW1vdGUgcGVlclxuICAgIHRoaXMuY2hhbm5lbC5vbmNsb3NlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGlmICghc2VsZi5vcGVuKSByZXR1cm47XG4gICAgICBzZWxmLm9wZW4gPSBmYWxzZTtcbiAgICAgIHNlbGYuY2xvc2VkTGlzdGVuZXIoc2VsZi5yZW1vdGVJZCk7XG4gICAgfTtcblxuICAgIC8vIGVycm9yIG9jY3VycmVkIHdpdGggYSByZW1vdGUgcGVlclxuICAgIHRoaXMuY2hhbm5lbC5vbmVycm9yID0gZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgIE5BRi5sb2cuZXJyb3IoXCJXZWJSdGNQZWVyLmNoYW5uZWwub25lcnJvcjogXCIgKyBlcnJvcik7XG4gICAgfTtcbiAgfVxuXG4gIGhhbmRsZU9mZmVyKG1lc3NhZ2UpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLnBjLm9uZGF0YWNoYW5uZWwgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgc2VsZi5zZXR1cENoYW5uZWwoZXZlbnQuY2hhbm5lbCk7XG4gICAgfTtcblxuICAgIHRoaXMuc2V0UmVtb3RlRGVzY3JpcHRpb24obWVzc2FnZSk7XG5cbiAgICB0aGlzLnBjLmNyZWF0ZUFuc3dlcihcbiAgICAgIGZ1bmN0aW9uKHNkcCkge1xuICAgICAgICBzZWxmLmhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbihzZHApO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIE5BRi5sb2cuZXJyb3IoXCJXZWJSdGNQZWVyLmhhbmRsZU9mZmVyOiBcIiArIGVycm9yKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgaGFuZGxlQW5zd2VyKG1lc3NhZ2UpIHtcbiAgICB0aGlzLnNldFJlbW90ZURlc2NyaXB0aW9uKG1lc3NhZ2UpO1xuICB9XG5cbiAgaGFuZGxlQ2FuZGlkYXRlKG1lc3NhZ2UpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIFJUQ0ljZUNhbmRpZGF0ZSA9XG4gICAgICB3aW5kb3cuUlRDSWNlQ2FuZGlkYXRlIHx8XG4gICAgICB3aW5kb3cud2Via2l0UlRDSWNlQ2FuZGlkYXRlIHx8XG4gICAgICB3aW5kb3cubW96UlRDSWNlQ2FuZGlkYXRlO1xuXG4gICAgdGhpcy5wYy5hZGRJY2VDYW5kaWRhdGUoXG4gICAgICBuZXcgUlRDSWNlQ2FuZGlkYXRlKG1lc3NhZ2UpLFxuICAgICAgZnVuY3Rpb24oKSB7fSxcbiAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIE5BRi5sb2cuZXJyb3IoXCJXZWJSdGNQZWVyLmhhbmRsZUNhbmRpZGF0ZTogXCIgKyBlcnJvcik7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbihzZHApIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLnBjLnNldExvY2FsRGVzY3JpcHRpb24oXG4gICAgICBzZHAsXG4gICAgICBmdW5jdGlvbigpIHt9LFxuICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgTkFGLmxvZy5lcnJvcihcIldlYlJ0Y1BlZXIuaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uOiBcIiArIGVycm9yKTtcbiAgICAgIH1cbiAgICApO1xuXG4gICAgdGhpcy5zZW5kU2lnbmFsRnVuYyh7XG4gICAgICBmcm9tOiB0aGlzLmxvY2FsSWQsXG4gICAgICB0bzogdGhpcy5yZW1vdGVJZCxcbiAgICAgIHR5cGU6IHNkcC50eXBlLFxuICAgICAgc2RwOiBzZHAuc2RwXG4gICAgfSk7XG4gIH1cblxuICBzZXRSZW1vdGVEZXNjcmlwdGlvbihtZXNzYWdlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBSVENTZXNzaW9uRGVzY3JpcHRpb24gPVxuICAgICAgd2luZG93LlJUQ1Nlc3Npb25EZXNjcmlwdGlvbiB8fFxuICAgICAgd2luZG93LndlYmtpdFJUQ1Nlc3Npb25EZXNjcmlwdGlvbiB8fFxuICAgICAgd2luZG93Lm1velJUQ1Nlc3Npb25EZXNjcmlwdGlvbiB8fFxuICAgICAgd2luZG93Lm1zUlRDU2Vzc2lvbkRlc2NyaXB0aW9uO1xuXG4gICAgdGhpcy5wYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihcbiAgICAgIG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24obWVzc2FnZSksXG4gICAgICBmdW5jdGlvbigpIHt9LFxuICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgTkFGLmxvZy5lcnJvcihcIldlYlJ0Y1BlZXIuc2V0UmVtb3RlRGVzY3JpcHRpb246IFwiICsgZXJyb3IpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBjbG9zZSgpIHtcbiAgICBpZiAodGhpcy5wYykge1xuICAgICAgdGhpcy5wYy5jbG9zZSgpO1xuICAgIH1cbiAgfVxufVxuXG5XZWJSdGNQZWVyLklTX0NPTk5FQ1RFRCA9IFwiSVNfQ09OTkVDVEVEXCI7XG5XZWJSdGNQZWVyLkNPTk5FQ1RJTkcgPSBcIkNPTk5FQ1RJTkdcIjtcbldlYlJ0Y1BlZXIuTk9UX0NPTk5FQ1RFRCA9IFwiTk9UX0NPTk5FQ1RFRFwiO1xuXG5XZWJSdGNQZWVyLklDRV9TRVJWRVJTID0gW1xuICB7IHVybHM6IFwic3R1bjpzdHVuMS5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxuICB7IHVybHM6IFwic3R1bjpzdHVuMi5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxuICB7IHVybHM6IFwic3R1bjpzdHVuMy5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxuICB7IHVybHM6IFwic3R1bjpzdHVuNC5sLmdvb2dsZS5jb206MTkzMDJcIiB9XG5dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdlYlJ0Y1BlZXI7XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL1dlYlJ0Y1BlZXIuanMiXSwic291cmNlUm9vdCI6IiJ9