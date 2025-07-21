import http from "http";
import express from "express";
import { setupWebSocket } from "./sockets/ws";
import { initRedis } from "./config/redis";
import { connectDB } from "./database/schema";
import cors from "cors";
import { config } from "dotenv";
import path from "path";
import { channelRouter } from "./routes/channelRoutes";
import { userRouter } from "./routes/userRoutes";

const envPath = path.resolve(__dirname, "../../.env");
console.log("Loading env from:", envPath); // optional: for debugging
config({ path: envPath });

const app = express();
app.use(express.json());
app.use(cors());
const router = express.Router();
router.use("/channels", channelRouter);
router.use("/users", userRouter);
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

connectDB()
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((e: Error) => {
    console.error("Failed to connect to MongoDB:", e);
    process.exit(1);
  });

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
