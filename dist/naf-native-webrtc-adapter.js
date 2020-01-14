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
    this.myId = null;
    this.avgTimeOffset = 0;

    this.peers = {}; // id -> WebRtcPeer
    this.occupants = {}; // id -> joinTimestamp

    this.audioStreams = {};
    this.pendingAudioRequest = {};

    this.serverTimeRequests = 0;
    this.timeOffsets = [];
    this.avgTimeOffset = 0;
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
      if (options.datachannel === false) {
        NAF.log.error("NativeWebRtcAdapter.setWebRtcOptions: datachannel must be true.");
      }
      if (options.audio === true) {
        this.sendAudio = true;
      }
      if (options.video === true) {
        NAF.log.warn("NativeWebRtcAdapter does not support video yet.");
      }
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
      var self = this;

      this.updateTimeOffset().then(function () {
        if (!self.wsUrl || self.wsUrl === "/") {
          if (location.protocol === "https:") {
            self.wsUrl = "wss://" + location.host;
          } else {
            self.wsUrl = "ws://" + location.host;
          }
        }

        NAF.log.write("Attempting to connect to socket.io");
        var socket = self.socket = io(self.wsUrl);

        socket.on("connect", function () {
          NAF.log.write("User connected", socket.id);
          self.myId = socket.id;
          self.joinRoom();
        });

        socket.on("connectSuccess", function (data) {
          var joinedTime = data.joinedTime;


          self.myRoomJoinTime = joinedTime;
          NAF.log.write("Successfully joined room", self.room, "at server time", joinedTime);

          if (self.sendAudio) {
            var mediaConstraints = {
              audio: true,
              video: false
            };
            navigator.mediaDevices.getUserMedia(mediaConstraints).then(function (localStream) {
              self.storeAudioStream(self.myId, localStream);
              self.connectSuccess(self.myId);
            }).catch(function (e) {
              return NAF.log.error(e);
            });
          } else {
            self.connectSuccess(self.myId);
          }
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
      });
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
      var _this = this;

      delete occupants[this.myId];

      this.occupants = occupants;

      NAF.log.write('occupants=', occupants);
      var self = this;
      var localId = this.myId;

      var _loop = function _loop() {
        var remoteId = key;
        if (_this.peers[remoteId]) return "continue";

        var peer = new WebRtcPeer(localId, remoteId, function (data) {
          self.socket.emit('send', {
            from: localId,
            to: remoteId,
            type: 'ice-candidate',
            data: data,
            sending: true
          });
        });
        peer.setDatachannelListeners(self.openListener, self.closedListener, self.messageListener, self.trackListener.bind(self));

        self.peers[remoteId] = peer;
      };

      for (var key in occupants) {
        var _ret = _loop();

        if (_ret === "continue") continue;
      }

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
      var _this2 = this;

      NAF.log.write('starting offer process');

      if (this.sendAudio) {
        this.getMediaStream(this.myId).then(function (stream) {
          var options = {
            sendAudio: true,
            localAudioStream: stream
          };
          _this2.peers[remoteId].offer(options);
        });
      } else {
        this.peers[remoteId].offer({});
      }
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
        from: this.myId,
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
        from: this.myId,
        type: type,
        data: data,
        broadcasting: true
      };
      this.socket.emit("broadcast", packet);
    }
  }, {
    key: "storeAudioStream",
    value: function storeAudioStream(clientId, stream) {
      this.audioStreams[clientId] = stream;
      if (this.pendingAudioRequest[clientId]) {
        NAF.log.write("Received pending audio for " + clientId);
        this.pendingAudioRequest[clientId](stream);
        delete this.pendingAudioRequest[clientId](stream);
      }
    }
  }, {
    key: "trackListener",
    value: function trackListener(clientId, stream) {
      this.storeAudioStream(clientId, stream);
    }
  }, {
    key: "getMediaStream",
    value: function getMediaStream(clientId) {
      var that = this;
      if (this.audioStreams[clientId]) {
        NAF.log.write("Already had audio for " + clientId);
        return Promise.resolve(this.audioStreams[clientId]);
      } else {
        NAF.log.write("Waiting on audio for " + clientId);
        return new Promise(function (resolve) {
          that.pendingAudioRequest[clientId] = resolve;
        });
      }
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
    value: function setDatachannelListeners(openListener, closedListener, messageListener, trackListener) {
      this.openListener = openListener;
      this.closedListener = closedListener;
      this.messageListener = messageListener;
      this.trackListener = trackListener;
    }
  }, {
    key: "offer",
    value: function offer(options) {
      var self = this;
      // reliable: false - UDP
      this.setupChannel(this.pc.createDataChannel(this.channelLabel, { reliable: false }));

      // If there are errors with Safari implement this:
      // https://github.com/OpenVidu/openvidu/blob/master/openvidu-browser/src/OpenViduInternal/WebRtcPeer/WebRtcPeer.ts#L154

      if (options.sendAudio) {
        options.localAudioStream.getTracks().forEach(function (track) {
          return self.pc.addTrack(track, options.localAudioStream);
        });
      }

      this.pc.createOffer(function (sdp) {
        self.handleSessionDescription(sdp);
      }, function (error) {
        NAF.log.error("WebRtcPeer.offer: " + error);
      }, {
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
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

      pc.ontrack = function (e) {
        self.trackListener(self.remoteId, e.streams[0]);
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMGU5MWNhOWZiOWU3ZWZmMzQ2NWUiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9XZWJSdGNQZWVyLmpzIl0sIm5hbWVzIjpbIldlYlJ0Y1BlZXIiLCJyZXF1aXJlIiwiTmF0aXZlV2ViUnRjQWRhcHRlciIsImlvIiwidW5kZWZpbmVkIiwiY29uc29sZSIsIndhcm4iLCJhcHAiLCJyb29tIiwib2NjdXBhbnRMaXN0ZW5lciIsIm15Um9vbUpvaW5UaW1lIiwibXlJZCIsImF2Z1RpbWVPZmZzZXQiLCJwZWVycyIsIm9jY3VwYW50cyIsImF1ZGlvU3RyZWFtcyIsInBlbmRpbmdBdWRpb1JlcXVlc3QiLCJzZXJ2ZXJUaW1lUmVxdWVzdHMiLCJ0aW1lT2Zmc2V0cyIsIndzVXJsIiwiYXBwTmFtZSIsInJvb21OYW1lIiwib3B0aW9ucyIsImRhdGFjaGFubmVsIiwiTkFGIiwibG9nIiwiZXJyb3IiLCJhdWRpbyIsInNlbmRBdWRpbyIsInZpZGVvIiwic3VjY2Vzc0xpc3RlbmVyIiwiZmFpbHVyZUxpc3RlbmVyIiwiY29ubmVjdFN1Y2Nlc3MiLCJjb25uZWN0RmFpbHVyZSIsIm9wZW5MaXN0ZW5lciIsImNsb3NlZExpc3RlbmVyIiwibWVzc2FnZUxpc3RlbmVyIiwic2VsZiIsInVwZGF0ZVRpbWVPZmZzZXQiLCJ0aGVuIiwibG9jYXRpb24iLCJwcm90b2NvbCIsImhvc3QiLCJ3cml0ZSIsInNvY2tldCIsIm9uIiwiaWQiLCJqb2luUm9vbSIsImRhdGEiLCJqb2luZWRUaW1lIiwibWVkaWFDb25zdHJhaW50cyIsIm5hdmlnYXRvciIsIm1lZGlhRGV2aWNlcyIsImdldFVzZXJNZWRpYSIsInN0b3JlQXVkaW9TdHJlYW0iLCJsb2NhbFN0cmVhbSIsImNhdGNoIiwiZSIsImVyciIsInJlY2VpdmVkT2NjdXBhbnRzIiwicmVjZWl2ZURhdGEiLCJwYWNrZXQiLCJmcm9tIiwidHlwZSIsImhhbmRsZVNpZ25hbCIsImVtaXQiLCJsb2NhbElkIiwicmVtb3RlSWQiLCJrZXkiLCJwZWVyIiwidG8iLCJzZW5kaW5nIiwic2V0RGF0YWNoYW5uZWxMaXN0ZW5lcnMiLCJ0cmFja0xpc3RlbmVyIiwiYmluZCIsImNsaWVudCIsImdldE1lZGlhU3RyZWFtIiwibG9jYWxBdWRpb1N0cmVhbSIsInN0cmVhbSIsIm9mZmVyIiwiY2xpZW50SWQiLCJjbG9zZSIsImFkYXB0ZXJzIiwiTk9UX0NPTk5FQ1RFRCIsImdldFN0YXR1cyIsIklTX0NPTk5FQ1RFRCIsIkNPTk5FQ1RJTkciLCJzZW5kIiwic2VuZERhdGEiLCJicm9hZGNhc3RpbmciLCJ0aGF0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJjbGllbnRTZW50VGltZSIsIkRhdGUiLCJub3ciLCJmZXRjaCIsImRvY3VtZW50IiwiaHJlZiIsIm1ldGhvZCIsImNhY2hlIiwicHJlY2lzaW9uIiwic2VydmVyUmVjZWl2ZWRUaW1lIiwicmVzIiwiaGVhZGVycyIsImdldCIsImdldFRpbWUiLCJjbGllbnRSZWNlaXZlZFRpbWUiLCJzZXJ2ZXJUaW1lIiwidGltZU9mZnNldCIsInB1c2giLCJyZWR1Y2UiLCJhY2MiLCJvZmZzZXQiLCJsZW5ndGgiLCJzZXRUaW1lb3V0IiwicmVnaXN0ZXIiLCJtb2R1bGUiLCJleHBvcnRzIiwic2VuZFNpZ25hbEZ1bmMiLCJvcGVuIiwiY2hhbm5lbExhYmVsIiwicGMiLCJjcmVhdGVQZWVyQ29ubmVjdGlvbiIsImNoYW5uZWwiLCJzZXR1cENoYW5uZWwiLCJjcmVhdGVEYXRhQ2hhbm5lbCIsInJlbGlhYmxlIiwiZ2V0VHJhY2tzIiwiZm9yRWFjaCIsImFkZFRyYWNrIiwidHJhY2siLCJjcmVhdGVPZmZlciIsImhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbiIsInNkcCIsIm9mZmVyVG9SZWNlaXZlQXVkaW8iLCJvZmZlclRvUmVjZWl2ZVZpZGVvIiwic2lnbmFsIiwiaGFuZGxlT2ZmZXIiLCJoYW5kbGVBbnN3ZXIiLCJoYW5kbGVDYW5kaWRhdGUiLCJyZWFkeVN0YXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsIlJUQ1BlZXJDb25uZWN0aW9uIiwid2luZG93Iiwid2Via2l0UlRDUGVlckNvbm5lY3Rpb24iLCJtb3pSVENQZWVyQ29ubmVjdGlvbiIsIm1zUlRDUGVlckNvbm5lY3Rpb24iLCJFcnJvciIsImljZVNlcnZlcnMiLCJJQ0VfU0VSVkVSUyIsIm9uaWNlY2FuZGlkYXRlIiwiZXZlbnQiLCJjYW5kaWRhdGUiLCJzZHBNTGluZUluZGV4Iiwib25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2UiLCJpY2VDb25uZWN0aW9uU3RhdGUiLCJvbnRyYWNrIiwic3RyZWFtcyIsIm9ubWVzc2FnZSIsInBhcnNlIiwib25vcGVuIiwib25jbG9zZSIsIm9uZXJyb3IiLCJtZXNzYWdlIiwib25kYXRhY2hhbm5lbCIsInNldFJlbW90ZURlc2NyaXB0aW9uIiwiY3JlYXRlQW5zd2VyIiwiUlRDSWNlQ2FuZGlkYXRlIiwid2Via2l0UlRDSWNlQ2FuZGlkYXRlIiwibW96UlRDSWNlQ2FuZGlkYXRlIiwiYWRkSWNlQ2FuZGlkYXRlIiwic2V0TG9jYWxEZXNjcmlwdGlvbiIsIlJUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsIndlYmtpdFJUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsIm1velJUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsIm1zUlRDU2Vzc2lvbkRlc2NyaXB0aW9uIiwidXJscyJdLCJtYXBwaW5ncyI6IjtRQUFBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBOzs7UUFHQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQSxLQUFLO1FBQ0w7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQSwyQkFBMkIsMEJBQTBCLEVBQUU7UUFDdkQsaUNBQWlDLGVBQWU7UUFDaEQ7UUFDQTtRQUNBOztRQUVBO1FBQ0Esc0RBQXNELCtEQUErRDs7UUFFckg7UUFDQTs7UUFFQTtRQUNBOzs7Ozs7Ozs7Ozs7OztBQzdEQSxJQUFNQSxhQUFhQyxtQkFBT0EsQ0FBQyxDQUFSLENBQW5COztBQUVBOzs7Ozs7SUFLTUMsbUI7QUFDSixpQ0FBYztBQUFBOztBQUNaLFFBQUlDLE9BQU9DLFNBQVgsRUFDRUMsUUFBUUMsSUFBUixDQUFhLHlGQUFiOztBQUVGLFNBQUtDLEdBQUwsR0FBVyxTQUFYO0FBQ0EsU0FBS0MsSUFBTCxHQUFZLFNBQVo7QUFDQSxTQUFLQyxnQkFBTCxHQUF3QixJQUF4QjtBQUNBLFNBQUtDLGNBQUwsR0FBc0IsSUFBdEI7QUFDQSxTQUFLQyxJQUFMLEdBQVksSUFBWjtBQUNBLFNBQUtDLGFBQUwsR0FBcUIsQ0FBckI7O0FBRUEsU0FBS0MsS0FBTCxHQUFhLEVBQWIsQ0FYWSxDQVdLO0FBQ2pCLFNBQUtDLFNBQUwsR0FBaUIsRUFBakIsQ0FaWSxDQVlTOztBQUVyQixTQUFLQyxZQUFMLEdBQW9CLEVBQXBCO0FBQ0EsU0FBS0MsbUJBQUwsR0FBMkIsRUFBM0I7O0FBRUEsU0FBS0Msa0JBQUwsR0FBMEIsQ0FBMUI7QUFDQSxTQUFLQyxXQUFMLEdBQW1CLEVBQW5CO0FBQ0EsU0FBS04sYUFBTCxHQUFxQixDQUFyQjtBQUNEOzs7O2lDQUVZTyxLLEVBQU87QUFDbEIsV0FBS0EsS0FBTCxHQUFhQSxLQUFiO0FBQ0Q7OzsyQkFFTUMsTyxFQUFTO0FBQ2QsV0FBS2IsR0FBTCxHQUFXYSxPQUFYO0FBQ0Q7Ozs0QkFFT0MsUSxFQUFVO0FBQ2hCLFdBQUtiLElBQUwsR0FBWWEsUUFBWjtBQUNEOzs7cUNBRWdCQyxPLEVBQVM7QUFDeEIsVUFBSUEsUUFBUUMsV0FBUixLQUF3QixLQUE1QixFQUFtQztBQUNqQ0MsWUFBSUMsR0FBSixDQUFRQyxLQUFSLENBQ0UsaUVBREY7QUFHRDtBQUNELFVBQUlKLFFBQVFLLEtBQVIsS0FBa0IsSUFBdEIsRUFBNEI7QUFDMUIsYUFBS0MsU0FBTCxHQUFpQixJQUFqQjtBQUNEO0FBQ0QsVUFBSU4sUUFBUU8sS0FBUixLQUFrQixJQUF0QixFQUE0QjtBQUMxQkwsWUFBSUMsR0FBSixDQUFRbkIsSUFBUixDQUFhLGlEQUFiO0FBQ0Q7QUFDRjs7OzhDQUV5QndCLGUsRUFBaUJDLGUsRUFBaUI7QUFDMUQsV0FBS0MsY0FBTCxHQUFzQkYsZUFBdEI7QUFDQSxXQUFLRyxjQUFMLEdBQXNCRixlQUF0QjtBQUNEOzs7NENBRXVCdEIsZ0IsRUFBa0I7QUFDeEMsV0FBS0EsZ0JBQUwsR0FBd0JBLGdCQUF4QjtBQUNEOzs7NENBRXVCeUIsWSxFQUFjQyxjLEVBQWdCQyxlLEVBQWlCO0FBQ3JFLFdBQUtGLFlBQUwsR0FBb0JBLFlBQXBCO0FBQ0EsV0FBS0MsY0FBTCxHQUFzQkEsY0FBdEI7QUFDQSxXQUFLQyxlQUFMLEdBQXVCQSxlQUF2QjtBQUNEOzs7OEJBRVM7QUFDUixVQUFNQyxPQUFPLElBQWI7O0FBRUEsV0FBS0MsZ0JBQUwsR0FDQ0MsSUFERCxDQUNNLFlBQU07QUFDVixZQUFJLENBQUNGLEtBQUtsQixLQUFOLElBQWVrQixLQUFLbEIsS0FBTCxLQUFlLEdBQWxDLEVBQXVDO0FBQ3JDLGNBQUlxQixTQUFTQyxRQUFULEtBQXNCLFFBQTFCLEVBQW9DO0FBQ2xDSixpQkFBS2xCLEtBQUwsR0FBYSxXQUFXcUIsU0FBU0UsSUFBakM7QUFDRCxXQUZELE1BRU87QUFDTEwsaUJBQUtsQixLQUFMLEdBQWEsVUFBVXFCLFNBQVNFLElBQWhDO0FBQ0Q7QUFDRjs7QUFFRGxCLFlBQUlDLEdBQUosQ0FBUWtCLEtBQVIsQ0FBYyxvQ0FBZDtBQUNBLFlBQU1DLFNBQVNQLEtBQUtPLE1BQUwsR0FBY3pDLEdBQUdrQyxLQUFLbEIsS0FBUixDQUE3Qjs7QUFFQXlCLGVBQU9DLEVBQVAsQ0FBVSxTQUFWLEVBQXFCLFlBQU07QUFDekJyQixjQUFJQyxHQUFKLENBQVFrQixLQUFSLENBQWMsZ0JBQWQsRUFBZ0NDLE9BQU9FLEVBQXZDO0FBQ0FULGVBQUsxQixJQUFMLEdBQVlpQyxPQUFPRSxFQUFuQjtBQUNBVCxlQUFLVSxRQUFMO0FBQ0QsU0FKRDs7QUFNQUgsZUFBT0MsRUFBUCxDQUFVLGdCQUFWLEVBQTRCLFVBQUNHLElBQUQsRUFBVTtBQUFBLGNBQzVCQyxVQUQ0QixHQUNiRCxJQURhLENBQzVCQyxVQUQ0Qjs7O0FBR3BDWixlQUFLM0IsY0FBTCxHQUFzQnVDLFVBQXRCO0FBQ0F6QixjQUFJQyxHQUFKLENBQVFrQixLQUFSLENBQWMsMEJBQWQsRUFBMENOLEtBQUs3QixJQUEvQyxFQUFxRCxnQkFBckQsRUFBdUV5QyxVQUF2RTs7QUFFQSxjQUFJWixLQUFLVCxTQUFULEVBQW9CO0FBQ2xCLGdCQUFNc0IsbUJBQW1CO0FBQ3ZCdkIscUJBQU8sSUFEZ0I7QUFFdkJFLHFCQUFPO0FBRmdCLGFBQXpCO0FBSUFzQixzQkFBVUMsWUFBVixDQUF1QkMsWUFBdkIsQ0FBb0NILGdCQUFwQyxFQUNDWCxJQURELENBQ00sdUJBQWU7QUFDbkJGLG1CQUFLaUIsZ0JBQUwsQ0FBc0JqQixLQUFLMUIsSUFBM0IsRUFBaUM0QyxXQUFqQztBQUNBbEIsbUJBQUtMLGNBQUwsQ0FBb0JLLEtBQUsxQixJQUF6QjtBQUNELGFBSkQsRUFLQzZDLEtBTEQsQ0FLTztBQUFBLHFCQUFLaEMsSUFBSUMsR0FBSixDQUFRQyxLQUFSLENBQWMrQixDQUFkLENBQUw7QUFBQSxhQUxQO0FBTUQsV0FYRCxNQVdPO0FBQ0xwQixpQkFBS0wsY0FBTCxDQUFvQkssS0FBSzFCLElBQXpCO0FBQ0Q7QUFDRixTQXBCRDs7QUFzQkFpQyxlQUFPQyxFQUFQLENBQVUsT0FBVixFQUFtQixlQUFPO0FBQ3hCeEMsa0JBQVFxQixLQUFSLENBQWMsMkJBQWQsRUFBMkNnQyxHQUEzQztBQUNBckIsZUFBS0osY0FBTDtBQUNELFNBSEQ7O0FBS0FXLGVBQU9DLEVBQVAsQ0FBVSxrQkFBVixFQUE4QixnQkFBUTtBQUFBLGNBQzVCL0IsU0FENEIsR0FDZGtDLElBRGMsQ0FDNUJsQyxTQUQ0Qjs7QUFFcENVLGNBQUlDLEdBQUosQ0FBUWtCLEtBQVIsQ0FBYyxtQkFBZCxFQUFtQ0ssSUFBbkM7QUFDQVgsZUFBS3NCLGlCQUFMLENBQXVCN0MsU0FBdkI7QUFDRCxTQUpEOztBQU1BLGlCQUFTOEMsV0FBVCxDQUFxQkMsTUFBckIsRUFBNkI7QUFDM0IsY0FBTUMsT0FBT0QsT0FBT0MsSUFBcEI7QUFDQSxjQUFNQyxPQUFPRixPQUFPRSxJQUFwQjtBQUNBLGNBQU1mLE9BQU9hLE9BQU9iLElBQXBCO0FBQ0EsY0FBSWUsU0FBUyxlQUFiLEVBQThCO0FBQzVCMUIsaUJBQUt4QixLQUFMLENBQVdpRCxJQUFYLEVBQWlCRSxZQUFqQixDQUE4QmhCLElBQTlCO0FBQ0E7QUFDRDtBQUNEWCxlQUFLRCxlQUFMLENBQXFCMEIsSUFBckIsRUFBMkJDLElBQTNCLEVBQWlDZixJQUFqQztBQUNEOztBQUVESixlQUFPQyxFQUFQLENBQVUsTUFBVixFQUFrQmUsV0FBbEI7QUFDQWhCLGVBQU9DLEVBQVAsQ0FBVSxXQUFWLEVBQXVCZSxXQUF2QjtBQUNELE9BakVEO0FBb0VEOzs7K0JBRVU7QUFDVHBDLFVBQUlDLEdBQUosQ0FBUWtCLEtBQVIsQ0FBYyxjQUFkLEVBQThCLEtBQUtuQyxJQUFuQztBQUNBLFdBQUtvQyxNQUFMLENBQVlxQixJQUFaLENBQWlCLFVBQWpCLEVBQTZCLEVBQUV6RCxNQUFNLEtBQUtBLElBQWIsRUFBN0I7QUFDRDs7O3NDQUVpQk0sUyxFQUFXO0FBQUE7O0FBQzNCLGFBQU9BLFVBQVUsS0FBS0gsSUFBZixDQUFQOztBQUVBLFdBQUtHLFNBQUwsR0FBaUJBLFNBQWpCOztBQUVBVSxVQUFJQyxHQUFKLENBQVFrQixLQUFSLENBQWMsWUFBZCxFQUE0QjdCLFNBQTVCO0FBQ0EsVUFBTXVCLE9BQU8sSUFBYjtBQUNBLFVBQU02QixVQUFVLEtBQUt2RCxJQUFyQjs7QUFQMkI7QUFVekIsWUFBTXdELFdBQVdDLEdBQWpCO0FBQ0EsWUFBSSxNQUFLdkQsS0FBTCxDQUFXc0QsUUFBWCxDQUFKLEVBQTBCOztBQUUxQixZQUFNRSxPQUFPLElBQUlyRSxVQUFKLENBQ1hrRSxPQURXLEVBRVhDLFFBRlcsRUFHWCxVQUFDbkIsSUFBRCxFQUFVO0FBQ1JYLGVBQUtPLE1BQUwsQ0FBWXFCLElBQVosQ0FBaUIsTUFBakIsRUFBd0I7QUFDdEJILGtCQUFNSSxPQURnQjtBQUV0QkksZ0JBQUlILFFBRmtCO0FBR3RCSixrQkFBTSxlQUhnQjtBQUl0QmYsc0JBSnNCO0FBS3RCdUIscUJBQVM7QUFMYSxXQUF4QjtBQU9ELFNBWFUsQ0FBYjtBQWFBRixhQUFLRyx1QkFBTCxDQUNFbkMsS0FBS0gsWUFEUCxFQUVFRyxLQUFLRixjQUZQLEVBR0VFLEtBQUtELGVBSFAsRUFJRUMsS0FBS29DLGFBQUwsQ0FBbUJDLElBQW5CLENBQXdCckMsSUFBeEIsQ0FKRjs7QUFPQUEsYUFBS3hCLEtBQUwsQ0FBV3NELFFBQVgsSUFBdUJFLElBQXZCO0FBakN5Qjs7QUFTM0IsV0FBSyxJQUFJRCxHQUFULElBQWdCdEQsU0FBaEIsRUFBMkI7QUFBQTs7QUFBQSxpQ0FFQztBQXVCM0I7O0FBRUQsV0FBS0wsZ0JBQUwsQ0FBc0JLLFNBQXRCO0FBQ0Q7Ozs0Q0FFdUI2RCxNLEVBQVE7QUFDOUIsYUFBTyxDQUFDLEtBQUtqRSxjQUFMLElBQXVCLENBQXhCLE1BQStCaUUsVUFBVSxDQUF6QyxDQUFQO0FBQ0Q7OzswQ0FFcUJSLFEsRUFBVTtBQUFBOztBQUM5QjNDLFVBQUlDLEdBQUosQ0FBUWtCLEtBQVIsQ0FBYyx3QkFBZDs7QUFFQSxVQUFJLEtBQUtmLFNBQVQsRUFBb0I7QUFDbEIsYUFBS2dELGNBQUwsQ0FBb0IsS0FBS2pFLElBQXpCLEVBQ0M0QixJQURELENBQ00sa0JBQVU7QUFDZCxjQUFNakIsVUFBVTtBQUNkTSx1QkFBVyxJQURHO0FBRWRpRCw4QkFBa0JDO0FBRkosV0FBaEI7QUFJQSxpQkFBS2pFLEtBQUwsQ0FBV3NELFFBQVgsRUFBcUJZLEtBQXJCLENBQTJCekQsT0FBM0I7QUFDRCxTQVBEO0FBUUQsT0FURCxNQVNPO0FBQ0wsYUFBS1QsS0FBTCxDQUFXc0QsUUFBWCxFQUFxQlksS0FBckIsQ0FBMkIsRUFBM0I7QUFDRDtBQUNGOzs7MENBRXFCQyxRLEVBQVU7QUFDOUJ4RCxVQUFJQyxHQUFKLENBQVFrQixLQUFSLENBQWMsdUJBQWQsRUFBdUNxQyxRQUF2QyxFQUFpRCxLQUFLbkUsS0FBdEQ7QUFDQSxXQUFLQSxLQUFMLENBQVdtRSxRQUFYLEVBQXFCQyxLQUFyQjtBQUNBLGFBQU8sS0FBS3BFLEtBQUwsQ0FBV21FLFFBQVgsQ0FBUDtBQUNBLGFBQU8sS0FBS2xFLFNBQUwsQ0FBZWtFLFFBQWYsQ0FBUDtBQUNBLFdBQUs3QyxjQUFMLENBQW9CNkMsUUFBcEI7QUFDRDs7O3FDQUVnQkEsUSxFQUFVO0FBQ3pCLFVBQU1YLE9BQU8sS0FBS3hELEtBQUwsQ0FBV21FLFFBQVgsQ0FBYjs7QUFFQSxVQUFJWCxTQUFTakUsU0FBYixFQUF3QixPQUFPb0IsSUFBSTBELFFBQUosQ0FBYUMsYUFBcEI7O0FBRXhCLGNBQVFkLEtBQUtlLFNBQUwsRUFBUjtBQUNFLGFBQUtwRixXQUFXcUYsWUFBaEI7QUFDRSxpQkFBTzdELElBQUkwRCxRQUFKLENBQWFHLFlBQXBCOztBQUVGLGFBQUtyRixXQUFXc0YsVUFBaEI7QUFDRSxpQkFBTzlELElBQUkwRCxRQUFKLENBQWFJLFVBQXBCOztBQUVGLGFBQUt0RixXQUFXbUYsYUFBaEI7QUFDQTtBQUNFLGlCQUFPM0QsSUFBSTBELFFBQUosQ0FBYUMsYUFBcEI7QUFUSjtBQVdEOzs7NkJBRVFiLEUsRUFBSVAsSSxFQUFNZixJLEVBQU07QUFDdkIsV0FBS25DLEtBQUwsQ0FBV3lELEVBQVgsRUFBZWlCLElBQWYsQ0FBb0J4QixJQUFwQixFQUEwQmYsSUFBMUI7QUFDRDs7O3VDQUVrQnNCLEUsRUFBSVAsSSxFQUFNZixJLEVBQU07QUFDakMsVUFBTWEsU0FBUztBQUNiQyxjQUFNLEtBQUtuRCxJQURFO0FBRWIyRCxjQUZhO0FBR2JQLGtCQUhhO0FBSWJmLGtCQUphO0FBS2J1QixpQkFBUztBQUxJLE9BQWY7O0FBUUEsV0FBSzNCLE1BQUwsQ0FBWXFCLElBQVosQ0FBaUIsTUFBakIsRUFBeUJKLE1BQXpCO0FBQ0Q7OztrQ0FFYUUsSSxFQUFNZixJLEVBQU07QUFDeEIsV0FBSyxJQUFJZ0MsUUFBVCxJQUFxQixLQUFLbkUsS0FBMUIsRUFBaUM7QUFDL0IsYUFBSzJFLFFBQUwsQ0FBY1IsUUFBZCxFQUF3QmpCLElBQXhCLEVBQThCZixJQUE5QjtBQUNEO0FBQ0Y7Ozs0Q0FFdUJlLEksRUFBTWYsSSxFQUFNO0FBQ2xDLFVBQU1hLFNBQVM7QUFDYkMsY0FBTSxLQUFLbkQsSUFERTtBQUVib0Qsa0JBRmE7QUFHYmYsa0JBSGE7QUFJYnlDLHNCQUFjO0FBSkQsT0FBZjtBQU1BLFdBQUs3QyxNQUFMLENBQVlxQixJQUFaLENBQWlCLFdBQWpCLEVBQThCSixNQUE5QjtBQUNEOzs7cUNBRWdCbUIsUSxFQUFVRixNLEVBQVE7QUFDakMsV0FBSy9ELFlBQUwsQ0FBa0JpRSxRQUFsQixJQUE4QkYsTUFBOUI7QUFDQSxVQUFJLEtBQUs5RCxtQkFBTCxDQUF5QmdFLFFBQXpCLENBQUosRUFBd0M7QUFDdEN4RCxZQUFJQyxHQUFKLENBQVFrQixLQUFSLENBQWMsZ0NBQWdDcUMsUUFBOUM7QUFDQSxhQUFLaEUsbUJBQUwsQ0FBeUJnRSxRQUF6QixFQUFtQ0YsTUFBbkM7QUFDQSxlQUFPLEtBQUs5RCxtQkFBTCxDQUF5QmdFLFFBQXpCLEVBQW1DRixNQUFuQyxDQUFQO0FBQ0Q7QUFDRjs7O2tDQUVhRSxRLEVBQVVGLE0sRUFBUTtBQUM5QixXQUFLeEIsZ0JBQUwsQ0FBc0IwQixRQUF0QixFQUFnQ0YsTUFBaEM7QUFDRDs7O21DQUVjRSxRLEVBQVU7QUFDdkIsVUFBSVUsT0FBTyxJQUFYO0FBQ0EsVUFBSSxLQUFLM0UsWUFBTCxDQUFrQmlFLFFBQWxCLENBQUosRUFBaUM7QUFDL0J4RCxZQUFJQyxHQUFKLENBQVFrQixLQUFSLENBQWMsMkJBQTJCcUMsUUFBekM7QUFDQSxlQUFPVyxRQUFRQyxPQUFSLENBQWdCLEtBQUs3RSxZQUFMLENBQWtCaUUsUUFBbEIsQ0FBaEIsQ0FBUDtBQUNELE9BSEQsTUFHTztBQUNMeEQsWUFBSUMsR0FBSixDQUFRa0IsS0FBUixDQUFjLDBCQUEwQnFDLFFBQXhDO0FBQ0EsZUFBTyxJQUFJVyxPQUFKLENBQVksbUJBQVc7QUFDNUJELGVBQUsxRSxtQkFBTCxDQUF5QmdFLFFBQXpCLElBQXFDWSxPQUFyQztBQUNELFNBRk0sQ0FBUDtBQUdEO0FBQ0Y7Ozt1Q0FFa0I7QUFBQTs7QUFDakIsVUFBTUMsaUJBQWlCQyxLQUFLQyxHQUFMLEtBQWEsS0FBS25GLGFBQXpDOztBQUVBLGFBQU9vRixNQUFNQyxTQUFTekQsUUFBVCxDQUFrQjBELElBQXhCLEVBQThCLEVBQUVDLFFBQVEsTUFBVixFQUFrQkMsT0FBTyxVQUF6QixFQUE5QixFQUNKN0QsSUFESSxDQUNDLGVBQU87QUFDWCxZQUFJOEQsWUFBWSxJQUFoQjtBQUNBLFlBQUlDLHFCQUFxQixJQUFJUixJQUFKLENBQVNTLElBQUlDLE9BQUosQ0FBWUMsR0FBWixDQUFnQixNQUFoQixDQUFULEVBQWtDQyxPQUFsQyxLQUErQ0wsWUFBWSxDQUFwRjtBQUNBLFlBQUlNLHFCQUFxQmIsS0FBS0MsR0FBTCxFQUF6QjtBQUNBLFlBQUlhLGFBQWFOLHFCQUFzQixDQUFDSyxxQkFBcUJkLGNBQXRCLElBQXdDLENBQS9FO0FBQ0EsWUFBSWdCLGFBQWFELGFBQWFELGtCQUE5Qjs7QUFFQSxlQUFLMUYsa0JBQUw7O0FBRUEsWUFBSSxPQUFLQSxrQkFBTCxJQUEyQixFQUEvQixFQUFtQztBQUNqQyxpQkFBS0MsV0FBTCxDQUFpQjRGLElBQWpCLENBQXNCRCxVQUF0QjtBQUNELFNBRkQsTUFFTztBQUNMLGlCQUFLM0YsV0FBTCxDQUFpQixPQUFLRCxrQkFBTCxHQUEwQixFQUEzQyxJQUFpRDRGLFVBQWpEO0FBQ0Q7O0FBRUQsZUFBS2pHLGFBQUwsR0FBcUIsT0FBS00sV0FBTCxDQUFpQjZGLE1BQWpCLENBQXdCLFVBQUNDLEdBQUQsRUFBTUMsTUFBTjtBQUFBLGlCQUFpQkQsT0FBT0MsTUFBeEI7QUFBQSxTQUF4QixFQUF3RCxDQUF4RCxJQUE2RCxPQUFLL0YsV0FBTCxDQUFpQmdHLE1BQW5HOztBQUVBLFlBQUksT0FBS2pHLGtCQUFMLEdBQTBCLEVBQTlCLEVBQWtDO0FBQ2hDa0cscUJBQVc7QUFBQSxtQkFBTSxPQUFLN0UsZ0JBQUwsRUFBTjtBQUFBLFdBQVgsRUFBMEMsSUFBSSxFQUFKLEdBQVMsSUFBbkQsRUFEZ0MsQ0FDMEI7QUFDM0QsU0FGRCxNQUVPO0FBQ0wsaUJBQUtBLGdCQUFMO0FBQ0Q7QUFDRixPQXZCSSxDQUFQO0FBd0JEOzs7b0NBRWU7QUFDZCxhQUFPLENBQUMsQ0FBUixDQURjLENBQ0g7QUFDWjs7Ozs7O0FBR0hkLElBQUkwRCxRQUFKLENBQWFrQyxRQUFiLENBQXNCLGVBQXRCLEVBQXVDbEgsbUJBQXZDOztBQUVBbUgsT0FBT0MsT0FBUCxHQUFpQnBILG1CQUFqQixDOzs7Ozs7Ozs7Ozs7O0lDelVNRixVO0FBQ0osc0JBQVlrRSxPQUFaLEVBQXFCQyxRQUFyQixFQUErQm9ELGNBQS9CLEVBQStDO0FBQUE7O0FBQzdDLFNBQUtyRCxPQUFMLEdBQWVBLE9BQWY7QUFDQSxTQUFLQyxRQUFMLEdBQWdCQSxRQUFoQjtBQUNBLFNBQUtvRCxjQUFMLEdBQXNCQSxjQUF0QjtBQUNBLFNBQUtDLElBQUwsR0FBWSxLQUFaO0FBQ0EsU0FBS0MsWUFBTCxHQUFvQiwwQkFBcEI7O0FBRUEsU0FBS0MsRUFBTCxHQUFVLEtBQUtDLG9CQUFMLEVBQVY7QUFDQSxTQUFLQyxPQUFMLEdBQWUsSUFBZjtBQUNEOzs7OzRDQUV1QjFGLFksRUFBY0MsYyxFQUFnQkMsZSxFQUFpQnFDLGEsRUFBZTtBQUNwRixXQUFLdkMsWUFBTCxHQUFvQkEsWUFBcEI7QUFDQSxXQUFLQyxjQUFMLEdBQXNCQSxjQUF0QjtBQUNBLFdBQUtDLGVBQUwsR0FBdUJBLGVBQXZCO0FBQ0EsV0FBS3FDLGFBQUwsR0FBcUJBLGFBQXJCO0FBQ0Q7OzswQkFFS25ELE8sRUFBUztBQUNiLFVBQUllLE9BQU8sSUFBWDtBQUNBO0FBQ0EsV0FBS3dGLFlBQUwsQ0FDRSxLQUFLSCxFQUFMLENBQVFJLGlCQUFSLENBQTBCLEtBQUtMLFlBQS9CLEVBQTZDLEVBQUVNLFVBQVUsS0FBWixFQUE3QyxDQURGOztBQUlBO0FBQ0E7O0FBRUEsVUFBSXpHLFFBQVFNLFNBQVosRUFBdUI7QUFDckJOLGdCQUFRdUQsZ0JBQVIsQ0FBeUJtRCxTQUF6QixHQUFxQ0MsT0FBckMsQ0FDRTtBQUFBLGlCQUFTNUYsS0FBS3FGLEVBQUwsQ0FBUVEsUUFBUixDQUFpQkMsS0FBakIsRUFBd0I3RyxRQUFRdUQsZ0JBQWhDLENBQVQ7QUFBQSxTQURGO0FBRUQ7O0FBRUQsV0FBSzZDLEVBQUwsQ0FBUVUsV0FBUixDQUNFLGVBQU87QUFDTC9GLGFBQUtnRyx3QkFBTCxDQUE4QkMsR0FBOUI7QUFDRCxPQUhILEVBSUUsaUJBQVM7QUFDUDlHLFlBQUlDLEdBQUosQ0FBUUMsS0FBUixDQUFjLHVCQUF1QkEsS0FBckM7QUFDRCxPQU5ILEVBT0U7QUFDRTZHLDZCQUFxQixJQUR2QjtBQUVFQyw2QkFBcUI7QUFGdkIsT0FQRjtBQVlEOzs7aUNBRVlDLE0sRUFBUTtBQUNuQjtBQUNBLFVBQUksS0FBS3ZFLE9BQUwsS0FBaUJ1RSxPQUFPbkUsRUFBeEIsSUFBOEIsS0FBS0gsUUFBTCxLQUFrQnNFLE9BQU8zRSxJQUEzRCxFQUFpRTs7QUFFakUsY0FBUTJFLE9BQU8xRSxJQUFmO0FBQ0UsYUFBSyxPQUFMO0FBQ0UsZUFBSzJFLFdBQUwsQ0FBaUJELE1BQWpCO0FBQ0E7O0FBRUYsYUFBSyxRQUFMO0FBQ0UsZUFBS0UsWUFBTCxDQUFrQkYsTUFBbEI7QUFDQTs7QUFFRixhQUFLLFdBQUw7QUFDRSxlQUFLRyxlQUFMLENBQXFCSCxNQUFyQjtBQUNBOztBQUVGO0FBQ0VqSCxjQUFJQyxHQUFKLENBQVFDLEtBQVIsQ0FDRSxrREFBa0QrRyxPQUFPMUUsSUFEM0Q7QUFHQTtBQWpCSjtBQW1CRDs7O3lCQUVJQSxJLEVBQU1mLEksRUFBTTtBQUNmLFVBQUksS0FBSzRFLE9BQUwsS0FBaUIsSUFBakIsSUFBeUIsS0FBS0EsT0FBTCxDQUFhaUIsVUFBYixLQUE0QixNQUF6RCxFQUFpRTtBQUMvRDtBQUNEOztBQUVELFdBQUtqQixPQUFMLENBQWFyQyxJQUFiLENBQWtCdUQsS0FBS0MsU0FBTCxDQUFlLEVBQUVoRixNQUFNQSxJQUFSLEVBQWNmLE1BQU1BLElBQXBCLEVBQWYsQ0FBbEI7QUFDRDs7O2dDQUVXO0FBQ1YsVUFBSSxLQUFLNEUsT0FBTCxLQUFpQixJQUFyQixFQUEyQixPQUFPNUgsV0FBV21GLGFBQWxCOztBQUUzQixjQUFRLEtBQUt5QyxPQUFMLENBQWFpQixVQUFyQjtBQUNFLGFBQUssTUFBTDtBQUNFLGlCQUFPN0ksV0FBV3FGLFlBQWxCOztBQUVGLGFBQUssWUFBTDtBQUNFLGlCQUFPckYsV0FBV3NGLFVBQWxCOztBQUVGLGFBQUssU0FBTDtBQUNBLGFBQUssUUFBTDtBQUNBO0FBQ0UsaUJBQU90RixXQUFXbUYsYUFBbEI7QUFWSjtBQVlEOztBQUVEOzs7Ozs7MkNBSXVCO0FBQ3JCLFVBQUk5QyxPQUFPLElBQVg7QUFDQSxVQUFJMkcsb0JBQ0ZDLE9BQU9ELGlCQUFQLElBQ0FDLE9BQU9DLHVCQURQLElBRUFELE9BQU9FLG9CQUZQLElBR0FGLE9BQU9HLG1CQUpUOztBQU1BLFVBQUlKLHNCQUFzQjVJLFNBQTFCLEVBQXFDO0FBQ25DLGNBQU0sSUFBSWlKLEtBQUosQ0FDSixnRkFESSxDQUFOO0FBR0Q7O0FBRUQsVUFBSTNCLEtBQUssSUFBSXNCLGlCQUFKLENBQXNCLEVBQUVNLFlBQVl0SixXQUFXdUosV0FBekIsRUFBdEIsQ0FBVDs7QUFFQTdCLFNBQUc4QixjQUFILEdBQW9CLFVBQVNDLEtBQVQsRUFBZ0I7QUFDbEMsWUFBSUEsTUFBTUMsU0FBVixFQUFxQjtBQUNuQnJILGVBQUtrRixjQUFMLENBQW9CO0FBQ2xCekQsa0JBQU16QixLQUFLNkIsT0FETztBQUVsQkksZ0JBQUlqQyxLQUFLOEIsUUFGUztBQUdsQkosa0JBQU0sV0FIWTtBQUlsQjRGLDJCQUFlRixNQUFNQyxTQUFOLENBQWdCQyxhQUpiO0FBS2xCRCx1QkFBV0QsTUFBTUMsU0FBTixDQUFnQkE7QUFMVCxXQUFwQjtBQU9EO0FBQ0YsT0FWRDs7QUFZQTtBQUNBO0FBQ0FoQyxTQUFHa0MsMEJBQUgsR0FBZ0MsWUFBVztBQUN6QyxZQUFJdkgsS0FBS21GLElBQUwsSUFBYUUsR0FBR21DLGtCQUFILEtBQTBCLGNBQTNDLEVBQTJEO0FBQ3pEeEgsZUFBS21GLElBQUwsR0FBWSxLQUFaO0FBQ0FuRixlQUFLRixjQUFMLENBQW9CRSxLQUFLOEIsUUFBekI7QUFDRDtBQUNGLE9BTEQ7O0FBT0F1RCxTQUFHb0MsT0FBSCxHQUFhLFVBQUNyRyxDQUFELEVBQU87QUFDbEJwQixhQUFLb0MsYUFBTCxDQUFtQnBDLEtBQUs4QixRQUF4QixFQUFrQ1YsRUFBRXNHLE9BQUYsQ0FBVSxDQUFWLENBQWxDO0FBQ0QsT0FGRDs7QUFJQSxhQUFPckMsRUFBUDtBQUNEOzs7aUNBRVlFLE8sRUFBUztBQUNwQixVQUFJdkYsT0FBTyxJQUFYOztBQUVBLFdBQUt1RixPQUFMLEdBQWVBLE9BQWY7O0FBRUE7QUFDQSxXQUFLQSxPQUFMLENBQWFvQyxTQUFiLEdBQXlCLFVBQVNQLEtBQVQsRUFBZ0I7QUFDdkMsWUFBSXpHLE9BQU84RixLQUFLbUIsS0FBTCxDQUFXUixNQUFNekcsSUFBakIsQ0FBWDtBQUNBWCxhQUFLRCxlQUFMLENBQXFCQyxLQUFLOEIsUUFBMUIsRUFBb0NuQixLQUFLZSxJQUF6QyxFQUErQ2YsS0FBS0EsSUFBcEQ7QUFDRCxPQUhEOztBQUtBO0FBQ0EsV0FBSzRFLE9BQUwsQ0FBYXNDLE1BQWIsR0FBc0IsVUFBU1QsS0FBVCxFQUFnQjtBQUNwQ3BILGFBQUttRixJQUFMLEdBQVksSUFBWjtBQUNBbkYsYUFBS0gsWUFBTCxDQUFrQkcsS0FBSzhCLFFBQXZCO0FBQ0QsT0FIRDs7QUFLQTtBQUNBLFdBQUt5RCxPQUFMLENBQWF1QyxPQUFiLEdBQXVCLFVBQVNWLEtBQVQsRUFBZ0I7QUFDckMsWUFBSSxDQUFDcEgsS0FBS21GLElBQVYsRUFBZ0I7QUFDaEJuRixhQUFLbUYsSUFBTCxHQUFZLEtBQVo7QUFDQW5GLGFBQUtGLGNBQUwsQ0FBb0JFLEtBQUs4QixRQUF6QjtBQUNELE9BSkQ7O0FBTUE7QUFDQSxXQUFLeUQsT0FBTCxDQUFhd0MsT0FBYixHQUF1QixVQUFTMUksS0FBVCxFQUFnQjtBQUNyQ0YsWUFBSUMsR0FBSixDQUFRQyxLQUFSLENBQWMsaUNBQWlDQSxLQUEvQztBQUNELE9BRkQ7QUFHRDs7O2dDQUVXMkksTyxFQUFTO0FBQ25CLFVBQUloSSxPQUFPLElBQVg7O0FBRUEsV0FBS3FGLEVBQUwsQ0FBUTRDLGFBQVIsR0FBd0IsVUFBU2IsS0FBVCxFQUFnQjtBQUN0Q3BILGFBQUt3RixZQUFMLENBQWtCNEIsTUFBTTdCLE9BQXhCO0FBQ0QsT0FGRDs7QUFJQSxXQUFLMkMsb0JBQUwsQ0FBMEJGLE9BQTFCOztBQUVBLFdBQUszQyxFQUFMLENBQVE4QyxZQUFSLENBQ0UsVUFBU2xDLEdBQVQsRUFBYztBQUNaakcsYUFBS2dHLHdCQUFMLENBQThCQyxHQUE5QjtBQUNELE9BSEgsRUFJRSxVQUFTNUcsS0FBVCxFQUFnQjtBQUNkRixZQUFJQyxHQUFKLENBQVFDLEtBQVIsQ0FBYyw2QkFBNkJBLEtBQTNDO0FBQ0QsT0FOSDtBQVFEOzs7aUNBRVkySSxPLEVBQVM7QUFDcEIsV0FBS0Usb0JBQUwsQ0FBMEJGLE9BQTFCO0FBQ0Q7OztvQ0FFZUEsTyxFQUFTO0FBQ3ZCLFVBQUloSSxPQUFPLElBQVg7QUFDQSxVQUFJb0ksa0JBQ0Z4QixPQUFPd0IsZUFBUCxJQUNBeEIsT0FBT3lCLHFCQURQLElBRUF6QixPQUFPMEIsa0JBSFQ7O0FBS0EsV0FBS2pELEVBQUwsQ0FBUWtELGVBQVIsQ0FDRSxJQUFJSCxlQUFKLENBQW9CSixPQUFwQixDQURGLEVBRUUsWUFBVyxDQUFFLENBRmYsRUFHRSxVQUFTM0ksS0FBVCxFQUFnQjtBQUNkRixZQUFJQyxHQUFKLENBQVFDLEtBQVIsQ0FBYyxpQ0FBaUNBLEtBQS9DO0FBQ0QsT0FMSDtBQU9EOzs7NkNBRXdCNEcsRyxFQUFLO0FBQzVCLFVBQUlqRyxPQUFPLElBQVg7O0FBRUEsV0FBS3FGLEVBQUwsQ0FBUW1ELG1CQUFSLENBQ0V2QyxHQURGLEVBRUUsWUFBVyxDQUFFLENBRmYsRUFHRSxVQUFTNUcsS0FBVCxFQUFnQjtBQUNkRixZQUFJQyxHQUFKLENBQVFDLEtBQVIsQ0FBYywwQ0FBMENBLEtBQXhEO0FBQ0QsT0FMSDs7QUFRQSxXQUFLNkYsY0FBTCxDQUFvQjtBQUNsQnpELGNBQU0sS0FBS0ksT0FETztBQUVsQkksWUFBSSxLQUFLSCxRQUZTO0FBR2xCSixjQUFNdUUsSUFBSXZFLElBSFE7QUFJbEJ1RSxhQUFLQSxJQUFJQTtBQUpTLE9BQXBCO0FBTUQ7Ozt5Q0FFb0IrQixPLEVBQVM7QUFDNUIsVUFBSWhJLE9BQU8sSUFBWDtBQUNBLFVBQUl5SSx3QkFDRjdCLE9BQU82QixxQkFBUCxJQUNBN0IsT0FBTzhCLDJCQURQLElBRUE5QixPQUFPK0Isd0JBRlAsSUFHQS9CLE9BQU9nQyx1QkFKVDs7QUFNQSxXQUFLdkQsRUFBTCxDQUFRNkMsb0JBQVIsQ0FDRSxJQUFJTyxxQkFBSixDQUEwQlQsT0FBMUIsQ0FERixFQUVFLFlBQVcsQ0FBRSxDQUZmLEVBR0UsVUFBUzNJLEtBQVQsRUFBZ0I7QUFDZEYsWUFBSUMsR0FBSixDQUFRQyxLQUFSLENBQWMsc0NBQXNDQSxLQUFwRDtBQUNELE9BTEg7QUFPRDs7OzRCQUVPO0FBQ04sVUFBSSxLQUFLZ0csRUFBVCxFQUFhO0FBQ1gsYUFBS0EsRUFBTCxDQUFRekMsS0FBUjtBQUNEO0FBQ0Y7Ozs7OztBQUdIakYsV0FBV3FGLFlBQVgsR0FBMEIsY0FBMUI7QUFDQXJGLFdBQVdzRixVQUFYLEdBQXdCLFlBQXhCO0FBQ0F0RixXQUFXbUYsYUFBWCxHQUEyQixlQUEzQjs7QUFFQW5GLFdBQVd1SixXQUFYLEdBQXlCLENBQ3ZCLEVBQUUyQixNQUFNLCtCQUFSLEVBRHVCLEVBRXZCLEVBQUVBLE1BQU0sK0JBQVIsRUFGdUIsRUFHdkIsRUFBRUEsTUFBTSwrQkFBUixFQUh1QixFQUl2QixFQUFFQSxNQUFNLCtCQUFSLEVBSnVCLENBQXpCOztBQU9BN0QsT0FBT0MsT0FBUCxHQUFpQnRILFVBQWpCLEMiLCJmaWxlIjoibmFmLW5hdGl2ZS13ZWJydGMtYWRhcHRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwge1xuIFx0XHRcdFx0Y29uZmlndXJhYmxlOiBmYWxzZSxcbiBcdFx0XHRcdGVudW1lcmFibGU6IHRydWUsXG4gXHRcdFx0XHRnZXQ6IGdldHRlclxuIFx0XHRcdH0pO1xuIFx0XHR9XG4gXHR9O1xuXG4gXHQvLyBnZXREZWZhdWx0RXhwb3J0IGZ1bmN0aW9uIGZvciBjb21wYXRpYmlsaXR5IHdpdGggbm9uLWhhcm1vbnkgbW9kdWxlc1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5uID0gZnVuY3Rpb24obW9kdWxlKSB7XG4gXHRcdHZhciBnZXR0ZXIgPSBtb2R1bGUgJiYgbW9kdWxlLl9fZXNNb2R1bGUgP1xuIFx0XHRcdGZ1bmN0aW9uIGdldERlZmF1bHQoKSB7IHJldHVybiBtb2R1bGVbJ2RlZmF1bHQnXTsgfSA6XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0TW9kdWxlRXhwb3J0cygpIHsgcmV0dXJuIG1vZHVsZTsgfTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kKGdldHRlciwgJ2EnLCBnZXR0ZXIpO1xuIFx0XHRyZXR1cm4gZ2V0dGVyO1xuIFx0fTtcblxuIFx0Ly8gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm8gPSBmdW5jdGlvbihvYmplY3QsIHByb3BlcnR5KSB7IHJldHVybiBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwob2JqZWN0LCBwcm9wZXJ0eSk7IH07XG5cbiBcdC8vIF9fd2VicGFja19wdWJsaWNfcGF0aF9fXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnAgPSBcIlwiO1xuXG4gXHQvLyBMb2FkIGVudHJ5IG1vZHVsZSBhbmQgcmV0dXJuIGV4cG9ydHNcbiBcdHJldHVybiBfX3dlYnBhY2tfcmVxdWlyZV9fKF9fd2VicGFja19yZXF1aXJlX18ucyA9IDApO1xuXG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIHdlYnBhY2svYm9vdHN0cmFwIDBlOTFjYTlmYjllN2VmZjM0NjVlIiwiY29uc3QgV2ViUnRjUGVlciA9IHJlcXVpcmUoXCIuL1dlYlJ0Y1BlZXJcIik7XG5cbi8qKlxuICogTmF0aXZlIFdlYlJUQyBBZGFwdGVyIChuYXRpdmUtd2VicnRjKVxuICogRm9yIHVzZSB3aXRoIHV3cy1zZXJ2ZXIuanNcbiAqIG5ldHdvcmtlZC1zY2VuZTogc2VydmVyVVJMIG5lZWRzIHRvIGJlIHdzOi8vbG9jYWxob3N0OjgwODAgd2hlbiBydW5uaW5nIGxvY2FsbHlcbiAqL1xuY2xhc3MgTmF0aXZlV2ViUnRjQWRhcHRlciB7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIGlmIChpbyA9PT0gdW5kZWZpbmVkKVxuICAgICAgY29uc29sZS53YXJuKCdJdCBsb29rcyBsaWtlIHNvY2tldC5pbyBoYXMgbm90IGJlZW4gbG9hZGVkIGJlZm9yZSBOYXRpdmVXZWJSdGNBZGFwdGVyLiBQbGVhc2UgZG8gdGhhdC4nKVxuXG4gICAgdGhpcy5hcHAgPSBcImRlZmF1bHRcIjtcbiAgICB0aGlzLnJvb20gPSBcImRlZmF1bHRcIjtcbiAgICB0aGlzLm9jY3VwYW50TGlzdGVuZXIgPSBudWxsO1xuICAgIHRoaXMubXlSb29tSm9pblRpbWUgPSBudWxsO1xuICAgIHRoaXMubXlJZCA9IG51bGw7XG4gICAgdGhpcy5hdmdUaW1lT2Zmc2V0ID0gMDtcblxuICAgIHRoaXMucGVlcnMgPSB7fTsgLy8gaWQgLT4gV2ViUnRjUGVlclxuICAgIHRoaXMub2NjdXBhbnRzID0ge307IC8vIGlkIC0+IGpvaW5UaW1lc3RhbXBcblxuICAgIHRoaXMuYXVkaW9TdHJlYW1zID0ge307XG4gICAgdGhpcy5wZW5kaW5nQXVkaW9SZXF1ZXN0ID0ge307XG5cbiAgICB0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cyA9IDA7XG4gICAgdGhpcy50aW1lT2Zmc2V0cyA9IFtdO1xuICAgIHRoaXMuYXZnVGltZU9mZnNldCA9IDA7XG4gIH1cblxuICBzZXRTZXJ2ZXJVcmwod3NVcmwpIHtcbiAgICB0aGlzLndzVXJsID0gd3NVcmw7XG4gIH1cblxuICBzZXRBcHAoYXBwTmFtZSkge1xuICAgIHRoaXMuYXBwID0gYXBwTmFtZTtcbiAgfVxuXG4gIHNldFJvb20ocm9vbU5hbWUpIHtcbiAgICB0aGlzLnJvb20gPSByb29tTmFtZTtcbiAgfVxuXG4gIHNldFdlYlJ0Y09wdGlvbnMob3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLmRhdGFjaGFubmVsID09PSBmYWxzZSkge1xuICAgICAgTkFGLmxvZy5lcnJvcihcbiAgICAgICAgXCJOYXRpdmVXZWJSdGNBZGFwdGVyLnNldFdlYlJ0Y09wdGlvbnM6IGRhdGFjaGFubmVsIG11c3QgYmUgdHJ1ZS5cIlxuICAgICAgKTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMuYXVkaW8gPT09IHRydWUpIHtcbiAgICAgIHRoaXMuc2VuZEF1ZGlvID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKG9wdGlvbnMudmlkZW8gPT09IHRydWUpIHtcbiAgICAgIE5BRi5sb2cud2FybihcIk5hdGl2ZVdlYlJ0Y0FkYXB0ZXIgZG9lcyBub3Qgc3VwcG9ydCB2aWRlbyB5ZXQuXCIpO1xuICAgIH1cbiAgfVxuXG4gIHNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMoc3VjY2Vzc0xpc3RlbmVyLCBmYWlsdXJlTGlzdGVuZXIpIHtcbiAgICB0aGlzLmNvbm5lY3RTdWNjZXNzID0gc3VjY2Vzc0xpc3RlbmVyO1xuICAgIHRoaXMuY29ubmVjdEZhaWx1cmUgPSBmYWlsdXJlTGlzdGVuZXI7XG4gIH1cblxuICBzZXRSb29tT2NjdXBhbnRMaXN0ZW5lcihvY2N1cGFudExpc3RlbmVyKSB7XG4gICAgdGhpcy5vY2N1cGFudExpc3RlbmVyID0gb2NjdXBhbnRMaXN0ZW5lcjtcbiAgfVxuXG4gIHNldERhdGFDaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lcikge1xuICAgIHRoaXMub3Blbkxpc3RlbmVyID0gb3Blbkxpc3RlbmVyO1xuICAgIHRoaXMuY2xvc2VkTGlzdGVuZXIgPSBjbG9zZWRMaXN0ZW5lcjtcbiAgICB0aGlzLm1lc3NhZ2VMaXN0ZW5lciA9IG1lc3NhZ2VMaXN0ZW5lcjtcbiAgfVxuXG4gIGNvbm5lY3QoKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGlmICghc2VsZi53c1VybCB8fCBzZWxmLndzVXJsID09PSBcIi9cIikge1xuICAgICAgICBpZiAobG9jYXRpb24ucHJvdG9jb2wgPT09IFwiaHR0cHM6XCIpIHtcbiAgICAgICAgICBzZWxmLndzVXJsID0gXCJ3c3M6Ly9cIiArIGxvY2F0aW9uLmhvc3Q7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VsZi53c1VybCA9IFwid3M6Ly9cIiArIGxvY2F0aW9uLmhvc3Q7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgXG4gICAgICBOQUYubG9nLndyaXRlKFwiQXR0ZW1wdGluZyB0byBjb25uZWN0IHRvIHNvY2tldC5pb1wiKTtcbiAgICAgIGNvbnN0IHNvY2tldCA9IHNlbGYuc29ja2V0ID0gaW8oc2VsZi53c1VybCk7XG4gIFxuICAgICAgc29ja2V0Lm9uKFwiY29ubmVjdFwiLCAoKSA9PiB7XG4gICAgICAgIE5BRi5sb2cud3JpdGUoXCJVc2VyIGNvbm5lY3RlZFwiLCBzb2NrZXQuaWQpO1xuICAgICAgICBzZWxmLm15SWQgPSBzb2NrZXQuaWQ7XG4gICAgICAgIHNlbGYuam9pblJvb20oKTtcbiAgICAgIH0pO1xuICBcbiAgICAgIHNvY2tldC5vbihcImNvbm5lY3RTdWNjZXNzXCIsIChkYXRhKSA9PiB7XG4gICAgICAgIGNvbnN0IHsgam9pbmVkVGltZSB9ID0gZGF0YTtcbiAgXG4gICAgICAgIHNlbGYubXlSb29tSm9pblRpbWUgPSBqb2luZWRUaW1lO1xuICAgICAgICBOQUYubG9nLndyaXRlKFwiU3VjY2Vzc2Z1bGx5IGpvaW5lZCByb29tXCIsIHNlbGYucm9vbSwgXCJhdCBzZXJ2ZXIgdGltZVwiLCBqb2luZWRUaW1lKTtcbiAgXG4gICAgICAgIGlmIChzZWxmLnNlbmRBdWRpbykge1xuICAgICAgICAgIGNvbnN0IG1lZGlhQ29uc3RyYWludHMgPSB7XG4gICAgICAgICAgICBhdWRpbzogdHJ1ZSxcbiAgICAgICAgICAgIHZpZGVvOiBmYWxzZVxuICAgICAgICAgIH07XG4gICAgICAgICAgbmF2aWdhdG9yLm1lZGlhRGV2aWNlcy5nZXRVc2VyTWVkaWEobWVkaWFDb25zdHJhaW50cylcbiAgICAgICAgICAudGhlbihsb2NhbFN0cmVhbSA9PiB7XG4gICAgICAgICAgICBzZWxmLnN0b3JlQXVkaW9TdHJlYW0oc2VsZi5teUlkLCBsb2NhbFN0cmVhbSk7XG4gICAgICAgICAgICBzZWxmLmNvbm5lY3RTdWNjZXNzKHNlbGYubXlJZCk7XG4gICAgICAgICAgfSlcbiAgICAgICAgICAuY2F0Y2goZSA9PiBOQUYubG9nLmVycm9yKGUpKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLmNvbm5lY3RTdWNjZXNzKHNlbGYubXlJZCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuICBcbiAgICAgIHNvY2tldC5vbihcImVycm9yXCIsIGVyciA9PiB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJTb2NrZXQgY29ubmVjdGlvbiBmYWlsdXJlXCIsIGVycik7XG4gICAgICAgIHNlbGYuY29ubmVjdEZhaWx1cmUoKTtcbiAgICAgIH0pO1xuICBcbiAgICAgIHNvY2tldC5vbihcIm9jY3VwYW50c0NoYW5nZWRcIiwgZGF0YSA9PiB7XG4gICAgICAgIGNvbnN0IHsgb2NjdXBhbnRzIH0gPSBkYXRhO1xuICAgICAgICBOQUYubG9nLndyaXRlKCdvY2N1cGFudHMgY2hhbmdlZCcsIGRhdGEpO1xuICAgICAgICBzZWxmLnJlY2VpdmVkT2NjdXBhbnRzKG9jY3VwYW50cyk7XG4gICAgICB9KTtcbiAgXG4gICAgICBmdW5jdGlvbiByZWNlaXZlRGF0YShwYWNrZXQpIHtcbiAgICAgICAgY29uc3QgZnJvbSA9IHBhY2tldC5mcm9tO1xuICAgICAgICBjb25zdCB0eXBlID0gcGFja2V0LnR5cGU7XG4gICAgICAgIGNvbnN0IGRhdGEgPSBwYWNrZXQuZGF0YTtcbiAgICAgICAgaWYgKHR5cGUgPT09ICdpY2UtY2FuZGlkYXRlJykge1xuICAgICAgICAgIHNlbGYucGVlcnNbZnJvbV0uaGFuZGxlU2lnbmFsKGRhdGEpO1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICBzZWxmLm1lc3NhZ2VMaXN0ZW5lcihmcm9tLCB0eXBlLCBkYXRhKTtcbiAgICAgIH1cbiAgXG4gICAgICBzb2NrZXQub24oXCJzZW5kXCIsIHJlY2VpdmVEYXRhKTtcbiAgICAgIHNvY2tldC5vbihcImJyb2FkY2FzdFwiLCByZWNlaXZlRGF0YSk7XG4gICAgfSlcblxuXG4gIH1cblxuICBqb2luUm9vbSgpIHtcbiAgICBOQUYubG9nLndyaXRlKFwiSm9pbmluZyByb29tXCIsIHRoaXMucm9vbSk7XG4gICAgdGhpcy5zb2NrZXQuZW1pdChcImpvaW5Sb29tXCIsIHsgcm9vbTogdGhpcy5yb29tIH0pO1xuICB9XG5cbiAgcmVjZWl2ZWRPY2N1cGFudHMob2NjdXBhbnRzKSB7XG4gICAgZGVsZXRlIG9jY3VwYW50c1t0aGlzLm15SWRdO1xuXG4gICAgdGhpcy5vY2N1cGFudHMgPSBvY2N1cGFudHM7XG5cbiAgICBOQUYubG9nLndyaXRlKCdvY2N1cGFudHM9Jywgb2NjdXBhbnRzKTtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcbiAgICBjb25zdCBsb2NhbElkID0gdGhpcy5teUlkO1xuXG4gICAgZm9yICh2YXIga2V5IGluIG9jY3VwYW50cykge1xuICAgICAgY29uc3QgcmVtb3RlSWQgPSBrZXk7XG4gICAgICBpZiAodGhpcy5wZWVyc1tyZW1vdGVJZF0pIGNvbnRpbnVlO1xuXG4gICAgICBjb25zdCBwZWVyID0gbmV3IFdlYlJ0Y1BlZXIoXG4gICAgICAgIGxvY2FsSWQsXG4gICAgICAgIHJlbW90ZUlkLFxuICAgICAgICAoZGF0YSkgPT4ge1xuICAgICAgICAgIHNlbGYuc29ja2V0LmVtaXQoJ3NlbmQnLHtcbiAgICAgICAgICAgIGZyb206IGxvY2FsSWQsXG4gICAgICAgICAgICB0bzogcmVtb3RlSWQsXG4gICAgICAgICAgICB0eXBlOiAnaWNlLWNhbmRpZGF0ZScsXG4gICAgICAgICAgICBkYXRhLFxuICAgICAgICAgICAgc2VuZGluZzogdHJ1ZSxcbiAgICAgICAgICB9KTtcbiAgICAgICAgfVxuICAgICAgKTtcbiAgICAgIHBlZXIuc2V0RGF0YWNoYW5uZWxMaXN0ZW5lcnMoXG4gICAgICAgIHNlbGYub3Blbkxpc3RlbmVyLFxuICAgICAgICBzZWxmLmNsb3NlZExpc3RlbmVyLFxuICAgICAgICBzZWxmLm1lc3NhZ2VMaXN0ZW5lcixcbiAgICAgICAgc2VsZi50cmFja0xpc3RlbmVyLmJpbmQoc2VsZilcbiAgICAgICk7XG5cbiAgICAgIHNlbGYucGVlcnNbcmVtb3RlSWRdID0gcGVlcjtcbiAgICB9XG5cbiAgICB0aGlzLm9jY3VwYW50TGlzdGVuZXIob2NjdXBhbnRzKTtcbiAgfVxuXG4gIHNob3VsZFN0YXJ0Q29ubmVjdGlvblRvKGNsaWVudCkge1xuICAgIHJldHVybiAodGhpcy5teVJvb21Kb2luVGltZSB8fCAwKSA8PSAoY2xpZW50IHx8IDApO1xuICB9XG5cbiAgc3RhcnRTdHJlYW1Db25uZWN0aW9uKHJlbW90ZUlkKSB7XG4gICAgTkFGLmxvZy53cml0ZSgnc3RhcnRpbmcgb2ZmZXIgcHJvY2VzcycpO1xuXG4gICAgaWYgKHRoaXMuc2VuZEF1ZGlvKSB7XG4gICAgICB0aGlzLmdldE1lZGlhU3RyZWFtKHRoaXMubXlJZClcbiAgICAgIC50aGVuKHN0cmVhbSA9PiB7XG4gICAgICAgIGNvbnN0IG9wdGlvbnMgPSB7XG4gICAgICAgICAgc2VuZEF1ZGlvOiB0cnVlLFxuICAgICAgICAgIGxvY2FsQXVkaW9TdHJlYW06IHN0cmVhbSxcbiAgICAgICAgfTtcbiAgICAgICAgdGhpcy5wZWVyc1tyZW1vdGVJZF0ub2ZmZXIob3B0aW9ucyk7XG4gICAgICB9KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhpcy5wZWVyc1tyZW1vdGVJZF0ub2ZmZXIoe30pO1xuICAgIH1cbiAgfVxuXG4gIGNsb3NlU3RyZWFtQ29ubmVjdGlvbihjbGllbnRJZCkge1xuICAgIE5BRi5sb2cud3JpdGUoJ2Nsb3NlU3RyZWFtQ29ubmVjdGlvbicsIGNsaWVudElkLCB0aGlzLnBlZXJzKTtcbiAgICB0aGlzLnBlZXJzW2NsaWVudElkXS5jbG9zZSgpO1xuICAgIGRlbGV0ZSB0aGlzLnBlZXJzW2NsaWVudElkXTtcbiAgICBkZWxldGUgdGhpcy5vY2N1cGFudHNbY2xpZW50SWRdO1xuICAgIHRoaXMuY2xvc2VkTGlzdGVuZXIoY2xpZW50SWQpO1xuICB9XG5cbiAgZ2V0Q29ubmVjdFN0YXR1cyhjbGllbnRJZCkge1xuICAgIGNvbnN0IHBlZXIgPSB0aGlzLnBlZXJzW2NsaWVudElkXTtcblxuICAgIGlmIChwZWVyID09PSB1bmRlZmluZWQpIHJldHVybiBOQUYuYWRhcHRlcnMuTk9UX0NPTk5FQ1RFRDtcblxuICAgIHN3aXRjaCAocGVlci5nZXRTdGF0dXMoKSkge1xuICAgICAgY2FzZSBXZWJSdGNQZWVyLklTX0NPTk5FQ1RFRDpcbiAgICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5JU19DT05ORUNURUQ7XG5cbiAgICAgIGNhc2UgV2ViUnRjUGVlci5DT05ORUNUSU5HOlxuICAgICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLkNPTk5FQ1RJTkc7XG5cbiAgICAgIGNhc2UgV2ViUnRjUGVlci5OT1RfQ09OTkVDVEVEOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5OT1RfQ09OTkVDVEVEO1xuICAgIH1cbiAgfVxuXG4gIHNlbmREYXRhKHRvLCB0eXBlLCBkYXRhKSB7XG4gICAgdGhpcy5wZWVyc1t0b10uc2VuZCh0eXBlLCBkYXRhKTtcbiAgfVxuXG4gIHNlbmREYXRhR3VhcmFudGVlZCh0bywgdHlwZSwgZGF0YSkge1xuICAgIGNvbnN0IHBhY2tldCA9IHtcbiAgICAgIGZyb206IHRoaXMubXlJZCxcbiAgICAgIHRvLFxuICAgICAgdHlwZSxcbiAgICAgIGRhdGEsXG4gICAgICBzZW5kaW5nOiB0cnVlLFxuICAgIH07XG5cbiAgICB0aGlzLnNvY2tldC5lbWl0KFwic2VuZFwiLCBwYWNrZXQpO1xuICB9XG5cbiAgYnJvYWRjYXN0RGF0YSh0eXBlLCBkYXRhKSB7XG4gICAgZm9yICh2YXIgY2xpZW50SWQgaW4gdGhpcy5wZWVycykge1xuICAgICAgdGhpcy5zZW5kRGF0YShjbGllbnRJZCwgdHlwZSwgZGF0YSk7XG4gICAgfVxuICB9XG5cbiAgYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQodHlwZSwgZGF0YSkge1xuICAgIGNvbnN0IHBhY2tldCA9IHtcbiAgICAgIGZyb206IHRoaXMubXlJZCxcbiAgICAgIHR5cGUsXG4gICAgICBkYXRhLFxuICAgICAgYnJvYWRjYXN0aW5nOiB0cnVlXG4gICAgfTtcbiAgICB0aGlzLnNvY2tldC5lbWl0KFwiYnJvYWRjYXN0XCIsIHBhY2tldCk7XG4gIH1cblxuICBzdG9yZUF1ZGlvU3RyZWFtKGNsaWVudElkLCBzdHJlYW0pIHtcbiAgICB0aGlzLmF1ZGlvU3RyZWFtc1tjbGllbnRJZF0gPSBzdHJlYW07XG4gICAgaWYgKHRoaXMucGVuZGluZ0F1ZGlvUmVxdWVzdFtjbGllbnRJZF0pIHtcbiAgICAgIE5BRi5sb2cud3JpdGUoXCJSZWNlaXZlZCBwZW5kaW5nIGF1ZGlvIGZvciBcIiArIGNsaWVudElkKTtcbiAgICAgIHRoaXMucGVuZGluZ0F1ZGlvUmVxdWVzdFtjbGllbnRJZF0oc3RyZWFtKTtcbiAgICAgIGRlbGV0ZSB0aGlzLnBlbmRpbmdBdWRpb1JlcXVlc3RbY2xpZW50SWRdKHN0cmVhbSk7XG4gICAgfVxuICB9XG5cbiAgdHJhY2tMaXN0ZW5lcihjbGllbnRJZCwgc3RyZWFtKSB7XG4gICAgdGhpcy5zdG9yZUF1ZGlvU3RyZWFtKGNsaWVudElkLCBzdHJlYW0pO1xuICB9XG5cbiAgZ2V0TWVkaWFTdHJlYW0oY2xpZW50SWQpIHtcbiAgICB2YXIgdGhhdCA9IHRoaXM7XG4gICAgaWYgKHRoaXMuYXVkaW9TdHJlYW1zW2NsaWVudElkXSkge1xuICAgICAgTkFGLmxvZy53cml0ZShcIkFscmVhZHkgaGFkIGF1ZGlvIGZvciBcIiArIGNsaWVudElkKTtcbiAgICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUodGhpcy5hdWRpb1N0cmVhbXNbY2xpZW50SWRdKTtcbiAgICB9IGVsc2Uge1xuICAgICAgTkFGLmxvZy53cml0ZShcIldhaXRpbmcgb24gYXVkaW8gZm9yIFwiICsgY2xpZW50SWQpO1xuICAgICAgcmV0dXJuIG5ldyBQcm9taXNlKHJlc29sdmUgPT4ge1xuICAgICAgICB0aGF0LnBlbmRpbmdBdWRpb1JlcXVlc3RbY2xpZW50SWRdID0gcmVzb2x2ZTtcbiAgICAgIH0pO1xuICAgIH1cbiAgfVxuXG4gIHVwZGF0ZVRpbWVPZmZzZXQoKSB7XG4gICAgY29uc3QgY2xpZW50U2VudFRpbWUgPSBEYXRlLm5vdygpICsgdGhpcy5hdmdUaW1lT2Zmc2V0O1xuXG4gICAgcmV0dXJuIGZldGNoKGRvY3VtZW50LmxvY2F0aW9uLmhyZWYsIHsgbWV0aG9kOiBcIkhFQURcIiwgY2FjaGU6IFwibm8tY2FjaGVcIiB9KVxuICAgICAgLnRoZW4ocmVzID0+IHtcbiAgICAgICAgdmFyIHByZWNpc2lvbiA9IDEwMDA7XG4gICAgICAgIHZhciBzZXJ2ZXJSZWNlaXZlZFRpbWUgPSBuZXcgRGF0ZShyZXMuaGVhZGVycy5nZXQoXCJEYXRlXCIpKS5nZXRUaW1lKCkgKyAocHJlY2lzaW9uIC8gMik7XG4gICAgICAgIHZhciBjbGllbnRSZWNlaXZlZFRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICB2YXIgc2VydmVyVGltZSA9IHNlcnZlclJlY2VpdmVkVGltZSArICgoY2xpZW50UmVjZWl2ZWRUaW1lIC0gY2xpZW50U2VudFRpbWUpIC8gMik7XG4gICAgICAgIHZhciB0aW1lT2Zmc2V0ID0gc2VydmVyVGltZSAtIGNsaWVudFJlY2VpdmVkVGltZTtcblxuICAgICAgICB0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cysrO1xuXG4gICAgICAgIGlmICh0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cyA8PSAxMCkge1xuICAgICAgICAgIHRoaXMudGltZU9mZnNldHMucHVzaCh0aW1lT2Zmc2V0KTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnRpbWVPZmZzZXRzW3RoaXMuc2VydmVyVGltZVJlcXVlc3RzICUgMTBdID0gdGltZU9mZnNldDtcbiAgICAgICAgfVxuXG4gICAgICAgIHRoaXMuYXZnVGltZU9mZnNldCA9IHRoaXMudGltZU9mZnNldHMucmVkdWNlKChhY2MsIG9mZnNldCkgPT4gYWNjICs9IG9mZnNldCwgMCkgLyB0aGlzLnRpbWVPZmZzZXRzLmxlbmd0aDtcblxuICAgICAgICBpZiAodGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgPiAxMCkge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4gdGhpcy51cGRhdGVUaW1lT2Zmc2V0KCksIDUgKiA2MCAqIDEwMDApOyAvLyBTeW5jIGNsb2NrIGV2ZXJ5IDUgbWludXRlcy5cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIH1cblxuICBnZXRTZXJ2ZXJUaW1lKCkge1xuICAgIHJldHVybiAtMTsgLy8gVE9ETyBpbXBsZW1lbnRcbiAgfVxufVxuXG5OQUYuYWRhcHRlcnMucmVnaXN0ZXIoXCJuYXRpdmUtd2VicnRjXCIsIE5hdGl2ZVdlYlJ0Y0FkYXB0ZXIpO1xuXG5tb2R1bGUuZXhwb3J0cyA9IE5hdGl2ZVdlYlJ0Y0FkYXB0ZXI7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvaW5kZXguanMiLCJjbGFzcyBXZWJSdGNQZWVyIHtcbiAgY29uc3RydWN0b3IobG9jYWxJZCwgcmVtb3RlSWQsIHNlbmRTaWduYWxGdW5jKSB7XG4gICAgdGhpcy5sb2NhbElkID0gbG9jYWxJZDtcbiAgICB0aGlzLnJlbW90ZUlkID0gcmVtb3RlSWQ7XG4gICAgdGhpcy5zZW5kU2lnbmFsRnVuYyA9IHNlbmRTaWduYWxGdW5jO1xuICAgIHRoaXMub3BlbiA9IGZhbHNlO1xuICAgIHRoaXMuY2hhbm5lbExhYmVsID0gXCJuZXR3b3JrZWQtYWZyYW1lLWNoYW5uZWxcIjtcblxuICAgIHRoaXMucGMgPSB0aGlzLmNyZWF0ZVBlZXJDb25uZWN0aW9uKCk7XG4gICAgdGhpcy5jaGFubmVsID0gbnVsbDtcbiAgfVxuXG4gIHNldERhdGFjaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lciwgdHJhY2tMaXN0ZW5lcikge1xuICAgIHRoaXMub3Blbkxpc3RlbmVyID0gb3Blbkxpc3RlbmVyO1xuICAgIHRoaXMuY2xvc2VkTGlzdGVuZXIgPSBjbG9zZWRMaXN0ZW5lcjtcbiAgICB0aGlzLm1lc3NhZ2VMaXN0ZW5lciA9IG1lc3NhZ2VMaXN0ZW5lcjtcbiAgICB0aGlzLnRyYWNrTGlzdGVuZXIgPSB0cmFja0xpc3RlbmVyO1xuICB9XG5cbiAgb2ZmZXIob3B0aW9ucykge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAvLyByZWxpYWJsZTogZmFsc2UgLSBVRFBcbiAgICB0aGlzLnNldHVwQ2hhbm5lbChcbiAgICAgIHRoaXMucGMuY3JlYXRlRGF0YUNoYW5uZWwodGhpcy5jaGFubmVsTGFiZWwsIHsgcmVsaWFibGU6IGZhbHNlIH0pXG4gICAgKTtcblxuICAgIC8vIElmIHRoZXJlIGFyZSBlcnJvcnMgd2l0aCBTYWZhcmkgaW1wbGVtZW50IHRoaXM6XG4gICAgLy8gaHR0cHM6Ly9naXRodWIuY29tL09wZW5WaWR1L29wZW52aWR1L2Jsb2IvbWFzdGVyL29wZW52aWR1LWJyb3dzZXIvc3JjL09wZW5WaWR1SW50ZXJuYWwvV2ViUnRjUGVlci9XZWJSdGNQZWVyLnRzI0wxNTRcbiAgICBcbiAgICBpZiAob3B0aW9ucy5zZW5kQXVkaW8pIHtcbiAgICAgIG9wdGlvbnMubG9jYWxBdWRpb1N0cmVhbS5nZXRUcmFja3MoKS5mb3JFYWNoKFxuICAgICAgICB0cmFjayA9PiBzZWxmLnBjLmFkZFRyYWNrKHRyYWNrLCBvcHRpb25zLmxvY2FsQXVkaW9TdHJlYW0pKTtcbiAgICB9XG5cbiAgICB0aGlzLnBjLmNyZWF0ZU9mZmVyKFxuICAgICAgc2RwID0+IHtcbiAgICAgICAgc2VsZi5oYW5kbGVTZXNzaW9uRGVzY3JpcHRpb24oc2RwKTtcbiAgICAgIH0sXG4gICAgICBlcnJvciA9PiB7XG4gICAgICAgIE5BRi5sb2cuZXJyb3IoXCJXZWJSdGNQZWVyLm9mZmVyOiBcIiArIGVycm9yKTtcbiAgICAgIH0sXG4gICAgICB7XG4gICAgICAgIG9mZmVyVG9SZWNlaXZlQXVkaW86IHRydWUsXG4gICAgICAgIG9mZmVyVG9SZWNlaXZlVmlkZW86IGZhbHNlLFxuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBoYW5kbGVTaWduYWwoc2lnbmFsKSB7XG4gICAgLy8gaWdub3JlcyBzaWduYWwgaWYgaXQgaXNuJ3QgZm9yIG1lXG4gICAgaWYgKHRoaXMubG9jYWxJZCAhPT0gc2lnbmFsLnRvIHx8IHRoaXMucmVtb3RlSWQgIT09IHNpZ25hbC5mcm9tKSByZXR1cm47XG5cbiAgICBzd2l0Y2ggKHNpZ25hbC50eXBlKSB7XG4gICAgICBjYXNlIFwib2ZmZXJcIjpcbiAgICAgICAgdGhpcy5oYW5kbGVPZmZlcihzaWduYWwpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcImFuc3dlclwiOlxuICAgICAgICB0aGlzLmhhbmRsZUFuc3dlcihzaWduYWwpO1xuICAgICAgICBicmVhaztcblxuICAgICAgY2FzZSBcImNhbmRpZGF0ZVwiOlxuICAgICAgICB0aGlzLmhhbmRsZUNhbmRpZGF0ZShzaWduYWwpO1xuICAgICAgICBicmVhaztcblxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgTkFGLmxvZy5lcnJvcihcbiAgICAgICAgICBcIldlYlJ0Y1BlZXIuaGFuZGxlU2lnbmFsOiBVbmtub3duIHNpZ25hbCB0eXBlIFwiICsgc2lnbmFsLnR5cGVcbiAgICAgICAgKTtcbiAgICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgc2VuZCh0eXBlLCBkYXRhKSB7XG4gICAgaWYgKHRoaXMuY2hhbm5lbCA9PT0gbnVsbCB8fCB0aGlzLmNoYW5uZWwucmVhZHlTdGF0ZSAhPT0gXCJvcGVuXCIpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG5cbiAgICB0aGlzLmNoYW5uZWwuc2VuZChKU09OLnN0cmluZ2lmeSh7IHR5cGU6IHR5cGUsIGRhdGE6IGRhdGEgfSkpO1xuICB9XG5cbiAgZ2V0U3RhdHVzKCkge1xuICAgIGlmICh0aGlzLmNoYW5uZWwgPT09IG51bGwpIHJldHVybiBXZWJSdGNQZWVyLk5PVF9DT05ORUNURUQ7XG5cbiAgICBzd2l0Y2ggKHRoaXMuY2hhbm5lbC5yZWFkeVN0YXRlKSB7XG4gICAgICBjYXNlIFwib3BlblwiOlxuICAgICAgICByZXR1cm4gV2ViUnRjUGVlci5JU19DT05ORUNURUQ7XG5cbiAgICAgIGNhc2UgXCJjb25uZWN0aW5nXCI6XG4gICAgICAgIHJldHVybiBXZWJSdGNQZWVyLkNPTk5FQ1RJTkc7XG5cbiAgICAgIGNhc2UgXCJjbG9zaW5nXCI6XG4gICAgICBjYXNlIFwiY2xvc2VkXCI6XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gV2ViUnRjUGVlci5OT1RfQ09OTkVDVEVEO1xuICAgIH1cbiAgfVxuXG4gIC8qXG4gICAqIFByaXZhdGVzXG4gICAqL1xuXG4gIGNyZWF0ZVBlZXJDb25uZWN0aW9uKCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgUlRDUGVlckNvbm5lY3Rpb24gPVxuICAgICAgd2luZG93LlJUQ1BlZXJDb25uZWN0aW9uIHx8XG4gICAgICB3aW5kb3cud2Via2l0UlRDUGVlckNvbm5lY3Rpb24gfHxcbiAgICAgIHdpbmRvdy5tb3pSVENQZWVyQ29ubmVjdGlvbiB8fFxuICAgICAgd2luZG93Lm1zUlRDUGVlckNvbm5lY3Rpb247XG5cbiAgICBpZiAoUlRDUGVlckNvbm5lY3Rpb24gPT09IHVuZGVmaW5lZCkge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFxuICAgICAgICBcIldlYlJ0Y1BlZXIuY3JlYXRlUGVlckNvbm5lY3Rpb246IFRoaXMgYnJvd3NlciBkb2VzIG5vdCBzZWVtIHRvIHN1cHBvcnQgV2ViUlRDLlwiXG4gICAgICApO1xuICAgIH1cblxuICAgIHZhciBwYyA9IG5ldyBSVENQZWVyQ29ubmVjdGlvbih7IGljZVNlcnZlcnM6IFdlYlJ0Y1BlZXIuSUNFX1NFUlZFUlMgfSk7XG5cbiAgICBwYy5vbmljZWNhbmRpZGF0ZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoZXZlbnQuY2FuZGlkYXRlKSB7XG4gICAgICAgIHNlbGYuc2VuZFNpZ25hbEZ1bmMoe1xuICAgICAgICAgIGZyb206IHNlbGYubG9jYWxJZCxcbiAgICAgICAgICB0bzogc2VsZi5yZW1vdGVJZCxcbiAgICAgICAgICB0eXBlOiBcImNhbmRpZGF0ZVwiLFxuICAgICAgICAgIHNkcE1MaW5lSW5kZXg6IGV2ZW50LmNhbmRpZGF0ZS5zZHBNTGluZUluZGV4LFxuICAgICAgICAgIGNhbmRpZGF0ZTogZXZlbnQuY2FuZGlkYXRlLmNhbmRpZGF0ZVxuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgLy8gTm90ZTogc2VlbXMgbGlrZSBjaGFubmVsLm9uY2xvc2UgaGFuZGVyIGlzIHVucmVsaWFibGUgb24gc29tZSBwbGF0Zm9ybXMsXG4gICAgLy8gICAgICAgc28gYWxzbyB0cmllcyB0byBkZXRlY3QgZGlzY29ubmVjdGlvbiBoZXJlLlxuICAgIHBjLm9uaWNlY29ubmVjdGlvbnN0YXRlY2hhbmdlID0gZnVuY3Rpb24oKSB7XG4gICAgICBpZiAoc2VsZi5vcGVuICYmIHBjLmljZUNvbm5lY3Rpb25TdGF0ZSA9PT0gXCJkaXNjb25uZWN0ZWRcIikge1xuICAgICAgICBzZWxmLm9wZW4gPSBmYWxzZTtcbiAgICAgICAgc2VsZi5jbG9zZWRMaXN0ZW5lcihzZWxmLnJlbW90ZUlkKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgcGMub250cmFjayA9IChlKSA9PiB7XG4gICAgICBzZWxmLnRyYWNrTGlzdGVuZXIoc2VsZi5yZW1vdGVJZCwgZS5zdHJlYW1zWzBdKTtcbiAgICB9XG5cbiAgICByZXR1cm4gcGM7XG4gIH1cblxuICBzZXR1cENoYW5uZWwoY2hhbm5lbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMuY2hhbm5lbCA9IGNoYW5uZWw7XG5cbiAgICAvLyByZWNlaXZlZCBkYXRhIGZyb20gYSByZW1vdGUgcGVlclxuICAgIHRoaXMuY2hhbm5lbC5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuICAgICAgc2VsZi5tZXNzYWdlTGlzdGVuZXIoc2VsZi5yZW1vdGVJZCwgZGF0YS50eXBlLCBkYXRhLmRhdGEpO1xuICAgIH07XG5cbiAgICAvLyBjb25uZWN0ZWQgd2l0aCBhIHJlbW90ZSBwZWVyXG4gICAgdGhpcy5jaGFubmVsLm9ub3BlbiA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBzZWxmLm9wZW4gPSB0cnVlO1xuICAgICAgc2VsZi5vcGVuTGlzdGVuZXIoc2VsZi5yZW1vdGVJZCk7XG4gICAgfTtcblxuICAgIC8vIGRpc2Nvbm5lY3RlZCB3aXRoIGEgcmVtb3RlIHBlZXJcbiAgICB0aGlzLmNoYW5uZWwub25jbG9zZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoIXNlbGYub3BlbikgcmV0dXJuO1xuICAgICAgc2VsZi5vcGVuID0gZmFsc2U7XG4gICAgICBzZWxmLmNsb3NlZExpc3RlbmVyKHNlbGYucmVtb3RlSWQpO1xuICAgIH07XG5cbiAgICAvLyBlcnJvciBvY2N1cnJlZCB3aXRoIGEgcmVtb3RlIHBlZXJcbiAgICB0aGlzLmNoYW5uZWwub25lcnJvciA9IGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICBOQUYubG9nLmVycm9yKFwiV2ViUnRjUGVlci5jaGFubmVsLm9uZXJyb3I6IFwiICsgZXJyb3IpO1xuICAgIH07XG4gIH1cblxuICBoYW5kbGVPZmZlcihtZXNzYWdlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5wYy5vbmRhdGFjaGFubmVsID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHNlbGYuc2V0dXBDaGFubmVsKGV2ZW50LmNoYW5uZWwpO1xuICAgIH07XG5cbiAgICB0aGlzLnNldFJlbW90ZURlc2NyaXB0aW9uKG1lc3NhZ2UpO1xuXG4gICAgdGhpcy5wYy5jcmVhdGVBbnN3ZXIoXG4gICAgICBmdW5jdGlvbihzZHApIHtcbiAgICAgICAgc2VsZi5oYW5kbGVTZXNzaW9uRGVzY3JpcHRpb24oc2RwKTtcbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBOQUYubG9nLmVycm9yKFwiV2ViUnRjUGVlci5oYW5kbGVPZmZlcjogXCIgKyBlcnJvcik7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGhhbmRsZUFuc3dlcihtZXNzYWdlKSB7XG4gICAgdGhpcy5zZXRSZW1vdGVEZXNjcmlwdGlvbihtZXNzYWdlKTtcbiAgfVxuXG4gIGhhbmRsZUNhbmRpZGF0ZShtZXNzYWdlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBSVENJY2VDYW5kaWRhdGUgPVxuICAgICAgd2luZG93LlJUQ0ljZUNhbmRpZGF0ZSB8fFxuICAgICAgd2luZG93LndlYmtpdFJUQ0ljZUNhbmRpZGF0ZSB8fFxuICAgICAgd2luZG93Lm1velJUQ0ljZUNhbmRpZGF0ZTtcblxuICAgIHRoaXMucGMuYWRkSWNlQ2FuZGlkYXRlKFxuICAgICAgbmV3IFJUQ0ljZUNhbmRpZGF0ZShtZXNzYWdlKSxcbiAgICAgIGZ1bmN0aW9uKCkge30sXG4gICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBOQUYubG9nLmVycm9yKFwiV2ViUnRjUGVlci5oYW5kbGVDYW5kaWRhdGU6IFwiICsgZXJyb3IpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBoYW5kbGVTZXNzaW9uRGVzY3JpcHRpb24oc2RwKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5wYy5zZXRMb2NhbERlc2NyaXB0aW9uKFxuICAgICAgc2RwLFxuICAgICAgZnVuY3Rpb24oKSB7fSxcbiAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIE5BRi5sb2cuZXJyb3IoXCJXZWJSdGNQZWVyLmhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbjogXCIgKyBlcnJvcik7XG4gICAgICB9XG4gICAgKTtcblxuICAgIHRoaXMuc2VuZFNpZ25hbEZ1bmMoe1xuICAgICAgZnJvbTogdGhpcy5sb2NhbElkLFxuICAgICAgdG86IHRoaXMucmVtb3RlSWQsXG4gICAgICB0eXBlOiBzZHAudHlwZSxcbiAgICAgIHNkcDogc2RwLnNkcFxuICAgIH0pO1xuICB9XG5cbiAgc2V0UmVtb3RlRGVzY3JpcHRpb24obWVzc2FnZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uID1cbiAgICAgIHdpbmRvdy5SVENTZXNzaW9uRGVzY3JpcHRpb24gfHxcbiAgICAgIHdpbmRvdy53ZWJraXRSVENTZXNzaW9uRGVzY3JpcHRpb24gfHxcbiAgICAgIHdpbmRvdy5tb3pSVENTZXNzaW9uRGVzY3JpcHRpb24gfHxcbiAgICAgIHdpbmRvdy5tc1JUQ1Nlc3Npb25EZXNjcmlwdGlvbjtcblxuICAgIHRoaXMucGMuc2V0UmVtb3RlRGVzY3JpcHRpb24oXG4gICAgICBuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKG1lc3NhZ2UpLFxuICAgICAgZnVuY3Rpb24oKSB7fSxcbiAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIE5BRi5sb2cuZXJyb3IoXCJXZWJSdGNQZWVyLnNldFJlbW90ZURlc2NyaXB0aW9uOiBcIiArIGVycm9yKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgY2xvc2UoKSB7XG4gICAgaWYgKHRoaXMucGMpIHtcbiAgICAgIHRoaXMucGMuY2xvc2UoKTtcbiAgICB9XG4gIH1cbn1cblxuV2ViUnRjUGVlci5JU19DT05ORUNURUQgPSBcIklTX0NPTk5FQ1RFRFwiO1xuV2ViUnRjUGVlci5DT05ORUNUSU5HID0gXCJDT05ORUNUSU5HXCI7XG5XZWJSdGNQZWVyLk5PVF9DT05ORUNURUQgPSBcIk5PVF9DT05ORUNURURcIjtcblxuV2ViUnRjUGVlci5JQ0VfU0VSVkVSUyA9IFtcbiAgeyB1cmxzOiBcInN0dW46c3R1bjEubC5nb29nbGUuY29tOjE5MzAyXCIgfSxcbiAgeyB1cmxzOiBcInN0dW46c3R1bjIubC5nb29nbGUuY29tOjE5MzAyXCIgfSxcbiAgeyB1cmxzOiBcInN0dW46c3R1bjMubC5nb29nbGUuY29tOjE5MzAyXCIgfSxcbiAgeyB1cmxzOiBcInN0dW46c3R1bjQubC5nb29nbGUuY29tOjE5MzAyXCIgfVxuXTtcblxubW9kdWxlLmV4cG9ydHMgPSBXZWJSdGNQZWVyO1xuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9XZWJSdGNQZWVyLmpzIl0sInNvdXJjZVJvb3QiOiIifQ==