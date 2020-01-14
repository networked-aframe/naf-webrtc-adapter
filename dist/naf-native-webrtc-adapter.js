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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgMGU5MWNhOWZiOWU3ZWZmMzQ2NWUiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9XZWJSdGNQZWVyLmpzIl0sIm5hbWVzIjpbIldlYlJ0Y1BlZXIiLCJyZXF1aXJlIiwiTmF0aXZlV2ViUnRjQWRhcHRlciIsImlvIiwidW5kZWZpbmVkIiwiY29uc29sZSIsIndhcm4iLCJhcHAiLCJyb29tIiwib2NjdXBhbnRMaXN0ZW5lciIsIm15Um9vbUpvaW5UaW1lIiwibXlJZCIsImF2Z1RpbWVPZmZzZXQiLCJwZWVycyIsIm9jY3VwYW50cyIsImF1ZGlvU3RyZWFtcyIsInBlbmRpbmdBdWRpb1JlcXVlc3QiLCJzZXJ2ZXJUaW1lUmVxdWVzdHMiLCJ0aW1lT2Zmc2V0cyIsIndzVXJsIiwiYXBwTmFtZSIsInJvb21OYW1lIiwib3B0aW9ucyIsImRhdGFjaGFubmVsIiwiTkFGIiwibG9nIiwiZXJyb3IiLCJhdWRpbyIsInNlbmRBdWRpbyIsInZpZGVvIiwic3VjY2Vzc0xpc3RlbmVyIiwiZmFpbHVyZUxpc3RlbmVyIiwiY29ubmVjdFN1Y2Nlc3MiLCJjb25uZWN0RmFpbHVyZSIsIm9wZW5MaXN0ZW5lciIsImNsb3NlZExpc3RlbmVyIiwibWVzc2FnZUxpc3RlbmVyIiwic2VsZiIsInVwZGF0ZVRpbWVPZmZzZXQiLCJ0aGVuIiwibG9jYXRpb24iLCJwcm90b2NvbCIsImhvc3QiLCJ3cml0ZSIsInNvY2tldCIsIm9uIiwiaWQiLCJqb2luUm9vbSIsImRhdGEiLCJqb2luZWRUaW1lIiwibWVkaWFDb25zdHJhaW50cyIsIm5hdmlnYXRvciIsIm1lZGlhRGV2aWNlcyIsImdldFVzZXJNZWRpYSIsInN0b3JlQXVkaW9TdHJlYW0iLCJsb2NhbFN0cmVhbSIsImNhdGNoIiwiZSIsImVyciIsInJlY2VpdmVkT2NjdXBhbnRzIiwicmVjZWl2ZURhdGEiLCJwYWNrZXQiLCJmcm9tIiwidHlwZSIsImhhbmRsZVNpZ25hbCIsImVtaXQiLCJsb2NhbElkIiwicmVtb3RlSWQiLCJrZXkiLCJwZWVyIiwidG8iLCJzZW5kaW5nIiwic2V0RGF0YWNoYW5uZWxMaXN0ZW5lcnMiLCJ0cmFja0xpc3RlbmVyIiwiYmluZCIsImNsaWVudCIsImdldE1lZGlhU3RyZWFtIiwibG9jYWxBdWRpb1N0cmVhbSIsInN0cmVhbSIsIm9mZmVyIiwiY2xpZW50SWQiLCJjbG9zZSIsImFkYXB0ZXJzIiwiTk9UX0NPTk5FQ1RFRCIsImdldFN0YXR1cyIsIklTX0NPTk5FQ1RFRCIsIkNPTk5FQ1RJTkciLCJzZW5kIiwic2VuZERhdGEiLCJicm9hZGNhc3RpbmciLCJ0aGF0IiwiUHJvbWlzZSIsInJlc29sdmUiLCJjbGllbnRTZW50VGltZSIsIkRhdGUiLCJub3ciLCJmZXRjaCIsImRvY3VtZW50IiwiaHJlZiIsIm1ldGhvZCIsImNhY2hlIiwicHJlY2lzaW9uIiwic2VydmVyUmVjZWl2ZWRUaW1lIiwicmVzIiwiaGVhZGVycyIsImdldCIsImdldFRpbWUiLCJjbGllbnRSZWNlaXZlZFRpbWUiLCJzZXJ2ZXJUaW1lIiwidGltZU9mZnNldCIsInB1c2giLCJyZWR1Y2UiLCJhY2MiLCJvZmZzZXQiLCJsZW5ndGgiLCJzZXRUaW1lb3V0IiwicmVnaXN0ZXIiLCJtb2R1bGUiLCJleHBvcnRzIiwic2VuZFNpZ25hbEZ1bmMiLCJvcGVuIiwiY2hhbm5lbExhYmVsIiwicGMiLCJjcmVhdGVQZWVyQ29ubmVjdGlvbiIsImNoYW5uZWwiLCJzZXR1cENoYW5uZWwiLCJjcmVhdGVEYXRhQ2hhbm5lbCIsInJlbGlhYmxlIiwiZ2V0VHJhY2tzIiwiZm9yRWFjaCIsImFkZFRyYWNrIiwidHJhY2siLCJjcmVhdGVPZmZlciIsImhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbiIsInNkcCIsIm9mZmVyVG9SZWNlaXZlQXVkaW8iLCJvZmZlclRvUmVjZWl2ZVZpZGVvIiwic2lnbmFsIiwiaGFuZGxlT2ZmZXIiLCJoYW5kbGVBbnN3ZXIiLCJoYW5kbGVDYW5kaWRhdGUiLCJyZWFkeVN0YXRlIiwiSlNPTiIsInN0cmluZ2lmeSIsIlJUQ1BlZXJDb25uZWN0aW9uIiwid2luZG93Iiwid2Via2l0UlRDUGVlckNvbm5lY3Rpb24iLCJtb3pSVENQZWVyQ29ubmVjdGlvbiIsIm1zUlRDUGVlckNvbm5lY3Rpb24iLCJFcnJvciIsImljZVNlcnZlcnMiLCJJQ0VfU0VSVkVSUyIsIm9uaWNlY2FuZGlkYXRlIiwiZXZlbnQiLCJjYW5kaWRhdGUiLCJzZHBNTGluZUluZGV4Iiwib25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2UiLCJpY2VDb25uZWN0aW9uU3RhdGUiLCJvbnRyYWNrIiwic3RyZWFtcyIsIm9ubWVzc2FnZSIsInBhcnNlIiwib25vcGVuIiwib25jbG9zZSIsIm9uZXJyb3IiLCJtZXNzYWdlIiwib25kYXRhY2hhbm5lbCIsInNldFJlbW90ZURlc2NyaXB0aW9uIiwiY3JlYXRlQW5zd2VyIiwiUlRDSWNlQ2FuZGlkYXRlIiwid2Via2l0UlRDSWNlQ2FuZGlkYXRlIiwibW96UlRDSWNlQ2FuZGlkYXRlIiwiYWRkSWNlQ2FuZGlkYXRlIiwic2V0TG9jYWxEZXNjcmlwdGlvbiIsIlJUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsIndlYmtpdFJUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsIm1velJUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsIm1zUlRDU2Vzc2lvbkRlc2NyaXB0aW9uIiwidXJscyJdLCJtYXBwaW5ncyI6IjtBQUFBO0FBQ0E7O0FBRUE7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSxhQUFLO0FBQ0w7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxtQ0FBMkIsMEJBQTBCLEVBQUU7QUFDdkQseUNBQWlDLGVBQWU7QUFDaEQ7QUFDQTtB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Q0FBekI7O0FBT0E3RCxPQUFPQyxPQUFQLEdBQWlCdEgsVUFBakIsQyIsImZpbGUiOiJuYWYtbmF0aXZlLXdlYnJ0Yy1hZGFwdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgMGU5MWNhOWZiOWU3ZWZmMzQ2NWUiLCJjb25zdCBXZWJSdGNQZWVyID0gcmVxdWlyZShcIi4vV2ViUnRjUGVlclwiKTtcblxuLyoqXG4gKiBOYXRpdmUgV2ViUlRDIEFkYXB0ZXIgKG5hdGl2ZS13ZWJydGMpXG4gKiBGb3IgdXNlIHdpdGggdXdzLXNlcnZlci5qc1xuICogbmV0d29ya2VkLXNjZW5lOiBzZXJ2ZXJVUkwgbmVlZHMgdG8gYmUgd3M6Ly9sb2NhbGhvc3Q6ODA4MCB3aGVuIHJ1bm5pbmcgbG9jYWxseVxuICovXG5jbGFzcyBOYXRpdmVXZWJSdGNBZGFwdGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgaWYgKGlvID09PSB1bmRlZmluZWQpXG4gICAgICBjb25zb2xlLndhcm4oJ0l0IGxvb2tzIGxpa2Ugc29ja2V0LmlvIGhhcyBub3QgYmVlbiBsb2FkZWQgYmVmb3JlIE5hdGl2ZVdlYlJ0Y0FkYXB0ZXIuIFBsZWFzZSBkbyB0aGF0LicpXG5cbiAgICB0aGlzLmFwcCA9IFwiZGVmYXVsdFwiO1xuICAgIHRoaXMucm9vbSA9IFwiZGVmYXVsdFwiO1xuICAgIHRoaXMub2NjdXBhbnRMaXN0ZW5lciA9IG51bGw7XG4gICAgdGhpcy5teVJvb21Kb2luVGltZSA9IG51bGw7XG4gICAgdGhpcy5teUlkID0gbnVsbDtcbiAgICB0aGlzLmF2Z1RpbWVPZmZzZXQgPSAwO1xuXG4gICAgdGhpcy5wZWVycyA9IHt9OyAvLyBpZCAtPiBXZWJSdGNQZWVyXG4gICAgdGhpcy5vY2N1cGFudHMgPSB7fTsgLy8gaWQgLT4gam9pblRpbWVzdGFtcFxuXG4gICAgdGhpcy5hdWRpb1N0cmVhbXMgPSB7fTtcbiAgICB0aGlzLnBlbmRpbmdBdWRpb1JlcXVlc3QgPSB7fTtcblxuICAgIHRoaXMuc2VydmVyVGltZVJlcXVlc3RzID0gMDtcbiAgICB0aGlzLnRpbWVPZmZzZXRzID0gW107XG4gICAgdGhpcy5hdmdUaW1lT2Zmc2V0ID0gMDtcbiAgfVxuXG4gIHNldFNlcnZlclVybCh3c1VybCkge1xuICAgIHRoaXMud3NVcmwgPSB3c1VybDtcbiAgfVxuXG4gIHNldEFwcChhcHBOYW1lKSB7XG4gICAgdGhpcy5hcHAgPSBhcHBOYW1lO1xuICB9XG5cbiAgc2V0Um9vbShyb29tTmFtZSkge1xuICAgIHRoaXMucm9vbSA9IHJvb21OYW1lO1xuICB9XG5cbiAgc2V0V2ViUnRjT3B0aW9ucyhvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuZGF0YWNoYW5uZWwgPT09IGZhbHNlKSB7XG4gICAgICBOQUYubG9nLmVycm9yKFxuICAgICAgICBcIk5hdGl2ZVdlYlJ0Y0FkYXB0ZXIuc2V0V2ViUnRjT3B0aW9uczogZGF0YWNoYW5uZWwgbXVzdCBiZSB0cnVlLlwiXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5hdWRpbyA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5zZW5kQXVkaW8gPSB0cnVlO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy52aWRlbyA9PT0gdHJ1ZSkge1xuICAgICAgTkFGLmxvZy53YXJuKFwiTmF0aXZlV2ViUnRjQWRhcHRlciBkb2VzIG5vdCBzdXBwb3J0IHZpZGVvIHlldC5cIik7XG4gICAgfVxuICB9XG5cbiAgc2V0U2VydmVyQ29ubmVjdExpc3RlbmVycyhzdWNjZXNzTGlzdGVuZXIsIGZhaWx1cmVMaXN0ZW5lcikge1xuICAgIHRoaXMuY29ubmVjdFN1Y2Nlc3MgPSBzdWNjZXNzTGlzdGVuZXI7XG4gICAgdGhpcy5jb25uZWN0RmFpbHVyZSA9IGZhaWx1cmVMaXN0ZW5lcjtcbiAgfVxuXG4gIHNldFJvb21PY2N1cGFudExpc3RlbmVyKG9jY3VwYW50TGlzdGVuZXIpIHtcbiAgICB0aGlzLm9jY3VwYW50TGlzdGVuZXIgPSBvY2N1cGFudExpc3RlbmVyO1xuICB9XG5cbiAgc2V0RGF0YUNoYW5uZWxMaXN0ZW5lcnMob3Blbkxpc3RlbmVyLCBjbG9zZWRMaXN0ZW5lciwgbWVzc2FnZUxpc3RlbmVyKSB7XG4gICAgdGhpcy5vcGVuTGlzdGVuZXIgPSBvcGVuTGlzdGVuZXI7XG4gICAgdGhpcy5jbG9zZWRMaXN0ZW5lciA9IGNsb3NlZExpc3RlbmVyO1xuICAgIHRoaXMubWVzc2FnZUxpc3RlbmVyID0gbWVzc2FnZUxpc3RlbmVyO1xuICB9XG5cbiAgY29ubmVjdCgpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIHRoaXMudXBkYXRlVGltZU9mZnNldCgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKCFzZWxmLndzVXJsIHx8IHNlbGYud3NVcmwgPT09IFwiL1wiKSB7XG4gICAgICAgIGlmIChsb2NhdGlvbi5wcm90b2NvbCA9PT0gXCJodHRwczpcIikge1xuICAgICAgICAgIHNlbGYud3NVcmwgPSBcIndzczovL1wiICsgbG9jYXRpb24uaG9zdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLndzVXJsID0gXCJ3czovL1wiICsgbG9jYXRpb24uaG9zdDtcbiAgICAgICAgfVxuICAgICAgfVxuICBcbiAgICAgIE5BRi5sb2cud3JpdGUoXCJBdHRlbXB0aW5nIHRvIGNvbm5lY3QgdG8gc29ja2V0LmlvXCIpO1xuICAgICAgY29uc3Qgc29ja2V0ID0gc2VsZi5zb2NrZXQgPSBpbyhzZWxmLndzVXJsKTtcbiAgXG4gICAgICBzb2NrZXQub24oXCJjb25uZWN0XCIsICgpID0+IHtcbiAgICAgICAgTkFGLmxvZy53cml0ZShcIlVzZXIgY29ubmVjdGVkXCIsIHNvY2tldC5pZCk7XG4gICAgICAgIHNlbGYubXlJZCA9IHNvY2tldC5pZDtcbiAgICAgICAgc2VsZi5qb2luUm9vbSgpO1xuICAgICAgfSk7XG4gIFxuICAgICAgc29ja2V0Lm9uKFwiY29ubmVjdFN1Y2Nlc3NcIiwgKGRhdGEpID0+IHtcbiAgICAgICAgY29uc3QgeyBqb2luZWRUaW1lIH0gPSBkYXRhO1xuICBcbiAgICAgICAgc2VsZi5teVJvb21Kb2luVGltZSA9IGpvaW5lZFRpbWU7XG4gICAgICAgIE5BRi5sb2cud3JpdGUoXCJTdWNjZXNzZnVsbHkgam9pbmVkIHJvb21cIiwgc2VsZi5yb29tLCBcImF0IHNlcnZlciB0aW1lXCIsIGpvaW5lZFRpbWUpO1xuICBcbiAgICAgICAgaWYgKHNlbGYuc2VuZEF1ZGlvKSB7XG4gICAgICAgICAgY29uc3QgbWVkaWFDb25zdHJhaW50cyA9IHtcbiAgICAgICAgICAgIGF1ZGlvOiB0cnVlLFxuICAgICAgICAgICAgdmlkZW86IGZhbHNlXG4gICAgICAgICAgfTtcbiAgICAgICAgICBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYShtZWRpYUNvbnN0cmFpbnRzKVxuICAgICAgICAgIC50aGVuKGxvY2FsU3RyZWFtID0+IHtcbiAgICAgICAgICAgIHNlbGYuc3RvcmVBdWRpb1N0cmVhbShzZWxmLm15SWQsIGxvY2FsU3RyZWFtKTtcbiAgICAgICAgICAgIHNlbGYuY29ubmVjdFN1Y2Nlc3Moc2VsZi5teUlkKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlID0+IE5BRi5sb2cuZXJyb3IoZSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuY29ubmVjdFN1Y2Nlc3Moc2VsZi5teUlkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIFxuICAgICAgc29ja2V0Lm9uKFwiZXJyb3JcIiwgZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlNvY2tldCBjb25uZWN0aW9uIGZhaWx1cmVcIiwgZXJyKTtcbiAgICAgICAgc2VsZi5jb25uZWN0RmFpbHVyZSgpO1xuICAgICAgfSk7XG4gIFxuICAgICAgc29ja2V0Lm9uKFwib2NjdXBhbnRzQ2hhbmdlZFwiLCBkYXRhID0+IHtcbiAgICAgICAgY29uc3QgeyBvY2N1cGFudHMgfSA9IGRhdGE7XG4gICAgICAgIE5BRi5sb2cud3JpdGUoJ29jY3VwYW50cyBjaGFuZ2VkJywgZGF0YSk7XG4gICAgICAgIHNlbGYucmVjZWl2ZWRPY2N1cGFudHMob2NjdXBhbnRzKTtcbiAgICAgIH0pO1xuICBcbiAgICAgIGZ1bmN0aW9uIHJlY2VpdmVEYXRhKHBhY2tldCkge1xuICAgICAgICBjb25zdCBmcm9tID0gcGFja2V0LmZyb207XG4gICAgICAgIGNvbnN0IHR5cGUgPSBwYWNrZXQudHlwZTtcbiAgICAgICAgY29uc3QgZGF0YSA9IHBhY2tldC5kYXRhO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ2ljZS1jYW5kaWRhdGUnKSB7XG4gICAgICAgICAgc2VsZi5wZWVyc1tmcm9tXS5oYW5kbGVTaWduYWwoZGF0YSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHNlbGYubWVzc2FnZUxpc3RlbmVyKGZyb20sIHR5cGUsIGRhdGEpO1xuICAgICAgfVxuICBcbiAgICAgIHNvY2tldC5vbihcInNlbmRcIiwgcmVjZWl2ZURhdGEpO1xuICAgICAgc29ja2V0Lm9uKFwiYnJvYWRjYXN0XCIsIHJlY2VpdmVEYXRhKTtcbiAgICB9KVxuXG5cbiAgfVxuXG4gIGpvaW5Sb29tKCkge1xuICAgIE5BRi5sb2cud3JpdGUoXCJKb2luaW5nIHJvb21cIiwgdGhpcy5yb29tKTtcbiAgICB0aGlzLnNvY2tldC5lbWl0KFwiam9pblJvb21cIiwgeyByb29tOiB0aGlzLnJvb20gfSk7XG4gIH1cblxuICByZWNlaXZlZE9jY3VwYW50cyhvY2N1cGFudHMpIHtcbiAgICBkZWxldGUgb2NjdXBhbnRzW3RoaXMubXlJZF07XG5cbiAgICB0aGlzLm9jY3VwYW50cyA9IG9jY3VwYW50cztcblxuICAgIE5BRi5sb2cud3JpdGUoJ29jY3VwYW50cz0nLCBvY2N1cGFudHMpO1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGNvbnN0IGxvY2FsSWQgPSB0aGlzLm15SWQ7XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gb2NjdXBhbnRzKSB7XG4gICAgICBjb25zdCByZW1vdGVJZCA9IGtleTtcbiAgICAgIGlmICh0aGlzLnBlZXJzW3JlbW90ZUlkXSkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IHBlZXIgPSBuZXcgV2ViUnRjUGVlcihcbiAgICAgICAgbG9jYWxJZCxcbiAgICAgICAgcmVtb3RlSWQsXG4gICAgICAgIChkYXRhKSA9PiB7XG4gICAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgnc2VuZCcse1xuICAgICAgICAgICAgZnJvbTogbG9jYWxJZCxcbiAgICAgICAgICAgIHRvOiByZW1vdGVJZCxcbiAgICAgICAgICAgIHR5cGU6ICdpY2UtY2FuZGlkYXRlJyxcbiAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICBzZW5kaW5nOiB0cnVlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgcGVlci5zZXREYXRhY2hhbm5lbExpc3RlbmVycyhcbiAgICAgICAgc2VsZi5vcGVuTGlzdGVuZXIsXG4gICAgICAgIHNlbGYuY2xvc2VkTGlzdGVuZXIsXG4gICAgICAgIHNlbGYubWVzc2FnZUxpc3RlbmVyLFxuICAgICAgICBzZWxmLnRyYWNrTGlzdGVuZXIuYmluZChzZWxmKVxuICAgICAgKTtcblxuICAgICAgc2VsZi5wZWVyc1tyZW1vdGVJZF0gPSBwZWVyO1xuICAgIH1cblxuICAgIHRoaXMub2NjdXBhbnRMaXN0ZW5lcihvY2N1cGFudHMpO1xuICB9XG5cbiAgc2hvdWxkU3RhcnRDb25uZWN0aW9uVG8oY2xpZW50KSB7XG4gICAgcmV0dXJuICh0aGlzLm15Um9vbUpvaW5UaW1lIHx8IDApIDw9IChjbGllbnQgfHwgMCk7XG4gIH1cblxuICBzdGFydFN0cmVhbUNvbm5lY3Rpb24ocmVtb3RlSWQpIHtcbiAgICBOQUYubG9nLndyaXRlKCdzdGFydGluZyBvZmZlciBwcm9jZXNzJyk7XG5cbiAgICBpZiAodGhpcy5zZW5kQXVkaW8pIHtcbiAgICAgIHRoaXMuZ2V0TWVkaWFTdHJlYW0odGhpcy5teUlkKVxuICAgICAgLnRoZW4oc3RyZWFtID0+IHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICBzZW5kQXVkaW86IHRydWUsXG4gICAgICAgICAgbG9jYWxBdWRpb1N0cmVhbTogc3RyZWFtLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnBlZXJzW3JlbW90ZUlkXS5vZmZlcihvcHRpb25zKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBlZXJzW3JlbW90ZUlkXS5vZmZlcih7fSk7XG4gICAgfVxuICB9XG5cbiAgY2xvc2VTdHJlYW1Db25uZWN0aW9uKGNsaWVudElkKSB7XG4gICAgTkFGLmxvZy53cml0ZSgnY2xvc2VTdHJlYW1Db25uZWN0aW9uJywgY2xpZW50SWQsIHRoaXMucGVlcnMpO1xuICAgIHRoaXMucGVlcnNbY2xpZW50SWRdLmNsb3NlKCk7XG4gICAgZGVsZXRlIHRoaXMucGVlcnNbY2xpZW50SWRdO1xuICAgIGRlbGV0ZSB0aGlzLm9jY3VwYW50c1tjbGllbnRJZF07XG4gICAgdGhpcy5jbG9zZWRMaXN0ZW5lcihjbGllbnRJZCk7XG4gIH1cblxuICBnZXRDb25uZWN0U3RhdHVzKGNsaWVudElkKSB7XG4gICAgY29uc3QgcGVlciA9IHRoaXMucGVlcnNbY2xpZW50SWRdO1xuXG4gICAgaWYgKHBlZXIgPT09IHVuZGVmaW5lZCkgcmV0dXJuIE5BRi5hZGFwdGVycy5OT1RfQ09OTkVDVEVEO1xuXG4gICAgc3dpdGNoIChwZWVyLmdldFN0YXR1cygpKSB7XG4gICAgICBjYXNlIFdlYlJ0Y1BlZXIuSVNfQ09OTkVDVEVEOlxuICAgICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLklTX0NPTk5FQ1RFRDtcblxuICAgICAgY2FzZSBXZWJSdGNQZWVyLkNPTk5FQ1RJTkc6XG4gICAgICAgIHJldHVybiBOQUYuYWRhcHRlcnMuQ09OTkVDVElORztcblxuICAgICAgY2FzZSBXZWJSdGNQZWVyLk5PVF9DT05ORUNURUQ6XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLk5PVF9DT05ORUNURUQ7XG4gICAgfVxuICB9XG5cbiAgc2VuZERhdGEodG8sIHR5cGUsIGRhdGEpIHtcbiAgICB0aGlzLnBlZXJzW3RvXS5zZW5kKHR5cGUsIGRhdGEpO1xuICB9XG5cbiAgc2VuZERhdGFHdWFyYW50ZWVkKHRvLCB0eXBlLCBkYXRhKSB7XG4gICAgY29uc3QgcGFja2V0ID0ge1xuICAgICAgZnJvbTogdGhpcy5teUlkLFxuICAgICAgdG8sXG4gICAgICB0eXBlLFxuICAgICAgZGF0YSxcbiAgICAgIHNlbmRpbmc6IHRydWUsXG4gICAgfTtcblxuICAgIHRoaXMuc29ja2V0LmVtaXQoXCJzZW5kXCIsIHBhY2tldCk7XG4gIH1cblxuICBicm9hZGNhc3REYXRhKHR5cGUsIGRhdGEpIHtcbiAgICBmb3IgKHZhciBjbGllbnRJZCBpbiB0aGlzLnBlZXJzKSB7XG4gICAgICB0aGlzLnNlbmREYXRhKGNsaWVudElkLCB0eXBlLCBkYXRhKTtcbiAgICB9XG4gIH1cblxuICBicm9hZGNhc3REYXRhR3VhcmFudGVlZCh0eXBlLCBkYXRhKSB7XG4gICAgY29uc3QgcGFja2V0ID0ge1xuICAgICAgZnJvbTogdGhpcy5teUlkLFxuICAgICAgdHlwZSxcbiAgICAgIGRhdGEsXG4gICAgICBicm9hZGNhc3Rpbmc6IHRydWVcbiAgICB9O1xuICAgIHRoaXMuc29ja2V0LmVtaXQoXCJicm9hZGNhc3RcIiwgcGFja2V0KTtcbiAgfVxuXG4gIHN0b3JlQXVkaW9TdHJlYW0oY2xpZW50SWQsIHN0cmVhbSkge1xuICAgIHRoaXMuYXVkaW9TdHJlYW1zW2NsaWVudElkXSA9IHN0cmVhbTtcbiAgICBpZiAodGhpcy5wZW5kaW5nQXVkaW9SZXF1ZXN0W2NsaWVudElkXSkge1xuICAgICAgTkFGLmxvZy53cml0ZShcIlJlY2VpdmVkIHBlbmRpbmcgYXVkaW8gZm9yIFwiICsgY2xpZW50SWQpO1xuICAgICAgdGhpcy5wZW5kaW5nQXVkaW9SZXF1ZXN0W2NsaWVudElkXShzdHJlYW0pO1xuICAgICAgZGVsZXRlIHRoaXMucGVuZGluZ0F1ZGlvUmVxdWVzdFtjbGllbnRJZF0oc3RyZWFtKTtcbiAgICB9XG4gIH1cblxuICB0cmFja0xpc3RlbmVyKGNsaWVudElkLCBzdHJlYW0pIHtcbiAgICB0aGlzLnN0b3JlQXVkaW9TdHJlYW0oY2xpZW50SWQsIHN0cmVhbSk7XG4gIH1cblxuICBnZXRNZWRpYVN0cmVhbShjbGllbnRJZCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhpcy5hdWRpb1N0cmVhbXNbY2xpZW50SWRdKSB7XG4gICAgICBOQUYubG9nLndyaXRlKFwiQWxyZWFkeSBoYWQgYXVkaW8gZm9yIFwiICsgY2xpZW50SWQpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmF1ZGlvU3RyZWFtc1tjbGllbnRJZF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBOQUYubG9nLndyaXRlKFwiV2FpdGluZyBvbiBhdWRpbyBmb3IgXCIgKyBjbGllbnRJZCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIHRoYXQucGVuZGluZ0F1ZGlvUmVxdWVzdFtjbGllbnRJZF0gPSByZXNvbHZlO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlVGltZU9mZnNldCgpIHtcbiAgICBjb25zdCBjbGllbnRTZW50VGltZSA9IERhdGUubm93KCkgKyB0aGlzLmF2Z1RpbWVPZmZzZXQ7XG5cbiAgICByZXR1cm4gZmV0Y2goZG9jdW1lbnQubG9jYXRpb24uaHJlZiwgeyBtZXRob2Q6IFwiSEVBRFwiLCBjYWNoZTogXCJuby1jYWNoZVwiIH0pXG4gICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICB2YXIgcHJlY2lzaW9uID0gMTAwMDtcbiAgICAgICAgdmFyIHNlcnZlclJlY2VpdmVkVGltZSA9IG5ldyBEYXRlKHJlcy5oZWFkZXJzLmdldChcIkRhdGVcIikpLmdldFRpbWUoKSArIChwcmVjaXNpb24gLyAyKTtcbiAgICAgICAgdmFyIGNsaWVudFJlY2VpdmVkVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIHZhciBzZXJ2ZXJUaW1lID0gc2VydmVyUmVjZWl2ZWRUaW1lICsgKChjbGllbnRSZWNlaXZlZFRpbWUgLSBjbGllbnRTZW50VGltZSkgLyAyKTtcbiAgICAgICAgdmFyIHRpbWVPZmZzZXQgPSBzZXJ2ZXJUaW1lIC0gY2xpZW50UmVjZWl2ZWRUaW1lO1xuXG4gICAgICAgIHRoaXMuc2VydmVyVGltZVJlcXVlc3RzKys7XG5cbiAgICAgICAgaWYgKHRoaXMuc2VydmVyVGltZVJlcXVlc3RzIDw9IDEwKSB7XG4gICAgICAgICAgdGhpcy50aW1lT2Zmc2V0cy5wdXNoKHRpbWVPZmZzZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudGltZU9mZnNldHNbdGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgJSAxMF0gPSB0aW1lT2Zmc2V0O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hdmdUaW1lT2Zmc2V0ID0gdGhpcy50aW1lT2Zmc2V0cy5yZWR1Y2UoKGFjYywgb2Zmc2V0KSA9PiBhY2MgKz0gb2Zmc2V0LCAwKSAvIHRoaXMudGltZU9mZnNldHMubGVuZ3RoO1xuXG4gICAgICAgIGlmICh0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cyA+IDEwKSB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKSwgNSAqIDYwICogMTAwMCk7IC8vIFN5bmMgY2xvY2sgZXZlcnkgNSBtaW51dGVzLlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudXBkYXRlVGltZU9mZnNldCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIGdldFNlcnZlclRpbWUoKSB7XG4gICAgcmV0dXJuIC0xOyAvLyBUT0RPIGltcGxlbWVudFxuICB9XG59XG5cbk5BRi5hZGFwdGVycy5yZWdpc3RlcihcIm5hdGl2ZS13ZWJydGNcIiwgTmF0aXZlV2ViUnRjQWRhcHRlcik7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF0aXZlV2ViUnRjQWRhcHRlcjtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9pbmRleC5qcyIsImNsYXNzIFdlYlJ0Y1BlZXIge1xuICBjb25zdHJ1Y3Rvcihsb2NhbElkLCByZW1vdGVJZCwgc2VuZFNpZ25hbEZ1bmMpIHtcbiAgICB0aGlzLmxvY2FsSWQgPSBsb2NhbElkO1xuICAgIHRoaXMucmVtb3RlSWQgPSByZW1vdGVJZDtcbiAgICB0aGlzLnNlbmRTaWduYWxGdW5jID0gc2VuZFNpZ25hbEZ1bmM7XG4gICAgdGhpcy5vcGVuID0gZmFsc2U7XG4gICAgdGhpcy5jaGFubmVsTGFiZWwgPSBcIm5ldHdvcmtlZC1hZnJhbWUtY2hhbm5lbFwiO1xuXG4gICAgdGhpcy5wYyA9IHRoaXMuY3JlYXRlUGVlckNvbm5lY3Rpb24oKTtcbiAgICB0aGlzLmNoYW5uZWwgPSBudWxsO1xuICB9XG5cbiAgc2V0RGF0YWNoYW5uZWxMaXN0ZW5lcnMob3Blbkxpc3RlbmVyLCBjbG9zZWRMaXN0ZW5lciwgbWVzc2FnZUxpc3RlbmVyLCB0cmFja0xpc3RlbmVyKSB7XG4gICAgdGhpcy5vcGVuTGlzdGVuZXIgPSBvcGVuTGlzdGVuZXI7XG4gICAgdGhpcy5jbG9zZWRMaXN0ZW5lciA9IGNsb3NlZExpc3RlbmVyO1xuICAgIHRoaXMubWVzc2FnZUxpc3RlbmVyID0gbWVzc2FnZUxpc3RlbmVyO1xuICAgIHRoaXMudHJhY2tMaXN0ZW5lciA9IHRyYWNrTGlzdGVuZXI7XG4gIH1cblxuICBvZmZlcihvcHRpb25zKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIHJlbGlhYmxlOiBmYWxzZSAtIFVEUFxuICAgIHRoaXMuc2V0dXBDaGFubmVsKFxuICAgICAgdGhpcy5wYy5jcmVhdGVEYXRhQ2hhbm5lbCh0aGlzLmNoYW5uZWxMYWJlbCwgeyByZWxpYWJsZTogZmFsc2UgfSlcbiAgICApO1xuXG4gICAgLy8gSWYgdGhlcmUgYXJlIGVycm9ycyB3aXRoIFNhZmFyaSBpbXBsZW1lbnQgdGhpczpcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vT3BlblZpZHUvb3BlbnZpZHUvYmxvYi9tYXN0ZXIvb3BlbnZpZHUtYnJvd3Nlci9zcmMvT3BlblZpZHVJbnRlcm5hbC9XZWJSdGNQZWVyL1dlYlJ0Y1BlZXIudHMjTDE1NFxuICAgIFxuICAgIGlmIChvcHRpb25zLnNlbmRBdWRpbykge1xuICAgICAgb3B0aW9ucy5sb2NhbEF1ZGlvU3RyZWFtLmdldFRyYWNrcygpLmZvckVhY2goXG4gICAgICAgIHRyYWNrID0+IHNlbGYucGMuYWRkVHJhY2sodHJhY2ssIG9wdGlvbnMubG9jYWxBdWRpb1N0cmVhbSkpO1xuICAgIH1cblxuICAgIHRoaXMucGMuY3JlYXRlT2ZmZXIoXG4gICAgICBzZHAgPT4ge1xuICAgICAgICBzZWxmLmhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbihzZHApO1xuICAgICAgfSxcbiAgICAgIGVycm9yID0+IHtcbiAgICAgICAgTkFGLmxvZy5lcnJvcihcIldlYlJ0Y1BlZXIub2ZmZXI6IFwiICsgZXJyb3IpO1xuICAgICAgfSxcbiAgICAgIHtcbiAgICAgICAgb2ZmZXJUb1JlY2VpdmVBdWRpbzogdHJ1ZSxcbiAgICAgICAgb2ZmZXJUb1JlY2VpdmVWaWRlbzogZmFsc2UsXG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGhhbmRsZVNpZ25hbChzaWduYWwpIHtcbiAgICAvLyBpZ25vcmVzIHNpZ25hbCBpZiBpdCBpc24ndCBmb3IgbWVcbiAgICBpZiAodGhpcy5sb2NhbElkICE9PSBzaWduYWwudG8gfHwgdGhpcy5yZW1vdGVJZCAhPT0gc2lnbmFsLmZyb20pIHJldHVybjtcblxuICAgIHN3aXRjaCAoc2lnbmFsLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJvZmZlclwiOlxuICAgICAgICB0aGlzLmhhbmRsZU9mZmVyKHNpZ25hbCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFwiYW5zd2VyXCI6XG4gICAgICAgIHRoaXMuaGFuZGxlQW5zd2VyKHNpZ25hbCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFwiY2FuZGlkYXRlXCI6XG4gICAgICAgIHRoaXMuaGFuZGxlQ2FuZGlkYXRlKHNpZ25hbCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBOQUYubG9nLmVycm9yKFxuICAgICAgICAgIFwiV2ViUnRjUGVlci5oYW5kbGVTaWduYWw6IFVua25vd24gc2lnbmFsIHR5cGUgXCIgKyBzaWduYWwudHlwZVxuICAgICAgICApO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBzZW5kKHR5cGUsIGRhdGEpIHtcbiAgICBpZiAodGhpcy5jaGFubmVsID09PSBudWxsIHx8IHRoaXMuY2hhbm5lbC5yZWFkeVN0YXRlICE9PSBcIm9wZW5cIikge1xuICAgICAgcmV0dXJuO1xuICAgIH1cblxuICAgIHRoaXMuY2hhbm5lbC5zZW5kKEpTT04uc3RyaW5naWZ5KHsgdHlwZTogdHlwZSwgZGF0YTogZGF0YSB9KSk7XG4gIH1cblxuICBnZXRTdGF0dXMoKSB7XG4gICAgaWYgKHRoaXMuY2hhbm5lbCA9PT0gbnVsbCkgcmV0dXJuIFdlYlJ0Y1BlZXIuTk9UX0NPTk5FQ1RFRDtcblxuICAgIHN3aXRjaCAodGhpcy5jaGFubmVsLnJlYWR5U3RhdGUpIHtcbiAgICAgIGNhc2UgXCJvcGVuXCI6XG4gICAgICAgIHJldHVybiBXZWJSdGNQZWVyLklTX0NPTk5FQ1RFRDtcblxuICAgICAgY2FzZSBcImNvbm5lY3RpbmdcIjpcbiAgICAgICAgcmV0dXJuIFdlYlJ0Y1BlZXIuQ09OTkVDVElORztcblxuICAgICAgY2FzZSBcImNsb3NpbmdcIjpcbiAgICAgIGNhc2UgXCJjbG9zZWRcIjpcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHJldHVybiBXZWJSdGNQZWVyLk5PVF9DT05ORUNURUQ7XG4gICAgfVxuICB9XG5cbiAgLypcbiAgICogUHJpdmF0ZXNcbiAgICovXG5cbiAgY3JlYXRlUGVlckNvbm5lY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBSVENQZWVyQ29ubmVjdGlvbiA9XG4gICAgICB3aW5kb3cuUlRDUGVlckNvbm5lY3Rpb24gfHxcbiAgICAgIHdpbmRvdy53ZWJraXRSVENQZWVyQ29ubmVjdGlvbiB8fFxuICAgICAgd2luZG93Lm1velJUQ1BlZXJDb25uZWN0aW9uIHx8XG4gICAgICB3aW5kb3cubXNSVENQZWVyQ29ubmVjdGlvbjtcblxuICAgIGlmIChSVENQZWVyQ29ubmVjdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiV2ViUnRjUGVlci5jcmVhdGVQZWVyQ29ubmVjdGlvbjogVGhpcyBicm93c2VyIGRvZXMgbm90IHNlZW0gdG8gc3VwcG9ydCBXZWJSVEMuXCJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdmFyIHBjID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKHsgaWNlU2VydmVyczogV2ViUnRjUGVlci5JQ0VfU0VSVkVSUyB9KTtcblxuICAgIHBjLm9uaWNlY2FuZGlkYXRlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGlmIChldmVudC5jYW5kaWRhdGUpIHtcbiAgICAgICAgc2VsZi5zZW5kU2lnbmFsRnVuYyh7XG4gICAgICAgICAgZnJvbTogc2VsZi5sb2NhbElkLFxuICAgICAgICAgIHRvOiBzZWxmLnJlbW90ZUlkLFxuICAgICAgICAgIHR5cGU6IFwiY2FuZGlkYXRlXCIsXG4gICAgICAgICAgc2RwTUxpbmVJbmRleDogZXZlbnQuY2FuZGlkYXRlLnNkcE1MaW5lSW5kZXgsXG4gICAgICAgICAgY2FuZGlkYXRlOiBldmVudC5jYW5kaWRhdGUuY2FuZGlkYXRlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBOb3RlOiBzZWVtcyBsaWtlIGNoYW5uZWwub25jbG9zZSBoYW5kZXIgaXMgdW5yZWxpYWJsZSBvbiBzb21lIHBsYXRmb3JtcyxcbiAgICAvLyAgICAgICBzbyBhbHNvIHRyaWVzIHRvIGRldGVjdCBkaXNjb25uZWN0aW9uIGhlcmUuXG4gICAgcGMub25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChzZWxmLm9wZW4gJiYgcGMuaWNlQ29ubmVjdGlvblN0YXRlID09PSBcImRpc2Nvbm5lY3RlZFwiKSB7XG4gICAgICAgIHNlbGYub3BlbiA9IGZhbHNlO1xuICAgICAgICBzZWxmLmNsb3NlZExpc3RlbmVyKHNlbGYucmVtb3RlSWQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICBwYy5vbnRyYWNrID0gKGUpID0+IHtcbiAgICAgIHNlbGYudHJhY2tMaXN0ZW5lcihzZWxmLnJlbW90ZUlkLCBlLnN0cmVhbXNbMF0pO1xuICAgIH1cblxuICAgIHJldHVybiBwYztcbiAgfVxuXG4gIHNldHVwQ2hhbm5lbChjaGFubmVsKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5jaGFubmVsID0gY2hhbm5lbDtcblxuICAgIC8vIHJlY2VpdmVkIGRhdGEgZnJvbSBhIHJlbW90ZSBwZWVyXG4gICAgdGhpcy5jaGFubmVsLm9ubWVzc2FnZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICB2YXIgZGF0YSA9IEpTT04ucGFyc2UoZXZlbnQuZGF0YSk7XG4gICAgICBzZWxmLm1lc3NhZ2VMaXN0ZW5lcihzZWxmLnJlbW90ZUlkLCBkYXRhLnR5cGUsIGRhdGEuZGF0YSk7XG4gICAgfTtcblxuICAgIC8vIGNvbm5lY3RlZCB3aXRoIGEgcmVtb3RlIHBlZXJcbiAgICB0aGlzLmNoYW5uZWwub25vcGVuID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHNlbGYub3BlbiA9IHRydWU7XG4gICAgICBzZWxmLm9wZW5MaXN0ZW5lcihzZWxmLnJlbW90ZUlkKTtcbiAgICB9O1xuXG4gICAgLy8gZGlzY29ubmVjdGVkIHdpdGggYSByZW1vdGUgcGVlclxuICAgIHRoaXMuY2hhbm5lbC5vbmNsb3NlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGlmICghc2VsZi5vcGVuKSByZXR1cm47XG4gICAgICBzZWxmLm9wZW4gPSBmYWxzZTtcbiAgICAgIHNlbGYuY2xvc2VkTGlzdGVuZXIoc2VsZi5yZW1vdGVJZCk7XG4gICAgfTtcblxuICAgIC8vIGVycm9yIG9jY3VycmVkIHdpdGggYSByZW1vdGUgcGVlclxuICAgIHRoaXMuY2hhbm5lbC5vbmVycm9yID0gZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgIE5BRi5sb2cuZXJyb3IoXCJXZWJSdGNQZWVyLmNoYW5uZWwub25lcnJvcjogXCIgKyBlcnJvcik7XG4gICAgfTtcbiAgfVxuXG4gIGhhbmRsZU9mZmVyKG1lc3NhZ2UpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLnBjLm9uZGF0YWNoYW5uZWwgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgc2VsZi5zZXR1cENoYW5uZWwoZXZlbnQuY2hhbm5lbCk7XG4gICAgfTtcblxuICAgIHRoaXMuc2V0UmVtb3RlRGVzY3JpcHRpb24obWVzc2FnZSk7XG5cbiAgICB0aGlzLnBjLmNyZWF0ZUFuc3dlcihcbiAgICAgIGZ1bmN0aW9uKHNkcCkge1xuICAgICAgICBzZWxmLmhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbihzZHApO1xuICAgICAgfSxcbiAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIE5BRi5sb2cuZXJyb3IoXCJXZWJSdGNQZWVyLmhhbmRsZU9mZmVyOiBcIiArIGVycm9yKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgaGFuZGxlQW5zd2VyKG1lc3NhZ2UpIHtcbiAgICB0aGlzLnNldFJlbW90ZURlc2NyaXB0aW9uKG1lc3NhZ2UpO1xuICB9XG5cbiAgaGFuZGxlQ2FuZGlkYXRlKG1lc3NhZ2UpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIFJUQ0ljZUNhbmRpZGF0ZSA9XG4gICAgICB3aW5kb3cuUlRDSWNlQ2FuZGlkYXRlIHx8XG4gICAgICB3aW5kb3cud2Via2l0UlRDSWNlQ2FuZGlkYXRlIHx8XG4gICAgICB3aW5kb3cubW96UlRDSWNlQ2FuZGlkYXRlO1xuXG4gICAgdGhpcy5wYy5hZGRJY2VDYW5kaWRhdGUoXG4gICAgICBuZXcgUlRDSWNlQ2FuZGlkYXRlKG1lc3NhZ2UpLFxuICAgICAgZnVuY3Rpb24oKSB7fSxcbiAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIE5BRi5sb2cuZXJyb3IoXCJXZWJSdGNQZWVyLmhhbmRsZUNhbmRpZGF0ZTogXCIgKyBlcnJvcik7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbihzZHApIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLnBjLnNldExvY2FsRGVzY3JpcHRpb24oXG4gICAgICBzZHAsXG4gICAgICBmdW5jdGlvbigpIHt9LFxuICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgTkFGLmxvZy5lcnJvcihcIldlYlJ0Y1BlZXIuaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uOiBcIiArIGVycm9yKTtcbiAgICAgIH1cbiAgICApO1xuXG4gICAgdGhpcy5zZW5kU2lnbmFsRnVuYyh7XG4gICAgICBmcm9tOiB0aGlzLmxvY2FsSWQsXG4gICAgICB0bzogdGhpcy5yZW1vdGVJZCxcbiAgICAgIHR5cGU6IHNkcC50eXBlLFxuICAgICAgc2RwOiBzZHAuc2RwXG4gICAgfSk7XG4gIH1cblxuICBzZXRSZW1vdGVEZXNjcmlwdGlvbihtZXNzYWdlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBSVENTZXNzaW9uRGVzY3JpcHRpb24gPVxuICAgICAgd2luZG93LlJUQ1Nlc3Npb25EZXNjcmlwdGlvbiB8fFxuICAgICAgd2luZG93LndlYmtpdFJUQ1Nlc3Npb25EZXNjcmlwdGlvbiB8fFxuICAgICAgd2luZG93Lm1velJUQ1Nlc3Npb25EZXNjcmlwdGlvbiB8fFxuICAgICAgd2luZG93Lm1zUlRDU2Vzc2lvbkRlc2NyaXB0aW9uO1xuXG4gICAgdGhpcy5wYy5zZXRSZW1vdGVEZXNjcmlwdGlvbihcbiAgICAgIG5ldyBSVENTZXNzaW9uRGVzY3JpcHRpb24obWVzc2FnZSksXG4gICAgICBmdW5jdGlvbigpIHt9LFxuICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgTkFGLmxvZy5lcnJvcihcIldlYlJ0Y1BlZXIuc2V0UmVtb3RlRGVzY3JpcHRpb246IFwiICsgZXJyb3IpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBjbG9zZSgpIHtcbiAgICBpZiAodGhpcy5wYykge1xuICAgICAgdGhpcy5wYy5jbG9zZSgpO1xuICAgIH1cbiAgfVxufVxuXG5XZWJSdGNQZWVyLklTX0NPTk5FQ1RFRCA9IFwiSVNfQ09OTkVDVEVEXCI7XG5XZWJSdGNQZWVyLkNPTk5FQ1RJTkcgPSBcIkNPTk5FQ1RJTkdcIjtcbldlYlJ0Y1BlZXIuTk9UX0NPTk5FQ1RFRCA9IFwiTk9UX0NPTk5FQ1RFRFwiO1xuXG5XZWJSdGNQZWVyLklDRV9TRVJWRVJTID0gW1xuICB7IHVybHM6IFwic3R1bjpzdHVuMS5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxuICB7IHVybHM6IFwic3R1bjpzdHVuMi5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxuICB7IHVybHM6IFwic3R1bjpzdHVuMy5sLmdvb2dsZS5jb206MTkzMDJcIiB9LFxuICB7IHVybHM6IFwic3R1bjpzdHVuNC5sLmdvb2dsZS5jb206MTkzMDJcIiB9XG5dO1xuXG5tb2R1bGUuZXhwb3J0cyA9IFdlYlJ0Y1BlZXI7XG5cblxuLy8gV0VCUEFDSyBGT09URVIgLy9cbi8vIC4vc3JjL1dlYlJ0Y1BlZXIuanMiXSwic291cmNlUm9vdCI6IiJ9