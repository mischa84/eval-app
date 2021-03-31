const router = require("express").Router();
const User = require("../../models/User");
const ResHelper = require("../../helpers/ResHelper");
const AuthHelper = require("../../helpers/AuthHelper");

router.route("/").post(async (req, res) => {
  const { username, password, groups } = req.body;

  // Validation
  if (!username) {
    return ResHelper.fail(res, "Username is required");
  }
  if (!password || !AuthHelper.validPassword(password)) {
    return ResHelper.fail(res, "Password must be at least 6 characters");
  }
  // Check user exists
  const users = User.find({ username });
  if (users.length) {
    return ResHelper.fail(res, "An account with this username already exists");
  }
  // Save user
  try {
    const newUser = User({ username, password, groups });
    const savedUser = await newUser.save();
    const token = AuthHelper.createToken(savedUser);
    ResHelper.success(
      res,
      {
        message: "Registration successful!",
        token,
      },
      201
    );
  } catch (err) {
    ResHelper.error(res, err);
  }
});

module.exports = router;
