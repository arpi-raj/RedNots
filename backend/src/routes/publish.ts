import express from "express";
import { pub } from "../config/redis";

const router = express.Router();

router.put("/create", async (req, res) => {
  const { channel } = req.body;
  if (!channel) {
    res.status(400).json({ error: "Channel name is required." });
    return;
  }
  try {
    // Redis does not require explicit channel creation, but we can acknowledge the request
    // by publishing an empty message to the channel.
    const id =
      Date.now().toString(36) + Math.random().toString(36).substring(2, 15);
    await pub.set(`channel:${id}`, channel);
    await pub.publish(channel, "");
    res.json({ status: "channel created", channel, channelId: id });
  } catch (error) {
    console.error("Redis create channel error:", error);
    res.status(500).json({ error: "Failed to create channel." });
  }
});

router.delete("/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).json({ error: "Channel ID is required." });
    return;
  }
  try {
    // In Redis, we can delete a channel by removing its key.
    await pub.del(`channel:${id}`);
    res.json({ status: "channel deleted", channelId: id });
  } catch (error) {
    console.error("Redis delete channel error:", error);
    res.status(500).json({ error: "Failed to delete channel." });
  }
});

router.post("/publish", async (req, res) => {
  const { id, message } = req.body;
  if (!id || !message) {
    res.status(400).json({ error: "Channel ID and message are required." });
  }

  const channel = `channel:${id}`;
  if (!channel) {
    res.status(400).json({ error: "Channel does not exist." });
    return;
  }
  try {
    await pub.publish(channel, message);
    res.json({ status: "published", channel, message });
  } catch (error) {
    console.error("Redis publish error:", error);
    res.status(500).json({ error: "Failed to publish message." });
  }
});

export default router;
