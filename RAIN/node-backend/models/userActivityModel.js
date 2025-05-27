const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userActivitySchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  visited: [
    {
      landmark: {
        type: Schema.Types.ObjectId,
        ref: "landmark",
        required: true,
      },
      visitedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

module.exports = mongoose.model("userActivity", userActivitySchema);
