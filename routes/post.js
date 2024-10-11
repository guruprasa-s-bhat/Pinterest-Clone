const mongoose = require("mongoose");

const postSchema = new mongoose.Schema({
  postText: {
    type: String,
    required: true,
  },
  description: {
    type: String,
  },
  image: {
    type: String,
    required: true,
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  createdDate: {
    type: Date,
    default: Date.now,
  },
  like: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
  ],
  comment: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // User ID
      text: String, // Comment text
      createdAt: { type: Date, default: Date.now }, // Timestamp for the comment
    },
  ],
});

module.exports = mongoose.model("Post", postSchema);
