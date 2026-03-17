import mongoose from "mongoose";
import { env } from "./env.js";

let connected = false;

export async function connectDatabase() {
  if (!env.mongoUri) {
    return false;
  }

  if (connected) {
    return true;
  }

  await mongoose.connect(env.mongoUri);
  connected = true;
  return true;
}

export function isDatabaseConnected() {
  return connected && mongoose.connection.readyState === 1;
}
