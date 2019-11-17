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
    this.connectedClients = [];
    this.occupantListener = null;

    this.peers = {}; // id -> WebRtcPeer
    this.occupants = {}; // id -> TODO: joinTimestamp
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

      console.log("Attempting to connect to socket.io");
      var socket = this.socket = io(this.wsUrl);

      socket.on("connect", function () {
        console.log("User connected", socket.id);
        self.joinRoom();
      });

      socket.on("connectSuccess", function () {
        console.log("Successfully joined room", _this.room);
        self.connectSuccess(socket.id);
      });

      socket.on("error", function (err) {
        console.error("Socket connection failure", err);
        self.connectFailure();
      });

      socket.on("occupantsChanged", function (data) {
        var occupants = data.occupants;

        console.log('occupants changed', data);
        self.receivedOccupants(occupants);
      });

      function receiveData(packet) {
        var from = packet.from;
        var type = packet.type;
        var data = packet.data;
        console.log('received data', packet);
        self.messageListener(from, type, data);
      }

      socket.on("send", receiveData);
      socket.on("broadcast", receiveData);
    }
  }, {
    key: "joinRoom",
    value: function joinRoom() {
      console.log("Joining room", this.room);
      this.socket.emit("joinRoom", { room: this.room });
    }
  }, {
    key: "receivedOccupants",
    value: function receivedOccupants(occupants) {
      delete occupants[NAF.clientId];
      this.occupantListener(occupants);
    }
  }, {
    key: "shouldStartConnectionTo",
    value: function shouldStartConnectionTo(clientId) {
      return true; // Handled elsewhere
    }
  }, {
    key: "startStreamConnection",
    value: function startStreamConnection(clientId) {
      this.connectedClients.push(clientId);
      this.openListener(clientId);
    }
  }, {
    key: "closeStreamConnection",
    value: function closeStreamConnection(clientId) {
      var index = this.connectedClients.indexOf(clientId);
      if (index > -1) {
        this.connectedClients.splice(index, 1);
      }
      this.closedListener(clientId);
    }
  }, {
    key: "getConnectStatus",
    value: function getConnectStatus(clientId) {
      var connected = this.connectedClients.indexOf(clientId) != -1;

      if (connected) {
        return NAF.adapters.IS_CONNECTED;
      } else {
        return NAF.adapters.NOT_CONNECTED;
      }
    }
  }, {
    key: "sendData",
    value: function sendData(to, type, data) {
      this.sendDataGuaranteed(to, type, data);
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
      this.broadcastDataGuaranteed(type, data);
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
      return Promise.reject('Interface method not implemented: getMediaStream');
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
        console.error("WebRtcPeer.offer: " + error);
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
          console.error("WebRtcPeer.handleSignal: Unknown signal type " + signal.type);
          break;
      }
    }
  }, {
    key: "send",
    value: function send(type, data) {
      // TODO: throw error?
      if (this.channel === null || this.channel.readyState !== "open") return;

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
        console.error("WebRtcPeer.channel.onerror: " + error);
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
        console.error("WebRtcPeer.handleOffer: " + error);
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
        console.error("WebRtcPeer.handleCandidate: " + error);
      });
    }
  }, {
    key: "handleSessionDescription",
    value: function handleSessionDescription(sdp) {
      var self = this;

      this.pc.setLocalDescription(sdp, function () {}, function (error) {
        console.error("WebRtcPeer.handleSessionDescription: " + error);
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
        console.error("WebRtcPeer.setRemoteDescription: " + error);
      });
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIndlYnBhY2s6Ly8vd2VicGFjay9ib290c3RyYXAgZWU0NWMzZTMzMTFlMTc1ZGFmZjQiLCJ3ZWJwYWNrOi8vLy4vc3JjL2luZGV4LmpzIiwid2VicGFjazovLy8uL3NyYy9XZWJSdGNQZWVyLmpzIl0sIm5hbWVzIjpbIldlYlJ0Y1BlZXIiLCJyZXF1aXJlIiwiTmF0aXZlV2ViUnRjQWRhcHRlciIsImlvIiwidW5kZWZpbmVkIiwiY29uc29sZSIsIndhcm4iLCJhcHAiLCJyb29tIiwiY29ubmVjdGVkQ2xpZW50cyIsIm9jY3VwYW50TGlzdGVuZXIiLCJwZWVycyIsIm9jY3VwYW50cyIsIndzVXJsIiwiYXBwTmFtZSIsInJvb21OYW1lIiwib3B0aW9ucyIsImRhdGFjaGFubmVsIiwiYXVkaW8iLCJ2aWRlbyIsInN1Y2Nlc3NMaXN0ZW5lciIsImZhaWx1cmVMaXN0ZW5lciIsImNvbm5lY3RTdWNjZXNzIiwiY29ubmVjdEZhaWx1cmUiLCJvcGVuTGlzdGVuZXIiLCJjbG9zZWRMaXN0ZW5lciIsIm1lc3NhZ2VMaXN0ZW5lciIsInNlbGYiLCJsb2NhdGlvbiIsInByb3RvY29sIiwiaG9zdCIsImxvZyIsInNvY2tldCIsIm9uIiwiaWQiLCJqb2luUm9vbSIsImVycm9yIiwiZXJyIiwiZGF0YSIsInJlY2VpdmVkT2NjdXBhbnRzIiwicmVjZWl2ZURhdGEiLCJwYWNrZXQiLCJmcm9tIiwidHlwZSIsImVtaXQiLCJOQUYiLCJjbGllbnRJZCIsInB1c2giLCJpbmRleCIsImluZGV4T2YiLCJzcGxpY2UiLCJjb25uZWN0ZWQiLCJhZGFwdGVycyIsIklTX0NPTk5FQ1RFRCIsIk5PVF9DT05ORUNURUQiLCJ0byIsInNlbmREYXRhR3VhcmFudGVlZCIsInNlbmRpbmciLCJicm9hZGNhc3REYXRhR3VhcmFudGVlZCIsImJyb2FkY2FzdGluZyIsIlByb21pc2UiLCJyZWplY3QiLCJyZWdpc3RlciIsIm1vZHVsZSIsImV4cG9ydHMiLCJsb2NhbElkIiwicmVtb3RlSWQiLCJzZW5kU2lnbmFsRnVuYyIsIm9wZW4iLCJjaGFubmVsTGFiZWwiLCJwYyIsImNyZWF0ZVBlZXJDb25uZWN0aW9uIiwiY2hhbm5lbCIsInNldHVwQ2hhbm5lbCIsImNyZWF0ZURhdGFDaGFubmVsIiwicmVsaWFibGUiLCJjcmVhdGVPZmZlciIsInNkcCIsImhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbiIsInNpZ25hbCIsImhhbmRsZU9mZmVyIiwiaGFuZGxlQW5zd2VyIiwiaGFuZGxlQ2FuZGlkYXRlIiwicmVhZHlTdGF0ZSIsInNlbmQiLCJKU09OIiwic3RyaW5naWZ5IiwiQ09OTkVDVElORyIsIlJUQ1BlZXJDb25uZWN0aW9uIiwid2luZG93Iiwid2Via2l0UlRDUGVlckNvbm5lY3Rpb24iLCJtb3pSVENQZWVyQ29ubmVjdGlvbiIsIm1zUlRDUGVlckNvbm5lY3Rpb24iLCJFcnJvciIsImljZVNlcnZlcnMiLCJJQ0VfU0VSVkVSUyIsIm9uaWNlY2FuZGlkYXRlIiwiZXZlbnQiLCJjYW5kaWRhdGUiLCJzZHBNTGluZUluZGV4Iiwib25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2UiLCJpY2VDb25uZWN0aW9uU3RhdGUiLCJvbm1lc3NhZ2UiLCJwYXJzZSIsIm9ub3BlbiIsIm9uY2xvc2UiLCJvbmVycm9yIiwibWVzc2FnZSIsIm9uZGF0YWNoYW5uZWwiLCJzZXRSZW1vdGVEZXNjcmlwdGlvbiIsImNyZWF0ZUFuc3dlciIsIlJUQ0ljZUNhbmRpZGF0ZSIsIndlYmtpdFJUQ0ljZUNhbmRpZGF0ZSIsIm1velJUQ0ljZUNhbmRpZGF0ZSIsImFkZEljZUNhbmRpZGF0ZSIsInNldExvY2FsRGVzY3JpcHRpb24iLCJSVENTZXNzaW9uRGVzY3JpcHRpb24iLCJ3ZWJraXRSVENTZXNzaW9uRGVzY3JpcHRpb24iLCJtb3pSVENTZXNzaW9uRGVzY3JpcHRpb24iLCJtc1JUQ1Nlc3Npb25EZXNjcmlwdGlvbiIsInVybHMiXSwibWFwcGluZ3MiOiI7UUFBQTtRQUNBOztRQUVBO1FBQ0E7O1FBRUE7UUFDQTtRQUNBO1FBQ0E7UUFD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LEVBRUUsWUFBVyxDQUFFLENBRmYsRUFHRSxVQUFTdkUsS0FBVCxFQUFnQjtBQUNkL0IsZ0JBQVErQixLQUFSLENBQWMsc0NBQXNDQSxLQUFwRDtBQUNELE9BTEg7QUFPRDs7Ozs7O0FBR0hwQyxXQUFXcUQsWUFBWCxHQUEwQixjQUExQjtBQUNBckQsV0FBV3VGLFVBQVgsR0FBd0IsWUFBeEI7QUFDQXZGLFdBQVdzRCxhQUFYLEdBQTJCLGVBQTNCOztBQUVBdEQsV0FBVytGLFdBQVgsR0FBeUIsQ0FDdkIsRUFBRXlCLE1BQU0sK0JBQVIsRUFEdUIsRUFFdkIsRUFBRUEsTUFBTSwrQkFBUixFQUZ1QixFQUd2QixFQUFFQSxNQUFNLCtCQUFSLEVBSHVCLEVBSXZCLEVBQUVBLE1BQU0sK0JBQVIsRUFKdUIsQ0FBekI7O0FBT0F6RCxPQUFPQyxPQUFQLEdBQWlCaEUsVUFBakIsQyIsImZpbGUiOiJuYWYtbmF0aXZlLXdlYnJ0Yy1hZGFwdGVyLmpzIiwic291cmNlc0NvbnRlbnQiOlsiIFx0Ly8gVGhlIG1vZHVsZSBjYWNoZVxuIFx0dmFyIGluc3RhbGxlZE1vZHVsZXMgPSB7fTtcblxuIFx0Ly8gVGhlIHJlcXVpcmUgZnVuY3Rpb25cbiBcdGZ1bmN0aW9uIF9fd2VicGFja19yZXF1aXJlX18obW9kdWxlSWQpIHtcblxuIFx0XHQvLyBDaGVjayBpZiBtb2R1bGUgaXMgaW4gY2FjaGVcbiBcdFx0aWYoaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0pIHtcbiBcdFx0XHRyZXR1cm4gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0uZXhwb3J0cztcbiBcdFx0fVxuIFx0XHQvLyBDcmVhdGUgYSBuZXcgbW9kdWxlIChhbmQgcHV0IGl0IGludG8gdGhlIGNhY2hlKVxuIFx0XHR2YXIgbW9kdWxlID0gaW5zdGFsbGVkTW9kdWxlc1ttb2R1bGVJZF0gPSB7XG4gXHRcdFx0aTogbW9kdWxlSWQsXG4gXHRcdFx0bDogZmFsc2UsXG4gXHRcdFx0ZXhwb3J0czoge31cbiBcdFx0fTtcblxuIFx0XHQvLyBFeGVjdXRlIHRoZSBtb2R1bGUgZnVuY3Rpb25cbiBcdFx0bW9kdWxlc1ttb2R1bGVJZF0uY2FsbChtb2R1bGUuZXhwb3J0cywgbW9kdWxlLCBtb2R1bGUuZXhwb3J0cywgX193ZWJwYWNrX3JlcXVpcmVfXyk7XG5cbiBcdFx0Ly8gRmxhZyB0aGUgbW9kdWxlIGFzIGxvYWRlZFxuIFx0XHRtb2R1bGUubCA9IHRydWU7XG5cbiBcdFx0Ly8gUmV0dXJuIHRoZSBleHBvcnRzIG9mIHRoZSBtb2R1bGVcbiBcdFx0cmV0dXJuIG1vZHVsZS5leHBvcnRzO1xuIFx0fVxuXG5cbiBcdC8vIGV4cG9zZSB0aGUgbW9kdWxlcyBvYmplY3QgKF9fd2VicGFja19tb2R1bGVzX18pXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm0gPSBtb2R1bGVzO1xuXG4gXHQvLyBleHBvc2UgdGhlIG1vZHVsZSBjYWNoZVxuIFx0X193ZWJwYWNrX3JlcXVpcmVfXy5jID0gaW5zdGFsbGVkTW9kdWxlcztcblxuIFx0Ly8gZGVmaW5lIGdldHRlciBmdW5jdGlvbiBmb3IgaGFybW9ueSBleHBvcnRzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQgPSBmdW5jdGlvbihleHBvcnRzLCBuYW1lLCBnZXR0ZXIpIHtcbiBcdFx0aWYoIV9fd2VicGFja19yZXF1aXJlX18ubyhleHBvcnRzLCBuYW1lKSkge1xuIFx0XHRcdE9iamVjdC5kZWZpbmVQcm9wZXJ0eShleHBvcnRzLCBuYW1lLCB7XG4gXHRcdFx0XHRjb25maWd1cmFibGU6IGZhbHNlLFxuIFx0XHRcdFx0ZW51bWVyYWJsZTogdHJ1ZSxcbiBcdFx0XHRcdGdldDogZ2V0dGVyXG4gXHRcdFx0fSk7XG4gXHRcdH1cbiBcdH07XG5cbiBcdC8vIGdldERlZmF1bHRFeHBvcnQgZnVuY3Rpb24gZm9yIGNvbXBhdGliaWxpdHkgd2l0aCBub24taGFybW9ueSBtb2R1bGVzXG4gXHRfX3dlYnBhY2tfcmVxdWlyZV9fLm4gPSBmdW5jdGlvbihtb2R1bGUpIHtcbiBcdFx0dmFyIGdldHRlciA9IG1vZHVsZSAmJiBtb2R1bGUuX19lc01vZHVsZSA/XG4gXHRcdFx0ZnVuY3Rpb24gZ2V0RGVmYXVsdCgpIHsgcmV0dXJuIG1vZHVsZVsnZGVmYXVsdCddOyB9IDpcbiBcdFx0XHRmdW5jdGlvbiBnZXRNb2R1bGVFeHBvcnRzKCkgeyByZXR1cm4gbW9kdWxlOyB9O1xuIFx0XHRfX3dlYnBhY2tfcmVxdWlyZV9fLmQoZ2V0dGVyLCAnYScsIGdldHRlcik7XG4gXHRcdHJldHVybiBnZXR0ZXI7XG4gXHR9O1xuXG4gXHQvLyBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGxcbiBcdF9fd2VicGFja19yZXF1aXJlX18ubyA9IGZ1bmN0aW9uKG9iamVjdCwgcHJvcGVydHkpIHsgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChvYmplY3QsIHByb3BlcnR5KTsgfTtcblxuIFx0Ly8gX193ZWJwYWNrX3B1YmxpY19wYXRoX19cbiBcdF9fd2VicGFja19yZXF1aXJlX18ucCA9IFwiXCI7XG5cbiBcdC8vIExvYWQgZW50cnkgbW9kdWxlIGFuZCByZXR1cm4gZXhwb3J0c1xuIFx0cmV0dXJuIF9fd2VicGFja19yZXF1aXJlX18oX193ZWJwYWNrX3JlcXVpcmVfXy5zID0gMCk7XG5cblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gd2VicGFjay9ib290c3RyYXAgZWU0NWMzZTMzMTFlMTc1ZGFmZjQiLCJjb25zdCBXZWJSdGNQZWVyID0gcmVxdWlyZShcIi4vV2ViUnRjUGVlclwiKTtcblxuLyoqXG4gKiBOYXRpdmUgV2ViUlRDIEFkYXB0ZXIgKG5hdGl2ZS13ZWJydGMpXG4gKiBGb3IgdXNlIHdpdGggdXdzLXNlcnZlci5qc1xuICogbmV0d29ya2VkLXNjZW5lOiBzZXJ2ZXJVUkwgbmVlZHMgdG8gYmUgd3M6Ly9sb2NhbGhvc3Q6ODA4MCB3aGVuIHJ1bm5pbmcgbG9jYWxseVxuICovXG5jbGFzcyBOYXRpdmVXZWJSdGNBZGFwdGVyIHtcbiAgY29uc3RydWN0b3IoKSB7XG5cbiAgICBpZiAoaW8gPT09IHVuZGVmaW5lZClcbiAgICAgIGNvbnNvbGUud2FybignSXQgbG9va3MgbGlrZSBzb2NrZXQuaW8gaGFzIG5vdCBiZWVuIGxvYWRlZCBiZWZvcmUgTmF0aXZlV2ViUnRjQWRhcHRlci4gUGxlYXNlIGRvIHRoYXQuJylcblxuICAgIHRoaXMuYXBwID0gXCJkZWZhdWx0XCI7XG4gICAgdGhpcy5yb29tID0gXCJkZWZhdWx0XCI7XG4gICAgdGhpcy5jb25uZWN0ZWRDbGllbnRzID0gW107XG4gICAgdGhpcy5vY2N1cGFudExpc3RlbmVyID0gbnVsbDtcblxuICAgIHRoaXMucGVlcnMgPSB7fTsgLy8gaWQgLT4gV2ViUnRjUGVlclxuICAgIHRoaXMub2NjdXBhbnRzID0ge307IC8vIGlkIC0+IFRPRE86IGpvaW5UaW1lc3RhbXBcbiAgfVxuXG4gIHNldFNlcnZlclVybCh3c1VybCkge1xuICAgIHRoaXMud3NVcmwgPSB3c1VybDtcbiAgfVxuXG4gIHNldEFwcChhcHBOYW1lKSB7XG4gICAgdGhpcy5hcHAgPSBhcHBOYW1lO1xuICB9XG5cbiAgc2V0Um9vbShyb29tTmFtZSkge1xuICAgIHRoaXMucm9vbSA9IHJvb21OYW1lO1xuICB9XG5cbiAgc2V0V2ViUnRjT3B0aW9ucyhvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMuZGF0YWNoYW5uZWwgPT09IGZhbHNlKVxuICAgICAgY29uc29sZS53YXJuKFxuICAgICAgICBcIk5hdGl2ZVdlYlJ0Y0FkYXB0ZXIuc2V0V2ViUnRjT3B0aW9uczogZGF0YWNoYW5uZWwgbXVzdCBiZSB0cnVlLlwiXG4gICAgICApO1xuICAgIGlmIChvcHRpb25zLmF1ZGlvID09PSB0cnVlKVxuICAgICAgY29uc29sZS53YXJuKFwiTmF0aXZlV2ViUnRjQWRhcHRlciBkb2VzIG5vdCBzdXBwb3J0IGF1ZGlvIHlldC5cIik7XG4gICAgaWYgKG9wdGlvbnMudmlkZW8gPT09IHRydWUpXG4gICAgICBjb25zb2xlLndhcm4oXCJOYXRpdmVXZWJSdGNBZGFwdGVyIGRvZXMgbm90IHN1cHBvcnQgdmlkZW8geWV0LlwiKTtcbiAgfVxuXG4gIHNldFNlcnZlckNvbm5lY3RMaXN0ZW5lcnMoc3VjY2Vzc0xpc3RlbmVyLCBmYWlsdXJlTGlzdGVuZXIpIHtcbiAgICB0aGlzLmNvbm5lY3RTdWNjZXNzID0gc3VjY2Vzc0xpc3RlbmVyO1xuICAgIHRoaXMuY29ubmVjdEZhaWx1cmUgPSBmYWlsdXJlTGlzdGVuZXI7XG4gIH1cblxuICBzZXRSb29tT2NjdXBhbnRMaXN0ZW5lcihvY2N1cGFudExpc3RlbmVyKSB7XG4gICAgdGhpcy5vY2N1cGFudExpc3RlbmVyID0gb2NjdXBhbnRMaXN0ZW5lcjtcbiAgfVxuXG4gIHNldERhdGFDaGFubmVsTGlzdGVuZXJzKG9wZW5MaXN0ZW5lciwgY2xvc2VkTGlzdGVuZXIsIG1lc3NhZ2VMaXN0ZW5lcikge1xuICAgIHRoaXMub3Blbkxpc3RlbmVyID0gb3Blbkxpc3RlbmVyO1xuICAgIHRoaXMuY2xvc2VkTGlzdGVuZXIgPSBjbG9zZWRMaXN0ZW5lcjtcbiAgICB0aGlzLm1lc3NhZ2VMaXN0ZW5lciA9IG1lc3NhZ2VMaXN0ZW5lcjtcbiAgfVxuXG4gIGNvbm5lY3QoKSB7XG4gICAgY29uc3Qgc2VsZiA9IHRoaXM7XG5cbiAgICBpZiAoIXRoaXMud3NVcmwgfHwgdGhpcy53c1VybCA9PT0gXCIvXCIpIHtcbiAgICAgIGlmIChsb2NhdGlvbi5wcm90b2NvbCA9PT0gXCJodHRwczpcIikge1xuICAgICAgICB0aGlzLndzVXJsID0gXCJ3c3M6Ly9cIiArIGxvY2F0aW9uLmhvc3Q7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLndzVXJsID0gXCJ3czovL1wiICsgbG9jYXRpb24uaG9zdDtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBjb25zb2xlLmxvZyhcIkF0dGVtcHRpbmcgdG8gY29ubmVjdCB0byBzb2NrZXQuaW9cIik7XG4gICAgY29uc3Qgc29ja2V0ID0gdGhpcy5zb2NrZXQgPSBpbyh0aGlzLndzVXJsKTtcblxuICAgIHNvY2tldC5vbihcImNvbm5lY3RcIiwgKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJVc2VyIGNvbm5lY3RlZFwiLCBzb2NrZXQuaWQpO1xuICAgICAgc2VsZi5qb2luUm9vbSgpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKFwiY29ubmVjdFN1Y2Nlc3NcIiwgKCkgPT4ge1xuICAgICAgY29uc29sZS5sb2coXCJTdWNjZXNzZnVsbHkgam9pbmVkIHJvb21cIiwgdGhpcy5yb29tKTtcbiAgICAgIHNlbGYuY29ubmVjdFN1Y2Nlc3Moc29ja2V0LmlkKTtcbiAgICB9KTtcblxuICAgIHNvY2tldC5vbihcImVycm9yXCIsIGVyciA9PiB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiU29ja2V0IGNvbm5lY3Rpb24gZmFpbHVyZVwiLCBlcnIpO1xuICAgICAgc2VsZi5jb25uZWN0RmFpbHVyZSgpO1xuICAgIH0pO1xuXG4gICAgc29ja2V0Lm9uKFwib2NjdXBhbnRzQ2hhbmdlZFwiLCBkYXRhID0+IHtcbiAgICAgIGNvbnN0IHsgb2NjdXBhbnRzIH0gPSBkYXRhO1xuICAgICAgY29uc29sZS5sb2coJ29jY3VwYW50cyBjaGFuZ2VkJywgZGF0YSk7XG4gICAgICBzZWxmLnJlY2VpdmVkT2NjdXBhbnRzKG9jY3VwYW50cyk7XG4gICAgfSk7XG5cbiAgICBmdW5jdGlvbiByZWNlaXZlRGF0YShwYWNrZXQpIHtcbiAgICAgIGNvbnN0IGZyb20gPSBwYWNrZXQuZnJvbTtcbiAgICAgIGNvbnN0IHR5cGUgPSBwYWNrZXQudHlwZTtcbiAgICAgIGNvbnN0IGRhdGEgPSBwYWNrZXQuZGF0YTtcbiAgICAgIGNvbnNvbGUubG9nKCdyZWNlaXZlZCBkYXRhJywgcGFja2V0KTtcbiAgICAgIHNlbGYubWVzc2FnZUxpc3RlbmVyKGZyb20sIHR5cGUsIGRhdGEpO1xuICAgIH1cblxuICAgIHNvY2tldC5vbihcInNlbmRcIiwgcmVjZWl2ZURhdGEpO1xuICAgIHNvY2tldC5vbihcImJyb2FkY2FzdFwiLCByZWNlaXZlRGF0YSk7XG4gIH1cblxuICBqb2luUm9vbSgpIHtcbiAgICBjb25zb2xlLmxvZyhcIkpvaW5pbmcgcm9vbVwiLCB0aGlzLnJvb20pO1xuICAgIHRoaXMuc29ja2V0LmVtaXQoXCJqb2luUm9vbVwiLCB7IHJvb206IHRoaXMucm9vbSB9KTtcbiAgfVxuXG4gIHJlY2VpdmVkT2NjdXBhbnRzKG9jY3VwYW50cykge1xuICAgIGRlbGV0ZSBvY2N1cGFudHNbTkFGLmNsaWVudElkXTtcbiAgICB0aGlzLm9jY3VwYW50TGlzdGVuZXIob2NjdXBhbnRzKTtcbiAgfVxuXG4gIHNob3VsZFN0YXJ0Q29ubmVjdGlvblRvKGNsaWVudElkKSB7XG4gICAgcmV0dXJuIHRydWU7IC8vIEhhbmRsZWQgZWxzZXdoZXJlXG4gIH1cblxuICBzdGFydFN0cmVhbUNvbm5lY3Rpb24oY2xpZW50SWQpIHtcbiAgICB0aGlzLmNvbm5lY3RlZENsaWVudHMucHVzaChjbGllbnRJZCk7XG4gICAgdGhpcy5vcGVuTGlzdGVuZXIoY2xpZW50SWQpO1xuICB9XG5cbiAgY2xvc2VTdHJlYW1Db25uZWN0aW9uKGNsaWVudElkKSB7XG4gICAgY29uc3QgaW5kZXggPSB0aGlzLmNvbm5lY3RlZENsaWVudHMuaW5kZXhPZihjbGllbnRJZCk7XG4gICAgaWYgKGluZGV4ID4gLTEpIHtcbiAgICAgIHRoaXMuY29ubmVjdGVkQ2xpZW50cy5zcGxpY2UoaW5kZXgsIDEpO1xuICAgIH1cbiAgICB0aGlzLmNsb3NlZExpc3RlbmVyKGNsaWVudElkKTtcbiAgfVxuXG4gIGdldENvbm5lY3RTdGF0dXMoY2xpZW50SWQpIHtcbiAgICBjb25zdCBjb25uZWN0ZWQgPSB0aGlzLmNvbm5lY3RlZENsaWVudHMuaW5kZXhPZihjbGllbnRJZCkgIT0gLTE7XG5cbiAgICBpZiAoY29ubmVjdGVkKSB7XG4gICAgICByZXR1cm4gTkFGLmFkYXB0ZXJzLklTX0NPTk5FQ1RFRDtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIE5BRi5hZGFwdGVycy5OT1RfQ09OTkVDVEVEO1xuICAgIH1cbiAgfVxuXG4gIHNlbmREYXRhKHRvLCB0eXBlLCBkYXRhKSB7XG4gICAgdGhpcy5zZW5kRGF0YUd1YXJhbnRlZWQodG8sIHR5cGUsIGRhdGEpO1xuICB9XG5cbiAgc2VuZERhdGFHdWFyYW50ZWVkKHRvLCB0eXBlLCBkYXRhKSB7XG4gICAgY29uc3QgcGFja2V0ID0ge1xuICAgICAgZnJvbTogTkFGLmNsaWVudElkLFxuICAgICAgdG8sXG4gICAgICB0eXBlLFxuICAgICAgZGF0YSxcbiAgICAgIHNlbmRpbmc6IHRydWUsXG4gICAgfTtcblxuICAgIHRoaXMuc29ja2V0LmVtaXQoXCJzZW5kXCIsIHBhY2tldCk7XG4gIH1cblxuICBicm9hZGNhc3REYXRhKHR5cGUsIGRhdGEpIHtcbiAgICB0aGlzLmJyb2FkY2FzdERhdGFHdWFyYW50ZWVkKHR5cGUsIGRhdGEpO1xuICB9XG5cbiAgYnJvYWRjYXN0RGF0YUd1YXJhbnRlZWQodHlwZSwgZGF0YSkge1xuICAgIGNvbnN0IHBhY2tldCA9IHtcbiAgICAgIGZyb206IE5BRi5jbGllbnRJZCxcbiAgICAgIHR5cGUsXG4gICAgICBkYXRhLFxuICAgICAgYnJvYWRjYXN0aW5nOiB0cnVlXG4gICAgfTtcbiAgICB0aGlzLnNvY2tldC5lbWl0KFwiYnJvYWRjYXN0XCIsIHBhY2tldCk7XG4gIH1cblxuICBnZXRNZWRpYVN0cmVhbShjbGllbnRJZCkgeyByZXR1cm4gUHJvbWlzZS5yZWplY3QoJ0ludGVyZmFjZSBtZXRob2Qgbm90IGltcGxlbWVudGVkOiBnZXRNZWRpYVN0cmVhbScpfVxuXG4gIGdldFNlcnZlclRpbWUoKSB7XG4gICAgcmV0dXJuIC0xOyAvLyBUT0RPIGltcGxlbWVudFxuICB9XG59XG5cbk5BRi5hZGFwdGVycy5yZWdpc3RlcihcIm5hdGl2ZS13ZWJydGNcIiwgTmF0aXZlV2ViUnRjQWRhcHRlcik7XG5cbm1vZHVsZS5leHBvcnRzID0gTmF0aXZlV2ViUnRjQWRhcHRlcjtcblxuXG5cbi8vIFdFQlBBQ0sgRk9PVEVSIC8vXG4vLyAuL3NyYy9pbmRleC5qcyIsImNsYXNzIFdlYlJ0Y1BlZXIge1xuICBjb25zdHJ1Y3Rvcihsb2NhbElkLCByZW1vdGVJZCwgc2VuZFNpZ25hbEZ1bmMpIHtcbiAgICB0aGlzLmxvY2FsSWQgPSBsb2NhbElkO1xuICAgIHRoaXMucmVtb3RlSWQgPSByZW1vdGVJZDtcbiAgICB0aGlzLnNlbmRTaWduYWxGdW5jID0gc2VuZFNpZ25hbEZ1bmM7XG4gICAgdGhpcy5vcGVuID0gZmFsc2U7XG4gICAgdGhpcy5jaGFubmVsTGFiZWwgPSBcIm5ldHdvcmtlZC1hZnJhbWUtY2hhbm5lbFwiO1xuXG4gICAgdGhpcy5wYyA9IHRoaXMuY3JlYXRlUGVlckNvbm5lY3Rpb24oKTtcbiAgICB0aGlzLmNoYW5uZWwgPSBudWxsO1xuICB9XG5cbiAgc2V0RGF0YWNoYW5uZWxMaXN0ZW5lcnMob3Blbkxpc3RlbmVyLCBjbG9zZWRMaXN0ZW5lciwgbWVzc2FnZUxpc3RlbmVyKSB7XG4gICAgdGhpcy5vcGVuTGlzdGVuZXIgPSBvcGVuTGlzdGVuZXI7XG4gICAgdGhpcy5jbG9zZWRMaXN0ZW5lciA9IGNsb3NlZExpc3RlbmVyO1xuICAgIHRoaXMubWVzc2FnZUxpc3RlbmVyID0gbWVzc2FnZUxpc3RlbmVyO1xuICB9XG5cbiAgb2ZmZXIoKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIC8vIHJlbGlhYmxlOiBmYWxzZSAtIFVEUFxuICAgIHRoaXMuc2V0dXBDaGFubmVsKFxuICAgICAgdGhpcy5wYy5jcmVhdGVEYXRhQ2hhbm5lbCh0aGlzLmNoYW5uZWxMYWJlbCwgeyByZWxpYWJsZTogZmFsc2UgfSlcbiAgICApO1xuICAgIHRoaXMucGMuY3JlYXRlT2ZmZXIoXG4gICAgICBmdW5jdGlvbihzZHApIHtcbiAgICAgICAgc2VsZi5oYW5kbGVTZXNzaW9uRGVzY3JpcHRpb24oc2RwKTtcbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiV2ViUnRjUGVlci5vZmZlcjogXCIgKyBlcnJvcik7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGhhbmRsZVNpZ25hbChzaWduYWwpIHtcbiAgICAvLyBpZ25vcmVzIHNpZ25hbCBpZiBpdCBpc24ndCBmb3IgbWVcbiAgICBpZiAodGhpcy5sb2NhbElkICE9PSBzaWduYWwudG8gfHwgdGhpcy5yZW1vdGVJZCAhPT0gc2lnbmFsLmZyb20pIHJldHVybjtcblxuICAgIHN3aXRjaCAoc2lnbmFsLnR5cGUpIHtcbiAgICAgIGNhc2UgXCJvZmZlclwiOlxuICAgICAgICB0aGlzLmhhbmRsZU9mZmVyKHNpZ25hbCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFwiYW5zd2VyXCI6XG4gICAgICAgIHRoaXMuaGFuZGxlQW5zd2VyKHNpZ25hbCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBjYXNlIFwiY2FuZGlkYXRlXCI6XG4gICAgICAgIHRoaXMuaGFuZGxlQ2FuZGlkYXRlKHNpZ25hbCk7XG4gICAgICAgIGJyZWFrO1xuXG4gICAgICBkZWZhdWx0OlxuICAgICAgICBjb25zb2xlLmVycm9yKFxuICAgICAgICAgIFwiV2ViUnRjUGVlci5oYW5kbGVTaWduYWw6IFVua25vd24gc2lnbmFsIHR5cGUgXCIgKyBzaWduYWwudHlwZVxuICAgICAgICApO1xuICAgICAgICBicmVhaztcbiAgICB9XG4gIH1cblxuICBzZW5kKHR5cGUsIGRhdGEpIHtcbiAgICAvLyBUT0RPOiB0aHJvdyBlcnJvcj9cbiAgICBpZiAodGhpcy5jaGFubmVsID09PSBudWxsIHx8IHRoaXMuY2hhbm5lbC5yZWFkeVN0YXRlICE9PSBcIm9wZW5cIikgcmV0dXJuO1xuXG4gICAgdGhpcy5jaGFubmVsLnNlbmQoSlNPTi5zdHJpbmdpZnkoeyB0eXBlOiB0eXBlLCBkYXRhOiBkYXRhIH0pKTtcbiAgfVxuXG4gIGdldFN0YXR1cygpIHtcbiAgICBpZiAodGhpcy5jaGFubmVsID09PSBudWxsKSByZXR1cm4gV2ViUnRjUGVlci5OT1RfQ09OTkVDVEVEO1xuXG4gICAgc3dpdGNoICh0aGlzLmNoYW5uZWwucmVhZHlTdGF0ZSkge1xuICAgICAgY2FzZSBcIm9wZW5cIjpcbiAgICAgICAgcmV0dXJuIFdlYlJ0Y1BlZXIuSVNfQ09OTkVDVEVEO1xuXG4gICAgICBjYXNlIFwiY29ubmVjdGluZ1wiOlxuICAgICAgICByZXR1cm4gV2ViUnRjUGVlci5DT05ORUNUSU5HO1xuXG4gICAgICBjYXNlIFwiY2xvc2luZ1wiOlxuICAgICAgY2FzZSBcImNsb3NlZFwiOlxuICAgICAgZGVmYXVsdDpcbiAgICAgICAgcmV0dXJuIFdlYlJ0Y1BlZXIuTk9UX0NPTk5FQ1RFRDtcbiAgICB9XG4gIH1cblxuICAvKlxuICAgICAqIFByaXZhdGVzXG4gICAgICovXG5cbiAgY3JlYXRlUGVlckNvbm5lY3Rpb24oKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBSVENQZWVyQ29ubmVjdGlvbiA9XG4gICAgICB3aW5kb3cuUlRDUGVlckNvbm5lY3Rpb24gfHxcbiAgICAgIHdpbmRvdy53ZWJraXRSVENQZWVyQ29ubmVjdGlvbiB8fFxuICAgICAgd2luZG93Lm1velJUQ1BlZXJDb25uZWN0aW9uIHx8XG4gICAgICB3aW5kb3cubXNSVENQZWVyQ29ubmVjdGlvbjtcblxuICAgIGlmIChSVENQZWVyQ29ubmVjdGlvbiA9PT0gdW5kZWZpbmVkKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICAgIFwiV2ViUnRjUGVlci5jcmVhdGVQZWVyQ29ubmVjdGlvbjogVGhpcyBicm93c2VyIGRvZXMgbm90IHNlZW0gdG8gc3VwcG9ydCBXZWJSVEMuXCJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgdmFyIHBjID0gbmV3IFJUQ1BlZXJDb25uZWN0aW9uKHsgaWNlU2VydmVyczogV2ViUnRjUGVlci5JQ0VfU0VSVkVSUyB9KTtcblxuICAgIHBjLm9uaWNlY2FuZGlkYXRlID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGlmIChldmVudC5jYW5kaWRhdGUpIHtcbiAgICAgICAgc2VsZi5zZW5kU2lnbmFsRnVuYyh7XG4gICAgICAgICAgZnJvbTogc2VsZi5sb2NhbElkLFxuICAgICAgICAgIHRvOiBzZWxmLnJlbW90ZUlkLFxuICAgICAgICAgIHR5cGU6IFwiY2FuZGlkYXRlXCIsXG4gICAgICAgICAgc2RwTUxpbmVJbmRleDogZXZlbnQuY2FuZGlkYXRlLnNkcE1MaW5lSW5kZXgsXG4gICAgICAgICAgY2FuZGlkYXRlOiBldmVudC5jYW5kaWRhdGUuY2FuZGlkYXRlXG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgIH07XG5cbiAgICAvLyBOb3RlOiBzZWVtcyBsaWtlIGNoYW5uZWwub25jbG9zZSBoYW5kZXIgaXMgdW5yZWxpYWJsZSBvbiBzb21lIHBsYXRmb3JtcyxcbiAgICAvLyAgICAgICBzbyBhbHNvIHRyaWVzIHRvIGRldGVjdCBkaXNjb25uZWN0aW9uIGhlcmUuXG4gICAgcGMub25pY2Vjb25uZWN0aW9uc3RhdGVjaGFuZ2UgPSBmdW5jdGlvbigpIHtcbiAgICAgIGlmIChzZWxmLm9wZW4gJiYgcGMuaWNlQ29ubmVjdGlvblN0YXRlID09PSBcImRpc2Nvbm5lY3RlZFwiKSB7XG4gICAgICAgIHNlbGYub3BlbiA9IGZhbHNlO1xuICAgICAgICBzZWxmLmNsb3NlZExpc3RlbmVyKHNlbGYucmVtb3RlSWQpO1xuICAgICAgfVxuICAgIH07XG5cbiAgICByZXR1cm4gcGM7XG4gIH1cblxuICBzZXR1cENoYW5uZWwoY2hhbm5lbCkge1xuICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgIHRoaXMuY2hhbm5lbCA9IGNoYW5uZWw7XG5cbiAgICAvLyByZWNlaXZlZCBkYXRhIGZyb20gYSByZW1vdGUgcGVlclxuICAgIHRoaXMuY2hhbm5lbC5vbm1lc3NhZ2UgPSBmdW5jdGlvbihldmVudCkge1xuICAgICAgdmFyIGRhdGEgPSBKU09OLnBhcnNlKGV2ZW50LmRhdGEpO1xuICAgICAgc2VsZi5tZXNzYWdlTGlzdGVuZXIoc2VsZi5yZW1vdGVJZCwgZGF0YS50eXBlLCBkYXRhLmRhdGEpO1xuICAgIH07XG5cbiAgICAvLyBjb25uZWN0ZWQgd2l0aCBhIHJlbW90ZSBwZWVyXG4gICAgdGhpcy5jaGFubmVsLm9ub3BlbiA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBzZWxmLm9wZW4gPSB0cnVlO1xuICAgICAgc2VsZi5vcGVuTGlzdGVuZXIoc2VsZi5yZW1vdGVJZCk7XG4gICAgfTtcblxuICAgIC8vIGRpc2Nvbm5lY3RlZCB3aXRoIGEgcmVtb3RlIHBlZXJcbiAgICB0aGlzLmNoYW5uZWwub25jbG9zZSA9IGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBpZiAoIXNlbGYub3BlbikgcmV0dXJuO1xuICAgICAgc2VsZi5vcGVuID0gZmFsc2U7XG4gICAgICBzZWxmLmNsb3NlZExpc3RlbmVyKHNlbGYucmVtb3RlSWQpO1xuICAgIH07XG5cbiAgICAvLyBlcnJvciBvY2N1cnJlZCB3aXRoIGEgcmVtb3RlIHBlZXJcbiAgICB0aGlzLmNoYW5uZWwub25lcnJvciA9IGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICBjb25zb2xlLmVycm9yKFwiV2ViUnRjUGVlci5jaGFubmVsLm9uZXJyb3I6IFwiICsgZXJyb3IpO1xuICAgIH07XG4gIH1cblxuICBoYW5kbGVPZmZlcihtZXNzYWdlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5wYy5vbmRhdGFjaGFubmVsID0gZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIHNlbGYuc2V0dXBDaGFubmVsKGV2ZW50LmNoYW5uZWwpO1xuICAgIH07XG5cbiAgICB0aGlzLnNldFJlbW90ZURlc2NyaXB0aW9uKG1lc3NhZ2UpO1xuXG4gICAgdGhpcy5wYy5jcmVhdGVBbnN3ZXIoXG4gICAgICBmdW5jdGlvbihzZHApIHtcbiAgICAgICAgc2VsZi5oYW5kbGVTZXNzaW9uRGVzY3JpcHRpb24oc2RwKTtcbiAgICAgIH0sXG4gICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiV2ViUnRjUGVlci5oYW5kbGVPZmZlcjogXCIgKyBlcnJvcik7XG4gICAgICB9XG4gICAgKTtcbiAgfVxuXG4gIGhhbmRsZUFuc3dlcihtZXNzYWdlKSB7XG4gICAgdGhpcy5zZXRSZW1vdGVEZXNjcmlwdGlvbihtZXNzYWdlKTtcbiAgfVxuXG4gIGhhbmRsZUNhbmRpZGF0ZShtZXNzYWdlKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIHZhciBSVENJY2VDYW5kaWRhdGUgPVxuICAgICAgd2luZG93LlJUQ0ljZUNhbmRpZGF0ZSB8fFxuICAgICAgd2luZG93LndlYmtpdFJUQ0ljZUNhbmRpZGF0ZSB8fFxuICAgICAgd2luZG93Lm1velJUQ0ljZUNhbmRpZGF0ZTtcblxuICAgIHRoaXMucGMuYWRkSWNlQ2FuZGlkYXRlKFxuICAgICAgbmV3IFJUQ0ljZUNhbmRpZGF0ZShtZXNzYWdlKSxcbiAgICAgIGZ1bmN0aW9uKCkge30sXG4gICAgICBmdW5jdGlvbihlcnJvcikge1xuICAgICAgICBjb25zb2xlLmVycm9yKFwiV2ViUnRjUGVlci5oYW5kbGVDYW5kaWRhdGU6IFwiICsgZXJyb3IpO1xuICAgICAgfVxuICAgICk7XG4gIH1cblxuICBoYW5kbGVTZXNzaW9uRGVzY3JpcHRpb24oc2RwKSB7XG4gICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgdGhpcy5wYy5zZXRMb2NhbERlc2NyaXB0aW9uKFxuICAgICAgc2RwLFxuICAgICAgZnVuY3Rpb24oKSB7fSxcbiAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJXZWJSdGNQZWVyLmhhbmRsZVNlc3Npb25EZXNjcmlwdGlvbjogXCIgKyBlcnJvcik7XG4gICAgICB9XG4gICAgKTtcblxuICAgIHRoaXMuc2VuZFNpZ25hbEZ1bmMoe1xuICAgICAgZnJvbTogdGhpcy5sb2NhbElkLFxuICAgICAgdG86IHRoaXMucmVtb3RlSWQsXG4gICAgICB0eXBlOiBzZHAudHlwZSxcbiAgICAgIHNkcDogc2RwLnNkcFxuICAgIH0pO1xuICB9XG5cbiAgc2V0UmVtb3RlRGVzY3JpcHRpb24obWVzc2FnZSkge1xuICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB2YXIgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uID1cbiAgICAgIHdpbmRvdy5SVENTZXNzaW9uRGVzY3JpcHRpb24gfHxcbiAgICAgIHdpbmRvdy53ZWJraXRSVENTZXNzaW9uRGVzY3JpcHRpb24gfHxcbiAgICAgIHdpbmRvdy5tb3pSVENTZXNzaW9uRGVzY3JpcHRpb24gfHxcbiAgICAgIHdpbmRvdy5tc1JUQ1Nlc3Npb25EZXNjcmlwdGlvbjtcblxuICAgIHRoaXMucGMuc2V0UmVtb3RlRGVzY3JpcHRpb24oXG4gICAgICBuZXcgUlRDU2Vzc2lvbkRlc2NyaXB0aW9uKG1lc3NhZ2UpLFxuICAgICAgZnVuY3Rpb24oKSB7fSxcbiAgICAgIGZ1bmN0aW9uKGVycm9yKSB7XG4gICAgICAgIGNvbnNvbGUuZXJyb3IoXCJXZWJSdGNQZWVyLnNldFJlbW90ZURlc2NyaXB0aW9uOiBcIiArIGVycm9yKTtcbiAgICAgIH1cbiAgICApO1xuICB9XG59XG5cbldlYlJ0Y1BlZXIuSVNfQ09OTkVDVEVEID0gXCJJU19DT05ORUNURURcIjtcbldlYlJ0Y1BlZXIuQ09OTkVDVElORyA9IFwiQ09OTkVDVElOR1wiO1xuV2ViUnRjUGVlci5OT1RfQ09OTkVDVEVEID0gXCJOT1RfQ09OTkVDVEVEXCI7XG5cbldlYlJ0Y1BlZXIuSUNFX1NFUlZFUlMgPSBbXG4gIHsgdXJsczogXCJzdHVuOnN0dW4xLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH0sXG4gIHsgdXJsczogXCJzdHVuOnN0dW4yLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH0sXG4gIHsgdXJsczogXCJzdHVuOnN0dW4zLmwuZ29vZ2xlLmNvbToxOTMwMlwiIH0sXG4gIHsgdXJsczogXCJzdHVuOnN0dW40LmwuZ29vZ2xlLmNvbToxOTMwMlwiIH1cbl07XG5cbm1vZHVsZS5leHBvcnRzID0gV2ViUnRjUGVlcjtcblxuXG4vLyBXRUJQQUNLIEZPT1RFUiAvL1xuLy8gLi9zcmMvV2ViUnRjUGVlci5qcyJdLCJzb3VyY2VSb290IjoiIn0=