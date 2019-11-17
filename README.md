# Networked-AFrame Native WebRTC Adapter

Network adapter for [networked-aframe](https://github.com/networked-aframe/networked-aframe) that uses uws for signalling and native WebRTC APIs for the WebRTC channels.

## Running the Example

```
git clone https://github.com/networked-aframe/naf-native-webrtc-adapter
cd naf-native-webrtc-adapter
npm install # or use yarn
npm run dev # Start the local development server
```

With the server running, browse the example at http://localhost:8080. Open another browser tab and point it to the same URL to see the other client.

### Running on Glitch.com

[![Remix on Glitch](https://cdn.glitch.com/2703baf2-b643-4da7-ab91-7ee2a2d00b5b%2Fremix-button.svg)](https://glitch.com/edit/#!/remix/naf-uws-adapter)

### Running your own server

You can deploy the included websocket server to Heroku using the button below.

[![Deploy](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy)

Then include and configure `naf-uws-adapter`.

```html
<html>
<head>
  <script src="https://aframe.io/releases/0.7.0/aframe.min.js"></script>
  <script src="https://unpkg.com/networked-aframe/dist/networked-aframe.min.js"></script>
  <!-- Include naf-uws-adapter *after* networked-aframe -->
  <script src="https://unpkg.com/naf-uws-adapter/dist/naf-uws-adapter.min.js"></script> 
</head>
<body>
    <!-- Set adapter to uws and serverURL to the url of your Heroku server. -->
   <a-scene networked-scene="
        adapter: uws;
        serverURL: ws://localhost:8080;
    ">
  </a-scene>
</body>
</html>
```
