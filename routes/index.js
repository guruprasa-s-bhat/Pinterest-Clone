var express = require("express");
var router = express.Router();
const User = require("./users");
const postModel = require("./post");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
const upload = require("./multer");
const { render } = require("ejs");

router.get("/", function (req, res, next) {
  res.render("index");
});

router.get("/login", function (req, res, next) {
  res.render("login", { error: req.flash("error") });
});

router.get("/feed", async (req, res) => {
  const posts = await postModel.find().populate("user");
  res.render("feed", { posts });
});

router.get("/upload", isLoggedIn, function (req, res, next) {
  res.render("upload");
});

router.get("/create", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({ username: req.session.passport.user });
    if (!user) {
      return res.status(404).send("User not found.");
    }
    const posts = await postModel.find({ user: user._id });
    res.render("created", { posts });
  } catch (err) {
    next(err);
  }
});

router.post("/save/:postId", isLoggedIn, async (req, res) => {
  try {
    const postId = req.params.postId;
    const userId = req.user._id;
    const user = await User.findById(userId);
    if (!user.savedPosts.includes(postId)) {
      user.savedPosts.push(postId);
      await user.save();
      res.json({ success: true });
    } else {
      res.json({ success: false, message: "Post already saved" });
    }
  } catch (err) {
    console.error("Error saving post:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/singleCard", isLoggedIn, async (req, res) => {
  try {
    const postId = req.query.id; // Get post ID from query string
    const post = await postModel.findById(postId).populate({
      path: "comment.user", // Populate user details in comments
      select: "username", // Select only necessary fields
    });

    if (!post) {
      return res.status(404).send("Post not found");
    }
    res.render("singleCard", { post });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/posts/:id", isLoggedIn, async (req, res) => {
  try {
    // Populate user details in comments
    const post = await postModel.findById(req.params.id).populate({
      path: "comment.user", // Specify the path to populate
      select: "username", // Select only the necessary fields
    });

    if (!post) {
      return res.status(404).send("Post not found");
    }
    res.render("singleCard", { post });
  } catch (err) {
    console.error(err);
    res.redirect("/");
  }
});

router.post("/posts/:id/comments", isLoggedIn, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Add the new comment
    post.comment.push({
      user: req.user._id, // Store the user ID
      text: req.body.message,
    });
    await post.save();

    // Fetch the user details
    const user = await User.findById(req.user._id);
    res.json({
      comment: req.body.message,
      username: user.username, // Send the username
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

router.get("/saved", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).populate("savedPosts");
    res.render("saved", { posts: user.savedPosts });
  } catch (err) {
    console.error("Error fetching saved posts:", err);
    res.redirect("/profile");
  }
});

router.post(
  "/upload",
  isLoggedIn,
  upload.single("file"),
  async (req, res, next) => {
    if (!req.file) {
      return res.status(400).send({ message: "No file uploaded." });
    }

    try {
      const user = await User.findOne({ username: req.session.passport.user });
      const post = await postModel.create({
        image: req.file.filename,
        postText: req.body.filecaption,
        description: req.body.description,
        user: user._id,
      });
      user.posts.push(post._id);
      await user.save();
      res.redirect("profile");
    } catch (err) {
      next(err);
    }
  }
);

router.post(
  "/update-profile-picture",
  isLoggedIn,
  upload.single("dp"),
  async (req, res) => {
    try {
      const user = await User.findOne({ username: req.session.passport.user });
      if (!user) {
        return res.status(404).send("User not found.");
      }

      user.dp = req.file.filename; // Update dp field with the new file name
      await user.save();

      res.redirect("/profile");
    } catch (err) {
      console.error(err);
      res.status(500).send("Server error.");
    }
  }
);

router.get("/profile", isLoggedIn, async (req, res, next) => {
  try {
    const user = await User.findOne({
      username: req.session.passport.user,
    }).populate("posts");
    res.render("profile", { user });
  } catch (err) {
    next(err);
  }
});

router.post("/register", async (req, res) => {
  let { username, fullname, email, password } = req.body;

  try {
    const newUser = new User({
      username,
      fullname,
      email,
    });

    User.register(newUser, password, function (err, user) {
      if (err) {
        console.error("Registration error: ", err);
        return res.redirect("/");
      }

      passport.authenticate("local")(req, res, function () {
        res.redirect("/profile");
      });
    });
  } catch (err) {
    console.error("Error in registration route: ", err);
    res.redirect("/");
  }
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/login",
    failureFlash: true,
  })
);

router.get("/logout", (req, res, next) => {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

router.get("/edit", isLoggedIn, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.render("edit", { user });
  } catch (err) {
    console.error("Error fetching user data for edit:", err);
    res.redirect("/profile");
  }
});

router.post("/edit", isLoggedIn, async (req, res) => {
  const { fullname, tagline, description } = req.body;
  try {
    const userId = req.user._id;
    const updateUser = await User.findByIdAndUpdate(
      userId,
      {
        fullname,
        tagline,
        description,
      },
      { new: true }
    );
    res.redirect("/profile");
  } catch (error) {
    console.error("Error updating profile:", error);
    res.redirect("/edit");
  }
});

function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/login");
}

module.exports = router;
