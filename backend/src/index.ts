import http from "http";
import express from "express";
import { setupWebSocket } from "./sockets/ws";
import { initRedis } from "./config/redis";
import cors from "cors";
import router from "./routes/publish";

const app = express();
app.use(express.json());
app.use(cors());
app.use("/api", router);
const server = http.createServer(app);

app.get("/", (req, res) => {
  res.send("Welcome to the Real-Time Notification Server!");
});

setupWebSocket(server);
initRedis().catch((error) => {
  console.error("Failed to initialize Redis:", error);
  process.exit(1);
});

const PORT = 3001;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
