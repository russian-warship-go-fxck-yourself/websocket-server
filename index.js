const express = require("express");
const { createServer } = require("http");
const { Server } = require("socket.io");
const clusterAdapter = require("@socket.io/cluster-adapter").createAdapter;
const redisAdapter = require("@socket.io/redis-adapter").createAdapter;
const { setupWorker } = require("@socket.io/sticky");
const {Store} = require('./store');
const createClient = require("redis").createClient;

const config = {
  statsIntervalTime: 5000,
  targetsIntervalTime: 5 * 60 * 1000, // 5 min
  maxLogsPacksLength: 5,
};

const TARGETS = [
  "https://www.1tv.com/"
];

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ["http://localhost:8000"],
    methods: ["GET"]
  },
});

io.adapter(clusterAdapter());
setupWorker(io);

const pubClient = createClient({ url: "redis://localhost:6379" });
const subClient = pubClient.duplicate();
const store = new Store(pubClient);

Promise.all([pubClient.connect(), subClient.connect()]).then(async () => {
  await store.init();
  io.adapter(redisAdapter(pubClient, subClient));
  httpServer.listen(3000);
});

io.of("client").on("connection", async (socket) => {
  await store.incrementClients()
  await emitTargets(socket);
  socket.on('targets:log', async (data) => this.updateTargets(data));
  socket.on("disconnect", () => store.decrementClients());
});

io.of("web").on("connection", async (socket) => {
  await store.incrementVisitors();
  await emitStats(socket);
  socket.on("disconnect", () => store.decrementVisitors());
});

setInterval(() => emitTargets(io.of("client")), config.targetsIntervalTime);
setInterval(() => emitStats(io.of("web")), config.statsIntervalTime);

async function emitTargets(socket) {
  socket.emit("targets", { targets: TARGETS });
}

async function emitStats(socket) {
  console.log('emit stats');
  const clientsCount = await store.getClientsCount();
  const visitorsCount = await store.getVisitorsCount();
  const logs = [].concat.apply([]);

  socket.emit("stats", {
    clientsCount,
    visitorsCount,
    logs
  });
}
