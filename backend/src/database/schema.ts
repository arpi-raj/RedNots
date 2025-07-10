import mongoose from "mongoose";
import { config } from "dotenv";
import path from "path";

const envPath = path.resolve(__dirname, "../../../.env");
console.log("Loading env from:", envPath); // optional: for debugging
config({ path: envPath });

const dburi: string =
  process.env.MONGO_URI || "mongodb://localhost:27017/real-notif";
// Database connection
export const connectDB = async (): Promise<void> => {
  try {
    console.log(dburi);
    await mongoose.connect(dburi);
    console.log("MongoDB connected successfully");
  } catch (error) {
    console.error("MongoDB connection failed:", error);
    process.exit(1);
  }
};

// User schema
const userSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    index: true,
    default: function (this: any) {
      return this._id;
    },
  },
  username: {
    type: String,
    required: true,
    unique: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  published: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
    },
  ],
  subscriptions: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Channel",
    },
  ],
});

const channelSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    index: true,
    default: function (this: any) {
      return this._id;
    },
  },
  name: {
    type: String,
    required: true,
    unique: true,
  },
  description: {
    type: String,
    required: true,
  },
  news: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "News",
    },
  ],
  image: {
    type: String,
    default: "https://via.placeholder.com/150",
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  subscribers: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
});

const newsSchema = new mongoose.Schema({
  id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "News",
    index: true,
    default: function (this: any) {
      return this._id;
    },
  },
  title: {
    type: String,
    required: true,
  },
  content: {
    type: String,
    required: true,
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Channel",
    required: true,
  },
  publishedAt: {
    type: Date,
    default: Date.now,
  },
});

export const User = mongoose.model("User", userSchema);
export const Channel = mongoose.model("Channel", channelSchema);
export const News = mongoose.model("News", newsSchema);
