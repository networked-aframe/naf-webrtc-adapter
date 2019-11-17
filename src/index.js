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
    this.connectedClients = [];
    this.occupantListener = null;

    this.peers = {}; // id -> WebRtcPeer
    this.occupants = {}; // id -> TODO: joinTimestamp
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

    console.log("Attempting to connect to socket.io");
    const socket = this.socket = io(this.wsUrl);

    socket.on("connect", () => {
      console.log("User connected", socket.id);
      self.joinRoom();
    });

    socket.on("connectSuccess", () => {
      console.log("Successfully joined room", this.room);
      self.connectSuccess(socket.id);
    });

    socket.on("error", err => {
      console.error("Socket connection failure", err);
      self.connectFailure();
    });

    socket.on("occupantsChanged", data => {
      const { occupants } = data;
      console.log('occupants changed', data);
      self.receivedOccupants(occupants);
    });

    function receiveData(packet) {
      const from = packet.from;
      const type = packet.type;
      const data = packet.data;
      console.log('received data', packet);
      self.messageListener(from, type, data);
    }

    socket.on("send", receiveData);
    socket.on("broadcast", receiveData);
  }

  joinRoom() {
    console.log("Joining room", this.room);
    this.socket.emit("joinRoom", { room: this.room });
  }

  receivedOccupants(occupants) {
    delete occupants[NAF.clientId];
    this.occupantListener(occupants);
  }

  shouldStartConnectionTo(clientId) {
    return true; // Handled elsewhere
  }

  startStreamConnection(clientId) {
    this.connectedClients.push(clientId);
    this.openListener(clientId);
  }

  closeStreamConnection(clientId) {
    const index = this.connectedClients.indexOf(clientId);
    if (index > -1) {
      this.connectedClients.splice(index, 1);
    }
    this.closedListener(clientId);
  }

  getConnectStatus(clientId) {
    const connected = this.connectedClients.indexOf(clientId) != -1;

    if (connected) {
      return NAF.adapters.IS_CONNECTED;
    } else {
      return NAF.adapters.NOT_CONNECTED;
    }
  }

  sendData(to, type, data) {
    this.sendDataGuaranteed(to, type, data);
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
    this.broadcastDataGuaranteed(type, data);
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

  getMediaStream(clientId) { return Promise.reject('Interface method not implemented: getMediaStream')}

  getServerTime() {
    return -1; // TODO implement
  }
}

NAF.adapters.register("native-webrtc", NativeWebRtcAdapter);

module.exports = NativeWebRtcAdapter;
