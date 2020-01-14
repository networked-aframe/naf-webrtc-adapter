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
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
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
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/index.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/WebRtcPeer.js":
/*!***************************!*\
  !*** ./src/WebRtcPeer.js ***!
  \***************************/
/*! no static exports found */
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

/***/ }),

/***/ "./src/index.js":
/*!**********************!*\
  !*** ./src/index.js ***!
  \**********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var WebRtcPeer = __webpack_require__(/*! ./WebRtcPeer */ "./src/WebRtcPeer.js");

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

/***/ })

/******/ });
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAiLCJ3ZWJwYWNrOi8vLy4vc3JjL1dlYlJ0Y1BlZXIuanMiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIl0sIm5hbWVzIjpbIldlYlJ0Y1BlZXIiLCJsb2NhbElkIiwicmVtb3RlSWQiLCJzZW5kU2lnbmFsRnVuYyIsIm9wZW4iLCJjaGFubmVsTGFiZWwiLCJwYyIsImNyZWF0ZVBlZXJDb25uZWN0aW9uIiwiY2hhbm5lbCIsIm9wZW5MaXN0ZW5lciIsImNsb3NlZExpc3RlbmVyIiwibWVzc2FnZUxpc3RlbmVyIiwidHJhY2tMaXN0ZW5lciIsIm9wdGlvbnMiLCJzZWxmIiwic2V0dXBDaGFubmVsIiwiY3JlYXRlRGF0YUNoYW5uZWwiLCJyZWxpYWJsZSIsInNlbmRBdWRpbyIsImxvY2FsQXVkaW9TdHJlYW0iLCJnZXRUcmFja3MiLCJmb3JFYWNoIiwiYWRkVHJhY2siLCJ0cmFjayIsImNyZWF0ZU9mZmVyIiwiaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uIiwic2RwIiwiTkFGIiwibG9nIiwiZXJyb3IiLCJvZmZlclRvUmVjZWl2ZUF1ZGlvIiwib2ZmZXJUb1JlY2VpdmVWaWRlbyIsInNpZ25hbCIsInRvIiwiZnJvbSIsInR5cGUiLCJoYW5kbGVPZmZlciIsImhhbmRsZUFuc3dlciIsImhhbmRsZUNhbmRpZGF0ZSIsImRhdGEiLCJyZWFkeVN0YXRlIiwic2VuZCIsIkpTT04iLCJzdHJpbmdpZnkiLCJOT1RfQ09OTkVDVEVEIiwiSVNfQ09OTkVDVEVEIiwiQ09OTkVDVElORyIsIlJUQ1BlZXJDb25uZWN0aW9uIiwid2luZG93Iiwid2Via2l0UlRDUGVlckNvbm5lY3Rpb24iLCJtb3pSVENQZWVyQ29ubmVjdGlvbiIsIm1zUlRDUGVlckNvbm5lY3Rpb24iLCJ1bmRlZmluZWQiLCJFcnJvciIsImljZVNlcnZlcnMiLCJJQ0VfU0VSVkVSUyIsIm9uaWNlY2FuZGlkYXRlIiwiZXZlbnQiLCJjYW5kaWRhdGUiLCJzZHBNTGluZUluZGV4Iiwib25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2UiLCJpY2VDb25uZWN0aW9uU3RhdGUiLCJvbnRyYWNrIiwiZSIsInN0cmVhbXMiLCJvbm1lc3NhZ2UiLCJwYXJzZSIsIm9ub3BlbiIsIm9uY2xvc2UiLCJvbmVycm9yIiwibWVzc2FnZSIsIm9uZGF0YWNoYW5uZWwiLCJzZXRSZW1vdGVEZXNjcmlwdGlvbiIsImNyZWF0ZUFuc3dlciIsIlJUQ0ljZUNhbmRpZGF0ZSIsIndlYmtpdFJUQ0ljZUNhbmRpZGF0ZSIsIm1velJUQ0ljZUNhbmRpZGF0ZSIsImFkZEljZUNhbmRpZGF0ZSIsInNldExvY2FsRGVzY3JpcHRpb24iLCJSVENTZXNzaW9uRGVzY3JpcHRpb24iLCJ3ZWJraXRSVENTZXNzaW9uRGVzY3JpcHRpb24iLCJtb3pSVENTZXNzaW9uRGVzY3JpcHRpb24iLCJtc1JUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsImNsb3NlIiwidXJscyIsIm1vZHVsZSIsImV4cG9ydHMiLCJyZXF1aXJlIiwiTmF0aXZlV2ViUnRjQWRhcHRlciIsImlvIiwiY29uc29sZSIsIndhcm4iLCJhcHAiLCJyb29tIiwib2NjdXBhbnRMaXN0ZW5lciIsIm15Um9vbUpvaW5UaW1lIiwibXlJZCIsImF2Z1RpbWVPZmZzZXQiLCJwZWVycyIsIm9jY3VwYW50cyIsImF1ZGlvU3RyZWFtcyIsInBlbmRpbmdBdWRpb1JlcXVlc3QiLCJzZXJ2ZXJUaW1lUmVxdWVzdHMiLCJ0aW1lT2Zmc2V0cyIsIndzVXJsIiwiYXBwTmFtZSIsInJvb21OYW1lIiwiZGF0YWNoYW5uZWwiLCJhdWRpbyIsInZpZGVvIiwic3VjY2Vzc0xpc3RlbmVyIiwiZmFpbHVyZUxpc3RlbmVyIiwiY29ubmVjdFN1Y2Nlc3MiLCJjb25uZWN0RmFpbHVyZSIsInVwZGF0ZVRpbWVPZmZzZXQiLCJ0aGVuIiwibG9jYXRpb24iLCJwcm90b2NvbCIsImhvc3QiLCJ3cml0ZSIsInNvY2tldCIsIm9uIiwiaWQiLCJqb2luUm9vbSIsImpvaW5lZFRpbWUiLCJtZWRpYUNvbnN0cmFpbnRzIiwibmF2aWdhdG9yIiwibWVkaWFEZXZpY2VzIiwiZ2V0VXNlck1lZGlhIiwic3RvcmVBdWRpb1N0cmVhbSIsImxvY2FsU3RyZWFtIiwiY2F0Y2giLCJlcnIiLCJyZWNlaXZlZE9jY3VwYW50cyIsInJlY2VpdmVEYXRhIiwicGFja2V0IiwiaGFuZGxlU2lnbmFsIiwiZW1pdCIsImtleSIsInBlZXIiLCJzZW5kaW5nIiwic2V0RGF0YWNoYW5uZWxMaXN0ZW5lcnMiLCJiaW5kIiwiY2xpZW50IiwiZ2V0TWVkaWFTdHJlYW0iLCJzdHJlYW0iLCJvZmZlciIsImNsaWVudElkIiwiYWRhcHRlcnMiLCJnZXRTdGF0dXMiLCJzZW5kRGF0YSIsImJyb2FkY2FzdGluZyIsInRoYXQiLCJQcm9taXNlIiwicmVzb2x2ZSIsImNsaWVudFNlbnRUaW1lIiwiRGF0ZSIsIm5vdyIsImZldGNoIiwiZG9jdW1lbnQiLCJocmVmIiwibWV0aG9kIiwiY2FjaGUiLCJwcmVjaXNpb24iLCJzZXJ2ZXJSZWNlaXZlZFRpbWUiLCJyZXMiLCJoZWFkZXJzIiwiZ2V0IiwiZ2V0VGltZSIsImNsaWVudFJlY2VpdmVkVGltZSIsInNlcnZlclRpbWUiLCJ0aW1lT2Zmc2V0IiwicHVzaCIsInJlZHVjZSIsImFjYyIsIm9mZnNldCIsImxlbmd0aCIsInNldFRpbWVvdXQiLCJyZWdpc3RlciJdLCJtYXBwaW5ncyI6IjtRQUFBO1FBQ0E7O1FBRUE7UUFDQTs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTs7UUFFQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBOzs7UUFHQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0EsMENBQTBDLGdDQUFnQztRQUMxRTtRQUNBOztRQUVBO1FBQ0E7UUFDQTtRQUNBLHdEQUF3RCxrQkFBa0I7UUFDMUU7UUFDQSxpREFBaUQsY0FBYztRQUMvRDs7UUFFQTtRQUNBO1FBQ0E7UUFDQTtRQUNBO1FBQ0E7UUFDQTtR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U0FGRCxNQUVPO0FBQ0wsaUJBQUtBLGdCQUFMO0FBQ0Q7QUFDRixPQXZCSSxDQUFQO0FBd0JEOzs7b0NBRWU7QUFDZCxhQUFPLENBQUMsQ0FBUixDQURjLENBQ0g7QUFDWjs7Ozs7O0FBR0h2RixJQUFJeUgsUUFBSixDQUFhOEIsUUFBYixDQUFzQixlQUF0QixFQUF1QzFGLG1CQUF2Qzs7QUFFQUgsT0FBT0MsT0FBUCxHQUFpQkUsbUJBQWpCLEMiLCJmaWxlIjoibmFmLW5hdGl2ZS13ZWJydGMtYWRhcHRlci5qcyIsInNvdXJjZXNDb250ZW50IjpbIiBcdC8vIFRoZSBtb2R1bGUgY2FjaGVcbiBcdHZhciBpbnN0YWxsZWRNb2R1bGVzID0ge307XG5cbiBcdC8vIFRoZSByZXF1aXJlIGZ1bmN0aW9uXG4gXHRmdW5jdGlvbiBfX3dlYnBhY2tfcmVxdWlyZV9fKG1vZHVsZUlkKSB7XG5cbiBcdFx0Ly8gQ2hlY2sgaWYgbW9kdWxlIGlzIGluIGNhY2hlXG4gXHRcdGlmKGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdKSB7XG4gXHRcdFx0cmV0dXJuIGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdLmV4cG9ydHM7XG4gXHRcdH1cbiBcdFx0Ly8gQ3JlYXRlIGEgbmV3IG1vZHVsZSAoYW5kIHB1dCBpdCBpbnRvIHRoZSBjYWNoZSlcbiBcdFx0dmFyIG1vZHVsZSA9IGluc3RhbGxlZE1vZHVsZXNbbW9kdWxlSWRdID0ge1xuIFx0XHRcdGk6IG1vZHVsZUlkLFxuIFx0XHRcdGw6IGZhbHNlLFxuIFx0XHRcdGV4cG9ydHM6IHt9XG4gXHRcdH07XG5cbiBcdFx0Ly8gRXhlY3V0ZSB0aGUgbW9kdWxlIGZ1bmN0aW9uXG4gXHRcdG1vZHVsZXNbbW9kdWxlSWRdLmNhbGwobW9kdWxlLmV4cG9ydHMsIG1vZHVsZSwgbW9kdWxlLmV4cG9ydHMsIF9fd2VicGFja19yZXF1aXJlX18pO1xuXG4gXHRcdC8vIEZsYWcgdGhlIG1vZHVsZSBhcyBsb2FkZWRcbiBcdFx0bW9kdWxlLmwgPSB0cnVlO1xuXG4gXHRcdC8vIFJldHVybiB0aGUgZXhwb3J0cyBvZiB0aGUgbW9kdWxlXG4gXHRcdHJldHVybiBtb2R1bGUuZXhwb3J0cztcbiBcdH1cblxuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZXMgb2JqZWN0IChfX3dlYnBhY2tfbW9kdWxlc19fKVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5tID0gbW9kdWxlcztcblxuIFx0Ly8gZXhwb3NlIHRoZSBtb2R1bGUgY2FjaGVcbiBcdF9fd2VicGFja19yZXF1aXJlX18uYyA9IGluc3RhbGxlZE1vZHVsZXM7XG5cbiBcdC8vIGRlZmluZSBnZXR0ZXIgZnVuY3Rpb24gZm9yIGhhcm1vbnkgZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5kID0gZnVuY3Rpb24oZXhwb3J0cywgbmFtZSwgZ2V0dGVyKSB7XG4gXHRcdGlmKCFfX3dlYnBhY2tfcmVxdWlyZV9fLm8oZXhwb3J0cywgbmFtZSkpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgbmFtZSwgeyBlbnVtZXJhYmxlOiB0cnVlLCBnZXQ6IGdldHRlciB9KTtcbiBcdFx0fVxuIFx0fTtcblxuIFx0Ly8gZGVmaW5lIF9fZXNNb2R1bGUgb24gZXhwb3J0c1xuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yID0gZnVuY3Rpb24oZXhwb3J0cykge1xuIFx0XHRpZih0eXBlb2YgU3ltYm9sICE9PSAndW5kZWZpbmVkJyAmJiBTeW1ib2wudG9TdHJpbmdUYWcpIHtcbiBcdFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgU3ltYm9sLnRvU3RyaW5nVGFnLCB7IHZhbHVlOiAnTW9kdWxlJyB9KTtcbiBcdFx0fVxuIFx0XHRPYmplY3QuZGVmaW5lUHJvcGVydHkoZXhwb3J0cywgJ19fZXNNb2R1bGUnLCB7IHZhbHVlOiB0cnVlIH0pO1xuIFx0fTtcblxuIFx0Ly8gY3JlYXRlIGEgZmFrZSBuYW1lc3BhY2Ugb2JqZWN0XG4gXHQvLyBtb2RlICYgMTogdmFsdWUgaXMgYSBtb2R1bGUgaWQsIHJlcXVpcmUgaXRcbiBcdC8vIG1vZGUgJiAyOiBtZXJnZSBhbGwgcHJvcGVydGllcyBvZiB2YWx1ZSBpbnRvIHRoZSBuc1xuIFx0Ly8gbW9kZSAmIDQ6IHJldHVybiB2YWx1ZSB3aGVuIGFscmVhZHkgbnMgb2JqZWN0XG4gXHQvLyBtb2RlICYgOHwxOiBiZWhhdmUgbGlrZSByZXF1aXJlXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLnQgPSBmdW5jdGlvbih2YWx1ZSwgbW9kZSkge1xuIFx0XHRpZihtb2RlICYgMSkgdmFsdWUgPSBfX3dlYnBhY2tfcmVxdWlyZV9fKHZhbHVlKTtcbiBcdFx0aWYobW9kZSAmIDgpIHJldHVybiB2YWx1ZTtcbiBcdFx0aWYoKG1vZGUgJiA0KSAmJiB0eXBlb2YgdmFsdWUgPT09ICdvYmplY3QnICYmIHZhbHVlICYmIHZhbHVlLl9fZXNNb2R1bGUpIHJldHVybiB2YWx1ZTtcbiBcdFx0dmFyIG5zID0gT2JqZWN0LmNyZWF0ZShudWxsKTtcbiBcdFx0X193ZWJwYWNrX3JlcXVpcmVfXy5yKG5zKTtcbiBcdFx0T2JqZWN0LmRlZmluZVByb3BlcnR5KG5zLCAnZGVmYXVsdCcsIHsgZW51bWVyYWJsZTogdHJ1ZSwgdmFsdWU6IHZhbHVlIH0pO1xuIFx0XHRpZihtb2RlICYgMiAmJiB0eXBlb2YgdmFsdWUgIT0gJ3N0cmluZycpIGZvcih2YXIga2V5IGluIHZhbHVlKSBfX3dlYnBhY2tfcmVxdWlyZV9fLmQobnMsIGtleSwgZnVuY3Rpb24oa2V5KSB7IHJldHVybiB2YWx1ZVtrZXldOyB9LmJpbmQobnVsbCwga2V5KSk7XG4gXHRcdHJldHVybiBucztcbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cblxuIFx0Ly8gTG9hZCBlbnRyeSBtb2R1bGUgYW5kIHJldHVybiBleHBvcnRzXG4gXHRyZXR1cm4gX193ZWJwYWNrX3JlcXVpcmVfXyhfX3dlYnBhY2tfcmVxdWlyZV9fLnMgPSBcIi4vc3JjL2luZGV4LmpzXCIpO1xuIiwiY2xhc3MgV2ViUnRjUGVlciB7XG4gIGNvbnN0cnVjdG9yKGxvY2FsSWQsIHJlbW90ZUlkLCBzZW5kU2lnbmFsRnVuYykge1xuICAgIHRoaXMubG9jYWxJZCA9IGxvY2FsSWQ7XG4gICAgdGhpcy5yZW1vdGVJZCA9IHJlbW90ZUlkO1xuICAgIHRoaXMuc2VuZFNpZ25hbEZ1bmMgPSBzZW5kU2lnbmFsRnVuYztcbiAgICB0aGlzLm9wZW4gPSBmYWxzZTtcbiAgICB0aGlzLmNoYW5uZWxMYWJlbCA9IFwibmV0d29ya2VkLWFmcmFtZS1jaGFubmVsXCI7XG5cbiAgICB0aGlzLnBjID0gdGhpcy5jcmVhdGVQZWVyQ29ubmVjdGlvbigpO1xuICAgIHRoaXMuY2hhbm5lbCA9IG51bGw7XG4gIH1cblxuICBzZXREYXRhY2hhbm5lbExpc3RlbmVycyhvcGVuTGlzdGVuZXIsIGNsb3NlZExpc3RlbmVyLCBtZXNzYWdlTGlzdGVuZXIsIHRyYWNrTGlzdGVuZXIpIHtcbiAgICB0aGlzLm9wZW5MaXN0ZW5lciA9IG9wZW5MaXN0ZW5lcjtcbiAgICB0aGlzLmNsb3NlZExpc3RlbmVyID0gY2xvc2VkTGlzdGVuZXI7XG4gICAgdGhpcy5tZXNzYWdlTGlzdGVuZXIgPSBtZXNzYWdlTGlzdGVuZXI7XG4gICAgdGhpcy50cmFja0xpc3RlbmVyID0gdHJhY2tMaXN0ZW5lcjtcbiAgfVxuXG4gIG9mZmVyKG9wdGlvbnMpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgLy8gcmVsaWFibGU6IGZhbHNlIC0gVURQXG4gICAgdGhpcy5zZXR1cENoYW5uZWwoXG4gICAgICB0aGlzLnBjLmNyZWF0ZURhdGFDaGFubmVsKHRoaXMuY2hhbm5lbExhYmVsLCB7IHJlbGlhYmxlOiBmYWxzZSB9KVxuICAgICk7XG5cbiAgICAvLyBJZiB0aGVyZSBhcmUgZXJyb3JzIHdpdGggU2FmYXJpIGltcGxlbWVudCB0aGlzOlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9PcGVuVmlkdS9vcGVudmlkdS9ibG9iL21hc3Rlci9vcGVudmlkdS1icm93c2VyL3NyYy9PcGVuVmlkdUludGVybmFsL1dlYlJ0Y1BlZXIvV2ViUnRjUGVlci50cyNMMTU0XG4gICAgXG4gICAgaWYgKG9wdGlvbnMuc2VuZEF1ZGlvKSB7XG4gICAgICBvcHRpb25zLmxvY2FsQXVkaW9TdHJlYW0uZ2V0VHJhY2tzKCkuZm9yRWFjaChcbiAgICAgICAgdHJhY2sgPT4gc2VsZi5wYy5hZGRUcmFjayh0cmFjaywgb3B0aW9ucy5sb2NhbEF1ZGlvU3RyZWFtKSk7XG4gICAgfVxuXG4gICAgdGhpcy5wYy5jcmVhdGVPZmZlcihcbiAgICAgIHNkcCA9PiB7XG4gICAgICAgIHNlbGYuaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uKHNkcCk7XG4gICAgICB9LFxuICAgICAgZXJyb3IgPT4ge1xuICAgICAgICBOQUYubG9nLmVycm9yKFwiV2ViUnRjUGVlci5vZmZlcjogXCIgKyBlcnJvcik7XG4gICAgICB9LFxuICAgICAge1xuICAgICAgICBvZmZlclRvUmVjZWl2ZUF1ZGlvOiB0cnVlLFxuICAgICAgICBvZmZlclRvUmVjZWl2ZVZpZGVvOiBmYWxzZSxcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgaGFuZGxlU2lnbmFsKHNpZ25hbCkge1xuICAgIC8vIGlnbm9yZXMgc2lnbmFsIGlmIGl0IGlzbid0IGZvciBtZVxuICAgIGlmICh0aGlzLmxvY2FsSWQgIT09IHNpZ25hbC50byB8fCB0aGlzLnJlbW90ZUlkICE9PSBzaWduYWwuZnJvbSkgcmV0dXJuO1xuXG4gICAgc3dpdGNoIChzaWduYWwudHlwZSkge1xuICAgICAgY2FzZSBcIm9mZmVyXCI6XG4gICAgICAgIHRoaXMuaGFuZGxlT2ZmZXIoc2lnbmFsKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJhbnN3ZXJcIjpcbiAgICAgICAgdGhpcy5oYW5kbGVBbnN3ZXIoc2lnbmFsKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGNhc2UgXCJjYW5kaWRhdGVcIjpcbiAgICAgICAgdGhpcy5oYW5kbGVDYW5kaWRhdGUoc2lnbmFsKTtcbiAgICAgICAgYnJlYWs7XG5cbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIE5BRi5sb2cuZXJyb3IoXG4gICAgICAgICAgXCJXZWJSdGNQZWVyLmhhbmRsZVNpZ25hbDogVW5rbm93biBzaWduYWwgdHlwZSBcIiArIHNpZ25hbC50eXBlXG4gICAgICAgICk7XG4gICAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIHNlbmQodHlwZSwgZGF0YSkge1xuICAgIGlmICh0aGlzLmNoYW5uZWwgPT09IG51bGwgfHwgdGhpcy5jaGFubmVsLnJlYWR5U3RhdGUgIT09IFwib3BlblwiKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuXG4gICAgdGhpcy5jaGFubmVsLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiB0eXBlLCBkYXRhOiBkYXRhIH0pKTtcbiAgfVxuXG4gIGdldFN0YXR1cygpIHtcbiAgICBpZiAodGhpcy5jaGFubmVsID09PSBudWxsKSByZXR1cm4gV2ViUnRjUGVlci5OT1RfQ09OTkVDVEVEO1xuXG4gICAgc3dpdGNoICh0aGlzLmNoYW5uZWwucmVhZHlTdGF0ZSkge1xuICAgICAgY2FzZSBcIm9wZW5cIjpcbiAgICAgICAgcmV0dXJuIFdlYlJ0Y1BlZXIuSVNfQ09OTkVDVEVEO1xuXG4gICAgICBjYXNlIFwiY29ubmVjdGluZ1wiOlxuICAgICAgICByZXR1cm4gV2ViUnRjUGVlci5DT05ORUNUSU5HO1xuXG4gICAgICBjYXNlIFwiY2xvc2luZ1wiOlxuICAgICAgY2FzZSBcImNsb3NlZFwiOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFdlYlJ0Y1BlZXIuTk9UX0NPTk5FQ1RFRDtcbiAgICB9XG4gIH1cblxuICAvKlxuICAgKiBQcml2YXRlc1xuICAgKi9cblxuICBjcmVhdGVQZWVyQ29ubmVjdGlvbigpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIFJUQ1BlZXJDb25uZWN0aW9uID1cbiAgICAgIHdpbmRvdy5SVENQZWVyQ29ubmVjdGlvbiB8fFxuICAgICAgd2luZG93LndlYmtpdFJUQ1BlZXJDb25uZWN0aW9uIHx8XG4gICAgICB3aW5kb3cubW96UlRDUGVlckNvbm5lY3Rpb24gfHxcbiAgICAgIHdpbmRvdy5tc1JUQ1BlZXJDb25uZWN0aW9uO1xuXG4gICAgaWYgKFJUQ1BlZXJDb25uZWN0aW9uID09PSB1bmRlZmluZWQpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcbiAgICAgICAgXCJXZWJSdGNQZWVyLmNyZWF0ZVBlZXJDb25uZWN0aW9uOiBUaGlzIGJyb3dzZXIgZG9lcyBub3Qgc2VlbSB0byBzdXBwb3J0IFdlYlJUQy5cIlxuICAgICAgKTtcbiAgICB9XG5cbiAgICB2YXIgcGMgPSBuZXcgUlRDUGVlckNvbm5lY3Rpb24oeyBpY2VTZXJ2ZXJzOiBXZWJSdGNQZWVyLklDRV9TRVJWRVJTIH0pO1xuXG4gICAgcGMub25pY2VjYW5kaWRhdGUgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKGV2ZW50LmNhbmRpZGF0ZSkge1xuICAgICAgICBzZWxmLnNlbmRTaWduYWxGdW5jKHtcbiAgICAgICAgICBmcm9tOiBzZWxmLmxvY2FsSWQsXG4gICAgICAgICAgdG86IHNlbGYucmVtb3RlSWQsXG4gICAgICAgICAgdHlwZTogXCJjYW5kaWRhdGVcIixcbiAgICAgICAgICBzZHBNTGluZUluZGV4OiBldmVudC5jYW5kaWRhdGUuc2RwTUxpbmVJbmRleCxcbiAgICAgICAgICBjYW5kaWRhdGU6IGV2ZW50LmNhbmRpZGF0ZS5jYW5kaWRhdGVcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIC8vIE5vdGU6IHNlZW1zIGxpa2UgY2hhbm5lbC5vbmNsb3NlIGhhbmRlciBpcyB1bnJlbGlhYmxlIG9uIHNvbWUgcGxhdGZvcm1zLFxuICAgIC8vICAgICAgIHNvIGFsc28gdHJpZXMgdG8gZGV0ZWN0IGRpc2Nvbm5lY3Rpb24gaGVyZS5cbiAgICBwYy5vbmljZWNvbm5lY3Rpb25zdGF0ZWNoYW5nZSA9IGZ1bmN0aW9uKCkge1xuICAgICAgaWYgKHNlbGYub3BlbiAmJiBwYy5pY2VDb25uZWN0aW9uU3RhdGUgPT09IFwiZGlzY29ubmVjdGVkXCIpIHtcbiAgICAgICAgc2VsZi5vcGVuID0gZmFsc2U7XG4gICAgICAgIHNlbGYuY2xvc2VkTGlzdGVuZXIoc2VsZi5yZW1vdGVJZCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIHBjLm9udHJhY2sgPSAoZSkgPT4ge1xuICAgICAgc2VsZi50cmFja0xpc3RlbmVyKHNlbGYucmVtb3RlSWQsIGUuc3RyZWFtc1swXSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHBjO1xuICB9XG5cbiAgc2V0dXBDaGFubmVsKGNoYW5uZWwpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICB0aGlzLmNoYW5uZWwgPSBjaGFubmVsO1xuXG4gICAgLy8gcmVjZWl2ZWQgZGF0YSBmcm9tIGEgcmVtb3RlIHBlZXJcbiAgICB0aGlzLmNoYW5uZWwub25tZXNzYWdlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHZhciBkYXRhID0gSlNPTi5wYXJzZShldmVudC5kYXRhKTtcbiAgICAgIHNlbGYubWVzc2FnZUxpc3RlbmVyKHNlbGYucmVtb3RlSWQsIGRhdGEudHlwZSwgZGF0YS5kYXRhKTtcbiAgICB9O1xuXG4gICAgLy8gY29ubmVjdGVkIHdpdGggYSByZW1vdGUgcGVlclxuICAgIHRoaXMuY2hhbm5lbC5vbm9wZW4gPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgc2VsZi5vcGVuID0gdHJ1ZTtcbiAgICAgIHNlbGYub3Blbkxpc3RlbmVyKHNlbGYucmVtb3RlSWQpO1xuICAgIH07XG5cbiAgICAvLyBkaXNjb25uZWN0ZWQgd2l0aCBhIHJlbW90ZSBwZWVyXG4gICAgdGhpcy5jaGFubmVsLm9uY2xvc2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgaWYgKCFzZWxmLm9wZW4pIHJldHVybjtcbiAgICAgIHNlbGYub3BlbiA9IGZhbHNlO1xuICAgICAgc2VsZi5jbG9zZWRMaXN0ZW5lcihzZWxmLnJlbW90ZUlkKTtcbiAgICB9O1xuXG4gICAgLy8gZXJyb3Igb2NjdXJyZWQgd2l0aCBhIHJlbW90ZSBwZWVyXG4gICAgdGhpcy5jaGFubmVsLm9uZXJyb3IgPSBmdW5jdGlvbihlcnJvcikge1xuICAgICAgTkFGLmxvZy5lcnJvcihcIldlYlJ0Y1BlZXIuY2hhbm5lbC5vbmVycm9yOiBcIiArIGVycm9yKTtcbiAgICB9O1xuICB9XG5cbiAgaGFuZGxlT2ZmZXIobWVzc2FnZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMucGMub25kYXRhY2hhbm5lbCA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBzZWxmLnNldHVwQ2hhbm5lbChldmVudC5jaGFubmVsKTtcbiAgICB9O1xuXG4gICAgdGhpcy5zZXRSZW1vdGVEZXNjcmlwdGlvbihtZXNzYWdlKTtcblxuICAgIHRoaXMucGMuY3JlYXRlQW5zd2VyKFxuICAgICAgZnVuY3Rpb24oc2RwKSB7XG4gICAgICAgIHNlbGYuaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uKHNkcCk7XG4gICAgICB9LFxuICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgTkFGLmxvZy5lcnJvcihcIldlYlJ0Y1BlZXIuaGFuZGxlT2ZmZXI6IFwiICsgZXJyb3IpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBoYW5kbGVBbnN3ZXIobWVzc2FnZSkge1xuICAgIHRoaXMuc2V0UmVtb3RlRGVzY3JpcHRpb24obWVzc2FnZSk7XG4gIH1cblxuICBoYW5kbGVDYW5kaWRhdGUobWVzc2FnZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgUlRDSWNlQ2FuZGlkYXRlID1cbiAgICAgIHdpbmRvdy5SVENJY2VDYW5kaWRhdGUgfHxcbiAgICAgIHdpbmRvdy53ZWJraXRSVENJY2VDYW5kaWRhdGUgfHxcbiAgICAgIHdpbmRvdy5tb3pSVENJY2VDYW5kaWRhdGU7XG5cbiAgICB0aGlzLnBjLmFkZEljZUNhbmRpZGF0ZShcbiAgICAgIG5ldyBSVENJY2VDYW5kaWRhdGUobWVzc2FnZSksXG4gICAgICBmdW5jdGlvbigpIHt9LFxuICAgICAgZnVuY3Rpb24oZXJyb3IpIHtcbiAgICAgICAgTkFGLmxvZy5lcnJvcihcIldlYlJ0Y1BlZXIuaGFuZGxlQ2FuZGlkYXRlOiBcIiArIGVycm9yKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG5cbiAgaGFuZGxlU2Vzc2lvbkRlc2NyaXB0aW9uKHNkcCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMucGMuc2V0TG9jYWxEZXNjcmlwdGlvbihcbiAgICAgIHNkcCxcbiAgICAgIGZ1bmN0aW9uKCkge30sXG4gICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBOQUYubG9nLmVycm9yKFwiV2ViUnRjUGVlci5oYW5kbGVTZXNzaW9uRGVzY3JpcHRpb246IFwiICsgZXJyb3IpO1xuICAgICAgfVxuICAgICk7XG5cbiAgICB0aGlzLnNlbmRTaWduYWxGdW5jKHtcbiAgICAgIGZyb206IHRoaXMubG9jYWxJZCxcbiAgICAgIHRvOiB0aGlzLnJlbW90ZUlkLFxuICAgICAgdHlwZTogc2RwLnR5cGUsXG4gICAgICBzZHA6IHNkcC5zZHBcbiAgICB9KTtcbiAgfVxuXG4gIHNldFJlbW90ZURlc2NyaXB0aW9uKG1lc3NhZ2UpIHtcbiAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgdmFyIFJUQ1Nlc3Npb25EZXNjcmlwdGlvbiA9XG4gICAgICB3aW5kb3cuUlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XG4gICAgICB3aW5kb3cud2Via2l0UlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XG4gICAgICB3aW5kb3cubW96UlRDU2Vzc2lvbkRlc2NyaXB0aW9uIHx8XG4gICAgICB3aW5kb3cubXNSVENTZXNzaW9uRGVzY3JpcHRpb247XG5cbiAgICB0aGlzLnBjLnNldFJlbW90ZURlc2NyaXB0aW9uKFxuICAgICAgbmV3IFJUQ1Nlc3Npb25EZXNjcmlwdGlvbihtZXNzYWdlKSxcbiAgICAgIGZ1bmN0aW9uKCkge30sXG4gICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBOQUYubG9nLmVycm9yKFwiV2ViUnRjUGVlci5zZXRSZW1vdGVEZXNjcmlwdGlvbjogXCIgKyBlcnJvcik7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGNsb3NlKCkge1xuICAgIGlmICh0aGlzLnBjKSB7XG4gICAgICB0aGlzLnBjLmNsb3NlKCk7XG4gICAgfVxuICB9XG59XG5cbldlYlJ0Y1BlZXIuSVNfQ09OTkVDVEVEID0gXCJJU19DT05ORUNURURcIjtcbldlYlJ0Y1BlZXIuQ09OTkVDVElORyA9IFwiQ09OTkVDVElOR1wiO1xuV2ViUnRjUGVlci5OT1RfQ09OTkVDVEVEID0gXCJOT1RfQ09OTkVDVEVEXCI7XG5cbldlYlJ0Y1BlZXIuSUNFX1NFUlZFUlMgPSBbXG4gIHsgdXJsczogXCJzdHVuOnN0dW4xLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH0sXG4gIHsgdXJsczogXCJzdHVuOnN0dW4yLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH0sXG4gIHsgdXJsczogXCJzdHVuOnN0dW4zLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH0sXG4gIHsgdXJsczogXCJzdHVuOnN0dW40LmwuZ29vZ2xlLmNvbToxOTMwMlwiIH1cbl07XG5cbm1vZHVsZS5leHBvcnRzID0gV2ViUnRjUGVlcjsiLCJjb25zdCBXZWJSdGNQZWVyID0gcmVxdWlyZShcIi4vV2ViUnRjUGVlclwiKTtcblxuLyoqXG4gKiBOYXRpdmUgV2ViUlRDIEFkYXB0ZXIgKG5hdGl2ZS13ZWJydGMpXG4gKiBGb3IgdXNlIHdpdGggdXdzLXNlcnZlci5qc1xuICogbmV0d29ya2VkLXNjZW5lOiBzZXJ2ZXJVUkwgbmVlZHMgdG8gYmUgd3M6Ly9sb2NhbGhvc3Q6ODA4MCB3aGVuIHJ1bm5pbmcgbG9jYWxseVxuICovXG5jbGFzcyBOYXRpdmVXZWJSdGNBZGFwdGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG4gICAgaWYgKGlvID09PSB1bmRlZmluZWQpXG4gICAgICBjb25zb2xlLndhcm4oJ0l0IGxvb2tzIGxpa2Ugc29ja2V0LmlvIGhhcyBub3QgYmVlbiBsb2FkZWQgYmVmb3JlIE5hdGl2ZVdlYlJ0Y0FkYXB0ZXIuIFBsZWFzZSBkbyB0aGF0LicpXG5cbiAgICB0aGlzLmFwcCA9IFwiZGVmYXVsdFwiO1xuICAgIHRoaXMucm9vbSA9IFwiZGVmYXVsdFwiO1xuICAgIHRoaXMub2NjdXBhbnRMaXN0ZW5lciA9IG51bGw7XG4gICAgdGhpcy5teVJvb21Kb2luVGltZSA9IG51bGw7XG4gICAgdGhpcy5teUlkID0gbnVsbDtcbiAgICB0aGlzLmF2Z1RpbWVPZmZzZXQgPSAwO1xuXG4gICAgdGhpcy5wZWVycyA9IHt9OyAvLyBpZCAtPiBXZWJSdGNQZWVyXG4gICAgdGhpcy5vY2N1cGFudHMgPSB7fTsgLy8gaWQgLT4gam9pblRpbWVzdGFtcFxuXG4gICAgdGhpcy5hdWRpb1N0cmVhbXMgPSB7fTtcbiAgICB0aGlzLnBlbmRpbmdBdWRpb1JlcXVlc3QgPSB7fTtcblxuICAgIHRoaXMuc2VydmVyVGltZVJlcXVlc3RzID0gMDtcbiAgICB0aGlzLnRpbWVPZmZzZXRzID0gW107XG4gICAgdGhpcy5hdmdUaW1lT2Zmc2V0ID0gMDtcbiAgfVxuXG4gIHNldFNlcnZlclVybCh3c1VybCkge1xuICAgIHRoaXMud3NVcmwgPSB3c1VybDtcbiAgfVxuXG4gIHNldEFwcChhcHBOYW1lKSB7XG4gICAgdGhpcy5hcHAgPSBhcHBOYW1lO1xuICB9XG5cbiAgc2V0Um9vbShyb29tTmFtZSkge1xuICAgIHRoaXMucm9vbSA9IHJvb21OYW1lO1xuICB9XG5cbiAgc2V0V2ViUnRjT3B0aW9ucyhvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuZGF0YWNoYW5uZWwgPT09IGZhbHNlKSB7XG4gICAgICBOQUYubG9nLmVycm9yKFxuICAgICAgICBcIk5hdGl2ZVdlYlJ0Y0FkYXB0ZXIuc2V0V2ViUnRjT3B0aW9uczogZGF0YWNoYW5uZWwgbXVzdCBiZSB0cnVlLlwiXG4gICAgICApO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy5hdWRpbyA9PT0gdHJ1ZSkge1xuICAgICAgdGhpcy5zZW5kQXVkaW8gPSB0cnVlO1xuICAgIH1cbiAgICBpZiAob3B0aW9ucy52aWRlbyA9PT0gdHJ1ZSkge1xuICAgICAgTkFGLmxvZy53YXJuKFwiTmF0aXZlV2ViUnRjQWRhcHRlciBkb2VzIG5vdCBzdXBwb3J0IHZpZGVvIHlldC5cIik7XG4gICAgfVxuICB9XG5cbiAgc2V0U2VydmVyQ29ubmVjdExpc3RlbmVycyhzdWNjZXNzTGlzdGVuZXIsIGZhaWx1cmVMaXN0ZW5lcikge1xuICAgIHRoaXMuY29ubmVjdFN1Y2Nlc3MgPSBzdWNjZXNzTGlzdGVuZXI7XG4gICAgdGhpcy5jb25uZWN0RmFpbHVyZSA9IGZhaWx1cmVMaXN0ZW5lcjtcbiAgfVxuXG4gIHNldFJvb21PY2N1cGFudExpc3RlbmVyKG9jY3VwYW50TGlzdGVuZXIpIHtcbiAgICB0aGlzLm9jY3VwYW50TGlzdGVuZXIgPSBvY2N1cGFudExpc3RlbmVyO1xuICB9XG5cbiAgc2V0RGF0YUNoYW5uZWxMaXN0ZW5lcnMob3Blbkxpc3RlbmVyLCBjbG9zZWRMaXN0ZW5lciwgbWVzc2FnZUxpc3RlbmVyKSB7XG4gICAgdGhpcy5vcGVuTGlzdGVuZXIgPSBvcGVuTGlzdGVuZXI7XG4gICAgdGhpcy5jbG9zZWRMaXN0ZW5lciA9IGNsb3NlZExpc3RlbmVyO1xuICAgIHRoaXMubWVzc2FnZUxpc3RlbmVyID0gbWVzc2FnZUxpc3RlbmVyO1xuICB9XG5cbiAgY29ubmVjdCgpIHtcbiAgICBjb25zdCBzZWxmID0gdGhpcztcblxuICAgIHRoaXMudXBkYXRlVGltZU9mZnNldCgpXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKCFzZWxmLndzVXJsIHx8IHNlbGYud3NVcmwgPT09IFwiL1wiKSB7XG4gICAgICAgIGlmIChsb2NhdGlvbi5wcm90b2NvbCA9PT0gXCJodHRwczpcIikge1xuICAgICAgICAgIHNlbGYud3NVcmwgPSBcIndzczovL1wiICsgbG9jYXRpb24uaG9zdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBzZWxmLndzVXJsID0gXCJ3czovL1wiICsgbG9jYXRpb24uaG9zdDtcbiAgICAgICAgfVxuICAgICAgfVxuICBcbiAgICAgIE5BRi5sb2cud3JpdGUoXCJBdHRlbXB0aW5nIHRvIGNvbm5lY3QgdG8gc29ja2V0LmlvXCIpO1xuICAgICAgY29uc3Qgc29ja2V0ID0gc2VsZi5zb2NrZXQgPSBpbyhzZWxmLndzVXJsKTtcbiAgXG4gICAgICBzb2NrZXQub24oXCJjb25uZWN0XCIsICgpID0+IHtcbiAgICAgICAgTkFGLmxvZy53cml0ZShcIlVzZXIgY29ubmVjdGVkXCIsIHNvY2tldC5pZCk7XG4gICAgICAgIHNlbGYubXlJZCA9IHNvY2tldC5pZDtcbiAgICAgICAgc2VsZi5qb2luUm9vbSgpO1xuICAgICAgfSk7XG4gIFxuICAgICAgc29ja2V0Lm9uKFwiY29ubmVjdFN1Y2Nlc3NcIiwgKGRhdGEpID0+IHtcbiAgICAgICAgY29uc3QgeyBqb2luZWRUaW1lIH0gPSBkYXRhO1xuICBcbiAgICAgICAgc2VsZi5teVJvb21Kb2luVGltZSA9IGpvaW5lZFRpbWU7XG4gICAgICAgIE5BRi5sb2cud3JpdGUoXCJTdWNjZXNzZnVsbHkgam9pbmVkIHJvb21cIiwgc2VsZi5yb29tLCBcImF0IHNlcnZlciB0aW1lXCIsIGpvaW5lZFRpbWUpO1xuICBcbiAgICAgICAgaWYgKHNlbGYuc2VuZEF1ZGlvKSB7XG4gICAgICAgICAgY29uc3QgbWVkaWFDb25zdHJhaW50cyA9IHtcbiAgICAgICAgICAgIGF1ZGlvOiB0cnVlLFxuICAgICAgICAgICAgdmlkZW86IGZhbHNlXG4gICAgICAgICAgfTtcbiAgICAgICAgICBuYXZpZ2F0b3IubWVkaWFEZXZpY2VzLmdldFVzZXJNZWRpYShtZWRpYUNvbnN0cmFpbnRzKVxuICAgICAgICAgIC50aGVuKGxvY2FsU3RyZWFtID0+IHtcbiAgICAgICAgICAgIHNlbGYuc3RvcmVBdWRpb1N0cmVhbShzZWxmLm15SWQsIGxvY2FsU3RyZWFtKTtcbiAgICAgICAgICAgIHNlbGYuY29ubmVjdFN1Y2Nlc3Moc2VsZi5teUlkKTtcbiAgICAgICAgICB9KVxuICAgICAgICAgIC5jYXRjaChlID0+IE5BRi5sb2cuZXJyb3IoZSkpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlbGYuY29ubmVjdFN1Y2Nlc3Moc2VsZi5teUlkKTtcbiAgICAgICAgfVxuICAgICAgfSk7XG4gIFxuICAgICAgc29ja2V0Lm9uKFwiZXJyb3JcIiwgZXJyID0+IHtcbiAgICAgICAgY29uc29sZS5lcnJvcihcIlNvY2tldCBjb25uZWN0aW9uIGZhaWx1cmVcIiwgZXJyKTtcbiAgICAgICAgc2VsZi5jb25uZWN0RmFpbHVyZSgpO1xuICAgICAgfSk7XG4gIFxuICAgICAgc29ja2V0Lm9uKFwib2NjdXBhbnRzQ2hhbmdlZFwiLCBkYXRhID0+IHtcbiAgICAgICAgY29uc3QgeyBvY2N1cGFudHMgfSA9IGRhdGE7XG4gICAgICAgIE5BRi5sb2cud3JpdGUoJ29jY3VwYW50cyBjaGFuZ2VkJywgZGF0YSk7XG4gICAgICAgIHNlbGYucmVjZWl2ZWRPY2N1cGFudHMob2NjdXBhbnRzKTtcbiAgICAgIH0pO1xuICBcbiAgICAgIGZ1bmN0aW9uIHJlY2VpdmVEYXRhKHBhY2tldCkge1xuICAgICAgICBjb25zdCBmcm9tID0gcGFja2V0LmZyb207XG4gICAgICAgIGNvbnN0IHR5cGUgPSBwYWNrZXQudHlwZTtcbiAgICAgICAgY29uc3QgZGF0YSA9IHBhY2tldC5kYXRhO1xuICAgICAgICBpZiAodHlwZSA9PT0gJ2ljZS1jYW5kaWRhdGUnKSB7XG4gICAgICAgICAgc2VsZi5wZWVyc1tmcm9tXS5oYW5kbGVTaWduYWwoZGF0YSk7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHNlbGYubWVzc2FnZUxpc3RlbmVyKGZyb20sIHR5cGUsIGRhdGEpO1xuICAgICAgfVxuICBcbiAgICAgIHNvY2tldC5vbihcInNlbmRcIiwgcmVjZWl2ZURhdGEpO1xuICAgICAgc29ja2V0Lm9uKFwiYnJvYWRjYXN0XCIsIHJlY2VpdmVEYXRhKTtcbiAgICB9KVxuXG5cbiAgfVxuXG4gIGpvaW5Sb29tKCkge1xuICAgIE5BRi5sb2cud3JpdGUoXCJKb2luaW5nIHJvb21cIiwgdGhpcy5yb29tKTtcbiAgICB0aGlzLnNvY2tldC5lbWl0KFwiam9pblJvb21cIiwgeyByb29tOiB0aGlzLnJvb20gfSk7XG4gIH1cblxuICByZWNlaXZlZE9jY3VwYW50cyhvY2N1cGFudHMpIHtcbiAgICBkZWxldGUgb2NjdXBhbnRzW3RoaXMubXlJZF07XG5cbiAgICB0aGlzLm9jY3VwYW50cyA9IG9jY3VwYW50cztcblxuICAgIE5BRi5sb2cud3JpdGUoJ29jY3VwYW50cz0nLCBvY2N1cGFudHMpO1xuICAgIGNvbnN0IHNlbGYgPSB0aGlzO1xuICAgIGNvbnN0IGxvY2FsSWQgPSB0aGlzLm15SWQ7XG5cbiAgICBmb3IgKHZhciBrZXkgaW4gb2NjdXBhbnRzKSB7XG4gICAgICBjb25zdCByZW1vdGVJZCA9IGtleTtcbiAgICAgIGlmICh0aGlzLnBlZXJzW3JlbW90ZUlkXSkgY29udGludWU7XG5cbiAgICAgIGNvbnN0IHBlZXIgPSBuZXcgV2ViUnRjUGVlcihcbiAgICAgICAgbG9jYWxJZCxcbiAgICAgICAgcmVtb3RlSWQsXG4gICAgICAgIChkYXRhKSA9PiB7XG4gICAgICAgICAgc2VsZi5zb2NrZXQuZW1pdCgnc2VuZCcse1xuICAgICAgICAgICAgZnJvbTogbG9jYWxJZCxcbiAgICAgICAgICAgIHRvOiByZW1vdGVJZCxcbiAgICAgICAgICAgIHR5cGU6ICdpY2UtY2FuZGlkYXRlJyxcbiAgICAgICAgICAgIGRhdGEsXG4gICAgICAgICAgICBzZW5kaW5nOiB0cnVlLFxuICAgICAgICAgIH0pO1xuICAgICAgICB9XG4gICAgICApO1xuICAgICAgcGVlci5zZXREYXRhY2hhbm5lbExpc3RlbmVycyhcbiAgICAgICAgc2VsZi5vcGVuTGlzdGVuZXIsXG4gICAgICAgIHNlbGYuY2xvc2VkTGlzdGVuZXIsXG4gICAgICAgIHNlbGYubWVzc2FnZUxpc3RlbmVyLFxuICAgICAgICBzZWxmLnRyYWNrTGlzdGVuZXIuYmluZChzZWxmKVxuICAgICAgKTtcblxuICAgICAgc2VsZi5wZWVyc1tyZW1vdGVJZF0gPSBwZWVyO1xuICAgIH1cblxuICAgIHRoaXMub2NjdXBhbnRMaXN0ZW5lcihvY2N1cGFudHMpO1xuICB9XG5cbiAgc2hvdWxkU3RhcnRDb25uZWN0aW9uVG8oY2xpZW50KSB7XG4gICAgcmV0dXJuICh0aGlzLm15Um9vbUpvaW5UaW1lIHx8IDApIDw9IChjbGllbnQgfHwgMCk7XG4gIH1cblxuICBzdGFydFN0cmVhbUNvbm5lY3Rpb24ocmVtb3RlSWQpIHtcbiAgICBOQUYubG9nLndyaXRlKCdzdGFydGluZyBvZmZlciBwcm9jZXNzJyk7XG5cbiAgICBpZiAodGhpcy5zZW5kQXVkaW8pIHtcbiAgICAgIHRoaXMuZ2V0TWVkaWFTdHJlYW0odGhpcy5teUlkKVxuICAgICAgLnRoZW4oc3RyZWFtID0+IHtcbiAgICAgICAgY29uc3Qgb3B0aW9ucyA9IHtcbiAgICAgICAgICBzZW5kQXVkaW86IHRydWUsXG4gICAgICAgICAgbG9jYWxBdWRpb1N0cmVhbTogc3RyZWFtLFxuICAgICAgICB9O1xuICAgICAgICB0aGlzLnBlZXJzW3JlbW90ZUlkXS5vZmZlcihvcHRpb25zKTtcbiAgICAgIH0pO1xuICAgIH0gZWxzZSB7XG4gICAgICB0aGlzLnBlZXJzW3JlbW90ZUlkXS5vZmZlcih7fSk7XG4gICAgfVxuICB9XG5cbiAgY2xvc2VTdHJlYW1Db25uZWN0aW9uKGNsaWVudElkKSB7XG4gICAgTkFGLmxvZy53cml0ZSgnY2xvc2VTdHJlYW1Db25uZWN0aW9uJywgY2xpZW50SWQsIHRoaXMucGVlcnMpO1xuICAgIHRoaXMucGVlcnNbY2xpZW50SWRdLmNsb3NlKCk7XG4gICAgZGVsZXRlIHRoaXMucGVlcnNbY2xpZW50SWRdO1xuICAgIGRlbGV0ZSB0aGlzLm9jY3VwYW50c1tjbGllbnRJZF07XG4gICAgdGhpcy5jbG9zZWRMaXN0ZW5lcihjbGllbnRJZCk7XG4gIH1cblxuICBnZXRDb25uZWN0U3RhdHVzKGNsaWVudElkKSB7XG4gICAgY29uc3QgcGVlciA9IHRoaXMucGVlcnNbY2xpZW50SWRdO1xuXG4gICAgaWYgKHBlZXIgPT09IHVuZGVmaW5lZCkgcmV0dXJuIE5BRi5hZGFwdGVycy5OT1RfQ09OTkVDVEVEO1xuXG4gICAgc3dpdGNoIChwZWVyLmdldFN0YXR1cygpKSB7XG4gICAgICBjYXNlIFdlYlJ0Y1BlZXIuSVNfQ09OTkVDVEVEOlxuICAgICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLklTX0NPTk5FQ1RFRDtcblxuICAgICAgY2FzZSBXZWJSdGNQZWVyLkNPTk5FQ1RJTkc6XG4gICAgICAgIHJldHVybiBOQUYuYWRhcHRlcnMuQ09OTkVDVElORztcblxuICAgICAgY2FzZSBXZWJSdGNQZWVyLk5PVF9DT05ORUNURUQ6XG4gICAgICBkZWZhdWx0OlxuICAgICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLk5PVF9DT05ORUNURUQ7XG4gICAgfVxuICB9XG5cbiAgc2VuZERhdGEodG8sIHR5cGUsIGRhdGEpIHtcbiAgICB0aGlzLnBlZXJzW3RvXS5zZW5kKHR5cGUsIGRhdGEpO1xuICB9XG5cbiAgc2VuZERhdGFHdWFyYW50ZWVkKHRvLCB0eXBlLCBkYXRhKSB7XG4gICAgY29uc3QgcGFja2V0ID0ge1xuICAgICAgZnJvbTogdGhpcy5teUlkLFxuICAgICAgdG8sXG4gICAgICB0eXBlLFxuICAgICAgZGF0YSxcbiAgICAgIHNlbmRpbmc6IHRydWUsXG4gICAgfTtcblxuICAgIHRoaXMuc29ja2V0LmVtaXQoXCJzZW5kXCIsIHBhY2tldCk7XG4gIH1cblxuICBicm9hZGNhc3REYXRhKHR5cGUsIGRhdGEpIHtcbiAgICBmb3IgKHZhciBjbGllbnRJZCBpbiB0aGlzLnBlZXJzKSB7XG4gICAgICB0aGlzLnNlbmREYXRhKGNsaWVudElkLCB0eXBlLCBkYXRhKTtcbiAgICB9XG4gIH1cblxuICBicm9hZGNhc3REYXRhR3VhcmFudGVlZCh0eXBlLCBkYXRhKSB7XG4gICAgY29uc3QgcGFja2V0ID0ge1xuICAgICAgZnJvbTogdGhpcy5teUlkLFxuICAgICAgdHlwZSxcbiAgICAgIGRhdGEsXG4gICAgICBicm9hZGNhc3Rpbmc6IHRydWVcbiAgICB9O1xuICAgIHRoaXMuc29ja2V0LmVtaXQoXCJicm9hZGNhc3RcIiwgcGFja2V0KTtcbiAgfVxuXG4gIHN0b3JlQXVkaW9TdHJlYW0oY2xpZW50SWQsIHN0cmVhbSkge1xuICAgIHRoaXMuYXVkaW9TdHJlYW1zW2NsaWVudElkXSA9IHN0cmVhbTtcbiAgICBpZiAodGhpcy5wZW5kaW5nQXVkaW9SZXF1ZXN0W2NsaWVudElkXSkge1xuICAgICAgTkFGLmxvZy53cml0ZShcIlJlY2VpdmVkIHBlbmRpbmcgYXVkaW8gZm9yIFwiICsgY2xpZW50SWQpO1xuICAgICAgdGhpcy5wZW5kaW5nQXVkaW9SZXF1ZXN0W2NsaWVudElkXShzdHJlYW0pO1xuICAgICAgZGVsZXRlIHRoaXMucGVuZGluZ0F1ZGlvUmVxdWVzdFtjbGllbnRJZF0oc3RyZWFtKTtcbiAgICB9XG4gIH1cblxuICB0cmFja0xpc3RlbmVyKGNsaWVudElkLCBzdHJlYW0pIHtcbiAgICB0aGlzLnN0b3JlQXVkaW9TdHJlYW0oY2xpZW50SWQsIHN0cmVhbSk7XG4gIH1cblxuICBnZXRNZWRpYVN0cmVhbShjbGllbnRJZCkge1xuICAgIHZhciB0aGF0ID0gdGhpcztcbiAgICBpZiAodGhpcy5hdWRpb1N0cmVhbXNbY2xpZW50SWRdKSB7XG4gICAgICBOQUYubG9nLndyaXRlKFwiQWxyZWFkeSBoYWQgYXVkaW8gZm9yIFwiICsgY2xpZW50SWQpO1xuICAgICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZSh0aGlzLmF1ZGlvU3RyZWFtc1tjbGllbnRJZF0pO1xuICAgIH0gZWxzZSB7XG4gICAgICBOQUYubG9nLndyaXRlKFwiV2FpdGluZyBvbiBhdWRpbyBmb3IgXCIgKyBjbGllbnRJZCk7XG4gICAgICByZXR1cm4gbmV3IFByb21pc2UocmVzb2x2ZSA9PiB7XG4gICAgICAgIHRoYXQucGVuZGluZ0F1ZGlvUmVxdWVzdFtjbGllbnRJZF0gPSByZXNvbHZlO1xuICAgICAgfSk7XG4gICAgfVxuICB9XG5cbiAgdXBkYXRlVGltZU9mZnNldCgpIHtcbiAgICBjb25zdCBjbGllbnRTZW50VGltZSA9IERhdGUubm93KCkgKyB0aGlzLmF2Z1RpbWVPZmZzZXQ7XG5cbiAgICByZXR1cm4gZmV0Y2goZG9jdW1lbnQubG9jYXRpb24uaHJlZiwgeyBtZXRob2Q6IFwiSEVBRFwiLCBjYWNoZTogXCJuby1jYWNoZVwiIH0pXG4gICAgICAudGhlbihyZXMgPT4ge1xuICAgICAgICB2YXIgcHJlY2lzaW9uID0gMTAwMDtcbiAgICAgICAgdmFyIHNlcnZlclJlY2VpdmVkVGltZSA9IG5ldyBEYXRlKHJlcy5oZWFkZXJzLmdldChcIkRhdGVcIikpLmdldFRpbWUoKSArIChwcmVjaXNpb24gLyAyKTtcbiAgICAgICAgdmFyIGNsaWVudFJlY2VpdmVkVGltZSA9IERhdGUubm93KCk7XG4gICAgICAgIHZhciBzZXJ2ZXJUaW1lID0gc2VydmVyUmVjZWl2ZWRUaW1lICsgKChjbGllbnRSZWNlaXZlZFRpbWUgLSBjbGllbnRTZW50VGltZSkgLyAyKTtcbiAgICAgICAgdmFyIHRpbWVPZmZzZXQgPSBzZXJ2ZXJUaW1lIC0gY2xpZW50UmVjZWl2ZWRUaW1lO1xuXG4gICAgICAgIHRoaXMuc2VydmVyVGltZVJlcXVlc3RzKys7XG5cbiAgICAgICAgaWYgKHRoaXMuc2VydmVyVGltZVJlcXVlc3RzIDw9IDEwKSB7XG4gICAgICAgICAgdGhpcy50aW1lT2Zmc2V0cy5wdXNoKHRpbWVPZmZzZXQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudGltZU9mZnNldHNbdGhpcy5zZXJ2ZXJUaW1lUmVxdWVzdHMgJSAxMF0gPSB0aW1lT2Zmc2V0O1xuICAgICAgICB9XG5cbiAgICAgICAgdGhpcy5hdmdUaW1lT2Zmc2V0ID0gdGhpcy50aW1lT2Zmc2V0cy5yZWR1Y2UoKGFjYywgb2Zmc2V0KSA9PiBhY2MgKz0gb2Zmc2V0LCAwKSAvIHRoaXMudGltZU9mZnNldHMubGVuZ3RoO1xuXG4gICAgICAgIGlmICh0aGlzLnNlcnZlclRpbWVSZXF1ZXN0cyA+IDEwKSB7XG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB0aGlzLnVwZGF0ZVRpbWVPZmZzZXQoKSwgNSAqIDYwICogMTAwMCk7IC8vIFN5bmMgY2xvY2sgZXZlcnkgNSBtaW51dGVzLlxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHRoaXMudXBkYXRlVGltZU9mZnNldCgpO1xuICAgICAgICB9XG4gICAgICB9KTtcbiAgfVxuXG4gIGdldFNlcnZlclRpbWUoKSB7XG4gICAgcmV0dXJuIC0xOyAvLyBUT0RPIGltcGxlbWVudFxuICB9XG59XG5cbk5BRi5hZGFwdGVycy5yZWdpc3RlcihcIm5hdGl2ZS13ZWJydGNcIiwgTmF0aXZlV2ViUnRjQWRhcHRlcik7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF0aXZlV2ViUnRjQWRhcHRlcjtcbiJdLCJzb3VyY2VSb290IjoiIn0=