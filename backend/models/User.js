const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      unique: true,
      required: true,
    },
    password: {
      type: String,
      required: true,
      minLength: 6,
    },
    groups: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

UserSchema.pre("save", async function (next) {
  let user = this;
  if (this.isModified("password") || this.isNew) {
    const saltRounds = 12;
    try {
      const hashed_password = await bcrypt.hash(user.password, saltRounds);
      user.password = hashed_password;
      next();
    } catch (error) {
      next(error);
    }
  }
});
//TODO change to Promise
UserSchema.methods.isValidPassword = function (newPassword) {
  return bcrypt.compareSync(newPassword, this.password);
};

module.exports = mongoose.model("User", UserSchema);
