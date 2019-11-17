// Load required modules
const http = require("http"); // http server core module
const path = require("path");
const express = require("express"); // web framework external module

// Set process name
process.title = "networked-aframe-server";

// Get port or default to 8080
const port = process.env.PORT || 8080;

// Setup and configure Express http server.
const app = express();

// Serve the example and build the bundle in development.
if (process.env.NODE_ENV === "development") {
  const webpackMiddleware = require("webpack-dev-middleware");
  const webpack = require("webpack");
  const config = require("../webpack.dev");

  app.use(express.static(path.resolve(__dirname, "..", "example")));

  app.use(
    webpackMiddleware(webpack(config), {
      publicPath: "/dist/"
    })
  );
}

// Start Express http server
const webServer = http.createServer(app);
const io = require("socket.io")(webServer);

io.on("connection", socket => {
  console.log("user connected", socket.id);

  let curRoom = null;

  socket.on("joinRoom", data => {
    const { room } = data;

    curRoom = room;

    console.log(`${socket.id} joined room ${room}`);
    socket.join(room);

    socket.emit("connectSuccess");
    const occupants = socket.adapter.rooms[room].sockets;
    io.in(curRoom).emit("occupantsChanged", { occupants });
  });

  socket.on("send", data => {
    const occupants = socket.adapter.rooms[curRoom].sockets;
    io.to(data.to).emit("send", data);
  });

  socket.on("broadcast", data => {
    const occupants = socket.adapter.rooms[curRoom].sockets;
    socket.to(curRoom).broadcast.emit("broadcast", data);
  });

  socket.on("disconnect", () => {
    console.log("user disconnected", socket.id);
    if (socket.adapter.rooms[curRoom]) {
      const occupants = socket.adapter.rooms[curRoom].sockets;
      socket.to(curRoom).broadcast.emit("occupantsChanged", { occupants });
    }
  });
});

webServer.listen(port, () => {
  console.log("listening on http://localhost:" + port);
});
