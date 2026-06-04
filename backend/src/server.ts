import http from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await connectDatabase();

  const app = createApp();
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.emit("connected", { socketId: socket.id });
  });

  httpServer.listen(env.PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${env.PORT}`);
  });
}

void bootstrap().catch((error) => {
  console.error("Failed to start API", error);
  process.exit(1);
});
