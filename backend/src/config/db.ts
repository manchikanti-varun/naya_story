import mongoose from "mongoose";

export async function connectDb(uri: string) {
  mongoose.set("strictQuery", true);

  mongoose.connection.on("error", (err) => {
    console.error("[DB] Connection error:", err.message);
  });

  mongoose.connection.on("disconnected", () => {
    console.warn("[DB] Disconnected from MongoDB");
  });

  mongoose.connection.on("reconnected", () => {
    console.log("[DB] Reconnected to MongoDB");
  });

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  console.log("[DB] Connected to MongoDB");
}
