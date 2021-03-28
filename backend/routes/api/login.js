const router = require("express").Router();
const User = require("../../models/User");
const ResHelper = require("../../helpers/ResHelper");
const AuthHelper = require("../../helpers/AuthHelper");

router.route("/").post(async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return ResHelper.fail(res, "No user found with that username");
    }
    if (await user.isValidPassword(password)) {
      const token = AuthHelper.createToken(user);
      ResHelper.success(res, { message: "Login successful!", token });
    } else {
      ResHelper.fail(res, "Wrong password");
    }
  } catch (err) {
    ResHelper.error(res, err);
  }
});

module.exports = router;
