const mongoose = require("mongoose");
const plm = require("passport-local-mongoose");

mongoose.connect("mongodb://127.0.0.1:27017/pinterest");

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
    },
    savedPosts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    description: {
      type: String,
    },
    tagline: {
      type: String,
    },
    posts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Post",
      },
    ],
    dp: {
      type: String,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    fullname: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

userSchema.plugin(plm);

const User = mongoose.model("User", userSchema);

module.exports = User;
