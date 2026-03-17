import http from "http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/db.js";
import { env } from "./config/env.js";
import { registerBattleSocket } from "./socket/registerBattleSocket.js";

const app = createApp();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: env.clientUrl
  }
});

registerBattleSocket(io);

connectDatabase()
  .catch((error) => {
    console.error("Database connection failed, using memory mode:", error.message);
  })
  .finally(() => {
    server.listen(env.port, () => {
      console.log(`Tof's Cases server listening on http://localhost:${env.port}`);
    });
  });
