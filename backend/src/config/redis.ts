// backend/src/config/redis.ts
import { createClient } from "redis";
import dotenv from "dotenv";

dotenv.config();

const pub = createClient({ url: process.env.REDIS_URL });
const sub = createClient({ url: process.env.REDIS_URL });

export const initRedis = async () => {
  try {
    await pub.connect();
    console.log("Publisher connected to Redis");
  } catch (error) {
    console.error("Error connecting publisher to Redis:", error);
  }

  try {
    await sub.connect();
    console.log("Subscriber connected to Redis");
  } catch (error) {
    console.error("Error connecting subscriber to Redis:", error);
  }
};

export { pub, sub };
