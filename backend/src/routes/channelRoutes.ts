import express from "express";
import { pub } from "../config/redis";
import {
  createChannel,
  deleteChannel,
  getChannel,
  updateChannel,
  subscribeToChannel,
  unsubscribeFromChannel,
} from "./channelFunctions";

export const channelRouter = express.Router();

interface channel {
  name: string;
  description: string;
  owner: string;
}

interface message {
  news: string;
  title: string;
  description: string;
}

channelRouter.put("/create", async (req, res) => {
  const { channel }: { channel: channel } = req.body;
  console.log("Creating channel:", channel);
  if (!channel) {
    res.status(400).json({ error: "Channel name is required." });
    return;
  }
  try {
    // not store in resis persited db
    const id = await createChannel(
      channel.name,
      channel.description,
      channel.owner
    );
    // Store the channel in Redis for quick access
    await pub.set(`channel:${id}`, JSON.stringify(channel));
    res.json({ status: "channel created", channelId: id, channel });
  } catch (error) {
    console.error("Failed to store in Db", error);
    res.status(500).json({ error: "Failed to create channel." });
    return;
  }
});

channelRouter.delete("/delete", async (req, res) => {
  const { id } = req.body;
  if (!id) {
    res.status(400).json({ error: "Channel ID is required." });
    return;
  }
  try {
    // Remove the channel from Redis
    // This will delete the channel from Redis cache
    await pub.del(`channel:${id}`);
    // Also delete the channel from the database
    const deleted = await deleteChannel(id);
    if (!deleted) {
      res.status(404).json({ error: "Channel not found." });
      return;
    }
    res.json({ status: "channel deleted", channelId: id });
  } catch (error) {
    console.error("DB error:", error);
    res.status(500).json({ error: "Failed to delete channel." });
  }
});

channelRouter.post("/publish/:id", async (req, res) => {
  const channelID: string = req.params.id;
  const { message }: { message: message } = req.body;
  if (!channelID || !message) {
    res.status(400).json({ error: "Channel ID and message are required." });
    return;
  }
  try {
    await pub.publish(channelID, JSON.stringify(message));
    res.json({ status: "published", channelID, message });
  } catch (error) {
    console.error("Redis publish error:", error);
    res.status(500).json({ error: "Failed to publish message." });
  }
});

channelRouter.get("/channel/:id", async (req, res) => {
  const channelID: string = req.params.id;
  if (!channelID) {
    res.status(400).json({ error: "Channel ID is required." });
    return;
  }
  try {
    // Check Redis first
    const cachedChannel = await pub.get(`channel:${channelID}`);
    if (cachedChannel) {
      res.json(JSON.parse(cachedChannel));
      return;
    }
    // If not found in Redis, fetch from database
    const channel = await getChannel(channelID);
    if (!channel) {
      res.status(404).json({ error: "Channel not found." });
      return;
    }
    res.json(channel);
  } catch (error) {
    console.error("Error fetching channel:", error);
    res.status(500).json({ error: "Failed to fetch channel." });
  }
});

channelRouter.put("/update/:id", async (req, res) => {
  const channelID: string = req.params.id;
  const { name, description }: { name?: string; description?: string } =
    req.body;
  if (!channelID) {
    res.status(400).json({ error: "Channel ID is required." });
    return;
  }
  try {
    const updatedChannel = await updateChannel(channelID, name, description);
    if (!updatedChannel) {
      res.status(404).json({ error: "Channel not found." });
      return;
    }
    // Update the channel in Redis
    await pub.set(`channel:${channelID}`, JSON.stringify(updatedChannel));
    res.json({ status: "channel updated", channel: updatedChannel });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ error: "Failed to update channel." });
  }
});

channelRouter.post("/subscribe", async (req, res) => {
  const { channelId, userId } = req.body;
  if (!channelId || !userId) {
    res.status(400).json({ error: "Channel ID and user ID are required." });
    return;
  }
  try {
    // Check if the channel exists
    const channel = await getChannel(channelId);
    if (!channel) {
      res.status(404).json({ error: "Channel not found." });
      return;
    }
    // Subscribe the user to the channel
    const result = await subscribeToChannel(userId, channelId);
    //console.log("Subscription result:", result);
    if (!result) {
      res.status(404).json({ error: "Failed to subscribe to channel." });
      return;
    }
    // redis update
    await pub.sAdd(`subscribers:${channelId}`, userId); // what does this line does
    if (result == true) {
      res.json({ status: "subscribed", channelId, userId });
    } else {
      res.status(404).json({ error: "Channel not found." });
    }
  } catch (error) {
    console.error("Subscription error:", error);
    res.status(500).json({ error: "Failed to subscribe to channel." });
  }
});

channelRouter.post("/unsubscribe", async (req, res) => {
  const { channelId, userId } = req.body;
  if (!channelId || !userId) {
    res.status(400).json({ error: "Channel ID and user ID are required." });
    return;
  }
  try {
    // Unsubscribe the user from the channel
    const result = await unsubscribeFromChannel(channelId, userId);

    // redis update
    await pub.sRem(`subscribers:${channelId}`, userId);
    if (result) {
      res.json({ status: "unsubscribed", channelId, userId });
    } else {
      res.status(404).json({ error: "Channel not found." });
    }
  } catch (error) {
    console.error("Unsubscription error:", error);
    res.status(500).json({ error: "Failed to unsubscribe from channel." });
  }
});

export default channelRouter;
