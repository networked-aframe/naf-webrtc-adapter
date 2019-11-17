class WebRtcPeer {
  constructor(localId, remoteId, sendSignalFunc) {
    this.localId = localId;
    this.remoteId = remoteId;
    this.sendSignalFunc = sendSignalFunc;
    this.open = false;
    this.channelLabel = "networked-aframe-channel";

    this.pc = this.createPeerConnection();
    this.channel = null;
  }

  setDatachannelListeners(openListener, closedListener, messageListener) {
    this.openListener = openListener;
    this.closedListener = closedListener;
    this.messageListener = messageListener;
  }

  offer() {
    var self = this;
    // reliable: false - UDP
    this.setupChannel(
      this.pc.createDataChannel(this.channelLabel, { reliable: false })
    );
    this.pc.createOffer(
      function(sdp) {
        self.handleSessionDescription(sdp);
      },
      function(error) {
        console.error("WebRtcPeer.offer: " + error);
      }
    );
  }

  handleSignal(signal) {
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
        console.error(
          "WebRtcPeer.handleSignal: Unknown signal type " + signal.type
        );
        break;
    }
  }

  send(type, data) {
    // TODO: throw error?
    if (this.channel === null || this.channel.readyState !== "open") return;

    this.channel.send(JSON.stringify({ type: type, data: data }));
  }

  getStatus() {
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

  createPeerConnection() {
    var self = this;
    var RTCPeerConnection =
      window.RTCPeerConnection ||
      window.webkitRTCPeerConnection ||
      window.mozRTCPeerConnection ||
      window.msRTCPeerConnection;

    if (RTCPeerConnection === undefined) {
      throw new Error(
        "WebRtcPeer.createPeerConnection: This browser does not seem to support WebRTC."
      );
    }

    var pc = new RTCPeerConnection({ iceServers: WebRtcPeer.ICE_SERVERS });

    pc.onicecandidate = function(event) {
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
    pc.oniceconnectionstatechange = function() {
      if (self.open && pc.iceConnectionState === "disconnected") {
        self.open = false;
        self.closedListener(self.remoteId);
      }
    };

    return pc;
  }

  setupChannel(channel) {
    var self = this;

    this.channel = channel;

    // received data from a remote peer
    this.channel.onmessage = function(event) {
      var data = JSON.parse(event.data);
      self.messageListener(self.remoteId, data.type, data.data);
    };

    // connected with a remote peer
    this.channel.onopen = function(event) {
      self.open = true;
      self.openListener(self.remoteId);
    };

    // disconnected with a remote peer
    this.channel.onclose = function(event) {
      if (!self.open) return;
      self.open = false;
      self.closedListener(self.remoteId);
    };

    // error occurred with a remote peer
    this.channel.onerror = function(error) {
      console.error("WebRtcPeer.channel.onerror: " + error);
    };
  }

  handleOffer(message) {
    var self = this;

    this.pc.ondatachannel = function(event) {
      self.setupChannel(event.channel);
    };

    this.setRemoteDescription(message);

    this.pc.createAnswer(
      function(sdp) {
        self.handleSessionDescription(sdp);
      },
      function(error) {
        console.error("WebRtcPeer.handleOffer: " + error);
      }
    );
  }

  handleAnswer(message) {
    this.setRemoteDescription(message);
  }

  handleCandidate(message) {
    var self = this;
    var RTCIceCandidate =
      window.RTCIceCandidate ||
      window.webkitRTCIceCandidate ||
      window.mozRTCIceCandidate;

    this.pc.addIceCandidate(
      new RTCIceCandidate(message),
      function() {},
      function(error) {
        console.error("WebRtcPeer.handleCandidate: " + error);
      }
    );
  }

  handleSessionDescription(sdp) {
    var self = this;

    this.pc.setLocalDescription(
      sdp,
      function() {},
      function(error) {
        console.error("WebRtcPeer.handleSessionDescription: " + error);
      }
    );

    this.sendSignalFunc({
      from: this.localId,
      to: this.remoteId,
      type: sdp.type,
      sdp: sdp.sdp
    });
  }

  setRemoteDescription(message) {
    var self = this;
    var RTCSessionDescription =
      window.RTCSessionDescription ||
      window.webkitRTCSessionDescription ||
      window.mozRTCSessionDescription ||
      window.msRTCSessionDescription;

    this.pc.setRemoteDescription(
      new RTCSessionDescription(message),
      function() {},
      function(error) {
        console.error("WebRtcPeer.setRemoteDescription: " + error);
      }
    );
  }
}

WebRtcPeer.IS_CONNECTED = "IS_CONNECTED";
WebRtcPeer.CONNECTING = "CONNECTING";
WebRtcPeer.NOT_CONNECTED = "NOT_CONNECTED";

WebRtcPeer.ICE_SERVERS = [
  { urls: "stun:stun1.l.google.com:19302" },
  { urls: "stun:stun2.l.google.com:19302" },
  { urls: "stun:stun3.l.google.com:19302" },
  { urls: "stun:stun4.l.google.com:19302" }
];

module.exports = WebRtcPeer;