import { User, Channel } from "../database/schema";
import mongoose from "mongoose";
import { Router, Request, Response } from "express";
import bcrypt from "bcryptjs"; // For password hashing
//import jwt from "jsonwebtoken"; // For JWT token generation

const userRouter = Router();

interface User {
  id: string;
  username: string;
  email: string;
  password: string;
}

//functions instead of controllers routes down below
const signUp = async (
  username: string,
  password: string,
  email: string
): Promise<User> => {
  // Check if user already exists
  const existingUser = await User.findOne({ $or: [{ username }, { email }] });
  if (existingUser) throw new Error("User already exists");

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = await User.create({
    username,
    email,
    password: hashedPassword,
    published: [],
    subscriptions: [],
  });

  return {
    id: user.id.toString(),
    username: user.username,
    email: user.email,
    password: user.password,
  };
};

const signIn = async (email: string, password: string): Promise<boolean> => {
  try {
    const user = await User.findOne({ email });
    if (!user) {
      console.error("User not found");
      return false;
    }
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch;
  } catch (error) {
    console.error(error);
    return false;
  }
};

const update = async (
  userId: string,
  updates: Partial<{ username: string; email: string; password: string }>
) => {
  if (updates.password) {
    updates.password = await bcrypt.hash(updates.password, 10);
  }
  const updatedUser = await User.findByIdAndUpdate(userId, updates, {
    new: true,
  });
  return updatedUser;
};

//update both tables
export const updatePublish = async (userId: string, channelId: string) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Add channel to user's published list
    await User.findByIdAndUpdate(
      userId,
      { $addToSet: { published: channelId } },
      { session }
    );

    // Set user as publisher in the channel
    await Channel.findByIdAndUpdate(
      channelId,
      { publisher: userId },
      { session }
    );

    await session.commitTransaction();
    session.endSession();
    return { success: true, message: "Publisher updated successfully." };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return {
      success: false,
      message: "Transaction reverted: update failed.",
      error,
    };
  }
};

//update both tables
export const updateSubscribers = async (userId: string, channelId: string) => {
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
    session.endSession();
    return { success: true, message: "Subscription updated successfully." };
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    return {
      success: false,
      message: "Transaction reverted: update failed.",
      error,
    };
  }
};

/** Routes here */
userRouter.post("/signup", async (req: Request, res: Response) => {
  const { username, password, email } = req.body;
  try {
    const user = await signUp(username, password, email);
    res.status(201).json(user);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

userRouter.post("/signin", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  try {
    const isValid = await signIn(email, password);
    if (isValid) {
      res.status(200).json({ message: "Sign in successful" });
    } else {
      res.status(401).json({ error: "Invalid email or password" });
    }
  } catch (error) {
    res.status(500).json({ error: (error as Error).message });
  }
});

userRouter.put("/update", async (req: Request, res: Response) => {
  const { userId, updates } = req.body;
  try {
    const updatedUser = await update(userId, updates);
    res.status(200).json(updatedUser);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});

userRouter.get("/getUser/:id", async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    //populate the published and subscriptions fields
    if (!mongoose.Types.ObjectId.isValid(id)) {
      res.status(400).json({ error: "Invalid user ID" });
      return;
    }
    const user = await User.findById(id).populate("published subscriptions");
    res.status(200).json(user);
  } catch (error) {
    res.status(400).json({ error: (error as Error).message });
  }
});
