const mongoose = require("mongoose");

const connectRequestSchema = new mongoose.Schema(
  {
    fromUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    toUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    status: {
      type: String,
      required: true,
      enum: {
        values: ["ignored", "interested", "accepted", "rejected"],
        message: "{VALUE} is an incorrect status",
      },
    },
  },
  {
    timestamps: true,
  }
);

connectRequestSchema.index({ fromUserId: 1, toUserId: 1 });

connectRequestSchema.pre("save", function (next) {
  if (this.fromUserId.equals(this.toUserId)) {
    return next(new Error("Cannot send connection request to yourself!"));
  }
  next();
});

const ConnectRequest = mongoose.model(
  "ConnectionRequest",
  connectRequestSchema
);

module.exports = ConnectRequest;
