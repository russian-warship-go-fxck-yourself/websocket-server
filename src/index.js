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
  statsIntervalTime: 2000,
  targetsIntervalTime: 5 * 60 * 1000, // 5 min
  maxTargetsLogLength: 5,
};

global._stats = {
  clientsCount: 0,
  webVisitorsCount: 0,
  currentTargets: ["https://www.1tv.com/"],
  targetsLogs: [],
};

io.of("client").on("connection", (socket) => {
  global._stats.clientsCount += 1;

  emitTargets(socket);

  socket.on('targets:log', (targetVisitedUrls) => {
    const urls = targetVisitedUrls.targetsLog;
    if (global._stats.targetsLogs.length <= global._config.maxTargetsLogLength) {
      global._stats.targetsLogs.push(urls);
    } else {
      global._stats.targetsLogs.shift();
      global._stats.targetsLogs.push(urls);
    }
    console.log(global._stats.targetsLogs);
  });

  socket.on("disconnect", () => {
    global._stats.clientsCount -= 1;
    global._stats.targetsLogs = [];
  });
});

io.of("web").on("connection", (socket) => {
  global._stats.webVisitorsCount += 1;

  emitStats(socket);

  socket.on("disconnect", () => {
    global._stats.webVisitorsCount -= 1;
  });
});

setInterval(() => emitTargets(io.of("client")), global._config.targetsIntervalTime);

setInterval(() => emitStats(io.of("web")), global._config.statsIntervalTime);

function emitTargets(socket) {
  socket.emit("targets", {
    currentTargets: global._stats.currentTargets,
  });
}

function emitStats(socket) {
  const targetsLogs = [].concat.apply([], global._stats.targetsLogs);

  socket.emit("stats", {
    clientsCount: global._stats.clientsCount,
    webVisitorsCount: global._stats.webVisitorsCount,
    targetsLogs
  });
}

httpServer.listen(3000);
