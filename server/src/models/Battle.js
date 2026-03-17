import mongoose from "mongoose";

const battlePlayerSchema = new mongoose.Schema(
  {
    userId: String,
    username: String,
    avatar: String,
    totalValue: Number,
    drops: [
      {
        itemId: String,
        skinId: String,
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
      }
    ]
  },
  { _id: false }
);

const battleSchema = new mongoose.Schema(
  {
    roomId: { type: String, unique: true, index: true },
    caseIds: [String],
    status: String,
    maxPlayers: Number,
    players: [battlePlayerSchema],
    winnerId: String,
    winnerValue: Number
  },
  { timestamps: true }
);

export const BattleModel =
  mongoose.models.Battle || mongoose.model("Battle", battleSchema);
