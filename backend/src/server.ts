import http from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app.js";
import { connectDatabase } from "./config/database.js";
import { env } from "./config/env.js";

const PORT = Number(process.env.PORT) || env.PORT || 5000;

async function connectDatabaseSafely() {
  try {
    await connectDatabase();
    console.log("MongoDB connected");
  } catch (error) {
    console.error("MongoDB connection failed. Server is still running so deployment health checks can pass.", error);
  }
}

function bootstrap() {
  const app = createApp();
  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`EngineerConnect AI backend running on port ${PORT}`);
  });

  const io = new Server(httpServer as http.Server, {
    cors: {
      origin: env.CLIENT_ORIGIN,
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    socket.emit("connected", { socketId: socket.id });
  });

  void connectDatabaseSafely();
}

try {
  bootstrap();
} catch (error) {
  console.error("Failed to start API", error);
  process.exit(1);
}
