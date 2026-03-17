import mongoose from "mongoose";

const inventoryItemSchema = new mongoose.Schema(
  {
    itemId: String,
    skinId: String,
    crateId: String,
    name: String,
    image: String,
    rarity: {
      name: String,
      color: String
    },
    float: Number,
    wear: String,
    price: Number,
    sellPrice: Number
  },
  { _id: false }
);

const userSchema = new mongoose.Schema(
  {
    discordId: { type: String, unique: true, index: true },
    username: String,
    avatar: String,
    balance: { type: Number, default: 250 },
    totalInventoryValue: { type: Number, default: 0 },
    lastFreeCaseAt: Date,
    inventory: [inventoryItemSchema]
  },
  { timestamps: true }
);

export const UserModel = mongoose.models.User || mongoose.model("User", userSchema);
