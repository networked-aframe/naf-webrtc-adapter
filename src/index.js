const WebRtcPeer = require("./WebRtcPeer");

/**
 * Native WebRTC Adapter (native-webrtc)
 * For use with uws-server.js
 * networked-scene: serverURL needs to be ws://localhost:8080 when running locally
 */
class NativeWebRtcAdapter {
  constructor() {

    if (io === undefined)
      console.warn('It looks like socket.io has not been loaded before NativeWebRtcAdapter. Please do that.')

    this.app = "default";
    this.room = "default";
    this.occupantListener = null;
    this.myRoomJoinTime = null;

    this.peers = {}; // id -> WebRtcPeer
    this.occupants = {}; // id -> joinTimestamp
  }

  setServerUrl(wsUrl) {
    this.wsUrl = wsUrl;
  }

  setApp(appName) {
    this.app = appName;
  }

  setRoom(roomName) {
    this.room = roomName;
  }

  setWebRtcOptions(options) {
    if (options.datachannel === false)
      console.warn(
        "NativeWebRtcAdapter.setWebRtcOptions: datachannel must be true."
      );
    if (options.audio === true)
      console.warn("NativeWebRtcAdapter does not support audio yet.");
    if (options.video === true)
      console.warn("NativeWebRtcAdapter does not support video yet.");
  }

  setServerConnectListeners(successListener, failureListener) {
    this.connectSuccess = successListener;
    this.connectFailure = failureListener;
  }

  setRoomOccupantListener(occupantListener) {
    this.occupantListener = occupantListener;
  }

  setDataChannelListeners(openListener, closedListener, messageListener) {
    this.openListener = openListener;
    this.closedListener = closedListener;
    this.messageListener = messageListener;
  }

  connect() {
    const self = this;

    if (!this.wsUrl || this.wsUrl === "/") {
      if (location.protocol === "https:") {
        this.wsUrl = "wss://" + location.host;
      } else {
        this.wsUrl = "ws://" + location.host;
      }
    }

    NAF.log.write("Attempting to connect to socket.io");
    const socket = this.socket = io(this.wsUrl);

    socket.on("connect", () => {
      NAF.log.write("User connected", socket.id);
      self.joinRoom();
    });

    socket.on("connectSuccess", (data) => {
      const { joinedTime } = data;

      this.myRoomJoinTime = joinedTime;
      NAF.log.write("Successfully joined room", this.room, "at server time", joinedTime);
      self.connectSuccess(socket.id);
    });

    socket.on("error", err => {
      console.error("Socket connection failure", err);
      self.connectFailure();
    });

    socket.on("occupantsChanged", data => {
      const { occupants } = data;
      NAF.log.write('occupants changed', data);
      self.receivedOccupants(occupants);
    });

    function receiveData(packet) {
      const from = packet.from;
      const type = packet.type;
      const data = packet.data;
      if (type === 'ice-candidate') {
        self.peers[from].handleSignal(data);
        return;
      }
      self.messageListener(from, type, data);
    }

    socket.on("send", receiveData);
    socket.on("broadcast", receiveData);
  }

  joinRoom() {
    NAF.log.write("Joining room", this.room);
    this.socket.emit("joinRoom", { room: this.room });
  }

  receivedOccupants(occupants) {
    delete occupants[NAF.clientId];

    this.occupants = occupants;

    NAF.log.write('occupants=', occupants);
    const self = this;
    const localId = NAF.clientId;

    for (var key in occupants) {
      const remoteId = key;
      if (this.peers[remoteId]) continue;

      const peer = new WebRtcPeer(
        localId,
        remoteId,
        (data) => {
          self.socket.emit('send',{
            from: localId,
            to: remoteId,
            type: 'ice-candidate',
            data,
            sending: true,
          });
        }
      );
      peer.setDatachannelListeners(
        self.openListener,
        self.closedListener,
        self.messageListener
      );

      self.peers[remoteId] = peer;
    }

    NAF.log.write('peers', self.peers);

    this.occupantListener(occupants);
  }

  shouldStartConnectionTo(client) {
    return (this.myRoomJoinTime || 0) <= (client || 0);
  }

  startStreamConnection(remoteId) {
    NAF.log.write('starting offer process');
    this.peers[remoteId].offer();
  }

  closeStreamConnection(clientId) {
    NAF.log.write('closeStreamConnection', clientId, this.peers);
    this.peers[clientId].close();
    delete this.peers[clientId];
    delete this.occupants[clientId];
    this.closedListener(clientId);
  }

  getConnectStatus(clientId) {
    const peer = this.peers[clientId];

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

  sendData(to, type, data) {
    this.peers[to].send(type, data);
  }

  sendDataGuaranteed(to, type, data) {
    const packet = {
      from: NAF.clientId,
      to,
      type,
      data,
      sending: true,
    };

    this.socket.emit("send", packet);
  }

  broadcastData(type, data) {
    for (var clientId in this.peers) {
      this.sendData(clientId, type, data);
    }
  }

  broadcastDataGuaranteed(type, data) {
    const packet = {
      from: NAF.clientId,
      type,
      data,
      broadcasting: true
    };
    this.socket.emit("broadcast", packet);
  }

  getMediaStream(clientId) {
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
    return Promise.reject('Interface method not implemented: getMediaStream')
  }

  updateTimeOffset() {
    const clientSentTime = Date.now() + this.avgTimeOffset;

    return fetch(document.location.href, { method: "HEAD", cache: "no-cache" })
      .then(res => {
        var precision = 1000;
        var serverReceivedTime = new Date(res.headers.get("Date")).getTime() + (precision / 2);
        var clientReceivedTime = Date.now();
        var serverTime = serverReceivedTime + ((clientReceivedTime - clientSentTime) / 2);
        var timeOffset = serverTime - clientReceivedTime;

        this.serverTimeRequests++;

        if (this.serverTimeRequests <= 10) {
          this.timeOffsets.push(timeOffset);
        } else {
          this.timeOffsets[this.serverTimeRequests % 10] = timeOffset;
        }

        this.avgTimeOffset = this.timeOffsets.reduce((acc, offset) => acc += offset, 0) / this.timeOffsets.length;

        if (this.serverTimeRequests > 10) {
          setTimeout(() => this.updateTimeOffset(), 5 * 60 * 1000); // Sync clock every 5 minutes.
        } else {
          this.updateTimeOffset();
        }
      });
  }

  getServerTime() {
    return -1; // TODO implement
  }
}

NAF.adapters.register("native-webrtc", NativeWebRtcAdapter);

module.exports = NativeWebRtcAdapter;
