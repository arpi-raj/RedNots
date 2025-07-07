import { User, Channel } from "../database/schema";
import mongoose from "mongoose";
import { Router, Request, Response } from "express";
import { updatePublish } from "./userRoutes";

const channelRouter = Router();

interface Channel {
  id: string;
  name: string;
  description: string;
  owner: string;
  news?: string[];
  images?: string[];
  subscribers?: string[];
}

// Functions instead of controllers routes down below
const createChannel = async (
  name: string,
  description: string,
  owner: string
): Promise<Channel> => {
  const channel = await Channel.create({
    name,
    description,
    owner: new mongoose.Types.ObjectId(owner),
  });

  return {
    id: channel.id.toString(),
    name: channel.name,
    description: channel.description,
    owner: channel.owner.toString(),
  };
};

const getChannel = async (channelId: string): Promise<Channel | null> => {
  const channel = await Channel.findById(channelId);
  if (!channel) return null;

  return {
    id: channel.id.toString(),
    name: channel.name,
    description: channel.description,
    owner: channel.owner.toString(),
    news: channel.news.map((newsId) => newsId.toString()),
  };
};

const updateChannel = async (
  channelId: string,
  name?: string,
  description?: string
): Promise<Channel | null> => {
  const updateData: any = {};
  if (name) updateData.name = name;
  if (description) updateData.description = description;

  const channel = await Channel.findByIdAndUpdate(channelId, updateData, {
    new: true,
  });

  if (!channel) return null;

  return {
    id: channel.id.toString(),
    name: channel.name,
    description: channel.description,
    owner: channel.owner.toString(),
    news: channel.news.map((newsId) => newsId.toString()),
  };
};

const deleteChannel = async (channelId: string): Promise<boolean> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const channel = await Channel.findByIdAndDelete(channelId).session(session);
    if (!channel) throw new Error("Channel not found");

    // Update user's published channels
    await updatePublish(channel.owner.toString(), channelId);

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return false;
  } finally {
    session.endSession();
  }
};

const subscribeToChannel = async (
  userId: string, 
  channelId: string
): Promise<boolean> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Add channel to user's subscriptions
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { subscriptions: channelId } },
      { session }
    );

    // Add user to channel's subscribers
    await Channel.findByIdAndUpdate(
      channelId,
      { $addToSet: { subscribers: userId } },
      { session }
    );

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return false;
  } finally {
    session.endSession();
  }
};

const unsubscribeFromChannel = async (
  userId: string, 
  channelId: string
): Promise<boolean> => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Remove channel from user's subscriptions
    await User.findByIdAndUpdate(
      userId,
      { $pull: { subscriptions: channelId } },
      { session }
    );

    // Remove user from channel's subscribers
    await Channel.findByIdAndUpdate(
      channelId,
      { $pull: { subscribers: userId } },
      { session }
    );

    await session.commitTransaction();
    return true;
  } catch (error) {
    await session.abortTransaction();
    console.error(error);
    return false;
  } finally {
    session.endSession();
  }
};

