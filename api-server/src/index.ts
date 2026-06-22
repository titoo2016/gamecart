import http from "node:http";
import app from "./app";
import { logger } from "./lib/logger";
import { Server } from "socket.io";
import { setupSocket } from "./lib/socketHandler";

const rawPort = process.env["PORT"];

if (!rawPort) {
  throw new Error("PORT environment variable is required but was not provided.");
}

const port = Number(rawPort);

if (Number.isNaN(port) || port <= 0) {
  throw new Error(`Invalid PORT value: "${rawPort}"`);
}

const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  path: "/api/socket.io",
  cors: { origin: "*", methods: ["GET", "POST"] },
  transports: ["polling", "websocket"],
});

setupSocket(io);

httpServer.listen(port, () => {
  logger.info({ port }, "Server listening");
});
