const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:8080",
  },
});

global._config = {
  // statsIntervalTime: 1000 * 60 * 5,
  statsIntervalTime: 2000,
  targetsIntervalTime: 5000,
};

global._stats = {
  clientsCount: 0,
  webVisitorsCount: 0,
  currentTargets: ["https://www.1tv.com/"],
};

io.of("client").on("connection", (socket) => {
  global._stats.clientsCount += 1;

  emitTargets(socket);

  socket.on("disconnect", () => {
    global._stats.clientsCount -= 1;
  });
});

io.of("web").on("connection", (socket) => {
  global._stats.webVisitorsCount += 1;

  emitStats(socket);

  socket.on("disconnect", () => {
    global._stats.webVisitorsCount -= 1;
  });
});

setInterval(() => emitTargets(io), global._config.targetsIntervalTime);

setInterval(() => emitStats(io.of("web")), global._config.statsIntervalTime);

function emitTargets(socket) {
  console.log("emit targets");
  socket.emit("targets", {
    currentTargets: global._stats.currentTargets,
  });
}

function emitStats(socket) {
  socket.emit("stats", {
    clientsCount: global._stats.clientsCount,
    webVisitorsCount: global._stats.webVisitorsCount,
  });
}

httpServer.listen(3000);
